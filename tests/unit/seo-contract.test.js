'use strict';
// SEO-контракт всех страниц сайта: длины сниппетов, единый каркас, честность обещаний.
//
// Зачем отдельный файл (17.11.2026): у пяти страниц description оказался длиннее
// 160 символов (172, 192, 212, 176, 164), и Google обрезал их в выдаче. Тесты
// проверяли длину title и уникальность description, но НЕ его длину — дефект
// прожил незамеченным. Здесь контракт зафиксирован целиком.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
let passed = 0, failed = 0;
const fail = [];
function ok(name, cond, extra) {
    if (cond) { passed++; }
    else { failed++; fail.push(name); console.log('  \u2717', name, extra === undefined ? '' : String(extra).slice(0, 300)); }
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const PAGES = ['index.html', 'privacy.html'].concat(
    fs.readdirSync(path.join(ROOT, 'seo')).filter((f) => f.endsWith('.html')).sort().map((f) => 'seo/' + f));

// --- 1. Сниппеты укладываются в то, что Google показывает ----------------
for (const f of PAGES) {
    const s = read(f);
    const title = ((s.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/\s+/g, ' ').trim();
    const desc = (s.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) || [])[1] || '';

    ok(`${f}: title есть и \u226460 символов`, title.length > 0 && title.length <= 60, `${title.length}: ${title}`);
    ok(`${f}: description есть и \u2264160 символов`, desc.length > 0 && desc.length <= 160, `${desc.length} символов`);
    // og/twitter должны повторять тот же текст, иначе карточка в соцсетях врёт.
    // Сравниваем после раскодирования HTML-сущностей: &#x27; и &amp; дают разную длину
    // при одинаковом смысле.
    const unesc = (x) => x.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const ogDesc = (s.match(/property="og:description"[^>]*content="([^"]*)"/) || [])[1];
    if (ogDesc) ok(`${f}: og:description совпадает с description`,
        unesc(ogDesc) === unesc(desc), `${unesc(ogDesc).length} vs ${unesc(desc).length}`);
}

// --- 2. Уникальность title и canonical ------------------------------------
const titles = PAGES.map((f) => ((read(f).match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/\s+/g, ' ').trim());
ok('все title уникальны', new Set(titles).size === titles.length,
    titles.filter((t, i) => titles.indexOf(t) !== i).join(' | '));
const canons = PAGES.map((f) => (read(f).match(/rel="canonical"[^>]*href="([^"]+)"/) || [])[1] || '');
ok('canonical есть у каждой страницы', canons.every(Boolean));
// Дубль canonical допустим, когда страницу НАМЕРЕННО склеили с другой (канонизация дубля).
// Опасен не дубль, а canonical, ведущий на несуществующий URL: тогда страница выпадает из индекса.
const SLUGS = new Set(PAGES.map((f) => {
    const base = f.replace(/^seo\//, '').replace(/^index\.html$/, '');
    return 'https://csv-to-json.com/' + (base === 'privacy.html' ? 'privacy.html' : base.replace(/\.html$/, ''));
}));
for (let i = 0; i < PAGES.length; i++) {
    const c = canons[i];
    if (!c) continue;
    ok(`${PAGES[i]}: canonical ведёт на существующую страницу`, SLUGS.has(c), c);
}

// --- 3. Единый каркас: обязательные компоненты на каждой странице --------
const SHELL = ['badge badge-free', 'hero', 'faq-section', 'related-grid'];
for (const f of PAGES) {
    if (f === 'privacy.html') continue; // служебная страница, каркаса лендинга не требует
    const s = read(f);
    for (const cls of SHELL) {
        ok(`${f}: компонент «${cls}»`, s.includes(cls));
    }
}

// --- 4. Только один способ вёрстки контентной таблицы --------------------
// .table-wrapper — контейнер превью ВНУТРИ инструмента, .seo-table — таблица статьи.
// Смешивать их нельзя: у них разная типографика и поведение прокрутки.
for (const f of PAGES) {
    const s = read(f);
    if (f === 'index.html') continue; // на главной живёт инструмент с превью
    ok(`${f}: контентная таблица только через .seo-table`,
        !s.includes('class="table-wrapper"'));
}

// --- 5. Ни одна страница не обещает портал-готовый JSON ------------------
const FORBIDDEN = ['JSON for the GST portal', 'download the JSON for the GST', 'upload it to the portal', 'portal-ready'];
for (const f of PAGES) {
    const s = read(f);
    const plain = s.replace(/<[^>]+>/g, ' ');
    const hits = FORBIDDEN.filter((p) => {
        let i = plain.indexOf(p);
        while (i !== -1) {
            if (!/["\u201c\u201d\u00ab']/.test(plain.slice(Math.max(0, i - 1), i))) return true;
            i = plain.indexOf(p, i + 1);
        }
        return false;
    });
    ok(`${f}: нет ложного обещания про портал`, hits.length === 0, hits.join(' | '));
}

// --- 6. GST-страница отвечает на главный запрос в H1 ---------------------
// Главный запрос: "excel to json converter for gstr1" (142 показа, поз. 8.7).
// В title слово Excel было, в H1 его не было — заголовок не подтверждал сниппет.
const gstH1 = (read('seo/csv-to-json-for-gst.html').match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
const gstH1text = gstH1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
ok('GST H1 содержит слово «Excel»', /excel/i.test(gstH1text), gstH1text);
ok('GST H1 содержит «JSON» и «GST»', /json/i.test(gstH1text) && /gst/i.test(gstH1text), gstH1text);
ok('GST H1 не длиннее 70 символов (не превращается в абзац)', gstH1text.length <= 70, `${gstH1text.length}: ${gstH1text}`);

// --- 7. Паритет FAQ и Schema.org на страницах с FAQ ---------------------
// FAQ на сайте свёрстан двумя способами: <details class="faq-item"><summary>…</summary>
// на лендингах и <div class="faq-item"><h3>…</h3> на главной. Считаем оба.
for (const f of PAGES) {
    const s = read(f);
    const visible = [...s.matchAll(/(?:<summary[^>]*>|<div class="faq-item">\s*<h3>)([\s\S]*?)(?:<\/summary>|<\/h3>)/g)]
        .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    let schema = [];
    for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        let j;
        try { j = JSON.parse(m[1]); } catch (e) { ok(`${f}: JSON-LD парсится`, false, String(e).slice(0, 80)); continue; }
        if (j['@type'] === 'FAQPage') schema = (j.mainEntity || []).map((q) => String(q.name).replace(/\s+/g, ' ').trim());
    }
    if (schema.length) {
        ok(`${f}: вопросы схемы видны на странице`,
            schema.every((q) => visible.includes(q)), `${visible.length} видимых / ${schema.length} в схеме`);
    }
}

// --- 8. Широкая таблица не должна растягивать страницу на мобиле --------
// 7-колоночная .seo-table без контейнера прокрутки расширяла body до 647px
// при экране 390px: горизонтальный скролл появлялся у страницы, а не у таблицы.
for (const f of PAGES) {
    const s = read(f);
    if (!/class="seo-table"/.test(s)) continue;
    ok(`${f}: таблица лежит в контейнере прокрутки`, s.includes('class="seo-table-wrap"'));
    ok(`${f}: .seo-table-wrap есть в CSS`,
        fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8').includes('.seo-table-wrap'));
}

console.log(`\nSEO-КОНТРАКТ: ${passed}/${passed + failed} PASS` + (failed ? `, ${failed} FAIL` : ''));
if (failed) console.log('провалы: ' + fail.join(' | '));
process.exit(failed ? 1 : 0);
