# Конкуренты CSV→JSON — проверено 14.11.2026

Собрано субагентом (kimi-k3.1-pro, 16 вызовов, 267 с). Метод: чтение страниц и опубликованного JS, **без загрузки файлов и без перехвата сети** — это ограничение честно указано ниже.

Зачем: для страниц `/csv-to-json-vs-csvjson` и `/best-free-csv-to-json-converters`. Без этих данных мы бы выдумали конкурентам фичи, которых у них нет.

## Сводка

| Конкурент | Локально? | Аккаунт | Лимиты | Вход → выход | Nested | Batch | Цена |
|---|---|---|---|---|---|---|---|
| **CSVJSON** (csvjson.com) | **да**, заявлено прямо | нет: «there is no account» | не заявлены | CSV, TSV, Markdown, ChatGPT-таблицы, psql/MySQL box → JSON (+JSONL, SQL, TS) | не заявлено для CSV→JSON | не заявлено (file input `multiple=false`) | пейволла нет |
| **ConvertCSV** (convertcsv.com) | да для вставки и файла; URL читается сервером | нет: «we currently do not have user registration» | не заявлены | CSV, TSV → массив объектов, keyed JSON, JSONLines/MongoDB, по шаблону; `.xlsx` заявлен в changelog | **да**: `/` в заголовках, массивы через дубли колонок или `/0,/1` | не заявлено | онлайн бесплатно; desktop/CLI лицензии $1299 и $4999/год |
| **JSON Formatter** (jsonformatter.org) | **частично**: конвертация в браузере, но загрузка файла идёт `POST /service/uploadFile` | для базовой конвертации вход не требуется | не заявлены; Save Online без входа — 24 часа | CSV-текст, файл, URL → JSON с настраиваемыми Root/Row Level Name | не заявлено | не заявлено | пейволла нет |
| **CodeBeautify** | заявлено браузерное, но privacy прямо говорит: при file upload данные ходят между сервером и клиентом | **не определено** для базовой конвертации | **1 MB** (FAQ), рекомендуется ≤100 KB | CSV-текст, файл, URL → JSON | не заявлено | не заявлено | пейволла нет |
| **TableConvert** (tableconvert.com) | **да**, client-side | нет для веб-конвертера | **10 MB**, файлов неограниченно | `.csv`, `.tsv`, текст → JSON object arrays, 2D, column arrays, key-value, JSONLines | не заявлено | не заявлено (только в расширении/API) | веб бесплатно; API $12–79/мес |

## Цитаты

**CSVJSON**
> «No. The conversion runs entirely in your browser — nothing is uploaded, nothing is stored, nothing is logged. Files you open are read locally in the page, there is no account and no server processing.» — csvjson.com

> «Separator picks the delimiter — auto-detect covers comma, semicolon, and tab. Parse numbers is on by default with smart semantics — plain numbers like 5 or 19.99 become real JSON numbers»

**ConvertCSV**
> «If you submit data for conversions via Pasting the data or reading the data from a file, that data stays on your computer and is processed by the browser. If you submit an URL that points to data, that data is read by our servers but is not retained.» — convertcsv.com/PrivacyPolicy.htm

> «Create nested JSON output by using / in the column headings of CSV. Arrays are created from duplicate column names or /0, /1, ... in the heading.»

**JSON Formatter**
> «function csvtojson(){var t=inputEditor.getValue();outputEditor.getSession().setMode("ace/mode/json"),outputEditor.setValue(getJSONFromCSV(t))}» — csvtools-min.js (конвертация локальная)

> «var t="/service/uploadFile";...$.ajax({url:t,type:"POST",data:formdata...» — csvtools-min.js (но загрузка файла — на сервер)

> «If CSV data is saved without login, it will become public. To make CSV data private please login and save the links.»

**CodeBeautify**
> «CSV to JSON uses CSV Javascript code to only convert and process in the browser. It does not send any CSV data to the server for transformation.»

> «In case of URL loading and File upload, data traverse between server and client, but we do not store any data. In case of File upload, Files are deleted immediately or via cron job in case any file delete error.» — privacy-policy

> «1 MB. For better performance data size should be upto 100KB.» — faq

**TableConvert**
> «Absolutely! All table conversions happen locally in your browser - your data never leaves your device. Our online converter processes everything client-side, ensuring complete privacy and data security. No files are stored on our servers.»

> «Our free online table converter supports files up to 10MB.»

## Что это значит для нас

1. **«Мы работаем в браузере» больше не отличие.** CSVJSON и TableConvert заявляют то же самое прямым текстом. В vs-странице нельзя писать «мы единственные, кто не загружает файл» — это ложь, и её проверят первым же кликом.
2. **Где у них реальная дыра — загрузка файла.** JSON Formatter отправляет файл на `/service/uploadFile`, CodeBeautify честно пишет, что при file upload данные ходят через сервер, ConvertCSV читает URL сервером. То есть «браузерно» у них относится к **вставке текста**, а не к файлу. Наш аргумент должен звучать точно: *«файл не отправляется ни при каком способе ввода, включая drag-and-drop»*.
3. **Nested есть только у ConvertCSV** (через `/` в заголовках). У нас nested-маппинг с dot-notation — это реальное отличие от CSVJSON/CodeBeautify/TableConvert/JSON Formatter.
4. **Batch нет ни у кого** из пяти на бесплатных страницах. У нас batch + ZIP. Это отличие.
5. **Лимиты:** CodeBeautify 1 MB, TableConvert 10 MB, у остальных не заявлены. У нас ограничение по памяти машины.

## Что НЕ проверено (не выдавать за факт)

- Ни у одного нет указанной даты последнего обновления страницы.
- Выводы о client-side основаны на текстах, DOM и опубликованном JS; реальные загрузки файлов с перехватом сети не проводились.
- W3docs по указанному URL отдаёт 404 — вместо него проверен TableConvert.
- Для JSON Formatter и CodeBeautify нет прямого утверждения «аккаунт не нужен именно для базовой CSV→JSON» — это наблюдение по доступному интерфейсу.
- Интерактивная часть CodeBeautify была закрыта Cloudflare; JS самого CodeBeautify получить не удалось.
