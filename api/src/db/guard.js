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
    // Sequelize/pg usan el path COMPLETO como nombre de BD (p.ej.
    // '/a/b' → 'a/b'), no solo el primer segmento.
    const name = new URL(url).pathname.replace(/^\//, '');
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
  // 'database' explícito falsy ('', null, 0, false) NO hereda: Sequelize lo
  // conserva (_.defaults) y pg cae a PGDATABASE — solo la clave ausente
  // hereda la base de forma segura.
  if (Object.prototype.hasOwnProperty.call(node, 'database')) {
    return /** @type {string|undefined} */ (node.database ?? undefined) || undefined;
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

/**
 * Valor de un flag estilo `--env x` / `--env=x` en argv de sequelize-cli.
 * @param {string[]} argv
 * @param {string} name
 * @returns {string|undefined}
 */
export function cliFlagValue(argv, name) {
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  const eq = argv.find(
    (a) => typeof a === 'string' && a.startsWith(`${name}=`),
  );
  return eq ? eq.slice(name.length + 1) : undefined;
}

/**
 * Nombre de BD efectivo para una entrada del CLI: a diferencia de la
 * fábrica, sequelize-cli fusiona parseDbUrl(url/envUrl) SOBRE la config
 * (lodash.merge), así que una URL presente sin path produce database '' que
 * desvía a PGDATABASE — no es un destino verificable: inseguro.
 * @param {Record<string, unknown>} target
 * @returns {string|undefined}
 */
export function cliTargetDatabaseName(target = {}) {
  if (typeof target.url === 'string' && target.url.length > 0) {
    return databaseFromUrl(target.url);
  }
  if (typeof target.use_env_variable === 'string' && target.use_env_variable) {
    const envUrl = process.env[target.use_env_variable];
    if (envUrl) return databaseFromUrl(envUrl);
  }
  return resolveDatabaseName(target);
}

/**
 * Guardia de destino para el camino del CLI (semántica merge de
 * config-helper), incluidos nodos de replicación.
 * @param {Record<string, unknown>} target
 * @returns {void}
 */
export function assertCliTarget(target = {}) {
  const base = cliTargetDatabaseName(target);
  assertTestDatabaseName(base);
  const rep = /** @type {{read?: unknown, write?: unknown}|undefined} */ (
    target.replication
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
