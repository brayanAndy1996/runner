// Configuración Sequelize por entorno, consumida por sequelize-cli
// (.sequelizerc apunta aquí) y por src/index.js. ESM: sequelize-cli la
// carga con import dinámico; .sequelizerc sigue siendo CommonJS.
import { fileURLToPath } from 'node:url';
import {
  RC_ENV_AMBIGUOUS,
  assertCliTarget,
  assertTestDatabaseName,
  cliEffectiveEnv,
  cliFlagValue,
} from './guard.js';

const base = {
  username: process.env.DB_USER ?? 'runner',
  password: process.env.DB_PASSWORD ?? 'runner',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: false,
};

const config = {
  development: {
    ...base,
    database: process.env.DB_NAME ?? 'runner_dev',
  },
  test: {
    ...base,
    database: process.env.DB_NAME ?? 'runner_test',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
  },
};

// Misma guardia que createSequelize, con la semántica del CLI: con
// NODE_ENV=test se valida la entrada que el invocador selecciona (--env,
// --url) —no siempre config.test—, así también cubre cargas por --config
// desde cwd sin .sequelizerc.
if (process.env.NODE_ENV === 'test') {
  const argv = process.argv.slice(2);
  const urlArg = cliFlagValue(argv, '--url');
  // Entorno EFECTIVO del CLI: flag --env > clave `env` del rc (cwd o
  // --options-path) > NODE_ENV. El propio .sequelizerc se ignora al leer el
  // rc para no re-ejecutar su preflight (ciclo require).
  const ownRc = fileURLToPath(new URL('../../.sequelizerc', import.meta.url));
  const envArg = cliEffectiveEnv(argv, ownRc);
  if (envArg === RC_ENV_AMBIGUOUS) {
    // El rc precargó este config antes de exportar: su env es desconocido y
    // podría ser no-test → fallar cerrado antes de cualquier conexión.
    assertTestDatabaseName(undefined);
  }
  const target =
    typeof urlArg === 'string' && urlArg.length > 0
      ? { url: urlArg }
      : (config[/** @type {keyof typeof config} */ (envArg)] ?? config.test ?? {});
  assertCliTarget(/** @type {Record<string, unknown>} */ (target));
}

export default config;
