// Spec 001 — cobertura post-verde de src/db/config.js por entorno.
// La config lee process.env al importar: cada variante corre en subproceso
// para aislar el entorno. Nunca conecta a runner_dev (solo inspección).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const configUrl = new URL('../src/db/config.js', import.meta.url).href;

const code = `
  const { default: config } = await import(${JSON.stringify(configUrl)});
  console.log(JSON.stringify(config));
`;

/**
 * Importa config.js en un subproceso con el entorno dado.
 * @param {Record<string,string|undefined>} env
 * @returns {import('./helpers/proc.js').RunResult}
 */
function importConfig(env) {
  return run('node', ['--input-type=module', '-e', code], {
    cwd: apiDir,
    env,
    timeout: 8000,
  });
}

describe('001: config sequelize por entorno (cobertura)', () => {
  test('development aplica defaults runner/127.0.0.1:5432/runner_dev sin conectar', () => {
    const r = importConfig({ NODE_ENV: 'development' });
    assert.equal(r.status, 0, r.output);
    const cfg = JSON.parse(r.stdout);
    assert.equal(cfg.development.database, 'runner_dev');
    assert.equal(cfg.development.dialect, 'postgres');
    assert.equal(cfg.development.username, 'runner');
    assert.equal(cfg.development.host, '127.0.0.1');
    assert.equal(cfg.development.port, 5432);
    assert.equal(cfg.development.logging, false);
  });

  test('variables DB_* personalizan la config válida', () => {
    const r = importConfig({
      NODE_ENV: 'development',
      DB_USER: 'otro',
      DB_PASSWORD: 'secreto-local',
      DB_HOST: 'db.interno',
      DB_PORT: '5544',
      DB_NAME: 'runner_dev',
    });
    assert.equal(r.status, 0, r.output);
    const cfg = JSON.parse(r.stdout);
    assert.equal(cfg.development.username, 'otro');
    assert.equal(cfg.development.password, 'secreto-local');
    assert.equal(cfg.development.host, 'db.interno');
    assert.equal(cfg.development.port, 5544);
  });

  test('production usa use_env_variable DATABASE_URL sin campo database', () => {
    const r = importConfig({ NODE_ENV: 'production' });
    assert.equal(r.status, 0, r.output);
    const cfg = JSON.parse(r.stdout);
    assert.equal(cfg.production.use_env_variable, 'DATABASE_URL');
    assert.equal(cfg.production.dialect, 'postgres');
    assert.equal(cfg.production.database, undefined);
  });

  test('NODE_ENV=test con DB_NAME=runner_test importa sin abortar', () => {
    const r = importConfig({ NODE_ENV: 'test', DB_NAME: 'runner_test' });
    assert.equal(r.status, 0, r.output);
    const cfg = JSON.parse(r.stdout);
    assert.equal(cfg.test.database, 'runner_test');
  });

  test('NODE_ENV=test con DB_NAME=runner_dev aborta en la importación', () => {
    const r = importConfig({ NODE_ENV: 'test', DB_NAME: 'runner_dev' });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/);
  });

  test('NODE_ENV=test con DATABASE_URL a runner_dev pero DB_NAME runner_test no aborta', () => {
    // database explícito tiene prioridad sobre la URL en resolveDatabaseName.
    const r = importConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/runner_dev',
      DB_NAME: 'runner_test',
    });
    assert.equal(r.status, 0, r.output);
  });
});
