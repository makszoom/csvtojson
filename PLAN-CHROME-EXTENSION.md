# CSV to JSON Chrome Extension — PLAN.md (v2 — Universal)

> Chrome Web Store расширение для конвертации CSV → JSON — универсальное, со всеми killer features.
> Цель: DR 92 backlink на csv-to-json.com + органический трафик из Store + усиление SEO сайта по ВСЕМ запросам.
> Методология: Игорь Зуев (organic SEO, zero ad spend, privacy-first USP).
> Стек: $0 — Manifest V3 + PapaParse (CDN) + Vanilla HTML/CSS/JS + Apple Design CSS.

---

## 1. Почему универсальное, а не GST-only

### 1.1. Логика перехода с GST-only на универсальное

Первоначальный план предлагал GST-специфичное расширение (узкая ниша, Индия).
Но при анализе выяснилось:

| Параметр | GST-only | Универсальное |
|-----------|----------|---------------|
| Аудитория | Бухгалтеры GST (Индия) | Разработчики + аналитики + бухгалтеры (глобально) |
| Потенциальные установки | ~200-500 за 3 мес | ~1000-3000 за 3 мес |
| Store title | «CSV to JSON for GSTR-1» | «CSV to JSON Converter — Nested, Batch, No Upload» |
| Killer features в listing | Только GST-формат | **Nested mapping + Batch + Privacy** (все 3) |
| DR 92 backlink | Тот же | Тот же |
| Влияние на SEO сайта | Узкое (только GST-страница) | **Широкое** — brand search по всем запросам |

**Ключевой аргумент:** backlink с Chrome Web Store (DR 92) влияет на **весь домен** csv-to-json.com, а не на одну страницу. Больше установок → больше brand search → Google поднимает домен по ВСЕМ запросам, включая «csv to json converter» (главная, позиция 40).

### 1.2. Конкуренция на Chrome Web Store — слабая по широким запросам

| Расширение | Что делает | Слабость |
|------------|-----------|----------|
| Convert CSV to JSON | Базовая конверсия | Нет nested, нет batch, нет privacy USP |
| Csv to json | Простой конвертер | Загрузка на сервер? Нет privacy |
| CSV to JSON Converter | Local storage only | Нет nested, нет batch |

**Никто не имеет nested mapping, batch, или privacy-first.** Та же комбинация, которая отличает сайт — отлично держится на Store.

### 1.3. SEO-выгода для csv-to-json.com

| Механизм | Эффект |
|-----------|--------|
| **DR 92 backlink** | Chrome Web Store → csv-to-json.com (в профиле разработчика). Сигнал авторитета для Google |
| **Brand search рост** | Пользователи расширения → гуглят «csv to json» → находят сайт (уже знакомы с брендом) |
| **Cross-traffic** | Кнопка «Full version» в расширении → ссылка на csv-to-json.com |
| **Store search** | `csv to json converter` на Store → органические установки |
| **Reviews → trust** | 5-звёздочные отзывы на Store → доверие → выше CTR в Google |

### 1.4. Текущие данные GSC (август 2026) — контекст

| Страница | Клики | Показы | Позиция |
|----------|-------|--------|---------|
| `/csv-to-json-for-gst` | **11** | **84** | **9.07** |
| `/csv-to-json-batch` | 1 | 19 | 20.5 |
| `/` (главная) | 0 | 11 | 40.3 |
| `/csv-to-json` | 0 | 3 | 4.0 |

GST — единственный рабочий трафик. Но универсальное расширение усиливает **весь домен**, что поднимает главную с позиции 40 и batch с 20.

### 1.5. Зуев подтверждает

Math AI extension → 12.2K installs, ТОП-5 Google US, $1,200/мес за 4 месяца.
HEIC-to-JPG → 20K+ installs. Расширения — один из главных каналов Зуева.

---

## 2. Концепция продукта

### Название расширения (главный SEO-фактор на Store)

```
CSV to JSON Converter — Nested Mapping, Batch, No Upload
```

Почему:
- Exact match по широкому запросу `csv to json converter` (главный запрос)
- Подзаголовок содержит все killer features: Nested + Batch + No Upload
- Конкуренция на Store слабая — пробьёмся даже по широкому запросу
- Аудитория: разработчики + аналитики + бухгалтеры (глобально)

