# PROGRESS — Runner

Estado del proyecto. Actualizado por el orquestador al cerrar cada paso del ciclo.

## Estado actual

- **Fase:** spec 001 implementada en la rama; siete puntos H-02 aplicados y revalidados, auditoría adversarial sin críticos/altos abiertos, reviewer independiente `APROBADO` y DoD verificado. La rama está lista para revisión mediante PR, no para merge sin permiso nuevo.
- **Rama:** `feat/001-andamiaje`, desde la planificación integrada en `main`.
- **Siguiente acción:** publicar el PR de andamiaje y esperar la decisión de Bryan. No arrancar spec 002 ni fusionar el andamiaje por inferencia.

## Tabla de funcionalidades

| NNN | Funcionalidad | Estado |
| --- | --- | --- |
| 001 | Andamiaje | Implementada en rama; reviewer `APROBADO` y DoD verificado; lista para revisión en PR, merge no autorizado |
| 002 | Recorrido local (tracking GPS, 2º plano) | spec propuesta |
| 003 | Mapa del recorrido (MapLibre) | spec propuesta |
| 004 | Inicio runner (podómetro + resumen) | spec propuesta |
| 005 | Auth, perfil y sincronización | spec propuesta |
| 006 | Fotos/videos en el momento | spec propuesta |
| 007 | Comunidad por ciudad | spec propuesta |
| 008 | Explorar (tab social) | spec propuesta |
| 009 | Compartir con marca de agua | spec propuesta |
| 010 | Grupos, eventos y publicaciones (fase 2) | spec propuesta |
| 011 | Media en Cloudflare R2 (producción) | spec propuesta |

## Decisiones del usuario

- 2026-10-11: D-01 a D-07 registradas en `docs/planificacion.md` (MapLibre, Android+iOS, fase 2 = grupos/eventos/publicaciones, uso sin cuenta + email/Google/Apple, media local→R2, GPS 2º plano, privado por defecto).
- 2026-10-11: D-08 — perfil con peso, sexo y altura para estimación de calorías (también en perfil local sin cuenta).
- 2026-10-11: modo de agente por rol fijado — alto: GPT-sol 6.1 high (orquestador, spec-writer, reviewer); medio y medio-bajo: GPT-sol 6.1 medium (api-dev, mobile-dev, test-writer); ágil: GPT-6 luna max (adversarial-tester). Mapeo en `docs/agents/orquestador.md`.
- 2026-10-11: Bryan autorizó integrar el PR de planificación en `main` y arrancar spec 001 con el orquestador y sesiones hijas. El permiso no incluye el merge del futuro PR de andamiaje.

## Ejecución de spec 001

Registro cronológico: cada checkpoint describe su estado de entonces; los pendientes actuales figuran en «Estado actual» y «Verificación final H-02».

