# Spec 006 — Fotos y videos en el momento

## Objetivo

Capturar fotos y videos con la cámara de la app durante o al final de un recorrido, ligados al trayecto y al lugar donde se tomaron. Solo captura en el momento (R-04); el flag `ALLOW_GALLERY_PICKER` existe solo en builds de desarrollo y nunca es visible para el usuario final.

## Historias de usuario

- HU-05: tomar fotos/videos durante el recorrido ligados al trayecto.

## Decisiones técnicas

- `expo-camera` para captura (foto y video corto, máx. 60 s [SUPUESTO]); `expo-media-library` solo para el flag dev de galería.
- **Flag dev:** `ALLOW_GALLERY_PICKER` es una constante de build (`app.config.ts` extra / `__DEV__`), no una preferencia de usuario ni de servidor. En producción el código de galería ni siquiera se incluye en el bundle (dead-code por `__DEV__`). [SUPUESTO]
- Modelo `media` api: (id, user_id, route_id nullable, kind photo|video, path, lat, lng, taken_at, visibility hereda del route salvo override [SUPUESTO]). En local: `media` en expo-sqlite con ruta de archivo local + `synced_at`.
- Upload: `POST /media` multipart (multer) con metadatos (route_id, lat, lng, taken_at, kind); archivos a `api/uploads/` (disco local, D-05), servidos por `GET /media/:id/file` con control de acceso (privado → solo dueño).
- Captura durante recorrido graba la posición actual (último fix) como `lat,lng` de la media; si el GPS no tiene fix reciente, `lat,lng` null permitido con nota en UI.
- Cada media marcada como "capturada en app" con `captured_in_app: true` — los archivos subidos por el flag dev llevan `captured_in_app: false` y solo existen en dev. [SUPUESTO]

## Criterios de aceptación

- AC-01: Durante un recorrido se puede abrir la cámara, tomar foto y queda ligada a ese recorrido con la posición del último fix.
- AC-02: Video de hasta 60 s con la misma ligadura.
- AC-03: En build de producción no existe ninguna ruta UI/código para elegir de galería; en dev-build con `ALLOW_GALLERY_PICKER=true` aparece el selector y los items se marcan `captured_in_app: false`.
- AC-04: `POST /media` acepta multipart imagen/video con metadatos; rechaza tipo MIME no permitido (whitelist jpeg/png/mp4) y > 50 MB → 413.
- AC-05: `GET /media/:id/file` sirve al dueño siempre; a otros solo si la media es pública; 404/403 según corresponda sin filtrar existencia a no-autorizados.
- AC-06: La vista detalle del recorrido muestra sus fotos/videos como anotaciones sobre el mapa (usa la lista de anotaciones de spec 003) y en galería del recorrido.
- AC-07: Media local sin sesión funciona (guardada en disco del dispositivo + sqlite); al hacer login se sube junto al sync de spec 005.
- AC-08: `taken_at` proviene del momento de captura, no del upload; el cliente no puede forzar `user_id` ajeno ni `route_id` que no posee (403/400).

## Fuera de alcance

- Edición/recorte de foto, filtros. Storage en R2 (spec 011). Avatar de perfil como media (se habilita reutilizando `POST /media` si se decide).
