/* ═══════════════════════════════════════════════
   CSV to JSON Converter — app.js
   Day 1: Drag & Drop, File Picker, CSV Preview, Toast
   Day 2+: PapaParse, conversion, nested mapping, batch
   ═══════════════════════════════════════════════ */

// ─── DOM Elements ───
const els = {
    dropZone:       document.getElementById('dropZone'),
    fileInput:      document.getElementById('fileInput'),
    fileListSection:document.getElementById('fileListSection'),
    fileList:       document.getElementById('fileList'),
    fileCount:      document.getElementById('fileCount'),
    clearAllBtn:    document.getElementById('clearAllBtn'),
    settingsPanel:  document.getElementById('settingsPanel'),
    previewSection: document.getElementById('previewSection'),
    previewTable:    document.getElementById('previewTable'),
    previewCount:   document.getElementById('previewCount'),
    convertAction:  document.getElementById('convertAction'),
    convertBtn:     document.getElementById('convertBtn'),
    counter:        document.getElementById('counter'),
    outputSection:  document.getElementById('outputSection'),
    jsonOutput:     document.getElementById('jsonOutput'),
    copyBtn:        document.getElementById('copyBtn'),
    downloadBtn:    document.getElementById('downloadBtn'),
    // Progress
    progressSection:document.getElementById('progressSection'),
    progressFill:   document.getElementById('progressFill'),
    progressText:   document.getElementById('progressText'),
    // Batch
    batchControls:  document.getElementById('batchControls'),
    batchMode:      document.getElementById('batchMode'),
    downloadZipBtn: document.getElementById('downloadZipBtn'),
    // Settings
    delimiter:      document.getElementById('delimiter'),
    headerRow:      document.getElementById('headerRow'),
    typeDetection:  document.getElementById('typeDetection'),
    nestedMapping:  document.getElementById('nestedMapping'),
    quoteHandling:  document.getElementById('quoteHandling'),
    skipEmpty:      document.getElementById('skipEmpty'),
    // Paywall
    paywallModal:   document.getElementById('paywallModal'),
    paywallClose:   document.getElementById('paywallClose'),
    // Toast
    toastContainer: document.getElementById('toastContainer'),
};

// ─── State ───
let files = [];           // Array of { file, name, size, parsed, data }
let conversionsUsed = parseInt(localStorage.getItem('csvtojson_used') || '0');
const MAX_FREE = 5;
const STORAGE_KEY_USED = 'csvtojson_used';
const STORAGE_KEY_UNLOCKED = 'csvtojson_unlocked';

// Column types: { columnName: 'auto' | 'string' | 'number' | 'boolean' | 'null' }
let columnTypes = {};

// JSON paths: { columnName: 'dot.notation.path' } — for nested mapping
let jsonPaths = {};

// ─── Helpers ───
function isUnlocked() {
    return localStorage.getItem(STORAGE_KEY_UNLOCKED) === 'true';
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = '') {
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ─── Drag & Drop ───
els.dropZone.addEventListener('click', () => els.fileInput.click());

els.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropZone.classList.add('dragover');
});

els.dropZone.addEventListener('dragleave', () => {
    els.dropZone.classList.remove('dragover');
});

els.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

els.fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // reset for re-upload
});

// ─── File Handling ───
function handleFiles(fileList) {
    const csvFiles = Array.from(fileList).filter(f =>
        f.name.endsWith('.csv') || f.name.endsWith('.txt') || f.name.endsWith('.tsv') || f.type === 'text/csv'
    );

    if (csvFiles.length === 0) {
        showToast('Please drop CSV files only', 'error');
        return;
    }

    csvFiles.forEach(f => {
        files.push({
            file: f,
            name: f.name,
            size: f.size,
            parsed: null,
            data: null
        });
    });

    renderFileList();
    showToast(`Loaded ${csvFiles.length} file${csvFiles.length > 1 ? 's' : ''}`, 'success');

    // Parse first file for preview
    if (files.length > 0) {
        parseForPreview(files[0]);
    }
}

