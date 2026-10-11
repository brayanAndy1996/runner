# Tasks — Spec 009

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | mobile-dev | Tarjeta de compartir off-screen (mapa + métricas + watermark) reutilizando RouteMap | — |
| T-02 | test-writer | Tests rojos: contenido de la tarjeta (AC-01, AC-02, AC-05), servicio de share con view-shot/sharing mockeados | T-01 |
| T-03 | mobile-dev | Generación PNG + share sheet + fallback a galería | T-02 |
| T-04 | mobile-dev | Compartir foto individual con badge | T-03 |
| T-05 | adversarial-tester | Recorrido degenerado, métricas nulas, permiso de galería denegado, watermark ausente por bug de layout | T-04 |
| T-06 | reviewer | Auditoría | T-05 |
