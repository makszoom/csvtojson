// ═══════════════════════════════════════════════════════════════
// CSVtoJSON Metrics Worker — анонимный счётчик воронки
//
// Зачем: у сайта не было ни одной метрики, кроме GSC. Мы не знаем, сколько людей
// доходит до конвертации, до пейволла и до оплаты. При этом privacy-обещание
// («не используем сторонние счётчики, не пишем cookies») остаётся в силе:
// здесь нет ни IP, ни User-Agent, ни cookie, ни содержимого файлов пользователя.
//
// Маршруты:
//   POST /t      { e: "convert_click", p: "/csv-to-json-for-gst", t: "xlsx" }
//   GET  /stats?days=7&key=<STATS_KEY>   -> JSON со счётчицами по дням
//
// KV-ключи: ev:<YYYY-MM-DD>:<event>[:<path>] -> число (TTL 120 дней)
// Bindings: METRICS_KV (kv), STATS_KEY (plain_text)
// ═══════════════════════════════════════════════════════════════

const EVENTS = new Set([
  'page_view',
  'file_loaded',
  'convert_click',
  'download_click',
  'paywall_shown',
  'payment_verified'
]);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const TTL = 120 * 24 * 60 * 60;

function todayKey(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

async function bump(kv, key) {
  const cur = parseInt((await kv.get(key)) || '0', 10) || 0;
  await kv.put(key, String(cur + 1), { expirationTtl: TTL });
  return cur + 1;
}

async function handleEvent(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  // Ничего, кроме имени события и пути. Всё остальное молча отбрасываем.
  const event = String(body.e || '');
  if (!EVENTS.has(event)) {
    return new Response(JSON.stringify({ ok: false, message: 'Unknown event' }), { status: 400, headers: CORS });
  }
  const page = String(body.p || '/').slice(0, 120).replace(/[^\w\-./?=&:]/g, '');
  const day = todayKey();

  const kv = env.METRICS_KV;
  if (!kv) {
    return new Response(JSON.stringify({ ok: false, message: 'No KV' }), { status: 500, headers: CORS });
  }

  const jobs = [bump(kv, `ev:${day}:${event}`)];
  if (page) jobs.push(bump(kv, `ev:${day}:${event}:${page}`));
  if (body.t && /^[a-z]{2,8}$/.test(String(body.t))) {
    jobs.push(bump(kv, `ev:${day}:${event}:type:${body.t}`));
  }
  // Источник перехода: только домен (caclubindia.com), без пути и query.
  // Нужен, чтобы отличить визит из обсуждения от визита из поиска.
  if (body.r && /^[a-z0-9.-]{3,60}$/i.test(String(body.r))) {
    jobs.push(bump(kv, `ev:${day}:${event}:ref:${String(body.r).toLowerCase()}`));
  }
  await Promise.all(jobs);

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
}

async function handleStats(url, env) {
  const key = url.searchParams.get('key') || '';
  if (!env.STATS_KEY || key !== env.STATS_KEY) {
    return new Response(JSON.stringify({ ok: false, message: 'Forbidden' }), { status: 403, headers: CORS });
  }
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10) || 7, 1), 120);
  const kv = env.METRICS_KV;
  const out = {};
  for (let i = 0; i < days; i++) {
    const day = todayKey(i);
    const list = await kv.list({ prefix: `ev:${day}:`, limit: 1000 });
    const row = {};
    for (const k of list.keys) {
      const short = k.name.slice(`ev:${day}:`.length);
      row[short] = parseInt((await kv.get(k.name)) || '0', 10) || 0;
    }
    if (Object.keys(row).length) out[day] = row;
  }
  return new Response(JSON.stringify({ ok: true, days, data: out }, null, 1), { status: 200, headers: CORS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (url.pathname === '/stats' && request.method === 'GET') {
      return handleStats(url, env);
    }
    if ((url.pathname === '/t' || url.pathname === '/') && request.method === 'POST') {
      return handleEvent(request, env);
    }
    return new Response(JSON.stringify({ ok: true, service: 'csvtojson-metrics' }), { status: 200, headers: CORS });
  }
};
