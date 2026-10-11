// Spec 001 — AC-06: npm run lint y npm run typecheck pasan en api/ y app/.
// Corre los runners reales (nunca `npm test`, para no recursar la suite).

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './helpers/proc.js';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../../api/', import.meta.url));
const appDir = fileURLToPath(new URL('../../app/', import.meta.url));
const TIMEOUT = 300000;

describe('001: lint y typecheck', () => {
  for (const [pkg, dir] of [['api', apiDir], ['app', appDir]]) {
    test(`AC-06: npm run lint pasa en ${pkg}/`, () => {
      const r = run('npm', ['run', 'lint'], { cwd: dir, timeout: TIMEOUT });
      assert.equal(r.status, 0, `lint de ${pkg} falló (${r.status}):\n${r.output}`);
    });

    test(`AC-06: npm run typecheck pasa en ${pkg}/`, () => {
      const r = run('npm', ['run', 'typecheck'], { cwd: dir, timeout: TIMEOUT });
      assert.equal(r.status, 0, `typecheck de ${pkg} falló (${r.status}):\n${r.output}`);
    });
  }
});
