/* Общий раннер unit-тестов (без фреймворков, по стандарту проекта). */
const fs = require('fs');
const path = require('path');

const state = { passed: 0, failed: 0, failures: [] };

function ok(name, cond, extra) {
    if (cond) {
        state.passed++;
        console.log('  \u2713', name);
    } else {
        state.failed++;
        state.failures.push(name);
        console.log('  \u2717', name, extra === undefined ? '' : String(extra).slice(0, 400));
    }
}

function eq(name, actual, expected) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    ok(name, a === e, `получено ${a}, ожидалось ${e}`);
}

function throws(name, fn) {
    try { fn(); ok(name, false, 'исключения не было'); }
    catch (e) { ok(name, true); }
}

const ROOT = path.resolve(__dirname, '..', '..');

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function files(rel) {
    return fs.readdirSync(path.join(ROOT, rel));
}

function summary(label) {
    const total = state.passed + state.failed;
    console.log(`\n${label}: ${state.passed}/${total} PASS` + (state.failed ? `, ${state.failed} FAIL` : ''));
    if (state.failed) console.log('провалы: ' + state.failures.join(', '));
    return state.failed === 0;
}

module.exports = { ok, eq, throws, read, files, summary, state, ROOT };
