#!/usr/bin/env bash
# Levanta Postgres 16 en Docker (contenedor runner-pg, volumen persistente,
# puerto 5432 solo en loopback) y crea runner_dev y runner_test.
# Idempotente: si el contenedor existe lo arranca; las bases solo se crean
# cuando faltan. No borra ni contenedores ni volúmenes.
set -euo pipefail

CONTAINER="runner-pg"
IMAGE="postgres:16"
VOLUME="runner-pg-data"
PORT="5432"
DB_USER="runner"
DB_PASSWORD="runner"

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker start "$CONTAINER" >/dev/null
else
  docker run -d \
    --name "$CONTAINER" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="runner_dev" \
    -p "127.0.0.1:${PORT}:5432" \
    -v "${VOLUME}:/var/lib/postgresql/data" \
    "$IMAGE" >/dev/null
fi

# Esperar a que Postgres acepte conexiones.
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

for db in runner_dev runner_test; do
  if ! docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${db}'" | grep -q 1; then
    docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres \
      -c "CREATE DATABASE ${db}" >/dev/null
  fi
done

echo "runner-pg listo: bases runner_dev y runner_test disponibles en 127.0.0.1:${PORT}"
