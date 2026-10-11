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
- **Siguiente acción:** adversarial funcional y correcciones con regresiones rojas antes del implementador. CI real falló en api tests antes de instalar app: https://github.com/brayanAndy1996/runner/actions/runs/38158531416/job/114526404983 . Verificar orden de instalaciones porque AC09 inspecciona node_modules/app.
- Orquestador confirmó sin conectar: `createSequelize({database: "runner_test", url: "postgres://runner:runner@127.0.0.1:1/runner_dev"})` en NODE_ENV=test permite nombre efectivo runner_dev. Auditar todos los destinos/precedencia/CLI; jamás reproducir conectando a runner_dev dentro de pruebas (usar stubs).
- Coverage preliminar API 91,85 % líneas / 50 % ramas en módulos cargados, falta entrypoint; app index100 % / layout0 %. No DoD final; completar todos los módulos antes del reviewer.
- Auditor verificó además RNTL14 → test-renderer1.3/reconciler0.34 incompatible por peer con React19.2. Tabla oficial recomienda pin test-renderer1.2. Se añadió a la pregunta pendiente a Bryan; NO cambiar dependencias sin ADR/aprobación.
- Auditor de dependencias `e0ccbf941b504d23977c374cce13bb96` terminó lectura inicial. Se preguntó a Bryan por override `decode-uri-component@0.5.x` con ADR y aceptación de deuda restante; no hay respuesta todavía. No ejecutar downgrade mayor sugerido por npm audit.
- Sesiones hijas en máquinas separadas, secuenciales en esta rama y con commits separados por rol. Fallback real disponible: SWE-2 Medium para desarrollo/tests/adversarial y SWE-2 High para reviewer; SOL/Luna siguen siendo las preferencias documentadas, no modelos ejecutados.

## Mapa del repo

```
app/        Expo SDK 57 + TS + expo-router + dev-client; raíz Runner y layout Stack
api/        Express 5 + Sequelize 6 + Postgres 16, ESM; health/config/factory/guardia
docs/       metodología completa: planificacion (R-xx, D-xx), agents, specs NNN, decisions, api/openapi.yaml, PROGRESS, CONTINUAR
scripts/    db-up.sh, ci-local.sh (pipeline verde local; CI remoto pendiente)
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
