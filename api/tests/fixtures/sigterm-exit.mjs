// Solo de pruebas: al recibir SIGTERM termina con exit(0) para que el volcado
// de cobertura V8 del subproceso se escriba (node solo emite cobertura en una
// salida limpia). Se precarga vía NODE_OPTIONS=--import en el hijo.
process.once('SIGTERM', () => process.exit(0));
