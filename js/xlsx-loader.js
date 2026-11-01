/* xlsx-loader.js — ленивая загрузка SheetJS (952 КБ) только когда человек реально
 * кинул .xlsx. Пользователь CSV не платит за эту фичу ни байтом и ни миллисекундой.
 */
(function () {
    'use strict';
    var promise = null;
    var SRC = 'vendor/xlsx.full.min.js';

    window.loadXLSX = function () {
        if (window.XLSX) return Promise.resolve(window.XLSX);
        if (promise) return promise;
        promise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = SRC;
            s.async = true;
            s.onload = function () {
                if (window.XLSX) resolve(window.XLSX);
                else reject(new Error('модуль Excel загрузился, но не инициализировался'));
            };
            s.onerror = function () {
                promise = null;   // дать шанс повторной попытке
                reject(new Error('не удалось загрузить модуль Excel'));
            };
            document.head.appendChild(s);
        });
        return promise;
    };
})();
