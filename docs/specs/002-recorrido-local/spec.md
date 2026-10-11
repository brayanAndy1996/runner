# Spec 002 — Recorrido local (tracking GPS)

## Objetivo

Grabar recorridos a pie sin cuenta: iniciar/pausar/reanudar/finalizar, métricas en vivo (distancia, duración, ritmo, calorías), polyline completa y persistencia local en SQLite. Grabación continua en segundo plano (D-06, R-08).

## Historias de usuario

- HU-01: caminar sin cuenta y guardar el trayecto con sus métricas.
- HU-02: seguir grabando con pantalla apagada.
- HU-10 (parcial): el recorrido nace con visibilidad `privada`.

## Decisiones técnicas

- **Dominio puro** en `app/src/domain/tracking/`: `appendPoint`, `computeDistance` (haversine), `computePace`, `estimateCalories` (fórmula MET caminar/correr; peso por defecto 70 kg [SUPUESTO — perfil configurable en spec 005]), agregaciones por intervalos. TypeScript puro, sin imports nativos → tests de propiedades.
- **Almacén local:** expo-sqlite con tablas `routes` (id uuid, started_at, ended_at, status, distance_m, duration_s, calories, pace_avg, polyline GeoJSON string, visibility 'private', synced_at null) y `route_points` (route_id, seq, lat, lng, altitude, accuracy, recorded_at). Polyline como GeoJSON LineString derivado de `route_points`. [SUPUESTO]
- **Background:** `expo-location` `startLocationUpdatesAsync` + `expo-task-manager`; foreground service Android con notificación persistente e indicador iOS (R-08, RNF-05).
- **Filtro de puntos:** descartar fixes con `accuracy > 30 m` y saltos de velocidad > 40 km/h (ruido GPS). [SUPUESTO]
- **Pausa:** tiempo en pausa no cuenta en `duration_s` ni en ritmo medio.
- Estado del recorrido en un store (`zustand` o contexto) que sobrevive navegación entre pantallas durante la grabación. [SUPUESTO]

## Criterios de aceptación

- AC-01: Iniciar recorrido persiste un `routes` row `recording` y empieza a acumular puntos en `route_points` con orden `seq`.
- AC-02: Con la app en segundo plano/pantalla apagada, los puntos siguen llegando (verificable por notificación persistente Android y conteo de puntos al volver).
- AC-03: Pausar detiene acumulación de distancia y tiempo activo; reanudar continúa; finalizar fija `ended_at` y métricas finales.
- AC-04: `computeDistance` es la suma haversine de segmentos consecutivos; tests de propiedad: distancia ≥ 0, invariante al insertar puntos duplicados consecutivos, monótona al añadir puntos.
- AC-05: Fixes con accuracy > 30 m o saltos > 40 km/h se descartan (no suman distancia ni entran a `route_points` marcados como válidos).
- AC-06: `duration_s` excluye pausas; `pace_avg` = duración_activa/distancia; calorías estimadas por MET documentado en código.
- AC-07: Todo recorrido nuevo tiene `visibility = 'private'` y `synced_at IS NULL`.
- AC-08: Lista local de recorridos ordenada por fecha con métricas resumidas.
- AC-09: Si se revoca el permiso de ubicación en segundo plano, la grabación se detiene de forma segura, se conserva lo grabado y se muestra aviso al volver.
- AC-10: Métricas en vivo visibles durante la grabación (distancia, tiempo activo, ritmo) actualizándose con cada punto válido.

## Fuera de alcance

- Render del recorrido en mapa (spec 003).
- Podómetro y resúmenes (spec 004).
- Sincronización con api (spec 005). Media (spec 006).
