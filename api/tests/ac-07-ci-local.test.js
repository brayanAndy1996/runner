// Spec 001 — AC-07: scripts/ci-local.sh ejecuta el pipeline completo en verde.
//
// No se ejecuta el pipeline real dentro de la suite (la propia suite corre
// dentro de él: recursión). Se inyecta un `npm` falso que registra cada
// invocación y un `docker` falso; así se verifica el control de flujo:
// qué comandos corre, en qué paquete, y que propaga fallos.
// La corrida real en verde queda como evidencia externa (CI/local real).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';
import { makeFakeBin } from './helpers/fake-bin.js';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const scriptPath = `${repoRoot}scripts/ci-local.sh`;

describe('001: scripts/ci-local.sh', () => {
  test('AC-07: corre lint, typecheck y test de api/ y app/ y sale 0', () => {
    assert.ok(existsSync(scriptPath), 'falta scripts/ci-local.sh');
    const fake = makeFakeBin();
    const r = run('bash', [scriptPath], { cwd: repoRoot, env: fake.env, timeout: 120000 });
    const log = readFileSync(fake.npmLog, 'utf8');
    const lines = log.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const pkg of ['api', 'app']) {
      for (const cmd of ['run lint', 'run typecheck', 'test']) {
        const expected = new RegExp(`^npm ${cmd} @ .*/${pkg}/?$`);
        assert.ok(
          lines.some((line) => expected.test(line)),
          `ci-local.sh debe ejecutar "npm ${cmd}" en ${pkg}/:\n${log}\n${r.output}`,
        );
      }
    }
    assert.equal(r.status, 0, `ci-local.sh salió ${r.status} con npm sano:\n${r.output}\n${log}`);
  });

  test('AC-07: propaga el fallo — npm test rojo en api/ hace salir != 0', () => {
    assert.ok(existsSync(scriptPath), 'falta scripts/ci-local.sh');
    const fake = makeFakeBin();
    const r = run('bash', [scriptPath], {
      cwd: repoRoot,
      env: { ...fake.env, STUB_FAIL_MATCH: '/api.*\\btest\\b' },
      timeout: 120000,
    });
    assert.notEqual(
      r.status,
      0,
      `ci-local.sh debió fallar cuando npm test de api falla, salió 0:\n${r.output}`,
    );
  });
});
