// Spec 001 — AC-01: scripts/db-up.sh levanta Postgres y crea runner_dev y
// runner_test; es idempotente.
//
// Se prueba el control de flujo del shell con un `docker` falso en PATH:
// ningún contenedor/volumen real se toca. La evidencia con Docker real
// (contenedor runner-pg, puerto 5432, ambas bases creadas de verdad) requiere
// una corrida real fuera de la suite — queda como verificación externa.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';
import { makeFakeBin } from './helpers/fake-bin.js';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const scriptPath = `${repoRoot}scripts/db-up.sh`;

describe('001: scripts/db-up.sh', () => {
  test('AC-01: scripts/db-up.sh existe, es shell y es ejecutable', () => {
    assert.ok(existsSync(scriptPath), 'falta scripts/db-up.sh');
    const mode = statSync(scriptPath).mode;
    assert.ok(mode & 0o111, 'scripts/db-up.sh no tiene bit de ejecución');
    const head = readFileSync(scriptPath, 'utf8').slice(0, 128);
    assert.match(head, /^#!.*\b(bash|sh)\b/, 'falta shebang de shell');
  });

  test('AC-01: el script levanta un Postgres 16 (runner-pg) y crea runner_dev y runner_test', () => {
    assert.ok(existsSync(scriptPath), 'falta scripts/db-up.sh');
    const fake = makeFakeBin();
    const r = run('bash', [scriptPath], { cwd: repoRoot, env: fake.env, timeout: 30000 });
    assert.equal(r.status, 0, `db-up.sh salió ${r.status}:\n${r.output}`);
    const log = readFileSync(fake.dockerLog, 'utf8');
    assert.match(
      log,
      /docker run[^\n]*runner-pg|docker run[^\n]*--name[= ]+runner-pg/,
      `el script debe crear el contenedor runner-pg:\n${log}`,
    );
    assert.match(log, /postgres:16|postgres\b/, `debe usar imagen postgres:\n${log}`);
    assert.match(log, /runner_dev/, `debe crear la base runner_dev:\n${log}`);
    assert.match(log, /runner_test/, `debe crear la base runner_test:\n${log}`);
  });

  test('AC-01: es idempotente — una segunda corrida también sale 0', () => {
    assert.ok(existsSync(scriptPath), 'falta scripts/db-up.sh');
    const fake = makeFakeBin();
    const r1 = run('bash', [scriptPath], { cwd: repoRoot, env: fake.env, timeout: 30000 });
    assert.equal(r1.status, 0, `primera corrida salió ${r1.status}:\n${r1.output}`);
    const r2 = run('bash', [scriptPath], { cwd: repoRoot, env: fake.env, timeout: 30000 });
    assert.equal(
      r2.status,
      0,
      `segunda corrida (idempotencia) salió ${r2.status}:\n${r2.output}`,
    );
  });
});