### Что делает расширение

1. Пользователь кликает иконку → открывается popup (400×600px)
2. Drag & drop CSV файл (или paste CSV текст)
3. Настройки: delimiter, header row, type detection
4. **Nested mapping** — dot-notation для каждой колонки (killer feature)
5. Конверсия → превью JSON → копировать / скачать
6. **Batch режим** — несколько файлов → ZIP (killer feature)
7. 5 бесплатных конверсий → paywall $5 (ссылка на сайт для оплаты USDT)

### Уникальные преимущества (повторяют сайт — все 3 killer features)

| Фича | Конкуренты на Store | Наше расширение |
|------|---------------------|-----------------|
| Nested JSON mapping | ❌ нет ни у кого | ✅ dot-notation → nested objects |
| Batch обработка → ZIP | ❌ нет ни у кого | ✅ множественные файлы → ZIP |
| Browser-side (privacy) | ⚠️ частично | ✅ всё в браузере, 0 upload |
| Smart type detection | ❌ | ✅ number/boolean/null |
| GST-формат (GSTR-1/3B) | ❌ | ✅ как одна из опций |
| Кнопка «Full version» | ❌ | ✅ → csv-to-json.com |

### Принцип Зуева: 1 функция = 1 продукт

CSV→JSON — это **одна функция**. Nested mapping, batch, GST-формат — всё это CSV→JSON.
Мы не делаем «CSV to JSON + JSON to CSV + YAML converter». Мы делаем ОДИН конвертер, но лучший.

---

## 3. Технический стек

| Компонент | Технология | Размер | Зачем |
|-----------|-----------|--------|-------|
| Manifest | Manifest V3 | ~2 KB | Обязательный стандарт Google |
| CSV парсинг | PapaParse 5.4.1 (CDN) | ~44 KB | Тот же парсер, что на сайте |
| Batch ZIP | JSZip (CDN) | ~30 KB | Скачивание нескольких JSON как ZIP |
| UI | Vanilla HTML/CSS/JS | ~20 KB | $0, никаких фреймворков |
| Дизайн | Apple Design CSS (inline) | ~5 KB | Встроен с первого дня (Зуев) |
| JSON подсветка | highlight.js (CDN, JSON-only) | ~10 KB | Превью результата |
| Лимиты | chrome.storage.local | 0 KB | Счётчик бесплатных конверсий |
| Размер popup | 400×600 px | — | Стандарт для расширений |
| **Итого** | | **~110 KB** | Лёгкое, мгновенная загрузка |

### Почему НЕ Web Worker в расширении

Расширение обрабатывает файлы в popup. Web Worker в popup избыточен и усложняет код.
Предел: файлы до ~5MB в основном потоке. Для больших файлов → кнопка «Full version» → сайт (где есть Web Worker).

---

## 4. Структура проекта

```
csvtojson/
├── extension/                  # ← НОВАЯ директория
│   ├── manifest.json           # Manifest V3
│   ├── popup.html              # UI: drop zone, settings, preview, output
│   ├── popup.js                # Конверсия CSV→JSON, nested, batch, лимиты
│   ├── popup.css               # Apple Design CSS (inline)
│   ├── icons/
│   │   ├── icon16.png          # Toolbar icon
│   │   ├── icon48.png          # Extensions page
│   │   └── icon128.png         # Web Store listing
│   ├── _locales/
│   │   └── en/messages.json    # English
│   └── store/
│       ├── description.txt     # 500+ слов для Store listing
│       ├── screenshots/        # 5 скриншотов (1280×800)
│       └── promo-tile.png      # 440×280 promo для Store
├── index.html                  # Существующий сайт
├── js/app.js                   # Существующий код (источник переиспользования)
├── js/csv-worker.js            # Существующий Web Worker (не для расширения)
├── css/style.css               # Существующий CSS (источник Apple Design)
├── seo/                        # Существующие SEO страницы
├── csvtojson-payment-worker.js # Существующий Worker (не трогаем)
└── PLAN-CHROME-EXTENSION.md    # Этот файл
```

