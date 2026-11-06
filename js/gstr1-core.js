/* gstr1-core.js — раскладка GSTR-1 JSON по листам Excel. Без DOM, тестируется в node.
 *
 * Зачем: портал и offline utility отдают GSTR-1 одним JSON с вложенными
 * массивами, в котором невозможно ни посчитать, ни проверить ничего глазами.
 * Здесь JSON разворачивается в плоские таблицы по секциям — по строке на item,
 * потому что в одном инвойсе могут быть разные ставки, и агрегировать их в одну
 * строку значит потерять ставку.
 *
 * Правила, заложенные осознанно:
 *  - данные НЕ переписываются: дата остаётся в формате портала (DD-MM-YYYY),
 *    номер инвойса и HSN — строками (ведущий ноль в HSN — реальные данные);
 *  - числовые поля приводятся к числу (иначе в Excel попадут текстом и не суммируются);
 *  - пустые секции не создают лист (пустой лист в книге — мусор для бухгалтера);
 *  - Summary пересчитывается из строк, а не берётся из JSON: у портала в JSON
 *    нет итогов, а сверять надо именно их.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.CSVtoJSONGstr1 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    /* Числовое поле: пустое -> null (пустая ячейка), число -> число,
       строка с числом -> число, остальное -> как есть. */
    function num(v) {
        if (v === null || v === undefined || v === '') return null;
        if (typeof v === 'number') return isFinite(v) ? v : null;
        if (typeof v === 'string') {
            var t = v.trim();
            if (t === '') return null;
            var n = Number(t);
            return isNaN(n) ? v : n;
        }
        return v;
    }

    function text(v) {
        if (v === null || v === undefined) return '';
        return String(v);
    }

    function arr(v) {
        return Array.isArray(v) ? v : [];
    }

    /* ── сборщики строк по секциям ────────────────────────────────────────
       Каждый возвращает массив массивов значений в порядке cols. */

    function collectB2B(j, amend) {
        var out = [], key = amend ? 'b2ba' : 'b2b';
        arr(j[key]).forEach(function (party) {
            arr(party.inv).forEach(function (inv) {
                var itms = arr(inv.itms);
                if (!itms.length) itms = [{}];
                itms.forEach(function (itm) {
                    var d = itm.itm_det || {};
                    var row = [text(party.ctin), text(inv.inv_typ), text(inv.inum), text(inv.idt),
                        num(inv.val), text(inv.pos), text(inv.rchrg), num(itm.num),
                        num(d.rt), num(d.txval), num(d.iamt), num(d.camt), num(d.samt), num(d.csamt)];
                    if (amend) row = row.concat([text(inv.oinum), text(inv.oidt)]);
                    out.push(row);
                });
            });
        });
        return out;
    }

    function collectB2CL(j, amend) {
        var out = [], key = amend ? 'b2cla' : 'b2cl';
        arr(j[key]).forEach(function (blk) {
            arr(blk.inv).forEach(function (inv) {
                var itms = arr(inv.itms);
                if (!itms.length) itms = [{}];
                itms.forEach(function (itm) {
                    var d = itm.itm_det || {};
                    var row = [text(blk.pos), text(inv.inum), text(inv.idt), num(inv.val), num(itm.num),
                        num(d.rt), num(d.txval), num(d.iamt), num(d.camt), num(d.samt), num(d.csamt)];
                    if (amend) row = row.concat([text(inv.oinum), text(inv.oidt)]);
                    out.push(row);
                });
            });
        });
        return out;
    }

    function collectB2CS(j, amend) {
        var out = [], key = amend ? 'b2csa' : 'b2cs';
        arr(j[key]).forEach(function (s) {
            var row = [text(s.pos), text(s.sply_ty), text(s.typ), num(s.rt), num(s.txval),
                num(s.iamt), num(s.camt), num(s.samt), num(s.csamt)];
            if (amend) row = row.concat([text(s.omon), text(s.oyear)]);
            out.push(row);
        });
        return out;
    }

    function collectCDNR(j, amend) {
        var out = [], key = amend ? 'cdnra' : 'cdnr';
        arr(j[key]).forEach(function (party) {
            arr(party.nt).forEach(function (nt) {
                var inv = nt.inv || {};
                var itms = arr(nt.itms);
                if (!itms.length) itms = [{}];
                itms.forEach(function (itm) {
                    var d = itm.itm_det || {};
                    var row = [text(party.ctin), text(nt.nt_num), text(nt.nt_dt), text(nt.typ),
                        text(inv.inum), text(inv.idt), num(inv.val), num(itm.num),
                        num(d.rt), num(d.txval), num(d.iamt), num(d.camt), num(d.samt), num(d.csamt)];
                    if (amend) row = row.concat([text(nt.ont_num), text(nt.ont_dt)]);
                    out.push(row);
                });
            });
        });
        return out;
    }

    function collectCDNUR(j, amend) {
        var out = [], key = amend ? 'cdnura' : 'cdnur';
        arr(j[key]).forEach(function (nt) {
            var itms = arr(nt.itms);
            if (!itms.length) itms = [{}];
            itms.forEach(function (itm) {
                var d = itm.itm_det || {};
                out.push([text(nt.typ), text(nt.nt_num), text(nt.nt_dt), num(nt.val), text(nt.urin),
                    num(itm.num), num(d.rt), num(d.txval), num(d.iamt), num(d.camt), num(d.samt), num(d.csamt)]);
            });
        });
        return out;
    }

    function collectEXP(j, amend) {
        var out = [], key = amend ? 'expa' : 'exp';
        arr(j[key]).forEach(function (blk) {
            arr(blk.inv).forEach(function (inv) {
                var itms = arr(inv.itms);
                if (!itms.length) itms = [{}];
                itms.forEach(function (itm) {
                    var d = itm.itm_det || {};
                    var row = [text(blk.exp_typ), text(inv.inum), text(inv.idt), num(inv.val), num(itm.num),
                        num(d.rt), num(d.txval), num(d.iamt), num(d.camt), num(d.samt), num(d.csamt)];
                    if (amend) row = row.concat([text(inv.oinum), text(inv.oidt)]);
                    out.push(row);
                });
            });
        });
        return out;
    }

    function collectHSN(j) {
        var out = [];
        arr((j.hsn || {}).data).forEach(function (h) {
            // hsn_sc остаётся строкой: 0401 — валидный HSN, числом он станет 401
            out.push([text(h.hsn_sc), text(h.uqc), num(h.qty), num(h.txval),
                num(h.iamt), num(h.camt), num(h.samt), num(h.csamt)]);
        });
        return out;
    }

    function collectDOC(j) {
        var out = [];
        arr((j.doc_issue || {}).doc_det).forEach(function (det) {
            arr(det.docs).forEach(function (d) {
                out.push([num(det.doc_num), text(d.from), text(d.to), num(d.totnum), num(d.cancel), num(d.net_issue)]);
            });
        });
        return out;
    }

    function collectNIL(j) {
        var out = [];
        arr((j.nil || {}).inv).forEach(function (n) {
            out.push([text(n.sply_ty), num(n.nil_amt), num(n.expt_amt), num(n.ngsup_amt)]);
        });
        return out;
    }

    function collectAT(j, amend) {
        var out = [], key = amend ? 'atadj' : 'at';
        arr(j[key]).forEach(function (blk) {
            arr(blk.itms).forEach(function (itm) {
                out.push([text(blk.pos), text(blk.sply_ty), text(blk.dif_pos || ''),
                    num(itm.rt), num(itm.ad_amt), num(itm.iamt), num(itm.camt), num(itm.samt), num(itm.csamt)]);
            });
        });
        return out;
    }

    /* ── спецификация секций: порядок как в форме GSTR-1 ──
       agg — индексы колонок taxable/igst/cgst/sgst/cess внутри строки;
       null там, где денежных сумм нет (DOC). */
    var SECTIONS = [
        {
            name: 'B2B',
            cols: ['GSTIN of recipient', 'Invoice type', 'Invoice number', 'Invoice date', 'Invoice value',
                'Place of supply', 'Reverse charge', 'Item no', 'Tax rate', 'Taxable value',
                'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 9, igst: 10, cgst: 11, sgst: 12, cess: 13 },
            collect: function (j) { return collectB2B(j, false); }
        },
        {
            name: 'B2BA',
            cols: ['GSTIN of recipient', 'Invoice type', 'Invoice number', 'Invoice date', 'Invoice value',
                'Place of supply', 'Reverse charge', 'Item no', 'Tax rate', 'Taxable value',
                'IGST', 'CGST', 'SGST', 'Cess', 'Original invoice', 'Original date'],
            agg: { taxable: 9, igst: 10, cgst: 11, sgst: 12, cess: 13 },
            collect: function (j) { return collectB2B(j, true); }
        },
        {
            name: 'B2CL',
            cols: ['Place of supply', 'Invoice number', 'Invoice date', 'Invoice value', 'Item no',
                'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 6, igst: 7, cgst: 8, sgst: 9, cess: 10 },
            collect: function (j) { return collectB2CL(j, false); }
        },
        {
            name: 'B2CLA',
            cols: ['Place of supply', 'Invoice number', 'Invoice date', 'Invoice value', 'Item no',
                'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess', 'Original invoice', 'Original date'],
            agg: { taxable: 6, igst: 7, cgst: 8, sgst: 9, cess: 10 },
            collect: function (j) { return collectB2CL(j, true); }
        },
        {
            name: 'B2CS',
            cols: ['Place of supply', 'Supply type', 'Type', 'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 4, igst: 5, cgst: 6, sgst: 7, cess: 8 },
            collect: function (j) { return collectB2CS(j, false); }
        },
        {
            name: 'B2CSA',
            cols: ['Place of supply', 'Supply type', 'Type', 'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess',
                'Original month', 'Original year'],
            agg: { taxable: 4, igst: 5, cgst: 6, sgst: 7, cess: 8 },
            collect: function (j) { return collectB2CS(j, true); }
        },
        {
            name: 'CDNR',
            cols: ['GSTIN of recipient', 'Note number', 'Note date', 'Note type', 'Against invoice',
                'Invoice date', 'Invoice value', 'Item no', 'Tax rate', 'Taxable value',
                'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 9, igst: 10, cgst: 11, sgst: 12, cess: 13 },
            collect: function (j) { return collectCDNR(j, false); }
        },
        {
            name: 'CDNRA',
            cols: ['GSTIN of recipient', 'Note number', 'Note date', 'Note type', 'Against invoice',
                'Invoice date', 'Invoice value', 'Item no', 'Tax rate', 'Taxable value',
                'IGST', 'CGST', 'SGST', 'Cess', 'Original note', 'Original date'],
            agg: { taxable: 9, igst: 10, cgst: 11, sgst: 12, cess: 13 },
            collect: function (j) { return collectCDNR(j, true); }
        },
        {
            name: 'CDNUR',
            cols: ['Note type', 'Note number', 'Note date', 'Note value', 'UR type', 'Item no',
                'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 7, igst: 8, cgst: 9, sgst: 10, cess: 11 },
            collect: function (j) { return collectCDNUR(j, false); }
        },
        {
            name: 'EXP',
            cols: ['Export type', 'Invoice number', 'Invoice date', 'Invoice value', 'Item no',
                'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 6, igst: 7, cgst: 8, sgst: 9, cess: 10 },
            collect: function (j) { return collectEXP(j, false); }
        },
        {
            name: 'EXPA',
            cols: ['Export type', 'Invoice number', 'Invoice date', 'Invoice value', 'Item no',
                'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess', 'Original invoice', 'Original date'],
            agg: { taxable: 6, igst: 7, cgst: 8, sgst: 9, cess: 10 },
            collect: function (j) { return collectEXP(j, true); }
        },
        {
            name: 'HSN',
            cols: ['HSN/SAC', 'UQC', 'Quantity', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 3, igst: 4, cgst: 5, sgst: 6, cess: 7 },
            collect: collectHSN
        },
        {
            name: 'DOC',
            cols: ['Document type', 'From', 'To', 'Total issued', 'Cancelled', 'Net issued'],
            agg: null,
            collect: collectDOC
        },
        {
            name: 'NIL',
            cols: ['Supply type', 'Nil rated', 'Exempted', 'Non-GST'],
            agg: null,
            collect: collectNIL
        },
        {
            name: 'AT',
            cols: ['Place of supply', 'Supply type', 'Differential pos', 'Tax rate', 'Advance received',
                'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 4, igst: 5, cgst: 6, sgst: 7, cess: 8 },
            collect: function (j) { return collectAT(j, false); }
        },
        {
            name: 'ATADJ',
            cols: ['Place of supply', 'Supply type', 'Differential pos', 'Tax rate', 'Advance adjusted',
                'IGST', 'CGST', 'SGST', 'Cess'],
            agg: { taxable: 4, igst: 5, cgst: 6, sgst: 7, cess: 8 },
            collect: function (j) { return collectAT(j, true); }
        }
    ];

    var SECTION_KEYS = ['b2b', 'b2ba', 'b2cl', 'b2cla', 'b2cs', 'b2csa', 'cdnr', 'cdnra',
        'cdnur', 'cdnura', 'exp', 'expa', 'hsn', 'doc_issue', 'nil', 'at', 'atadj'];

    /* Формат файла: GSTR-1 узнаём по наличию хотя бы одной его секции. */
    function detectFormat(json) {
        if (!json || typeof json !== 'object' || Array.isArray(json)) return 'unknown';
        for (var i = 0; i < SECTION_KEYS.length; i++) {
            var v = json[SECTION_KEYS[i]];
            if (Array.isArray(v)) return 'gstr1';
            if (v && typeof v === 'object') return 'gstr1';
        }
        return 'unknown';
    }

    function sumOf(rows, idx) {
        return (rows || []).reduce(function (acc, row) {
            var v = row[idx];
            return acc + (typeof v === 'number' && isFinite(v) ? v : 0);
        }, 0);
    }

    /* Summary: одна строка на секцию + TOTAL. Считается из строк, не из JSON. */
    function buildSummary(sections) {
        var rows = [['Section', 'Records', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess', 'Total tax']];
        var total = { records: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
        sections.forEach(function (sec) {
            var recs = sec.rows.length - 1;   // первая строка — заголовки, не запись
            if (recs <= 0) return;
            var a = sec.agg, taxable = 0, igst = 0, cgst = 0, sgst = 0, cess = 0;
            if (a) {
                taxable = sumOf(sec.rows, a.taxable);
                igst = sumOf(sec.rows, a.igst);
                cgst = sumOf(sec.rows, a.cgst);
                sgst = sumOf(sec.rows, a.sgst);
                cess = sumOf(sec.rows, a.cess);
            }
            rows.push([sec.name, recs, taxable, igst, cgst, sgst, cess, igst + cgst + sgst + cess]);
            total.records += recs;
            total.taxable += taxable;
            total.igst += igst;
            total.cgst += cgst;
            total.sgst += sgst;
            total.cess += cess;
        });
        rows.push(['TOTAL', total.records, total.taxable, total.igst, total.cgst, total.sgst, total.cess,
            total.igst + total.cgst + total.sgst + total.cess]);
        return rows;
    }

    /* GSTR-1 JSON -> [{name, rows, agg}], Summary первым. Пустые секции пропускаются. */
    function toSheets(json) {
        if (detectFormat(json) !== 'gstr1') {
            throw new Error('Not a GSTR-1 file: no GSTR-1 sections (b2b, b2cs, hsn…) found in the JSON');
        }
        var sections = [];
        SECTIONS.forEach(function (spec) {
            var data = spec.collect(json);
            if (!data.length) return;
            sections.push({ name: spec.name, rows: [spec.cols.slice()].concat(data), agg: spec.agg });
        });
        if (!sections.length) {
            throw new Error('This GSTR-1 file has no data rows — nothing to convert (nil return?)');
        }
        return [{ name: 'Summary', rows: buildSummary(sections), agg: null }].concat(sections);
    }

    /* Несколько файлов (месяцы) -> одна книга. Summary пересчитывается заново. */
    function mergeSheets(list) {
        var order = [], byName = {};
        (list || []).forEach(function (sheets) {
            (sheets || []).forEach(function (sheet) {
                if (sheet.name === 'Summary') return;
                if (!byName[sheet.name]) {
                    byName[sheet.name] = { name: sheet.name, rows: [sheet.rows[0].slice()], agg: sheet.agg };
                    order.push(sheet.name);
                }
                byName[sheet.name].rows = byName[sheet.name].rows.concat(sheet.rows.slice(1));
            });
        });
        if (!order.length) return [];
        // канонический порядок секций, а не порядок встречи файлов
        var canon = SECTIONS.map(function (s) { return s.name; });
        order.sort(function (a, b) { return canon.indexOf(a) - canon.indexOf(b); });
        var sections = order.map(function (n) { return byName[n]; });
        return [{ name: 'Summary', rows: buildSummary(sections), agg: null }].concat(sections);
    }

    function periodLabel(fp) {
        var s = text(fp);
        if (!/^\d{6}$/.test(s)) return '';
        var m = parseInt(s.slice(0, 2), 10);
        var y = s.slice(2);
        if (m < 1 || m > 12) return '';
        return MONTHS[m - 1] + ' ' + y;
    }

    function fileMeta(json) {
        var j = json || {};
        return {
            gstin: text(j.gstin),
            period: periodLabel(j.fp),
            version: text(j.version)
        };
    }

    return {
        detectFormat: detectFormat,
        toSheets: toSheets,
        mergeSheets: mergeSheets,
        buildSummary: buildSummary,
        periodLabel: periodLabel,
        fileMeta: fileMeta,
        SECTIONS: SECTIONS.map(function (s) { return s.name; }),
        version: '1.0.0'
    };
});
