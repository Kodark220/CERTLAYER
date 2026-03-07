# CERTLAYER Standard Product Documentation

Last updated: March 5, 2026

## Introduction

CERTLAYER is a GenLayer-powered accountability platform for web3 infrastructure.

It helps protocols:
- prove reliability with transparent incident workflows
- enforce compensation logic when defined conditions are met
- coordinate emergency security response through integrated HackDetection

In short:
Protocols commit. CERTLAYER verifies. CERTLAYER enforces.

## The Problem CERTLAYER Solves

Web3 infrastructure protocols still face the same trust problem:
- reliability promises are easy to publish, hard to verify independently
- outage handling is often manual and inconsistent
- compensation decisions are opaque and delayed
- users and partners lack a neutral reliability record
- security response is fragmented across dashboards, bots, and ad-hoc tooling

Without a shared enforcement layer, service guarantees are mostly reputational claims.

## Solution Vision

CERTLAYER provides a unified trust layer for two operational realities:
- Reliability incidents (downtime, SLA breaches, missed commitments)
- Security incidents (hack detection, emergency pause signaling, risk escalation)

The vision is one integrated system where:
- evidence is captured and state transitions are explicit
- challenge windows are formalized
- enforcement is auditable
- protocol-level controls and public reputation are linked

## Getting Started (Current Workspace)

### 1) Prerequisites

- Node.js 20+
- npm 10+
- Access to GenLayer endpoint (`https://studio.genlayer.com/api`) for live on-chain mode

### 2) Install dependencies

From repository root:

```bash
npm install
```

### 3) Configure environment variables

Root:
- `.env.example`

API:
- `api/.env.example`
- Required for live writes:
  - `GENLAYER_CONTRACT_ADDRESS`
  - `GENLAYER_SERVER_PRIVATE_KEY`
  - `GENLAYER_SERVER_ACCOUNT` (must match private key derived address)
- Optional for integrated security contract:
  - `GENLAYER_SECURITY_CONTRACT_ADDRESS`
- Access control:
  - `API_KEY`
  - `ADMIN_WALLETS=0xAdmin1,0xAdmin2`

