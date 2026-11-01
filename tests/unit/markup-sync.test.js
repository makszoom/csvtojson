/* Разметка инструмента в js/tool-markup.js обязана совпадать с index.html. */
const { ok } = require('./_harness');
const { execFileSync } = require('child_process');
const path = require('path');
const { ROOT } = require('./_harness');

console.log('\n[markup-sync.test.js] синхронность разметки');

let out = '';
let failed = false;
try {
    out = execFileSync('python', [path.join(ROOT, 'scripts', 'build-tool-markup.py'), '--check'], { encoding: 'utf8' });
} catch (e) {
    failed = true;
    out = (e.stdout || '') + (e.stderr || '');
}
ok('build-tool-markup.py --check проходит', !failed && out.includes('OK'), out.trim());

const fs = require('fs');
const markupJs = fs.readFileSync(path.join(ROOT, 'js', 'tool-markup.js'), 'utf8');
ok('tool-markup.js содержит разметку инструмента', markupJs.includes('id=\\"dropZone\\"') || markupJs.includes('id="dropZone"'));
ok('tool-markup.js содержит пейволл', markupJs.includes('paywallModal'));
ok('встроенная копия — div, а не второй <main>', markupJs.includes('tool-embed') && !markupJs.includes('<main'));
