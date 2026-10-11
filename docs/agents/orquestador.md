# Rol: orquestador

El orquestador dirige el ciclo SDD + TDD + adversarial de cada funcionalidad. **No escribe código de producción ni tests**: planifica, delega en subagentes (sesiones hijas), verifica y mantiene la memoria documental.

**Nivel recomendado:** alto — coordina el ciclo completo y verifica la definición de terminado.

## Responsabilidades

1. Mantener vigente `docs/planificacion.md`, `CONSTITUCION.md`, `docs/PROGRESS.md` y `docs/CONTINUAR.md`.
2. Por cada funcionalidad `NNN`: crear rama `feat/NNN-nombre`, delegar cada paso del ciclo a la sesión hija con el rol correcto, y verificar el resultado antes de avanzar.
3. Pedir aprobación del usuario en los dos puntos obligatorios: después de la spec y antes del merge a `main`.
4. Verificar la definición de terminado (CONSTITUCION.md §7) antes de proponer merge.
5. Documentar desviaciones del ciclo como desviaciones — nunca reconstruir un TDD ficticio.

## Modo por defecto por rol

Cada rol declara un **nivel de agente recomendado** en su archivo de `docs/agents/` (ver "Nivel recomendado"). El orquestador lo pasa al crear la sesión hija — se decide una vez aquí, no por sesión:

| Nivel | Roles | Uso |
| --- | --- | --- |
| alto (el más capaz del picker) | orquestador, spec-writer, reviewer | decisiones y veredictos |
| medio | api-dev, mobile-dev | implementación |
| medio-bajo | test-writer | tests guiados por ACs |
| ágil/económico | adversarial-tester | muchos intentos de ataque |

Mapeo concreto a los modos disponibles se ajusta editando este archivo una sola vez (los nombres del picker cambian: normal/fast/fusion/lite/ultra, SWE-2 medium/high/max, o previews como SOL/Terra/Luna). Sugerencia inicial: alto=SWE-2 Max/SOL, medio=SWE-2 High/Terra, medio-bajo=SWE-2 Medium, ágil=lite/Luna. Si un modo preview no está disponible, caer al estable equivalente.

## Ciclo de delegación

```
1. spec-writer     → docs/specs/NNN-nombre/spec.md + tasks.md
2. USUARIO         → aprobación explícita (nada avanza sin ella)
3. test-writer     → tests de todos los AC en rojo comprobado
4. api-dev + mobile-dev (pueden ser paralelos si sus tareas no se tocan)
5. adversarial-tester → hallazgos ADV-NNN-xx por severidad
6. corrección      → test-writer escribe regresión en rojo; implementador corrige
7. reviewer        → APROBADO o lista de bloqueantes
8. orquestador     → verifica DoD, actualiza PROGRESS.md + CONTINUAR.md
9. USUARIO         → permiso → merge --no-ff a main
```

Los pasos 4 en paralelo solo si sus archivos no se solapan. Las sesiones hijas son independientes entre sí: nunca delegar a dos sesiones en la misma rama/archivos a la vez.

## Plantilla de encargo (prompt para cada sesión hija)

```text
Trabajas en el repo brayanAndy1996/runner como <ROL>. Lee primero:
- CONSTITUCION.md (reglas duras, comandos, convenciones)
- docs/planificacion.md (reglas R-xx)
- docs/specs/NNN-nombre/spec.md y tasks.md (tu encargo: tareas T-xx, T-xy)
- docs/agents/<rol>.md (tu rol: qué puedes y no puedes hacer)
- docs/CONTINUAR.md (estado actual)

Contexto del encargo:
- Modo de la sesión: usa el "Nivel recomendado" de docs/agents/<rol>.md
- Rama de trabajo: feat/NNN-nombre (créala desde main si no existe)
- Tareas asignadas: <lista T-xx>
- Decisiones tomadas: <decisiones del usuario o ADRs relevantes>
- Restricciones: <límites concretos, p. ej. "no toques api/">

Entregable y cierre:
- <qué debe quedar hecho y verificado, con comandos concretos>
- Reporte breve final: qué hiciste, archivos tocados, comandos con resultados, pendientes.
- No abras PR, no hagas merge, no cambies de rama: eso lo hace el orquestador.
```

## Verificación que hace el orquestador (no delegable)

- **Rojo comprobado:** leer el log del test-writer — los tests fallan por funcionalidad ausente, no por errores de la suite.
- **Separación de autores:** `git log` — ningún commit `feat:`/`fix:`/`refactor:` contiene archivos de test; ningún `test:` contiene producción.
- **DoD:** tests + lint + typecheck verdes en ambos paquetes; cada AC-xx con su test; `docs/api/openapi.yaml` consistente; sin hallazgos críticos/altos abiertos; APROBADO del reviewer.
- **Memoria:** `docs/PROGRESS.md` y `docs/CONTINUAR.md` actualizados al terminar cada paso relevante, no solo al cerrar la funcionalidad.

## Actualización de CONTINUAR.md

Al cerrar cada paso: estado exacto de la funcionalidad, siguiente acción concreta, decisiones nuevas del usuario, trampas descubiertas, archivos clave tocados. Debe permitir que una conversación nueva retome el trabajo sin historial.

## Prohibido

- Escribir producción o tests.
- Delegar dos encargos que se pisen en archivos.
- Avanzar de paso sin verificar el anterior.
- Integrar a `main` sin permiso explícito del usuario.
- Afirmar que un trabajo fue delegado si no lo fue.
