// Spec 001 — AC-08: workflow de GitHub Actions en la rama.
//
// Contrato verificable en repo: existe .github/workflows/*.yml con servicio
// postgres, migraciones dev+test, y test/lint/typecheck en api/ y app/.
// El estado "verde en GitHub" es evidencia externa: lo reporta el orquestador.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const workflowsDir = `${repoRoot}.github/workflows`;

function readWorkflow() {
  assert.ok(existsSync(workflowsDir), 'falta .github/workflows/');
  const files = readdirSync(workflowsDir).filter((f) => /\.(yml|yaml)$/.test(f));
  assert.ok(files.length > 0, 'no hay workflows .yml en .github/workflows/');
  return files.map((f) => readFileSync(`${workflowsDir}/${f}`, 'utf8')).join('\n');
}

describe('001: workflow de CI', () => {
  test('AC-08: el workflow levanta postgres, migra dev+test y corre lint/typecheck/test en api y app', () => {
    const yml = readWorkflow();
    assert.match(yml, /postgres/i, 'el workflow debe declarar un servicio postgres');
    assert.match(yml, /db:migrate/, 'debe correr db:migrate');
    assert.match(yml, /NODE_ENV[=: ]+test|NODE_ENV:\s*test/, 'debe migrar también en NODE_ENV=test');
    for (const cmd of ['run lint', 'run typecheck', 'test']) {
      assert.match(yml, new RegExp(`npm[^\\n]*${cmd}`), `falta "npm ${cmd}" en el workflow`);
    }
    assert.match(yml, /api/, 'el workflow debe operar sobre api/');
    assert.match(yml, /app/, 'el workflow debe operar sobre app/');
  });
});
