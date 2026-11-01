/* Ассеты: вендоры лежат у нас, внешних CDN нет, порядок скриптов верный. */
const { ok, read, files } = require('./_harness');
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./_harness');

console.log('\n[assets.test.js] вендоры и подключения');

const vendorSizes = {
    'vendor/papaparse.min.js': 15000,
    'vendor/jszip.min.js': 50000,
    'vendor/highlight.min.js': 50000,
    'vendor/highlight-json.min.js': 300,
    'vendor/highlight-github.min.css': 500
};
for (const [rel, min] of Object.entries(vendorSizes)) {
    const p = path.join(ROOT, rel);
    const exists = fs.existsSync(p);
    const size = exists ? fs.statSync(p).size : 0;
    ok(`${rel} на месте (${size} b)`, exists && size > min, `размер ${size} < ${min}`);
}

const htmls = ['index.html', 'privacy.html'].concat(files('seo').map(f => 'seo/' + f));
const cdnPatterns = ['unpkg.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'cdn.sheetjs.com', 'googleapis.com'];
for (const h of htmls) {
    const src = read(h);
    const found = cdnPatterns.filter(p => src.includes(p));
    ok(`${h}: нет внешних CDN`, found.length === 0, 'найдено: ' + found.join(', '));
}

const index = read('index.html');
ok('index.html: core.js подключён', index.includes('js/core.js'));
ok('index.html: core.js раньше app.js',
   index.indexOf('js/core.js') < index.indexOf('js/app.js'));
ok('index.html: вендоры локальные', index.includes('vendor/papaparse.min.js'));
