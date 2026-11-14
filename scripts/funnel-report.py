#!/usr/bin/env python3
"""
funnel-report.py — сводка воронки из воркера csvtojson-metrics.

  python scripts/funnel-report.py            # 7 дней
  python scripts/funnel-report.py 30         # 30 дней

Печатает по дням: показы, загрузки файлов, клики по конвертации, скачивания,
показы пейволла, подтверждённые оплаты + конверсии между шагами.
Ключ берётся из .env (METRICS_STATS_KEY).
"""
import json
import os
import sys
from urllib.request import Request, urlopen

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://csvtojson-metrics.makszoom85.workers.dev"
ORDER = ["page_view", "file_loaded", "convert_click", "download_click", "paywall_shown", "payment_verified"]


def read_env():
    env = {}
    with open(os.path.join(ROOT, ".env"), encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k] = v
    return env


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    key = read_env().get("METRICS_STATS_KEY")
    if not key:
        raise SystemExit("METRICS_STATS_KEY не найден в .env — сначала задеплой воркер")

    # Cloudflare отдаёт 403 на запросы без User-Agent, поэтому представляемся браузером
    req = Request(f"{BASE}/stats?days={days}&key={key}", headers={"User-Agent": UA})
    with urlopen(req, timeout=30) as r:
        data = json.load(r).get("data", {})

    if not data:
        print(f"за {days} дней событий нет")
        return

    totals = {e: 0 for e in ORDER}
    print("Тестовые прогоны (?e2e=1) счётчиком не учитываются — в таблице только живой трафик.")
    print(f"{'день':<12}" + "".join(f"{e:<16}" for e in ORDER))
    for day in sorted(data):
        row = data[day]
        cells = []
        for e in ORDER:
            v = row.get(e, 0)
            totals[e] += v
            cells.append(f"{v:<16}")
        print(f"{day:<12}" + "".join(cells))

    print("\nИтого за период:")
    for e in ORDER:
        print(f"  {e:<18} {totals[e]}")

    def ratio(a, b):
        return f"{totals[b] / totals[a] * 100:.1f}%" if totals[a] else "—"

    print("\nВоронка:")
    print(f"  просмотр -> загрузка файла      {ratio('page_view', 'file_loaded')}")
    print(f"  загрузка -> конвертация         {ratio('file_loaded', 'convert_click')}")
    print(f"  конвертация -> скачивание       {ratio('convert_click', 'download_click')}")
    print(f"  просмотр -> пейволл             {ratio('page_view', 'paywall_shown')}")
    print(f"  пейволл -> оплата               {ratio('paywall_shown', 'payment_verified')}")

    pages = {}
    for day, row in data.items():
        for k, v in row.items():
            if k.count(":") >= 1 and not k.startswith(("convert_click:type", "file_loaded:type")):
                event, path = k.split(":", 1)
                if path.startswith("ref:") or path.startswith("type:"):
                    continue
                pages.setdefault(path, {}).setdefault(event, 0)
                pages[path][event] += v
    if pages:
        print("\nПо страницам (топ по просмотрам):")
        for path, ev in sorted(pages.items(), key=lambda x: -x[1].get("page_view", 0))[:10]:
            print(f"  {path:<38} views {ev.get('page_view', 0):<5} files {ev.get('file_loaded', 0):<5} "
                  f"convert {ev.get('convert_click', 0):<5} paywall {ev.get('paywall_shown', 0)}")

    # Источники перехода = каналы. Пустой источник означает «зашли напрямую или из поиска».
    refs = {}
    for day, row in data.items():
        for k, v in row.items():
            if ":ref:" not in k:
                continue
            event, _, host = k.partition(":ref:")
            refs.setdefault(host, {}).setdefault(event, 0)
            refs[host][event] += v
    print("\nПо источникам перехода (каналы):")
    if not refs:
        print("  пока никто не пришёл по внешней ссылке — счётчик источника пуст")
    for host, ev in sorted(refs.items(), key=lambda x: -x[1].get("page_view", 0)):
        print(f"  {host:<28} views {ev.get('page_view', 0):<5} files {ev.get('file_loaded', 0):<5} "
              f"convert {ev.get('convert_click', 0):<5} download {ev.get('download_click', 0)}")


if __name__ == "__main__":
    main()
