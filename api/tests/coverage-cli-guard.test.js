// Spec 001 — cobertura semántica de los helpers del camino CLI (post-verde):
// cliFlagValue, cliTargetDatabaseName (semántica merge de sequelize-cli),
// assertCliTarget (base + replication heredada/segura/insegura), selección de
// entrada por argv en config.js y .sequelizerc, y la divergencia intencional
// factory vs CLI (misma entrada: factory sella el fallback *_test; el CLI no
// puede, así que aborta). Todo offline: puerto 1, sin authenticate, nunca
// runner_dev real.

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';
import {
  cliFlagValue,
  cliTargetDatabaseName,
  cliRcObject,
  cliEffectiveEnv,
  resolveDatabaseName,
} from '../src/db/guard.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const fixtureCliTarget = fileURLToPath(
  new URL('./fixtures/probe-cli-target.mjs', import.meta.url),
);
const fixtureLoadConfig = fileURLToPath(
  new URL('./fixtures/load-config.mjs', import.meta.url),
);
const configUrl = new URL('../src/db/config.js', import.meta.url).href;
const rcPath = fileURLToPath(new URL('../.sequelizerc', import.meta.url));

const SAFE_ENV = {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_NAME: undefined,
  DATABASE_URL: undefined,
  PGDATABASE: undefined,
};

describe('001: cliFlagValue parsea flags --x v / --x=v', () => {
  test('forma separada devuelve el siguiente argv', () => {
    assert.equal(cliFlagValue(['cmd', '--env', 'development'], '--env'), 'development');
    assert.equal(cliFlagValue(['--url', 'postgres://h/db'], '--url'), 'postgres://h/db');
  });
  test('forma --x=v devuelve el sufijo', () => {
    assert.equal(cliFlagValue(['--env=production'], '--env'), 'production');
  });
  test('flag ausente o sin valor devuelve undefined', () => {
    assert.equal(cliFlagValue(['db:migrate'], '--env'), undefined);
    assert.equal(cliFlagValue(['--env'], '--env'), undefined);
    assert.equal(cliFlagValue(['--config'], '--config'), undefined);
  });
  test('no confunde flags que solo comparten prefijo', () => {
    assert.equal(cliFlagValue(['--env-var=x'], '--env'), undefined);
  });
  test('preferencia: forma separada antes que --x=v posterior', () => {
    assert.equal(cliFlagValue(['--env', 'dev', '--env=prod'], '--env'), 'dev');
  });
});

