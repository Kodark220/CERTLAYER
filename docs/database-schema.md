# Database Schema (PostgreSQL)

## Design Principles

- UUID primary keys
- `created_at`/`updated_at` on mutable entities
- Append-only event tables for incidents and enforcement
- Soft delete only where business-critical

## Core Tables

### identity
- `users`
- `wallet_identities`
- `sessions`
- `mfa_factors`

### org/protocol
- `protocols`
- `protocol_wallets`
- `team_members`
- `protocol_endpoints`
- `sla_terms`
- `coverage_pools`

### monitoring/incidents
- `monitor_checks`
- `incident_candidates`
- `incident_evidence`
- `incident_decisions`

### enforcement/payouts
- `enforcement_actions`
- `payout_batches`
- `payout_transfers`

### reputation
- `reputation_scores`
- `reputation_snapshots`

### api product
- `api_clients`
- `api_keys`
- `api_usage_daily`

### audit
- `audit_logs`

## Indexing

Key indexes:
- protocol + time window on monitoring and incidents
- unique active API key hash
- score latest per protocol

## Event Model

Event families:
- `protocol.registered`
- `sla.updated`
- `incident.detected`
- `incident.verified`
- `enforcement.triggered`
- `payout.executed`
- `score.updated`

Read models should be derived, not source-of-truth.