// ─── File List Rendering ───
function renderFileList() {
    if (files.length === 0) {
        els.fileListSection.style.display = 'none';
        els.settingsPanel.style.display = 'none';
        els.previewSection.style.display = 'none';
        els.convertAction.style.display = 'none';
        return;
    }

    els.fileListSection.style.display = 'block';
    els.fileCount.textContent = files.length;

    // Show batch controls if >1 file
    if (files.length > 1) {
        els.batchControls.style.display = 'block';
    } else {
        els.batchControls.style.display = 'none';
    }

    els.fileList.innerHTML = files.map((f, i) => `
        <div class="file-item">
            <span class="file-item-icon">📄</span>
            <span class="file-item-name">${escapeHtml(f.name)}</span>
            <span class="file-item-size">${formatSize(f.size)}</span>
            <button class="file-item-remove" data-index="${i}">✕</button>
        </div>
    `).join('');

    // Remove buttons
    els.fileList.querySelectorAll('.file-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            files.splice(idx, 1);
            renderFileList();
            if (files.length > 0) {
                parseForPreview(files[0]);
            } else {
                els.previewSection.style.display = 'none';
                els.settingsPanel.style.display = 'none';
                els.convertAction.style.display = 'none';
            }
        });
    });
}

// ─── Clear All ───
els.clearAllBtn.addEventListener('click', () => {
    files = [];
    batchResults = [];
    renderFileList();
    els.previewSection.style.display = 'none';
    els.settingsPanel.style.display = 'none';
    els.convertAction.style.display = 'none';
    els.outputSection.style.display = 'none';
    els.batchControls.style.display = 'none';
    els.downloadZipBtn.style.display = 'none';
    els.downloadBtn.style.display = 'inline-block';
});

// ─── CSV Preview (first file, first 5 rows) ───
// Uses Worker for files >1MB, PapaParse directly for small files
const WORKER_THRESHOLD = 1024 * 1024; // 1MB
let csvWorker = null;

function getWorker() {
    if (!csvWorker) {
        csvWorker = new Worker('js/csv-worker.js');
    }
    return csvWorker;
}

function parseForPreview(fileObj) {
    const delimiter = els.delimiter.value;
    const header = els.headerRow.value === 'true';
    const quoteHandling = els.quoteHandling.value === 'true';
    const skipEmpty = els.skipEmpty.value === 'true';

    if (fileObj.size > WORKER_THRESHOLD) {
        // Use Worker for large files
        const worker = getWorker();
        const jobId = 'preview-' + Date.now();
        const config = {
            delimiter: delimiter === 'auto' ? '' : delimiter,
            header: header,
            dynamicTyping: false,
            quotes: quoteHandling,
            skipEmptyLines: skipEmpty
        };

        worker.onmessage = function(e) {
            if (e.data.jobId !== jobId) return;

            if (e.data.type === 'complete') {
                const results = { data: e.data.data, meta: e.data.meta, errors: e.data.errors };
                fileObj.parsed = results;
                // Show only first 6 rows for preview
                const previewData = results.data.slice(0, 6);
                renderPreview({ data: previewData, meta: results.meta }, header);
                els.settingsPanel.style.display = 'block';
                els.convertAction.style.display = 'flex';
            } else if (e.data.type === 'error') {
                showToast('Parse error: ' + e.data.message, 'error');
            }
        };

        worker.postMessage({ file: fileObj.file, config, jobId });
    } else {
        // Small file — parse directly
        Papa.parse(fileObj.file, {
            delimiter: delimiter === 'auto' ? '' : delimiter,
            header: header,
            preview: 6,
            skipEmptyLines: skipEmpty,
            quotes: quoteHandling,
            complete: (results) => {
                fileObj.parsed = results;
                renderPreview(results, header);
                els.settingsPanel.style.display = 'block';
                els.convertAction.style.display = 'flex';
            },
            error: (err) => {
                showToast('Parse error: ' + err.message, 'error');
            }
        });
    }
}

