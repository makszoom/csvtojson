/* Лендинги: инструмент встроен, правильная разметка монтирования, нет двойной загрузки app.js. */
const { ok, read } = require('./_harness');

console.log('\n[embed.test.js] встраивание на лендинги');

const pages = {
    'seo/csv-to-json-for-gst.html': 'gst',
    'seo/convert-csv-to-json.html': 'full',
    'seo/csv-to-nested-json.html': 'nested',
    'seo/csv-to-json-batch.html': 'batch'
};

for (const [page, variant] of Object.entries(pages)) {
    const src = read(page);
    ok(`${page}: точка монтирования с вариантом ${variant}`,
       src.includes(`<div id="toolMount" data-variant="${variant}"></div>`));
    ok(`${page}: подключён tool-markup.js`, src.includes('js/tool-markup.js'));
    ok(`${page}: подключён tool-embed.js`, src.includes('js/tool-embed.js'));
    ok(`${page}: app.js не грузится напрямую (иначе двойная инициализация)`,
       !src.includes('<script src="js/app.js"></script>'));
    ok(`${page}: монтирование до статьи (инструмент выше текста)`,
       src.indexOf('id="toolMount"') < src.indexOf('seo-content'));
}

const indexHtml = read('index.html');
ok('модалка пейволла без inline display (иначе .open не работает)',
   !indexHtml.includes('id="paywallModal" style="display:none;"'));

const embed = read('js/tool-embed.js');
ok('tool-embed: core.js подключён до app.js',
   embed.indexOf("'js/core.js'") < embed.indexOf("'js/app.js'"));
ok('tool-embed: вендоры идут раньше app.js',
   embed.indexOf('vendor/papaparse.min.js') < embed.indexOf("'js/app.js'"));
ok('tool-embed: порядок сохраняется (async=false)', embed.includes('s.async = false'));
