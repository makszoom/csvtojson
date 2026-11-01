# CSV to JSON Converter — PLAN.md

> Browser-side CSV→JSON конвертер с nested mapping, batch обработкой и privacy-first USP.
> Методология: Игорь Зuev (1 launch = 1 function = 1 problem, USA/EU, organic SEO, zero ad spend).
> Стек: $0 — HTML/CSS/JS + PapaParse (CDN) + Web Workers + JSZip (CDN) + GitHub Pages.
> Дизайн: Apple Design CSS (встроен в style.css с первого дня, НЕ как отдельный этап)
> Оплата: USDT TRC-20 через Cloudflare Worker + Turnstile (бот-защита) + Email-чеки

---

## 0. Скиллы (инструменты для разработки)

### Критичные (применяются обязательно)

| # | Скилл | Категория | Зачем | Когда |
|---|-------|-----------|-------|-------|
| 1 | `zuev-micro-saas-launch` | business | ** Umbrella-скилл**: полный workflow запуска micro-SaaS по Зуеву. Включает Apple Design CSS (`references/apple-design-polish.css`), payment Worker template, SEO-чеклист, деплой-скрипт, AGENTS.md template | День 1–9 |
| 2 | `micro-saas-static-frontend` | software-dev | Build and deploy static HTML+CSS+JS micro-SaaS. Включает Apple Design CSS enhancement (`references/apple-design-css-enhancement.md`) — паттерн применения | День 1–8 |
| 3 | `static-site-crypto-payments` | deployment | Интеграция USDT TRC-20 в статические сайты через Cloudflare Worker — фронтенд-модалка (QR + TXID + Verify) | День 6 |
| 4 | `crypto-payment-tron-worker` | deployment | Cloudflare Worker для приёма USDT TRC-20: TronScan API + KV dedup + Telegram-уведомления | День 6 |
| 5 | `seo-landing-pages` | software-dev | Генерация SEO landing pages: HTML template engine, Python batch generator, Schema.org FAQPage + HowTo, OG/Twitter meta | День 7 |
| 6 | `github-repo-management` | github | Создание репо csvtojson, деплой на GitHub Pages | День 8 |
| 7 | `zuev-method` | business | Методология Зуева: 1 функция = 1 продукт, anti-freemium, USA/EU, organic SEO | Весь проект |
| 8 | `turnstile-spin` | cloudflare | **NEW** — Cloudflare Turnstile (бесплатная CAPTCHA). Защита TXID-формы от ботов. Vanilla HTML template = наш стек. Worker siteverify | День 6 |
| 9 | `cloudflare-email-service` | cloudflare | **NEW** — Email-чеки после $5 оплаты через `env.EMAIL.send()`. SPF/DKIM/DMARC. Дополняет Telegram-уведомления | День 6 |
| 10 | `workers-best-practices` | cloudflare | Production patterns для Worker: `crypto.subtle.timingSafeEqual()`, structured observability, `wrangler types`, streaming, floating promises | День 6 |
| 11 | `wrangler` | cloudflare | CLI: деплой Worker, KV namespace, Secrets Store, `wrangler email sending enable`, `wrangler turnstile widget create` | День 6–8 |

### Вспомогательные (по необходимости)

| # | Скилл | Категория | Зачем | Когда |
|---|-------|-----------|-------|-------|
| 12 | `execute-code` | core | Тестирование логики PapaParse, nested-mapper, batch | День 2–5 |
| 13 | `systematic-debugging` | software-dev | 4-phase root cause debugging — если что-то ломается | По мере |
| 14 | `test-driven-development` | software-dev | TDD для nested-mapper.js (killer feature) — логика dot-notation требует тестов | День 4 |
| 15 | `cloudflare` | cloudflare | Платформа: DNS для csvtojson.app, Registrar, Web Analytics | День 9 |
| 16 | `deployment` | devops | Деплой + environment verification | День 8 |
| 17 | `cronjob-patterns` | devops | Мониторинг индексации, uptime-пинги | После запуска |
| 18 | `requesting-code-review` | software-dev | Pre-commit review: security scan, quality gates | День 8 |
| 19 | `zuev-nisha-daily` | business | Cron, который нашёл нишу (92 score, 4.3/5) — для последующего поиска новых ниш | Постфактум |

