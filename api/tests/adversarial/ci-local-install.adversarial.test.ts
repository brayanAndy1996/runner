// Spec 001 — regresión ADV-001-F6/F10 (defecto verificado).
//
// ci-local.sh no instala dependencias: en un clone limpio la suite de api
// falla (AC-06/AC-09 inspeccionan app/node_modules). El pipeline local debe
// registrar npm ci/install en AMBOS paquetes ANTES de cualquier validación,
// migración o test. Inyección de npm/docker falsos como en AC-07.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { run } from '../helpers/proc.js';
import { makeFakeBin } from '../helpers/fake-bin.js';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const scriptPath = `${repoRoot}scripts/ci-local.sh`;

describe('001: orden de instalación en ci-local.sh', () => {
  test('ADV-001-F6: npm ci/install en api/ y app/ preceden a migraciones, lint, typecheck y tests', () => {
    assert.ok(existsSync(scriptPath), 'falta scripts/ci-local.sh');
    const fake = makeFakeBin();
    const r = run('bash', [scriptPath], { cwd: repoRoot, env: fake.env, timeout: 120000 });
    const log = readFileSync(fake.npmLog, 'utf8');
    const lines = log.split('\n').map((l) => l.trim()).filter(Boolean);

    /** Índice de la primera línea que casa el patrón; -1 si no hay. */
    const idx = (re: RegExp) => lines.findIndex((l) => re.test(l));
    const apiInstall = idx(/^npm (ci|install|i)\b.*@ .*\/api\/?$/);
    const appInstall = idx(/^npm (ci|install|i)\b.*@ .*\/app\/?$/);
    const firstValidation = idx(/^npm (run |)(db:migrate|lint|typecheck|test)\b.*@ /);

    assert.notEqual(apiInstall, -1, `ci-local.sh nunca instala api/ (npm ci):\n${log}`);
    assert.notEqual(appInstall, -1, `ci-local.sh nunca instala app/ (npm ci):\n${log}`);
    assert.notEqual(firstValidation, -1, `no hubo validaciones en el log:\n${log}`);
    assert.ok(
      apiInstall < firstValidation && appInstall < firstValidation,
      `las instalaciones deben preceder a cualquier validación ` +
        `(api ci=${apiInstall}, app ci=${appInstall}, primera validación=${firstValidation}):\n${log}`,
    );
    assert.equal(r.status, 0, `ci-local.sh salió ${r.status}:\n${r.output}\n${log}`);
  });
});
