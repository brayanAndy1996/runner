# Tasks — Spec 007

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | test-writer | Tests api rojos: AC-01 a AC-05, AC-07, AC-08 (filtros públicos, paginación, normalización ciudad) | — |
| T-02 | api-dev | Endpoints comunidad + normalización de ciudad + agregados solo-public | T-01 |
| T-03 | api-dev | Actualizar openapi.yaml | T-02 |
| T-04 | test-writer | Tests app rojos: lista de ciudad, perfil ajeno, estados vacíos/sin sesión | — |
| T-05 | mobile-dev | Sección "Mi ciudad" + perfil público ajeno con mini-mapas y fotos | T-04 |
| T-06 | adversarial-tester | IDOR ids privados, agregados que filtren privados, paginación sin límite, unicode/ciudad maliciosa, usuario sin ciudad | T-02, T-05 |
| T-07 | reviewer | Auditoría | T-06 |
