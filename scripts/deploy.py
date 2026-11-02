#!/usr/bin/env python3
"""
deploy.py — деплой изменённых файлов на GitHub Pages через Contents API.

  python scripts/deploy.py --dry-run            # показать, что будет загружено
  python scripts/deploy.py                      # загрузить
  python scripts/deploy.py --message "текст"    # свой текст коммита

Раскладка (как на живом сайте, проверено):
  локально seo/<name>.html  ->  в репозитории и на сайте <name>.html (корень)

Деплоятся ТОЛЬКО изменённые файлы (правило проекта: набор берём из git diff).
"""
import base64
import json
import os
import subprocess
import sys

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OWNER, REPO, BRANCH = "makszoom", "csvtojson", "main"

# локальный путь -> путь в репозитории
MAP_EXTRA = {
    "seo/csv-to-json-for-gst.html": "csv-to-json-for-gst.html",
    "seo/csv-to-json.html": "csv-to-json.html",
    "seo/convert-csv-to-json.html": "convert-csv-to-json.html",
    "seo/csv-to-json-batch.html": "csv-to-json-batch.html",
    "seo/csv-to-nested-json.html": "csv-to-nested-json.html",
}

# что НЕ деплоим никогда
SKIP_PREFIX = ("tests/", "node_modules/", ".e2e-site/", "docs/", "backup", ".env", "package",
               "scripts/", ".gitignore", "README", "workers/")


def env_token():
    with open(os.path.join(ROOT, ".env"), encoding="utf-8") as f:
        for line in f:
            if line.startswith("GITHUB_TOKEN="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("GITHUB_TOKEN не найден в .env")


def changed_files():
    # -uall: иначе untracked-папки приходят одной строкой "?? vendor/" и файлы внутри теряются
    out = subprocess.run(["git", "status", "--porcelain", "-uall"], cwd=ROOT, capture_output=True, text=True).stdout
    files = []
    for line in out.splitlines():
        if not line.strip():
            continue
        status, path = line[:2].strip(), line[3:].strip().strip('"')
        if status == "D":
            continue
        if path.startswith(SKIP_PREFIX):
            continue
        if not os.path.isfile(os.path.join(ROOT, path)):
            continue
        files.append(path)
    return files


def target_path(local):
    return MAP_EXTRA.get(local, local)


def main():
    dry = "--dry-run" in sys.argv
    message = "upgrade: tool embedded on landings, core.js typing, modal fix"
    if "--message" in sys.argv:
        message = sys.argv[sys.argv.index("--message") + 1]

    files = changed_files()
    # --also vendor/xlsx.full.min.js: файл уже в локальном git, но на сайте его нет
    if "--also" in sys.argv:
        extra = sys.argv[sys.argv.index("--also") + 1].split(",")
        files = files + [f for f in extra if f not in files and os.path.isfile(os.path.join(ROOT, f))]
    if not files:
        print("нечего деплоить")
        return 0

    token = env_token()
    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}

    print(f"файлов к деплою: {len(files)}")
    for f in files:
        size = os.path.getsize(os.path.join(ROOT, f))
        print(f"  {f} -> /{target_path(f)} ({size} b)")

    if dry:
        print("\n--dry-run: ничего не отправлено")
        return 0

    failed = 0
    for f in files:
        local = os.path.join(ROOT, f)
        remote = target_path(f)
        url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{remote}"
        content = open(local, "rb").read()
        r = requests.get(url, headers=headers, params={"ref": BRANCH}, timeout=30)
        sha = r.json().get("sha") if r.status_code == 200 else None
        data = {
            "message": message,
            "content": base64.b64encode(content).decode(),
            "branch": BRANCH,
        }
        if sha:
            data["sha"] = sha
        r = requests.put(url, headers=headers, json=data, timeout=60)
        state = "OK " if r.status_code in (200, 201) else "FAIL"
        if r.status_code not in (200, 201):
            failed += 1
        commit = ""
        if r.status_code in (200, 201):
            commit = (r.json().get("commit") or {}).get("sha", "")[:7]
        print(f"  [{state}] {remote} {commit} {'' if r.status_code in (200,201) else r.text[:160]}")

    print(("\nдеплой завершён, ошибок: %d" % failed) if failed else "\nдеплой завершён без ошибок")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
