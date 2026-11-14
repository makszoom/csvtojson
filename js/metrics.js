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

    var METRICS_URL = 'https://csvtojson-metrics.makszoom85.workers.dev/t';

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

    /* Источник перехода: только hostname реферера, без пути, без query.
       Свой же домен источником не считается. Нужен, чтобы отличать визит
       из обсуждения (caclubindia.com) от визита из поиска — иначе канал
       не измерить. Полный URL не отправляем: в нём бывают токены и запросы. */
    function referrerHost(doc, ownHost) {
        var ref = (doc && doc.referrer) || '';
        if (!ref) return '';
        var host = '', own = '';
        try {
            host = String(new URL(ref).hostname || '').toLowerCase().replace(/^www\./, '');
            own = String(ownHost || (typeof location !== 'undefined' && location.hostname) || '')
                .toLowerCase().replace(/^www\./, '');
        } catch (e) {
            return '';
        }
        if (!host || host === own) return '';
        return host.slice(0, 60);
    }

    /* Тестовый прогон (E2E против живого сайта) не должен попадать в статистику:
       иначе цифры воронки смешиваются с прогонами робота, и замер каналов врёт.
       Метка ставится в URL: ?e2e=1 */
    function isTestTraffic(search) {
        return /[?&]e2e=1(&|$)/.test(String(search || ''));
    }

    function buildPayload(event, path, extra) {
        var payload = { e: String(event || ''), p: String(path || '/').slice(0, 120) };
        if (extra && extra.type) payload.t = String(extra.type).slice(0, 8);
        if (extra && extra.ref) payload.r = String(extra.ref).slice(0, 60);
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
        var search = opts.search !== undefined
            ? opts.search
            : (typeof location !== 'undefined' ? location.search : '');
        if (isTestTraffic(search)) return false;
        // navigator/fetch можно подставить явно — так модуль тестируется без браузера


        var extra = opts.extra || {};
        if (!extra.ref) {
            var rh = referrerHost(opts.document || (typeof document !== 'undefined' ? document : null), opts.ownHost);
            if (rh) extra = { type: extra.type, ref: rh };
        }
        var payload = buildPayload(event, opts.path || (typeof location !== 'undefined' ? location.pathname : '/'), extra);
        var body = JSON.stringify(payload);
        var nav = opts.navigator || (typeof navigator !== 'undefined' ? navigator : null);
        var doFetch = opts.fetchImpl || (typeof fetch === 'function' ? fetch : null);

        try {
            if (nav && typeof nav.sendBeacon === 'function') {
                // text/plain — CORS-safelisted тип: preflight не нужен, иначе браузер
                // молча отбрасывает beacon (Blob с application/json требует preflight)
                var blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
                if (nav.sendBeacon(METRICS_URL, blob)) return true;
            }
            if (doFetch) {
                doFetch(METRICS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
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
        referrerHost: referrerHost,
        isTestTraffic: isTestTraffic,
        dntEnabled: dntEnabled,
        EVENTS: EVENTS.slice(),
        setEndpoint: function (url) { METRICS_URL = String(url || ''); },
        version: '1.0.0'
    };
});
