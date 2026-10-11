// Fábrica de instancias Sequelize con la guardia de la BD de tests (AC-04).
import { Sequelize } from 'sequelize';
import {
  databaseFromUrl,
  assertTestTarget,
} from './guard.js';

/**
 * Crea una instancia Sequelize. Acepta el estilo de sequelize-cli:
 * {database, username, password, host, port, dialect}, o {url}, o
 * {use_env_variable}, con la precedencia real del constructor
 * (url > use_env_variable > database > DATABASE_URL). En NODE_ENV=test
 * aborta el proceso antes de crear la instancia si cualquier destino
 * efectivo (base o nodos de replicación) no termina en "_test".
 * @param {Record<string, unknown>} [options]
 * @returns {Sequelize}
 */
export function createSequelize(options = {}) {
  if (process.env.NODE_ENV === 'test') {
    assertTestTarget(options);
  }
  const { url, use_env_variable: useEnvVariable, ...rest } = options;
  const sequelizeOptions = /** @type {import('sequelize').Options} */ (rest);
  // Una URL (directa o por env) sin path de BD no puede desviar el destino a
  // PG*: se consume el fallback DATABASE_URL como database explícita.
  const sealFallback = (/** @type {string|undefined} */ connUrl) => {
    if (
      !databaseFromUrl(connUrl) &&
      (typeof sequelizeOptions.database !== 'string' || !sequelizeOptions.database)
    ) {
      const fallback = databaseFromUrl(process.env.DATABASE_URL);
      if (fallback) sequelizeOptions.database = fallback;
    }
  };
  if (typeof url === 'string' && url.length > 0) {
    sealFallback(url);
    return new Sequelize(url, sequelizeOptions);
  }
  if (typeof useEnvVariable === 'string' && useEnvVariable) {
    const envUrl = process.env[useEnvVariable];
    if (envUrl) {
      sealFallback(envUrl);
      return new Sequelize(envUrl, sequelizeOptions);
    }
  }
  // Fallback real: sin database explícita, DATABASE_URL define el destino
  // (se consume de verdad — no se deja que PG* desvíe a otra BD).
  if (typeof sequelizeOptions.database !== 'string' || !sequelizeOptions.database) {
    const fallback = databaseFromUrl(process.env.DATABASE_URL);
    if (fallback) sequelizeOptions.database = fallback;
  }
  return new Sequelize(sequelizeOptions);
}
