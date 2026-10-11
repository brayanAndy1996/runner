// Spec 001 — AC-10: .env ignorado en api/ y app/ y .env.example sin secretos.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { run } from './helpers/proc.js';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const pkgs = ['api', 'app'];

// Heurística de "secreto real": valor largo con mezcla de mayúsculas,
// minúsculas y dígitos (tokens/keys reales). Contraseñas locales triviales
// como "runner" pasan: no son secretos (RNF-06, valores de ejemplo).
const REAL_SECRET = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+/=_-]{20,}/;

describe('001: variables de entorno', () => {
  test('AC-10: .env está ignorado por git en api/ y app/', () => {
    for (const pkg of pkgs) {
      const r = run('git', ['check-ignore', '-q', `${pkg}/.env`], { cwd: repoRoot });
      assert.equal(r.status, 0, `${pkg}/.env no está cubierto por .gitignore`);
      const rf = run('git', ['check-ignore', '-q', `${pkg}/.env.test`], { cwd: repoRoot });
      assert.equal(rf.status, 0, `${pkg}/.env.test no está cubierto por .gitignore`);
    }
  });

  test('AC-10: api/.env.example y app/.env.example existen y no contienen secretos reales', () => {
    for (const pkg of pkgs) {
      const example = `${repoRoot}${pkg}/.env.example`;
      assert.ok(existsSync(example), `falta ${pkg}/.env.example`);
      const text = readFileSync(example, 'utf8');
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (!m) continue;
        assert.doesNotMatch(
          m[2],
          REAL_SECRET,
          `${pkg}/.env.example: ${m[1]} parece un secreto real, debe ser un ejemplo`,
        );
        assert.doesNotMatch(m[2], /BEGIN .*PRIVATE KEY|sk_live|AKIA[0-9A-Z]{16}/);
      }
    }
  });
});