function renderPreview(results, hasHeader) {
    if (!results.data || results.data.length === 0) {
        els.previewSection.style.display = 'none';
        return;
    }

    els.previewSection.style.display = 'block';

    const rows = results.data;
    let html = '';

    // Type options for dropdown
    const typeOptions = ['auto', 'string', 'number', 'boolean', 'null'];

    if (hasHeader && rows[0] && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
        // Object mode (header = keys)
        const keys = Object.keys(rows[0]);

        // Reset column types for new file
        if (Object.keys(columnTypes).length === 0 || !keys.every(k => k in columnTypes)) {
            columnTypes = {};
            keys.forEach(k => { columnTypes[k] = 'auto'; });
        }

        // Reset JSON paths for new file
        if (Object.keys(jsonPaths).length === 0 || !keys.every(k => k in jsonPaths)) {
            jsonPaths = {};
            keys.forEach(k => {
                // Auto-detect: if column contains dot → pre-fill with column name
                jsonPaths[k] = k.includes('.') ? k : k;
            });
        }

        html += '<thead><tr>';
        keys.forEach(k => {
            const selected = columnTypes[k] || 'auto';
            const opts = typeOptions.map(t =>
                `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`
            ).join('');
            const pathValue = jsonPaths[k] || k;
            const hasDot = k.includes('.');
            html += `<th>
                <span class="col-name">${escapeHtml(k)}</span>
                <select class="col-type-select" data-col="${escapeHtml(k)}">${opts}</select>
                <input type="text" class="json-path-input" data-col="${escapeHtml(k)}"
                    value="${escapeHtml(pathValue)}"
                    placeholder="${escapeHtml(k)}"
                    title="JSON path (dot-notation, e.g. address.city)">
            </th>`;
        });
        html += '</tr></thead><tbody>';
        rows.forEach(row => {
            html += '<tr>';
            keys.forEach(k => { html += `<td>${escapeHtml(String(row[k] ?? ''))}</td>`; });
            html += '</tr>';
        });
        html += '</tbody>';
    } else {
        // Array mode — no type dropdowns (no column names)
        const maxCols = Math.max(...rows.map(r => Array.isArray(r) ? r.length : 1));
        html += '<tbody>';
        rows.forEach(row => {
            html += '<tr>';
            for (let c = 0; c < maxCols; c++) {
                html += `<td>${escapeHtml(String(row[c] ?? ''))}</td>`;
            }
            html += '</tr>';
        });
        html += '</tbody>';
    }

    els.previewTable.innerHTML = html;
    const totalRows = rows.length;
    els.previewCount.textContent = `(${totalRows} row${totalRows !== 1 ? 's' : ''} shown)`;

    // Wire up type dropdowns
    els.previewTable.querySelectorAll('.col-type-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            columnTypes[e.target.dataset.col] = e.target.value;
        });
    });

    // Wire up JSON path inputs
    els.previewTable.querySelectorAll('.json-path-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
            jsonPaths[e.target.dataset.col] = e.target.value;
        });
    });
}

// ─── Settings change → re-parse preview ───
['delimiter', 'headerRow', 'quoteHandling', 'skipEmpty'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        // Reset column types and JSON paths when header or delimiter changes
        if (id === 'headerRow' || id === 'delimiter') {
            columnTypes = {};
            jsonPaths = {};
        }
        if (files.length > 0) parseForPreview(files[0]);
    });
});

// ─── Convert Button ───
els.convertBtn.addEventListener('click', () => {
    if (!isUnlocked() && conversionsUsed >= MAX_FREE) {
        showPaywall();
        return;
    }
    convertToJSON();
});

function getBatchOutputMode() {
    const checked = document.querySelector('input[name="batchOutput"]:checked');
    return checked ? checked.value : 'zip';
}

