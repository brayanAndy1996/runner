# Spec 010 — Grupos, eventos y publicaciones (fase 2)

## Objetivo

Social fase 2 (D-03): los usuarios crean grupos, dentro de los grupos se crean eventos y publicaciones. Simple: sin likes, comentarios ni roles avanzados.

## Historias de usuario

- HU-11: crear o unirme a grupos, crear eventos y publicar dentro de ellos.

## Decisiones técnicas

- **Modelos:** `groups` (id, nombre, descripción, ciudad nullable, created_by, visibility 'public'|'private' — público lo encuentra cualquiera, privado solo por invitación/código [SUPUESTO]); `group_members` (group_id, user_id, role 'owner'|'member', joined_at; único par); `group_events` (id, group_id, title, description, starts_at, meeting_point_text, route_id nullable — el creador puede ligar un recorrido suyo); `group_posts` (id, group_id, user_id, type 'text'|'media'|'route', body, media_id nullable, route_id nullable, created_at).
- **Endpoints:** CRUD `POST/GET /groups`, `POST /groups/:id/join`, `GET /groups/:id` (miembros, eventos, posts paginados), `POST /groups/:id/events`, `POST /groups/:id/posts`, `GET /groups/mine`. Abandonar grupo `DELETE /groups/:id/members/me`. Solo owner edita/elimina el grupo; solo autor elimina su post/evento [SUPUESTO].
- Posts tipo `route`/`media` solo referencian contenido del propio autor; al publicar un recorrido privado en un grupo, su visibilidad no cambia globalmente — el grupo actúa como audiencia permitida [SUPUESTO — decisión delicada: confirmar con el usuario si publicar en grupo lo hace público o mantiene acceso solo-miembros].
- App: tab/sección Grupos: mis grupos, descubrir (públicos, filtrable por ciudad), detalle de grupo con pestañas Eventos / Publicaciones / Miembros; crear evento con fecha y punto de encuentro; publicar texto, foto (de mis medias) o recorrido (de los míos).
- Notificaciones fuera de alcance: eventos se listan ordenados por fecha próxima.

## Criterios de aceptación

- AC-01: Crear grupo (nombre requerido, ciudad opcional) me hace `owner` y miembro automático.
- AC-02: `join` agrega membresía idempotente (unirse dos veces no duplica); grupo `private` solo entra por código/invitación.
- AC-03: `GET /groups/:id` para miembros devuelve info + eventos + posts; no-miembro en grupo `private` → 403; en `public` ve contenido.
- AC-04: Crear evento con `title` + `starts_at` futuro obligatorios; pasado → 400.
- AC-05: Publicar texto; publicar referencia a `route_id`/`media_id` propios — referencia ajena → 403.
- AC-06: Solo owner edita/borra el grupo; solo el autor borra su post/evento; cualquier miembro puede abandonar (owner no puede abandonar sin transferir — v1: owner no puede abandonar [SUPUESTO]).
- AC-07: Publicar un recorrido `private` en un grupo mantiene su `visibility` global; la audiencia queda documentada según la decisión final (ver supuesto arriba).
- AC-08: App: crear/unirse/ver grupo, crear evento, publicar, con estados vacíos y errores en español.
- AC-09: Paginación de posts (más recientes primero) con límite máximo.

## Fuera de alcance

- Likes, comentarios, menciones, moderación/reportes, roles de moderador, notificaciones push, eventos recurrentes, RSVP ("asistiré").
