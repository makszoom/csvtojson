/* core.js — чистая логика приведения типов CSV→JSON. Без DOM, тестируется в node.
 *
 * Зачем отдельный файл: PapaParse с dynamicTyping:true превращает "00721" в 721,
 * "0401" в 401. Для GST-аудитории это порча данных: номера счетов, HSN-коды и
 * пинкоды в индийских выгрузках почти всегда с ведущими нулями. Здесь кастинг
 * свой: всё, что похоже на идентификатор, остаётся строкой.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.CSVtoJSONCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var LEADING_ZERO = /^[-+]?0\d+$/;           // 00721, 0401, 0123
    var LONG_DIGITS = /^[-+]?\d{16,}$/;        // длинные идентификаторы, номера карт
    var PLAIN_NUMBER = /^[-+]?(\d+(\.\d+)?|\.\d+)$/;

    function isLeadingZeroNumber(v) { return typeof v === 'string' && LEADING_ZERO.test(v.trim()); }
    function isLongDigits(v) { return typeof v === 'string' && LONG_DIGITS.test(v.trim()); }

    /* Приведение одного значения «как есть, если это идентификатор». */
    function smartCast(value) {
        if (typeof value !== 'string') return value;
        var v = value.trim();
        if (v === '') return value;
        if (LEADING_ZERO.test(v)) return value;
        if (LONG_DIGITS.test(v)) return value;
        if (PLAIN_NUMBER.test(v)) return Number(v);
        if (/^true$/i.test(v)) return true;
        if (/^false$/i.test(v)) return false;
        if (/^null$/i.test(v)) return null;
        return value;
    }

    /* Ручной тип колонки из UI. 'auto' = smartCast. */
    function castValue(value, type) {
        if (value === null || value === undefined) return value;
        switch (type) {
            case 'string':
                return String(value);
            case 'number': {
                if (value === '') return value;
                var num = Number(value);
                return isNaN(num) ? value : num;
            }
            case 'boolean':
                if (value === true || value === 'true' || value === '1' || value === 'yes') return true;
                if (value === false || value === 'false' || value === '0' || value === 'no') return false;
                return value;
            case 'null':
                return null;
            case 'auto':
            default:
                return smartCast(value);
        }
    }

    /* Одна строка данных с учётом типов колонок. */
    function castRow(row, columnTypes) {
        var out = {}, k, t;
        for (k in row) {
            if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
            t = (columnTypes && columnTypes[k]) || 'auto';
            out[k] = castValue(row[k], t);
        }
        return out;
    }

    /* Колонки, которые обязаны остаться строковыми: если хотя бы одно значение
       в колонке выглядит как идентификатор с ведущим нулём (00721, 0401), то и
       остальные значения этой колонки — строки. Иначе в одной колонке HSN
       получается "0401" (строка) и 9999 (число) — худший вариант для выгрузки. */
    function inferStringColumns(rows, columnTypes) {
        var force = {};
        (rows || []).forEach(function (row) {
            if (!row || typeof row !== 'object') return;
            for (var k in row) {
                if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
                if (columnTypes && columnTypes[k] && columnTypes[k] !== 'auto') continue;
                if (isLeadingZeroNumber(row[k])) force[k] = true;
            }
        });
        return force;
    }

    /* Кастинг набора строк с учётом колоночных правил. */
    function castRows(rows, columnTypes) {
        var force = inferStringColumns(rows, columnTypes);
        return (rows || []).map(function (row) {
            if (!row || typeof row !== 'object') return row;
            var out = {}, k, t;
            for (k in row) {
                if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
                t = (columnTypes && columnTypes[k]) || 'auto';
                if (t === 'auto' && force[k] && row[k] !== null && row[k] !== undefined) {
                    out[k] = String(row[k]);
                } else {
                    out[k] = castValue(row[k], t);
                }
            }
            return out;
        });
    }

    /* Нужен ли кастинг вообще: включена детекция типов или заданы ручные типы. */
    function needsCast(typeDetectionOn, columnTypes) {
        if (typeDetectionOn) return true;
        if (!columnTypes) return false;
        return Object.keys(columnTypes).some(function (k) { return columnTypes[k] && columnTypes[k] !== 'auto'; });
    }

    return {
        smartCast: smartCast,
        castValue: castValue,
        castRow: castRow,
        castRows: castRows,
        inferStringColumns: inferStringColumns,
        needsCast: needsCast,
        isLeadingZeroNumber: isLeadingZeroNumber,
        isLongDigits: isLongDigits,
        version: '1.0.0'
    };
});
