/* Приведение типов: главное — не портить идентификаторы (GST/HSN/номера счетов). */
const { ok, eq } = require('./_harness');
const Core = require('../../js/core.js');

console.log('\n[core.test.js] приведение типов');

eq('ведущий ноль остаётся строкой (номер счёта)', Core.smartCast('00721'), '00721');
eq('HSN-код 0401 не превращается в 401', Core.smartCast('0401'), '0401');
eq('обычное число становится числом', Core.smartCast('721'), 721);
eq('дробное', Core.smartCast('1.50'), 1.5);
eq('отрицательное', Core.smartCast('-0.5'), -0.5);
eq('число с пробелами по краям', Core.smartCast(' 42 '), 42);
eq('строка с запятой как разделителем тысяч — не число', Core.smartCast('1,234'), '1,234');
eq('true -> boolean', Core.smartCast('true'), true);
eq('FALSE -> boolean', Core.smartCast('false'), false);
eq('null-строка', Core.smartCast('null'), null);
eq('пустая строка не трогается', Core.smartCast(''), '');
eq('GSTIN остаётся строкой', Core.smartCast('27AAPFU0939F1ZV'), '27AAPFU0939F1ZV');
eq('16+ цифр остаются строкой', Core.smartCast('1234567890123456'), '1234567890123456');
eq('уже число не пересчитывается', Core.smartCast(5), 5);
eq('null не падает', Core.smartCast(null), null);

ok('isLeadingZeroNumber("00721")', Core.isLeadingZeroNumber('00721') === true);
ok('isLeadingZeroNumber("721") === false', Core.isLeadingZeroNumber('721') === false);
ok('isLongDigits 16 знаков', Core.isLongDigits('1234567890123456') === true);

eq('castValue number — ручной выбор пользователя уважаем', Core.castValue('00721', 'number'), 721);
eq('castValue string', Core.castValue(42, 'string'), '42');
eq('castValue null', Core.castValue('что угодно', 'null'), null);
eq('castValue auto = smartCast', Core.castValue('0401', 'auto'), '0401');

eq('castRow: колонки с ведущими нулями целы',
   Core.castRow({ inv: '00721', hsn: '0401', amount: '1500', note: 'x' }, {}),
   { inv: '00721', hsn: '0401', amount: 1500, note: 'x' });

eq('castRow: ручной тип колонки переопределяет',
   Core.castRow({ n: '00721' }, { n: 'number' }).n, 721);

// ── правила уровня колонки ──
const mixed = [{ hsn: '0401', qty: '5' }, { hsn: '9999', qty: '7' }];
eq('смешанная колонка HSN целиком остаётся строковой',
   Core.castRows(mixed, {}).map(r => r.hsn), ['0401', '9999']);
eq('числовая колонка без ведущих нулей остаётся числами',
   Core.castRows(mixed, {}).map(r => r.qty), [5, 7]);
eq('inferStringColumns находит только проблемную колонку',
   Core.inferStringColumns(mixed, {}), { hsn: true });
eq('ручной тип колонки сильнее авто-вывода',
   Core.castRows(mixed, { hsn: 'number' }).map(r => r.hsn), [401, 9999]);
eq('castRows не падает на пустом массиве', Core.castRows([], {}), []);

ok('needsCast выключен без детекции и без ручных типов', Core.needsCast(false, {}) === false);
ok('needsCast включён детекцией', Core.needsCast(true, {}) === true);
ok('needsCast включён ручным типом', Core.needsCast(false, { a: 'number' }) === true);
ok('needsCast игнорирует auto', Core.needsCast(false, { a: 'auto' }) === false);
