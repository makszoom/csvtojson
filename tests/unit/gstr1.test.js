/* GSTR-1 JSON -> Excel: чистая логика раскладки по секциям.
   Тесты написаны ДО реализации (RED). Фикстура — реальная схема GSTR-1:
   один инвойс с двумя item'ами разных ставок (главный кейс аудита),
   ведущий ноль в HSN, amendments, nil, doc_issue. */
const { ok, eq, throws } = require('./_harness');
const G = require('../../js/gstr1-core.js');
const XLSX = require('../../vendor/xlsx.full.min.js');

console.log('\n[gstr1.test.js] GSTR-1 JSON -> Excel (секции, суммы, merge)');

// ── фикстура: то, что портал отдаёт в JSON ──
const GSTR1 = {
    gstin: '27AAPFU0939F1ZV',
    fp: '032026',
    version: 'GST3.2.0',
    b2b: [{
        ctin: '27AAACR5055K1Z7', cfs: 'N', chksum: 'abc',
        inv: [{
            inum: 'INV/001', idt: '01-03-2026', val: 1180, pos: '27',
            rchrg: 'N', inv_typ: 'R', etin: '',
            itms: [
                { num: 1, itm_det: { rt: 18, txval: 500, iamt: 90, camt: 0, samt: 0, csamt: 0 } },
                { num: 2, itm_det: { rt: 12, txval: 500, iamt: 0, camt: 30, samt: 30, csamt: 0 } }
            ]
        }]
    }],
    b2cs: [{ pos: '27', sply_ty: 'INTER', rt: 18, typ: 'OE', txval: 1000, iamt: 180, camt: 0, samt: 0, csamt: 0 }],
    b2cl: [{
        pos: '29',
        inv: [{ inum: 'B2CL/9', idt: '05-03-2026', val: 300000, itms: [{ num: 1, itm_det: { rt: 18, txval: 254237, iamt: 45763, csamt: 0 } }] }]
    }],
    cdnr: [{
        ctin: '27AAACR5055K1Z7',
        nt: [{
            nt_num: 'CN/1', nt_dt: '10-03-2026', typ: 'C', val: 118,
            inv: { inum: 'INV/001', idt: '01-03-2026', val: 1180 },
            itms: [{ num: 1, itm_det: { rt: 18, txval: 100, iamt: 18, csamt: 0 } }]
        }]
    }],
    exp: [{
        exp_typ: 'WOPAY',
        inv: [{ inum: 'EXP/1', idt: '20-03-2026', val: 5000, itms: [{ num: 1, itm_det: { rt: 0, txval: 5000, csamt: 0 } }] }]
    }],
    hsn: {
        data: [
            { num: 1, hsn_sc: '0401', uqc: 'OTH', qty: 1, txval: 500, iamt: 90, camt: 0, samt: 0, csamt: 0 },
            { num: 2, hsn_sc: '6109', uqc: 'PCS', qty: 3, txval: 500, iamt: 0, camt: 30, samt: 30, csamt: 0 }
        ]
    },
    doc_issue: { doc_det: [{ doc_num: 1, docs: [{ num: 1, from: 'INV/001', to: 'INV/050', totnum: 50, cancel: 2, net_issue: 48 }] }] },
    nil: { inv: [{ sply_ty: 'INTRB2B', nil_amt: 0, expt_amt: 0, ngsup_amt: 0 }] }
};

// ── определение формата ──
eq('GSTR-1 распознан', G.detectFormat(GSTR1), 'gstr1');
eq('пустой объект не GSTR-1', G.detectFormat({}), 'unknown');
eq('мусор не GSTR-1', G.detectFormat(null), 'unknown');
eq('JSON без gstin/fp но с b2b — тоже GSTR-1', G.detectFormat({ b2b: [] }), 'gstr1');
eq('GSTR-3B (без b2b) не принимается за GSTR-1', G.detectFormat({ gstin: '27AAPFU0939F1ZV', fp: '032026', sup_details: {} }), 'unknown');

