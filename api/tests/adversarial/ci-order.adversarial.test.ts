// Spec 001 — regresión ADV (defecto verificado) del workflow CI.
//
// Defecto: ci.yml corre los tests de api/ ANTES de `npm ci` en app/. La suite
// de api inspecciona app/ (AC-06 lint/typecheck, AC-09 plugins), así que en un
// checkout limpio falla por node_modules de app ausentes. La instalación de
// app debe preceder a cualquier paso que ejecute tests en api.
// Inspección estructural del orden de steps dentro del job (sin depender de
// los nombres exactos de los pasos).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const workflowsDir = `${repoRoot}.github/workflows`;

/** Extrae pares ordenados {dir, cmd} de los steps `run:` con working-directory. */
function steps(yml: string): { dir: string; cmd: string }[] {
  const blocks = yml.split(/^\s{6}- /m).slice(1);
  const out: { dir: string; cmd: string }[] = [];
  for (const b of blocks) {
    const dir = b.match(/working-directory:\s*(\S+)/)?.[1];
    const cmd = b.match(/run:\s*(.+)/)?.[1]?.trim();
    if (dir && cmd) out.push({ dir, cmd });
  }
  return out;
}

describe('001: orden de steps en el workflow CI', () => {
  test('AC-08 (ADV-001-F6): la instalación de dependencias de app precede a los tests de api', () => {
    assert.ok(existsSync(workflowsDir), 'falta .github/workflows/');
    const files = readdirSync(workflowsDir).filter((f) => /\.(yml|yaml)$/.test(f));
    assert.ok(files.length > 0);
    const yml = files.map((f) => readFileSync(`${workflowsDir}/${f}`, 'utf8')).join('\n');
    const seq = steps(yml);
    const apiTestIdx = seq.findIndex((s) => s.dir === 'api' && /\btest\b/.test(s.cmd));
    const appInstallIdx = seq.findIndex((s) => s.dir === 'app' && /npm (ci|install|i)\b/.test(s.cmd));
    assert.notEqual(apiTestIdx, -1, 'no se encontró el step de tests de api');
    assert.notEqual(appInstallIdx, -1, 'no se encontró el step de instalación de app');
    assert.ok(
      appInstallIdx < apiTestIdx,
      `app debe instalarse antes de correr los tests de api ` +
        `(app install=${appInstallIdx}, api tests=${apiTestIdx}):\n` +
        seq.map((s, i) => `${i}: ${s.dir} -> ${s.cmd}`).join('\n'),
    );
  });
});
