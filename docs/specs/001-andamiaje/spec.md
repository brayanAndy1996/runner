# Spec 001 — Andamiaje

## Objetivo

Dejar el monorepo listo para el ciclo SDD+TDD: app Expo con dev-client, api Express+Sequelize, Postgres en Docker, base de tests aislada, lint, typecheck y CI reproducible en local.

## Historias de usuario

- Como equipo, queremos una base común donde cada funcionalidad pueda seguir el ciclo rojo→verde→adversarial→review sin fricción de entorno.

## Decisiones técnicas

- Monorepo plano `app/` + `api/` + `docs/` + `scripts/`, sin workspaces de npm (cada paquete su `package.json` y lockfile). [SUPUESTO]
- `api/` en ESM (`"type": "module"`); `.sequelizerc` en CommonJS (`module.exports`) — regla ya asentada en CONSTITUCION.md.
- `app/` creada con `create-expo-app` + TypeScript + expo-router; `expo-dev-client` desde el inicio (D-06 exige dev-builds).
- Postgres 16 en Docker via `scripts/db-up.sh` (contenedor `runner-pg`, puerto 5432, user/pass/db `runner`); bases `runner_dev` y `runner_test` creadas por el script.
- Guardia de BD de tests: helper que aborta el proceso si `NODE_ENV=test` y el nombre de BD no termina en `_test`; todo suite api la usa.
- Tests api con `node:test` + supertest, serializados (`--test-concurrency=1`). Tests app con jest-expo + RNTL.
- CI en GitHub Actions: postgres service, migrate dev+test, `npm test`, `lint`, `typecheck` en `api/`; `npm test`, `lint`, `typecheck` en `app/` (sin build nativo en CI por ahora). `scripts/ci-local.sh` replica el pipeline. [SUPUESTO]
- `.env` no versionado; `api/.env.example` y `app/.env.example` con valores de ejemplo.

## Criterios de aceptación

- AC-01: `scripts/db-up.sh` levanta Postgres y crea `runner_dev` y `runner_test`; es idempotente.
- AC-02: `api/` expone `GET /health` que responde 200 con `{ "status": "ok" }` y existe un test `AC-02` que lo verifica contra `runner_test`.
- AC-03: Sequelize conecta y migra en `runner_dev` y en `runner_test` (`npm run db:migrate` con y sin `NODE_ENV=test`).
- AC-04: La guardia aborta cualquier conexión Sequelize en `NODE_ENV=test` a una BD que no termine en `_test`.
- AC-05: `app/` compila con typecheck y existe al menos un test jest (smoke de render de la pantalla raíz).
- AC-06: `npm run lint` y `npm run typecheck` pasan en ambos paquetes.
- AC-07: `scripts/ci-local.sh` ejecuta el pipeline completo en verde localmente.
- AC-08: El workflow de CI en GitHub Actions queda en verde en la rama de la funcionalidad.
- AC-09: `app.json` configura `expo-dev-client` y los plugins declarados en CONSTITUCION.md; arranque documentado en `app/README.md` (dev-build en emulador/dispositivo).
- AC-10: `.env` está en `.gitignore` de ambos paquetes y los `.env.example` existen sin secretos reales.

## Fuera de alcance

- Funcionalidad de usuario (tracking, auth, media).
- Builds EAS en la nube, publicación en tiendas.
- Verificación iOS (requiere macOS; se cubre en specs funcionales).