- Preparación de dependencias anterior al rojo según la excepción de CONSTITUCION.md §4. No se anticipan `/health`, guardia, migraciones, pantalla raíz ni scripts funcionales antes del test-writer.
- Versiones comprobadas en npm: Expo 57.0.27, Express 5.3.0, React Native 0.86.3 y MapLibre 11.5.0 disponibles; se mantienen los rangos aprobados.
- Fallback de modelos: el selector de sesiones hijas solo expone SWE-2 Medium/High/Max, no SOL/Luna. Orquestador y reviewer: SWE-2 High; api-dev, mobile-dev, test-writer y adversarial-tester: SWE-2 Medium. No se afirma equivalencia de modelo ni coste con SOL/Luna.
- Coordinación directa en sesiones aisladas, por etapas y sin escritores simultáneos en la misma rama. El workflow evaluado no expone los identificadores SWE-2 de este selector; las sesiones directas permiten seleccionar el fallback por rol y verificar el rojo personalmente antes del verde.
- La autorización de arrancar spec 001 incluye sus supuestos de monorepo sin workspaces y CI sin build nativo. Los supuestos de otras specs no se dan por resueltos.
- Preparación API verificada: sesión `f4fcace13a274c7c96bc2f8388bbe954`, commit `67f1802`; dependencias y runners disponibles, sin fuente ni tests. `npm test` ejecutó cero tests: no es evidencia de verde. Contrato propuesto: `createApp()` en `api/src/app.js`, configuración ESM en `api/src/db/config.js`, JS con JSDoc/checkJs. Se delega ahora preparación móvil.
- Aviso de dependencia para auditoría adversarial: el api-dev reportó dos vulnerabilidades moderadas transitivas de `uuid` en Sequelize; pendiente de comprobación y decisión, sin aplicar cambios automáticos fuera del stack aprobado.
- Preparación móvil verificada: sesión `9ba161392a30429398acbe151078dcc8`, commit `21b8be5`; SDK 57/RN 0.86.3/React 19.2.3, runners disponibles, sin fuente ni tests. `expo install --check` reportado conforme; cero tests todavía no constituye verde. Contrato: `app/src/app/index.tsx` con texto Runner y `_layout.tsx` para expo-router. La auditoría móvil reporta avisos transitivos, pendientes de evaluación adversarial.
- Rojo verificado por el orquestador: sesión test-writer `68ed39c3af924cfcab2b7315bbd20aee`, commits `3883878` y `19f23b8` exclusivamente de tests. API: 21 tests, 6 verdes de preparación (AC-06/AC-10), 15 rojos por funcionalidad ausente. App: 1 test rojo por ausencia de raíz. El orquestador reprodujo el rojo API y leyó ambos logs. Corrigió el test-writer un defecto de harness antes del verde: RNTL 14 exige `await render`; su fixture temporal pasó.
- AC-01 y AC-07 prueban control de flujo con ejecutables falsos para evitar operaciones en BD de desarrollo y recursión; requieren además Docker/pipeline reales. AC-08 tiene prueba estructural y requiere CI real verde. AC-03 prueba migración real solo en `runner_test`; la migración dev se verificará fuera de la suite.
- Auditoría inicial de dependencias: sesión `e0ccbf941b504d23977c374cce13bb96`, solo lectura. Advierte `decode-uri-component` en deep links (media), `node-forge` en firma/prebuild (media) y `braces`/`sprintf-js`/`uuid` (bajas por uso actual). npm audit conserva altas transitivas. Pendiente de autorización de Bryan para override de `decode-uri-component@0.5.x` con ADR y aceptación explícita de las demás como deuda; no aplicado ni asumido.
- Implementación API: sesión `f4fcace13a274c7c96bc2f8388bbe954`, commit `929c2a6` exclusivamente de producción/config/OpenAPI. Health, config/factory/guardia, migración pgcrypto, db-up/ci-local y workflow. El orquestador reprodujo db-up real dos veces, migración dev y test, y suite API (17/21 antes de corregir harness).
- Segundo defecto de harness identificado tras implementar: AC-07 anclaba cada comando al final del log entero, imposible verificar seis líneas. Test-writer corrigió solo la prueba en `cd9075a`, validó log completo y rechazo de línea ausente; mantiene seis comprobaciones. Resultado delegado: API 18/21, solo AC-09 pendiente de móvil; app sigue roja por raíz ausente. Nunca modificó tests el implementador.
- Cobertura preliminar API medida por el orquestador: líneas 91,85 %, ramas 50 % en módulos cargados; no incluye todavía el entrypoint sin ejecutar. NO es evidencia DoD final: ampliar casos y medir todos los módulos/ramas después de adversarial.
- Peer warning móvil comprobado: RNTL 14 auto-instaló test-renderer 1.3/reconciler 0.34 (React 19.3); React constitucional es 19.2. Auditor verificó tabla oficial RNTL: recomienda test-renderer 1.2/reconciler 0.33. Se pidió autorización para pin explícito devDependency `~1.2.0` con ADR junto al override anterior. Fixture Text pasó, pero no reemplaza la compatibilidad oficial. Ningún ajuste aplicado aún.
- Implementación móvil: sesión `9ba161392a30429398acbe151078dcc8`, commit `2b399be` exclusivamente app fuente/config/README/script test sin passWithNoTests. Raíz Runner, layout Stack, 13 plugins directos y permisos ES. Reportó config introspect, expo install --check y export Android verdes; sin build nativo ni iOS (fuera de alcance 001).
- Verde local reproducido por el orquestador después de `2b399be`: `scripts/ci-local.sh` completo exit 0, migraciones dev/test y lint/typecheck de ambos; API 21/21, app 1/1. No sustituye AC-08 real ni DoD de cobertura.
- CI real de rama falló en etapa api tests, antes de instalar app: https://github.com/brayanAndy1996/runner/actions/runs/38158531416/job/114526404983 . La página pública muestra pasos/status; logs requieren login. Posible orden incorrecto: suite API inspecciona plugins en node_modules de app que CI todavía no instaló. Repro y regresión se delegan.
- Inspección del orquestador confirmó bypass de guardia: NODE_ENV=test con `database: runner_test` y `url: postgres://runner:runner@127.0.0.1:1/runner_dev` permite construir Sequelize con nombre efectivo runner_dev. Solo instanciación/lectura/close, sin conexión a la BD. Bloqueante a validar por adversarial; cubrir precedencia, URLs/query/percent-encoding/dialectOptions/replication y CLI con stubs que impidan cualquier acceso a runner_dev.
- Gap cobertura móvil confirmado por mobile-dev: raíz 100 %, layout 0 %. Aumentar pruebas sin excluir módulos para maquillar métricas.

