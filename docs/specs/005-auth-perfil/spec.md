# Spec 005 — Auth, perfil y sincronización

## Objetivo

Cuentas con email+contraseña o Google/Apple (D-04), perfil con ciudad (base de la comunidad, R-06), y reclamo de los recorridos/media locales a la cuenta al autenticarse (R-05). La app sigue funcionando sin sesión.

## Historias de usuario

- HU-06: registrarme con email o Google/Apple conservando mis recorridos locales.
- HU-07 (base): el perfil con ciudad habilita la comunidad (spec 007).
- HU-10: cambiar visibilidad privado↔público por recorrido.
- HU-12: registrar peso, sexo y altura para estimaciones de calorías (D-08) — también sin cuenta, en el perfil local.

## Decisiones técnicas

- **Api:** `POST /auth/register` (email+pass bcryptjs), `POST /auth/login`, `POST /auth/google`, `POST /auth/apple` (verificación de id_token con claves públicas del proveedor). Emite JWT (`Authorization: Bearer`), expiración 30 días, payload `sub` = user id. Refresh fuera de alcance [SUPUESTO — re-login al expirar en v1].
- **Modelos:** `users` (id uuid, email único nullable para social-only, password_hash nullable, provider_ids jsonb {google, apple}, nombre, ciudad, avatar_url, bio, peso_kg nullable, sexo nullable ('male'|'female'|'other'), altura_cm nullable, created_at); `routes` (user_id, mismas métricas que local + visibility 'private'|'public'); `media` anticipado para spec 006. Peso/sexo/altura son opcionales: sin ellos las calorías usan el default genérico de spec 002.
- **Perfil local (sin cuenta):** la app guarda `peso/sexo/altura` también en el perfil local (sqlite) para estimar calorías antes de registrarse; al hacer login/registro, se suben al perfil de la cuenta si el usuario los definió. [SUPUESTO]
- **Sync/claim:** `POST /sync/routes` recibe lotes de recorridos locales con su `local_uuid`; idempotente por `(user_id, local_uuid)` — un índice único garantiza que re-sincronizar no duplica. Tras login/registro, la app sube todo lo no sincronizado y marca `synced_at`. [SUPUESTO]
- **App:** token en `expo-secure-store`; cliente api con inyección de token; pantallas login/registro/sociales + perfil editable (nombre, ciudad, peso, sexo, altura, bio; avatar placeholder hasta spec 006).
- Google: `@react-native-google-signin/google-signin`; Apple: `expo-apple-authentication`. Apple solo en iOS; en Android se oculta el botón. Verificación iOS real requiere dev-build en dispositivo/macOS — se documenta y se valida en entorno adecuado. [SUPUESTO]
- Cambiar visibilidad: `PATCH /routes/:id/visibility` solo propio; en local igual (campo `visibility`).

## Criterios de aceptación

- AC-01: Registro email+pass crea usuario, hashea con bcrypt (no texto plano) y devuelve JWT; email duplicado → 409 en español.
- AC-02: Login con credenciales válidas devuelve JWT; inválidas → 401 genérico (no revela si el email existe).
- AC-03: `POST /auth/google` con id_token válido crea o vincula usuario por `sub` de Google; token inválido/manipulado → 401.
- AC-04: `POST /auth/apple` igual para `sub` de Apple. (Verificación real en iOS documentada.)
- AC-05: `GET /me` y `PATCH /me` (nombre, ciudad, bio, avatar_url, peso_kg, sexo, altura_cm) con JWT; sin token → 401; ciudad editable es texto normalizado (trim, no vacía si se publica en comunidad); validaciones: 30 ≤ peso_kg ≤ 300, 100 ≤ altura_cm ≤ 250, sexo ∈ {male, female, other}.
- AC-06: `POST /sync/routes` inserta recorridos del lote; repetir el mismo lote no duplica (idempotencia `(user_id, local_uuid)`); recorridos de otro `user_id` jamás se insertan.
- AC-07: La app, tras login/registro, sube todos los recorridos locales con `synced_at IS NULL` y los marca; sin sesión, nada se sube y nada se pierde.
- AC-08: `PATCH /routes/:id/visibility` alterna privado↔público solo del dueño (403 ajeno, 404 inexistente); default siempre `private`.
- AC-09: Endpoints protegidos rechazan tokens expirados, malformados o firmados con otro secreto (401).
- AC-10: Cerrar sesión borra el token local; los datos locales del dispositivo permanecen y pueden reclamarse de nuevo por otra cuenta solo si... [SUPUESTO: al cerrar sesión los recorridos locales ya sincronizados siguen ligados a su cuenta; nuevos recorridos quedan como anónimos hasta próximo login — confirmar con el usuario]
- AC-11: El perfil local (sin sesión) permite guardar peso/sexo/altura; tras login se propagan al perfil de la cuenta y los recorridos nuevos estiman calorías con los valores reales del usuario.

## Fuera de alcance

- Recuperar contraseña, verificación de email, refresh tokens, borrado de cuenta (fase posterior).
- Avatar con foto subida (llega con media, spec 006).
