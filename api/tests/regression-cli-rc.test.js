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

  // NOTA (corrección del orquestador): rc.url no es exigible — con args.url
  // el config-helper del CLI omite cargar config.js, así que no corre código
  // propio y la guardia no puede actuar. Solo `env` (que sí carga nuestro
  // config) está dentro de la frontera.

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

  test('control — el flag --env test tiene precedencia sobre rc env:"development"', () => {
    const cwd = rcDir({ config: configAbs, env: 'development' });
    assertNetworkDeath(cli(cwd, ['--env', 'test']), 'flag --env test sobre rc development');
  });

  test('control — rc env:"test" + flag --env development aborta (el flag gana)', () => {
    const cwd = rcDir({ config: configAbs, env: 'test' });
    assertGuardAbort(cli(cwd, ['--env', 'development']), 'rc test + flag --env development');
  });
});

describe('001: ADV-001-F2-R4 — --optionsPath camelCase no leído por la guardia', () => {
  // yargs acepta `--optionsPath` (camelCase) además de `--options-path`; la
  // guardia solo lee la forma kebab → el rc camel se aplica sin validar.
  // rc generado en tmpdir (fuera del repo) apuntando a nuestro config.js.
  /** @param {string[]} optArgs */
  function camelCaseRc(optArgs) {
    const dir = rcDir({ config: configAbs, env: 'development' });
    const rcPath = join(dir, 'rc-camel.cjs');
    writeFileSync(rcPath, `module.exports = ${JSON.stringify({ config: configAbs, env: 'development' })};\n`);
    return cli(apiDir, [...optArgs.map((a) => a.replace('RC_PATH', rcPath))]);
  }

  test('ADV-001-F2-R4: --optionsPath <rc> con env:"development" debe abortar', () => {
    assertGuardAbort(camelCaseRc(['--optionsPath', 'RC_PATH']), '--optionsPath separado');
  });

  test('ADV-001-F2-R4: --optionsPath=<rc> con env:"development" debe abortar', () => {
    assertGuardAbort(camelCaseRc(['--optionsPath=RC_PATH']), '--optionsPath= forma');
  });

  /** @param {string[]} optArgs @param {string[]} [cliArgs] */
  function camelCaseEnv(optArgs, cliArgs = []) {
    const dir = mkdtempSync(join(tmpdir(), 'runner-cli-rc-'));
    const rcPath = join(dir, 'rc-camel.cjs');
    writeFileSync(rcPath, `module.exports = ${JSON.stringify({ config: configAbs, env: 'test' })};\n`);
    return cli(apiDir, [...optArgs.map((a) => a.replace('RC_PATH', rcPath)), ...cliArgs]);
  }

  test('control — --optionsPath con env:"test" (ambas formas) muere por red SIN guardia', () => {
    assertNetworkDeath(camelCaseEnv(['--optionsPath', 'RC_PATH']), 'camel env=test separado');
    assertNetworkDeath(camelCaseEnv(['--optionsPath=RC_PATH']), 'camel env=test forma =');
  });

  test('control — flag --env test precede a rc camel env:"development" (ambas formas)', () => {
    const dir = rcDir({ config: configAbs, env: 'development' });
    const rcPath = join(dir, 'rc-camel.cjs');
    writeFileSync(rcPath, `module.exports = ${JSON.stringify({ config: configAbs, env: 'development' })};\n`);
    assertNetworkDeath(
      cli(apiDir, ['--optionsPath', rcPath, '--env', 'test']),
      'camel rc dev + flag --env test',
    );
    assertNetworkDeath(
      cli(apiDir, [`--optionsPath=${rcPath}`, '--env', 'test']),
      'camel= rc dev + flag --env test',
    );
  });
});

describe('001: ADV-001-F2-R5 — rc que precarga config.js (ciclo parcial)', () => {
  // Verificado por el orquestador: un rc externo que hace
  // `require(<config.js>)` ANTES de exportar carga nuestro config mientras sus
  // exports aún son {} — la guardia evalúa la entrada "test" (sin --env) y
  // pasa; la caché de módulos devuelve el config ya evaluado; luego el CLI
  // elige development y llega a TCP. Guardia exigida ANTES de la red.
  /**
   * @param {string} env
   * @returns {string} path al rc generado
   */
  function preloadRc(env) {
    const dir = mkdtempSync(join(tmpdir(), 'runner-cli-rc5-'));
    const p = join(dir, 'rc.cjs');
    writeFileSync(
      p,
      `require(${JSON.stringify(configAbs)});\n` +
        `module.exports = ${JSON.stringify({ config: configAbs, env })};\n`,
    );
    return p;
  }

  test('ADV-001-F2-R5: --options-path con rc preload env:"development" debe abortar', () => {
    assertGuardAbort(cli(apiDir, ['--options-path', preloadRc('development')]), 'preload kebab');
  });

  test('ADV-001-F2-R5: --optionsPath con rc preload env:"development" debe abortar (ambas formas)', () => {
    assertGuardAbort(cli(apiDir, ['--optionsPath', preloadRc('development')]), 'preload camel');
    assertGuardAbort(
      cli(apiDir, [`--optionsPath=${preloadRc('development')}`]),
      'preload camel=',
    );
  });

  test('control — rc preload env:"test" no conecta a base insegura: puede abortar por ciclo ambiguo', () => {
    // Sin flag --env explícito, Node no conoce el export final del rc al
    // precargar config.js: el fix puede fallar cerrado (aborto por guardia)
    // o validar env=test y morir por red. Ambos son seguros; lo inaceptable
    // sería alcanzar la red con destino dev, cosa que no ocurre (puerto 1).
    const r = cli(apiDir, ['--options-path', preloadRc('test')]);
    if (/Guardia de tests/i.test(r.output)) {
      assertGuardAbort(r, 'preload env=test fail-closed');
    } else {
      assertNetworkDeath(r, 'preload env=test red sin guardia');
    }
  });

  test('control — rc preload dev + --env test explícito conserva precedencia de flag', () => {
    assertNetworkDeath(
      cli(apiDir, ['--options-path', preloadRc('development'), '--env', 'test']),
      'preload dev + flag --env test',
    );
  });

  test('control — --env development explícito aborta aunque el rc diga test', () => {
    assertGuardAbort(
      cli(apiDir, ['--options-path', preloadRc('test'), '--env', 'development']),
      'preload test + flag --env development',
    );
  });
});
