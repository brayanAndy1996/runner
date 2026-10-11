# Tasks — Spec 011

| Tarea | Rol | Descripción | Depende de |
| --- | --- | --- | --- |
| T-01 | api-dev | ADR storage R2/S3 + adapter `local`/`s3` + fail-fast en arranque | — |
| T-02 | test-writer | Tests rojos: driver s3 con cliente mockeado (AC-01, AC-02, AC-03), idempotencia de migración (AC-04) | T-01 |
| T-03 | api-dev | Implementación s3 (firma de URLs, upload) + migración `media.storage` | T-02 |
| T-04 | api-dev | Script de migración uploads→R2 idempotente con reporte | T-03 |
| T-05 | api-dev | `.env.example` + openapi (mismo contrato, nota de redirect) | T-03 |
| T-06 | adversarial-tester | URL firmada reutilizada/expirada, IDOR antes del redirect, driver mal configurado, migración a medias | T-04 |
| T-07 | reviewer | Auditoría | T-06 |
