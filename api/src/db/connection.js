// Fábrica de instancias Sequelize con la guardia de la BD de tests (AC-04).
import { Sequelize } from 'sequelize';
import { resolveDatabaseName, assertTestDatabaseName } from './guard.js';

/**
 * Crea una instancia Sequelize. Acepta el estilo de sequelize-cli:
 * {database, username, password, host, port, dialect}, o {url}, o
 * {use_env_variable}. En NODE_ENV=test aborta el proceso antes de crear la
 * instancia si la BD resuelta no termina en "_test".
 * @param {Record<string, unknown>} [options]
 * @returns {Sequelize}
 */
export function createSequelize(options = {}) {
  if (process.env.NODE_ENV === 'test') {
    assertTestDatabaseName(resolveDatabaseName(options));
  }
  const { url, use_env_variable: useEnvVariable, ...rest } = options;
  const sequelizeOptions = /** @type {import('sequelize').Options} */ (rest);
  if (typeof url === 'string' && url.length > 0) {
    return new Sequelize(url, sequelizeOptions);
  }
  if (typeof useEnvVariable === 'string' && useEnvVariable) {
    const envUrl = process.env[useEnvVariable];
    if (envUrl) return new Sequelize(envUrl, sequelizeOptions);
  }
  return new Sequelize(sequelizeOptions);
}
