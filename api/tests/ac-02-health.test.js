// Spec 001 — AC-02: GET /health responde 200 con { "status": "ok" }.
// La suite corre con NODE_ENV=test contra runner_test (ver AC-03/AC-04).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

const appModuleUrl = new URL('../src/app.js', import.meta.url).href;

describe('001: GET /health', () => {
  test('AC-02: GET /health responde 200 con { "status": "ok" }', async () => {
    let mod;
    try {
      mod = await import(appModuleUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      assert.fail(`api/src/app.js no existe o no se puede importar: ${msg}`);
    }
    assert.equal(
      typeof mod.createApp,
      'function',
      'api/src/app.js debe exportar la factory createApp()',
    );
    const app = mod.createApp();
    const res = await request(app).get('/health');
    assert.equal(res.status, 200, `esperaba 200, recibió ${res.status}`);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});
