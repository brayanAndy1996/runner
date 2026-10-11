# PROGRESS — Runner

Estado del proyecto. Actualizado por el orquestador al cerrar cada paso del ciclo.

## Estado actual

- **Fase:** spec 001 aprobada; rojo verificado, siguiente implementación API y móvil.
- **Rama:** `feat/001-andamiaje`, desde la planificación integrada en `main`.
- **Siguiente acción:** api-dev implementa API/BD/scripts/CI sin tocar tests; después mobile-dev implementa raíz/config/plugins.

## Tabla de funcionalidades

| NNN | Funcionalidad | Estado |
| --- | --- | --- |
| 001 | Andamiaje | rojo verificado; implementación |
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

## Supuestos abiertos (penden de confirmación del usuario)

- 002: fórmula exacta de calorías (MET + corrección por sexo/altura) se fija con ADR en implementación; default 70 kg si el perfil local no tiene datos; filtro accuracy > 30 m / saltos > 40 km/h.
- 003: estilo propio del mapa iterará con feedback.
- 005: sin refresh token en v1; comportamiento de datos locales al cerrar sesión (AC-10); perfil local sin cuenta se propaga al perfil al loguearse (AC-11).
- 006: videos máx. 60 s; flag dev por `__DEV__` en `app.config.ts`.
- 008: sin PostGIS en v1 (bbox con columnas + índice).
- 010: alcance de visibilidad al publicar recorrido privado en grupo; owner no puede abandonar en v1.
- 011: adapter de storage + redirect a URL firmada ≤ 15 min.

## Deuda técnica

- (vacía)
