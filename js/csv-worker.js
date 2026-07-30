/* ═══════════════════════════════════════════════
   CSV to JSON Converter — csv-worker.js
   Web Worker: парсинг CSV в отдельном потоке
   Не блокирует UI при больших файлах (>1MB)
   ═══════════════════════════════════════════════ */

// Import PapaParse in Worker context
importScripts('https://unpkg.com/papaparse@5.4.1/papaparse.min.js');

self.onmessage = function(e) {
    const { file, config, jobId } = e.data;

    try {
        // Notify: started
        self.postMessage({ type: 'start', jobId });

        Papa.parse(file, {
            delimiter: config.delimiter || '',
            header: config.header !== false,
            skipEmptyLines: true,
            dynamicTyping: config.dynamicTyping || false,
            worker: false, // PapaParse worker внутри нашего Worker — не нужен
            step: function(results) {
                // Progress: send row count periodically
                if (results.meta.cursor) {
                    self.postMessage({
                        type: 'progress',
                        jobId,
                        bytesProcessed: results.meta.cursor,
                        totalBytes: file.size
                    });
                }
            },
            complete: function(results) {
                self.postMessage({
                    type: 'complete',
                    jobId,
                    data: results.data,
                    meta: results.meta,
                    errors: results.errors
                });
            },
            error: function(err) {
                self.postMessage({
                    type: 'error',
                    jobId,
                    message: err.message || 'Parse error'
                });
            }
        });

    } catch (err) {
        self.postMessage({
            type: 'error',
            jobId,
            message: err.message || 'Worker error'
        });
    }
};