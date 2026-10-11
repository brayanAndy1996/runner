# ADR 0004 — Deuda baja y notas conservadoras del andamiaje

- Estado: aprobado, seguimiento posterior.
- Fecha: 2026-10-11.
- Autorización: Bryan seleccionó **«Aprobar los siete puntos»**, punto 6 de H-02.

## Decisión

No modificar producción para estos casos en spec 001. Registrar explícitamente:

| ID | Estado aceptado | Seguimiento |
| --- | --- | --- |
| F8 | Bajo: guardia activa solo con `NODE_ENV === 'test'`; invocaciones manuales con entorno ausente/mal escrito quedan fuera | Mantener entorno explícito en scripts; reconsiderar antes de ampliar herramientas de tests |
| F9 | Bajo: agotamiento de readiness aborta después por `psql`; arranques concurrentes pueden chocar | Endurecer mensajes/arranque antes de exigir uso concurrente o automatizado de `db-up.sh` |
| F11 | Nota: Google Sign-In sin `iosUrlScheme`; los tests actuales no validan prebuild iOS | Resolver antes del primer dev-build iOS y antes de auth (spec 005); no afirmar que el build nativo ya funciona |
| F7 | Nota, no bypass: percent-encoding se rechaza de forma conservadora | Conservar controles; revisar si se cambia la semántica de nombres/URLs |
| F12 | Nota, no bypass: divergencias de normalización de URLs fallan en dirección segura | Conservar controles; revisar al cambiar parsers/ORM |

F7/F12 no son vulnerabilidades pendientes de corregir. F8/F9 no se consideran resueltos por documentarlos. Cualquier agravamiento o hallazgo nuevo requiere evaluación; no queda autorizado por esta aceptación.

## Referencias

- [Informe adversarial acumulado](https://app.devin.ai/attachments/5ee62474-da7d-49c9-9d60-7330ef135370/auditoria-adversarial-001.md).
- [Sesión y aprobación del usuario](https://app.devin.ai/sessions/034a530278564a678a97d3c3a0a43334).
