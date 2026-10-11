// Spec 001 — AC-03: Sequelize conecta y migra en runner_dev y runner_test.
//
// Contrato: api/src/db/config.js exporta por defecto
// { development, test, production } compatible con sequelize-cli.
// La configuración dev se valida sin conexión; `db:migrate` en runner_dev se
// verifica fuera de la suite (orquestador/CI) para no tocar datos de desarrollo.
// La migración de runner_test sí corre de verdad dentro de la suite (R-10).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/proc.js';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const configUrl = new URL('../src/db/config.js', import.meta.url).href;

const TEST_DB_ENV = {
  NODE_ENV: 'test',
  DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
  DB_PORT: process.env.DB_PORT ?? '5432',
  DB_USER: process.env.DB_USER ?? 'runner',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'runner',
  DB_NAME: 'runner_test',
};

describe('001: configuración y migraciones Sequelize', () => {
  test('AC-03: src/db/config.js exporta development/test/production con las bases correctas', async () => {
    let mod;
    try {
      mod = await import(configUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      assert.fail(`api/src/db/config.js no existe o no se puede importar: ${msg}`);
    }
    const config = mod.default ?? mod;
    for (const env of ['development', 'test', 'production']) {
      assert.ok(config[env], `falta la entrada "${env}" en la config sequelize`);
    }
    const devDb = config.development.database ?? '';
    const testDb = config.test.database ?? '';
    assert.match(devDb, /runner_dev/, `development debe apuntar a runner_dev, usa "${devDb}"`);
    assert.match(testDb, /_test$/, `test debe apuntar a una base *_test, usa "${testDb}"`);
  });

  test('AC-03: NODE_ENV=test npm run db:migrate migra runner_test (exit 0)', () => {
    const r = run('npm', ['run', 'db:migrate'], {
      cwd: apiDir,
      env: TEST_DB_ENV,
      timeout: 120000,
    });
    assert.equal(
      r.status,
      0,
      `db:migrate sobre runner_test falló (${r.status}):\n${r.output}`,
    );
  });
});
