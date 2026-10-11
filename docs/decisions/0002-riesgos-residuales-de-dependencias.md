# ADR 0002 — Aceptación temporal de riesgos residuales de dependencias

- Estado: aprobado, deuda temporal; no es una declaración de ausencia de vulnerabilidades.
- Fecha: 2026-10-11.
- Autorización: Bryan seleccionó **«Aprobar los siete puntos»**, punto 4 de H-02.

## Contexto

Antes de los ajustes, `npm audit` reportó 53 altas y 16 moderadas propagadas en app, y 2 moderadas en API. Estos recuentos incluyen ancestros de los advisories; no son el número de fallos distintos. La clasificación de riesgo del proyecto no sustituye la severidad publicada por npm.

## Decisión

Aceptar y documentar temporalmente los avisos restantes identificados para:

| Hoja | Uso observado | Condición |
| --- | --- | --- |
| `braces` | Patrones en herramientas, vía `micromatch` | No exponer procesamiento de patrones no confiables como función del producto |
| `node-forge` | Herramientas Expo de firma/prebuild | Revisar antes de firma y builds de distribución |
| `sprintf-js` | Herramientas de tests Jest | Revaluar si alcanza código del producto o entradas no confiables |
| `uuid` | Árboles Sequelize/xcode | Revisar antes de usar identificadores para seguridad o publicación |

No hay autorización genérica para aceptar advisories nuevos, críticos ni otros paquetes. `decode-uri-component` se corrige según ADR 0001; no queda incluido en esta aceptación.

## Seguimiento

El orquestador mantiene la deuda y adversarial actualiza versiones, cadenas y recuentos tras los cambios. Si aparece un parche compatible, priorizarlo; si cambia la exposición, revaluar antes de habilitarla. Realizar una nueva auditoría al actualizar el stack y antes de producción (a más tardar, spec 011).

La deuda no convierte un `npm audit` no cero en «limpio», ni modifica CI, políticas de seguridad o el gate de críticos/altos adversariales funcionales.

## Referencias

- [Auditoría adversarial y estado de advisories](https://app.devin.ai/attachments/5ee62474-da7d-49c9-9d60-7330ef135370/auditoria-adversarial-001.md).
- [Sesión y aprobación del usuario](https://app.devin.ai/sessions/034a530278564a678a97d3c3a0a43334).
