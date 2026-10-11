# Spec 008 — Explorar (tab social)

## Objetivo

Tab completo de explorar: un mapa que muestra las partes de la ciudad/zona recorridas por otros usuarios, con fotos públicas y acceso a los perfiles que hicieron cada recorrido. Es la cara social de la app.

## Historias de usuario

- HU-08: ver en el mapa lo recorrido por otros junto a sus fotos y perfiles.

## Decisiones técnicas

- `GET /explore/routes?bbox=...&zoom=...` → recorridos públicos que intersectan el bbox, con polyline **simplificada según zoom** (RNF-03) + resumen (id, distancia, autor id/nombre/avatar). Límite por consulta + paginación por bbox. [SUPUESTO]
- `GET /explore/media?bbox=...` → fotos públicas con lat/lng (clusters si hay muchas).
- PostGIS no se introduce en v1: filtro por bounding box sobre columnas `min_lat/max_lat/min_lng/max_lng` precalculadas en `routes` (índice). [SUPUESTO — ADR si pasa a PostGIS]
- App: tab "Explorar" con MapLibre a pantalla completa: capa de polylines públicas (atenuadas, destacable al tap), clusters/pins de fotos, sheet inferior con recorridos y usuarios de la zona visible.
- Tap en un recorrido → vista pública del recorrido (spec 003 reutilizada + autor). Tap en foto → ficha con foto + autor + recorrido asociado.
- Todo el contenido mostrado proviene de `visibility='public'` — misma garantía que spec 007.

## Criterios de aceptación

- AC-01: El mapa de explorar dibuja todas las polylines públicas que intersectan la zona visible al cargar/mover el viewport.
- AC-02: Solo recorridos `public` aparecen; cambiar a private lo retira de explorar.
- AC-03: `bbox` ausente/malformado o `zoom` fuera de rango → 400; `bbox` enorme limita resultados (paginación/documentado, nunca respuesta ilimitada).
- AC-04: Fotos públicas con lat/lng aparecen como pins/clusters; las sin posición no rompen el mapa.
- AC-05: Tap en polyline abre el detalle público del recorrido con su autor enlazado al perfil público de spec 007.
- AC-06: La simplificación por zoom conserva forma visual (tolerancia mayor a zoom bajo); respuesta con límites de tamaño documentados.
- AC-07: Sin sesión → 401; se muestra estado invitando a registrarse (R-02).
- AC-08: El bbox precalculado en `routes` se mantiene al insertar/sincronizar (migración + hook en modelo o write-path único).

## Fuera de alcance

- Heatmap ponderado, "ya recorrí esta calle" (coverage propio vs otros), filtros por fecha/actividad. PostGIS.
