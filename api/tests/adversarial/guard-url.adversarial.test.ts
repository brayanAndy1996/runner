// Spec 001 — regresión ADV (defecto verificado) de la guardia de BD.
//
// Defecto: en NODE_ENV=test, resolver el nombre mirando primero `database`
// permite un bypass: createSequelize({database:'runner_test', url:'.../runner_dev'})
// no aborta aunque la conexión efectiva apunte a runner_dev. La guardia debe
// validar la config EFECTIVA que Sequelize usará (url/use_env_variable tienen
// prioridad de conexión), y abortar ANTES de conectar. Puerto 1: jamás se
// autentica contra runner_dev.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { run } from '../helpers/proc.js';

type RunResult = import('../helpers/proc.js').RunResult;

const apiDir = fileURLToPath(new URL('../../', import.meta.url));
const connectionUrl = new URL('../../src/db/connection.js', import.meta.url).href;

const DEV_URL = 'postgres://runner:runner@127.0.0.1:1/runner_dev';

/** Script del subproceso: crea la Sequelize y reporta si NO abortó. */
function childScript(configLiteral: string): string {
  return `
    const { createSequelize } = await import(${JSON.stringify(connectionUrl)});
    createSequelize(${configLiteral});
    console.log('NOT_ABORTED');
    process.exit(0);
  `;
}

function probe(configLiteral: string, env: Record<string, string> = {}): RunResult {
  return run('node', ['--input-type=module', '-e', childScript(configLiteral)], {
    cwd: apiDir,
    env: { NODE_ENV: 'test', ...env },
    timeout: 8000,
  });
}

function assertAborted(r: RunResult, ctx: string): void {
  assert.notEqual(
    r.status,
    0,
    `${ctx}: debió abortar (exit != 0) antes de conectar:\n${r.output}`,
  );
  assert.match(r.output, /_test/i, `${ctx}: el aborto debe mencionar _test:\n${r.output}`);
  assert.doesNotMatch(
    r.output,
    /NOT_ABORTED/,
    `${ctx}: createSequelize devolvió una instancia apuntando a runner_dev`,
  );
}

describe('001: regresión guardia — database válida no debe enmascarar una URL a runner_dev', () => {
  test('AC-04: database runner_test + url a runner_dev debe abortar', () => {
    const r = probe(
      JSON.stringify({ database: 'runner_test', url: DEV_URL, dialect: 'postgres' }),
    );
    assertAborted(r, 'database+url');
  });

  test('AC-04: database runner_test + use_env_variable a runner_dev debe abortar', () => {
    const r = probe(
      JSON.stringify({
        database: 'runner_test',
        use_env_variable: 'RUNNER_BYPASS_URL',
        dialect: 'postgres',
      }),
      { RUNNER_BYPASS_URL: DEV_URL },
    );
    assertAborted(r, 'database+use_env_variable');
  });
});
