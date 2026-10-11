# Spec 009 — Compartir con marca de agua

## Objetivo

Generar una imagen del recorrido (mapa + métricas + marca de agua de la app) compartible a otras redes vía share sheet nativo. Funciona sin cuenta (R-01, R-07).

## Historias de usuario

- HU-09: compartir la imagen de mi recorrido con marca de agua en otras redes.

## Decisiones técnicas

- `react-native-view-shot` para capturar una tarjeta de compartir renderizada off-screen: mini-mapa del recorrido (componente de spec 003), métricas destacadas (distancia, tiempo, ritmo), fecha, y marca de agua/logo de la app + nombre del usuario si existe. [SUPUESTO — layout visual iterará]
- `expo-sharing` para abrir el share sheet con la imagen PNG generada; si el dispositivo no soporta sharing, guardar en galería (con permiso).
- La captura se hace sobre la vista de tarjeta — el watermark está en la imagen siempre, no opcional (R-07).
- Fotos individuales también compartibles: la foto sale tal cual con badge/marca de agua de la app en esquina. [SUPUESTO]
- Sin sesión se puede compartir igual (generación 100 % local); la imagen no requiere subirse al servidor.

## Criterios de aceptación

- AC-01: Desde el detalle del recorrido, "Compartir" genera una imagen PNG que contiene: mapa con polyline, distancia, duración, ritmo y marca de agua visible.
- AC-02: La marca de agua no puede desactivarse ni por configuración de usuario.
- AC-03: El share sheet nativo se abre con la imagen adjunta; en dispositivo sin sharing, la imagen se guarda en galería (pidiendo permiso).
- AC-04: Recorridos `private` también pueden compartirse (compartir es acción explícita del dueño, no afecta visibilidad en app).
- AC-05: Recorrido sin puntos suficientes genera tarjeta sin mapa roto (placeholder estilizado).
- AC-06: Compartir una foto individual adjunta la foto con badge/marca de agua de la app.
- AC-07: Sin sesión y sin red, la generación y el share funcionan completamente en local.

## Fuera de alcance

- Stories format vertical dedicado, video-recap del recorrido, deep-links públicos a recorridos.
