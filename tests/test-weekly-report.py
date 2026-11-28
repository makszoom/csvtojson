#!/usr/bin/env python3
"""Тест еженедельного отчёта csvtojson-weekly.

Проверяет то, что сломалось или отсутствовало (разбор 28.11.2026):
  1. типы файлов СУММИРУЮТСЯ по дням, а не перезаписываются последним днём
     (было «csv 1, xlsx 5» при реальных 28 файлах за неделю);
  2. дельта позиции написана словами — «поднялась/опустилась», потому что
     «позиция 4.9 (-2.9)» читается как падение, хотя позиция улучшилась;
  3. есть сравнение кликов, показов и CTR с прошлой неделей;
  4. есть пометка о фазе месячного цикла GSTR-1 (пик 9–11 числа, дно 12–15);
  5. есть сигнал расхождения: клики в GSC выросли, а просмотры на сайте упали;
  6. порог Фазы 5 не висит мёртвым при нулевом пейволле.

Запуск: python tests/test-weekly-report.py
"""
import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile

SCRIPT = os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'hermes', 'scripts',
                      'csvtojson-weekly.py')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

passed = 0
failed = 0
fails = []


def ok(name, cond, extra=''):
    global passed, failed
    if cond:
        passed += 1
        print(f'  \u2713 {name}')
    else:
        failed += 1
        fails.append(name)
        print(f'  \u2717 {name} {str(extra)[:200]}')


def load_module(tmp_state):
    """Загрузить скрипт отчёта с подменённым путём состояния."""
    spec = importlib.util.spec_from_file_location('weekly', SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.STATE = tmp_state
    return mod


def run_report(state_data, funnel_data, gsc_data):
    """Прогнать main() с подставными данными, вернуть текст отчёта."""
    tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
    json.dump(state_data, tmp)
    tmp.close()
    mod = load_module(tmp.name)
    mod.funnel = lambda days=7: funnel_data
    mod.gsc = lambda days=7: gsc_data
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mod.main()
    os.unlink(tmp.name)
    return buf.getvalue(), mod


# ── Подставные данные: два дня с разными типами файлов ──────────────────
FUNNEL = {
    '2026-11-22': {'page_view:/csv-to-json-for-gst': 10, 'file_loaded:/csv-to-json-for-gst': 8,
                   'file_loaded:type:csv': 1, 'file_loaded:type:xlsx': 5,
                   'convert_click:/csv-to-json-for-gst': 7},
    '2026-11-25': {'page_view:/csv-to-json-for-gst': 12, 'file_loaded:/csv-to-json-for-gst': 10,
                   'file_loaded:type:xlsx': 21, 'file_loaded:type:csv': 1,
                   'convert_click:/csv-to-json-for-gst': 9},
}
GSC = {
    'pages': [
        {'keys': ['https://csv-to-json.com/csv-to-json-for-gst'], 'clicks': 21, 'impressions': 184,
         'ctr': 0.114, 'position': 4.9},
        {'keys': ['https://csv-to-json.com/'], 'clicks': 0, 'impressions': 46, 'ctr': 0,
         'position': 7.4},
    ],
    'total': {'clicks': 21, 'impressions': 233, 'ctr': 0.09, 'position': 5.5},
}
STATE = {'gst_position': 7.8, 'gsc_total': {'clicks': 15, 'impressions': 251}}

print('\n=== 1. Типы файлов суммируются, а не перезаписываются ===')
text, _ = run_report(STATE, FUNNEL, GSC)
ok('в отчёте есть строка «файлы:»', 'файлы:' in text, text[:200])
ok('xlsx = 26 (5+21), а не 21', 'xlsx 26' in text, [l for l in text.split('\n') if 'файлы' in l])
ok('csv = 2 (1+1), а не 1', 'csv 2' in text, [l for l in text.split('\n') if 'файлы' in l])

print('\n=== 2. Дельта позиции словами ===')
ok('сказано «поднялась»', 'поднялась' in text.lower(), [l for l in text.split('\n') if 'позиция' in l.lower()])
ok('нет голого «(-2.9 к прошлой неделе)»', '(-2.9' not in text and '-2.9 к' not in text)

print('\n=== 3. Сравнение с прошлой неделей по кликам/показам/CTR ===')
ok('есть блок сравнения', 'прошл' in text.lower())
ok('клики +40% посчитаны', '+40' in text or '40%' in text, [l for l in text.split('\n') if 'клик' in l.lower()])
ok('CTR сравнивается', 'CTR' in text)

print('\n=== 4. Фаза месячного цикла GSTR-1 ===')
ok('есть упоминание цикла', 'цикл' in text.lower())
ok('названы числа пика 9–11', '9' in text and '11' in text)

print('\n=== 5. Сигнал расхождения воронки и GSC ===')
# просмотры 22 против прошлых 15 кликов — подставим ситуацию роста кликов при падении просмотров
FUNNEL_LOW = {
    '2026-11-22': {'page_view:/csv-to-json-for-gst': 3, 'file_loaded:/csv-to-json-for-gst': 2,
                   'convert_click:/csv-to-json-for-gst': 2},
}
STATE_HIGH = {'gst_position': 7.8, 'gsc_total': {'clicks': 15, 'impressions': 251},
              'site_views': 200}
text2, _ = run_report(STATE_HIGH, FUNNEL_LOW, GSC)
ok('предупреждение о расхождении есть', 'расхожд' in text2.lower(), text2[:300])

print('\n=== 6. Порог Фазы 5 не мёртвый ===')
ok('нет порога 40 при нулевом пейволле', '≥40' not in text or 'пейволл 0' not in text.replace('·', '|'),
   [l for l in text.split('\n') if 'Фаза' in l])

print(f'\nОТЧЁТ: {passed}/{passed + failed} PASS' + (f', {failed} FAIL' if failed else ''))
if failed:
    print('провалы: ' + ' | '.join(fails))
sys.exit(1 if failed else 0)