### Checkpoint del segundo fix (2026-10-11)

- Primer fix `b215a32`: precedencia efectiva, replication, preflight CLI y orden de instalación de ambas dependencias antes de las pruebas API. Se mantuvo el ciclo rojo → fix sin modificar tests desde API-dev.
- Re-test residual convertido en pruebas por test-writer: `9492df0`, `31042c7` y `a09e8fc`. El orquestador verificó 80 tests API: 68 pass y 12 fail por valores falsy explícitos en replication, URL sin pathname, merge real del CLI, pathname multipath y CLI desde otro CWD con `--config` absoluto.
- Segundo fix `af5db1b`: API-dev modificó solamente `api/src/db/guard.js`, `connection.js`, `config.js` y `api/.sequelizerc`; no tests, dependencias ni lockfiles. La fábrica propaga el fallback seguro a Sequelize; la guardia CLI diferencia la semántica de `parseDbUrl`/`lodash.merge`, valida el pathname completo y la entrada seleccionada por `--env`.
- Verificación del orquestador en `af5db1b`: `db-up.sh` real idempotente dos veces, PostgreSQL 16.15 y ambas bases disponibles; `scripts/ci-local.sh` desde entorno sin `DB_NAME`/`NODE_ENV` heredados pasó con migraciones dev/test, 80/80 API y 2/2 app. Lint y typecheck de ambos: exit 0; app mantiene un warning `import/first` en el test del layout.
- CI remoto **verde para ese commit**: https://github.com/brayanAndy1996/runner/actions/runs/38161717783 . No equivale a aprobación adversarial ni del reviewer.
- Cobertura medida por el orquestador en ese checkpoint: API global 97,71 % líneas / 76,74 % ramas / 100 % funciones (el reporte incluye fixtures/config); `guard.js` 92,55 % líneas / 84,44 % ramas, `config.js` 100 % / 20 %, `index.js` 100 % / 40 %. App, incluyendo raíz y layout: 100 % en todas las métricas. Test-writer amplía ramas semánticas sin excluir archivos ni alterar instrumentación. **No declarar DoD de cobertura final todavía.**
- Re-test adversarial de `af5db1b` cerrado, sin conexiones ni autenticación a `runner_dev`. Altos confirmados: F3-R3 (`database` heredada en replication, consumida por Sequelize/pg aunque la guardia usa `hasOwnProperty`) y F2-R3 (`env` desde el rc del CLI, que selecciona `development` aunque `config.js` propio solo valide argv). La variante rc `url` se reclasificó: `config-helper.init()` no carga `config.js` si recibe una URL; sin código propio ejecutado es frontera externa, no un alto de esta guardia.
- Test-writer añadió cobertura positiva en `60cc55c` y regresiones en `c9f463a`, `30f6389`, `9a85995` y `269f4e7`, solo en `api/tests/**`. El orquestador reprodujo el rojo en `269f4e7`: API 121 tests, 117 pass y 4 fail exclusivamente por F3-R3 (write/read) y F2-R3 (cwd rc/`--options-path`); controles seguros en verde. Los probes usan puerto cerrado, no la BD dev real.
- Cobertura API sobre el rojo medida por el orquestador, incluyendo `src/**` y `migrations/**`: 100 % líneas / 90,54 % ramas / 100 % funciones global; `guard.js` 100/92,16, `config.js` 100/50 e `index.js` 100/50 (líneas/ramas). No es cobertura final del tercer fix.

