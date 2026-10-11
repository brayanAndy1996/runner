// Spec 001 — regresiones ADV-001-F2/F3/F4 (defectos verificados).
//
// F2: sequelize-cli honra --env/--url y la guardia en config.js solo evalúa la
//     entrada "test": `NODE_ENV=test sequelize db:migrate:status --env development`
//     (o --url, o --env production + DATABASE_URL) opera sobre una BD no-test
//     con la guardia silenciosa. Debe abortar mencionando _test, jamás llegar a
//     la red (puerto 1 cerrado; nunca host dev real).
// F3: replication.write/read llevan `database` propio por nodo.
// F4: use_env_variable ausente o env PG* desvían el destino efectivo fuera de
//     lo que la guardia resolvió — exigir aborto O destino efectivo *_test.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './helpers/proc.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const connectionUrl = new URL('../src/db/connection.js', import.meta.url).href;

// Entorno del CLI: puerto 1 cerrado. Cualquier intento real de conexión muere
// con ECONNREFUSED; la guardia debe disparar ANTES.
const CLI_ENV = {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_USER: 'runner',
  DB_PASSWORD: 'runner',
  // DB_NAME/DATABASE_URL ausentes a propósito (undefined elimina la clave en
  // spawn): development resuelve runner_dev y test resuelve runner_test.
  // No usar `delete` sobre process.env — reheredaría un valor del padre.
  DB_NAME: undefined,
  DATABASE_URL: undefined,
};

/**
 * @param {string[]} args
 * @param {Record<string,string|undefined>} [extra]
 * @returns {import('./helpers/proc.js').RunResult}
 */
function cli(args, extra = {}) {
  const env = /** @type {Record<string,string|undefined>} */ ({ ...process.env, ...CLI_ENV });
  return run('npx', ['sequelize', ...args], {
    cwd: apiDir,
    env: { ...env, ...extra },
    timeout: 30000,
  });
}

/**
 * @param {import('./helpers/proc.js').RunResult} r
 * @param {string} ctx
 */
function assertGuardAbort(r, ctx) {
  assert.notEqual(r.status, 0, `${ctx}: debió terminar != 0:\n${r.output}`);
  assert.match(
    r.output,
    /_test/i,
    `${ctx}: debió abortar por la guardia (mencionar _test), no por red:\n${r.output}`,
  );
  assert.doesNotMatch(
    r.output,
    /ECONNREFUSED|ETIMEDOUT|ConnectionRefusedError/i,
    `${ctx}: llegó a intentar conectar (la guardia debió cortar antes):\n${r.output}`,
  );
}

describe('001: ADV-001-F2 guardia del CLI sequelize', () => {
  test('ADV-001-F2: NODE_ENV=test + --env development aborta (no ECONNREFUSED)', () => {
    assertGuardAbort(cli(['db:migrate:status', '--env', 'development']), '--env development');
  });

  test('ADV-001-F2: NODE_ENV=test + --env=development aborta', () => {
    assertGuardAbort(cli(['db:migrate:status', '--env=development']), '--env=development');
  });

  test('ADV-001-F2: NODE_ENV=test + --url .../runner_dev aborta (--url salta config.js)', () => {
    assertGuardAbort(
      cli(['db:migrate:status', '--url', 'postgres://runner:runner@127.0.0.1:1/runner_dev']),
      '--url runner_dev',
    );
  });

  test('ADV-001-F2: NODE_ENV=test + --env production con DATABASE_URL dev aborta', () => {
    assertGuardAbort(
      cli(['db:migrate:status', '--env', 'production'], {
        DATABASE_URL: 'postgres://runner:runner@127.0.0.1:1/runner_dev',
      }),
      '--env production',
    );
  });

  test('ADV-001-F2: control válido — --env development con DB_NAME=runner_test muere por red SIN guardia', () => {
    // El nombre del entorno del CLI puede ser "development" mientras el
    // destino efectivo es *_test: seguro, no debe abortar.
    const r = cli(['db:migrate:status', '--env', 'development'], { DB_NAME: 'runner_test' });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /ECONNREFUSED|ConnectionRefusedError|connect/i);
    assert.doesNotMatch(r.output, /Guardia de tests/);
  });

  test('ADV-001-F2: control válido — --env test llega al intento de conexión (no aborta por guardia)', () => {
    const r = cli(['db:migrate:status', '--env', 'test']);
    // runner_test es destino seguro: el CLI intenta conectar a puerto 1 y
    // muere por red, nunca por guardia.
    assert.notEqual(r.status, 0);
    assert.match(r.output, /ECONNREFUSED|ConnectionRefusedError|connect/i);
    assert.doesNotMatch(r.output, /Guardia de tests/);
  });
});

