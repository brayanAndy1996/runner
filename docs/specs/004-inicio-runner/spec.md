# Spec 004 — Inicio runner (pasos y resumen)

## Objetivo

Pantalla principal: pasos del día vía podómetro y resumen de la semana/mes calculado sobre los recorridos locales. Punto de entrada de la app, usable sin cuenta (R-01).

## Historias de usuario

- HU-04: ver pasos de hoy y mi resumen de semana/mes.

## Decisiones técnicas

- `expo-sensors` Pedometer para pasos del día; en dispositivos sin podómetro, fallback a estimación por distancia/promedio de zancada documentado. [SUPUESTO]
- Agregaciones en `app/src/domain/stats/`: `summarize(routes, rango)` → km, duración, nº recorridos, calorías; rangos semana ISO (lunes–domingo) y mes calendario. Dominio puro.
- Home muestra: pasos de hoy, tarjeta semana, tarjeta mes, botón principal "Iniciar recorrido", acceso a lista de recorridos y a tabs sociales (deshabilitados con aviso si no hay sesión — hasta spec 005; en esta spec solo secciones locales).
- Permiso de reconocimiento de actividad (Android `ACTIVITY_RECOGNITION`, iOS Motion) pedido en contexto.

## Criterios de aceptación

- AC-01: La pantalla de inicio muestra pasos del día contados por el podómetro (o el estado "sin podómetro/no concedido" de forma clara).
- AC-02: `summarize` semana: solo recorridos `finished` con `ended_at` dentro de la semana ISO actual; suma distancia, duración, recorridos y calorías.
- AC-03: `summarize` mes: mismo criterio para mes calendario. Tests de borde: semana que cruza mes/año, zona horaria del dispositivo.
- AC-04: Sin recorridos, las tarjetas muestran ceros con estado vacío (no errores).
- AC-05: Botón "Iniciar recorrido" navega a la pantalla de grabación de spec 002.
- AC-06: Recorridos en curso (`recording`/`paused`) no cuentan en los resúmenes.
- AC-07: Si se rechaza el permiso de actividad, el resto de la pantalla funciona y el bloque de pasos muestra el estado, no un crash.

## Fuera de alcance

- Rachas, metas, notificaciones. Integración con Google Fit/Health Connect (ADR futuro si se quiere).
