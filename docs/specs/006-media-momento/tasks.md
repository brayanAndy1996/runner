# Tasks — Spec 006

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | api-dev | Migración `media` + directorio `api/uploads/` + modelo | — |
| T-02 | test-writer | Tests api rojos: AC-04, AC-05, AC-08 (upload, whitelist, tamaño, auth, ownership) | T-01 |
| T-03 | api-dev | `POST /media` multer + `GET /media/:id/file` con control de acceso | T-02 |
| T-04 | api-dev | Actualizar openapi.yaml | T-03 |
| T-05 | mobile-dev | Tabla local `media` (sqlite) + repositorio | — |
| T-06 | test-writer | Tests app rojos: captura→persistencia local (AC-01, AC-07), flag dev invisible en prod (AC-03) | T-05 |
| T-07 | mobile-dev | Pantalla cámara (foto/video 60 s) ligada a recorrido + posición | T-06 |
| T-08 | mobile-dev | Selector de galería solo-dev tras `ALLOW_GALLERY_PICKER` + `__DEV__` | T-07 |
| T-09 | mobile-dev | Anotaciones de media sobre RouteMap + galería del recorrido | T-07 |
| T-10 | mobile-dev | Extender sync de spec 005 para subir media tras login | T-03, T-07 |
| T-11 | adversarial-tester | MIME falsificado, `../` en nombre, tamaño límite, IDOR en file, flag dev en build prod, taken_at futuro | T-10 |
| T-12 | reviewer | Auditoría | T-11 |
