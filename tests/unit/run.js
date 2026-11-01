/* Запуск всех unit-тестов. */
const { summary, state } = require('./_harness');

const files = ['core.test.js', 'csv-parse.test.js', 'read-table.test.js', 'metrics.test.js', 'markup-sync.test.js', 'assets.test.js', 'embed.test.js', 'claims.test.js', 'seo-map.test.js'];
for (const f of files) require('./' + f);

const okAll = summary('UNIT');
process.exit(okAll ? 0 : 1);