/**
 * @param {string} configLiteral
 * @returns {string}
 */
function childScript(configLiteral) {
  return `
    const { createSequelize } = await import(${JSON.stringify(connectionUrl)});
    const seq = createSequelize(${configLiteral});
    const pg = (await import('pg')).default;
    const params = new pg.Client(seq.config ?? {}).connectionParameters;
    console.log('EFFECTIVE_DB=' + String(params.database));
    const rep = seq.options?.replication;
    if (rep) {
      const nodes = [
        ...(rep.read ?? []),
        ...(rep.write ? [rep.write] : []),
      ];
      console.log('REPLICATION_DBS=' + JSON.stringify(nodes.map((n) => n.database)));
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
    env: { NODE_ENV: 'test', DB_HOST: '127.0.0.1', DB_PORT: '1', ...env },
    timeout: 8000,
  });
}

/**
 * Aborto por guardia, o destino efectivo *_test si se construye.
 * @param {import('./helpers/proc.js').RunResult} r
 * @param {string} ctx
 */
function assertAbortOrTestTarget(r, ctx) {
  if (r.status !== 0) {
    assert.match(r.output, /_test/i, `${ctx}: abortó sin mencionar _test:\n${r.output}`);
    return;
  }
  const m = r.output.match(/EFFECTIVE_DB=(\S+)/);
  assert.ok(m, `${ctx}: no se pudo leer el destino efectivo:\n${r.output}`);
  assert.match(
    m[1],
    /_test$/,
    `${ctx}: destino efectivo "${m[1]}" no es *_test y la guardia no abortó:\n${r.output}`,
  );
}

describe('001: ADV-001-F2 residual — use_env_variable con URL raíz en el CLI', () => {
  // Defecto verificado offline con parseDbUrl real + lodash.merge real: la
  // config declara database:'runner_test' y use_env_variable apunta a
  // 'postgres://x:x@127.0.0.1:1/' (raíz, sin BD). El preflight resuelve la
  // database *_test y deja pasar, pero config-helper del CLI mergea
  // parseDbUrl(namedURL) encima → database:'' → Sequelize cae a PGDATABASE dev.
  // La fábrica directa con las mismas options sigue segura (su constructor URL
  // usa defaults); el bypass es propio del camino merge del CLI.
  const fixture = fileURLToPath(new URL('./fixtures/cli-use-env-config.cjs', import.meta.url));

  test('ADV-001-F2 residual: --env test --config fixture + named URL raíz debe abortar (no ECONNREFUSED)', () => {
    const r = cli(['db:migrate:status', '--env', 'test', '--config', fixture], {
      RUNNER_SLASH_URL: 'postgres://x:x@127.0.0.1:1/',
      PGDATABASE: 'runner_dev',
    });
    assertGuardAbort(r, 'named URL raíz');
  });

  test('ADV-001-F2 residual: control — named URL con ruta *_test llega a error de red SIN guardia', () => {
    const r = cli(['db:migrate:status', '--env', 'test', '--config', fixture], {
      RUNNER_SLASH_URL: 'postgres://x:x@127.0.0.1:1/runner_test',
      PGDATABASE: 'runner_dev',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /ECONNREFUSED|ConnectionRefusedError|connect/i);
    assert.doesNotMatch(r.output, /Guardia de tests/);
  });
});

describe('001: ADV-001-F2 residual — CLI desde cwd sin .sequelizerc', () => {
  // Auditor F2-R verificado: desde un cwd temporal (sin .sequelizerc propio,
  // por tanto SIN el preflight de guardia), `--config <api/src/db/config.js>
  // --env development` carga nuestro config.js pero el CLI elige la entrada
  // "development" (runner_dev) y llega a TCP. La guardia debe cortar el
  // destino no-test elegido, no solo validar config.test. Bin local por path
  // absoluto (npx en cwd temp descargaría el paquete de red).
  const bin = fileURLToPath(
    new URL('../node_modules/sequelize-cli/lib/sequelize', import.meta.url),
  );
  const configAbs = fileURLToPath(new URL('../src/db/config.js', import.meta.url));

  /**
   * @param {Record<string,string|undefined>} [extra]
   * @returns {import('./helpers/proc.js').RunResult}
   */
  function cliSinRc(extra = {}) {
    const cwd = mkdtempSync(join(tmpdir(), 'runner-cli-norc-'));
    const env = /** @type {Record<string,string|undefined>} */ ({
      ...process.env,
      ...CLI_ENV,
      ...extra,
    });
    return run(
      process.execPath,
      [bin, 'db:migrate:status', '--config', configAbs, '--env', 'development'],
      { cwd, env, timeout: 30000 },
    );
  }

  test('ADV-001-F2 residual: --env development + --config absoluto sin rc debe abortar (no ECONNREFUSED)', () => {
    assertGuardAbort(cliSinRc(), 'CLI sin .sequelizerc --env development');
  });

  test('ADV-001-F2 residual: control — mismo comando con DB_NAME=runner_test llega a error de red SIN guardia', () => {
    const r = cliSinRc({ DB_NAME: 'runner_test' });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /ECONNREFUSED|ConnectionRefusedError|connect/i);
    assert.doesNotMatch(r.output, /Guardia de tests/);
  });
});

