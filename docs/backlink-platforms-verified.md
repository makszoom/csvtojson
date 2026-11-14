# Площадки для бэклинков — ПРОВЕРЕНО 14.11.2026

Проверка сделана скриптом вручную (HTTP-коды, наличие формы подачи, `rel` внешних ссылок). Не субагентом — тот сжёг 18 минут и не выдал результата. Заменяет `backlink-platforms-candidates.md` (там был непроверенный список).

## Итог одной строкой

Из 33 доменов: **22 с живой формой подачи**, 3 отдают 403 (режут ботов, но существуют), 1 мёртв, 6 без формы на главной. Dofollow-проверку прошли **4 площадки** — с них и начинать.

## Приоритет 1 — dofollow подтверждён

| Площадка | DoFollow-доля внешних ссылок | Форма подачи | Что требует |
|---|---|---|---|
| **thesaasdir.com** | **48 из 48 (100%)** | `/submit/` | email + картинки |
| **indietools.app** | 28 из 32 (87%) | `/submit` | логин + картинки |
| **zearches.com** | 22 из 28 (79%) | `/submit-website-free.php` | **email, аккаунт не нужен** («No Account Needed») |
| **tinytooltown.com** | 1 из 1 (100%, мало данных) | `/submit/` | только картинки |

## Приоритет 2 — форма есть, dofollow частичный или не мерился

| Площадка | DoFollow | Форма |
|---|---|---|
| saashub.com | 9 из 25 (36%) | `/submit/list` |
| tinystartups.com | 34 из 70 (49%) | `/submit` |
| saascity.io | не мерилось | `/live` |
| tinyhunt.dev | не мерилось | `/projects/submit` |
| toolscout.ai | не мерилось | `/submit` |
| tipseason.com | не мерилось | `/ai-tools/submit` |
| devhunt.org | не мерилось | `/login?next=submit` — нужен логин |
| startupalternatives.com | листинг глубже главной | `/submit` |
| scrolllaunch.com | не мерилось | форма на главной |
| submit.co · submitator.com · uneed.best · dayslaunch.com · launchpadly.co · getlaunchlist.com · wheretosubmit.org · tinylaunch.com | не мерилось | главная содержит форму, отдельного URL нет |

## Закрыто проверкой

| Домен | Причина |
|---|---|
| toolhublibrary.com | **404** — домен мёртв |
| alternativeto.net · theresanaiforthat.com · toolify.ai | **403** для ботов; существуют, но автоматическую подачу не примут — только руками через браузер |
| bestofai.io · futurepedia.io · free-for.dev · launchboard.dev · launchstag.com · forwardfuture.com · topstartupideas.com | нет ссылки на форму подачи с главной (у free-for.dev подача через GitHub PR — отдельный путь) |

## ВАЖНО: GitHub-списки не дают ссылочного веса

Проверено на живом HTML GitHub 14.11.2026: ссылки в README отдаются с **`rel="nofollow"`**. Обе ссылки-аналога в `awesome-json` (`alef.website`, `konklone.io`) — nofollow.

Что это значит: PR в awesome-списки дают упоминание бренда, редкий реферальный трафик и краулинговый сигнал, но **не передают PageRank**. Планировать канал как «бэклинки» нельзя. Реальные ссылки — только у dofollow-площадок из таблицы ниже.

## Состояние подачи на 14.11.2026

| Канал | Статус |
|---|---|
| **`secretGeek/AwesomeCSV`** (959★) | PR [#183](https://github.com/secretGeek/AwesomeCSV/pull/183) — open, `+1 −0` в двух файлах (README + `awesomecsv.csv`, второй является источником) |
| **`burningtree/awesome-json`** (1577★) | PR [#380](https://github.com/burningtree/awesome-json/pull/380) — open, `+1 −0`. В их CONTRIBUTING правило «не упоминать JSON в описании» — соблюдено |
| **`iAnonymous3000/awesome-privacy-tools`** (70★) | ❌ **мёртв**: последний коммит 2024-11-19, 33 открытых PR висят месяцами (включая #43 «Add AI convertly» с августа) |
| **`ripienaar/free-for-dev`** (142k★, коммит вчера) | ❌ **запрещено правилами**: «Generic developer "toolbox" sites - format converters, calculators etc, we have too many already». Плюс «we do not accept AI generated edits… we will close it without discussion» |
| **`zearches.com`** (79% dofollow) | 🟡 форма разобрана полностью, но площадка троттлит по частоте попыток. Готов скрипт `scripts/submit-zearches.py` — запускать не чаще раза в сутки |
| `thesaasdir.com` (100%), `tinytooltown.com`, `indietools.app` (87%) | ⏸ нужен email/логин Макса |

**Правило, вынесенное из этой работы:** перед PR проверять три вещи — дату последнего коммита, мержатся ли PR за последние месяцы, и нет ли в CONTRIBUTING запрета на тип продукта. Иначе работа уходит в пустоту.

## Что делать дальше

1. **zearches.com** — подача без аккаунта, 79% dofollow. `python scripts/submit-zearches.py` (есть `--dry-run`), один раз в сутки. Скрипт сам проверяет длины полей (на `differentiator` лимит 280 символов — на нём была ошибка), подставляет свежие CSRF-токены и ждёт 12 секунд.
2. **thesaasdir.com, tinytooltown.com, indietools.app** — нужен email или логин. Пакет заявки ниже готов, скриншоты снимаются через E2E-харнесс.
3. **GitHub PR** — два висят, ответа нет. Проверить через неделю; при отказе не спорить, а искать список с разделом, где конвертеры уместны.


## Пакет заявки (общий, под все площадки)

**Название:** CSV to JSON Converter
**Одна строка (60):** Browser-side CSV/Excel to JSON — no upload, no signup
**Короткое (160):** Convert CSV or Excel to JSON right in your browser. Nested mapping, batch + ZIP, type control. The file never leaves your machine — no upload, no account.
**Категории:** Developer Tools → Data conversion; Productivity → Utilities
**Теги:** csv, json, converter, privacy, browser-side, no-upload, excel
**URL:** https://csv-to-json.com
**Чем отличается (для модератора):** не отправляет файл на сервер ни при вставке текста, ни при drag-and-drop; nested-маппинг через dot-notation; batch + ZIP.
**Что нужно снять:** логотип 512×512, скриншот конвертера 1280×800, скриншот мобильной версии.
