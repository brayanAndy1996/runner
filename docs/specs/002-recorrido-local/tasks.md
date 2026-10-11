# Tasks — Spec 002

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | mobile-dev | Esquema expo-sqlite (`routes`, `route_points`) + capa de acceso `app/src/db/` | — |
| T-02 | test-writer | Tests de propiedades del dominio (AC-04, AC-05, AC-06) en rojo | T-01 |
| T-03 | mobile-dev | Dominio puro `app/src/domain/tracking/` (haversine, filtro de fixes, pausas, calorías MET) | T-02 |
| T-04 | test-writer | Tests de ciclo de vida de ruta en almacén local (AC-01, AC-03, AC-07, AC-08) con sqlite mockeado/in-memory | T-01 |
| T-05 | mobile-dev | Repositorio de rutas + store de grabación (iniciar/pausar/reanudar/finalizar) | T-03, T-04 |
| T-06 | test-writer | Tests del servicio de tracking (secuencia de puntos → métricas, rechazo de permisos) | T-05 |
| T-07 | mobile-dev | Servicio de ubicación background (task-manager, foreground service, manejo de revocación) | T-05 |
| T-08 | mobile-dev | Pantalla de grabación con métricas en vivo + lista de recorridos | T-05, T-07 |
| T-09 | adversarial-tester | Ataques: puntos corruptos, doble tap inicio/fin, pausa eterna, accuracy nula, saltos continentales | T-08 |
| T-10 | reviewer | Auditoría spec vs implementación | T-09 |
