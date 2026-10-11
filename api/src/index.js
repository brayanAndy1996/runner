// Arranque del servidor API: conecta Sequelize y sirve la app.
// Uso: node --env-file=.env src/index.js (script "start").
import { createApp } from './app.js';
import { createSequelize } from './db/connection.js';
import config from './db/config.js';

const env = /** @type {keyof typeof config} */ (
  process.env.NODE_ENV && process.env.NODE_ENV in config
    ? process.env.NODE_ENV
    : 'development'
);
const sequelize = createSequelize(/** @type {Record<string, unknown>} */ (config[env]));

try {
  await sequelize.authenticate();
  console.log(`Conexión a la base de datos "${env}" establecida.`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`No se pudo conectar a la base de datos: ${msg}`);
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => {
  console.log(`API escuchando en http://127.0.0.1:${port}`);
});