### Checkpoint del tercer fix (2026-10-11)

- Tercer fix `bcc934168889b16c40dc1079363a36949bb9c3bb`, API-dev: solo `api/src/db/guard.js`, `config.js` y `api/.sequelizerc`. La replicación comprueba propiedades propias y heredadas; el entorno CLI incluye el rc con precedencia `--env > rc.env > NODE_ENV`. No modifica tests, fixtures, dependencias ni lockfiles.
- Orquestador reprodujo `scripts/ci-local.sh` desde entorno sin `NODE_ENV`, `DB_NAME`, `DATABASE_URL` ni `PGDATABASE` heredados: exit 0, migraciones dev/test, API 121/121, app 2/2, lint y typecheck de ambos. Permanece el warning móvil `import/first` en el test del layout.
- CI remoto comprobado directamente por SHA: https://github.com/brayanAndy1996/runner/actions/runs/38162896849 — `completed/success` para `bcc9341`. El rojo anterior `269f4e7` falló en CI; no se confunden ambos estados.
- Cobertura API medida por el orquestador con todas las fuentes funcionales (`src/**`, `migrations/**`, `.sequelizerc`): 99,50 % líneas / 86,90 % ramas / 100 % funciones global. `guard.js`: 99,04/86,67/100; `config.js` e `index.js`: 100/50/100; `.sequelizerc`, fábrica, health y migración: 100 % en todas las métricas. App, incluyendo raíz y layout: 100 % en todas las métricas, 2/2 tests. No se alteró la instrumentación.
- Re-test adversarial de `bcc9341` finalizado por `e0ccbf941b504d23977c374cce13bb96`: F3-R3 y F2-R3 cerrados; nuevo alto F2-R4, alias camelCase de yargs `--optionsPath` y `--optionsPath=…`. El CLI lee ese rc y selecciona `development` mientras la guardia solo reconoce `--options-path` y valida `test`. El orquestador reprodujo ambas formas a `127.0.0.1:1`, sin acceso a `runner_dev`; kebab inseguro aborta y el control camel con `--env test` selecciona test.
- Flags duplicados de env/config/url descartados como altos: el CLI falla antes de conectar. Ignorar el rc versionado para evitar el ciclo queda como limitación de diseño, sin vector actual mientras no se modifique ese archivo. La guardia tampoco cubre invocaciones externas que omiten cargar código propio; la política de esa frontera sigue pendiente.
- Test-writer entregó `c531436040a986293f1af500954bd169757f6bad`, únicamente tests: dos regresiones F2-R4, controles seguros y cobertura de rc/entorno, más corrección del warning `import/first` móvil sin cambiar el mock. Orquestador reprodujo el rojo completo: API 129 tests, 127 pass / 2 fail exclusivamente por el alias camelCase; API-dev corrige solo producción. No se cambiaron dependencias.
- Decisiones móviles aún **sin autorización**: override `decode-uri-component@0.5.x`, pin `test-renderer@~1.2.0`, alineación Reanimated/Worklets con Expo 57 (4.5.1/0.10.1 frente a transitivas instaladas 4.7.1/0.13.0), ADR y deuda de advisories restantes. `expo install --check` no valida esa diferencia transitiva ni sustituye un build nativo. No se ejecutó `npm audit fix`.
- No se ha emitido revisión `APROBADO`, publicado el PR de andamiaje ni autorizado su merge. Los bajos/medios adversariales y la frontera del CLI externo sin código propio cargado requieren decisión explícita; no figuran como deuda aceptada.