---

## 5. Скиллы (инструменты для разработки)

### Критичные (применяются обязательно)

| # | Скилл | Категория | Зачем | Когда |
|---|-------|-----------|-------|-------|
| 1 | `zuev-micro-saas-launch` | business | **Umbrella-скилл**: полный workflow Зуева. Apple Design CSS (`references/apple-design-polish.css`), pricing model, SEO-чеклист | Весь проект |
| 2 | `micro-saas-static-frontend` | software-dev | Vanilla HTML/CSS/JS паттерны. Apple Design CSS enhancement. Paywall logic (5 free → modal). Counter pitfalls | День 1-2 |
| 3 | `zuev-method` | business | Методология Зуева: 1 функция = 1 продукт, anti-freemium, organic SEO | Весь проект |
| 4 | `seo-landing-pages` | software-dev | Паттерны SEO-оптимизации. Schema.org, OG/Twitter meta. Применить к Store listing | День 3 |
| 5 | `github-repo-management` | github | Создание repo для расширения, деплой исходников | День 3 |

### Вспомогательные (по необходимости)

| # | Скилл | Категория | Зачем | Когда |
|---|-------|-----------|-------|-------|
| 6 | `execute-code` | core | Тестирование логики конверсии, nested mapping, batch | День 1-2 |
| 7 | `systematic-debugging` | software-dev | 4-phase root cause debugging — если что-то ломается | По мере |
| 8 | `requesting-code-review` | software-dev | Pre-commit review: security scan, quality gates | День 3 |
| 9 | `deployment` | devops | Деплой в Chrome Web Store + верификация | День 3 |

### Не используются (для этого проекта)

| Скилл | Причина |
|-------|---------|
| `static-site-crypto-payments` | Оплата на сайте, не в расширении |
| `crypto-payment-tron-worker` | Worker уже развёрнут для csv-to-json.com |
| `turnstile-spin` | Over-engineering для $5 инструмента (Зуев) |
| `cloudflare-email-service` | Over-engineering для $5 инструмента (Зуев) |
| `wrangler` / `workers-best-practices` | Worker уже жив, не нужен |
| `web-perf` | Аудит Core Web Vitals — не для расширения |

### Apple Design CSS — встроен в скиллы №1 и №2

> Apple Design CSS — НЕ отдельный скилл, а reference-файлы внутри `zuev-micro-saas-launch`
> и `micro-saas-static-frontend`. Применяется с первого дня написания CSS.

| Принцип | CSS для popup | Когда |
|---------|---------------|-------|
| Typography | `letter-spacing: -0.02em` на заголовках, `clamp()` | День 1 |
| Response | `:active { transform: scale(0.97) }` на всех кнопках | День 1 |
| Materials | `backdrop-filter: blur(8px) saturate(180%)` на paywall | День 1 |
| Scale-in | `scale(0.95)→scale(1)` + `cubic-bezier(0.16,1,0.3,1)` | День 1 |
| Scroll edges | `mask-image: linear-gradient(...)` на превью | День 1 |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | День 1 |
| Reduced transparency | `@media (prefers-reduced-transparency: reduce)` | День 1 |

---

## 6. План реализации по шагам

### Шаг 1 — manifest.json + базовый popup (День 1)

- [ ] `manifest.json` (Manifest V3):
  - `name`: "CSV to JSON Converter — Nested Mapping, Batch, No Upload"
  - `short_name`: "CSV→JSON"
  - `version`: "1.0.0"
  - `manifest_version`: 3
  - `action`: default_popup → popup.html, default_icon → icons/
  - `permissions`: `activeTab` (минимум — privacy-friendly)
  - `host_permissions`: НЕ НУЖНЫ (всё client-side)
  - `description`: "Convert CSV to JSON in your browser. Nested mapping, batch processing, smart type detection. No upload, 100% private."
  - `icons`: 16/48/128
  - `content_security_policy`: restrict to CDN domains (papaparse, jszip, highlight.js)

