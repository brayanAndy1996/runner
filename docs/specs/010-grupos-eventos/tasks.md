# Tasks — Spec 010

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | api-dev | Migraciones `groups`, `group_members`, `group_events`, `group_posts` | — |
| T-02 | test-writer | Tests api rojos: AC-01 a AC-07, AC-09 | T-01 |
| T-03 | api-dev | CRUD grupos + join/leave + permisos owner/autor | T-02 |
| T-04 | api-dev | Eventos y posts del grupo con validaciones de ownership de referencias | T-03 |
| T-05 | api-dev | Actualizar openapi.yaml | T-04 |
| T-06 | test-writer | Tests app rojos: mis grupos, descubrir, detalle, crear evento/post, estados | — |
| T-07 | mobile-dev | Sección Grupos completa (lista, descubrir, detalle con tabs, crear evento/post) | T-06 |
| T-08 | adversarial-tester | Join duplicado/concurrente, grupo privado por ID adivinado, post con route_id ajeno, evento en el pasado, mass assignment role='owner', paginación sin límite | T-04, T-07 |
| T-09 | reviewer | Auditoría | T-08 |
