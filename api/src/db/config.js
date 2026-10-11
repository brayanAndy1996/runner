// Configuración Sequelize por entorno, consumida por sequelize-cli
// (.sequelizerc apunta aquí) y por src/index.js. ESM: sequelize-cli la
// carga con import dinámico; .sequelizerc sigue siendo CommonJS.
import { resolveDatabaseName, assertTestDatabaseName } from './guard.js';

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

// Misma guardia que createSequelize: con NODE_ENV=test, cualquier cliente de
// esta config (sequelize-cli incluido) aborta antes de conectar si la BD de
// test no termina en _test.
if (process.env.NODE_ENV === 'test') {
  assertTestDatabaseName(resolveDatabaseName(config.test));
}

export default config;
