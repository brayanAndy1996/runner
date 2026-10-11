// Spec 001 — cobertura positiva post-verde de src/db/connection.js.
// Rutas válidas de construcción (database | url | use_env_variable),
// authenticate real contra runner_test y fallo seguro sin tocar runner_dev.

import { describe, test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';
import { createSequelize } from '../src/db/connection.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const connectionUrl = new URL('../src/db/connection.js', import.meta.url).href;

const REAL = {
  database: 'runner_test',
  username: process.env.DB_USER ?? 'runner',
  password: process.env.DB_PASSWORD ?? 'runner',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
};

/** @type {import('sequelize').Sequelize[]} */
const open = [];
after(async () => {
  await Promise.all(open.map((s) => s.close()));
});

describe('001: createSequelize (cobertura positiva)', () => {
  test('construye con database y authenticate() real conecta a runner_test', async () => {
    const seq = createSequelize(REAL);
    open.push(seq);
    assert.equal(seq.config.database, 'runner_test');
    await seq.authenticate();
  });

  test('construye desde url postgres y parsea el nombre de BD', () => {
    const seq = createSequelize({
      url: 'postgres://u:p@127.0.0.1:1/otra_test?sslmode=disable',
      dialect: 'postgres',
    });
    open.push(seq);
    assert.equal(seq.config.database, 'otra_test');
    assert.equal(seq.getDialect(), 'postgres');
  });

  test('construye desde use_env_variable apuntando a *_test', () => {
    const key = 'RUNNER_COV_DB_URL';
    process.env[key] = 'postgres://u:p@127.0.0.1:1/env_test';
    try {
      const seq = createSequelize({ use_env_variable: key, dialect: 'postgres' });
      open.push(seq);
      assert.equal(seq.config.database, 'env_test');
    } finally {
      delete process.env[key];
    }
  });

  test('use_env_variable ausente cae a las opciones restantes', () => {
    const seq = createSequelize({
      use_env_variable: 'RUNNER_VAR_INEXISTENTE',
      database: 'runner_test',
      dialect: 'postgres',
      host: '127.0.0.1',
      port: 1,
    });
    open.push(seq);
    assert.equal(seq.config.database, 'runner_test');
  });

  test('authenticate() a un puerto cerrado rechaza con error de red (no aborta)', async () => {
    const seq = createSequelize({ ...REAL, port: 1 });
    open.push(seq);
    await assert.rejects(
      () => seq.authenticate(),
      /ECONNREFUSED|ConnectionRefusedError|connect/i,
    );
  });

  test('createSequelize({}) en NODE_ENV=test sin DATABASE_URL aborta "desconocida"', () => {
    const code = `
      const { createSequelize } = await import(${JSON.stringify(connectionUrl)});
      createSequelize({});
    `;
    const env = /** @type {Record<string,string>} */ ({ ...process.env, NODE_ENV: 'test' });
    delete env.DATABASE_URL;
    const r = run('node', ['--input-type=module', '-e', code], {
      cwd: apiDir,
      env,
      timeout: 8000,
    });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /desconocida/);
  });
});