// ── листы ──
const sheets = G.toSheets(GSTR1);
const names = sheets.map(s => s.name);
ok('первый лист — Summary', names[0] === 'Summary', names.join(','));
ok('есть лист B2B', names.includes('B2B'), names.join(','));
ok('есть лист B2CS', names.includes('B2CS'));
ok('есть лист B2CL', names.includes('B2CL'));
ok('есть лист CDNR', names.includes('CDNR'));
ok('есть лист EXP', names.includes('EXP'));
ok('есть лист HSN', names.includes('HSN'));
ok('есть лист DOC', names.includes('DOC'));
ok('есть лист NIL', names.includes('NIL'));
ok('пустых секций (AT, ATADJ, B2BA) в листах нет', !names.includes('AT') && !names.includes('ATADJ') && !names.includes('B2BA'), names.join(','));

const sheetOf = n => sheets.find(s => s.name === n);

// ── B2B: строка на item, а не на инвойс ──
const b2b = sheetOf('B2B');
eq('B2B: заголовки', b2b.rows[0], ['GSTIN of recipient', 'Invoice type', 'Invoice number', 'Invoice date', 'Invoice value', 'Place of supply', 'Reverse charge', 'Item no', 'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess']);
eq('B2B: два item = две строки данных', b2b.rows.length - 1, 2);
eq('B2B: первая строка — item 1', b2b.rows[1].slice(0, 9), ['27AAACR5055K1Z7', 'R', 'INV/001', '01-03-2026', 1180, '27', 'N', 1, 18]);
eq('B2B: ставка 12 во второй строке', b2b.rows[2][8], 12);
ok('B2B: сумма осталась числом, не строкой', b2b.rows[1][9] === 500, typeof b2b.rows[1][9]);
ok('B2B: дата не переписана (как в источнике)', b2b.rows[1][3] === '01-03-2026', b2b.rows[1][3]);

