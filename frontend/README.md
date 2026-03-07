# CERTLAYER Frontend

Planned surfaces:
- Public Reputation Explorer (no login)
- Protocol Dashboard (auth + RBAC)
- API Access Portal

## Backend Requirement

Frontend expects the API service to be running and correctly wired to GenLayer Studio:

- Backend env: `GENLAYER_RPC_URL=https://studio.genlayer.com/api`
- Backend env: `GENLAYER_CHAIN=studionet`
- Frontend env: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` (or your deployed API URL)

## Immediate Next Build

1. Landing page with positioning:
   - "Programmable event verification and automated enforcement infrastructure"
   - "You verify. You trigger. You enforce."
2. Login page:
   - Wallet sign-in (primary)
   - Email + password + 2FA (secondary)
3. Dashboard shell:
   - Overview
   - Incidents
   - Coverage pool
   - Reputation score
   - API access
