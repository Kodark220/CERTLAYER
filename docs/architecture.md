# CertLayer Architecture

## Product Positioning

CertLayer is programmable event verification, automated enforcement, and integrated hack-response coordination infrastructure.

You verify. You trigger. You enforce.

## System Context

Primary actors:
- Protocol teams (paying customers)
- End users eligible for compensation
- Admin/security operators
- Third-party data consumers (funds, analysts, aggregators)

Primary value loops:
- Reliability accountability loop (monitor -> verify -> enforce)
- Security response loop (detect -> assess risk -> pause/signal -> recover)
- Reputation intelligence loop (incident/security history -> score -> distribution)

## High-Level Components

### 1) Frontend

- Public Reputation Explorer (no login)
- Protocol Dashboard (wallet/email auth + RBAC)
- Internal Admin/Security Controls (role-gated)
- API Portal (API key management, usage, billing)

### 2) API Service

Responsibilities:
- auth session issuance and RBAC
- protocol/team management
- SLA + endpoint configuration
- incident + security action endpoints
- API key lifecycle and rate-limit metadata
- billing/accounting integration boundary

### 3) Monitoring & Enforcement Worker

Responsibilities:
- scheduled endpoint monitoring
- multi-source evidence collection
- breach candidate creation
- verification pipeline orchestration
- contract trigger execution
- score recomputation jobs
- security feed + pattern updater orchestration

### 4) GenLayer Intelligent Contracts

Primary contracts in this repo:
- `contracts/genlayer/certlayer_contract.py`
- `contracts/genlayer/hack_detection_contract.py`

### 5) PostgreSQL + Event Store

- source of truth for operational product state
- immutable append-only incident/security events
- materialized read models for dashboards

## Bounded Contexts

1. Identity & Access
2. Protocol Registry
3. SLA & Monitoring
4. Incident Verification
5. Compensation Enforcement
6. Security Threat Detection & Pause Signaling
7. Reputation Intelligence
8. API Product & Billing

## Critical Flows

### Protocol onboarding
1. Wallet signs challenge
2. Protocol profile created
3. SLA defined
4. Tier selected
5. Coverage requirements initialized
6. Protocol registration finalized

### Incident to payout
1. Worker detects anomaly
2. Evidence aggregated from multiple sources
3. Verification decision created
4. Incident finalization + challenge lifecycle executed
5. Payout transactions recorded
6. Reputation state updated

### Hack detection to emergency response
1. Suspicious transaction analyzed (patterns + AI-assisted signals)
2. Risk score assigned per tx hash
3. Threshold check triggers emergency controls
4. Pause signal emitted for registered protocols
5. Integrated protocols enforce guard checks / bots execute pause
6. Admin clears pause after response and recovery

### Reputation API consumption
1. Third party authenticates via API key
2. Reads score/profile endpoints
3. Usage metered for billing

## Security Baseline

- wallet auth via signed nonce (replay-safe)
- email auth with 2FA for privileged roles
- role-based permission matrix
- API key hashing, scoped permissions, rotation support
- full audit logs for auth + mutations + enforcement actions
- admin-gated emergency controls and pause operations

## Deployment Targets (Initial)

- Frontend: Vercel
- API: Render/Fly/Railway
- Worker: Render worker/Fly machine/cron runner
- Database: Managed Postgres (Neon/Supabase/Render PG)

## V1 Scope

Ship first:
- protocol registration + ownership binding
- incident lifecycle and compensation flow
- public reputation explorer endpoints
- integrated hack detection + protocol pause signaling
- role-gated internal security controls