### Checkpoint del cuarto fix (2026-10-11)

- Rojo F2-R4 confirmado sobre `c531436`: 129 tests API, 127 pass y 2 fail exclusivos de `--optionsPath` separado y con `=`.
- API-dev entregó `5174dae12a41ce2799bbea7a3d8fc8b85318a148`; diff comprobado por el orquestador: únicamente `api/src/db/guard.js`, sin tests/fixtures/dependencias/CI/docs. El helper acepta el alias camelCase de los flags kebab-case, ambas formas separado/igual, sin cambiar la precedencia de entorno ni agregar dependencias.
- Orquestador reprodujo `db-up.sh` dos veces sin eliminar contenedor/volumen y `ci-local.sh` desde entorno sin variables heredadas: migraciones dev/test, API 129/129, app 2/2, lint y typecheck verdes y sin warnings.
- Cobertura API medida incluyendo explícitamente `src/**`, `migrations/**` y `.sequelizerc`: 100 % líneas / 93,14 % ramas / 100 % funciones global; `guard.js` 100/94,87/100, `config.js` e `index.js` 100/50/100, resto funcional 100 % en todas las métricas. App raíz/layout 100 % en todas las métricas y 2/2 tests. No se excluyeron fuentes funcionales ni se cambió instrumentación.
- CI remoto comprobado por SHA: https://github.com/brayanAndy1996/runner/actions/runs/38163789180 — `completed/success` para `5174dae`. No se confunde con el CI rojo de regresiones ni con la revisión adversarial.
- Re-test de `e0ccbf941b504d23977c374cce13bb96` terminado sobre `5174dae`, únicamente lectura/probes offline a puerto 1: **cero críticos/altos abiertos**. F2-R4 cerrado en ambas formas del alias; controles seguros, precedencias y regresiones R1–R3 re-verificados. No conectó ni autenticó contra `runner_dev`, ni modificó fuentes/tests/dependencias.
- Auditoría npm actual de app: 53 altas / 16 moderadas propagadas, correspondientes a cinco advisories hoja; no hay críticas. Continúan pendientes los cambios móviles, ADR y aceptación explícita de deuda. No se ejecutó `npm audit fix` ni se autorizaron cambios por omisión.
- Bajos F5 (factory por convención), F8 (`NODE_ENV=test` exacto), F9 (readiness/puerto), frontera del CLI sin código propio y notas F11 (Google iOS futuro), F7/F12 (rechazos seguros) no equivalen a altos abiertos; tampoco están aceptados como deuda. El reviewer verificará código/logs y emitirá `BLOQUEADO` si faltan decisiones, nunca un `APROBADO` condicional.

### Quinto ciclo: precarga/caché de configuración (2026-10-11)

