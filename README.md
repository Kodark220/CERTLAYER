# CERTLAYER Monorepo

CERTLAYER is a trust-minimized reliability and incident-enforcement platform for web3 infrastructure.

## What CERTLAYER Primarily Does

CERTLAYER helps protocols move from promises to verifiable enforcement:
- monitors protocol reliability using multiple independent signals
- creates and manages incident lifecycle states (candidate -> challenge -> finalization)
- supports dispute/challenge windows with explicit evidence flow
- executes compensation/payout operations when conditions are met
- publishes transparent reliability posture for users and partners

In plain terms:
Protocols commit to reliability targets, CERTLAYER verifies outcomes, and users/partners can see what actually happened.

## Integrated Security Layer: HackDetection

CERTLAYER also includes an integrated HackDetection capability for security incident coordination and emergency pause signaling.

HackDetection adds:
- suspicious transaction analysis (pattern matching + AI/consensus-assisted checks)
- risk scoring per transaction hash
- emergency response controls (circuit-breaker pause, blacklisting, security event records)
- cross-protocol pause signaling (`register_protocol`, `pause_protocol`, `should_pause_protocol`)
- off-chain bot integrations for monitoring and pattern updates

### Important Limitation
HackDetection does **not** magically pause unrelated protocols by itself.
A protected protocol is effectively paused only when either:
- the protocol contract checks `should_pause_protocol(address(this))` before sensitive actions, or
- automation bots call that protocol’s own pause function.

Detailed HackDetection reference:
- `docs/HACK_DETECTION.md`

## Core Contract Modules

### `contracts/genlayer/certlayer_contract.py`
Primary CERTLAYER reliability and enforcement logic:
- protocol registration and ownership
- incident lifecycle and challenge handling
- payout operations
- reputation-facing state

### `contracts/genlayer/hack_detection_contract.py`
Integrated security coordination and emergency pause-signaling layer:
- transaction threat analysis and risk scoring
- suspicious address blacklisting
- protocol pause signaling and pause state queries
- event hooks for automation systems

## Product Surfaces

### Public Reputation Explorer
Public reliability view across onboarded protocols.

### Protocol Dashboard (Private)
Operational console for registered protocols/admins:
- protocol registration
- incident lifecycle controls
- commitments tracking
- payout batching
- security/hack-response controls (where enabled)

### API Portal
Partner-facing access to reliability/reputation intelligence.

## Monorepo Structure

- `frontend/` - Next.js App Router UI (TypeScript), Tailwind + shadcn/ui
- `api/` - Node API service (auth, workflows, public endpoints)
- `worker/` - background jobs / async processing
- `contracts/genlayer/` - GenLayer intelligent contract code
- `infra/sql/` - database initialization/migrations
- `docs/` - product and engineering notes

## High-Level Runtime Flow

1. Protocol is registered and linked to owner/admin controls.
2. Monitoring and/or security signals indicate potential incident.
3. CERTLAYER records candidate incident with evidence context.
4. Challenge/dispute window runs.
5. Incident finalizes.
6. Payout/compensation operations execute.
7. Public reliability/reputation state updates.

## Tech Stack (Current)

Frontend:
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- shadcn/ui component primitives
- Recharts
- wagmi stack (wallet integration scaffold)

Backend/Workers:
- Node.js services (API + worker)

Contracts:
- Python-based GenLayer contracts under `contracts/genlayer/`

## Local Development

From repo root:
- Frontend: `npm run dev:frontend`
- API: `npm run dev:api`
- Worker: `npm run dev:worker`

Install dependencies once at root before running services.

## Configuration

Environment variables are split by service (`frontend`, `api`, `worker`).
Configure at minimum:
- API base URL wiring
- auth/session secrets
- GenLayer network + contract addresses
- service credentials (where applicable)

## Guiding Principle

Do not trust a single source of truth for failure claims.
CERTLAYER is built around corroborated evidence, explicit dispute windows, and transparent state transitions.
