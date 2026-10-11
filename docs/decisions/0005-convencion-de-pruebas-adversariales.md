# ADR 0005 — Convención y tooling de pruebas adversariales

- Estado: aprobado; pendiente de aplicar y verificar.
- Fecha: 2026-10-11.
- Autorización: Bryan seleccionó **«Aprobar los siete puntos»**, punto 7 de H-02.

## Decisión

Cumplir la convención existente, sin enmendar `CONSTITUCION.md` ni crear una excepción de extensión:

```text
api/tests/adversarial/*.adversarial.test.ts
```

El test-writer reubica y convierte las regresiones adversariales, preservando casos, IDs y todas las aserciones. No encapsular las pruebas en wrappers vacíos ni ocultarlas en archivos fuera de la convención para aparentar cumplimiento.

## Tooling necesario

Node 24 ejecuta TypeScript mediante eliminación nativa de tipos; TypeScript ya está instalado en API. Preparar previamente el descubrimiento de `.js`/`.ts`, su inclusión en typecheck y el parser de ESLint para validar los archivos nuevos sin ignorarlos.

Como soporte de desarrollo del punto 7, usar `@typescript-eslint/parser@~8.71.1`, la misma versión ya instalada por el tooling de la app: compatible con Node 24, ESLint 9 y TypeScript 5.9 según sus peers. Es una dependencia exclusivamente de desarrollo, no del runtime de la API. No se añade un loader, framework de tests ni dependencia de producción.

API-dev prepara manifiesto/lockfile y configuración sin tocar tests ni fuentes de dominio. Después test-writer migra las pruebas sin modificar producción. Ambos usan commits separados por rol.

## Verificación

- Ejecutar la suite antes y después de la migración: conservar los 135 casos API existentes, salvo adiciones justificadas.
- Mantener `NODE_ENV=test`, concurrencia 1 y `runner_test`; los probes inseguros permanecen offline.
- Lint y typecheck deben incluir todos los nuevos `.ts`; no añadir ignores ni desactivar reglas para hacerlos pasar.
- Recalcular cobertura con las mismas fuentes incluidas; revisar CI y mapa de archivos/IDs.

## Referencias

- [TypeScript en Node.js](https://nodejs.org/api/typescript.html).
- [Parser de typescript-eslint](https://typescript-eslint.io/packages/parser/).
- [Sesión y aprobación del usuario](https://app.devin.ai/sessions/034a530278564a678a97d3c3a0a43334).
