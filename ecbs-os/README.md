# ECBS OS Approved Stack Foundation

This folder is the clean ECBS OS implementation foundation. It follows the current `ECBS Software Development Project` documentation as the sole source of truth.

## Stack

- Backend: ASP.NET Core on .NET 9, C#, Clean Architecture.
- Frontend: React, Next.js, TypeScript, Tailwind CSS.
- Database: MySQL 8.x with EF Core and Pomelo MySQL provider.
- Legacy Angular, Flask, and Python services are migration evidence only.

## Layout

- `backend/src/ECBS.Api`: ASP.NET Core API host.
- `backend/src/ECBS.Application`: application contracts and use cases.
- `backend/src/ECBS.Domain`: ECBS domain model.
- `backend/src/ECBS.Infrastructure`: EF Core/MySQL persistence and infrastructure services.
- `backend/tests/ECBS.Tests`: backend test project.
- `frontend`: Next.js app router frontend.
- `docs`: foundation decisions and implementation notes.

## Local Commands

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet build ECBS.sln
dotnet tool restore
dotnet tool run dotnet-ef database update --project backend/src/ECBS.Infrastructure/ECBS.Infrastructure.csproj --startup-project backend/src/ECBS.Api/ECBS.Api.csproj
```

```bash
cd frontend
npm run lint
npm run build
```

## Batch Verification

Use the reusable verifier after each 5-8 screen batch:

```bash
python3 scripts/ecbs_batch_verify.py verification/client-management-write-flow.json
```

Run local build checks through the same config:

```bash
python3 scripts/ecbs_batch_verify.py verification/client-management-write-flow.json --include-commands
```

Run mutating write checks only when it is acceptable to create verifier records:

```bash
python3 scripts/ecbs_batch_verify.py verification/client-management-write-flow.json --include-mutating
```

Use the ECBS analysis workflow assets before and after the verifier:

- `docs/workflows/screen-batch-checklist-template.md` for the per-batch implementation checklist.
- `docs/workflows/subagent-audit-runbook.md` for read-only route, field, and placeholder audits.
- `docs/workflows/browser-click-check-workflow.md` for deployed click-through checks.

Browser click checks are required for batches with interactive route navigation, forms, save actions, or generate/configure actions.

## Dev Deploy

Set the required environment variables from `verification/dev-deploy.env.example`, then deploy and verify a batch:

```bash
python3 scripts/ecbs_dev_deploy.py --verification-config verification/client-management-write-flow.json
```

This wraps the repeatable dev steps: remote pull, backend build, EF migration update, frontend Docker rebuild/restart, API restart, and optional verifier execution.
