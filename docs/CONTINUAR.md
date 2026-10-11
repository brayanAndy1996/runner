# CONTINUAR — Runner

Contexto para retomar el proyecto en una conversación nueva sin historial. Se actualiza al final de cada paso del ciclo.

## Qué es esto

Red social para runners/caminantes: recorridos GPS con mapa (MapLibre), fotos/videos tomadas solo en el momento, comunidad por ciudad, tab explorar, compartir con marca de agua. Fase 2: grupos con eventos y publicaciones.

## Estado exacto (2026-10-11)

- Planificación integrada en `main` con permiso de Bryan; spec 001 aprobada. Rama actual: `feat/001-andamiaje`. No hay permiso para mergear el andamiaje.
- Decisiones del usuario: `docs/planificacion.md` §1 (D-01 a D-08).
- **Siguiente acción:** api-dev y mobile-dev preparan dependencias sin funcionalidad; test-writer escribe y comprueba el rojo; el orquestador verifica antes de delegar implementación.
- Sesiones hijas en máquinas separadas, secuenciales en esta rama y con commits separados por rol. Fallback real disponible: SWE-2 Medium para desarrollo/tests/adversarial y SWE-2 High para reviewer; SOL/Luna siguen siendo las preferencias documentadas, no modelos ejecutados.

## Mapa del repo

```
app/        (aún no existe — spec 001) Expo SDK 57 + TS + expo-router + dev-client
api/        (aún no existe — spec 001) Express 5 + Sequelize 6 + Postgres 16, ESM
docs/       metodología completa: planificacion (R-xx, D-xx), agents, specs NNN, decisions, api/openapi.yaml, PROGRESS, CONTINUAR
scripts/    (aún no existe — spec 001) db-up.sh, ci-local.sh
CONSTITUCION.md  stack exacto, comandos, convenciones, DoD
```

## Reglas que no se negocian (resumen)

- Nada se implementa sin spec aprobada por el usuario. Quien implementa nunca toca tests. Rojo comprobado antes del verde.
- R-01 local-first sin cuenta · R-02 social solo con sesión · R-03 privado por defecto · R-04 media solo-en-el-momento (flag `ALLOW_GALLERY_PICKER` solo `__DEV__`) · R-05 reclamo de datos al autenticarse · R-08 segundo plano obligatorio · R-10 tests solo contra `runner_test` con guardia.
- Conventional Commits por rol, rutas explícitas, nunca `git add -A`. Merge a main solo con permiso.

## Trampas conocidas

- Api es ESM pero `.sequelizerc` DEBE ser CommonJS o sequelize-cli falla ("__esModule" error). Migraciones `.js` en ESM sí funcionan.
- Tests api comparten `runner_test`: correr serializados (`--test-concurrency=1`) y migrar la BD de test tras cada migración nueva.
- Expo Go NO sirve: el GPS en segundo plano exige dev-build (expo-dev-client/EAS).
- Verificación iOS real requiere entorno macOS/dispositivo — coordinarla explícitamente (sesión hija macOS) cuando toque.

## Preferencias del usuario

- Español en UI/docs; inglés en código. Reportes breves: qué se hizo, archivos, comandos con resultado, pendientes.
- Metodología SDD+TDD+adversarial completa con subagentes por rol (`docs/agents/`).
