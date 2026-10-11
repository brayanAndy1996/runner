# Spec 003 — Mapa del recorrido

## Objetivo

Render atractivo del recorrido en MapLibre: polyline estilizada, marcadores de inicio/fin, vista detalle con métricas. La estética del mapa es un diferenciador del producto.

## Historias de usuario

- HU-03: ver mi recorrido dibujado en un mapa bonito.

## Decisiones técnicas

- `@maplibre/maplibre-react-native` 11.5 con estilo propio (JSON de estilo empaquetado, tiles OSM `https://tile.openstreetmap.org/{z}/{x}/{y}.png` para dev). [SUPUESTO — estilo visual iterará con feedback del usuario]
- Polyline con gradiente por ritmo (segmentos coloreados: rápido→lento) usando `lineGradient` o segmentado en tramos. [SUPUESTO]
- Marcadores: pin de inicio (verde) y fin (meta), opcionalmente puntos de media de spec 006 en el futuro — el componente acepta una lista de anotaciones.
- `camera` ajustada al bounding box de la ruta con padding.
- Simplificación de polyline para render (Ramer–Douglas–Peucker, tolerancia ~5 m) en `app/src/domain/geo/` — dominio puro testeable; la polyline guardada conserva todos los puntos (RNF-03).
- Vista detalle de ruta: mapa + tarjeta con distancia, duración, ritmo, calorías, fecha.
- Modo "mini mapa" reutilizable para tarjetas de lista y para la captura de compartir (spec 009).

## Criterios de aceptación

- AC-01: La vista detalle de un recorrido muestra la polyline completa sobre el mapa con estilo propio.
- AC-02: Marcadores diferenciados de inicio y fin en sus coordenadas reales.
- AC-03: El color del trazado varía con el ritmo por tramo (gradiente); leyenda o comportamiento documentado.
- AC-04: Al abrir la vista, la cámara encuadra toda la ruta con padding (bounds de la polyline).
- AC-05: `simplifyPolyline` (RDP) reduce el número de puntos manteniendo desviación máxima ≤ tolerancia; tests de propiedad: resultado ⊆ entrada, extremos conservados, monotonía de error con tolerancia.
- AC-06: Recorrido de 1 solo punto o degenerado no crashea: muestra marcador centrado.
- AC-07: Sin conexión, el mapa puede quedar sin tiles pero la polyline y marcadores se dibujan igual (no crashea ni pantalla en blanco total).
- AC-08: El componente de mapa se reutiliza como mini-mapa no interactivo en la tarjeta de lista de recorridos.

## Fuera de alcance

- Mapa agregado de explorar (spec 008), captura para compartir (spec 009).
- Descarga de tiles offline / cache persistente (fase posterior, ADR si se decide).