- Reviewer independiente `8f8f993fe14e471391a07d00a7be688f`, SWE-2 High, auditó el diff y reprodujo F2-R5 offline; emitió **BLOQUEADO** para el SHA previo `5edacf4` por este alto y siete decisiones pendientes de Bryan (dependencias, deuda, frontera del CLI y convención de tests). CI documental de `5edacf4` comprobado: https://github.com/brayanAndy1996/runner/actions/runs/38164174038 — `completed/success`.
- Después del re-test, el orquestador reprodujo F2-R5 offline: un rc externo hace `require(config.js)` antes de exportar `{ env: 'development', config: <config propio> }`. La guardia lee exports parciales del rc, valida test y queda cacheada; luego el CLI selecciona development e intenta TCP a `127.0.0.1:1`. A diferencia de `rc.url`, aquí sí se carga código propio. No hubo acceso a `runner_dev` real.
- Test-writer entregó `2ae608f459b531052b01512b5aa2dae84ff879ea`, solo `api/tests/regression-cli-rc.test.js`; el orquestador reprodujo API 134 tests, 132 pass / 2 fail exclusivamente F2-R5 (kebab y camel separado/igual). Corrigió en `6f4944cf253221ce37f518c05a43966438c23d5b` el control de rc ambiguo sin flag para permitir rechazo conservador; las aserciones rojas y la precedencia de `--env` explícito se mantuvieron. El orquestador reprodujo el mismo rojo 132/134 antes de producción.
- API-dev entregó `a0518aef8e68181cd00b0a4ef92abf17c37042d9`, solo `api/src/db/guard.js`, `api/src/db/config.js` y `api/.sequelizerc`: detectar rc aún-en-carga por entrada canónica de la caché CommonJS y abortar con guardia `_test` antes de conectar cuando no se conoce el env; el flag `--env` explícito conserva la precedencia. El orquestador comprobó diff y separación de roles, y reprodujo el pipeline real: Docker PostgreSQL 16 y migraciones dev/test, API 134/134, app 2/2, lint y typecheck de ambos paquetes en verde. Repitió `db-up.sh`: idempotente, bases dev/test presentes. Coverage del quinto fix: API 99,32 % líneas / 92,31 % ramas / 100 % funciones global, guard 100/94,94/100; app raíz/layout 100 % en todas las métricas. No se cambiaron exclusiones de cobertura. Un probe propio con rc precargador enlazado simbólicamente abortó por guardia antes de red con tres variantes de flag; con `--env test` explícito intentó conectar **solo** a `127.0.0.1:1` en entorno `test`. Ningún probe se conectó ni autenticó contra `runner_dev`. CI remoto del mismo SHA: https://github.com/brayanAndy1996/runner/actions/runs/38165534566 — `completed/success`.
- Re-test adversarial independiente `e0ccbf941b504d23977c374cce13bb96` cerrado sobre `a0518ae`: **cero críticos/altos abiertos**, F2-R5 cerrado, regresiones anteriores y controles de precedencia re-verificados offline; se evaluó además precarga indirecta/asíncrona y flags ambiguos sin defectos nuevos. No cambió código ni aceptó deuda.
- Refuerzo de test-writer integrado en `b03819763cc6d0769a7d1aadaa0613caf38127cb` y `e4a1fce21612b3fbb659026744f92bcec4191527`: únicamente `api/tests/regression-cli-rc.test.js`. Cubre rc externo que precarga `.sequelizerc` propio antes de exportar, symlink al mismo rc parcialmente cargado y orden export-first que precarga `config.js`. El orquestador corrigió con test-writer una explicación factual del control: `loaded=false` obliga a rechazo conservador incluso cuando exports ya están poblados; no se confía en ellos como entorno definitivo.
- Revalidación independiente del orquestador sobre `e4a1fce`: pipeline completo en verde con PostgreSQL 16 y migraciones development/test, API **135/135**, app **2/2**, lint y typecheck de ambos paquetes; `db-up.sh` repetido correctamente. Cobertura API global **100 % líneas / 93,20 % ramas / 100 % funciones**; `.sequelizerc` **100/100/100**, `guard.js` **100/94,94/100**; app raíz/layout **100 %** en todas las métricas. Instrumentación sin cambios. CI del mismo SHA: https://github.com/brayanAndy1996/runner/actions/runs/38166143316 — `completed/success`. Entre `a0518ae` y `e4a1fce` solo cambió ese archivo de tests, no producción, dependencias, scripts ni CI: el re-test independiente conserva su mismo código auditado. Ningún probe usa ni autentica contra `runner_dev` real. Aún faltan decisiones explícitas de Bryan, re-revisión `APROBADO` y verificación DoD.

### Decisiones de Bryan (H-02 del reviewer)

