/* metrics.js — анонимный счётчик воронки.
 *
 * Что отправляем: имя события, путь страницы, дата. Всё.
 * Чего НЕ отправляем: IP (его и не знаем), User-Agent, cookie, содержимое файлов,
 * идентификатор пользователя. Поэтому privacy-обещание сайта остаётся правдой —
 * это не «третий лицо-аналитика», а собственный счётчик на собственном воркере.
 *
 * Пока METRICS_URL пустой — счётчик молчит (никаких сетевых запросов).
 * Заполняется после деплоя воркера csvtojson-metrics.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.CSVtoJSONMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var METRICS_URL = '';   // например 'https://csvtojson-metrics.makszoom85.workers.dev/t'

    var EVENTS = ['page_view', 'file_loaded', 'convert_click', 'download_click', 'paywall_shown', 'payment_verified'];

    function isEnabled() {
        return !!METRICS_URL;
    }

    /* Уважаем Do Not Track: если человек попросил не считать — не считаем. */
    function dntEnabled(nav) {
        var n = nav || (typeof navigator !== 'undefined' ? navigator : null);
        if (!n) return false;
        return n.doNotTrack === '1' || n.msDoNotTrack === '1' || n.globalPrivacyControl === true;
    }

    function buildPayload(event, path, extra) {
        var payload = { e: String(event || ''), p: String(path || '/').slice(0, 120) };
        if (extra && extra.type) payload.t = String(extra.type).slice(0, 8);
        return payload;
    }

    function isValidEvent(event) {
        return EVENTS.indexOf(String(event)) !== -1;
    }

    /* Отправка. sendBeacon переживает уход со страницы; fetch keepalive — запасной путь. */
    function track(event, opts) {
        opts = opts || {};
        if (!isValidEvent(event)) return false;
        if (!isEnabled()) return false;
        if (dntEnabled(opts.navigator)) return false;
        // navigator/fetch можно подставить явно — так модуль тестируется без браузера


        var payload = buildPayload(event, opts.path || (typeof location !== 'undefined' ? location.pathname : '/'), opts.extra);
        var body = JSON.stringify(payload);
        var nav = opts.navigator || (typeof navigator !== 'undefined' ? navigator : null);
        var doFetch = opts.fetchImpl || (typeof fetch === 'function' ? fetch : null);

        try {
            if (nav && typeof nav.sendBeacon === 'function') {
                var blob = new Blob([body], { type: 'application/json' });
                if (nav.sendBeacon(METRICS_URL, blob)) return true;
            }
            if (doFetch) {
                doFetch(METRICS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body,
                    keepalive: true,
                    mode: 'cors'
                }).catch(function () {});
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    return {
        track: track,
        isEnabled: isEnabled,
        isValidEvent: isValidEvent,
        buildPayload: buildPayload,
        dntEnabled: dntEnabled,
        EVENTS: EVENTS.slice(),
        setEndpoint: function (url) { METRICS_URL = String(url || ''); },
        version: '1.0.0'
    };
});
