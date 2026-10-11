// Spec 001 — cobertura post-verde de src/app.js y src/index.js.
// index.js se prueba como proceso real: arranque con health en runner_test
// y salida segura cuando la BD no responde. Nunca apunta a runner_dev.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { run } from './helpers/proc.js';
import { createApp } from '../src/app.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));

const TEST_ENV = {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'runner',
  DB_PASSWORD: 'runner',
  DB_NAME: 'runner_test',
};

/**
 * Espera hasta que `cond` sea true o se agote el tiempo.
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

describe('001: app Express (cobertura positiva)', () => {
  test('GET /health responde JSON y rutas desconocidas dan 404', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /application\/json/);
    const notFound = await request(app).get('/ruta-inexistente');
    assert.equal(notFound.status, 404);
    const method = await request(app).post('/health').send({ a: 1 });
    assert.equal(method.status, 404);
  });
});

describe('001: arranque real de src/index.js', () => {
  test('con NODE_ENV=test conecta runner_test, sirve /health y termina limpio', async () => {
    const port = 37777;
    const child = spawn('node', ['src/index.js'], {
      cwd: apiDir,
      env: { ...process.env, ...TEST_ENV, PORT: String(port) },
    });
    let out = '';
    let exited = false;
    child.stdout.on('data', (/** @type {Buffer} */ d) => {
      out += d.toString();
    });
    child.stderr.on('data', (/** @type {Buffer} */ d) => {
      out += d.toString();
    });
    child.on('exit', () => {
      exited = true;
    });
    try {
      const ready = await until(() => out.includes('API escuchando') || exited, 15000);
      assert.ok(ready, `index.js no arrancó a tiempo:\n${out}`);
      assert.match(out, /Conexión a la base de datos "test" establecida/);
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { status: 'ok' });
    } finally {
      child.kill('SIGTERM');
      await until(() => exited, 5000);
    }
  });

  test('falla con exit 1 y mensaje claro si la BD de test no responde', () => {
    const r = run('node', ['src/index.js'], {
      cwd: apiDir,
      env: { ...TEST_ENV, DB_PORT: '1', PORT: '37778' },
      timeout: 20000,
    });
    assert.equal(r.status, 1, `esperaba exit 1:\n${r.output}`);
    assert.match(r.output, /No se pudo conectar a la base de datos/);
  });

  test('NODE_ENV=test con DB_NAME=runner_dev aborta por la guardia, sin escuchar', () => {
    const r = run('node', ['src/index.js'], {
      cwd: apiDir,
      env: { ...TEST_ENV, DB_NAME: 'runner_dev', PORT: '37779' },
      timeout: 10000,
    });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/);
    assert.doesNotMatch(r.output, /API escuchando/);
  });
});
