# Spec 011 — Media en Cloudflare R2 (producción)

## Objetivo

Mover el almacenamiento de fotos/videos del disco local del api a Cloudflare R2 (o S3 compatible) para salir a producción (D-05), sin cambiar el contrato de la app.

## Decisiones técnicas

- Adapter de storage en api: interfaz `put(key, stream)`, `getUrl(key)`, `delete(key)` con implementaciones `local` (disco, dev) y `s3` (R2, prod) seleccionada por env `STORAGE_DRIVER`. [SUPUESTO]
- SDK `@aws-sdk/client-s3` apuntando al endpoint R2 — requiere ADR (dependencia nueva) y credenciales vía secretos, jamás en repo.
- `GET /media/:id/file` redirige (302) a URL firmada temporal en prod, o sirve archivo local en dev — mismo endpoint, control de acceso idéntico antes del redirect.
- Migración de datos: script único que sube los archivos existentes de `uploads/` a R2 y marca `media.storage='r2'` (columna nueva). Devuelve reporte de subidos/fallidos. [SUPUESTO]
- Claves de objeto: `media/{user_id}/{media_id}.{ext}` — nada del nombre original del cliente.

## Criterios de aceptación

- AC-01: Con `STORAGE_DRIVER=s3` y credenciales válidas, `POST /media` sube a R2 y `GET /media/:id/file` responde redirect a URL firmada que sirve el contenido.
- AC-02: Sin credenciales o `STORAGE_DRIVER` desconocido, el api falla rápido al arrancar con mensaje claro (no silencioso).
- AC-03: Control de acceso idéntico: la URL firmada solo se emite tras pasar el check de propiedad/visibilidad; expira en ≤ 15 min.
- AC-04: El script de migración sube todos los archivos locales, actualiza `media.storage` y reintentar es idempotente (no re-sube ni rompe los ya migrados).
- AC-05: `STORAGE_DRIVER=local` sigue funcionando exactamente como en spec 006 (regresión de tests AC-04/05/08 de 006 en verde).
- AC-06: Ninguna credencial R2 en el repo; `.env.example` documenta las variables requeridas con valores de ejemplo.

## Fuera de alcance

- CDN/cache, transformación de imágenes (thumbnails), ciclo de vida/borrado automático en R2, multi-región.
