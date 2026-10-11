// App Express. createApp() es la factory que usa la suite de tests
// (supertest) y src/index.js para arrancar el servidor.
import express from 'express';

/**
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}
