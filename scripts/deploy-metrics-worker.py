#!/usr/bin/env python3
"""
deploy-metrics-worker.py — деплой csvtojson-metrics в Cloudflare Workers через REST API.

  python scripts/deploy-metrics-worker.py            # задеплоить
  python scripts/deploy-metrics-worker.py --dry-run

Отдельный воркер, а не правка платёжного: у платёжного есть secret_text (BOT_TOKEN)
и plain_text (DISPLAY_PRICE), значения которых из API не читаются — правка его
метаданных рисковала бы сломать приём оплат. Метрика живёт отдельно и ничего
общего с деньгами не имеет.
"""
import json
import os
import secrets
import sys

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCOUNT = "1b9137ef6adb72d3ecce065e0e78c800"
SCRIPT = "csvtojson-metrics"
KV_NAMESPACE = "af4d9acf839d4abf9a9813bb1d72db35"   # CSVTOJSON_KV
ENV_PATH = os.path.join(ROOT, ".env")
WORKER = os.path.join(ROOT, "workers", "metrics-worker.js")


def read_env():
    env = {}
    with open(ENV_PATH, encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k] = v
    return env


def write_env_key(key, value):
    env = read_env()
    env[key] = value
    with open(ENV_PATH, "w", encoding="utf-8", newline="\n") as f:
        for k, v in env.items():
            f.write(f"{k}={v}\n")


def main():
    dry = "--dry-run" in sys.argv
    env = read_env()
    token = env.get("CLOUDFLARE_API_TOKEN")
    if not token:
        raise SystemExit("CLOUDFLARE_API_TOKEN не найден в .env")

    stats_key = env.get("METRICS_STATS_KEY") or secrets.token_hex(16)

    metadata = {
        "main_module": "worker.js",
        "compatibility_date": "2026-07-31",
        "bindings": [
            {"type": "kv_namespace", "name": "METRICS_KV", "namespace_id": KV_NAMESPACE},
            {"type": "plain_text", "name": "STATS_KEY", "text": stats_key},
        ],
    }

    code = open(WORKER, "rb").read()
    print(f"воркер: {SCRIPT}, размер {len(code)} b, KV {KV_NAMESPACE}")
    if dry:
        print("--dry-run: не отправлено")
        return 0

    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/workers/scripts/{SCRIPT}"
    files = {
        "metadata": (None, json.dumps(metadata), "application/json"),
        "worker.js": ("worker.js", code, "application/javascript+module"),
    }
    r = requests.put(url, headers={"Authorization": f"Bearer {token}"}, files=files, timeout=120)
    print("PUT", r.status_code, r.text[:300])
    if r.status_code not in (200, 201):
        return 1

    # публичный маршрут workers.dev
    sub = requests.post(
        f"{url}/subdomain",
        headers={"Authorization": f"Bearer {token}"},
        json={"enabled": True, "previews_enabled": False},
        timeout=60,
    )
    print("subdomain", sub.status_code, sub.text[:200])

    if not env.get("METRICS_STATS_KEY"):
        write_env_key("METRICS_STATS_KEY", stats_key)
        print("ключ статистики записан в .env как METRICS_STATS_KEY")
    print(f"URL: https://{SCRIPT}.makszoom85.workers.dev")
    return 0


if __name__ == "__main__":
    sys.exit(main())
