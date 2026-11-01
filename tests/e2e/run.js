/* E2E: реальный Chrome. Локальный статический сервер + прод (--live).
 *
 *   node tests/e2e/run.js            # локально, http://127.0.0.1:8123
 *   node tests/e2e/run.js --live     # против https://csv-to-json.com
 *
 * Chrome должен быть уже запущен (см. шапку harness.js).
 */
const { connect, openPage, collectors, dropFile } = require('./harness');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LIVE = process.argv.includes('--live');
const PORT = 8123;
const ROOT = path.resolve(__dirname, '..', '..');
const BASE = LIVE ? 'https://csv-to-json.com' : `http://127.0.0.1:${PORT}`;

/* Прод-раскладка: index/privacy/robots/sitemap в корне, лендинги из seo/*.html
   тоже в корне (на живом сайте /csv-to-json-for-gst.html), плюс css, js, vendor.
   Локальный сервер должен повторять это, иначе относительные пути врут. */
function buildStaging() {
    const stage = path.join(ROOT, '.e2e-site');
    fs.rmSync(stage, { recursive: true, force: true });
    fs.mkdirSync(stage, { recursive: true });
    const copyDir = (from, to) => {
        fs.mkdirSync(to, { recursive: true });
        for (const f of fs.readdirSync(from)) {
            const s = path.join(from, f), d = path.join(to, f);
            if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
        }
    };
    for (const f of ['index.html', 'privacy.html', 'robots.txt', 'sitemap.xml']) {
        fs.copyFileSync(path.join(ROOT, f), path.join(stage, f));
    }
    for (const d of ['css', 'js', 'vendor']) copyDir(path.join(ROOT, d), path.join(stage, d));
    for (const f of fs.readdirSync(path.join(ROOT, 'seo'))) {
        fs.copyFileSync(path.join(ROOT, 'seo', f), path.join(stage, f));
    }
    return stage;
}

let passed = 0, failed = 0;
const failures = [];
function ok(name, cond, extra) {
    if (cond) { passed++; console.log('  \u2713', name); }
    else { failed++; failures.push(name); console.log('  \u2717', name, extra === undefined ? '' : String(extra).slice(0, 300)); }
}

const CSV = 'invoice_no,hsn,taxable,party\n00721,0401,1500.50,"Ann, Ltd"\n00012,9999,2000,Bo';

