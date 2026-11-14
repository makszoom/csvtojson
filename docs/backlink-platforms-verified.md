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

## Что делать дальше

1. **zearches.com** — единственная, где подача без аккаунта (только email в форме). Проходится целиком, первый кандидат.
2. **thesaasdir.com, tinytooltown.com, indietools.app** — нужен email или логин. Подать с аккаунта Макса по готовому пакету ниже.
3. **GitHub PR в awesome-списки** (awesome-json, awesome-privacy-devtools, free-for.dev) — без аккаунтов площадок, только GitHub-токен из `.env`. Единственный канал, который закрывается полностью без участия Макса.

## Пакет заявки (общий, под все площадки)

**Название:** CSV to JSON Converter
**Одна строка (60):** Browser-side CSV/Excel to JSON — no upload, no signup
**Короткое (160):** Convert CSV or Excel to JSON right in your browser. Nested mapping, batch + ZIP, type control. The file never leaves your machine — no upload, no account.
**Категории:** Developer Tools → Data conversion; Productivity → Utilities
**Теги:** csv, json, converter, privacy, browser-side, no-upload, excel
**URL:** https://csv-to-json.com
**Чем отличается (для модератора):** не отправляет файл на сервер ни при вставке текста, ни при drag-and-drop; nested-маппинг через dot-notation; batch + ZIP.
**Что нужно снять:** логотип 512×512, скриншот конвертера 1280×800, скриншот мобильной версии.
