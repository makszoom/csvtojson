/* E2E-харнесс: подключение к уже запущенному Chrome по CDP (порт 9333).
 *
 * Chrome запускается ВНЕ теста (иначе spawn молча фейлится и тест висит):
 *   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
 *     --remote-debugging-port=9333 --user-data-dir=C:/Users/MiniPC/.hermes/csvtojson-e2e \
 *     --no-first-run --disk-cache-size=1 about:blank
 */
const WebSocket = require('ws');
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws, mid = 0;
const pending = new Map();

function send(method, params, sessionId) {
    return new Promise((resolve, reject) => {
        const id = ++mid;
        pending.set(id, { resolve, reject });
        const msg = { id, method, params: params || {} };
        if (sessionId) msg.sessionId = sessionId;
        ws.send(JSON.stringify(msg));
        setTimeout(() => {
            if (pending.has(id)) { pending.delete(id); reject(new Error('timeout: ' + method)); }
        }, 15000);
    });
}

async function connect() {
    let ver;
    try {
        ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
    } catch (e) {
        throw new Error('Chrome на порту ' + PORT + ' не отвечает. Запусти его командой из комментария в шапке tests/e2e/harness.js');
    }
    ws = new WebSocket(ver.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
    ws.on('message', (m) => {
        const d = JSON.parse(m);
        if (d.id && pending.has(d.id)) {
            const p = pending.get(d.id); pending.delete(d.id);
            if (d.error) p.reject(new Error(d.error.message)); else p.resolve(d);
        } else if (d.method === 'Runtime.exceptionThrown') {
            collectors.exceptions.push(describeException(d.params));
        } else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') {
            collectors.logErrors.push(d.params.entry.text);
        }
    });
    await new Promise((res) => ws.on('open', res));
    await sleep(200);
}

const collectors = { exceptions: [], logErrors: [] };

function describeException(p) {
    const d = p.exceptionDetails || {};
    const ex = d.exception || {};
    return (ex.description || d.text || 'unknown').split('\n')[0].slice(0, 300);
}

function resetCollectors() { collectors.exceptions = []; collectors.logErrors = []; }

async function openPage(url) {
    resetCollectors();
    const created = await send('Target.createTarget', { url: 'about:blank' });
    const targetId = created.result.targetId;
    const attached = await send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attached.result.sessionId;

    await send('Runtime.enable', {}, sessionId);
    await send('Log.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Page.navigate', { url }, sessionId);
    await sleep(1800);

    const evalJS = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
        if (r.result && r.result.exceptionDetails) {
            const d = r.result.exceptionDetails;
            throw new Error('evalJS: ' + ((d.exception && d.exception.description) || d.text || 'exception'));
        }
        return r.result.result.value;
    };

    const close = async () => { try { await send('Target.closeTarget', { targetId }); } catch (e) {} };

    return { evalJS, close, sessionId, url };
}

/* Строка для page-JS: перевод строки только через String.fromCharCode(10) —
   '\n' внутри шаблонной строки node превращается в настоящий перевод строки
   и даёт тихую SyntaxError на странице. */
const LF = 'String.fromCharCode(10)';

/* Подача файла в input[type=file] (без File Chooser). */
function dropFile(evalJS, { inputId = 'fileInput', name = 'sample.csv', text = '' }) {
    const b64 = Buffer.from(text, 'utf8').toString('base64');
    return evalJS(`
        (() => {
            const b64 = "${b64}";
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const file = new File([bytes], "${name}", { type: "text/csv" });
            const dt = new DataTransfer();
            dt.items.add(file);
            const input = document.getElementById("${inputId}");
            if (!input) return { ok: false, why: "no-input" };
            input.files = dt.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            return { ok: true, files: input.files.length };
        })()
    `);
}

/* Подача бинарного файла (Excel): base64 -> Uint8Array -> File. */
function dropBinary(evalJS, { inputId = 'fileInput', name = 'book.xlsx', base64 = '', mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) {
    return evalJS(`
        (() => {
            const b64 = "${base64}";
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const file = new File([bytes], "${name}", { type: "${mime}" });
            const dt = new DataTransfer();
            dt.items.add(file);
            const input = document.getElementById("${inputId}");
            if (!input) return { ok: false, why: "no-input" };
            input.files = dt.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            return { ok: true };
        })()
    `);
}

module.exports = { connect, openPage, send, sleep, collectors, resetCollectors, dropFile, dropBinary, LF };
