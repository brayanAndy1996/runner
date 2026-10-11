# CONTINUAR — Runner

Contexto para retomar el proyecto en una conversación nueva sin historial. Se actualiza al final de cada paso del ciclo.

## Qué es esto

Red social para runners/caminantes: recorridos GPS con mapa (MapLibre), fotos/videos tomadas solo en el momento, comunidad por ciudad, tab explorar, compartir con marca de agua. Fase 2: grupos con eventos y publicaciones.

## Estado exacto (2026-10-11)

- Planificación integrada en `main` con permiso de Bryan; spec 001 aprobada. Rama actual: `feat/001-andamiaje`. No hay permiso para mergear el andamiaje.
- Decisiones del usuario: `docs/planificacion.md` §1 (D-01 a D-08).
- Preparación API integrada (`67f1802`, sesión `f4fcace13a274c7c96bc2f8388bbe954`): dependencias/runners sin fuente ni tests; todavía no hay rojo/verde.
- Preparación móvil integrada (`21b8be5`, sesión `9ba161392a30429398acbe151078dcc8`): manifiestos/configs SDK 57, sin fuente ni tests.
- Rojo AC-01..AC-10 verificado: test-writer `68ed39c3af924cfcab2b7315bbd20aee`, commits `3883878` + `19f23b8`; API 21 tests (6 pass/15 fail), app 1 fail. RNTL 14 exige `await render` (corregido antes de verde); fixture temporal de prueba pasó. El orquestador reprodujo el rojo API y leyó logs.
- API implementada por `f4fcace13a274c7c96bc2f8388bbe954`, commit `929c2a6`, sin tests: health, Sequelize/guardia, migración pgcrypto, scripts y workflow. Orquestador reprodujo Docker idempotente y migraciones dev/test. API 18/21 tras corrección de harness AC-07 exclusivamente por test-writer (`cd9075a`); solo AC-09 pendiente y raíz móvil aún roja.
- Móvil implementado (`2b399be`, sesión `9ba161392a30429398acbe151078dcc8`): raíz/layout, app.json con 13 plugins, README dev-build, elimina passWithNoTests. Reportó introspect/export Android verdes. Orquestador reprodujo pipeline local real exit 0 (API21/21, app1/1, migraciones dev/test, lint/typecheck ambos).
- Primer fix `b215a32` corrigió la precedencia efectiva de guardia/factory, replication, CLI y orden de instalaciones de CI. Tras el re-test, test-writer añadió `9492df0`, `31042c7` y `a09e8fc`; el orquestador reprodujo 80 tests API (68 pass/12 fail), todos los rojos por los defectos residuales.
- Segundo fix integrado `af5db1b`: solo `guard.js`, `connection.js`, `config.js` y `.sequelizerc`, sin tocar tests/deps. Rechaza replication falsy explícita, propaga fallback seguro para URLs sin pathname, valida pathname completo y distingue merge CLI/selección real `--env`.
- Checkpoint reproducido por orquestador en `af5db1b`: Docker PostgreSQL16 idempotente dos veces; pipeline completo con migraciones dev/test, 80/80 API, 2/2 app, lint/typecheck exit0. CI remoto verde para ese commit: https://github.com/brayanAndy1996/runner/actions/runs/38161717783 .
- Coverage del checkpoint: API global 97,71 % líneas / 76,74 % ramas / 100 % funciones (incluye fixtures/config), guard92,55/84,44, config100/20, index100/40; app src100 % en todas las métricas, raíz y layout incluidos. Test-writer amplía ramas sin excluir módulos ni alterar instrumentación. No afirmar cobertura final/DoD todavía.
- Re-test adversarial del segundo fix cerrado: F3-R3 alto (`database` heredada en replication.write/read) y F2-R3 alto (`env` del rc de sequelize-cli selecciona `development` aunque `config.js` propio valide `test`). La variante rc `url` fue corregida como falso positivo: CLI no carga nuestro config si recibe una URL, queda fuera de la guardia y requiere decidir política de wrapper. Sin accesos a la BD `runner_dev`.
- Test-writer añadió solo tests en `60cc55c`, `c9f463a`, `30f6389`, `9a85995`, `269f4e7`. Orquestador reprodujo API 121 pruebas: 117 verdes y cuatro rojas (F3-R3×2, F2-R3×2) contra código pre-fix; controles seguros verdes, puerto 1. Cobertura API real incluyendo `src/**` y `migrations/**`: 100 % líneas / 90,54 % ramas / 100 % funciones global; guard 100/92,16, config e index 100/50 líneas/ramas.
- Tercer fix integrado `bcc934168889b16c40dc1079363a36949bb9c3bb`: solo producción (`guard.js`, `config.js`, `.sequelizerc`). Comprueba `database` propia/heredada y resuelve entorno CLI `--env > rc.env > NODE_ENV`, evitando el ciclo del rc propio. Orquestador verificó diff y pipeline completo: migraciones dev/test, API121/121, app2/2, lint/typecheck exit0; warning móvil `import/first` existente.
- CI remoto comprobado directamente para `bcc9341`: https://github.com/brayanAndy1996/runner/actions/runs/38162896849 — `completed/success`. No constituye cierre adversarial ni aprobación de reviewer.
- Cobertura del tercer fix medida por orquestador, API incluyendo `src/**`, `migrations/**` y `.sequelizerc`: 99,50 % líneas / 86,90 % ramas / 100 % funciones global; guard99,04/86,67/100, config e index100/50/100, resto funcional100. App raíz y layout100 % todas las métricas, 2/2. No se excluyeron módulos funcionales ni se cambió la instrumentación.
- **Siguiente acción:** recibir re-test adversarial de `bcc9341` (`e0ccbf941b504d23977c374cce13bb96`, en curso); si encuentra defectos reales, convertirlos en rojos por test-writer antes de API-dev. Obtener decisiones de deuda/dependencias con Bryan antes de reviewer APROBADO/PR.
- Auditor verificó además RNTL14 → test-renderer1.3/reconciler0.34 incompatible por peer con React19.2. Tabla oficial recomienda pin test-renderer1.2. Se añadió a la pregunta pendiente a Bryan; NO cambiar dependencias sin ADR/aprobación.
- Auditor de dependencias `e0ccbf941b504d23977c374cce13bb96` terminó lectura inicial. Se preguntó a Bryan por override `decode-uri-component@0.5.x` con ADR y aceptación de deuda restante; no hay respuesta todavía. No ejecutar downgrade mayor sugerido por npm audit.
- Reanimated/Worklets transitivas instaladas (4.7.1/0.13.0) difieren de la matriz Expo57 (4.5.1/0.10.1); la alineación también está pendiente de autorización y ADR. `expo install --check` dio conforme pero no validó esa combinación transitiva ni un build nativo.
- La aprobación del entorno Node24/instalaciones incrementales no autoriza cambios de dependencias. Ningún medio/bajo ni frontera del CLI externo se da por deuda aceptada.
- Aún no hay reviewer `APROBADO` ni PR de andamiaje. Repetir pipeline, cobertura, adversarial y CI sobre el fix final; después reviewer independiente y DoD/documentación. Publicar PR solo al cumplir las puertas; nunca mergear sin nueva autorización.
- Sesiones hijas en máquinas separadas, secuenciales en esta rama y con commits separados por rol. Fallback real disponible: SWE-2 Medium para desarrollo/tests/adversarial y SWE-2 High para reviewer; SOL/Luna siguen siendo las preferencias documentadas, no modelos ejecutados.