### Не используются (для этого проекта)

| Скилл | Причина |
|-------|---------|
| `cloudflare-one` / `cloudflare-one-migrations` | Enterprise Zero Trust, не наш масштаб |
| `sandbox-sdk` | Code execution sandbox — для будущих AI-фич |
| `durable-objects` | B2B подписки — будущий этап (после $15/год) |
| `agents-sdk` | AI-агенты — для будущих smart-фич |
| `web-perf` | Аудит Core Web Vitals — после запуска |

### Apple Design CSS — встроен в скиллы №1 и №2

> Apple Design CSS — НЕ отдельный скилл, а **reference-файлы** внутри `zuev-micro-saas-launch` и `micro-saas-static-frontend`. Применяется с первого дня написания CSS. Пользователь явно поправил в июле 2026: "Почему Apple Design стоит на последнем этапе, хочу использовать сразу, при создании сайта."

| Принцип | CSS | Когда |
|---------|-----|-------|
| Materials & Depth | `backdrop-filter: blur(8px) saturate(180%)` на модалке | День 1 (paywall) |
| Scale-in animation | `scale(0.95)→scale(1)` + `cubic-bezier(0.16,1,0.3,1)` | День 1 (paywall) |
| Response (kill latency) | `:active { transform: scale(0.97) }` на всех кнопках | День 1 |
| Typography | `letter-spacing: -0.03em` на h1, `clamp()` responsive | День 1 |
| Scroll edges | `mask-image: linear-gradient(...)` на списках файлов | День 1 |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | День 1 |
| Reduced transparency | `@media (prefers-reduced-transparency: reduce)` | День 1 |
| Feature cards | `:active { transform: scale(0.98) }` на карточках | День 1 |

---

## 1. Почему эта ниша

| Параметр | Значение |
|-----------|---------|
| Google Suggest score | **92/100** (226 unique, 26/26 alpha-hits) |
| Сравнение с baseline | 91% от heic to jpg (baseline=100) |
| Privacy USP | ⭐⭐⭐⭐⭐ — CSV = sensitive data (финансы, клиентские базы) |
| Готовность платить | ⭐⭐⭐⭐ — B2B users, повторяющаяся потребность |
| ОС-аналог | Нет — ни Windows, ни macOS не конвертируют CSV→JSON |
| Оценка крона | **4.3/5** — сильнейший кандидат за 10 дней |

### Сегменты спроса
- **Разработчики** — `csv to json python/javascript/bash/jq` → quick solution без скрипта
- **Бухгалтеры (GST, Индия)** — `csv to json for gst/gstr1` → ежемесячная повторяющаяся задача
- **Аналитики данных** — `csv to nested json online` → продвинутый сценарий
- **Нетехнические** — `csv to json converter online free` → высокий intent

---

## 2. Конкурентный анализ

| Конкурент | Модель | Upload | Nested | Batch | Privacy |
|-----------|--------|--------|--------|-------|---------|
| csvjson.com | Free | ❌ да | ⚠️ базовый | ❌ | ❌ |
| convertcsv.com | Free + $25/6mo | ❌ да | ⚠️ базовый | ❌ | ❌ |
| onlineconverter.com | Free | ❌ да | ❌ | ❌ | ❌ |
| VS Code (Rainbow CSV) | Free | ✅ local | ❌ | ❌ | ✅ |
| Python/Node скрипты | Free | ✅ local | ✅ | ✅ | ✅ |

### Гэп (комбинация, которой нет ни у кого)
1. ✅ Browser-side (no upload) — приватность
2. ✅ Nested JSON mapping с визуальным UI (dot-notation)
3. ✅ Batch обработка множества файлов → ZIP
4. ✅ Не требует навыков программирования

> VS Code и скрипты — local, но для техников. Online — для нетехников, но upload.
> **Никто не закрывает обе аудитории одновременно.**

