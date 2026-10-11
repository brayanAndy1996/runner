# Tasks — Spec 003

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | mobile-dev | Integración @maplibre/maplibre-react-native + estilo propio + tiles OSM en dev | — |
| T-02 | test-writer | Tests de `simplifyPolyline` RDP (AC-05) y helpers de bounds/gradiente en rojo | — |
| T-03 | mobile-dev | Dominio `app/src/domain/geo/`: RDP, bounds, mapeo ritmo→color | T-02 |
| T-04 | test-writer | Tests de componente RouteMap con maplibre mockeado (recibe polyline, bounds, marcadores; AC-02, AC-06) | T-01 |
| T-05 | mobile-dev | Componente RouteMap (polyline gradiente, marcadores inicio/fin, camera bounds) | T-03, T-04 |
| T-06 | mobile-dev | Vista detalle de recorrido (mapa + tarjeta de métricas) enlazada desde lista | T-05 |
| T-07 | mobile-dev | Mini-mapa no interactivo en tarjeta de lista de recorridos | T-05 |
| T-08 | adversarial-tester | Polyline degenerada, puntos en polos/antimeridiano, sin red, miles de puntos | T-06 |
| T-09 | reviewer | Auditoría | T-08 |
