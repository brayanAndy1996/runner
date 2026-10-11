# Constitución — Runner

Reglas no negociables del proyecto. Cambiarlas requiere aprobación explícita del usuario y queda registrado en `docs/PROGRESS.md`.

## 1. Stack (versiones exactas)

| Capa | Tecnología | Versión |
| --- | --- | --- |
| Runtime api | Node.js (nvm) | 24.x |
| Api | Express | 5.3.x |
| ORM | Sequelize + sequelize-cli | 6.37.x / 6.x |
| BD | PostgreSQL (Docker) | 16 |
| Auth api | jsonwebtoken + bcryptjs | 9.x / 3.x |
| Uploads api | multer | 2.x |
| Validación | zod | 4.x |
| App | Expo SDK / React Native / React | 57.x / 0.86.x / 19.2.x |
| Navegación app | expo-router | la incluida en SDK 57 |
| Mapas | @maplibre/maplibre-react-native | 11.5.x |
| GPS app | expo-location + expo-task-manager | SDK 57 |
| Podómetro | expo-sensors (Pedometer) | SDK 57 |
| Media app | expo-camera, expo-media-library | SDK 57 |
| Datos locales | expo-sqlite | SDK 57 |
| Auth app | expo-secure-store, @react-native-google-signin/google-signin, expo-apple-authentication | SDK 57 |
| Compartir | react-native-view-shot + expo-sharing | SDK 57 |
| Build | expo-dev-client + EAS (dev-build, NO Expo Go) | SDK 57 |
| Tests api | node:test + supertest | nativo / 7.x |
| Tests app | jest-expo + @testing-library/react-native | SDK 57 |

Dependencias nuevas o cambios de versión mayor: ADR en `docs/decisions/` + aprobación del usuario.

## 2. Estructura del monorepo

```
runner/
  app/        Expo (TypeScript) — aplicación móvil
  api/        Express + Sequelize — backend
  docs/       planificación, specs, agents, decisions, api/openapi.yaml, PROGRESS.md, CONTINUAR.md
  scripts/    db-up.sh, ci-local.sh
  CONSTITUCION.md
```

Bases de datos: `runner_dev` (desarrollo) y `runner_test` (tests). Contenedor Docker `runner-pg`, puerto 5432, user/pass/db `runner`.

## 3. Reglas de dominio

Vivir en `docs/planificacion.md` (R-01 a R-10). Resumen: local-first sin cuenta; social solo con cuenta; privado por defecto; media solo-en-el-momento (flag dev `ALLOW_GALLERY_PICKER` jamás visible al usuario); segundo plano obligatorio; `runner_test` aislada con guardia; esquema solo por migraciones.

## 4. Flujo de trabajo (SDD + TDD + adversarial)

Ciclo por funcionalidad en rama `feat/NNN-nombre`, ejecutado por el orquestador con subagentes según `docs/agents/`:

```
spec-writer (spec.md + tasks.md)
→ APROBACIÓN EXPLÍCITA DEL USUARIO
→ test-writer (tests en rojo, fallando por la razón correcta)
→ api-dev / mobile-dev (implementación en verde)
→ adversarial-tester (hallazgos por severidad)
→ corrección (críticos/altos siempre; medios/bajos decide el usuario)
→ reviewer (APROBADO o bloqueantes)
→ orquestador verifica DoD + actualiza PROGRESS.md y CONTINUAR.md
→ merge --no-ff a main solo con permiso del usuario
```

Reglas del ciclo:

- Quien implementa jamás crea, modifica ni borra archivos de test.
- Rojo comprobado: los tests fallan por funcionalidad ausente, no por errores de la propia prueba. Si hace falta andamiaje/dependencias, primero tarea de instalación.
- Hallazgos nuevos: primero regresión en rojo por el test-writer, después corrección sin tocar el test.
- Prohibido debilitar aserciones, omitir tests o marcar fallas esperadas sin autorización.
- Una funcionalidad por rama. Solo el orquestador integra a `main`.

## 5. Convenciones

- **Numeración:** funcionalidades `NNN` en `docs/specs/NNN-nombre/` (`spec.md` + `tasks.md`). AC `AC-01…`; cada AC con al menos un test cuyo nombre empiece con su ID. Tareas `T-01…` con rol. Hallazgos `ADV-NNN-xx` en `*/tests/adversarial/*.adversarial.test.ts`. `describe('NNN: …')` por archivo de prueba. ADRs `docs/decisions/NNNN-titulo.md`.
- **Commits:** Conventional Commits por rol — `test:` (test-writer, adversarial-tester), `feat:`/`fix:` (implementadores), `refactor:`, `docs:` (spec-writer, orquestador). Un commit `feat:`/`fix:`/`refactor:` nunca incluye tests. Rutas explícitas en `git add`; nunca `git add -A`. Nunca dos instalaciones de paquetes a la vez (lockfile).
- **Idioma:** código en inglés; interfaz, mensajes de error y documentación en español.
- **Api en ESM** (`"type": "module"`): `.sequelizerc` DEBE ser CommonJS (`module.exports`) — sequelize-cli lo carga con `require`. Las migraciones `.js` en ESM sí funcionan.
- **Tests api:** serializados (`node --test --test-concurrency=1`) porque comparten `runner_test`; migrar la BD de tests tras cada nueva migración (`NODE_ENV=test npm run db:migrate`).
- **Reporte de encargo:** al terminar, reporte breve — qué se hizo, archivos tocados, comandos con resultado, pendientes.

## 6. Comandos

| Comando | Qué hace |
| --- | --- |
| `scripts/db-up.sh` | Levanta Postgres 16 en Docker (`runner-pg`) |
| `cd api && npm run db:migrate` | Migra `runner_dev` |
| `cd api && NODE_ENV=test npm run db:migrate` | Migra `runner_test` |
| `cd api && npm test` | Tests api (serializados) |
| `cd api && npm run lint && npm run typecheck` | Lint + tipos |
| `cd app && npm test` | Jest de la app |
| `cd app && npx expo start --dev-client` | Dev server para dev-build |
| `scripts/ci-local.sh` | Réplica local del pipeline CI |

## 7. Definición de terminado (por funcionalidad)

- Suite de tests, linter y typecheck en verde en ambos paquetes.
- Cobertura ≥ 90 % en dominio y servicios; ≥ 80 % en el resto.
- Cada `AC-xx` con al menos un test nombrado con su ID.
- Adversarial-tester sin hallazgos críticos ni altos abiertos.
- Reviewer emitió APROBADO.
- `docs/api/openapi.yaml` coincide con lo implementado.
- `docs/PROGRESS.md` y `docs/CONTINUAR.md` actualizados.