---

## 3. Уникальные фичи (Killer Features)

### 3.1 Nested JSON Mapping (главный дифференциатор)

Обычный конвертер (конкуренты):
```json
[{"address.city": "Moscow", "address.zip": "123456"}]
```

Наш (dot-notation):
```json
[{"address": {"city": "Moscow", "zip": "123456"}}]
```

**Реализация:** UI где пользователь указывает dot-notation для каждой колонки:
- Колонка `address.city` → nested object `address.city`
- Колонка `name` → flat key `name`
- Колонка `items.0.title` → array `items[0].title`
- Auto-detect: если колонка содержит точку → предложить nested mapping

### 3.2 Batch обработка
- Drag multiple CSV files → каждый конвертируется в JSON
- Скачать все как ZIP (JSZip)
- Или объединить в один JSON array

### 3.3 Smart Type Detection
- Автоопределение: number, boolean, null, string
- Toggle: включить/выключить auto-detect
- Ручное указание типа для каждой колонки

### 3.4 Privacy-First
- Всё в браузере (PapaParse + Web Workers)
- Никакого upload на сервер
- Работает offline (после загрузки страницы)
- USP: «Ваши данные никогда не покидают браузер. 0 upload. Works offline.»

---

## 4. Технический стек

| Компонент | Технология | Зачем |
|-----------|------------|-------|
| CSV парсинг | PapaParse 5.x (CDN) | Лучший CSV-парсер для браузера, streaming, fast |
| Тяжёлый парсинг | Web Workers | Не блокирует UI при больших файлах |
| Batch ZIP | JSZip (CDN) | Скачивание нескольких JSON как ZIP |
| UI | Vanilla HTML/CSS/JS | $0, никаких зависимостей, GitHub Pages |
| Подсветка JSON | highlight.js (CDN) | Превью результата |
| Хостинг | GitHub Pages | $0, HTTPS, CDN |
| Домен | csvtojson.app (или .converter) | $10/год (Cloudflare Registrar) |
| Платежи | USDT TRC-20 Worker | $0 recurring, как в ImgToPDF/PDFMerge |

**Размер:**
- PapaParse: ~44KB (gzipped)
- JSZip: ~30KB (gzipped)
- highlight.js: ~10KB (gzipped, только JSON)
- App code: ~30KB
- **Итого: ~115KB gzipped** — лёгкий, быстрый

---

## 5. Структура проекта

```
csvtojson/
├── index.html              # Главная — tool page
├── css/
│   └── style.css           # Vercel-style дизайн
├── js/
│   ├── app.js              # Core logic, UI, event handlers
│   ├── csv-worker.js       # Web Worker для парсинга
│   ├── nested-mapper.js    # Dot-notation → nested object
│   └── payment.js          # Paywall + USDT Worker
├── seo/
│   ├── csv-to-json.html            # Landing: "csv to json converter online free"
│   ├── csv-to-nested-json.html     # Landing: "csv to nested json online"
│   ├── csv-to-json-batch.html      # Landing: "csv to json batch converter"
│   ├── convert-csv-to-json.html    # Landing: "convert csv to json without upload"
│   ├── csv-to-json-for-gst.html    # Landing: B2B GST угол
│   └── data-converter-suite.html   # Landing: bundle page
├── robots.txt
├── sitemap.xml
├── PLAN.md                 # Этот файл
└── .env                    # Ключи (WORKER_URL, WALLET_ADDR) — НЕ в git
```

---

## 6. План MVP по дням

### День 1 — Базовый UI + Drop Zone
- [ ] index.html: layout (header, drop zone, preview, output, settings panel)
- [ ] CSS: Vercel-style (soft palette, glassmorphism, max-width 800px canvas)
- [ ] Drag & drop CSV файл → предпросмотр первых 5 строк
- [ ] File picker fallback (для mobile)
- [ ] Toast уведомления (copy, error, success)

