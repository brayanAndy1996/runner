# Tasks — Spec 004

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | test-writer | Tests de `summarize` (AC-02, AC-03, AC-04, AC-06) en rojo, incl. bordes de semana ISO y timezone | — |
| T-02 | mobile-dev | Dominio `app/src/domain/stats/` | T-01 |
| T-03 | test-writer | Tests de pantalla Home con Pedometer mockeado (AC-01, AC-05, AC-07) | — |
| T-04 | mobile-dev | Servicio de pasos (permiso actividad, fallback sin sensor) | T-03 |
| T-05 | mobile-dev | Pantalla Home: pasos + tarjetas semana/mes + botón iniciar + vacíos | T-02, T-04 |
| T-06 | adversarial-tester | Recorridos en curso en resumen, zonas horarias, DST, permisos revocados | T-05 |
| T-07 | reviewer | Auditoría | T-06 |
