/* tool-embed.js — монтирует инструмент CSV→JSON на SEO-лендингах.
 *
 * Зачем: лендинги раньше были чистым текстом с кнопкой «Open converter», то есть
 * человек из Google делал лишний клик. Теперь конвертер стоит прямо на странице.
 *
 * Как: разметка живёт в js/tool-markup.js (генерируется из index.html скриптом
 * scripts/build-tool-markup.py), вендоры и js/app.js грузятся ПОСЛЕ вставки разметки
 * и строго по порядку (async=false), чтобы app.js увидел все элементы.
 *
 * Подключение на странице:
 *   <div id="toolMount" data-variant="gst"></div>
 *   <script src="js/tool-markup.js"></script>
 *   <script src="js/tool-embed.js"></script>
 */
(function () {
    'use strict';

    var mount = document.getElementById('toolMount');
    if (!mount) return;
    if (mount.getAttribute('data-mounted') === '1') return;

    var markup = window.CSVtoJSON_MARKUP;
    if (!markup) {
        // Без разметки ничего не делаем — лучше пустое место, чем битый блок.
        mount.setAttribute('data-mount-error', 'no-markup');
        return;
    }

    mount.setAttribute('data-mounted', '1');
    mount.innerHTML = markup;

    var variant = mount.getAttribute('data-variant') || 'full';
    mount.setAttribute('data-variant-applied', variant);

    applyVariant(variant);

    // Вендоры и приложение — по порядку. async=false сохраняет порядок вставки.
    var scripts = [
        'vendor/papaparse.min.js',
        'vendor/jszip.min.js',
        'vendor/highlight.min.js',
        'vendor/highlight-json.min.js',
        'js/core.js',
        'js/read-table.js',
        'js/xlsx-loader.js',
        'js/metrics.js',
        'js/app.js'
    ];
    scripts.forEach(function (src) {
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onerror = function () {
            mount.setAttribute('data-load-error', src);
        };
        document.head.appendChild(s);
    });

    function applyVariant(name) {
        var fileInput = mount.querySelector('#fileInput');
        if (fileInput) fileInput.setAttribute('multiple', 'multiple');

        var header = mount.querySelector('.drop-zone-text');
        var sub = mount.querySelector('.drop-zone-subtext');

        if (name === 'gst') {
            if (header) header.textContent = 'Drop your GSTR-1 CSV or Excel file';
            if (sub) sub.textContent = 'Exports from the GST Offline Tool, Tally or Excel · nothing is uploaded';
        } else if (name === 'nested') {
            if (header) header.textContent = 'Drop the CSV you want to nest';
            if (sub) sub.textContent = 'address.city becomes {"address":{"city":…}} · runs in your browser';
            var nested = mount.querySelector('#nestedMapping');
            if (nested) {
                nested.value = 'true';
                nested.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else if (name === 'batch') {
            if (header) header.textContent = 'Drop multiple CSV files at once';
            if (sub) sub.textContent = 'Every file becomes its own JSON · download as ZIP or one merged array';
        }
    }
})();
