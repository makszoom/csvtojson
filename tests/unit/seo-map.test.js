/* Карта сайта и канонизация: одна страница = один интент, без самоконкуренции. */
const { ok, eq, read } = require('./_harness');

console.log('\n[seo-map.test.js] sitemap и canonical');

const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

eq('в sitemap ровно 9 URL', urls.length, 9);
ok('в sitemap нет слитой страницы convert-csv-to-json',
   !urls.some((u) => u.includes('convert-csv-to-json')), urls.join(', '));
ok('GST-страница в sitemap есть', urls.some((u) => u.includes('csv-to-json-for-gst')));
ok('GSTR-1 JSON→Excel в sitemap есть', urls.some((u) => u.endsWith('/gstr1-json-to-excel')));
ok('главная в sitemap есть', urls.some((u) => u.endsWith('csv-to-json.com/')));

const pages = {
    'seo/csv-to-json.html': 'https://csv-to-json.com/csv-to-json',
    'seo/csv-to-json-for-gst.html': 'https://csv-to-json.com/csv-to-json-for-gst',
    'seo/csv-to-json-batch.html': 'https://csv-to-json.com/csv-to-json-batch',
    'seo/csv-to-nested-json.html': 'https://csv-to-json.com/csv-to-nested-json',
    'seo/convert-csv-to-json.html': 'https://csv-to-json.com/csv-to-json',
    'seo/gstr1-json-to-excel.html': 'https://csv-to-json.com/gstr1-json-to-excel',
    'seo/gst-offline-tool-json-not-generating.html': 'https://csv-to-json.com/gst-offline-tool-json-not-generating',
    'seo/how-to-convert-excel-to-json-for-gst.html': 'https://csv-to-json.com/how-to-convert-excel-to-json-for-gst',
    'seo/gstr1-download-in-excel.html': 'https://csv-to-json.com/gstr1-download-in-excel'
};
for (const [file, canonical] of Object.entries(pages)) {
    const src = read(file);
    ok(`${file}: canonical -> ${canonical.replace('https://csv-to-json.com', '')}`,
       src.includes(`<link rel="canonical" href="${canonical}">`));
}

// ни одна страница не должна ссылаться на слитую страницу
for (const file of Object.keys(pages).concat(['index.html'])) {
    if (file.endsWith('convert-csv-to-json.html')) continue;
    const src = read(file);
    ok(`${file}: нет ссылок на merge-страницу`, !src.includes('convert-csv-to-json.html'));
}

// у каждой страницы есть свой title и description (не копии)
const titles = Object.keys(pages).map((f) => {
    const m = read(f).match(/<title>(.*?)<\/title>/s);
    return m ? m[1].trim() : '';
});
eq('все title уникальны', new Set(titles).size, titles.length);

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&quot;/g, '"');
const gstTitle = decode(read('seo/csv-to-json-for-gst.html').match(/<title>(.*?)<\/title>/s)[1].trim());
ok('title GST-страницы начинается с "Excel to JSON Converter" (точная фраза топ-запроса)', gstTitle.startsWith('Excel to JSON Converter for GSTR-1'), gstTitle);
ok('title GST-страницы уложен в 60 символов (не обрезается в выдаче)', gstTitle.length <= 60, `${gstTitle.length} символов`);
ok('title главной уложен в 60 символов', decode(read('index.html').match(/<title>(.*?)<\/title>/s)[1].trim()).length <= 60,
   `${decode(read('index.html').match(/<title>(.*?)<\/title>/s)[1].trim()).length} символов`);