- [ ] `popup.html` (400×600):
  - Header: лого + название + бейджи (No Upload, Browser-Only)
  - **Tab 1: Single mode**
    - Drop zone: drag & drop CSV
    - Textarea: альтернатива — paste CSV
    - Settings: delimiter, header row, type detection (toggles)
    - **Nested mapping panel**: для каждой колонки — поле "JSON path" (dot-notation)
    - Auto-detect: колонка содержит точку → предложить nested
    - Preview: первые 5 строк CSV → таблица
    - Convert button
    - Output: JSON с подсветкой (highlight.js)
    - Copy / Download buttons
  - **Tab 2: Batch mode**
    - Drag multiple CSV files
    - Каждый файл → отдельный JSON
    - Скачать все как ZIP (JSZip)
    - Или объединить в один JSON array
    - Прогресс-бар для batch
  - Counter: "3 / 5 free conversions"
  - Paywall trigger: после 5 конверсий
  - Footer: "Full version with advanced features → csv-to-json.com"

- [ ] `popup.css`:
  - Apple Design CSS (inline, все принципы из таблицы выше)
  - Светлая тема (профессиональная, для B2B аудитории)
  - max-width: 400px, height: 600px
  - Tabs: вкладки Single / Batch
  - Адаптивность не нужна (popup фиксированный)

### Шаг 2 — логика конверсии + nested mapping + batch (День 1-2)

- [ ] `popup.js` — базовая конверсия:
  - PapaParse парсинг CSV (через CDN в popup.html)
  - CSV → JSON array (каждая строка = объект)
  - Smart type detection: number / boolean / null / string
  - Delimiter: auto / comma / tab / semicolon / pipe
  - Header row toggle
  - Skip empty rows

- [ ] `popup.js` — nested mapping (KILLER FEATURE):
  - UI: для каждой колонки — поле "JSON path" (dot-notation)
  - Auto-detect: колонка содержит точку → предложить nested
  - Превью результата в реальном времени при изменении mapping
  - Поддержка array notation: `items.0.title` → `items[0].title`
  - Reset / apply-all кнопки
  - Сохранение mapping в chrome.storage.local (для повторяющихся задач)

  **Пример:**
  ```
  Колонка: address.city  → JSON path: address.city  → {"address": {"city": "..."}}
  Колонка: name          → JSON path: name          → {"name": "..."}
  Колонка: items.0.title → JSON path: items.0.title → {"items": [{"title": "..."}]}
  ```

- [ ] `popup.js` — batch режим (KILLER FEATURE):
  - Drag multiple CSV files
  - Каждый файл → отдельный JSON
  - Скачать все как ZIP (JSZip)
  - Или объединить в один JSON array (toggle)
  - Прогресс-бар для batch
  - Batch — premium feature: только после paywall (или 1 бесплатный batch)

- [ ] `popup.js` — GST-формат (дополнительная опция):
  - В выпадающем списке форматов: Universal / GSTR-1 / GSTR-3B
  - GSTR-1: auto-map колонок к полям GSTR-1 (inum, idt, val, txval, iamt, camt, samt, pos)
  - GSTR-3B: auto-map к сводной структуре
  - Валидация обязательных полей
  - GST остаётся как **одна из опций**, а не единственная функция

- [ ] Лимиты (5 бесплатных → paywall):
  - `chrome.storage.local` счётчик: `csvtojson_ext_used`
  - 5 конверсий бесплатно (включая batch = 1 конверсия)
  - После 5 → paywall modal
  - Paywall: "Get unlimited conversions — $5 lifetime"
  - Кнопка "Unlock on website" → открывает csv-to-json.com#paywall
  - Если уже оплачено (`csvtojson_ext_unlocked` в chrome.storage.local) → безлимит

### Шаг 3 — иконки + Store listing (День 2-3)

- [ ] Иконки (16/48/128 px):
  - Дизайн: 📋 → 📄 (CSV → JSON) в стиле сайта
  - Или: оранжево-синий градиент с текстом "C→J"
  - Фон: белый или прозрачный
  - Инструмент: Canvas API или Figma

- [ ] Скриншоты (5 штук, 1280×800 или 640×400):
  1. Popup с drop zone + бейджи — "Drop your CSV file"
  2. Nested mapping UI — "Map columns to nested JSON"
  3. Batch mode — "Convert multiple files to ZIP"
  4. JSON preview с подсветкой — "Get formatted JSON instantly"
  5. Privacy badge — "100% browser-side, no upload"