function convertToJSON() {
    if (files.length === 0) {
        showToast('No files to convert', 'error');
        return;
    }

    const delimiter = els.delimiter.value;
    const header = els.headerRow.value === 'true';
    const typeDetection = els.typeDetection.value === 'true';
    const useNested = els.nestedMapping.value === 'true';
    const quoteHandling = els.quoteHandling.value === 'true';
    const skipEmpty = els.skipEmpty.value === 'true';

    // Check batch mode
    const isBatch = files.length > 1 && els.batchMode && els.batchMode.checked;

    if (isBatch) {
        convertBatch(delimiter, header, typeDetection, useNested, quoteHandling, skipEmpty);
    } else {
        convertSingle(files[0], delimiter, header, typeDetection, useNested, quoteHandling, skipEmpty);
    }
}

// ─── Single file conversion ───
function convertSingle(fileObj, delimiter, header, typeDetection, useNested, quoteHandling, skipEmpty) {
    const useWorker = fileObj.size > WORKER_THRESHOLD;
    const config = {
        delimiter: delimiter === 'auto' ? '' : delimiter,
        header: header,
        dynamicTyping: typeDetection,
        quotes: quoteHandling,
        skipEmptyLines: skipEmpty
    };

    if (useWorker) {
        els.progressSection.style.display = 'flex';
        els.progressFill.style.width = '0%';
        els.progressText.textContent = 'Parsing...';
    }
    els.convertBtn.disabled = true;

    if (useWorker) {
        const worker = getWorker();
        const jobId = 'convert-' + Date.now();

        worker.onmessage = function(e) {
            if (e.data.jobId !== jobId) return;

            if (e.data.type === 'start') {
                els.progressText.textContent = 'Parsing CSV...';
            } else if (e.data.type === 'progress') {
                const pct = Math.round((e.data.bytesProcessed / e.data.totalBytes) * 100);
                els.progressFill.style.width = pct + '%';
                els.progressText.textContent = pct + '%';
            } else if (e.data.type === 'complete') {
                els.progressFill.style.width = '100%';
                els.progressText.textContent = 'Done!';
                setTimeout(() => { els.progressSection.style.display = 'none'; }, 500);
                processResult(e.data.data, e.data.meta, header, useNested);
                els.convertBtn.disabled = false;
            } else if (e.data.type === 'error') {
                showToast('Conversion error: ' + e.data.message, 'error');
                els.progressSection.style.display = 'none';
                els.convertBtn.disabled = false;
            }
        };

        worker.postMessage({ file: fileObj.file, config, jobId });
    } else {
        Papa.parse(fileObj.file, {
            delimiter: config.delimiter,
            header: header,
            skipEmptyLines: skipEmpty,
            dynamicTyping: typeDetection,
            quotes: quoteHandling,
            complete: (results) => {
                processResult(results.data, results.meta, header, useNested);
                els.convertBtn.disabled = false;
            },
            error: (err) => {
                showToast('Conversion error: ' + err.message, 'error');
                els.convertBtn.disabled = false;
            }
        });
    }
}

// ─── Batch conversion (multiple files) ───
let batchResults = []; // Store results from batch