// ── HSN: ведущий ноль сохраняется как строка ──
const hsn = sheetOf('HSN');
eq('HSN: заголовки', hsn.rows[0], ['HSN/SAC', 'UQC', 'Quantity', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess']);
ok('HSN 0401 остался строкой с нулём', hsn.rows[1][0] === '0401', JSON.stringify(hsn.rows[1][0]));
ok('HSN 6109 остался строкой', hsn.rows[2][0] === '6109', JSON.stringify(hsn.rows[2][0]));

// ── CDNR: берём из nt[], номер/дата — из note, а не из счёта ──
const cdnr = sheetOf('CDNR');
eq('CDNR: заголовки', cdnr.rows[0], ['GSTIN of recipient', 'Note number', 'Note date', 'Note type', 'Against invoice', 'Invoice date', 'Invoice value', 'Item no', 'Tax rate', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess']);
eq('CDNR: номер кредит-ноты', cdnr.rows[1][1], 'CN/1');
eq('CDNR: дата кредит-ноты', cdnr.rows[1][2], '10-03-2026');
eq('CDNR: ссылка на исходный счёт', cdnr.rows[1][4], 'INV/001');

// ── DOC ──
const doc = sheetOf('DOC');
eq('DOC: заголовки', doc.rows[0], ['Document type', 'From', 'To', 'Total issued', 'Cancelled', 'Net issued']);
eq('DOC: одна строка на интервал', doc.rows.length - 1, 1);
eq('DOC: значения интервала', doc.rows[1], [1, 'INV/001', 'INV/050', 50, 2, 48]);

// ── NIL ──
const nil = sheetOf('NIL');
eq('NIL: заголовки', nil.rows[0], ['Supply type', 'Nil rated', 'Exempted', 'Non-GST']);
eq('NIL: строка', nil.rows[1], ['INTRB2B', 0, 0, 0]);

// ── Summary: суммы должны сходиться ──
const sum = sheetOf('Summary');
eq('Summary: заголовки', sum.rows[0], ['Section', 'Records', 'Taxable value', 'IGST', 'CGST', 'SGST', 'Cess', 'Total tax']);
const rowOf = sec => sum.rows.find(r => r[0] === sec);
ok('Summary: строка B2B есть', !!rowOf('B2B'));
eq('Summary B2B: 2 записи', rowOf('B2B')[1], 2);
eq('Summary B2B: taxable 1000', rowOf('B2B')[2], 1000);
eq('Summary B2B: IGST 90', rowOf('B2B')[3], 90);
eq('Summary B2B: CGST 30, SGST 30', [rowOf('B2B')[4], rowOf('B2B')[5]], [30, 30]);
eq('Summary B2B: total tax = 150', rowOf('B2B')[7], 150);
eq('Summary HSN: total tax 150', rowOf('HSN')[7], 150);
ok('Summary: строка TOTAL последняя', sum.rows[sum.rows.length - 1][0] === 'TOTAL', JSON.stringify(sum.rows[sum.rows.length - 1]));
eq('Summary TOTAL: IGST = 90 (B2B) + 180 (B2CS) + 45763 (B2CL) + 18 (CDNR) + 90 (HSN)', sum.rows[sum.rows.length - 1][3], 90 + 180 + 45763 + 18 + 90);

// ── ошибки ──
throws('не-GSTR-1 JSON -> исключение', () => G.toSheets({ foo: 1 }));
throws('null -> исключение', () => G.toSheets(null));
try { G.toSheets({ foo: 1 }); } catch (e) { ok('сообщение об ошибке объясняет причину', /GSTR-1/i.test(e.message), e.message); }

// ── round-trip через настоящий SheetJS: AOA не ломает числа и нули ──
const wb = XLSX.utils.book_new();
sheets.forEach(s => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.name));
const back = XLSX.utils.sheet_to_json(wb.Sheets['B2B'], { header: 1, raw: true, defval: '' });
eq('round-trip: та же первая строка данных', back[1].slice(0, 9), ['27AAACR5055K1Z7', 'R', 'INV/001', '01-03-2026', 1180, '27', 'N', 1, 18]);
const backHsn = XLSX.utils.sheet_to_json(wb.Sheets['HSN'], { header: 1, raw: true, defval: '' });
ok('round-trip: HSN 0401 не превратился в число', backHsn[1][0] === '0401', JSON.stringify(backHsn[1][0]));

// ── merge нескольких месяцев: строки складываются, Summary пересчитывается ──
const other = JSON.parse(JSON.stringify(GSTR1));
other.fp = '042026';
const merged = G.mergeSheets([sheets, G.toSheets(other)]);
const mB2b = merged.find(s => s.name === 'B2B');
eq('merge: 2 месяца -> 4 строки B2B', mB2b.rows.length - 1, 4);
ok('merge: заголовки не дублируются', mB2b.rows[1][2] === 'INV/001' && mB2b.rows[3][2] === 'INV/001');
const mSum = merged.find(s => s.name === 'Summary');
eq('merge: Summary пересчитан (B2B records = 4)', mSum.rows.find(r => r[0] === 'B2B')[1], 4);
eq('merge: TOTAL IGST удвоился', mSum.rows[mSum.rows.length - 1][3], (90 + 180 + 45763 + 18 + 90) * 2);
ok('merge пустого списка не падает', Array.isArray(G.mergeSheets([])));

// ── метаданные файла для шапки UI ──
const meta = G.fileMeta(GSTR1);
eq('meta: GSTIN', meta.gstin, '27AAPFU0939F1ZV');
eq('meta: период 032026 -> March 2026', meta.period, 'March 2026');
eq('meta: версия схемы', meta.version, 'GST3.2.0');
eq('meta: пустой объект -> пустые поля', G.fileMeta({}), { gstin: '', period: '', version: '' });
