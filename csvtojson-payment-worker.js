// ═══════════════════════════════════════════════════════════════
// CSVtoJSON Payment Worker — USDT TRC-20 Verification
// Cloudflare Worker (free tier)
// Env vars: TARGET_ADDRESS, BOT_TOKEN, CHAT_ID, PROJECT_NAME, MIN_AMOUNT
// KV binding: CSVTOJSON_KV
// ═══════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    // ═══════ CORS ═══════
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ verified: false, message: 'Method not allowed' }, 405, corsHeaders);
    }

    // ═══════ RATE LIMIT (5 req/min per IP) ═══════
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const rateKey = `rate:${clientIP}`;

    const KV = env.CSVTOJSON_KV || env.PAYMENT_KV;

    const rateData = await KV?.get(rateKey);
    if (rateData) {
      const { count, windowStart } = JSON.parse(rateData);
      if (now - windowStart < 60_000 && count >= 5) {
        return jsonResponse({ verified: false, message: 'Rate limit exceeded. Try again in a minute.' }, 429, corsHeaders);
      }
    }

    // ═══════ PARSE BODY ═══════
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ verified: false, message: 'Invalid JSON' }, 400, corsHeaders);
    }

    const { txId } = body;

    if (!txId || !/^[a-fA-F0-9]{64}$/.test(txId)) {
      return jsonResponse({ verified: false, message: 'Invalid TXID format. Expected 64 hex characters.' }, 400, corsHeaders);
    }

    // ═══════ CHECK TRONSCAN ═══════
    const tronScanUrl = `https://apilist.tronscan.org/api/transaction-info?hash=${txId}`;

    let txData;
    try {
      const tronResponse = await fetch(tronScanUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!tronResponse.ok) {
        return jsonResponse({ verified: false, message: 'TronScan API error. Try again later.' }, 502, corsHeaders);
      }

      txData = await tronResponse.json();
    } catch (e) {
      return jsonResponse({ verified: false, message: 'Network error. Try again later.' }, 502, corsHeaders);
    }

    if (!txData || txData.code !== 0 || !txData.data) {
      return jsonResponse({ verified: false, message: 'Transaction not found on blockchain. Wait 30-60 seconds after sending, then try again.' }, 404, corsHeaders);
    }

    const tx = txData.data;

    // ═══════ VALIDATE RECIPIENT ═══════
    const TARGET_ADDRESS = (env.TARGET_ADDRESS || '').trim();
    if (!TARGET_ADDRESS) {
      return jsonResponse({ verified: false, message: 'Server config error: no target address.' }, 500, corsHeaders);
    }

    const tokenInfo = tx.tokenTransferInfo || {};
    const recipient = (tokenInfo.to_address || tx.toAddress || '').toLowerCase();

    if (recipient !== TARGET_ADDRESS.toLowerCase()) {
      return jsonResponse({ verified: false, message: 'Wrong recipient address.' }, 400, corsHeaders);
    }

    // ═══════ VALIDATE AMOUNT ═══════
    const MIN_AMOUNT = parseFloat(env.MIN_AMOUNT || '4.5'); // $5 product, 0.5 USDT buffer
    const amountUSDT = parseFloat(tokenInfo.amount_str || 0) / 1e6;

    if (amountUSDT < MIN_AMOUNT) {
      return jsonResponse({ verified: false, message: `Amount too small: ${amountUSDT} USDT. Minimum: $${env.DISPLAY_PRICE || '5'}` }, 400, corsHeaders);
    }

    // ═══════ VALIDATE AGE (< 24h) ═══════
    const txTimestamp = tx.timestamp || tx.blockTimestamp;
    if (txTimestamp) {
      const hoursDiff = (now - txTimestamp) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        return jsonResponse({ verified: false, message: 'Transaction too old (over 24 hours).' }, 400, corsHeaders);
      }
    }

    // ═══════ KV DEDUP ═══════
    const dedupKey = `tx:${txId}`;
    const alreadyUsed = await KV?.get(dedupKey);
    if (alreadyUsed) {
      return jsonResponse({ verified: false, message: 'This TXID has already been used.' }, 409, corsHeaders);
    }

    // ═══════ UPDATE RATE LIMITER ═══════
    if (KV) {
      const newRateData = rateData
        ? { count: JSON.parse(rateData).count + 1, windowStart: JSON.parse(rateData).windowStart }
        : { count: 1, windowStart: now };
      await KV.put(rateKey, JSON.stringify(newRateData), { expirationTtl: 60 });
    }

    // ═══════ MARK TXID AS USED ═══════
    if (KV) {
      await KV.put(dedupKey, JSON.stringify({ txId, amount: amountUSDT, date: new Date().toISOString() }), {
        expirationTtl: 30 * 24 * 60 * 60 // 30 days
      });
    }

    // ═══════ TELEGRAM NOTIFICATION ═══════
    await sendTelegramMessage(env, {
      verified: true,
      amount: amountUSDT,
      txId: txId,
      recipient: recipient,
      timestamp: new Date().toISOString()
    });

    // ═══════ LOG TO KV ═══════
    await logPayment(env, KV, {
      txId: txId,
      amount: amountUSDT,
      recipient: recipient,
      timestamp: now,
      clientIP: clientIP
    });

    // ═══════ SUCCESS ═══════
    return jsonResponse({
      verified: true,
      amount: amountUSDT,
      txId: txId,
      message: 'Payment verified! Unlimited conversions activated.'
    }, 200, corsHeaders);
  }
};

async function sendTelegramMessage(env, data) {
  const BOT_TOKEN = env.BOT_TOKEN;
  const CHAT_ID = env.CHAT_ID;
  const PROJECT_NAME = env.PROJECT_NAME || 'CSVtoJSON';

  if (!BOT_TOKEN || !CHAT_ID) return;

  const txIdShort = data.txId.substring(0, 8) + '...' + data.txId.substring(60);
  const amount = data.amount.toFixed(2);
  const date = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  const text = `🎉 *${PROJECT_NAME} — NEW PAYMENT!*

💰 *Amount:* ${amount} USDT
🔗 *TXID:* \`${txIdShort}\`
📅 *Date:* ${date} MSK
📬 *Recipient:* \`${data.recipient?.substring(0, 12)}...\`
✅ *Status:* Verified

💵 *All time:* ${amount} USDT received`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  } catch (e) {
    console.error('Telegram notification failed:', e);
  }
}

async function logPayment(env, KV, data) {
  if (!KV) return;

  const date = new Date(data.timestamp).toISOString().split('T')[0];
  const logKey = `payment:${date}:${data.txId}`;

  await KV.put(logKey, JSON.stringify(data), {
    expirationTtl: 90 * 24 * 60 * 60
  });

  const counterKey = `daily:${date}`;
  const current = await KV.get(counterKey);
  const count = current ? parseInt(current) + 1 : 1;
  await KV.put(counterKey, count.toString(), {
    expirationTtl: 90 * 24 * 60 * 60
  });
}

function jsonResponse(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...extraHeaders }
  });
}