function convertBatch(delimiter, header, typeDetection, useNested, quoteHandling, skipEmpty) {
    batchResults = [];
    els.convertBtn.disabled = true;
    els.progressSection.style.display = 'flex';
    els.progressFill.style.width = '0%';
    els.progressText.textContent = `Converting 1 of ${files.length}...`;

    const config = {
        delimiter: delimiter === 'auto' ? '' : delimiter,
        header: header,
        dynamicTyping: typeDetection,
        quotes: quoteHandling,
        skipEmptyLines: skipEmpty
    };

    let completed = 0;

    files.forEach((fileObj, idx) => {
        const useWorker = fileObj.size > WORKER_THRESHOLD;

        if (useWorker) {
            const worker = getWorker();
            const jobId = 'batch-' + idx + '-' + Date.now();

            worker.onmessage = function(e) {
                if (e.data.jobId !== jobId) return;

                if (e.data.type === 'complete') {
                    const processed = processResultSilent(e.data.data, header, useNested);
                    batchResults.push({
                        name: fileObj.name.replace(/\.[^.]+$/, '') + '.json',
                        data: processed
                    });
                    completed++;
                    updateBatchProgress(completed, files.length);
                } else if (e.data.type === 'error') {
                    showToast(`Error: ${fileObj.name}`, 'error');
                    completed++;
                    updateBatchProgress(completed, files.length);
                }
            };

            worker.postMessage({ file: fileObj.file, config, jobId });
        } else {
            Papa.parse(fileObj.file, {
                delimiter: config.delimiter,
                header: header,
                skipEmptyLines: skipEmpty,
                dynamicTyping: typeDetection,
                quotes: quoteHandling,
                complete: (results) => {
                    const processed = processResultSilent(results.data, header, useNested);
                    batchResults.push({
                        name: fileObj.name.replace(/\.[^.]+$/, '') + '.json',
                        data: processed
                    });
                    completed++;
                    updateBatchProgress(completed, files.length);
                },
                error: (err) => {
                    showToast(`Error: ${fileObj.name}`, 'error');
                    completed++;
                    updateBatchProgress(completed, files.length);
                }
            });
        }
    });
}

function updateBatchProgress(completed, total) {
    const pct = Math.round((completed / total) * 100);
    els.progressFill.style.width = pct + '%';
    els.progressText.textContent = `Converting ${completed} of ${total}...`;

    if (completed >= total) {
        els.progressFill.style.width = '100%';
        els.progressText.textContent = 'Done!';
        els.convertBtn.disabled = false;

        const outputMode = getBatchOutputMode();

        if (outputMode === 'merge') {
            // Merge all results into one JSON array
            const merged = batchResults.flatMap(r => r.data);
            const jsonStr = JSON.stringify(merged, null, 2);
            els.jsonOutput.textContent = jsonStr;
            if (window.hljs) {
                els.jsonOutput.removeAttribute('data-highlighted');
                els.jsonOutput.className = 'language-json';
                hljs.highlightElement(els.jsonOutput);
            }
            els.outputSection.style.display = 'block';
            els.downloadZipBtn.style.display = 'none';
            els.downloadBtn.style.display = 'inline-block';
            showToast(`Merged ${batchResults.length} files → ${merged.length} rows!`, 'success');
        } else {
            // ZIP mode — show first file preview, enable ZIP download
            const firstResult = batchResults[0];
            if (firstResult) {
                const jsonStr = JSON.stringify(firstResult.data, null, 2);
                els.jsonOutput.textContent = jsonStr;
                if (window.hljs) {
                    els.jsonOutput.removeAttribute('data-highlighted');
                    els.jsonOutput.className = 'language-json';
                    hljs.highlightElement(els.jsonOutput);
                }
            }
            els.outputSection.style.display = 'block';
            els.downloadZipBtn.style.display = 'inline-block';
            els.downloadBtn.style.display = 'none';
            showToast(`Converted ${batchResults.length} files! Click Download .zip`, 'success');
        }

        // Increment counter
        if (!isUnlocked()) {
            conversionsUsed++;
            localStorage.setItem(STORAGE_KEY_USED, conversionsUsed.toString());
            updateCounter();
        }

        setTimeout(() => { els.progressSection.style.display = 'none'; }, 1000);
    }
}

// Process result without showing output (for batch)
function processResultSilent(data, header, useNested) {
    let json = data;

    const hasManualTypes = header && Object.values(columnTypes).some(t => t !== 'auto');
    if (hasManualTypes && header) {
        json = json.map(row => {
            const result = {};
            for (const [key, value] of Object.entries(row)) {
                const type = columnTypes[key] || 'auto';
                result[key] = castValue(value, type);
            }
            return result;
        });
    }

    const hasNestedPaths = header && Object.entries(jsonPaths).some(([k, v]) => v && v.includes('.'));
    if (hasNestedPaths && header) {
        json = json.map(row => applyJsonPaths(row));
    }

    return json;
}

