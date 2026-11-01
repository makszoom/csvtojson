/* Разбор CSV тем же PapaParse, что на сайте, + наше приведение типов. */
const { ok, eq } = require('./_harness');
const Papa = require('../../vendor/papaparse.min.js');
const Core = require('../../js/core.js');

const parse = (text, cfg) => Papa.parse(text, Object.assign({ skipEmptyLines: true }, cfg || {})).data;

function toObjects(text, cfg) {
    const res = Papa.parse(text, Object.assign({ header: true, skipEmptyLines: true, dynamicTyping: false }, cfg || {}));
    return Core.castRows(res.data, {});
}

console.log('\n[csv-parse.test.js] CSV-фикстуры');

eq('BOM в начале файла не ломает первую колонку',
   parse('\ufeffname,age\nAnn,5')[0], ['name', 'age']);

eq('автоопределение точки с запятой',
   parse('name;age\nAnn;5', { delimiter: '' })[0], ['name', 'age']);

eq('кавычки с запятой внутри поля',
   parse('name,note\n"Ann","a, b"')[1], ['Ann', 'a, b']);

eq('CRLF-переводы строк',
   parse('a,b\r\n1,2\r\n').length, 2);

eq('пустые строки выбрасываются',
   parse('a,b\n1,2\n\n\n3,4\n').length, 3);

eq('индийская выгрузка GSTR-1: счёта и HSN с ведущими нулями целы',
   toObjects('invoice_no,hsn,taxable\n00721,0401,1500.50\n00012,9999,"2,000"'),
   [ { invoice_no: '00721', hsn: '0401', taxable: 1500.5 },
     { invoice_no: '00012', hsn: '9999', taxable: '2,000' } ]);

eq('табуляция как разделитель',
   parse('a\tb\n1\t2', { delimiter: '\t' })[0], ['a', 'b']);

eq('заголовок без header -> массивы',
   parse('1,2\n3,4')[0], ['1', '2']);

ok('папапарс видит ошибку в битых кавычках',
   Papa.parse('a,b\n"unclosed,2', { header: true }).errors.length > 0);
