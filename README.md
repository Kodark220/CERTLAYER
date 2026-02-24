# CertLayer Monorepo

CertLayer is a trustless insurance and reputation platform for web3 infrastructure.

Business model:
- Protocols pay CertLayer to monitor and enforce SLA commitments.
- Users are compensated automatically when verified failures occur.
- Third parties pay for reputation and reliability intelligence.

## Current State

This repository now contains both:
- Frontend baseline (Next.js shell)
- Backend baseline (Node API + worker)
- GenLayer contract V1 scaffolds (Python)

## Run (after `npm install` in root)

- Frontend: `npm run dev:frontend`
- API: `npm run dev:api`
- Worker: `npm run dev:worker`

## Key Paths

- Frontend app: `frontend/app/page.tsx`
- API server: `api/src/server.mjs`
- Worker: `worker/src/worker.mjs`
- Contracts: `contracts/genlayer/*.py`
- DB schema: `infra/sql/001_init.sql`

## Important Note

Contracts are scaffolded with real method interfaces and domain logic shape, but not yet deployed or integrated with live GenLayer execution paths.