describe('001: cliTargetDatabaseName (semántica merge del CLI)', () => {
  /** @type {Record<string,string|undefined>} */
  let saved;
  beforeEach(() => {
    saved = { RUNNER_T_URL: process.env.RUNNER_T_URL, DATABASE_URL: process.env.DATABASE_URL };
    delete process.env.RUNNER_T_URL;
    delete process.env.DATABASE_URL;
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  test('target.url usa el path completo', () => {
    assert.equal(
      cliTargetDatabaseName({ url: 'postgres://h/db_test', database: 'otra' }),
      'db_test',
    );
  });
  test('use_env_variable presente: la env URL manda sobre database declarada', () => {
    process.env.RUNNER_T_URL = 'postgres://h/env_test';
    assert.equal(
      cliTargetDatabaseName({ database: 'cfg_test', use_env_variable: 'RUNNER_T_URL' }),
      'env_test',
    );
  });
  test('env URL sin path devuelve undefined: inseguro aunque database sea *_test', () => {
    process.env.RUNNER_T_URL = 'postgres://x:x@127.0.0.1:1/';
    // El merge de parseDbUrl produce database:'' → pg caería a PGDATABASE:
    // destino no verificable, la guardia debe rechazarlo (undefined).
    assert.equal(
      cliTargetDatabaseName({ database: 'runner_test', use_env_variable: 'RUNNER_T_URL' }),
      undefined,
    );
  });
  test('env var ausente cae a resolveDatabaseName (database / DATABASE_URL)', () => {
    assert.equal(
      cliTargetDatabaseName({ database: 'cfg_test', use_env_variable: 'RUNNER_T_URL' }),
      'cfg_test',
    );
    process.env.DATABASE_URL = 'postgres://h/dsn_test';
    assert.equal(cliTargetDatabaseName({ use_env_variable: 'RUNNER_T_URL' }), 'dsn_test');
  });
  test('sin url ni env var coincide con resolveDatabaseName', () => {
    const t = { database: 'x_test', dialect: 'postgres' };
    assert.equal(cliTargetDatabaseName(t), resolveDatabaseName(t));
  });
});

/**
 * @param {Record<string,unknown>} target
 * @param {Record<string,string|undefined>} [env]
 */
function cliTarget(target, env = {}) {
  return run('node', [fixtureCliTarget], {
    cwd: apiDir,
    env: { ...SAFE_ENV, TARGET_JSON: JSON.stringify(target), ...env },
    timeout: 8000,
  });
}

describe('001: assertCliTarget — base y replication', () => {
  test('base *_test sin replication pasa', () => {
    const r = cliTarget({ database: 'runner_test', dialect: 'postgres' });
    assert.equal(r.status, 0, r.output);
    assert.match(r.output, /CLI_BASE=runner_test/);
    assert.match(r.output, /CLI_TARGET_OK/);
  });
  test('base no-test aborta mencionando _test', () => {
    const r = cliTarget({ database: 'runner_dev', dialect: 'postgres' });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
  });
  test('replication sin database hereda la base *_test (segura)', () => {
    const r = cliTarget({
      database: 'runner_test',
      dialect: 'postgres',
      replication: { write: { host: 'h' }, read: [{ host: 'h' }] },
    });
    assert.equal(r.status, 0, r.output);
  });
  test('replication con nodos *_test explícitos pasa (segura)', () => {
    const r = cliTarget({
      database: 'runner_test',
      replication: {
        write: { host: 'h', database: 'runner_test' },
        read: [{ host: 'h', database: 'runner_test' }],
      },
    });
    assert.equal(r.status, 0, r.output);
  });
  test('replication write dev aborta (insegura)', () => {
    const r = cliTarget({
      database: 'runner_test',
      replication: { write: { host: 'h', database: 'runner_dev' } },
    });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
  });
  test('replication read con database falsy conservado aborta (insegura)', () => {
    const r = cliTarget({
      database: 'runner_test',
      replication: { read: [{ host: 'h', database: null }] },
    });
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
  });
  test('nodo replication con url *_test pasa; con url dev aborta', () => {
    const ok = cliTarget({
      database: 'runner_test',
      replication: { write: { host: 'h', url: 'postgres://h/ro_test' } },
    });
    assert.equal(ok.status, 0, ok.output);
    const bad = cliTarget({
      database: 'runner_test',
      replication: { write: { host: 'h', url: 'postgres://h/ro_dev' } },
    });
    assert.notEqual(bad.status, 0);
    assert.match(bad.output, /_test/i);
  });
});

describe('001: cliRcObject / cliEffectiveEnv (ramas defensivas)', () => {
  /** Escribe un rc temporal y devuelve su path. @param {string} body */
  function tmpRc(body) {
    const dir = mkdtempSync(join(tmpdir(), 'runner-rc-unit-'));
    const p = join(dir, 'rc.cjs');
    writeFileSync(p, body);
    return p;
  }

  test('rc inexistente / no-objeto / require que lanza → {} sin romper', () => {
    assert.deepEqual(cliRcObject(['--options-path', '/no/existe/rc.cjs']), {});
    assert.deepEqual(cliRcObject(['--options-path', tmpRc('module.exports = 42;')]), {});
    assert.deepEqual(
      cliRcObject(['--options-path', tmpRc('throw new Error("boom");')]),
      {},
    );
    assert.deepEqual(cliRcObject(['--options-path', tmpRc('module.exports = null;')]), {});
  });

  test('rc objeto se devuelve; ownRcPath propio se ignora (anti-ciclo)', () => {
    const p = tmpRc('module.exports = { env: "development" };');
    assert.deepEqual(cliRcObject(['--options-path', p]), { env: 'development' });
    // Ignorar el propio rc evita re-ejecutar el preflight recursivamente:
    // cwd/.sequelizerc == ownRcPath (api/.sequelizerc) → {}.
    assert.deepEqual(cliRcObject([], rcPath), {});
    // Un ownRcPath distinto NO se ignora: cae al rc del cwd.
    const cwdRc = cliRcObject([], '/no/es/este.cjs');
    assert.equal(typeof cwdRc, 'object');
  });

  test('cliEffectiveEnv: flag --env > rc.env > NODE_ENV', () => {
    const devRc = tmpRc('module.exports = { env: "qa" };');
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'test';
      assert.equal(cliEffectiveEnv(['--env', 'production'], 'x'), 'production');
      assert.equal(cliEffectiveEnv(['--options-path', devRc], 'x'), 'qa');
      assert.equal(cliEffectiveEnv(['--options-path', '/no/existe'], 'x'), 'test');
      delete process.env.NODE_ENV;
      assert.equal(cliEffectiveEnv(['--options-path', '/no/existe'], 'x'), 'development');
    } finally {
      if (saved === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = saved;
    }
  });
});

describe('001: divergencia intencional factory vs CLI', () => {
  test('misma entrada use_env_variable sin path: factory sella fallback *_test; assertCliTarget aborta', () => {
    const target = {
      database: 'runner_test',
      use_env_variable: 'RUNNER_SLASH_URL',
      dialect: 'postgres',
    };
    const env = {
      ...SAFE_ENV,
      RUNNER_SLASH_URL: 'postgres://x:x@127.0.0.1:1/',
      DATABASE_URL: 'postgres://x:x@127.0.0.1:1/runner_test',
    };
    // Camino CLI (merge de config-helper): la URL raíz produce database:''
    // → destino no verificable → aborto.
    const r = cliTarget(target, env);
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
    // Camino factory (ya cubierto en regression-guard-residual): el fallback
    // DATABASE_URL *_test sella el destino. La asimetría es deliberada: el
    // CLI no puede sellar porque mergea encima de la config.
  });
});

/**
 * @param {string[]} argv
 * @param {Record<string,string|undefined>} [env]
 */
function loadConfig(argv, env = {}) {
  return run('node', [fixtureLoadConfig, ...argv], {
    cwd: apiDir,
    env: { ...SAFE_ENV, CONFIG_UNDER_TEST: configUrl, ...env },
    timeout: 8000,
  });
}

describe('001: config.js selecciona la entrada del argv', () => {
  test('sin flags: env por defecto es test → carga', () => {
    const r = loadConfig([]);
    assert.equal(r.status, 0, r.output);
    assert.match(r.output, /LOADED development,test,production/);
  });
  test('--env test carga', () => {
    assert.equal(loadConfig(['--env', 'test']).status, 0);
    assert.equal(loadConfig(['--env=test']).status, 0);
  });
  test('--env development aborta (entrada dev)', () => {
    const r = loadConfig(['--env', 'development']);
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
  });
  test('--env desconocido cae a config.test y carga', () => {
    assert.equal(loadConfig(['--env', 'staging']).status, 0);
  });
  test('--env production con DATABASE_URL dev aborta; con _test carga', () => {
    const bad = loadConfig(['--env', 'production'], {
      DATABASE_URL: 'postgres://x:x@127.0.0.1:1/runner_dev',
    });
    assert.notEqual(bad.status, 0);
    const ok = loadConfig(['--env', 'production'], {
      DATABASE_URL: 'postgres://x:x@127.0.0.1:1/runner_test',
    });
    assert.equal(ok.status, 0, ok.output);
  });
  test('defaults sin DB_*: host 127.0.0.1, puerto 5432, database runner_test, username runner', () => {
    const r = loadConfig([], {
      DB_HOST: undefined,
      DB_PORT: undefined,
      DB_NAME: undefined,
      DB_USER: undefined,
      DB_PASSWORD: undefined,
    });
    assert.equal(r.status, 0, r.output);
    assert.match(
      r.output,
      /TEST_ENTRY=\{.*"database":"runner_test".*"host":"127\.0\.0\.1".*"port":5432.*"username":"runner".*"dialect":"postgres"/s,
    );
  });
  test('overrides DB_* se aplican a la entrada test', () => {
    const r = loadConfig(['--env', 'test'], {
      DB_HOST: '10.0.0.9',
      DB_PORT: '5544',
      DB_NAME: 'otra_test',
      DB_USER: 'otro',
    });
    assert.equal(r.status, 0, r.output);
    assert.match(r.output, /"database":"otra_test"/);
    assert.match(r.output, /"host":"10\.0\.0\.9"/);
    assert.match(r.output, /"port":5544/);
    assert.match(r.output, /"username":"otro"/);
  });
  test('--url salta la selección de entrada: dev aborta, _test carga', () => {
    const bad = loadConfig(['--url', 'postgres://x:x@127.0.0.1:1/runner_dev']);
    assert.notEqual(bad.status, 0);
    assert.match(bad.output, /_test/i);
    const ok = loadConfig(['--url', 'postgres://x:x@127.0.0.1:1/runner_test']);
    assert.equal(ok.status, 0, ok.output);
  });
});

/**
 * Carga .sequelizerc con require y un argv sintético (primer arg dummy '_'
 * para que argv.slice(2) coincida con los flags del CLI real).
 * @param {string[]} argv
 * @param {Record<string,string|undefined>} [env]
 */
function loadRc(argv, env = {}) {
  return run(
    'node',
    ['-e', `require(${JSON.stringify(rcPath)}); console.log('RC_LOADED')`, '_', ...argv],
    { cwd: apiDir, env: { ...SAFE_ENV, ...env }, timeout: 8000 },
  );
}

describe('001: .sequelizerc preflight valida el destino elegido', () => {
  test('sin flags: env = NODE_ENV=test → carga', () => {
    const r = loadRc([]);
    assert.equal(r.status, 0, r.output);
    assert.match(r.output, /RC_LOADED/);
  });
  test('--env development aborta', () => {
    const r = loadRc(['--env', 'development']);
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
  });
  test('--env desconocido aborta (target {} → desconocida)', () => {
    const r = loadRc(['--env', 'staging']);
    assert.notEqual(r.status, 0);
    assert.match(r.output, /_test/i);
  });
  test('--url dev aborta; --url _test carga', () => {
    const bad = loadRc(['--url', 'postgres://x:x@127.0.0.1:1/runner_dev']);
    assert.notEqual(bad.status, 0);
    const ok = loadRc(['--url', 'postgres://x:x@127.0.0.1:1/runner_test']);
    assert.equal(ok.status, 0, ok.output);
  });
  test('--config a fixture válida carga', () => {
    const fixture = fileURLToPath(new URL('./fixtures/cli-use-env-config.cjs', import.meta.url));
    const r = loadRc(['--env', 'test', '--config', fixture]);
    assert.equal(r.status, 0, r.output);
  });
});
