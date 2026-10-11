// Spec 001 — AC-04: la guardia aborta cualquier conexión Sequelize en
// NODE_ENV=test a una BD que no termine en _test.
//
// Contrato: api/src/db/connection.js exporta createSequelize(options), que
// aplica la guardia y devuelve una instancia Sequelize. La guardia debe abortar
// el proceso ANTES de intentar la conexión TCP (se usa un host inalcanzable:
// si intentara conectar, el proceso colgaría o moriría por red, no por la
// guardia). Todo corre en subprocesos para no abortar el propio runner.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/proc.js';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const connectionUrl = new URL('../src/db/connection.js', import.meta.url).href;

// Host inalcanzable: cualquier intento real de conexión tardaría > timeout o
// fallaría con error de red — nunca con un mensaje de guardia.
const DEAD = { host: '10.255.255.1', port: 5432, dialect: 'postgres' };

/**
 * Script del subproceso que importa connection.js y autentica.
 * @param {string} configLiteral literal JS de la config pasada a createSequelize
 * @returns {string}
 */
function childScript(configLiteral) {
  return `
    const { createSequelize } = await import(${JSON.stringify(connectionUrl)});
    const seq = createSequelize(${configLiteral});
    try {
      await seq.authenticate();
      console.log('CONNECTED');
      process.exit(0);
    } catch (err) {
      console.log('CONNECT_ERROR:' + err.message);
      process.exit(0);
    }
  `;
}

/**
 * @param {string} configLiteral
 * @param {Record<string,string>} env
 * @returns {import('./helpers/proc.js').RunResult}
 */
function spawnGuardProbe(configLiteral, env) {
  return run('node', ['--input-type=module', '-e', childScript(configLiteral)], {
    cwd: apiDir,
    env: { NODE_ENV: 'test', ...env },
    timeout: 8000,
  });
}

/**
 * @param {import('./helpers/proc.js').RunResult} r
 * @param {string} ctx
 */
function assertAbortedByGuard(r, ctx) {
  assert.notEqual(
    r.status,
    0,
    `${ctx}: el proceso debió abortar (exit != 0), salió ${r.status}:\n${r.output}`,
  );
  assert.match(
    r.output,
    /_test/i,
    `${ctx}: el aborto debe mencionar la regla *_test:\n${r.output}`,
  );
  assert.doesNotMatch(
    r.output,
    /ECONNREFUSED|ETIMEDOUT|ECONNRESET|EHOSTUNREACH|SequelizeConnection|SequelizeHost/,
    `${ctx}: abortó por red, no por la guardia (debió cortar antes de conectar):\n${r.output}`,
  );
  assert.ok(
    r.durationMs < 7000,
    `${ctx}: tardó ${r.durationMs}ms — sospecha de intento de conexión antes de abortar`,
  );
}

describe('001: guardia de base de datos de tests', () => {
  test('AC-04: NODE_ENV=test + database runner_dev aborta antes de conectar', () => {
    const r = spawnGuardProbe(
      JSON.stringify({ database: 'runner_dev', username: 'x', password: 'x', ...DEAD }),
      {},
    );
    assertAbortedByGuard(r, 'database=runner_dev');
  });

  test('AC-04: NODE_ENV=test + URL a runner_dev aborta incluso con override de URL', () => {
    const r = spawnGuardProbe(
      JSON.stringify({ url: 'postgres://x:x@10.255.255.1:5432/runner_dev', ...DEAD }),
      { DATABASE_URL: 'postgres://x:x@10.255.255.1:5432/runner_dev' },
    );
    assertAbortedByGuard(r, 'url=.../runner_dev');
  });

  test('AC-04: NODE_ENV=test + database runner_test NO aborta por la guardia', () => {
    // Puerto local cerrado: si la guardia no corta, el intento de conexión
    // falla rápido con error de red — evidencia de que sí intentó conectar.
    const r = spawnGuardProbe(
      JSON.stringify({
        database: 'runner_test',
        username: 'x',
        password: 'x',
        host: '127.0.0.1',
        port: 1,
        dialect: 'postgres',
      }),
      {},
    );
    assert.doesNotMatch(
      r.output,
      /_test/i,
      `runner_test no debió disparar la guardia:\n${r.output}`,
    );
    assert.match(
      r.output,
      /CONNECTED|CONNECT_ERROR/,
      `debió llegar al intento de conexión (no aborto por guardia):\n${r.output}`,
    );
    assert.equal(r.status, 0, `el proceso debió terminar normal:\n${r.output}`);
  });
});
