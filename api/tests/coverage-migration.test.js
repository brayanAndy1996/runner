// Spec 001 — cobertura post-verde de migrations/*-enable-pgcrypto.js.
// up/down se verifican con un queryInterface falso: SQL exacto e idempotente,
// sin ejecutar DDL real ni tocar runner_dev.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

const migrationUrl = new URL(
  '../migrations/20261011170000-enable-pgcrypto.js',
  import.meta.url,
).href;

/** QueryInterface falso que registra las queries ejecutadas. */
function fakeQueryInterface() {
  /** @type {string[]} */
  const queries = [];
  return {
    queries,
    sequelize: {
      /** @param {string} sql */
      async query(sql) {
        queries.push(sql);
        return [];
      },
    },
  };
}

describe('001: migración enable-pgcrypto (cobertura)', () => {
  test('up ejecuta CREATE EXTENSION IF NOT EXISTS pgcrypto (idempotente)', async () => {
    const { up } = await import(migrationUrl);
    const qi = fakeQueryInterface();
    await up(qi);
    assert.deepEqual(qi.queries, ['CREATE EXTENSION IF NOT EXISTS pgcrypto;']);
    // Idempotente: dos corridas emiten el mismo SQL seguro.
    await up(qi);
    assert.deepEqual(qi.queries, [
      'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
      'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
    ]);
  });

  test('down ejecuta DROP EXTENSION IF EXISTS pgcrypto (idempotente)', async () => {
    const { down } = await import(migrationUrl);
    const qi = fakeQueryInterface();
    await down(qi);
    assert.deepEqual(qi.queries, ['DROP EXTENSION IF EXISTS pgcrypto;']);
    await down(qi);
    assert.equal(qi.queries.length, 2);
  });
});