- [ ] Store description (500+ слов):
  - Заголовок: "CSV to JSON Converter — Nested Mapping, Batch, No Upload"
  - Краткое описание (132 символа): "Convert CSV to JSON in browser. Nested mapping, batch to ZIP, smart type detection. No upload, 100% private. Free to use."
  - Полное описание:
    - Что делает: CSV → JSON конвертер
    - Killer features: nested mapping (dot-notation), batch → ZIP, privacy-first
    - GST-формат: GSTR-1, GSTR-3B (бонус для индийских бухгалтеров)
    - Privacy: всё в браузере, 0 upload, works offline
    - Features: smart type detection, delimiter selection, header toggle
    - How to use: 3 шага (drop → configure → convert)
    - Free tier: 5 conversions
    - Pro: $5 lifetime (link to website)
    - Keywords: csv to json, csv to json converter, nested json, batch csv, csv converter, json converter, csv to json online, csv to nested json, gstr-1 json, gstr-3b json
  - Категория: Developer Tools
  - Язык: English
  - Ключевые слова (в description): csv to json converter, csv to nested json, csv to json batch, csv to json without upload, nested json mapping, gstr-1 json, gstr-3b json, csv converter online

### Шаг 4 — деплой в Chrome Web Store (День 3)

- [ ] Зарегистрировать developer-аккаунт Google Chrome Web Store:
  - https://chrome.google.com/webstore/devconsole/
  - One-time fee: **$5** (оплата через oplatym.ru, если карта РФ заблокирована)
  - Указать сайт разработчика: **csv-to-json.com** (← DR 92 backlink!)

- [ ] Загрузить расширение:
  - Запаковать `extension/` в .zip
  - Upload в Web Store Developer Dashboard
  - Заполнить listing: title, description, screenshots, category, language
  - Указать URL поддержки: https://csv-to-json.com
  - Указать политику конфиденциальности: https://csv-to-json.com/privacy (создать страницу)
  - Submit for review (1-3 дня рассмотрения)

- [ ] После публикации:
  - Получить URL listing: `https://chromewebstore.google.com/detail/XXXXX`
  - Добавить на csv-to-json.com кнопку "Install Chrome Extension" → ссылка на Store
  - Добавить в footer/main страницу

### Шаг 5 — интеграция с сайтом (День 3-4)

- [ ] На csv-to-json.com:
  - Кнопка "Add to Chrome" на главной (рядом с бейджами)
  - Текст: "Also available as Chrome Extension — nested mapping, batch, no upload"
  - Ссылка → Store listing
  - Обновить sitemap.xml (если добавлены новые страницы)

- [ ] Privacy policy страница:
  - https://csv-to-json.com/privacy.html
  - Текст: "This extension processes all data locally in your browser. No data is sent to any server. No analytics, no tracking."
  - Обязательно для Chrome Web Store

---

## 7. Монетизация

### Модель (повторяет сайт)

| Уровень | Цена | Что получает |
|---------|------|-------------|
| Free | $0 | 5 конверсий, все фичи (nested + batch + GST) |
| Lifetime | $5 | Безлимитные конверсии навсегда |

### Flow оплаты

```
5 конверсий использовано
  ↓
Paywall modal в расширении
  ↓
"Unlock unlimited — $5 lifetime"
  ↓
Кнопка "Pay on website" → csv-to-json.com#paywall
  ↓
Пользователь платит USDT на сайте
  ↓
localStorage('csvtojson_unlocked') = true на сайте
  ↓
Возврат к расширению → нажимает "I've paid"
  ↓
Расширение делает fetch к Worker для верификации TXID
  ↓
Если TXID валиден → chrome.storage.local.set({unlocked: true})
  ↓
Безлимит в расширении
```

### Почему оплата через сайт, а не в расширении

- Chrome Web Store требует использовать их платёжную систему для in-extension покупок
- Наш USDT Worker уже работает на сайте
- Пользователь идёт на сайт = дополнительный трафик + brand exposure
- Проще: не нужно встраивать платёжный UI в popup

