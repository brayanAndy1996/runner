# ADR 0003 — Frontera de la guardia de base de datos de tests

- Estado: aprobado, limitación documentada.
- Fecha: 2026-10-11.
- Autorización: Bryan seleccionó **«Aprobar los siete puntos»**, punto 5 de H-02, incluido F5.

## Decisión

Mantener la protección del código propio y aceptar explícitamente que no constituye un sandbox global:

- Las conexiones del proyecto deben construirse con `createSequelize` de `api/src/db/connection.js`. No hay `new Sequelize` fuera de la factory en el código actual.
- Crear deliberadamente una instancia directa fuera de esa factory evitaría la guardia. Su prohibición es una convención de revisión, no una restricción técnica global.
- Si `sequelize-cli` usa `--url`, un rc con `url` o configuración externa sin ejecutar `.sequelizerc`/`config.js` propios, nuestra guardia no se carga y no puede interceptarlo.
- No se añade ahora un wrapper obligatorio, parche al CLI externo ni interceptación global de Sequelize.

## Uso seguro y seguimiento

Los comandos de tests del proyecto fijan `NODE_ENV=test` y deben utilizar `runner_test`. Los probes adversariales emplean configuraciones sintéticas y puertos/hosts cerrados, nunca conexiones ni autenticación contra `runner_dev`.

Una herramienta nueva que invoque directamente Sequelize o el CLI externo debe pasar revisión y declarar su destino. Antes de añadir tales caminos, reconsiderar un wrapper o regla de lint en una spec aprobada. No presentar esos caminos como protegidos por AC-04.

Aceptar esta frontera no autoriza omitir la factory, cambiar la guardia ni relajar las pruebas existentes.

## Referencia

[Sesión y aprobación del usuario](https://app.devin.ai/sessions/034a530278564a678a97d3c3a0a43334).