describe('001: ADV-001-F3 replication read/write', () => {
  const repl = (/** @type {string} */ w, /** @type {string} */ rr) =>
    JSON.stringify({
      database: 'runner_test',
      dialect: 'postgres',
      replication: {
        write: { host: '127.0.0.1', port: 1, database: w },
        read: [{ host: '127.0.0.1', port: 1, database: rr }],
      },
    });

  test('ADV-001-F3: replication.write.database=runner_dev debe abortar', () => {
    const r = probe(repl('runner_dev', 'runner_test'));
    assert.notEqual(r.status, 0, `debió abortar:\n${r.output}`);
    assert.match(r.output, /_test/i);
  });

  test('ADV-001-F3: replication.read[].database=runner_dev debe abortar', () => {
    const r = probe(repl('runner_test', 'runner_dev'));
    assert.notEqual(r.status, 0, `debió abortar:\n${r.output}`);
    assert.match(r.output, /_test/i);
  });

  test('ADV-001-F3: control — write y read *_test no aborta', () => {
    const r = probe(repl('runner_test', 'runner_test'));
    assert.equal(r.status, 0, `config válida no debió abortar:\n${r.output}`);
    assert.match(r.output, /REPLICATION_DBS=\["runner_test","runner_test"\]/);
  });
});

describe('001: ADV-001-F4 fallback PG*/env ausente diverge del destino', () => {
  test('ADV-001-F4: PGDATABASE=runner_dev con options sin database → aborta o destino *_test', () => {
    const r = probe(
      JSON.stringify({ username: 'runner', dialect: 'postgres', host: '127.0.0.1', port: 1 }),
      {
        PGDATABASE: 'runner_dev',
        DATABASE_URL: 'postgres://runner:runner@127.0.0.1:1/runner_test',
      },
    );
    assertAbortOrTestTarget(r, 'PGDATABASE divergente');
  });

  test('ADV-001-F4: use_env_variable ausente + DATABASE_URL _test → aborta o destino *_test', () => {
    const r = probe(
      JSON.stringify({
        use_env_variable: 'RUNNER_VAR_QUE_NO_EXISTE',
        username: 'runner',
        dialect: 'postgres',
      }),
      { DATABASE_URL: 'postgres://runner:runner@127.0.0.1:1/runner_test' },
    );
    assertAbortOrTestTarget(r, 'env var ausente');
  });
});
