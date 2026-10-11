# Tasks — Spec 005

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | api-dev | Migraciones `users`, `routes` (+ índice único `(user_id, local_uuid)`) | — |
| T-02 | test-writer | Tests api rojos: AC-01, AC-02, AC-05, AC-06, AC-08, AC-09 contra `runner_test` | T-01 |
| T-03 | api-dev | Auth email (register/login, bcrypt, JWT middleware), `/me` | T-02 |
| T-04 | api-dev | `/auth/google` + `/auth/apple` con verificación de id_token (mockeable para tests) | T-03 |
| T-05 | api-dev | `POST /sync/routes` idempotente + `PATCH /routes/:id/visibility` | T-03 |
| T-06 | api-dev | Actualizar `docs/api/openapi.yaml` | T-03, T-04, T-05 |
| T-07 | test-writer | Tests app rojos: cliente api (token en secure-store), servicio de sync (AC-07), pantallas auth | — |
| T-08 | mobile-dev | Cliente api + auth store + pantallas login/registro/Google/Apple | T-07 |
| T-09 | mobile-dev | Servicio de sync local→api tras login + toggle de visibilidad en lista/detalle | T-08 |
| T-10 | mobile-dev | Pantalla perfil editable (nombre, ciudad, bio) | T-08 |
| T-11 | adversarial-tester | JWT forjados, doble sync concurrente, claim a cuenta equivocada, IDOR visibility, mass assignment en /me y /sync | T-05, T-09 |
| T-12 | reviewer | Auditoría | T-11 |
