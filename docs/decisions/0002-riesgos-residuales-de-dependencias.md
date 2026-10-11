# ADR 0002 — Aceptación temporal de riesgos residuales de dependencias

- Estado: aprobado, deuda temporal; no es una declaración de ausencia de vulnerabilidades.
- Fecha: 2026-10-11.
- Autorización: Bryan seleccionó **«Aprobar los siete puntos»**, punto 4 de H-02.

## Contexto

Antes de los ajustes, `npm audit` reportó 53 altas y 16 moderadas propagadas en app, y 2 moderadas en API. Estos recuentos incluyen ancestros de los advisories; no son el número de fallos distintos. La clasificación de riesgo del proyecto no sustituye la severidad publicada por npm.

## Decisión

Aceptar y documentar temporalmente los avisos restantes identificados para:

| Hoja y versión fijada | Cadena / uso observado | Condición |
| --- | --- | --- |
| `braces@3.0.3` | `micromatch@4.0.8`, patrones en herramientas de app | No exponer procesamiento de patrones no confiables como función del producto |
| `node-forge@1.4.0` | `@expo/cli@57.0.28` y `@expo/code-signing-certificates@0.0.6`, firma/prebuild | Revisar antes de firma y builds de distribución |
| `sprintf-js@1.0.3` | `@istanbuljs/load-nyc-config → argparse@1.0.10`, herramientas de cobertura | Revaluar si alcanza código del producto o entradas no confiables |
| `uuid@8.3.2` (API), `7.0.3` (app) | `sequelize@6.37.8` (runtime API), `xcode@3.0.1` (tooling app) | Revisar antes de usar identificadores para seguridad o publicación |

No hay autorización genérica para aceptar advisories nuevos, críticos ni otros paquetes. `decode-uri-component` se corrige según ADR 0001; no queda incluido en esta aceptación.

## Auditoría posterior a los ajustes

El orquestador reprodujo `npm audit --json` y contrastó los lockfiles de `e1e642b`/`fd6b601`: API **2 moderadas, 0 altas, 0 críticas**; app **13 moderadas, 53 altas, 0 críticas** (66 entradas contando ancestros). El override elimina `decode-uri-component` de los advisories; no elimina los avisos altos de las otras hojas. El parser de tests no añadió hojas vulnerables nuevas.

Advisories residuales: [braces, alta](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge, alta](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [sprintf-js, moderada](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) y [uuid, moderada](https://github.com/advisories/GHSA-w5hq-g745-h8pq). La aceptación se limita al uso actual; no desactiva auditorías ni hace desaparecer su severidad publicada.

Reconsulta final `npm audit --json --prefer-online` y auditoría independiente tras `npm ci` en `bcad321`: API **2 moderadas**; app **13 moderadas, 51 altas, 0 críticas**, 64 entradas. La comparación cruda con el snapshot anterior identifica únicamente dos claves adicionales propagadas por peer de React Native: `@testing-library/react-native` y `react-native-view-shot`. Las cuatro hojas/advisories y los lockfiles son iguales; también varía la metadata de rangos/fixes de ancestros. No atribuir el delta a `decode-uri-component`, no considerar que la variación resuelva una vulnerabilidad y no aplicar las versiones incompatibles que npm sugiere.

## Seguimiento

El orquestador mantiene la deuda y adversarial actualiza versiones, cadenas y recuentos tras los cambios. Si aparece un parche compatible, priorizarlo; si cambia la exposición, revaluar antes de habilitarla. Realizar una nueva auditoría al actualizar el stack y antes de producción (a más tardar, spec 011).

La deuda no convierte un `npm audit` no cero en «limpio», ni modifica CI, políticas de seguridad o el gate de críticos/altos adversariales funcionales.

## Referencias

- [Auditoría adversarial y estado de advisories](https://app.devin.ai/attachments/5ee62474-da7d-49c9-9d60-7330ef135370/auditoria-adversarial-001.md).
- [Sesión y aprobación del usuario](https://app.devin.ai/sessions/034a530278564a678a97d3c3a0a43334).
