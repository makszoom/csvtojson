#!/usr/bin/env python3
"""submit-zearches.py — подача csv-to-json.com в каталог zearches.com.

Зачем отдельный файл: форма без аккаунта (только email), НО у площадки троттлинг
по частоте попыток — 4 попытки подряд за сессию дают `status=error&code=throttle`,
даже когда все поля валидны. Поэтому отправлять редко и с первого раза правильно.

  python scripts/submit-zearches.py            # отправить
  python scripts/submit-zearches.py --dry-run  # показать, что уйдёт, не отправляя

Ограничения полей (проверено на живой форме 14.11.2026):
  title            2–30
  description      50–250
  full_description 300–1000
  features         до 800, по одной на строку
  audience         30–200
  use_case         60–260
  differentiator   25–280   ← на этом поле была ошибка invalid_differentiator
  social_links     до 900, необязательно
Обязательные select: directory, website_type. Скрытые: csrf_token, form_started_at,
form_origin. Honeypot `website` НЕ отправляется (tabindex=-1, ловушка для ботов).

Правило: не запускать чаще одного раза в сутки. Если пришёл code=throttle —
подождать, а не повторять: повторные попытки продлевают блокировку.
"""
import argparse
import re
import sys
import time

import requests

URL = "https://zearches.com/submit-website-free.php"
POST = "https://zearches.com/submit.php"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"}

DIFFERENTIATOR = (
    "The file never leaves the browser tab in any input mode, including drag-and-drop, while several "
    "competitors convert client-side but post uploaded files to their own server. Nested dot-notation "
    "mapping plus batch and ZIP are not in the free tiers of the alternatives."
)

FIELDS = {
    "url": "https://csv-to-json.com",
    "title": "CSV to JSON Converter",
    "language_choices[]": "English",
    "contact_email": "makszoom85@gmail.com",
    "directory": "software-saas",
    "website_type": "web-tool",
    "pricing": "freemium",
    "access": "none",
    "service_area": "Worldwide",
    "description": ("Convert CSV or Excel to JSON right in your browser. Nested mapping, batch and ZIP, "
                    "type control. Files never leave your machine."),
    "full_description": (
        "A browser-side CSV and Excel to JSON converter. Drop a .csv, .tsv or .xlsx file and get JSON with "
        "no upload step: parsing, type casting and the output are produced inside the page. It supports "
        "nested JSON through dot-notation column mapping, batch conversion of several files, ZIP download, "
        "and keeps identifiers such as HSN codes or invoice numbers with leading zeros as text. A dedicated "
        "GST/GSTR-1 page handles Tally and Busy Excel exports, and a separate tool turns a GSTR-1 JSON back "
        "into a multi-sheet Excel workbook for review. Free for five conversions, then a one-time $5 "
        "licence. No account required."
    ),
    "features": (
        "100% browser-side: no upload\n"
        "Reads .csv, .tsv, .xlsx, .xls with a sheet picker\n"
        "Nested JSON via dot-notation mapping\n"
        "Batch conversion and ZIP archives\n"
        "Identifiers keep leading zeros\n"
        "GST/GSTR-1 page for Tally and Busy exports\n"
        "Reverse tool: GSTR-1 JSON to multi-sheet Excel"
    ),
    "audience": ("Accountants and CAs filing GST returns, developers preparing data for APIs, "
                 "analysts converting spreadsheet exports."),
    "use_case": ("Turning spreadsheet data into JSON for an ERP or API import; checking GST invoice data "
                 "before it leaves the desk; converting a GSTR-1 JSON back to Excel to foot against the "
                 "sales register."),
    "differentiator": DIFFERENTIATOR,
    "social_links": "",
}

LIMITS = {"title": (2, 30), "description": (50, 250), "full_description": (300, 1000),
          "features": (0, 800), "audience": (30, 200), "use_case": (60, 260),
          "differentiator": (25, 280), "social_links": (0, 900)}


def validate():
    problems = []
    for field, (lo, hi) in LIMITS.items():
        n = len(FIELDS[field])
        if n < lo or n > hi:
            problems.append(f"{field}: {n} символов, допустимо {lo}-{hi}")
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    problems = validate()
    if problems:
        print("Поля не проходят валидацию, отправка отменена:")
        for p in problems:
            print("  -", p)
        raise SystemExit(1)

    if args.dry_run:
        print("Dry-run. Уйдёт следующее:")
        for k, v in FIELDS.items():
            print(f"  {k}: {v[:90]}{'…' if len(v) > 90 else ''}")
        print("\n(поле website — honeypot — не отправляется намеренно)")
        return

    s = requests.Session()
    s.headers.update(UA)
    html = s.get(URL, timeout=25).text
    hidden = {}
    for name in ("csrf_token", "form_started_at", "form_origin"):
        m = re.search(r'name="' + name + r'"[^>]*value="([^"]*)"', html)
        if not m:
            print(f"не найден скрытый токен {name} — форма изменилась, править скрипт")
            raise SystemExit(1)
        hidden[name] = m.group(1)

    time.sleep(12)  # имитируем время заполнения: площадка смотрит на form_started_at
    r = s.post(POST, data={**hidden, **FIELDS}, timeout=40, allow_redirects=True)
    body = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", r.text))
    print("HTTP:", r.status_code, "| URL:", r.url[-70:])

    if "status=success" in r.url:
        print("ПОДАНО. Заявка принята на модерацию.")
        return
    code = re.search(r"code=([a-z_]+)", r.url)
    print("НЕ ПОДАНО. Код ошибки:", code.group(1) if code else "неизвестен")
    if code and code.group(1) == "throttle":
        print("  Это лимит частоты. Подождать не меньше суток. Повторные попытки продлевают блокировку.")
    for kw in ("thank you", "success", "in review", "not submitted"):
        i = body.lower().find(kw)
        if i >= 0:
            print("  Ответ площадки:", body[max(0, i - 100):i + 220])
            break
    raise SystemExit(2)


if __name__ == "__main__":
    sys.exit(main())
