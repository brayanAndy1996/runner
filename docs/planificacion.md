# Planificación — Runner

Red social para runners y caminantes. No es solo un contador de pasos: registra el trayecto con mapa, guarda fotos y videos de los lugares conocidos caminando, y conecta a las personas por ciudad para ver sus recorridos, lugares y avances.

Este documento es la fuente de verdad de los requerimientos. Las reglas R-xx no son negociables; cualquier cambio requiere decisión del usuario registrada en `docs/PROGRESS.md`.

---

## 1. Decisiones del usuario (2026-10-11)

| ID | Decisión |
| --- | --- |
| D-01 | Mapas con MapLibre + tiles de OpenStreetMap (sin Google Maps ni API keys de pago). |
| D-02 | Plataformas: Android e iOS desde el inicio. |
| D-03 | Fase 2 social: grupos donde se puede crear eventos y publicaciones. Nada más (sin likes/comentarios por ahora). |
| D-04 | La función básica (no social) funciona sin registro. Registro por email+contraseña o directo con Google/Apple. |
| D-08 | El perfil incluye peso, sexo y altura para estimar calorías quemadas. También editable en modo local (sin cuenta). |
| D-05 | Media en disco local del api durante desarrollo; un tercero (Cloudflare R2 u otro) para producción. |
| D-06 | El recorrido debe poder grabarse en segundo plano (pantalla apagada). |
| D-07 | Recorridos privados por defecto, con opción explícita de publicar. |

## 2. Alcance por fases

**Fase 1 — núcleo runner + social básica:** andamiaje, recorrido GPS (segundo plano), mapa del recorrido, inicio con podómetro y resumen, media solo-en-el-momento, auth + sincronización, comunidad por ciudad, explorar, compartir con marca de agua.

**Fase 2 — social:** grupos con eventos y publicaciones.

**Producción:** media en Cloudflare R2 (o equivalente), builds EAS, publicación en tiendas.

## 3. Reglas de dominio (no negociables)

- **R-01 Local-first.** Sin cuenta se puede: grabar recorridos, verlos en el mapa, capturar fotos/videos, ver pasos y resumen, compartir. Todo persiste en el dispositivo (SQLite local).
- **R-02 Social requiere cuenta.** Comunidad por ciudad, explorar, grupos, eventos y publicaciones exigen sesión iniciada.
- **R-03 Privacidad por defecto.** Todo recorrido nace `privado`. Solo se muestran a otros los recorridos y la media que el usuario marcó `público`. La ubicación exacta de otros usuarios nunca se expone; solo geometrías de recorridos públicos.
- **R-04 Media solo-en-el-momento.** Fotos y videos se capturan con la cámara de la app en el instante. Existe `ALLOW_GALLERY_PICKER` como flag de desarrollo (habilita elegir de galería) únicamente en builds de desarrollo; el usuario final no puede activarlo.
- **R-05 Reclamo de datos anónimos.** Al registrarse o iniciar sesión por primera vez, los recorridos y la media locales se sincronizan y quedan ligados a la cuenta; siguen disponibles offline.
- **R-06 Comunidad por ciudad.** La comunidad se agrupa por el campo `ciudad` del perfil del usuario.
- **R-07 Marca de agua.** La imagen del recorrido que se comparte a otras redes lleva marca de agua de la aplicación.
- **R-08 Segundo plano.** La grabación del recorrido continúa con pantalla apagada o app en segundo plano (servicio en primer plano en Android, background location en iOS, ambos con indicador visible al usuario).
- **R-09 Integridad de datos.** Toda modificación de esquema es una migración. Prohibido `sync({ force: true })` o equivalente fuera de tests.
- **R-10 Base de pruebas aislada.** Los tests solo usan `runner_test` (guardia que aborta si el nombre no termina en `_test`) o mocks. Prohibido tocar datos de desarrollo.

## 4. Historias de usuario