## Mapa del repo

```
app/        Expo SDK 57 + TS + expo-router + dev-client; raíz Runner y layout Stack
api/        Express 5 + Sequelize 6 + Postgres 16, ESM; health/config/factory/guardia
docs/       metodología completa: planificacion (R-xx, D-xx), agents, specs NNN, decisions, api/openapi.yaml, PROGRESS, CONTINUAR
scripts/    db-up.sh, ci-local.sh (pipeline y CI verdes en bcc9341; pendiente cierre adversarial)
CONSTITUCION.md  stack exacto, comandos, convenciones, DoD
```

## Reglas que no se negocian (resumen)

- Nada se implementa sin spec aprobada por el usuario. Quien implementa nunca toca tests. Rojo comprobado antes del verde.
- R-01 local-first sin cuenta · R-02 social solo con sesión · R-03 privado por defecto · R-04 media solo-en-el-momento (flag `ALLOW_GALLERY_PICKER` solo `__DEV__`) · R-05 reclamo de datos al autenticarse · R-08 segundo plano obligatorio · R-10 tests solo contra `runner_test` con guardia.
- Conventional Commits por rol, rutas explícitas, nunca `git add -A`. Merge a main solo con permiso.

## Trampas conocidas

- Api es ESM pero `.sequelizerc` DEBE ser CommonJS o sequelize-cli falla ("__esModule" error). Migraciones `.js` en ESM sí funcionan.
- Tests api comparten `runner_test`: correr serializados (`--test-concurrency=1`) y migrar la BD de test tras cada migración nueva.
- Expo Go NO sirve: el GPS en segundo plano exige dev-build (expo-dev-client/EAS).
- Verificación iOS real requiere entorno macOS/dispositivo — coordinarla explícitamente (sesión hija macOS) cuando toque.

## Preferencias del usuario

- Español en UI/docs; inglés en código. Reportes breves: qué se hizo, archivos, comandos con resultado, pendientes.
- Metodología SDD+TDD+adversarial completa con subagentes por rol (`docs/agents/`).
