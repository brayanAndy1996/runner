// Guardia de la base de datos de tests (R-10 / AC-04).
// En NODE_ENV=test toda conexión Sequelize debe apuntar a una BD que termine
// en "_test"; si no, el proceso aborta ANTES de intentar conectar.

/**
 * Extrae el nombre de la base de datos de una URL postgres(s).
 * @param {string|undefined} url
 * @returns {string|undefined}
 */
export function databaseFromUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return undefined;
  try {
    const name = new URL(url).pathname.replace(/^\//, '').split('/')[0];
    return name || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resuelve el nombre de BD EFECTIVO que usaría Sequelize con la precedencia
 * real del constructor: url > use_env_variable > database > DATABASE_URL.
 * @param {Record<string, unknown>} options
 * @returns {string|undefined}
 */
export function resolveDatabaseName(options = {}) {
  if (typeof options.url === 'string' && options.url.length > 0) {
    return databaseFromUrl(options.url);
  }
  if (typeof options.use_env_variable === 'string' && options.use_env_variable) {
    const fromEnv = databaseFromUrl(process.env[options.use_env_variable]);
    if (fromEnv) return fromEnv;
  }
  if (typeof options.database === 'string' && options.database.length > 0) {
    return options.database;
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

/**
 * Nombre efectivo de un nodo de replicación: propio database, su url, o la
 * base heredada de la config principal.
 * @param {Record<string, unknown>} node
 * @param {string|undefined} base
 * @returns {string|undefined}
 */
function replicationNodeName(node, base) {
  if (typeof node.database === 'string' && node.database.length > 0) {
    return node.database;
  }
  if (typeof node.url === 'string' && node.url.length > 0) {
    return databaseFromUrl(node.url);
  }
  return base;
}

/**
 * Valida el destino efectivo completo de una config Sequelize: la base
 * principal y cada nodo de replication.write/read (que heredan la base
 * resuelta si no declaran la suya). Aborta el proceso ante cualquier
 * destino que no termine en "_test".
 * @param {Record<string, unknown>} options
 * @returns {void}
 */
export function assertTestTarget(options = {}) {
  const base = resolveDatabaseName(options);
  assertTestDatabaseName(base);
  const rep = /** @type {{read?: unknown, write?: unknown}|undefined} */ (
    options.replication
  );
  if (rep && typeof rep === 'object') {
    const nodes = [
      ...(Array.isArray(rep.read) ? rep.read : []),
      ...(rep.write ? [rep.write] : []),
    ];
    for (const node of nodes) {
      assertTestDatabaseName(
        replicationNodeName(/** @type {Record<string, unknown>} */ (node ?? {}), base),
      );
    }
  }
}