### Разделение localStorage (важно!)

Расширение и сайт имеют **разные localStorage** (разные origin).
- Сайт: `localStorage` (origin = csv-to-json.com)
- Расширение: `chrome.storage.local` (origin = chrome-extension://XXXXX)

**Решение:** расширение проверяет оплату через Worker (fetch к Worker с TXID).
Если TXID валиден → `chrome.storage.local.set({csvtojson_ext_unlocked: true})`.
Общий ключ `csvtojson_unlocked` НЕ работает между сайтом и расширением.

---

## 8. Store SEO стратегия

### Факторы ранжирования Chrome Web Store

| Фактор | Вес | Наша стратегия |
|--------|-----|----------------|
| **Title** | ⭐⭐⭐⭐⭐ | "CSV to JSON Converter — Nested, Batch, No Upload" — exact match + features |
| **Description** | ⭐⭐⭐⭐ | 500+ слов с ключевыми словами |
| **Weekly active users** | ⭐⭐⭐⭐⭐ | Растёт органически (privacy + nested = retention) |
| **Reviews / Rating** | ⭐⭐⭐⭐ | Просить отзыв после успешной конверсии |
| **Install count** | ⭐⭐⭐ | Растёт со временем |
| **Screenshots** | ⭐⭐⭐ | 5 качественных скриншотов |
| **Category** | ⭐⭐ | Developer Tools |
| **Freshness** | ⭐⭐ | Регулярные обновления |

### Keyword стратегия для Store

| Запрос | Позиция в Google (сайт) | Store конкуренция |
|--------|------------------------|-------------------|
| csv to json converter | 40 (главная) | Средняя (3 слабых конкурента) |
| csv to nested json | — | Низкая (нет ни одного) |
| csv to json batch | 20.5 (batch) | Низкая (нет ни одного) |
| csv to json without upload | — | Низкая |
| csv to json converter for gstr1 | 8.2 (GST) | Низкая (нет GST расширений) |
| gstr-1 json converter | — | Низкая |

**Преимущество универсального:** покрываем ВСЕ запросы одним listing.

---

## 9. Влияние на SEO сайта — таймлайн

| Период | Эффект |
|--------|--------|
| **Неделя 1** | DR 92 backlink активен. Google начинает учитывать |
| **Неделя 2-4** | Первые установки. Store listing индексируется Google |
| **Месяц 1-2** | 50-200 установок. Brand search растёт. Главная: 40 → 25. GST: 9 → 5 |
| **Месяц 2-3** | 500+ установок. Главная: 25 → 15. Batch: 20 → 10 |
| **Месяц 3-6** | 1000+ установок. Доменное доверие растёт. Главная → ТОП-10 |

**Универсальное расширение влияет на ВСЕ страницы домена, не только на GST.**

---

## 10. Риски и митигация

| Риск | Уровень | Митигация |
|------|---------|-----------|
| Google отклонит расширение | Средний | Manifest V3, privacy policy, минимальные permissions |
| Store review > 3 дней | Низкий | Нормально, не блокирует работу |
| Мало установок | Средний | Универсальное = широкая аудитория. Кнопка на сайте = трафик |
| Конкурент скопирует nested | Низкий | Первопроходец + SEO + бренд |
| Chrome меняет Manifest V3 → V4 | Низкий | V3 актуален минимум до 2026+ |
| Оплата через сайт = friction | Средний | VerifTXID в расширении. Один раз заплатил — везде работает |
| Popup слишком тесный для nested UI | Средний | Tabs (Single / Batch). Nested panel — раскрывающийся блок |

---

## 11. Чеклист запуска

- [ ] manifest.json создан (Manifest V3)
- [ ] popup.html + popup.css (Apple Design CSS)
- [ ] popup.js: базовая конверсия CSV→JSON
- [ ] popup.js: nested mapping (dot-notation) — killer feature
- [ ] popup.js: batch режим → ZIP (JSZip) — killer feature
- [ ] popup.js: GST-форматы (GSTR-1/3B) — дополнительная опция
- [ ] popup.js: лимиты (5 free → paywall)
- [ ] popup.js: верификация TXID через Worker
- [ ] Иконки 16/48/128 px
- [ ] Локальное тестирование: chrome://extensions → Load unpacked
- [ ] Тест: single CSV → JSON (basic)
- [ ] Тест: nested mapping (dot-notation)
- [ ] Тест: batch (5 файлов → ZIP)
- [ ] Тест: GSTR-1 CSV → корректный JSON
- [ ] Тест: 5 конверсий → paywall
- [ ] Тест: paywall → ссылка на сайт
- [ ] Тест: верификация TXID → unlock
- [ ] Privacy policy страница на csv-to-json.com/privacy.html
- [ ] Store description (500+ слов)
- [ ] 5 скриншотов (1280×800)
- [ ] Developer-аккаунт Chrome Web Store ($5)
- [ ] Upload .zip → Submit for review
- [ ] После публикации: кнопка "Add to Chrome" на сайте
- [ ] Обновить sitemap.xml
- [ ] Отслеживать позиции в GSC (через 2-4 недели)

---

## 12. Что переиспользуем из существующего проекта

| Компонент | Источник | Адаптация для расширения |
|-----------|----------|--------------------------|
| PapaParse парсинг | `js/app.js` | Упрощённая версия без Web Worker |
| Smart type detection | `js/app.js` (castValue) | Прямое переиспользование |
| Nested mapping logic | `js/app.js` | Прямое переиспользование (dot-notation → nested) |
| Batch logic | `js/app.js` | Упрощённая (без processResultSilent) |
| Paywall logic | `js/app.js` (counter) | Адаптация: chrome.storage.local вместо localStorage |
| Apple Design CSS | `css/style.css` | Inline в popup.css, адаптация под 400px |
| Дизайн (бейджи, цвета) | `css/style.css` | Те же цвета, шрифты, скругления |
| Payment Worker | `csvtojson-payment-worker.js` | Уже живой, не трогаем |
| Site URL | csv-to-json.com | Backlink target + paywall redirect |

---

## 13. Сравнение: расширение vs сайт

| | Chrome Extension | csv-to-json.com |
|---|---|---|
| Цель | Быстрая конверсия в браузере | Полный инструмент |
| Фичи | CSV→JSON, nested, batch, GST | Те же + Web Worker для больших файлов |
| Размер | ~110 KB popup | ~115 KB полная страница |
| Paywall | Ссылка на сайт + TXID verify | USDT Worker, на месте |
| Аудитория | Разработчики + аналитики + бухгалтеры | Те же |
| SEO | Store listing + DR 92 backlink | Google organic |
| Повторное использование | Ежедневно/еженедельно | По необходимости |
| Web Worker | ❌ (файлы до ~5MB) | ✅ (файлы до 50MB) |

**Расширение = быстрый доступ. Сайт = полная мощность.**

---

## 14. Что изменилось vs v1 (GST-only)

| Параметр | v1 (GST-only) | v2 (Universal) |
|-----------|---------------|-----------------|
| Title | "CSV to JSON for GSTR-1" | "CSV to JSON Converter — Nested, Batch, No Upload" |
| Аудитория | Бухгалтеры GST (Индия) | Глобальная: devs + analysts + accountants |
| Killer features | Только GST-формат | **Nested + Batch + Privacy** (все 3) |
| GST-формат | Единственная функция | Одна из опций (Universal / GSTR-1 / GSTR-3B) |
| Tabs | Нет (один формат) | Single / Batch (2 вкладки) |
| Popup размер | 400×600 | 400×600 (tabs экономят место) |
| Установки (прогноз) | ~200-500 за 3 мес | ~1000-3000 за 3 мес |
| SEO эффект | Узкий (GST-страница) | **Широкий** (весь домен) |
| JSZip | Не нужен | Нужен (batch → ZIP) |
| Размер | ~75 KB | ~110 KB |

---

*План составлен 17 августа 2026 (v2). Методология: Игорь Зуев. Стек: $0 Manifest V3 + PapaParse + JSZip.*
*Цель: DR 92 backlink + органический трафик из Chrome Web Store + усиление SEO csv-to-json.com по всем запросам.*