function processResult(data, meta, header, useNested) {
    let json = data;

    // Apply manual column types if any are set (not 'auto')
    const hasManualTypes = header && Object.values(columnTypes).some(t => t !== 'auto');
    if (hasManualTypes && header) {
        json = json.map(row => {
            const result = {};
            for (const [key, value] of Object.entries(row)) {
                const type = columnTypes[key] || 'auto';
                result[key] = castValue(value, type);
            }
            return result;
        });
    }

    // Apply nested mapping: use JSON paths from inputs
    // Always apply if any path differs from the column name (contains a dot)
    const hasNestedPaths = header && Object.entries(jsonPaths).some(([k, v]) => v && v.includes('.'));
    if (hasNestedPaths && header) {
        json = json.map(row => applyJsonPaths(row));
    }

    const jsonStr = JSON.stringify(json, null, 2);
    els.jsonOutput.textContent = jsonStr;

    // highlight.js syntax highlighting
    if (window.hljs) {
        els.jsonOutput.removeAttribute('data-highlighted');
        els.jsonOutput.className = 'language-json';
        hljs.highlightElement(els.jsonOutput);
    }

    els.outputSection.style.display = 'block';

    // Increment counter
    if (!isUnlocked()) {
        conversionsUsed++;
        localStorage.setItem(STORAGE_KEY_USED, conversionsUsed.toString());
        updateCounter();
    }

    showToast(`Converted ${json.length} rows!`, 'success');
}

// ─── Value type casting ───
function castValue(value, type) {
    if (value === null || value === undefined || value === '') {
        if (type === 'null') return null;
        return value;
    }

    switch (type) {
        case 'string':
            return String(value);
        case 'number':
            const num = Number(value);
            return isNaN(num) ? value : num;
        case 'boolean':
            if (value === true || value === 'true' || value === '1' || value === 'yes') return true;
            if (value === false || value === 'false' || value === '0' || value === 'no') return false;
            return value;
        case 'null':
            return null;
        case 'auto':
        default:
            return value; // PapaParse dynamicTyping already handled it
    }
}

// ─── Nested Mapping (JSON paths → nested objects) ───
// Uses jsonPaths: { originalColumnName: 'dot.notation.path' }
// If path == column name → flat key (no change)
// If path contains dots → nested object (e.g. 'address.city' → { address: { city: ... } })
// If path has numeric parts → array (e.g. 'items.0.title' → { items: [{ title: ... }] })
function applyJsonPaths(row) {
    const result = {};
    for (const [colName, value] of Object.entries(row)) {
        const path = jsonPaths[colName] || colName;
        if (path === colName || !path.includes('.')) {
            // Flat key — same as column name or no dots
            result[path] = value;
        } else {
            // Nested path with dots
            setNestedPath(result, path, value);
        }
    }
    return result;
}

function setNestedPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        // Array index detection: items.0.title → items[0].title
        if (/^\d+$/.test(part)) {
            const idx = parseInt(part);
            if (!Array.isArray(current[parts[i-1]] || current)) {
                // Determine parent key
                if (i === 0) {
                    if (!Array.isArray(current)) current = [];
                }
            }
            // Navigate: ensure array exists
            if (i > 0) {
                const parentKey = parts[i-1];
                if (!current[parentKey]) current[parentKey] = [];
                if (!current[parentKey][idx]) current[parentKey][idx] = {};
                current = current[parentKey][idx];
            } else {
                if (!Array.isArray(current)) current = [];
                if (!current[idx]) current[idx] = {};
                current = current[idx];
            }
        } else {
            if (!(part in current)) current[part] = {};
            current = current[part];
        }
    }
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
        const idx = parseInt(lastPart);
        if (!Array.isArray(current)) current = [];
        current[idx] = value;
    } else {
        current[lastPart] = value;
    }
}

