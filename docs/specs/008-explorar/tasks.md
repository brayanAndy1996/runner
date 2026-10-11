# Tasks — Spec 008

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | api-dev | Migración: columnas bbox en `routes` + índice + backfill | — |
| T-02 | test-writer | Tests api rojos: AC-02, AC-03, AC-06, AC-08 (bbox query, límites, solo públicos) | T-01 |
| T-03 | api-dev | `GET /explore/routes` + `GET /explore/media` con simplificación por zoom | T-02 |
| T-04 | api-dev | Actualizar openapi.yaml | T-03 |
| T-05 | test-writer | Tests app rojos: capa de polylines públicas, pins de fotos, estados sin sesión/vacío | — |
| T-06 | mobile-dev | Tab Explorar: mapa + capas + sheet inferior + navegación a detalle público | T-05 |
| T-07 | adversarial-tester | Bbox maliciosa/gigante, recorrido privado filtrado, miles de rutas en zona, antimeridiano, fotos sin lat/lng | T-03, T-06 |
| T-08 | reviewer | Auditoría | T-07 |
