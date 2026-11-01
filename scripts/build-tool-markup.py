#!/usr/bin/env python3
"""
build-tool-markup.py — генерирует js/tool-markup.js из index.html.

Единственный источник разметки инструмента — index.html. Скрипт вырезает три блока
(main, paywallModal, toastContainer) и складывает их в одну JS-строку, которую
использует js/tool-embed.js на SEO-лендингах. Так разметка не дрейфует между копиями.

Запуск:  python scripts/build-tool-markup.py [--check]
         --check — только проверить, что js/tool-markup.js соответствует index.html
Выход:   0 — ок, 1 — расхождение (для теста markup-sync)
"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "js", "tool-markup.js")


def _match_div(html, start_idx):
    """Возвращает индекс сразу после закрывающего </div> блока, начинающегося в start_idx."""
    depth = 0
    i = start_idx
    tag_re = re.compile(r"<(/?)div\b", re.I)
    while True:
        m = tag_re.search(html, i)
        if not m:
            raise ValueError("не найден закрывающий </div>")
        if m.group(1):
            depth -= 1
            if depth == 0:
                end = html.find(">", m.end())
                return end + 1
        else:
            depth += 1
        i = m.end()


def extract(html, opener):
    """opener — точная строка начала блока (например '<main class=\"container\">')."""
    start = html.find(opener)
    if start == -1:
        raise ValueError(f"не найден блок: {opener}")
    if opener.startswith("<main"):
        end = html.find("</main>", start) + len("</main>")
        if end <= start:
            raise ValueError("не найден </main>")
        return html[start:end].strip()
    # div-блок: ищем парный закрывающий
    end = _match_div(html, start)
    return html[start:end].strip()


def build():
    html = open(SRC, encoding="utf-8").read()
    main = extract(html, '<main class="container">')
    # На лендинге уже есть свой <main> (статья), второй <main> — невалидный HTML.
    # Поэтому встраиваемая копия оборачивается в div с классом .tool-embed.
    main = main.replace('<main class="container">', '<div class="container tool-embed">', 1)
    main = main.replace('</main>', '</div>', 1)
    paywall = extract(html, '<div class="modal" id="paywallModal">')
    toast = extract(html, '<div class="toast-container" id="toastContainer"></div>')
    markup = main + "\n" + paywall + "\n" + toast
    return html, markup


def main():
    html, markup = build()
    digest = hashlib.sha256(markup.encode("utf-8")).hexdigest()

    if "--check" in sys.argv:
        if not os.path.exists(OUT):
            print("FAIL: js/tool-markup.js отсутствует — запусти сборку")
            return 1
        cur = open(OUT, encoding="utf-8").read()
        cur_hash = re.search(r"MARKUP_HASH = '([0-9a-f]+)'", cur)
        if not cur_hash:
            print("FAIL: в js/tool-markup.js нет MARKUP_HASH")
            return 1
        if cur_hash.group(1) != digest:
            print(f"FAIL: разметка разъехалась\n  index.html: {digest}\n  tool-markup: {cur_hash.group(1)}")
            return 1
        print(f"OK: разметка синхронна ({digest[:12]}, {len(markup)} символов)")
        return 0

    body = (
        "// СГЕНЕРИРОВАНО scripts/build-tool-markup.py из index.html — НЕ РЕДАКТИРОВАТЬ ВРУЧНУЮ\n"
        f"window.CSVtoJSON_MARKUP_HASH = '{digest}';\n"
        f"window.CSVtoJSON_MARKUP = {json.dumps(markup, ensure_ascii=False)};\n"
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(body)
    print(f"OK: js/tool-markup.js собран ({len(markup)} символов разметки, hash {digest[:12]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
