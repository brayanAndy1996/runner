// Spec 001 — cobertura positiva post-verde de src/db/guard.js.
// Casos válidos de resolución de nombre (database | url | use_env_variable |
// DATABASE_URL), entradas malformadas y abortos por subproceso.
// Estos tests son añadidos de cobertura: nunca existieron en rojo.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';
import { resolveDatabaseName, assertTestDatabaseName } from '../src/db/guard.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const guardUrl = new URL('../src/db/guard.js', import.meta.url).href;

describe('001: resolución del nombre de BD (guard.js)', () => {
  test('url efectiva tiene prioridad sobre database (precedencia real de Sequelize)', () => {
    // Corrección de caracterización: la versión anterior de este test
    // afirmaba database > url, que es justo el bypass ADV-001-F1 — Sequelize
    // conecta a la url cuando ambos campos están presentes.
    assert.equal(
      resolveDatabaseName({ database: 'mi_test', url: 'postgres://u@h/otra_test' }),
      'otra_test',
    );
  });

  test('url postgres(s) resuelve el nombre y tolera credenciales/query/puerto', () => {
    assert.equal(
      resolveDatabaseName({ url: 'postgres://u:p@127.0.0.1:5432/runner_test' }),
      'runner_test',
    );
    assert.equal(
      resolveDatabaseName({ url: 'postgresql://u@h/otra_test?sslmode=require&x=1' }),
      'otra_test',
    );
  });

  test('use_env_variable resuelve desde el entorno', () => {
    const key = 'RUNNER_TEST_DB_URL_VAR';
    process.env[key] = 'postgres://u@h/env_test';
    try {
      assert.equal(resolveDatabaseName({ use_env_variable: key }), 'env_test');
    } finally {
      delete process.env[key];
    }
  });

  test('cae a DATABASE_URL cuando no hay database/url/use_env_variable', () => {
    const prev = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://u@h/fallback_test';
    try {
      assert.equal(resolveDatabaseName({}), 'fallback_test');
    } finally {
      if (prev === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = prev;
    }
  });

  test('entradas malformadas o ausentes resuelven undefined', () => {
    assert.equal(resolveDatabaseName({ url: 'esto-no-es-url' }), undefined);
    assert.equal(resolveDatabaseName({ url: 'postgres://u@h/' }), undefined);
    assert.equal(resolveDatabaseName({ database: '' }), undefined);
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      assert.equal(resolveDatabaseName({}), undefined);
      assert.equal(resolveDatabaseName({ use_env_variable: 'NO_EXISTE_XYZ' }), undefined);
    } finally {
      if (prev !== undefined) process.env.DATABASE_URL = prev;
    }
  });

  test('assertTestDatabaseName acepta nombres *_test sin abortar', () => {
    assert.equal(assertTestDatabaseName('runner_test'), undefined);
    assert.equal(assertTestDatabaseName('x_test'), undefined);
  });
});

describe('001: abortos de la guardia por subproceso', () => {
  /**
   * Ejecuta un snippet ESM que llama assertTestDatabaseName.
   * @param {string} nameExpr literal JS evaluado como nombre
   * @returns {import('./helpers/proc.js').RunResult}
   */
  function spawnAssert(nameExpr) {
    const code = `
      const { assertTestDatabaseName } = await import(${JSON.stringify(guardUrl)});
      assertTestDatabaseName(${nameExpr});
    `;
    return run('node', ['--input-type=module', '-e', code], {
      cwd: apiDir,
      env: { NODE_ENV: 'test' },
      timeout: 8000,
    });
  }

  test('nombre sin _test aborta con mensaje que menciona la regla', () => {
    const r = spawnAssert(JSON.stringify('runner_dev'));
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/);
  });

  test('nombre undefined aborta reportando "desconocida"', () => {
    const r = spawnAssert('undefined');
    assert.notEqual(r.status, 0);
    assert.match(r.output, /desconocida/);
  });
});
