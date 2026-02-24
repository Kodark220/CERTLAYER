# CertLayer Architecture

## Product Positioning

CertLayer is programmable event verification and automated enforcement infrastructure.

You verify. You trigger. You enforce.

## System Context

Primary actors:
- Protocol teams (paying customers)
- End users eligible for compensation
- Third-party data consumers (funds, analysts, aggregators)

Primary value loops:
- SLA accountability loop (monitor -> verify -> enforce)
- Reputation intelligence loop (incident history -> score -> distribution)

## High-Level Components

### 1) Frontend

- Public Reputation Explorer (no login)
- Protocol Dashboard (wallet/email auth + RBAC)
- API Portal (API key management, usage, billing)

### 2) API Service

Responsibilities:
- Auth session issuance and RBAC
- Protocol/team management
- SLA and endpoint configuration
- Incident/query endpoints for UI
- API key lifecycle and rate-limit metadata
- Billing/accounting integration boundary

### 3) Monitoring & Enforcement Worker

Responsibilities:
- Scheduled endpoint monitoring
- Multi-source evidence collection
- Breach candidate creation
- Verification pipeline orchestration
- Contract trigger execution
- Score recomputation jobs

### 4) GenLayer Intelligent Contracts

Core contracts:
- Registry contract
- Monitoring/Breach attestation contract
- Coverage pool + compensation contract
- Reputation scoring contract

### 5) PostgreSQL + Event Store

- Source of truth for operational product data
- Immutable append-only incident and enforcement events
- Materialized read models for dashboards

## Bounded Contexts

1. Identity & Access
2. Protocol Registry
3. SLA & Monitoring
4. Incident Verification
5. Compensation Enforcement
6. Reputation Intelligence
7. API Product & Billing

## Critical Flows

### Protocol onboarding
1. Wallet signs challenge
2. Protocol profile created
3. SLA defined
4. Tier selected
5. Coverage pool funded
6. Registry contract finalized

### Incident to payout
1. Worker detects anomaly
2. Evidence aggregated from multiple sources
3. Verification decision created
4. Contract enforcement triggered
5. Payout transactions recorded
6. Reputation score updated

### Reputation API consumption
1. Third party authenticates via API key
2. Reads score/profile endpoints
3. Usage metered for billing

## Security Baseline

- Wallet auth via signed nonce (replay-safe)
- Email auth with 2FA for privileged roles
- Per-role permission matrix (Owner, Admin, Finance, Viewer)
- API key hashing, scoped permissions, rotation support
- Full audit logs for auth + mutations + enforcement actions

## Deployment Targets (Initial)

- Frontend: Vercel
- API: Render/Fly/Railway
- Worker: Render worker/Fly machine/cron runner
- Database: Managed Postgres (Neon/Supabase/Render PG)

## V1 Scope

Ship first:
- Protocol registration
- SLA persistence
- Monitoring checks
- Incident record creation
- Manual + worker-triggered enforcement
- Public protocol score read endpoints
