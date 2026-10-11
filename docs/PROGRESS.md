# PROGRESS — Runner

Estado del proyecto. Actualizado por el orquestador al cerrar cada paso del ciclo.

## Estado actual

- **Fase:** tercer fix con pipeline y CI verdes; re-test adversarial en curso. No cumple DoD todavía.
- **Rama:** `feat/001-andamiaje`, desde la planificación integrada en `main`.
- **Siguiente acción:** recibir el re-test adversarial del tercer fix; resolver los hallazgos nuevos con rojo previo si aparecen. Obtener decisiones de dependencias y deuda antes del reviewer.

## Tabla de funcionalidades

| NNN | Funcionalidad | Estado |
| --- | --- | --- |
| 001 | Andamiaje | tercer fix verde local/remoto; pendientes adversarial, decisiones y reviewer |
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
- Re-test adversarial de `bcc9341` delegado a `e0ccbf941b504d23977c374cce13bb96`: auditoría offline de los dos altos y variantes equivalentes; aún sin veredicto. La guardia no cubre invocaciones externas que omiten cargar código propio; la política de esa frontera sigue pendiente.
- Decisiones móviles aún **sin autorización**: override `decode-uri-component@0.5.x`, pin `test-renderer@~1.2.0`, alineación Reanimated/Worklets con Expo 57 (4.5.1/0.10.1 frente a transitivas instaladas 4.7.1/0.13.0), ADR y deuda de advisories restantes. `expo install --check` no valida esa diferencia transitiva ni sustituye un build nativo. No se ejecutó `npm audit fix`.
- No se ha emitido revisión `APROBADO`, publicado el PR de andamiaje ni autorizado su merge. Los bajos/medios adversariales y la frontera del CLI externo sin código propio cargado requieren decisión explícita; no figuran como deuda aceptada.

## Supuestos abiertos (penden de confirmación del usuario)

- 002: fórmula exacta de calorías (MET + corrección por sexo/altura) se fija con ADR en implementación; default 70 kg si el perfil local no tiene datos; filtro accuracy > 30 m / saltos > 40 km/h.
- 003: estilo propio del mapa iterará con feedback.
- 005: sin refresh token en v1; comportamiento de datos locales al cerrar sesión (AC-10); perfil local sin cuenta se propaga al perfil al loguearse (AC-11).
- 006: videos máx. 60 s; flag dev por `__DEV__` en `app.config.ts`.
- 008: sin PostGIS en v1 (bbox con columnas + índice).
- 010: alcance de visibilidad al publicar recorrido privado en grupo; owner no puede abandonar en v1.
- 011: adapter de storage + redirect a URL firmada ≤ 15 min.

## Deuda técnica

- Sin deuda aceptada por Bryan todavía. Advisories y hallazgos no bloqueantes están pendientes de decisión, no de aceptación implícita.
