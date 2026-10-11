# Runner — app móvil

App de Runner (Expo SDK 57 + React Native + expo-router). **No funciona con Expo Go**: el GPS en segundo plano y los módulos nativos exigen un dev-build (D-06 / R-08).

## Requisitos

- Node 24 (`nvm use` en la raíz del repo) y `npm install` en `app/`.
- Android: Android Studio + SDK + un emulador (AVD) o un dispositivo con depuración USB.
- iOS: macOS con Xcode y un simulador o dispositivo (no disponible en entornos Linux).
- El api corriendo (`api/`) si se quiere conexión al backend.

## Variables de entorno

```bash
cp .env.example .env
```

`EXPO_PUBLIC_API_URL` apunta al api según dónde corra la app:

- Emulador Android: `http://10.0.2.2:3000` (alias del `localhost` de la máquina anfitriona).
- Dispositivo físico (misma red): `http://<IP-de-tu-máquina>:3000`.
- Simulador iOS: `http://localhost:3000`.

## Dev-build y arranque

1. Generar el dev-build (compila la app nativa con `expo-dev-client`):

   ```bash
   # Android (emulador o dispositivo conectado)
   npx expo run:android

   # iOS (solo en macOS con Xcode)
   npx expo run:ios
   ```

   También se puede generar en la nube con EAS (`eas build --profile development`) cuando se configuren las credenciales de desarrollo; eso es materia de una spec posterior.

2. Levantar el servidor de desarrollo y abrir la app en el dev-build instalado:

   ```bash
   npx expo start --dev-client
   ```

   En el emulador/dispositivo abre la app "Runner" (o pulsa `a` en la CLI) y el bundle se carga desde el servidor.

## Notas

- `app.json` ya declara los plugins nativos de las dependencias instaladas (ubicación en segundo plano, sensores, cámara, media, SQLite, secure-store, autenticación, mapas MapLibre y compartir). Los mensajes de permiso están en español.
- Las credenciales de Google (`GoogleService-Info.plist` / `google-services.json`, `iosUrlScheme`) y de Apple no están configuradas todavía: llegan con la spec 005 (auth). No inventes valores; el plugin de Google Sign-In queda declarado sin opciones hasta entonces.
- `bundleIdentifier`/`package` provisionales: `com.runner.app`.
