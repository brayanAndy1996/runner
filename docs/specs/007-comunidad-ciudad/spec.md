# Spec 007 — Comunidad por ciudad

## Objetivo

Con sesión iniciada: ver a los usuarios de mi ciudad, sus perfiles públicos, recorridos públicos y lugares (fotos públicas) que conocieron. Solo contenido `public` es visible (R-03, R-06).

## Historias de usuario

- HU-07: ver a las personas de mi ciudad, sus recorridos y lugares públicos.
- HU-10: mi decisión de visibilidad se respeta en todas las vistas ajenas.

## Decisiones técnicas

- `ciudad` es texto libre normalizado (trim + case-fold para comparación; el valor mostrado conserva la forma del usuario). Coincidencia exacta normalizada en v1 — sin geo-inferencia ni fuzzy. [SUPUESTO]
- **Endpoints:** `GET /community/city` (mi ciudad → lista paginada de usuarios con nombre, avatar, nº recorridos públicos, km públicos totales); `GET /users/:id/public-profile` (nombre, avatar, ciudad, bio, recorridos públicos resumidos); `GET /users/:id/public-routes` (paginado, métricas + polyline simplificada); `GET /users/:id/public-media`.
- Todo endpoint público filtra `visibility='public'` a nivel de query — sin excepciones ni en agregados (R-03).
- App: tab/sección "Mi ciudad" con directorio + pantalla de perfil ajeno (recorridos con mini-mapa, fotos).
- Solo usuarios con `ciudad` no vacía aparecen en directorio; yo me excluyo de la lista.

## Criterios de aceptación

- AC-01: `GET /community/city` devuelve solo usuarios con mi misma ciudad normalizada, paginado, sin incluirme.
- AC-02: Los agregados del directorio (nº recorridos, km) cuentan solo `public`.
- AC-03: `GET /users/:id/public-*` jamás devuelve recorridos ni media `private`, aunque el id se adivine (IDOR).
- AC-04: Sin sesión → 401 en todos los endpoints de comunidad.
- AC-05: Usuario sin ciudad no aparece en ningún directorio y ve estado vacío con invitación a completar su perfil.
- AC-06: La pantalla de perfil ajeno muestra solo datos públicos (sin email, sin ubicación exacta de recorridos privados).
- AC-07: Cambiar un recorrido a `private` lo retira inmediatamente de todas las vistas ajenas (consulta en vivo, sin caché v1).
- AC-08: Ciudades que difieren en mayúsculas/espacios coinciden ("Huánuco" = " huánuco ").

## Fuera de alcance

- Seguir/buscar usuarios, likes/comentarios, chat. Sugerencias de ciudades cercanas por GPS.