(async () => {
    await connect();
    let server = null;
    if (!LIVE) {
        const stage = buildStaging();
        server = spawn('python', ['-m', 'http.server', String(PORT)], { cwd: stage, stdio: 'ignore' });
        await new Promise((r) => setTimeout(r, 1500));
    }

    try {
        // ── 1. Главная: инструмент живёт, конвертация работает, типы не портят ID ──
        console.log('\n[index] главная страница');
        let p = await openPage(`${BASE}/index.html`);
        ok('заголовок страницы', (await p.evalJS('document.title')).includes('CSV to JSON'));
        ok('drop-зона есть', await p.evalJS('!!document.getElementById("dropZone")'));
        ok('модуль инструмента инициализирован', (await p.evalJS('window.CSVtoJSON && window.CSVtoJSON.ready')) === true);
        ok('ядро core.js подключено', (await p.evalJS('typeof window.CSVtoJSONCore === "object"')));
        ok('hljs загружен с нашего домена', (await p.evalJS('typeof window.hljs !== "undefined"')), 'highlight.js не поднялся');

        const drop = await dropFile(p.evalJS, { name: 'gstr1.csv', text: CSV });
        ok('файл подан в input', drop && drop.ok, JSON.stringify(drop));
        await new Promise((r) => setTimeout(r, 700));
        ok('превью-таблица отрисована', (await p.evalJS('document.querySelectorAll("#previewTable tbody tr").length')) > 0);
        ok('панель настроек показана', (await p.evalJS('getComputedStyle(document.getElementById("settingsPanel")).display')) !== 'none');

        await p.evalJS('document.getElementById("convertBtn").click()');
        await new Promise((r) => setTimeout(r, 600));
        const out = await p.evalJS('document.getElementById("jsonOutput").textContent');
        ok('вывод JSON непустой', out.length > 20, out.slice(0, 120));
        ok('номер счёта сохранил ведущий ноль', out.includes('00721'), out.slice(0, 200));
        ok('HSN 0401 сохранил ведущий ноль', out.includes('0401'));
        ok('колонка HSN целиком строковая (9999 тоже в кавычках)', out.includes('"9999"'), out.slice(0, 300));
        ok('обычное число стало числом', /1500\.5|1500\.50/.test(out) && !out.includes('"1500.5'));
        ok('ошибок JS на главной нет', collectors.exceptions.length === 0, collectors.exceptions.join(' | '));

        // ── 2. Пейволл после 5 конверсий ──
        console.log('\n[index] пейволл');
        await p.evalJS('localStorage.setItem("csvtojson_used", "5"); localStorage.removeItem("csvtojson_unlocked");');
        ok('лимит записан в хранилище', (await p.evalJS('localStorage.getItem("csvtojson_used")')) === '5');
        await p.close();
        p = await openPage(`${BASE}/index.html`);   // модуль читает счётчик при загрузке
        ok('при загрузке виден исчерпанный лимит', (await p.evalJS('document.getElementById("counter").textContent')).includes('0'));
        await dropFile(p.evalJS, { name: 'gstr1.csv', text: CSV });
        await new Promise((r) => setTimeout(r, 600));
        await p.evalJS('document.getElementById("convertBtn").click()');
        await new Promise((r) => setTimeout(r, 500));
        ok('пейволл открылся на 6-й конверсии', await p.evalJS('getComputedStyle(document.getElementById("paywallModal")).display !== "none"'));
        await p.evalJS('localStorage.removeItem("csvtojson_used")');
        await p.close();

        // ── 3. Лендинги: инструмент встроен и работает без перехода ──
        const landings = [
            ['csv-to-json-for-gst', 'gst'],
            ['convert-csv-to-json', 'full'],
            ['csv-to-nested-json', 'nested'],
            ['csv-to-json-batch', 'batch']
        ];
        for (const [slug, variant] of landings) {
            console.log(`\n[${slug}] лендинг, вариант ${variant}`);
            p = await openPage(`${BASE}/${slug}.html`);
            ok('точка монтирования на месте', await p.evalJS('!!document.getElementById("toolMount")'));
            ok('разметка смонтирована', await p.evalJS('!!document.getElementById("dropZone")'));
            ok('вариант применён', (await p.evalJS('document.getElementById("toolMount").getAttribute("data-variant-applied")')) === variant);
            ok('нет ошибки загрузки скриптов', (await p.evalJS('document.getElementById("toolMount").getAttribute("data-load-error")')) === null);
            ok('модуль инструмента инициализирован', (await p.evalJS('window.CSVtoJSON && window.CSVtoJSON.ready')) === true);
            ok('ошибок JS нет', collectors.exceptions.length === 0, collectors.exceptions.join(' | '));

            const d2 = await dropFile(p.evalJS, { name: 'landing.csv', text: CSV });
            ok('файл принят без перехода на другую страницу', d2 && d2.ok);
            await new Promise((r) => setTimeout(r, 700));
            await p.evalJS('document.getElementById("convertBtn").click()');
            await new Promise((r) => setTimeout(r, 600));
            const out2 = await p.evalJS('document.getElementById("jsonOutput").textContent');
            ok('конвертация на месте сработала', out2.length > 20, out2.slice(0, 120));
            ok('ведущие нули целы и здесь', out2.includes('00721'));
            if (variant === 'gst') {
                ok('текст drop-зоны под GST', (await p.evalJS('document.querySelector("#toolMount .drop-zone-text").textContent')).includes('GSTR-1'));
            }
            await p.close();
        }

        // ── 4. Страница без инструмента не должна падать ──
        console.log('\n[privacy] страница без инструмента');
        p = await openPage(`${BASE}/privacy.html`);
        ok('privacy открывается', (await p.evalJS('document.title')).length > 0);
        ok('ошибок JS на странице без инструмента нет', collectors.exceptions.length === 0, collectors.exceptions.join(' | '));
        await p.close();

    } catch (e) {
        failed++;
        failures.push('исключение раннера');
        console.log('  \u2717 ИСКЛЮЧЕНИЕ:', e.message);
    } finally {
        if (server) server.kill();
    }

    const total = passed + failed;
    console.log(`\nE2E${LIVE ? ' (live)' : ''}: ${passed}/${total} PASS` + (failed ? `, ${failed} FAIL` : ''));
    if (failed) console.log('провалы: ' + failures.join(', '));
    process.exit(failed ? 1 : 0);
})();