Bryan seleccionó explícitamente **«Aprobar los siete puntos»** tras el cierre de cobertura y CI de `7218e6f`. Aprobación registrada en ADR 0001–0005; no autoriza el merge. Las menciones anteriores de decisiones pendientes describen el estado histórico previo.

1. Override compatible de `decode-uri-component@^0.5.x` con ADR.
2. Pin de `test-renderer@~1.2.0` con ADR (el reporte del reviewer lo llamó `react-native-test-renderer`; ese paquete no está instalado, el real es `test-renderer`).
3. Alineación Reanimated/Worklets con la matriz Expo 57, con ADR.
4. Aceptar/documentar temporalmente como deuda los advisories restantes de `braces`, `node-forge`, `sprintf-js` y `uuid`, bajo las condiciones de ADR 0002.
5. Aceptar la limitación documentada del CLI externo que no ejecuta código propio; incluye F5, uso de la factory por convención: `new Sequelize` directo fuera de ella evita la guardia. No añadir wrapper obligatorio en 001.
6. Aceptar F8/F9 como deuda baja y registrar F11/F7/F12 como notas con seguimiento definido en ADR 0004.
7. Reubicar/convertir regresiones adversariales según `CONSTITUCION.md` §5: `.adversarial.test.ts`, sin enmienda ni excepción.

Se aplicó el paquete: ajustes compatibles de los puntos 1–3 (ADR 0001), deuda temporal acotada del punto 4 (ADR 0002), limitación documentada del CLI/factory del punto 5 (ADR 0003), deuda baja/notas del punto 6 (ADR 0004) y convención estricta `.adversarial.test.ts` del punto 7, sin excepción ni modificación constitucional (ADR 0005).

### Verificación final H-02 (2026-10-11)

