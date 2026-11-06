/* gstr1-app.js — UI-обвязка инструмента «GSTR-1 JSON -> Excel».
 *
 * Вся логика раскладки живёт в js/gstr1-core.js (тестируется в node без DOM).
 * Здесь только: приём файлов (.json / .zip), чтение, показ сводки, сборка книги
 * через SheetJS и скачивание. Ни одного сетевого запроса, кроме счётчика.
 *
 * Файл обязан выживать на странице без виджета: обёрнут в IIFE с ранним выходом,
 * иначе первая же строка на отсутствующем элементе убивает всё после себя.
 */
(function () {
    'use strict';

    var mount = document.getElementById('gstr1Tool');
    if (!mount) return;

    var G = window.CSVtoJSONGstr1;
    var M = window.CSVtoJSONMetrics || null;
    var track = function (ev, extra) { try { if (M) M.track(ev, { extra: extra }); } catch (e) {} };

    var el = function (id) { return document.getElementById(id); };
    var state = { files: [], sheetSets: [], merged: null, meta: null, busy: false };

    function fmtSize(bytes) {
        if (!bytes && bytes !== 0) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function show(node, on) {
        if (node) node.style.display = on ? '' : 'none';
    }

    function setStatus(text, kind) {
        var box = el('statusBox');
        if (!box) return;
        if (!text) { show(box, false); box.textContent = ''; return; }
        box.textContent = text;
        box.className = 'status-box ' + (kind || 'info');
        show(box, true);
    }

    /* ── чтение файлов ───────────────────────────────────────────────── */

    function readAsText(file) {
        return new Promise(function (resolve, reject) {
            var r = new FileReader();
            r.onload = function () { resolve(String(r.result || '')); };
            r.onerror = function () { reject(new Error('Could not read ' + file.name)); };
            r.readAsText(file, 'utf-8');
        });
    }

    function readAsArrayBuffer(file) {
        return new Promise(function (resolve, reject) {
            var r = new FileReader();
            r.onload = function () { resolve(r.result); };
            r.onerror = function () { reject(new Error('Could not read ' + file.name)); };
            r.readAsArrayBuffer(file);
        });
    }

    function parseJsonText(text, name) {
        var clean = String(text || '').replace(/^\uFEFF/, '').trim();
        if (!clean) throw new Error(name + ': file is empty');
        try {
            return JSON.parse(clean);
        } catch (e) {
            throw new Error(name + ': not valid JSON (' + e.message.slice(0, 80) + ')');
        }
    }

    /* ZIP от портала: внутри может быть несколько JSON (месяцы, разделы). */
    function readZip(file) {
        if (typeof JSZip === 'undefined') return Promise.reject(new Error('ZIP support not loaded'));
        return readAsArrayBuffer(file).then(function (buf) {
            return JSZip.loadAsync(buf);
        }).then(function (zip) {
            var names = [];
            zip.forEach(function (path, entry) {
                if (entry.dir) return;
                if (/\.json$/i.test(path)) names.push(path);
            });
            if (!names.length) throw new Error(file.name + ': no .json files inside the ZIP');
            return Promise.all(names.map(function (path) {
                return zip.file(path).async('string').then(function (text) {
                    return { name: path.split('/').pop(), json: parseJsonText(text, path) };
                });
            }));
        });
    }

    /* Файл -> массив {name, json}: json-файл даёт один элемент, zip — несколько. */
    function readFile(file) {
        var name = String(file.name || 'file');
        if (/\.zip$/i.test(name) || /zip/i.test(file.type || '')) return readZip(file);
        return readAsText(file).then(function (text) {
            return [{ name: name, json: parseJsonText(text, name) }];
        });
    }

    /* ── разбор и отрисовка ──────────────────────────────────────────── */

    function rebuild() {
        state.sheetSets = [];
        state.merged = null;
        state.meta = null;
        var problems = [];

        state.files.forEach(function (entry) {
            (entry.parsed || []).forEach(function (item) {
                try {
                    var sheets = G.toSheets(item.json);
                    state.sheetSets.push({ name: item.name, sheets: sheets });
                    if (!state.meta) state.meta = G.fileMeta(item.json);
                } catch (e) {
                    problems.push(item.name + ': ' + e.message);
                }
            });
        });

        if (state.sheetSets.length) {
            state.merged = state.sheetSets.length > 1
                ? G.mergeSheets(state.sheetSets.map(function (s) { return s.sheets; }))
                : state.sheetSets[0].sheets;
        }

        renderFiles();
        renderSummary();
        if (problems.length) setStatus(problems.join(' · '), 'error');
        else if (state.sheetSets.length) setStatus('', null);
    }

    function renderFiles() {
        var list = el('fileList');
        if (!list) return;
        list.innerHTML = '';
        state.files.forEach(function (entry, index) {
            var row = document.createElement('div');
            row.className = 'file-item';
            row.innerHTML = '<span class="file-item-icon">🗂</span>' +
                '<span class="file-item-name"></span>' +
                '<span class="file-item-size"></span>' +
                '<button class="file-item-remove" type="button" title="Remove">✕</button>';
            row.querySelector('.file-item-name').textContent = entry.name;
            var n = (entry.parsed || []).length;
            row.querySelector('.file-item-size').textContent =
                fmtSize(entry.size) + (n > 1 ? ' · ' + n + ' JSON' : '');
            row.querySelector('.file-item-remove').addEventListener('click', function () {
                state.files.splice(index, 1);
                rebuild();
            });
            list.appendChild(row);
        });
        var count = el('fileCount');
        if (count) count.textContent = String(state.files.length);
        show(el('fileListSection'), state.files.length > 0);
        if (!state.files.length) {
            show(el('outputSection'), false);
            setStatus('', null);
        }
    }

    function renderSummary() {
        var out = el('outputSection');
        if (!out) return;
        if (!state.merged) { show(out, false); return; }

        var meta = el('metaBox');
        if (meta) {
            var m = state.meta || { gstin: '', period: '', version: '' };
            var bits = [];
            if (m.gstin) bits.push('GSTIN ' + m.gstin);
            if (m.period) bits.push(m.period);
            if (m.version) bits.push('schema ' + m.version);
            meta.textContent = bits.join(' · ');
            show(meta, bits.length > 0);
        }

        var summarySheet = state.merged.filter(function (s) { return s.name === 'Summary'; })[0];
        var table = el('summaryTable');
        if (table && summarySheet) {
            table.innerHTML = '';
            summarySheet.rows.forEach(function (row, i) {
                var tr = document.createElement('tr');
                row.forEach(function (cell) {
                    var td = document.createElement(i === 0 ? 'th' : 'td');
                    td.textContent = cell === null || cell === undefined ? '' : String(cell);
                    tr.appendChild(td);
                });
                if (i === summarySheet.rows.length - 1) tr.className = 'row-total';
                table.appendChild(tr);
            });
        }

        var sheetsInfo = el('sheetsInfo');
        if (sheetsInfo) {
            var names = state.merged.map(function (s) { return s.name + ' (' + (s.rows.length - 1) + ')'; });
            sheetsInfo.textContent = 'Sheets: ' + names.join(' · ');
        }
        show(out, true);
    }

    /* ── книга Excel ─────────────────────────────────────────────────── */

    function buildWorkbook(sheets) {
        var wb = XLSX.utils.book_new();
        sheets.forEach(function (sheet) {
            var ws = XLSX.utils.aoa_to_sheet(sheet.rows);
            // ширины колонок: без них книга открывается с ### в числовых колонках
            var widths = (sheet.rows[0] || []).map(function (h, i) {
                var longest = String(h || '').length;
                sheet.rows.slice(1, 40).forEach(function (r) {
                    var v = r[i];
                    var len = v === null || v === undefined ? 0 : String(v).length;
                    if (len > longest) longest = len;
                });
                return { wch: Math.min(Math.max(longest + 2, 10), 34) };
            });
            ws['!cols'] = widths;
            if (sheet.rows.length > 1) ws['!freeze'] = { xSplit: 0, ySplit: 1 };
            XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
        });
        return wb;
    }

    function download() {
        if (!state.merged) return;
        var meta = state.meta || {};
        var base = 'gstr1';
        if (meta.gstin) base += '-' + meta.gstin;
        if (meta.period) base += '-' + meta.period.replace(/\s+/g, '-');
        else base += '-export';
        var wb = buildWorkbook(state.merged);
        XLSX.writeFile(wb, base + '.xlsx');
        track('download_click', { type: 'xlsx' });
        setStatus('Downloaded ' + base + '.xlsx — ' + state.merged.length + ' sheets.', 'ok');
    }

    /* ── приём файлов ────────────────────────────────────────────────── */

    function addFiles(fileList) {
        var files = Array.prototype.slice.call(fileList || []);
        if (!files.length) return;
        setStatus('Reading ' + files.length + ' file(s)…', 'info');
        var jobs = files.map(function (file) {
            return readFile(file).then(function (parsed) {
                return { name: file.name, size: file.size, parsed: parsed };
            }).catch(function (e) {
                return { name: file.name, size: file.size, parsed: [], error: e.message };
            });
        });
        Promise.all(jobs).then(function (results) {
            var errors = [];
            results.forEach(function (r) {
                if (r.error) { errors.push(r.error); return; }
                state.files.push(r);
            });
            track('file_loaded', { type: (files[0].name.split('.').pop() || '').slice(0, 8) });
            rebuild();
            if (errors.length) setStatus(errors.join(' · '), 'error');
        });
    }

    /* ── события ─────────────────────────────────────────────────────── */

    var zone = el('dropZone');
    var input = el('fileInput');
    if (zone && input) {
        zone.addEventListener('click', function () { input.click(); });
        input.addEventListener('change', function () {
            addFiles(input.files);
            input.value = '';
        });
        ['dragenter', 'dragover'].forEach(function (ev) {
            zone.addEventListener(ev, function (e) {
                e.preventDefault();
                zone.classList.add('drop-zone-active');
            });
        });
        ['dragleave', 'drop'].forEach(function (ev) {
            zone.addEventListener(ev, function (e) {
                e.preventDefault();
                zone.classList.remove('drop-zone-active');
            });
        });
        zone.addEventListener('drop', function (e) {
            if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
        });
    }

    var clearBtn = el('clearAllBtn');
    if (clearBtn) clearBtn.addEventListener('click', function () {
        state.files = [];
        state.sheetSets = [];
        state.merged = null;
        rebuild();
    });

    var dlBtn = el('downloadBtn');
    if (dlBtn) dlBtn.addEventListener('click', function () {
        track('convert_click', { type: 'xlsx' });
        download();
    });

    track('page_view');

    // для E2E: подтверждение, что модуль поднялся
    window.__gstr1App = { ready: true, files: function () { return state.files.length; }, sheets: function () { return state.merged ? state.merged.length : 0; } };
})();
