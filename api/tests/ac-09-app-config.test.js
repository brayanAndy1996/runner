// Spec 001 — AC-09: app.json configura expo-dev-client y los plugins de cada
// paquete que los soporta; app/README.md documenta el arranque con dev-build.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../../app/', import.meta.url));
const appJsonPath = `${appDir}app.json`;
const readmePath = `${appDir}README.md`;
const pkgJsonPath = `${appDir}package.json`;

/**
 * Dependencias directas de app/ que traen config plugin (app.plugin.js).
 * @returns {string[]}
 */
function depsWithConfigPlugin() {
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  return Object.keys(pkg.dependencies ?? {}).filter((dep) =>
    existsSync(`${appDir}node_modules/${dep}/app.plugin.js`),
  );
}

/**
 * Nombres de plugin declarados en app.json (entradas string o [nombre, opts]).
 * @returns {Set<string>}
 */
function declaredPlugins() {
  assert.ok(existsSync(appJsonPath), 'falta app/app.json');
  const json = JSON.parse(readFileSync(appJsonPath, 'utf8'));
  const plugins = json?.expo?.plugins;
  assert.ok(Array.isArray(plugins), 'app.json debe declarar expo.plugins[]');
  return new Set(plugins.map((p) => (Array.isArray(p) ? p[0] : p)));
}

describe('001: configuración Expo (app.json + README)', () => {
  test('AC-09: app.json declara expo-dev-client y todos los plugins que sus dependencias soportan', () => {
    const declared = declaredPlugins();
    assert.ok(declared.has('expo-dev-client'), 'falta el plugin expo-dev-client');
    assert.ok(declared.has('expo-router'), 'falta el plugin expo-router');
    for (const dep of depsWithConfigPlugin()) {
      assert.ok(
        declared.has(dep),
        `${dep} trae config plugin (app.plugin.js) pero no está declarado en app.json`,
      );
    }
  });

  test('AC-09: cada plugin declarado corresponde a un paquete que lo provee', () => {
    const declared = declaredPlugins();
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    const installed = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      'expo',
    ]);
    for (const name of declared) {
      const dep = name === 'expo-router' ? 'expo-router' : name;
      assert.ok(
        installed.has(dep) && existsSync(`${appDir}node_modules/${dep}`),
        `plugin "${name}" declarado sin paquete instalado que lo provea`,
      );
    }
  });

  test('AC-09: app/README.md documenta el arranque con dev-build', () => {
    assert.ok(existsSync(readmePath), 'falta app/README.md');
    const readme = readFileSync(readmePath, 'utf8');
    assert.match(readme, /dev[- ]?(build|client)/i, 'el README debe explicar el dev-build/dev-client');
    assert.match(
      readme,
      /expo run:(android|ios)|eas build/i,
      'el README debe indicar cómo generar/correr el build (expo run:* o eas build)',
    );
    assert.match(
      readme,
      /emulador|dispositivo|simulador/i,
      'el README debe mencionar emulador o dispositivo',
    );
  });
});