### День 2 — PapaParse + базовая конверсия
- [ ] PapaParse CDN подключение
- [ ] Парсинг CSV → JSON array (каждая строка = объект)
- [ ] Превью результата с подсветкой (highlight.js)
- [ ] Скачать JSON / копировать в буфер
- [ ] Web Worker для файлов >1MB (не блокировать UI)

### День 3 — Настройки конверсии
- [ ] Delimiter: auto-detect / comma / tab / semicolon / pipe
- [ ] Header row toggle (первая строка = ключи)
- [ ] Smart Type Detection: number / boolean / null / string
- [ ] Ручной тип для колонки (dropdown в preview table)
- [ ] Quote handling (PapaParse handles, но UI toggle)

### День 4 — ⭐ Nested JSON Mapping (killer feature)
- [ ] UI: для каждой колонки — поле "JSON path" (dot-notation)
- [ ] Auto-detect: колонка содержит точку → предложить nested
- [ ] Превью результата в реальном времени при изменении mapping
- [ ] Поддержка array notation: `items.0.title` → `items[0].title`
- [ ] Reset / apply-all кнопки
- [ ] Сохранение mapping в localStorage (для повторяющихся задач)

### День 5 — Batch режим
- [ ] Drag multiple CSV files
- [ ] Каждый файл → отдельный JSON (скачать по одному или ZIP)
- [ ] Объединить в один JSON array (toggle)
- [ ] Прогресс-бар для batch
- [ ] JSZip для скачивания всех файлов как ZIP

### День 6 — Paywall + монетизация
- [ ] Счётчик: 5 бесплатных конверсий (localStorage + fingerprint)
- [ ] Paywall modal: "Unlimited lifetime — $5" (USDT TRC-20)
- [ ] Payment Worker (Cloudflare) — по аналогии с ImgToPDF
- [ ] После оплаты — разблокировка (token в localStorage)
- [ ] Bundle upsell: "Data Converter Suite — $15" (future)

### День 7 — SEO landing pages
- [ ] `csv-to-json.html` — "CSV to JSON Converter Online Free"
- [ ] `csv-to-nested-json.html` — "CSV to Nested JSON Online"
- [ ] `csv-to-json-batch.html` — "CSV to JSON Batch Converter"
- [ ] `convert-csv-to-json.html` — "Convert CSV to JSON Without Upload"
- [ ] `csv-to-json-for-gst.html` — B2B GST угол
- [ ] Schema.org (WebApplication, FAQ, HowTo)
- [ ] robots.txt + sitemap.xml
- [ ] Open Graph + Twitter Card

### День 8 — Деплой + тест + GSC
- [ ] GitHub repo: csvtojson
- [ ] GitHub Pages: username.github.io/csvtojson
- [ ] Тест: Chrome, Firefox, Edge, Safari (если доступно)
- [ ] Тест: mobile (drag→file picker, responsive CSS)
- [ ] Тест: большие файлы (10MB, 50MB) — Web Worker
- [ ] Тест: nested mapping (dot-notation)
- [ ] Тест: batch (5 файлов → ZIP)
- [ ] Google Search Console: добавление сайта
- [ ] GSC: sitemap submission
- [ ] Uptime мониторинг

### День 9 (опционально) — Домен + bundle
- [ ] Домен: csvtojson.app (Cloudflare Registrar, ~$10/год)
- [ ] CNAME → GitHub Pages
- [ ] Data Converter Suite page (JSON↔CSV, JSON↔YAML, JSON↔XML)
- [ ] Cross-linking только через main tool page

---

## 7. Монетизация

### Уровень 1: Single tool
- 5 конверсий бесплатно (или файлы до 1MB)
- Paywall → lifetime **$5** (USDT TRC-20)
- Регистрация только после оплаты

### Уровень 2: Bundle (Data Converter Suite)
- CSV↔JSON + JSON↔CSV + JSON↔YAML + JSON↔XML
- Lifetime **$15-20**
- +30% ценности за двустороннюю конверсию

### Уровень 3: B2B годовая подписка
- **$15/год** — безлимитный batch, priority
- Цель: бухгалтеры GST, аналитики
- Повторяющийся revenue

