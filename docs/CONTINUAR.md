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
- Re-test de `bcc9341` cerrado: F3-R3/F2-R3 corregidos, un alto F2-R4 abierto. yargs acepta `--optionsPath`/`--optionsPath=…`; nuestra lectura del rc solo reconoce `--options-path`. Con rc env development y config propio cargado, ambos aliases esquivan la guardia. Orquestador reprodujo a puerto 1 sin acceso a dev real; kebab inseguro aborta, camel más `--env test` selecciona test. Duplicados env/config/url descartados por fallar antes de conectar.
- Cuarto rojo entregado por test-writer en `c531436040a986293f1af500954bd169757f6bad`, solo tests: dos aliases camelCase inseguros, controles seguros, cobertura cliRcObject/cliEffectiveEnv y warning import/first móvil corregido. Orquestador reprodujo API129tests127pass2fail, exclusivamente F2-R4. No se cambiaron fixtures de producción, dependencias ni instrumentación.
- Cuarto fix integrado `5174dae12a41ce2799bbea7a3d8fc8b85318a148`, API-dev: únicamente `api/src/db/guard.js`, acepta camelCase de flags kebab-case separado/con `=`. Orquestador verificó diff sin tests/deps y reprodujo db-up dos veces, pipeline completo con migraciones dev/test, API129/129, app2/2, lint/typecheck sin warnings.
- Cobertura del cuarto fix API, incluyendo `src/**`, `migrations/**`, `.sequelizerc`: 100 % líneas / 93,14 % ramas / 100 % funciones global; guard100/94,87/100, config/index100/50/100, resto funcional100. App raíz/layout100 % todas las métricas. No se cambió instrumentación.
- CI del cuarto fix comprobado por SHA: https://github.com/brayanAndy1996/runner/actions/runs/38163789180 — `completed/success` para `5174dae`.
- Re-test final `e0ccbf941b504d23977c374cce13bb96` terminado sobre `5174dae`: **cero críticos/altos abiertos**, F2-R4 cerrado en ambas formas y resto de regresiones/controles re-verificados offline. Sin conexiones/autenticación a `runner_dev`, cambios de repo ni aceptación implícita de bajos/deuda.
- Reviewer independiente `8f8f993fe14e471391a07d00a7be688f`, SWE-2 High, auditó el diff y confirmó F2-R5 offline; emitió **BLOQUEADO** sobre el SHA previo `5edacf4` por el alto y siete decisiones de Bryan pendientes. CI documental de `5edacf4` observado verde: https://github.com/brayanAndy1996/runner/actions/runs/38164174038 .
- Nuevo alto F2-R5 reproducido por orquestador tras el re-test: rc externo requiere `config.js` antes de exportar env development. La guardia lee exports parciales y valida test; la caché devuelve configuración ya evaluada y el CLI selecciona development. Probe a `127.0.0.1:1`, sin acceso real a `runner_dev`. Aquí sí carga código propio, no es frontera rc.url.
- Rojo `2ae608f459b531052b01512b5aa2dae84ff879ea`, test-writer, solo regresión CLI; `6f4944cf253221ce37f518c05a43966438c23d5b` corrige el control ambiguo sin flag antes de producción. Orquestador reprodujo API 134 tests: 132 pass / 2 fail exclusivos R5. Quedan intactos los positivos de precedencia de flags explícitos.
- Quinto fix `a0518aef8e68181cd00b0a4ef92abf17c37042d9`, API-dev, solo `api/src/db/guard.js`, `api/src/db/config.js`, `api/.sequelizerc`: detecta entrada del rc CommonJS aún en carga en caché canónica y aborta `_test` antes de TCP; conserva precedencia `--env`. El orquestador comprobó diff y reprodujo ci-local con PostgreSQL16, migraciones dev/test, API134/134, app2/2, lint/typecheck ambos; `db-up.sh` otra vez idempotente, dev/test presentes. Coverage nueva: API 99,32 % líneas / 92,31 % ramas / 100 % funciones global (guard 100/94,94/100), app raíz/layout 100 % todas las métricas. Probe propio rc precargador bajo symlink: --optionsPath/kebab/= inseguro aborta guardia antes de red, --env test explícito intenta SOLO 127.0.0.1:1 en entorno test; sin acceso a runner_dev real. CI remoto nuevo SHA: https://github.com/brayanAndy1996/runner/actions/runs/38165534566 — `completed/success`.
- Re-test independiente quinto fix `e0ccbf941b504d23977c374cce13bb96` cerrado sobre `a0518ae`: **cero críticos/altos abiertos**; F2-R5 y vectores anteriores verificados offline, precarga indirecta/asíncrona y flags ambiguos seguros. No modificó repo ni aceptó deuda.
- Refuerzo integrado del test-writer: `b03819763cc6d0769a7d1aadaa0613caf38127cb` y `e4a1fce21612b3fbb659026744f92bcec4191527`, solo `api/tests/regression-cli-rc.test.js`: preflight propio `.sequelizerc`, export-first de `config.js`, symlink a rc parcialmente cargado. El orquestador revisó diff y reprodujo pipeline completo real en `e4a1fce`: API **135/135**, app **2/2**, lint/typecheck ambos, migraciones dev/test y `db-up.sh` repetido idempotente. Cobertura API actual **100 % líneas / 93,20 % ramas / 100 % funciones**; `.sequelizerc` **100/100/100**, guard **100/94,94/100**, config/index **100/50/100**; app raíz/layout **100 %**. No hubo cambios en instrumentación. CI del SHA de tests: https://github.com/brayanAndy1996/runner/actions/runs/38166143316 — `completed/success`. Producción/dependencias/scripts/CI idénticos al código del re-test `a0518ae`; probes únicamente offline/test, sin acceso a `runner_dev` real.
- **Nueva autorización:** Bryan seleccionó **«Aprobar los siete puntos»** de H-02. ADR 0001–0005 registran ajustes móviles, deuda temporal acotada, frontera CLI/factory, bajos/notas y convención adversarial estricta `.ts`. Las menciones previas de dependencias/deuda pendientes son históricas; no volver a solicitarlas como si no hubiera respuesta. No autoriza merge.
- **Siguiente acción:** mobile-dev aplica solo dependencias aprobadas; API-dev prepara tooling TS de tests y test-writer reubica regresiones sin perder aserciones. Revalidar suites/cobertura/migraciones/Docker/lint/typecheck/CI y auditoría de dependencias/adversarial; después reviewer independiente debe emitir `APROBADO` para verificar DoD y abrir PR. F5 queda aceptado como limitación, F8/F9 como deuda y F11/F7/F12 como notas bajo las condiciones de sus ADR.
- Auditor verificó además RNTL14 → test-renderer1.3/reconciler0.34 incompatible por peer con React19.2. Tabla oficial recomienda pin test-renderer1.2. Se añadió a la pregunta pendiente a Bryan; NO cambiar dependencias sin ADR/aprobación.
- Auditor de dependencias `e0ccbf941b504d23977c374cce13bb96` terminó lectura inicial. Se preguntó a Bryan por override `decode-uri-component@0.5.x` con ADR y aceptación de deuda restante; no hay respuesta todavía. No ejecutar downgrade mayor sugerido por npm audit.
- Reanimated/Worklets transitivas instaladas (4.7.1/0.13.0) difieren de la matriz Expo57 (4.5.1/0.10.1); la alineación también está pendiente de autorización y ADR. `expo install --check` dio conforme pero no validó esa combinación transitiva ni un build nativo.
- La aprobación del entorno Node24/instalaciones incrementales no autoriza cambios de dependencias. Ningún medio/bajo ni frontera del CLI externo se da por deuda aceptada.
- El reviewer previo emitió `BLOQUEADO`; no hay `APROBADO` ni PR de andamiaje. El quinto ciclo y su refuerzo de tests tienen pipeline, cobertura, CI y cierre adversarial comprobados; aún faltan decisiones, revisión independiente y DoD. Publicar PR solo al cumplir las puertas; nunca mergear sin nueva autorización.
- Sesiones hijas en máquinas separadas, secuenciales en esta rama y con commits separados por rol. Fallback real disponible: SWE-2 Medium para desarrollo/tests/adversarial y SWE-2 High para reviewer; SOL/Luna siguen siendo las preferencias documentadas, no modelos ejecutados.

## Mapa del repo

```
app/        Expo SDK 57 + TS + expo-router + dev-client; raíz Runner y layout Stack
api/        Express 5 + Sequelize 6 + Postgres 16, ESM; health/config/factory/guardia
docs/       metodología completa: planificacion (R-xx, D-xx), agents, specs NNN, decisions, api/openapi.yaml, PROGRESS, CONTINUAR
scripts/    db-up.sh, ci-local.sh (pipeline/CI verdes en e4a1fce; producción a0518ae, adversarial cero críticos/altos)
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