- **Roles separados:** mobile-dev `e1e642b` modifica únicamente manifiesto/lockfile app; API-dev `fd6b601` únicamente tooling/parser/configs API; test-writer `bcad321` únicamente seis regresiones migradas a `api/tests/adversarial/*.adversarial.test.ts`. La producción API sigue siendo la auditada en `a0518ae`.
- **Dependencias instaladas:** `decode-uri-component@0.5.0`, `test-renderer@1.2.0` deduplicado para RNTL (`react-reconciler@0.33.0`), Reanimated `4.5.1` y Worklets `0.10.1`. `npm ci`, `npm ls` específico, `expo install --check`, tests, lint y typecheck conformes. Esto no acredita un build nativo.
- **Migración sin debilitar tests:** 135 casos API, incluidos 50 adversariales, conservados. El orquestador comparó por AST las expresiones/argumentos de todas las llamadas `assert.*` antes/después en los seis archivos: idénticos. Los seis `.ts` pertenecen al programa TSC; sin ignores/casts ni exclusiones nuevas. Los `coverage-*.test.js` son pruebas unitarias positivas, no hallazgos ADV.
- **Pipeline reproducido por el orquestador en `bcad321`:** `bash scripts/ci-local.sh`, exit 0: instalaciones separadas secuenciales, PostgreSQL 16, migraciones development/test, **135/135 API**, **2/2 app**, lint y typecheck en ambos paquetes. `db-up.sh` repetido, idempotente.
- **Cobertura final API:** Node 24 con `--experimental-test-coverage`, incluyendo `src/**`, `migrations/**` y `.sequelizerc`: **100 % líneas / 93,20 % ramas / 100 % funciones**. Guardia **100/94,94/100**, `.sequelizerc` **100/100/100**, config/index **100/50/100**, resto funcional **100 %**. Se informa la cobertura de ramas sin ocultarla; no se excluyeron fuentes funcionales. La medición canónica usa `NODE_ENV=test` sin sobrescribir globalmente `DB_NAME`: una primera invocación del orquestador con `DB_NAME=runner_test` alteró la caracterización de development y se descartó, sin modificar código ni pruebas.
- **Cobertura final app:** `npm test -- --coverage --runInBand`, **2/2**, raíz/layout **100 %** statements/ramas/funciones/líneas.
- **CI del código final:** [CI #34](https://github.com/brayanAndy1996/runner/actions/runs/38167987998), commit `bcad3218857b9838da1ec89fa05952042ccd6b34`, estado **completed successfully** comprobado en GitHub.
- **Auditoría de dependencias:** consulta final `npm audit --json --prefer-online`: API **2 moderadas, 0 altas, 0 críticas**; app **13 moderadas, 51 altas, 0 críticas**, 64 entradas contando ancestros. Mismas cuatro hojas de ADR 0002; no aparece `decode-uri-component`. El snapshot anterior de 66 entradas difiere solo por dos ancestros peer de React Native (`@testing-library/react-native`, `react-native-view-shot`); no se interpreta la variación como una nueva corrección ni un cambio de exposición. No se ejecutó `npm audit fix`.
- **Adversarial independiente:** sesión [e0ccbf9](https://app.devin.ai/sessions/e0ccbf941b504d23977c374cce13bb96), auditoría del SHA `bcad321`: revalida precedencias URL/CLI, replicación, herencia/falsy, alias, precarga/export-first/caché/symlink y controles seguros offline. **Cero hallazgos nuevos críticos/altos abiertos**; riesgos de dependencias y límites solo aceptados según ADR 0002–0004. Probes contra puerto cerrado, nunca contra `runner_dev` real.
- **AC-01…AC-10:** conservan pruebas nombradas; AC-01/03/07 suplementados por Docker/migraciones/pipeline reales y AC-08 por el CI remoto. OpenAPI sigue sincronizado con `GET /health`.
- **Reviewer independiente:** [revisión final spec 001](https://app.devin.ai/sessions/8f8f993fe14e471391a07d00a7be688f) sobre `7bfc38f` emitió **APROBADO** literal y sin condiciones tras leer código/logs y reproducir AC-01/03/07, F2-R5 y controles sin conectar a `runner_dev`. Su `BLOQUEADO` anterior sobre `5edacf4` es histórico. Comprobó [CI #35](https://github.com/brayanAndy1996/runner/actions/runs/38169073386) para `7bfc38f`: `completed/success`.
- **DoD verificado por el orquestador:** API 135/135 y app 2/2, lint/typecheck ambos; cobertura API 100 % líneas/93,20 % ramas/100 % funciones y app 100 %; AC-01…AC-10 con test nombrado; sin crítico/alto adversarial abierto; reviewer `APROBADO`; OpenAPI coincide con `/health`; PROGRESS/CONTINUAR al día. La auditoría npm aún reporta los avisos aceptados estrictamente por ADR 0002; no se confunden con el veredicto adversarial.
- **Siguiente hito:** publicar PR desde `feat/001-andamiaje` y pedir revisión de Bryan. Nada de tracking/auth/media, builds nativos, EAS ni pruebas UI se da por implementado o verificado. Ningún permiso de merge.

## Supuestos abiertos (penden de confirmación del usuario)

- 002: fórmula exacta de calorías (MET + corrección por sexo/altura) se fija con ADR en implementación; default 70 kg si el perfil local no tiene datos; filtro accuracy > 30 m / saltos > 40 km/h.
- 003: estilo propio del mapa iterará con feedback.
- 005: sin refresh token en v1; comportamiento de datos locales al cerrar sesión (AC-10); perfil local sin cuenta se propaga al perfil al loguearse (AC-11).
- 006: videos máx. 60 s; flag dev por `__DEV__` en `app.config.ts`.
- 008: sin PostGIS en v1 (bbox con columnas + índice).
- 010: alcance de visibilidad al publicar recorrido privado en grupo; owner no puede abandonar en v1.
- 011: adapter de storage + redirect a URL firmada ≤ 15 min.

## Deuda técnica

- Aceptación explícita H-02: advisories acotados (ADR 0002), frontera CLI/factory (ADR 0003), F8/F9 y notas F11/F7/F12 (ADR 0004). Revaluar en sus hitos; ninguna aceptación genérica de advisories o hallazgos nuevos.
