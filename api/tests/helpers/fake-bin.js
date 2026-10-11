// Genera ejecutables falsos (docker, npm) para probar scripts de shell
// sin tocar Docker ni npm reales. Solo código de pruebas.

import { mkdtempSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DOCKER_STUB = `#!/usr/bin/env bash
# Stub de docker: registra argv en $STUB_DOCKER_LOG y simula un estado mínimo
# en $STUB_DOCKER_STATE (lista de contenedores "creados").
echo "docker $*" >> "$STUB_DOCKER_LOG"
cmd="$1"
case "$cmd" in
  ps)
    [ -f "$STUB_DOCKER_STATE" ] && cat "$STUB_DOCKER_STATE"
    exit 0
    ;;
  inspect|container)
    if [ -f "$STUB_DOCKER_STATE" ] && grep -q runner-pg "$STUB_DOCKER_STATE"; then
      echo "running"
      exit 0
    fi
    exit 1
    ;;
  run)
    name=""
    prev=""
    for a in "$@"; do
      if [ "$prev" = "--name" ]; then name="$a"; fi
      prev="$a"
    done
    [ -n "$name" ] && echo "$name" >> "$STUB_DOCKER_STATE"
    echo "stub-container-id"
    exit 0
    ;;
  start|restart|exec|logs|pull|images|volume|network)
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
`;

const NPM_STUB = `#!/usr/bin/env bash
# Stub de npm: registra "npm <args> @ <cwd>" en $STUB_NPM_LOG.
# Falla con exit 1 si "$PWD $*" casa $STUB_FAIL_MATCH.
echo "npm $* @ $PWD" >> "$STUB_NPM_LOG"
if [ -n "$STUB_FAIL_MATCH" ] && echo "$PWD $*" | grep -qE "$STUB_FAIL_MATCH"; then
  echo "stub: fallo forzado ($STUB_FAIL_MATCH)" >&2
  exit 1
fi
exit 0
`;

/**
 * Crea un directorio temporal con un `docker` falso y un `npm` falso.
 * @returns {{dir: string, dockerLog: string, npmLog: string, state: string, env: Record<string,string>}}
 */
export function makeFakeBin() {
  const dir = mkdtempSync(join(tmpdir(), 'runner-fakebin-'));
  const dockerLog = join(dir, 'docker.log');
  const npmLog = join(dir, 'npm.log');
  const state = join(dir, 'docker.state');
  writeFileSync(join(dir, 'docker'), DOCKER_STUB);
  writeFileSync(join(dir, 'npm'), NPM_STUB);
  chmodSync(join(dir, 'docker'), 0o755);
  chmodSync(join(dir, 'npm'), 0o755);
  writeFileSync(dockerLog, '');
  writeFileSync(npmLog, '');
  return {
    dir,
    dockerLog,
    npmLog,
    state,
    env: {
      PATH: `${dir}:${process.env.PATH ?? ''}`,
      STUB_DOCKER_LOG: dockerLog,
      STUB_DOCKER_STATE: state,
      STUB_NPM_LOG: npmLog,
    },
  };
}
