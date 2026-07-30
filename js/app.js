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
    // Settings
    delimiter:      document.getElementById('delimiter'),
    headerRow:      document.getElementById('headerRow'),
    typeDetection:  document.getElementById('typeDetection'),
    nestedMapping:  document.getElementById('nestedMapping'),
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
    renderFileList();
    els.previewSection.style.display = 'none';
    els.settingsPanel.style.display = 'none';
    els.convertAction.style.display = 'none';
    els.outputSection.style.display = 'none';
});

// ─── CSV Preview (first file, first 5 rows) ───
function parseForPreview(fileObj) {
    const delimiter = els.delimiter.value;
    const header = els.headerRow.value === 'true';

    Papa.parse(fileObj.file, {
        delimiter: delimiter === 'auto' ? '' : delimiter,
        header: header,
        preview: 6, // header + 5 rows
        skipEmptyLines: true,
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

function renderPreview(results, hasHeader) {
    if (!results.data || results.data.length === 0) {
        els.previewSection.style.display = 'none';
        return;
    }

    els.previewSection.style.display = 'block';

    const rows = results.data;
    let html = '';

    if (hasHeader && rows[0] && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
        // Object mode (header = keys)
        const keys = Object.keys(rows[0]);
        html += '<thead><tr>';
        keys.forEach(k => { html += `<th>${escapeHtml(k)}</th>`; });
        html += '</tr></thead><tbody>';
        rows.forEach(row => {
            html += '<tr>';
            keys.forEach(k => { html += `<td>${escapeHtml(String(row[k] ?? ''))}</td>`; });
            html += '</tr>';
        });
        html += '</tbody>';
    } else {
        // Array mode
        const maxCols = Math.max(...rows.map(r => Array.isArray(r) ? r.length : 1));
        html += '<tbody>';
        rows.forEach((row, i) => {
            html += '<tr>';
            if (i === 0 && !hasHeader) {
                // No header — just show data
                for (let c = 0; c < maxCols; c++) {
                    html += `<td>${escapeHtml(String(row[c] ?? ''))}</td>`;
                }
            } else {
                for (let c = 0; c < maxCols; c++) {
                    html += `<td>${escapeHtml(String(row[c] ?? ''))}</td>`;
                }
            }
            html += '</tr>';
        });
        html += '</tbody>';
    }

    els.previewTable.innerHTML = html;
    const totalRows = rows.length;
    els.previewCount.textContent = `(${totalRows} row${totalRows !== 1 ? 's' : ''} shown)`;
}

// ─── Settings change → re-parse preview ───
['delimiter', 'headerRow'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        if (files.length > 0) parseForPreview(files[0]);
    });
});

// ─── Convert Button (Day 2+ — full implementation) ───
els.convertBtn.addEventListener('click', () => {
    if (!isUnlocked() && conversionsUsed >= MAX_FREE) {
        showPaywall();
        return;
    }
    convertToJSON();
});

function convertToJSON() {
    if (files.length === 0) {
        showToast('No files to convert', 'error');
        return;
    }

    const delimiter = els.delimiter.value;
    const header = els.headerRow.value === 'true';
    const typeDetection = els.typeDetection.value === 'true';
    const useNested = els.nestedMapping.value === 'true';

    const fileObj = files[0];

    Papa.parse(fileObj.file, {
        delimiter: delimiter === 'auto' ? '' : delimiter,
        header: header,
        skipEmptyLines: true,
        dynamicTyping: typeDetection,
        complete: (results) => {
            let json = results.data;

            // Apply nested mapping if enabled
            if (useNested && header) {
                json = json.map(row => applyNestedMapping(row));
            }

            const jsonStr = JSON.stringify(json, null, 2);
            els.jsonOutput.textContent = jsonStr;
            if (window.hljs) {
                hljs.highlightElement(els.jsonOutput);
            }
            els.outputSection.style.display = 'block';

            // Increment counter
            if (!isUnlocked()) {
                conversionsUsed++;
                localStorage.setItem(STORAGE_KEY_USED, conversionsUsed.toString());
                updateCounter();
            }

            showToast('Converted successfully!', 'success');
        },
        error: (err) => {
            showToast('Conversion error: ' + err.message, 'error');
        }
    });
}

// ─── Nested Mapping (dot-notation → nested objects) ───
function applyNestedMapping(row) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        if (key.includes('.')) {
            setNestedPath(result, key, value);
        } else {
            result[key] = value;
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
            if (!Array.isArray(current)) current = [];
            if (!current[idx]) current[idx] = {};
            current = current[idx];
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

// ─── Paywall (placeholder — Day 6 full implementation) ───
function showPaywall() {
    els.paywallModal.style.display = 'block';
}

els.paywallClose.addEventListener('click', () => {
    els.paywallModal.style.display = 'none';
});

// Close modal on backdrop click
els.paywallModal.addEventListener('click', (e) => {
    if (e.target === els.paywallModal) {
        els.paywallModal.style.display = 'none';
    }
});

// ─── Init ───
updateCounter();