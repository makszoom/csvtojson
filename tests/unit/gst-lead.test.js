'use strict';
/* Ответ на длинный хвост — в начале страницы, а не в FAQ.

Найдено фильтром GSC «9+ слов» 18.11.2026 (приём: regex ^(?:\S+\s+){7,}\S+$
показывает запросы из девяти и более слов — их люди формулируют как вопрос
к ChatGPT). По csv-to-json таких пять, и все про одно:

  excel to json converter for gstr 1 latest version   115 показов / 6 кл / поз 6
  how to convert excel file to json for gst            24 / 0 / поз 7
  how to convert excel to json file for gst            16 / 0 / поз 9
  how to create json file from excel for gstr1          6 / 0 / поз 9
  how to convert excel to json in gst offline tool       5 / 0 / поз 7

161 показ — это 7% всех показов сайта. Позиции 6–9, то есть первый экран выдачи,
но CTR 5.2%: сниппет обещает не то, что человек спросил. Ответ про «latest version»
лежал только в FAQ в самом низу страницы (позиция ~18000 из 20000 символов).
*/
//
// Работает через общий _harness. Собственный process.exit в конце файла убивает
// процесс до summary('UNIT') — та же ошибка, что была в seo-contract.test.js:
// проверки работают, а итоговая строка всех unit-тестов не печатается.
const fs = require('fs');
const path = require('path');
const { ok, ROOT } = require('./_harness');

const html = fs.readFileSync(path.join(ROOT, 'seo', 'csv-to-json-for-gst.html'), 'utf8');

// Текст первого экрана: от конца H1 до первого H2
const h1End = html.indexOf('</h1>');
const firstH2 = html.indexOf('<h2', h1End);
const lead = html.slice(h1End, firstH2);
const leadText = lead.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// --- 1. Ответ про версию есть в первом экране ----------------------------
ok('в начале страницы есть слово version',
    /version/i.test(leadText), leadText.slice(0, 200));
ok('в начале сказано, что Offline Tool для конвертации не нужен',
    /(offline tool)/i.test(leadText) &&
    /(do(es)?n.t need|no need|not needed|without|none is needed|not required)/i.test(leadText),
    leadText.slice(0, 240));
ok('в начале объяснено, где смотреть актуальную версию',
    /(downloads|gst portal)/i.test(leadText), leadText.slice(0, 240));

// --- 2. Ответ не обещает портал-готовый JSON ----------------------------
// Правило проекта: портал принимает только JSON схемы официального тула.
ok('начало не обещает JSON для портала',
    !/(portal[- ]ready|json for the (gst )?portal)/i.test(leadText), leadText.slice(0, 200));

// --- 3. Первый экран не превратился в простыню -------------------------
const leadWords = leadText.split(/\s+/).filter(Boolean).length;
ok('первый экран короче 110 слов (читается за секунды)', leadWords <= 110, `${leadWords} слов`);

// --- 4. Интент «how to convert» тоже закрыт наверху --------------------
// Три запроса из пяти начинаются с how to convert — ответ должен быть выше FAQ.
const howToPos = html.search(/How to convert Excel to JSON for GST/i);
const faqPos = html.indexOf('Frequently Asked Questions');
ok('блок «how to convert» есть на странице', howToPos > 0);
ok('блок «how to convert» стоит выше FAQ', howToPos > 0 && faqPos > 0 && howToPos < faqPos,
    `how-to на ${howToPos}, FAQ на ${faqPos}`);
