// Fixture de tests: valida un target del CLI con la guardia semántica
// assertCliTarget y reporta el destino base resuelto (offline, sin conexión).
import { assertCliTarget, cliTargetDatabaseName } from '../../src/db/guard.js';

const target = JSON.parse(process.env.TARGET_JSON ?? '{}');
console.log('CLI_BASE=' + String(cliTargetDatabaseName(target)));
assertCliTarget(target);
console.log('CLI_TARGET_OK');
