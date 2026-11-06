/* Счётчик воронки: что и когда считаем. Ничего лишнего не отправляем. */
const { ok, eq } = require('./_harness');
const M = require('../../js/metrics.js');

console.log('\n[metrics.test.js] счётчик воронки');

eq('список событий ровно 6', M.EVENTS.length, 6);
eq('события по порядку воронки', M.EVENTS,
   ['page_view', 'file_loaded', 'convert_click', 'download_click', 'paywall_shown', 'payment_verified']);

ok('неизвестное событие не проходит', M.isValidEvent('click_everything') === false);
ok('известное событие проходит', M.isValidEvent('convert_click') === true);

eq('payload: только событие и путь',
   M.buildPayload('convert_click', '/csv-to-json-for-gst'),
   { e: 'convert_click', p: '/csv-to-json-for-gst' });
eq('payload с типом файла (для file_loaded)',
   M.buildPayload('file_loaded', '/', { type: 'xlsx' }),
   { e: 'file_loaded', p: '/', t: 'xlsx' });
ok('в payload нет ключей с IP/UA/cookie',
   Object.keys(M.buildPayload('page_view', '/')).every((k) => ['e', 'p', 't', 'r'].includes(k)));

// ── источник перехода (referrer host) — для замера каналов ──
eq('payload с источником перехода',
   M.buildPayload('page_view', '/', { ref: 'caclubindia.com' }),
   { e: 'page_view', p: '/', r: 'caclubindia.com' });
eq('referrer host: внешний домен без www',
   M.referrerHost({ referrer: 'https://www.caclubindia.com/forum/x-614623.asp?q=1' }, 'csv-to-json.com'),
   'caclubindia.com');
eq('referrer host: свой же домен не считается источником',
   M.referrerHost({ referrer: 'https://csv-to-json.com/csv-to-json' }, 'csv-to-json.com'), '');
eq('referrer host: пустой referrer -> пусто', M.referrerHost({ referrer: '' }, 'csv-to-json.com'), '');
eq('referrer host: битый URL -> пусто', M.referrerHost({ referrer: 'not a url' }, 'csv-to-json.com'), '');
eq('referrer host: нет документа -> пусто', M.referrerHost(null, 'csv-to-json.com'), '');
ok('в источнике нет пути и query (только хост)',
   !/[\/?]/.test(M.referrerHost({ referrer: 'https://www.google.com/search?q=x' }, 'csv-to-json.com')));
ok('длинный хост обрезается',
   M.referrerHost({ referrer: 'https://' + 'a'.repeat(120) + '.com/x' }, 'csv-to-json.com').length <= 60);

// по умолчанию (endpoint пустой) — молчим, никаких запросов
ok('endpoint задан (воркер задеплоен)', M.isEnabled() === true);
ok('endpoint — наш собственный воркер', /^https:\/\/csvtojson-metrics\.\w+\.workers\.dev\/t$/.test(
    require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'js', 'metrics.js'), 'utf8')
        .match(/METRICS_URL = '([^']*)'/)[1]));

// DNT
ok('Do Not Track = 1 отключает отправку', M.dntEnabled({ doNotTrack: '1' }) === true);
ok('Global Privacy Control отключает отправку', M.dntEnabled({ globalPrivacyControl: true }) === true);
ok('обычный браузер считается', M.dntEnabled({ doNotTrack: null }) === false);

// включённый счётчик шлёт ровно то, что задумано
let sent = null;
const fakeNav = { doNotTrack: null, sendBeacon: (url, blob) => { sent = { url: url, blob: blob }; return true; } };
ok('счётчик включён', M.isEnabled() === true);
ok('track отправляет beacon', M.track('paywall_shown', { path: '/index.html', navigator: fakeNav }) === true);
ok('URL отправки — наш воркер', sent && /csvtojson-metrics/.test(sent.url) && sent.url.endsWith('/t'), JSON.stringify(sent && sent.url));
ok('невалидное событие не отправляется', M.track('hack', { navigator: fakeNav }) === false);
ok('DNT блокирует отправку при включённом endpoint',
   M.track('page_view', { navigator: { doNotTrack: '1' } }) === false);