// ─── Nested mapping controls ───
function resetJsonPaths() {
    if (files.length === 0 || !files[0].parsed) return;
    const keys = Object.keys(files[0].parsed.data[0] || {});
    jsonPaths = {};
    keys.forEach(k => { jsonPaths[k] = k; });
    // Re-render preview to update inputs
    if (files[0].parsed) {
        const previewData = files[0].parsed.data.slice(0, 6);
        renderPreview({ data: previewData, meta: files[0].parsed.meta }, els.headerRow.value === 'true');
    }
    showToast('JSON paths reset', 'success');
}

function autoDetectNested() {
    if (files.length === 0 || !files[0].parsed) return;
    const keys = Object.keys(files[0].parsed.data[0] || {});
    jsonPaths = {};
    keys.forEach(k => {
        // Auto-detect: if column contains dot → use it as nested path
        jsonPaths[k] = k;
    });
    // Re-render
    if (files[0].parsed) {
        const previewData = files[0].parsed.data.slice(0, 6);
        renderPreview({ data: previewData, meta: files[0].parsed.meta }, els.headerRow.value === 'true');
    }
    showToast('Auto-detected nested paths', 'success');
}

function saveMapping() {
    if (files.length === 0) return;
    const mappingName = files[0].name.replace(/\.[^.]+$/, '');
    localStorage.setItem('csvtojson_mapping_' + mappingName, JSON.stringify(jsonPaths));
    showToast('Mapping saved for "' + mappingName + '"', 'success');
}

function loadMapping() {
    if (files.length === 0) return;
    const mappingName = files[0].name.replace(/\.[^.]+$/, '');
    const saved = localStorage.getItem('csvtojson_mapping_' + mappingName);
    if (saved) {
        jsonPaths = JSON.parse(saved);
        if (files[0].parsed) {
            const previewData = files[0].parsed.data.slice(0, 6);
            renderPreview({ data: previewData, meta: files[0].parsed.meta }, els.headerRow.value === 'true');
        }
        showToast('Mapping loaded', 'success');
    } else {
        showToast('No saved mapping for this file', 'error');
    }
}

// ─── Counter ───
function updateCounter() {
    const remaining = MAX_FREE - conversionsUsed;
    els.counter.innerHTML = `Free conversions left: <strong>${Math.max(0, remaining)}</strong>/${MAX_FREE}`;
}

// ─── Copy JSON ───
els.copyBtn.addEventListener('click', () => {
    const text = els.jsonOutput.textContent;
    if (!text) return;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
            els.copyBtn.textContent = '✓ Copied';
            setTimeout(() => { els.copyBtn.textContent = 'Copy'; }, 2000);
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
});

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    } catch (e) {
        showToast('Copy failed — select manually', 'error');
    }
    ta.remove();
}

