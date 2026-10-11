#!/usr/bin/env bash
# Réplica local del pipeline CI (spec 001 / AC-07):
# Postgres → migraciones dev+test → lint, typecheck y tests en api/ y app/.
# Cualquier fallo aborta y propaga el código de salida (set -e).
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/db-up.sh

(
  cd api
  npm run db:migrate
  NODE_ENV=test npm run db:migrate
)

for pkg in api app; do
  (
    cd "$pkg"
    npm run lint
    npm run typecheck
    npm test
  )
done

echo "ci-local: pipeline completo en verde"
