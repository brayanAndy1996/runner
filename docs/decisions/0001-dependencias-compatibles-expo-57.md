# ADR 0001 — Dependencias compatibles con Expo 57

- Estado: aprobado y aplicado en `e1e642b`; instalación, versiones, tests, lint, typecheck y Expo check verificados. Build nativo pendiente.
- Fecha: 2026-10-11.
- Autorización: Bryan seleccionó **«Aprobar los siete puntos»** en esta sesión, puntos 1–3 de H-02.

## Contexto

La auditoría detectó `decode-uri-component@0.2.2` vulnerable en el árbol de navegación, `test-renderer@1.3.0` destinado a React 19.3 y Reanimated/Worklets fuera de la matriz de Expo 57. Los tests de JavaScript no acreditan compatibilidad nativa.

## Decisión

En `app/`, sin cambiar React, React Native ni Expo:

1. Aplicar override npm `decode-uri-component@^0.5.0`.
2. Fijar `test-renderer@~1.2.0` como dependencia de desarrollo y comprobar que RNTL utiliza esa versión compatible con React 19.2.3.
3. Alinear `react-native-reanimated@4.5.1` y `react-native-worklets@0.10.1`, los valores de `expo@57.0.27/bundledNativeModules.json`.

Actualizar manifiesto y lockfile con mobile-dev, sin modificar tests. No ejecutar `npm audit fix`, downgrades mayores ni sustituir el stack aprobado.

## Verificación y límites

- Instalar desde el lockfile con `npm ci`; inspeccionar versiones y peers mediante `npm ls`.
- Ejecutar tests, lint, typecheck y `expo install --check`.
- Repetir auditoría de dependencias y adversarial; cualquier incompatibilidad nueva vuelve al orquestador.
- Un resultado de Jest/Expo check no equivale a un build Android/iOS. Antes del primer uso nativo deberá comprobarse el dev-build.

## Referencias

- [Versiones compatibles de Expo](https://docs.expo.dev/more/expo-cli/#installing-dependencies).
- [Instalación de React Native Testing Library](https://oss.callstack.com/react-native-testing-library/docs/start/installation).
- Matriz instalada: `app/node_modules/expo/bundledNativeModules.json`.
- [Sesión y aprobación del usuario](https://app.devin.ai/sessions/034a530278564a678a97d3c3a0a43334).
