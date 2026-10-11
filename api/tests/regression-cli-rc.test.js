// Spec 001 — regresión ADV-001-F2-R3 (verificada por el auditor en retest):
// el archivo rc del CLI (cwd/.sequelizerc o --options-path) alimenta
// yargs.config(): las claves `env` y `url` se consumen como si fueran flags,
// pero la guardia solo evalúa process.argv → con NODE_ENV=test cree que el
// destino es config.test y el CLI opera sobre development/--url dev.
// Estas pruebas usan el CLI real (bin local) con nuestro config.js cargado
// por path absoluto — mismo vector verificado—, host 127.0.0.1 puerto 1:
// cualquier intento real muere con ECONNREFUSED; la guardia debe cortar ANTES.
// Los .sequelizerc maliciosos se generan en tmpdir (fuera del repo). Nunca
// host/BD dev reales, nunca el camino sin código propio cargado (frontera).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './helpers/proc.js';

const apiDir = fileURLToPath(new URL('../', import.meta.url));
const bin = fileURLToPath(
  new URL('../node_modules/sequelize-cli/lib/sequelize', import.meta.url),
);
const configAbs = fileURLToPath(new URL('../src/db/config.js', import.meta.url));

const CLI_ENV = {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_USER: 'runner',
  DB_PASSWORD: 'runner',
  DB_NAME: undefined,
  DATABASE_URL: undefined,
};

/** Directorio temporal con .sequelizerc del contenido dado. */
function rcDir(/** @type {Record<string,unknown>} */ rc) {
  const dir = mkdtempSync(join(tmpdir(), 'runner-cli-rc-'));
  writeFileSync(join(dir, '.sequelizerc'), `module.exports = ${JSON.stringify(rc)};\n`);
  return dir;
}

/**
 * @param {string} cwd
 * @param {string[]} [args]
 * @param {Record<string,string|undefined>} [extra]
 */
function cli(cwd, args = [], extra = {}) {
  const env = /** @type {Record<string,string|undefined>} */ ({
    ...process.env,
    ...CLI_ENV,
    ...extra,
  });
  return run(process.execPath, [bin, 'db:migrate:status', ...args], {
    cwd,
    env,
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
    `${ctx}: llegó a intentar conectar:\n${r.output}`,
  );
}

/**
 * @param {import('./helpers/proc.js').RunResult} r
 * @param {string} ctx
 */
function assertNetworkDeath(r, ctx) {
  assert.notEqual(r.status, 0, `${ctx}: debió morir por red:\n${r.output}`);
  assert.match(r.output, /ECONNREFUSED|ConnectionRefusedError|connect/i);
  assert.doesNotMatch(r.output, /Guardia de tests/, `${ctx}: abortó por guardia siendo seguro:\n${r.output}`);
}

describe('001: ADV-001-F2-R3 — claves env/url del rc del CLI', () => {
  test('rc cwd con env:"development" debe abortar (no ECONNREFUSED)', () => {
    const cwd = rcDir({ config: configAbs, env: 'development' });
    assertGuardAbort(cli(cwd), 'cwd/.sequelizerc env=development');
  });

  test('rc cwd con url .../runner_dev debe abortar (no ECONNREFUSED)', () => {
    const cwd = rcDir({
      config: configAbs,
      url: 'postgres://runner:runner@127.0.0.1:1/runner_dev',
    });
    assertGuardAbort(cli(cwd), 'cwd/.sequelizerc url=runner_dev');
  });

  test('--options-path con env:"development" debe abortar', () => {
    const dir = rcDir({ config: configAbs, env: 'development' });
    assertGuardAbort(
      cli(apiDir, ['--options-path', join(dir, '.sequelizerc')]),
      '--options-path env=development',
    );
  });

  test('control — rc cwd con env:"test" muere por red SIN guardia', () => {
    const cwd = rcDir({ config: configAbs, env: 'test' });
    assertNetworkDeath(cli(cwd), 'rc env=test');
  });

  test('control — rc cwd con url .../runner_test muere por red SIN guardia', () => {
    const cwd = rcDir({
      config: configAbs,
      url: 'postgres://runner:runner@127.0.0.1:1/runner_test',
    });
    assertNetworkDeath(cli(cwd), 'rc url=runner_test');
  });

  test('control — el flag --env test tiene precedencia sobre rc env:"development"', () => {
    const cwd = rcDir({ config: configAbs, env: 'development' });
    assertNetworkDeath(cli(cwd, ['--env', 'test']), 'flag --env test sobre rc development');
  });
});
