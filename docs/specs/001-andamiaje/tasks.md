# Tasks — Spec 001

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | api-dev | `scripts/db-up.sh` + estructura `api/` (package.json ESM, .sequelizerc CJS, config sequelize, .env.example, .gitignore raíz) | — |
| T-02 | mobile-dev | `create-expo-app` en `app/` con TS + expo-router + expo-dev-client; .env.example | — |
| T-03 | test-writer | Test AC-02 (`GET /health` rojo) + test AC-04 (guardia aborta sin `_test`) | T-01 |
| T-04 | api-dev | `GET /health`, conexión Sequelize, comando `db:migrate`, guardia de BD de tests | T-01 |
| T-05 | test-writer | Smoke test jest de pantalla raíz en `app/` | T-02 |
| T-06 | api-dev | ESLint + typecheck (`tsc --noEmit` o eslint-config) en `api/` | T-01 |
| T-07 | mobile-dev | ESLint (eslint-config-expo) + typecheck en `app/` | T-02 |
| T-08 | api-dev | Workflow GitHub Actions + `scripts/ci-local.sh` | T-03, T-04, T-05 |
| T-09 | mobile-dev | `app/README.md`: cómo generar dev-build y correr en emulador/dispositivo | T-02 |
| T-10 | adversarial-tester | Verificar que la guardia realmente aborta (BD sin `_test`, NODE_ENV ausente) | T-04 |
| T-11 | reviewer | Auditoría de andamiaje | T-01 a T-10 |