// ─── Download JSON ───
els.downloadBtn.addEventListener('click', () => {
    const text = els.jsonOutput.textContent;
    if (!text) return;

    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = files[0] ? files[0].name.replace(/\.[^.]+$/, '') : 'converted';
    link.download = `${baseName}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded!', 'success');
});

// ─── Paywall — Day 6 full implementation ───
// Payment config — will be updated after Worker deployment
const PAYMENT_CONFIG = {
    WORKER_URL: 'https://csvtojson-payment.makszoom85.workers.dev',
    TRC20_ADDRESS: '',  // Will be set after TronLink wallet creation
    PRICE_USDT: 5,
    QR_API: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='
};

function showPaywall() {
    if (!PAYMENT_CONFIG.TRC20_ADDRESS) {
        // Worker not deployed yet — show config message
        showToast('Payment system is being configured. Please try again later.', 'error');
        return;
    }

    // Populate payment UI
    const addrInput = document.getElementById('paymentAddress');
    if (addrInput) addrInput.value = PAYMENT_CONFIG.TRC20_ADDRESS;

    // Generate QR code
    const qrContainer = document.getElementById('paymentQR');
    if (qrContainer) {
        const qrData = PAYMENT_CONFIG.TRC20_ADDRESS;
        qrContainer.innerHTML = `<img src="${PAYMENT_CONFIG.QR_API}${encodeURIComponent(qrData)}" alt="QR Code" width="200" height="200">`;
    }

    els.paywallModal.classList.add('open');
}

els.paywallClose.addEventListener('click', () => {
    els.paywallModal.classList.remove('open');
});

// Close modal on backdrop click
els.paywallModal.addEventListener('click', (e) => {
    if (e.target === els.paywallModal) {
        els.paywallModal.classList.remove('open');
    }
});

// ─── Copy address ───
document.getElementById('copyAddressBtn').addEventListener('click', () => {
    const addr = document.getElementById('paymentAddress');
    if (!addr || !addr.value) return;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(addr.value).then(() => {
            const btn = document.getElementById('copyAddressBtn');
            btn.textContent = '✓ Copied';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
            showToast('Address copied!', 'success');
        }).catch(() => {
            fallbackCopy(addr.value);
            const btn = document.getElementById('copyAddressBtn');
            btn.textContent = '✓ Copied';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        });
    } else {
        fallbackCopy(addr.value);
    }
});

// ─── Verify payment ───
document.getElementById('verifyBtn').addEventListener('click', async () => {
    const txidInput = document.getElementById('txidInput');
    const statusEl = document.getElementById('paymentStatus');
    const verifyBtn = document.getElementById('verifyBtn');

    const txId = txidInput.value.trim();

    if (!txId || !/^[a-fA-F0-9]{64}$/.test(txId)) {
        statusEl.textContent = 'Invalid TXID. Expected 64 hex characters.';
        statusEl.className = 'payment-status error';
        return;
    }

    // Show loading
    statusEl.textContent = 'Checking blockchain...';
    statusEl.className = 'payment-status loading';
    verifyBtn.disabled = true;

    try {
        const response = await fetch(PAYMENT_CONFIG.WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txId })
        });

        const data = await response.json();

        if (data.verified) {
            statusEl.textContent = '✅ Payment verified! Unlocking...';
            statusEl.className = 'payment-status success';

            // Unlock
            localStorage.setItem(STORAGE_KEY_UNLOCKED, 'true');
            localStorage.removeItem(STORAGE_KEY_USED);
            conversionsUsed = 0;
            updateCounter();

            // Close modal after delay
            setTimeout(() => {
                els.paywallModal.classList.remove('open');
                showToast('Unlimited conversions activated! 🎉', 'success');
            }, 1500);
        } else {
            statusEl.textContent = '❌ ' + (data.message || 'Verification failed');
            statusEl.className = 'payment-status error';
        }
    } catch (err) {
        statusEl.textContent = 'Network error. Try again.';
        statusEl.className = 'payment-status error';
    } finally {
        verifyBtn.disabled = false;
    }
});

// Enter key in TXID field → verify
document.getElementById('txidInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('verifyBtn').click();
    }
});

// ─── Download ZIP (batch mode) ───
els.downloadZipBtn.addEventListener('click', async () => {
    if (batchResults.length === 0) {
        showToast('No batch results to download', 'error');
        return;
    }

    if (typeof JSZip === 'undefined') {
        showToast('JSZip not loaded', 'error');
        return;
    }

    showToast('Creating ZIP...', '');

    const zip = new JSZip();

    batchResults.forEach(result => {
        const jsonStr = JSON.stringify(result.data, null, 2);
        zip.file(result.name, jsonStr);
    });

    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'csvtojson-batch.zip';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${batchResults.length} files as ZIP!`, 'success');
    } catch (err) {
        showToast('ZIP creation failed: ' + err.message, 'error');
    }
});

// ─── Init ───
updateCounter();

// ─── Mapping control buttons ───
document.getElementById('resetPathsBtn').addEventListener('click', resetJsonPaths);
document.getElementById('saveMappingBtn').addEventListener('click', saveMapping);
document.getElementById('loadMappingBtn').addEventListener('click', loadMapping);