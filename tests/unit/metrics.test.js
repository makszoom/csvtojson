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
   Object.keys(M.buildPayload('page_view', '/')).every((k) => ['e', 'p', 't'].includes(k)));

// по умолчанию (endpoint пустой) — молчим, никаких запросов
ok('пока endpoint не задан, счётчик выключен', M.isEnabled() === false);
ok('track() при выключенном счётчике возвращает false', M.track('page_view', {}) === false);

// DNT
ok('Do Not Track = 1 отключает отправку', M.dntEnabled({ doNotTrack: '1' }) === true);
ok('Global Privacy Control отключает отправку', M.dntEnabled({ globalPrivacyControl: true }) === true);
ok('обычный браузер считается', M.dntEnabled({ doNotTrack: null }) === false);

// включённый счётчик шлёт ровно то, что задумано
let sent = null;
const fakeNav = { doNotTrack: null, sendBeacon: (url, blob) => { sent = { url: url, blob: blob }; return true; } };
M.setEndpoint('https://example.workers.dev/t');
ok('endpoint включил счётчик', M.isEnabled() === true);
ok('track отправляет beacon', M.track('paywall_shown', { path: '/index.html', navigator: fakeNav }) === true);
ok('URL отправки — наш воркер', sent && sent.url === 'https://example.workers.dev/t', JSON.stringify(sent && sent.url));
ok('невалидное событие не отправляется', M.track('hack', { navigator: fakeNav }) === false);
ok('DNT блокирует отправку при включённом endpoint',
   M.track('page_view', { navigator: { doNotTrack: '1' } }) === false);