Frontend:
- `frontend/.env.example`
- Key values:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS`
  - `NEXT_PUBLIC_API_KEY`
  - `NEXT_PUBLIC_SHOW_INTERNAL_CONTROLS`

Worker:
- `worker/.env.example`

### 4) Run services

From repository root:

```bash
npm run dev:api
npm run dev:frontend
npm run dev:worker
```

### 5) Basic health check

```bash
GET /health
```

Expected key fields:
- `live_mode`
- `security_live_mode`
- `genlayer_contract`
- `genlayer_security_contract`
- `has_server_private_key`

## What CERTLAYER Is (In-Depth)

CERTLAYER is not a single dashboard. It is a multi-surface system:
- Public Reputation Explorer for transparent protocol posture
- Private Protocol Dashboard for protocol-specific operations
- Internal Admin/Security controls for sensitive operations
- API service that enforces auth, ownership, and workflow boundaries
- GenLayer contracts that anchor lifecycle transitions and security actions

CERTLAYER is designed so each protocol sees only its own operational scope, while admins can manage global controls.

## Key Features

### Reliability and enforcement

- Protocol registration with owner wallet binding
- Incident lifecycle actions:
  - create incident
  - attach affected users
  - open challenge window
  - raise/resolve disputes
  - finalize incident
  - execute payout batches
- Compensation pool deposit and tracking
- Commitment lifecycle:
  - register commitment
  - evaluate result
  - attach fulfillment evidence
  - finalize commitment
- Public reputation listing endpoint

### HackDetection and emergency controls (integrated)

- Transaction threat analysis (`analyze_transaction`)
- Risk score + analysis retrieval by tx hash
- Attack pattern management
- Security event visibility
- Protocol pause signaling controls:
  - register protected protocol
  - pause protocol
  - clear protocol pause
- Contract-level emergency unpause path

### Access model

- Wallet nonce/signature auth
- Session-based access with expiration
- Role distinction:
  - admin
  - owner
- Protocol ownership enforcement on write actions
- Admin-only security write endpoints

## Core Concepts and What They Do

### Protocol

Represents an onboarded infrastructure provider with:
- owner wallet
- metadata
- coverage pool state
- commitments
- incident history

### Incident

A formal reliability/security case with explicit progression:
- candidate
- challenge open
- finalized
- payout execution

### Commitment

A protocol promise tied to evaluation and evidence.

### Compensation Pool

Protocol-funded balance used for compensation logic.

### Reputation

Publicly queryable summary derived from protocol state and incident outcomes.

### Security Signal

A suspicious transaction analysis event in HackDetection with risk and optional pause escalation.

### Emergency Pause

A protocol pause signal emitted by HackDetection.

Important:
pause signaling is effective only when integration exists on the target protocol side.

## Architecture Overview

### Frontend (`frontend/`)

- Next.js App Router
- Tailwind + shadcn/ui
- Wallet integration via wagmi
- Key pages:
  - `/` (landing)
  - `/signin`
  - `/dashboard`
  - `/explorer`

### API (`api/`)

Node service exposing:
- auth endpoints (`/v1/auth/*`)
- protocol endpoints (`/v1/protocols/*`)
- incident and enforcement endpoints (`/v1/incidents/*`, `/v1/enforcement/*`)
- commitment endpoints (`/v1/commitments/*`)
- security endpoints (`/v1/security/*`)
- public reputation endpoints (`/v1/public/reputation`)

### Worker (`worker/`)

Background process polling API and generating monitoring events.
Current implementation is lightweight and development-oriented (simulated anomaly creation).

### Contracts (`contracts/genlayer/`)

- `certlayer_contract.py`
- `hack_detection_contract.py`

These contracts provide on-chain state and write execution for reliability/security operations.

## How CERTLAYER Works: Reliability Case

1. Protocol signs in with wallet and registers.
2. Protocol owner/admin configures operational data.
3. Incident is created when an issue is detected.
4. Affected users and amounts are attached.
5. Challenge window opens for disputes.
6. Disputes are raised/resolved.
7. Incident finalizes.
8. Payouts execute in batches.
9. Reputation/public posture updates.

## How CERTLAYER Works: HackDetection Case

1. Security operator submits suspicious tx context.
2. HackDetection analyzes using:
   - pattern matching
   - AI/consensus-assisted logic
   - risk scoring
3. High-risk path triggers emergency controls (contract pause logic + protocol pause signals).
4. Security team can:
   - escalate analysis
   - inspect recent analyses
   - inspect security events
   - manage attack patterns
5. Recovery path includes unpause and protocol pause clearing where appropriate.

## Emergency Pause Model

CERTLAYER integrated emergency pause supports cross-protocol signaling, but not automatic remote halting by default.

A target protocol is effectively paused only if one of these is implemented:
- On-chain guard check:
  - `should_pause_protocol(address(this))`
- Off-chain automation:
  - listener bot receives signal and calls target protocol pause function

This is a deliberate integration contract, not implicit control of external protocols.

## Integration With Other Protocols

### Reliability integration path

Other protocols can integrate by:
- registering with CERTLAYER
- binding owner wallet identity
- using dashboard/API flows for incident and commitment lifecycle
- funding compensation pool operations
- exposing transparent reliability history to users/partners

### HackDetection integration path

Other protocols can integrate by:
- registering protocol address in HackDetection
- implementing protocol-side pause guard checks
- optionally consuming webhook/events for automation
- adding security governance process around pause/clear-pause actions

## Security Details of CERTLAYER

### Identity and auth

- Nonce-based wallet authentication
- Signature verification using recovered signer address
- Expiring sessions (24h default)

### Authorization

- Owner can mutate only owned protocol resources
- Admin wallets (from `ADMIN_WALLETS`) receive elevated access
- Security write endpoints require admin/internal access

### API hardening controls

- Optional `x-api-key` for internal access mode
- 401/403 enforcement for protected routes
- Address normalization and validation

### Contract safety patterns

- explicit incident state fields
- dispute keyed records
- challenge-window based finalization
- payout batching (reduces single-call blast radius)
- typed storage and method-level read/write separation

### Operational caveats (current)

- API store is currently in-memory (`api/src/store.mjs`) and resets on restart
- worker behavior is currently basic and non-production monitoring logic
- full persistent event/audit backend is planned (see roadmap)

## Roadmap and Future Versions

### Roadmap v0.2 (Near-term hardening)

- persistent database-backed state for protocols/incidents/commitments/sessions
- durable audit log pipeline
- stronger session management and refresh model
- stricter input validation and endpoint-level rate limiting

### Roadmap v0.3 (Reliability engine expansion)

- production monitoring pipelines (multi-source, deterministic ingestion adapters)
- richer incident evidence objects (not CSV-only queue artifacts)
- improved payout orchestration and reconciliation status tracking
- expanded public explorer analytics and protocol profile views

### Roadmap v0.4 (Security and response expansion)

- deeper HackDetection signal fusion (on-chain + off-chain corroboration)
- configurable risk policies per protocol
- richer emergency runbook automation
- integrated protocol pause adapters for faster third-party integration

### Roadmap v1.0 (Platform maturity)

- full protocol self-serve onboarding + team RBAC
- monetized API product tiering and usage controls
- stronger governance around scoring and challenge arbitration
- production-grade observability, incident forensics, and compliance reporting

## Scope Notes (Implementation Reality)

This document reflects what exists in this workspace now, plus explicitly separated roadmap items.

If you want, the next step is to split this into:
- product-facing docs
- developer integration docs
- operator runbooks

so each audience has a clean, focused version.
