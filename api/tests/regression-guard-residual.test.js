// Spec 001 — regresiones ADV-001 residuales (defectos verificados post-fix
// b215a32, verificados offline con new pg.Client() SIN connect).
//
// (a) replication.write/read conservan un `database` explícito falsy
//     ('', null, 0, false): la guardia los trata como "sin database" y les
//     asigna la base heredada *_test, pero _.defaults de Sequelize conserva el
//     valor explícito y pg cae a PGDATABASE → destino runner_dev silencioso.
//     La guardia debe abortar mencionando _test ANTES de construir/conectar.
// (b) use_env_variable apunta a una URL presente SIN path de BD: la guardia
//     resuelve el fallback DATABASE_URL *_test, pero la fábrica elige la env
//     URL truthy → seq.config.database undefined → pg cae a PGDATABASE dev.
//     Debe abortar O propagar un destino efectivo *_test (nunca dev).
// Controles: nodos sin `database` heredan la base *_test (válido); env URL sin
// path + database explícita *_test es válido (el constructor conserva la
// database). Todo offline — puerto 1 / sin authenticate, nunca runner_dev real.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const connectionUrl = new URL('../src/db/connection.js', import.meta.url).href;

// Imprime el destino EFECTIVO por nodo de replicación (pg fusiona la config
// base con el nodo, como hace Sequelize) y el destino base.
/**
 * @param {string} configLiteral
 * @returns {string}
 */
function childScript(configLiteral) {
  return `
    const { createSequelize } = await import(${JSON.stringify(connectionUrl)});
    const seq = createSequelize(${configLiteral});
    const pg = (await import('pg')).default;
    const base = new pg.Client(seq.config ?? {}).connectionParameters;
    console.log('EFFECTIVE_DB=' + String(base.database));
    const rep = seq.options?.replication;
    if (rep) {
      const nodes = [
        ...(rep.read ?? []),
        ...(rep.write ? [rep.write] : []),
      ];
      // Semántica real de conexión: _.pick incluye propiedades HEREDADAS del
      // nodo (prototipo); un spread {...n} las descartaría → falso verde.
      // Solo la clave AUSENTE (ni propia ni heredada) hereda la base.
      const dbs = nodes.map(
        (n) =>
          new pg.Client({
            database: 'database' in n ? n.database : seq.config.database,
          }).connectionParameters.database,
      );
      console.log('NODE_DBS=' + JSON.stringify(dbs));
    }
    process.exit(0);
  `;
}

/**
 * @param {string} configLiteral
 * @param {Record<string,string|undefined>} [env]
 * @returns {import('./helpers/proc.js').RunResult}
 */
function probe(configLiteral, env = {}) {
  return run('node', ['--input-type=module', '-e', childScript(configLiteral)], {
    cwd: apiDir,
    env: {
      NODE_ENV: 'test',
      DB_HOST: '127.0.0.1',
      DB_PORT: '1',
      DATABASE_URL: undefined,
      PGDATABASE: 'runner_dev',
      ...env,
    },
    timeout: 8000,
  });
}

/**
 * @param {import('./helpers/proc.js').RunResult} r
 * @param {string} ctx
 */
function assertGuardAbort(r, ctx) {
  assert.notEqual(r.status, 0, `${ctx}: debió abortar antes de construir:\n${r.output}`);
  assert.match(
    r.output,
    /_test/i,
    `${ctx}: debió abortar por la guardia (mencionar _test):\n${r.output}`,
  );
}

describe('001: ADV-001 residual — database falsy explícito en replication', () => {
  const repl = (/** @type {unknown} */ w, /** @type {unknown} */ rr) =>
    JSON.stringify({
      database: 'runner_test',
      username: 'runner',
      dialect: 'postgres',
      replication: {
        write: { host: '127.0.0.1', port: 1, database: w },
        read: [{ host: '127.0.0.1', port: 1, database: rr }],
      },
    });

  for (const v of ['', null, 0, false]) {
    test(`ADV-001-F3 residual: replication.write.database=${JSON.stringify(v)} conservado debe abortar`, () => {
      assertGuardAbort(probe(repl(v, 'runner_test')), `write=${JSON.stringify(v)}`);
    });
    test(`ADV-001-F3 residual: replication.read[].database=${JSON.stringify(v)} conservado debe abortar`, () => {
      assertGuardAbort(probe(repl('runner_test', v)), `read=${JSON.stringify(v)}`);
    });
  }

  test('ADV-001-F3 residual: control — nodos SIN database heredan la base *_test', () => {
    const r = probe(
      JSON.stringify({
        database: 'runner_test',
        username: 'runner',
        dialect: 'postgres',
        replication: {
          write: { host: '127.0.0.1', port: 1 },
          read: [{ host: '127.0.0.1', port: 1 }],
        },
      }),
    );
    assert.equal(r.status, 0, `nodos heredados *_test son válidos:\n${r.output}`);
    assert.match(r.output, /EFFECTIVE_DB=runner_test/);
    assert.match(r.output, /NODE_DBS=\["runner_test","runner_test"\]/);
  });
});