- **HU-01** Como caminante sin cuenta, quiero iniciar un recorrido, ver distancia/tiempo/ritmo en vivo y guardarlo, sin registrarme.
- **HU-02** Como runner, quiero que el recorrido siga grabándose aunque apague la pantalla, para no perder el trayecto.
- **HU-03** Como usuario, quiero ver mi recorrido dibujado en un mapa atractivo con inicio, fin y métricas.
- **HU-04** Como usuario, quiero ver en el inicio mis pasos de hoy y mi resumen de la semana/mes.
- **HU-05** Como usuario, quiero tomar fotos y videos durante el recorrido que queden ligados al trayecto y al lugar.
- **HU-06** Como usuario nuevo, quiero registrarme con email o con Google/Apple y conservar mis recorridos locales.
- **HU-12** Como usuario, quiero registrar mi peso, sexo y altura para que la app estime las calorías que quemo.
- **HU-07** Como usuario registrado, quiero ver a las personas de mi ciudad, sus recorridos públicos y los lugares que conocieron.
- **HU-08** Como usuario, quiero un tab de explorar donde el mapa muestre lo recorrido por otros junto a sus fotos.
- **HU-09** Como usuario, quiero compartir la imagen de mi recorrido con marca de agua en otras redes sociales.
- **HU-10** Como usuario, quiero decidir recorrido por recorrido si es privado o público.
- **HU-11** Como usuario (fase 2), quiero crear o unirme a grupos, crear eventos y publicar dentro de ellos.

## 5. Requerimientos funcionales

| ID | Requerimiento | Spec |
| --- | --- | --- |
| RF-01 | Andamiaje: monorepo app/api, Postgres Docker, `runner_test`, CI, lint/typecheck | 001 |
| RF-02 | Grabar recorrido: GPS foreground y background, pausa/reanudar/fin, polyline, distancia, duración, ritmo, calorías estimadas | 002 |
| RF-03 | Persistencia local de recorridos (SQLite) y su modelo de dominio puro | 002 |
| RF-04 | Render del recorrido en MapLibre: polyline estilizada, marcadores inicio/fin, vista detalle | 003 |
| RF-05 | Inicio: pasos del día (podómetro) + resumen semana/mes (km, tiempo, rutas, calorías) | 004 |
| RF-06 | Auth: email+contraseña JWT y Google/Apple; perfil con nombre, ciudad, avatar, bio, peso, sexo, altura | 005 |
| RF-07 | Sincronización: reclamar recorridos/media locales a la cuenta; api de recorridos | 005 |
| RF-08 | Captura foto/video en el momento ligada a recorrido + posición; flag dev de galería; subida al api | 006 |
| RF-09 | Visibilidad por recorrido (privado/público) aplicada en api y app | 005, 007 |
| RF-10 | Comunidad por ciudad: directorio de usuarios, perfil público, recorridos y lugares públicos | 007 |
| RF-11 | Explorar: mapa agregado de recorridos públicos + fotos + usuarios por zona | 008 |
| RF-12 | Compartir: imagen del recorrido con marca de agua + share nativo | 009 |
| RF-13 | Grupos: crear/unirse, eventos del grupo, publicaciones del grupo | 010 |
| RF-14 | Media en Cloudflare R2 para producción | 011 |

## 6. Requerimientos no funcionales

- **RNF-01** Offline-first: toda la función local (R-01) opera sin red.
- **RNF-02** Idioma: interfaz, mensajes y documentación en español; código en inglés.
- **RNF-03** Polylines largas se simplifican para render y transferencia (tolerancia documentada en spec 003).
- **RNF-04** Métricas de dominio puras y deterministas (distancia haversine, ritmo, calorías por MET) para testeo de propiedades.
- **RNF-05** La ubicación en segundo plano muestra indicador permanente y respeta revocación de permisos.
- **RNF-06** Secretos jamás en el repo; `.env` no versionado, `.env.example` con ejemplos.
- **RNF-07** Cobertura: ≥ 90 % en dominio y servicios, ≥ 80 % en el resto.

## 7. Fuera de alcance (por ahora)

- Likes, comentarios, seguidores, chat, notificaciones push.
- Retos, rankings, ligas.
- Wearables (relojes), importación GPX/Strava.
- Web de escritorio.
