// Helpers de proceso para las pruebas de spec 001.
// Solo código de pruebas: no es producción.

import { spawnSync } from 'node:child_process';

/**
 * Resultado de una ejecución.
 * @typedef {object} RunResult
 * @property {number|null} status
 * @property {string|null} signal
 * @property {string} stdout
 * @property {string} stderr
 * @property {string} output  stdout + stderr
 * @property {number} durationMs
 * @property {Error|undefined} error
 */

/**
 * Ejecuta un comando de forma síncrona.
 * @param {string} cmd
 * @param {string[]} [args]
 * @param {{cwd?: string, env?: Record<string,string|undefined>, timeout?: number}} [options]
 * @returns {RunResult}
 */
export function run(cmd, args = [], options = {}) {
  const started = Date.now();
  const res = spawnSync(cmd, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
    timeout: options.timeout ?? 30000,
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    status: res.status,
    signal: res.signal,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
    output: `${res.stdout ?? ''}\n${res.stderr ?? ''}`,
    durationMs: Date.now() - started,
    error: res.error,
  };
}
