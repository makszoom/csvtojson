'use strict';
// Тесты GST-страницы: паритет FAQ ↔ JSON-LD и запрет ложных обещаний.
// Причина: страница уже ранжируется (55 запросов, поз. 6-9), но в ней жили
// (а) шаг HowTo «Save the Excel sheet as CSV» при тексте «no need to save it as CSV»,
// (б) обещание «download the JSON for the GST portal» при честной оговорке в другом
// месте страницы, что portal-схему наш конвертер не производит,
// (в) H1 «CSV<br>to» — в тексте склеивается в «CSVto».
// Тест статический: читает HTML, ничего не запускает.
const { ok, read } = require('./_harness');

const FILE = 'seo/csv-to-json-for-gst.html';
const html = read(FILE);
// Текст, который видит читатель: без тегов, без <script>/<style> (иначе JSON-LD
// считается второй раз и объём завышается почти вдвое).
const visibleHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
const plain = visibleHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// --- 1. H1 не должен склеивать слова через <br> без пробела ---
const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
const h1text = h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
ok('H1 читается без склейки слов (нет "CSVto")',
    !/CSVto/i.test(h1text), h1text);
ok('H1 содержит фразу "GST" и "JSON"',
    /gst/i.test(h1text) && /json/i.test(h1text), h1text);

// --- 2. Ни в одном месте не обещаем JSON для загрузки на портал ---
// Сам запрет на формулировки живёт в claims.test.js (он проходит по всем страницам);
// здесь проверяем только шаги инструкции на этой странице.
ok('шаги HowTo не обещают JSON для портала',
    !/for the GST portal/i.test(plain));

// --- 3. Шаги HowTo не должны противоречить заявлению "Excel читается напрямую" ---
ok('шаги не требуют "Save the Excel sheet as CSV"',
    !/Save the Excel sheet as CSV/i.test(plain));
ok('страница прямо говорит, что .xlsx читается без конвертации в CSV',
    /reads[\s\S]{0,40}\.xlsx[\s\S]{0,40}directly/i.test(plain) || /no\s+.?Save As CSV/i.test(plain));

// --- 4. Паритет видимых FAQ и Schema.org FAQPage ---
const visible = [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1]); } catch (e) { return null; } })
    .filter(Boolean);
const faqPage = ld.find((j) => j['@type'] === 'FAQPage');
ok('FAQPage JSON-LD присутствует', Boolean(faqPage));
const schema = (faqPage && faqPage.mainEntity || []).map((q) => String(q.name).replace(/\s+/g, ' ').trim());
ok('число видимых FAQ совпадает со схемой', visible.length === schema.length,
    `видимых ${visible.length}, в схеме ${schema.length}`);
const missingInSchema = visible.filter((q) => !schema.includes(q));
const missingVisible = schema.filter((q) => !visible.includes(q));
ok('каждый видимый вопрос есть в схеме', missingInSchema.length === 0, missingInSchema.join(' | '));
ok('каждый вопрос схемы виден на странице', missingVisible.length === 0, missingVisible.join(' | '));

// --- 5. Покрытие интентов, по которым страница уже показывается (GSC) ---
// "excel to json converter for gstr 1 latest version" — 73 показа, поз. 6.8, текст не покрывал интент вовсе.
ok('страница отвечает на интент "latest version" Offline Tool',
    /latest version/i.test(plain));
// Варианты написания: GSTR1 / GSTR-1 / GSTR 1 — люди ищут всеми тремя.
ok('в тексте есть все три написания GSTR', ['GSTR1', 'GSTR-1', 'GSTR 1'].every((v) => plain.includes(v)));

// --- 6. Страница остаётся нишевой (pitfall 0d: усиливать, не раздувать) ---
// Объём зафиксирован на момент правки 14.11.2026: правки должны быть заменой текста,
// а не наращиванием. Если понадобится больше — сначала сократить устаревшее.
const words = plain.split(' ').filter(Boolean).length;
ok('объём текста не вырос выше зафиксированного', words <= 2200, `${words} слов (лимит 2200)`);

module.exports = {};