describe('001: ADV-001-F3 residual — database heredado por PROTOTIPO', () => {
  // Verificado offline por el orquestador: _.pick del connectionManager incluye
  // propiedades heredadas, así que un nodo cuyo PROTOTIPO lleva
  // database:'runner_dev' conecta a dev aunque hasOwnProperty(node,'database')
  // sea false y la guardia le asigne la base *_test.
  const replWithNodes = (/** @type {string} */ wNode, /** @type {string} */ rNode) => `
    {
      database: 'runner_test',
      username: 'runner',
      dialect: 'postgres',
      replication: {
        write: Object.assign(Object.create(${wNode}), { host: '127.0.0.1', port: 1 }),
        read: [Object.assign(Object.create(${rNode}), { host: '127.0.0.1', port: 1 })],
      },
    }`;

  test('ADV-001-F3: write hereda database=runner_dev por prototipo debe abortar', () => {
    assertGuardAbort(
      probe(replWithNodes("{ database: 'runner_dev' }", "{ database: 'runner_test' }")),
      'write prototipo dev',
    );
  });

  test('ADV-001-F3: read hereda database=runner_dev por prototipo debe abortar', () => {
    assertGuardAbort(
      probe(replWithNodes("{ database: 'runner_test' }", "{ database: 'runner_dev' }")),
      'read prototipo dev',
    );
  });

  test('ADV-001-F3: control — prototipos *_test y nodo sin database son válidos', () => {
    const r = probe(
      `{
        database: 'runner_test',
        username: 'runner',
        dialect: 'postgres',
        replication: {
          write: Object.assign(Object.create({ database: 'runner_test' }), { host: '127.0.0.1', port: 1 }),
          read: [{ host: '127.0.0.1', port: 1 }],
        },
      }`,
    );
    assert.equal(r.status, 0, `destinos *_test (propio/heredado/ausente) son válidos:\n${r.output}`);
    assert.match(r.output, /NODE_DBS=\["runner_test","runner_test"\]/);
  });
});

describe('001: ADV-001 residual — URL multipath', () => {
  // Defecto verificado offline: la guardia toma el PRIMER segmento del path
  // ('runner_test') pero Sequelize/pg usan el path completo como database
  // ('runner_test/runner_dev'), que NO termina en _test.
  test('ADV-001-F1 residual: url /runner_test/runner_dev debe abortar (efectivo no es *_test)', () => {
    const r = probe(
      JSON.stringify({
        url: 'postgres://x:x@127.0.0.1:1/runner_test/runner_dev',
        dialect: 'postgres',
      }),
    );
    assertGuardAbort(r, 'url multipath primer-segmento-_test');
  });

  test('ADV-001-F1 residual: control — url /runner_dev/runner_test (efectivo termina _test) es válida', () => {
    const r = probe(
      JSON.stringify({
        url: 'postgres://x:x@127.0.0.1:1/runner_dev/runner_test',
        dialect: 'postgres',
      }),
    );
    if (r.status !== 0) {
      assert.match(r.output, /_test/i, `abortó sin mencionar _test:\n${r.output}`);
      return;
    }
    assert.match(r.output, /EFFECTIVE_DB=.*_test/, `efectivo debió terminar _test:\n${r.output}`);
  });
});

describe('001: ADV-001 residual — env URL sin path desvía a PGDATABASE', () => {
  const NO_PATH_URL = 'postgres://x:x@127.0.0.1:1';
  const envNoPath = {
    RUNNER_EMPTY_PATH_URL: NO_PATH_URL,
    DATABASE_URL: 'postgres://x:x@127.0.0.1:1/runner_test',
  };

  test('ADV-001-F4 residual: use_env_variable sin path + DATABASE_URL _test → aborta o efectivo *_test', () => {
    const r = probe(
      JSON.stringify({
        use_env_variable: 'RUNNER_EMPTY_PATH_URL',
        username: 'runner',
        dialect: 'postgres',
      }),
      envNoPath,
    );
    if (r.status !== 0) {
      assert.match(r.output, /_test/i, `abortó sin mencionar _test:\n${r.output}`);
      return;
    }
    const m = r.output.match(/EFFECTIVE_DB=(\S+)/);
    assert.ok(m, `no se pudo leer el destino efectivo:\n${r.output}`);
    assert.match(
      m[1],
      /_test$/,
      `destino efectivo "${m[1]}" propagado a pg no es *_test:\n${r.output}`,
    );
  });

  test('ADV-001-F4 residual: control — env URL sin path + database explícita *_test es válido', () => {
    const r = probe(
      JSON.stringify({
        use_env_variable: 'RUNNER_EMPTY_PATH_URL',
        database: 'runner_test',
        username: 'runner',
        dialect: 'postgres',
      }),
      envNoPath,
    );
    assert.equal(r.status, 0, `database *_test explícita conservada es válida:\n${r.output}`);
    assert.match(r.output, /EFFECTIVE_DB=runner_test/);
  });
});