### Payment Worker
- Cloudflare Worker + KV (по аналогии с ImgToPDF)
- USDT TRC-20 (TRONLink → Bybit)
- Отдельный кошелёк для проекта (accounting)
- Telegram bot уведомление при оплате

---

## 8. SEO-стратегия

### Целевые запросы
| Запрос | Тип | Конкуренция | Intent |
|-------|-----|-------------|--------|
| csv to json converter online free | основной | средняя | высокий |
| csv to nested json online | уникальный | **низкая** | высокий |
| csv to json batch | уникальный | **низкая** | высокий |
| convert csv to json without upload | privacy-угол | низкая | высокий |
| csv to json for gst | B2B-нишевый | низкая | высокий |
| csv to json converter | короткий | высокая | средний |

### Структура landing pages
- Каждая страница = 1 keyword funnel → main tool page
- Нет cross-navigation между landing pages
- Schema.org: WebApplication, FAQ, HowTo
- Open Graph + Twitter Card для каждой страницы
- Sitemap.xml с всеми страницами

### Контент-стратегия (Зуев)
- Simple how-to videos named after search queries
- "How to convert CSV to nested JSON online"
- "How to batch convert CSV to JSON without upload"
- Embed на landing pages

---

## 9. Риски и митигация

| Риск | Уровень | Митигация |
|------|---------|-----------|
| Кажущаяся простота → найдут free аналог | Средний | Nested mapping + batch + privacy = комбинация, которой нет |
| PapaParse лимит памяти (>100MB) | Низкий | Web Workers + streaming, мягкий лимит 50MB с подсказкой |
| GST-аудитория не готова платить онлайн | Средний | Фокус US/EU, GST — доп. SEO-канал |
| Низкий LTV ($5 lifetime) | Средний | Bundle: Data Converter Suite $15-20 |
| Google нативный CSV→JSON в Sheets | Низкий | Нет в roadmap, сложнее чем image format support |
| Конкурент копирует nested mapping | Низкий | Первопроходец + SEO + бренд = moat |

---

## 10. Метрики успеха (KPI)

| Метрика | Цель (3 мес) | Цель (6 мес) |
|---------|-------------|-------------|
| Установок/посещений | 5K visits/mo | 20K visits/mo |
| Конверсия в paid | 3-5% | 5-7% |
| Revenue | $500/mo | $2,000/mo |
| Google ranking | TOP20 | TOP5-10 |
| GSC indexation | 6+ pages | 10+ pages |
| API costs | 0 (browser-side) | 0 |
| Recurring costs | $0 (GitHub Pages) | $10/yr (domain) |

---

## 11. Чеклист запуска

- [ ] PLAN.md утверждён
- [ ] GitHub repo создан
- [ ] День 1-7: MVP разработка
- [ ] День 8: Деплой на GitHub Pages
- [ ] Тест на всех браузерах + mobile
- [ ] Payment Worker развёрнут
- [ ] $5 test payment (USDT TRC-20)
- [ ] GSC: сайт добавлен, sitemap отправлен
- [ ] Домен зарегистрирован (csvtojson.app)
- [ ] Uptime мониторинг настроен
- [ ] Telegram bot уведомления подключены

---

## 12. Сравнение с предыдущими нишами крона

| Ниша | Дата | Оценка | Главная проблема |
|------|------|--------|------------------|
| WebP to JPG | 30.07 | 3/5 | 6+ free browser-side конкурентов |
| PDF Compressor | 30.07 | ~3/5 | Насыщенный рынок |
| Image tools (10 дней) | 22-30.07 | 3/5 | «No upload» = стандарт, не USP |
| **CSV to JSON** | **30.07** | **4.3/5** | **B2B + privacy + nested = уникальная комбинация** |

> CSV to JSON — первая ниша за 10 дней крона с оценкой 4+. 
> B2B-компонент и privacy-first USP отличают её от насыщенного рынка image converters.

---

*План составлен 30 июля 2026. Методология: Игорь Зуев. Стек: $0 frontend-only. USA/EU market.*