# GenLayer Contract Blueprint

## Contract Set

1. `RegistryContract`
- protocol registration
- wallet authorization
- SLA versioning + notice period
- protocol status lifecycle

2. `MonitoringDecisionContract`
- incident attestations
- evidence commitments
- verification decisions

3. `CoveragePoolContract`
- pool deposits/withdrawals under policy constraints
- compensation execution
- enforcement accounting

4. `ReputationContract`
- deterministic score aggregation from on-chain events
- score snapshots
- public read interfaces

## Minimal V1 Interface

### Registry
- `register_protocol(...)`
- `add_authorized_wallet(...)`
- `schedule_sla_update(...)`
- `activate_sla_update(...)`
- `get_protocol(protocol_id)`

### Monitoring
- `submit_incident_candidate(...)`
- `submit_verification_decision(...)`
- `get_incident(incident_id)`

### Coverage
- `deposit(protocol_id, amount)`
- `execute_compensation(incident_id, recipients[], amounts[])`
- `get_pool_state(protocol_id)`

### Reputation
- `recompute_score(protocol_id)`
- `get_score(protocol_id)`
- `get_score_history(protocol_id)`

## Trust Requirements

- Decision inputs must include source references and evidence hash.
- Replay and duplicate enforcement must be prevented by incident idempotency checks.
- Coverage underflow must hard-fail enforcement and mark protocol as underfunded.
