// Guardia de la base de datos de tests (R-10 / AC-04).
// En NODE_ENV=test toda conexión Sequelize debe apuntar a una BD que termine
// en "_test"; si no, el proceso aborta ANTES de intentar conectar.

/**
 * Extrae el nombre de la base de datos de una URL postgres(s).
 * @param {string|undefined} url
 * @returns {string|undefined}
 */
function databaseFromUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return undefined;
  try {
    const name = new URL(url).pathname.replace(/^\//, '').split('/')[0];
    return name || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resuelve el nombre de BD que usaría Sequelize a partir de las opciones
 * (database | url | use_env_variable) o de DATABASE_URL en el entorno.
 * @param {Record<string, unknown>} options
 * @returns {string|undefined}
 */
export function resolveDatabaseName(options = {}) {
  if (typeof options.database === 'string' && options.database.length > 0) {
    return options.database;
  }
  if (typeof options.url === 'string' && options.url.length > 0) {
    return databaseFromUrl(options.url);
  }
  if (typeof options.use_env_variable === 'string' && options.use_env_variable) {
    const fromEnv = databaseFromUrl(process.env[options.use_env_variable]);
    if (fromEnv) return fromEnv;
  }
  return databaseFromUrl(process.env.DATABASE_URL);
}

/**
 * Aborta el proceso si el nombre no termina en "_test". Mensaje en español.
 * @param {string|undefined} name
 * @returns {void}
 */
export function assertTestDatabaseName(name) {
  if (typeof name !== 'string' || !name.endsWith('_test')) {
    console.error(
      `Guardia de tests: en NODE_ENV=test la base de datos debe terminar en ` +
        `"_test" (resuelto: ${name ?? 'desconocida'}). Abortando antes de conectar.`,
    );
    process.exit(1);
  }
}
