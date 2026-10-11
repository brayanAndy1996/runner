// Spec 001 — cobertura de ramas de src/index.js (post-verde): selección de
// entrada por NODE_ENV (ausente/desconocido → development; production →
// use_env_variable). Todo offline: la conexión muere en 127.0.0.1:1 y el
// proceso sale 1 antes de escuchar — nunca se alcanza runner_dev.
// El arranque feliz sobre runner_test ya lo cubre coverage-index-shutdown.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const indexPath = fileURLToPath(new URL('../src/index.js', import.meta.url));

/** @param {Record<string,string|undefined>} env */
function spawnIndex(env) {
  return run('node', [indexPath], {
    cwd: apiDir,
    env: { DB_USER: 'runner', DB_PASSWORD: 'runner', ...env },
    timeout: 15000,
  });
}

describe('001: index.js selección de entorno (ramas)', () => {
  test('NODE_ENV ausente → entrada development; conexión falla a puerto cerrado y exit 1', () => {
    const r = spawnIndex({
      NODE_ENV: undefined,
      DB_HOST: '127.0.0.1',
      DB_PORT: '1',
      DB_NAME: undefined,
      DATABASE_URL: undefined,
    });
    assert.equal(r.status, 1, r.output);
    assert.match(r.output, /No se pudo conectar a la base de datos/);
  });

  test('NODE_ENV no listado en config → fallback development; exit 1 a puerto cerrado', () => {
    const r = spawnIndex({
      NODE_ENV: 'staging',
      DB_HOST: '127.0.0.1',
      DB_PORT: '1',
      DB_NAME: undefined,
      DATABASE_URL: undefined,
    });
    assert.equal(r.status, 1, r.output);
    assert.match(r.output, /No se pudo conectar a la base de datos/);
  });

  test('NODE_ENV=production usa use_env_variable: DATABASE_URL a puerto cerrado → exit 1', () => {
    const r = spawnIndex({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://runner:runner@127.0.0.1:1/runner_dev',
      PGDATABASE: undefined,
    });
    assert.equal(r.status, 1, r.output);
    assert.match(r.output, /No se pudo conectar a la base de datos/);
  });
});
