// Spec 001 — cobertura de src/index.js con cierre limpio.
// El hijo precarga tests/fixtures/sigterm-exit.mjs (SIGTERM → exit 0) para que
// el volcado de cobertura V8 se escriba; el puerto se obtiene libre con net.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const fixtureUrl = new URL('./fixtures/sigterm-exit.mjs', import.meta.url).href;

const TEST_ENV = {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'runner',
  DB_PASSWORD: 'runner',
  DB_NAME: 'runner_test',
};

/** Puerto libre del SO (bind :0 y liberar). */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      srv.close(() => resolve(typeof addr === 'object' && addr ? addr.port : 0));
    });
  });
}

/**
 * @param {() => boolean} cond
 * @param {number} ms
 * @returns {Promise<boolean>}
 */
async function until(cond, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return cond();
}

describe('001: arranque y cierre limpio de index.js', () => {
  test('sirve /health, SIGTERM termina con exit 0 y volcado limpio', async () => {
    const port = await freePort();
    assert.ok(port > 0);
    const child = spawn('node', ['src/index.js'], {
      cwd: apiDir,
      env: {
        ...process.env,
        ...TEST_ENV,
        PORT: String(port),
        NODE_OPTIONS: `--import ${fixtureUrl}`,
      },
    });
    let out = '';
    let code = /** @type {number|null} */ (null);
    child.stdout.on('data', (/** @type {Buffer} */ d) => { out += d.toString(); });
    child.stderr.on('data', (/** @type {Buffer} */ d) => { out += d.toString(); });
    child.on('exit', (c) => { code = c; });
    const ready = await until(() => out.includes('API escuchando') || code !== null, 15000);
    assert.ok(ready, `index.js no arrancó:\n${out}`);
    assert.match(out, /Conexión a la base de datos "test" establecida/);
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    child.kill('SIGTERM');
    const done = await until(() => code !== null, 5000);
    assert.ok(done, 'el proceso no terminó tras SIGTERM');
    assert.equal(code, 0, `debió salir limpio tras SIGTERM, salió ${code}:\n${out}`);
  });
});
