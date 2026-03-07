# GenLayer Contracts in CERTLAYER

This repo currently uses two primary GenLayer contracts that together implement CERTLAYER’s offering:

1. `contracts/genlayer/certlayer_contract.py` (reliability + compensation + reputation + commitments)
2. `contracts/genlayer/hack_detection_contract.py` (security detection + emergency controls + pause signaling)

## 1) CERTLAYER Contract (`certlayer_contract.py`)

Primary scope:
- protocol registration and owner mapping
- incident creation, verification, challenge, and finalization
- payout execution and recovery distribution
- commitment tracking and compliance status
- pool accounting and reputation scoring interfaces

Representative write methods:
- `register_protocol(...)`
- `set_protocol_status(...)`
- `submit_incident_candidate(...)`
- `submit_verification_decision(...)`
- `create_incident(...)`
- `create_security_incident(...)`
- `attach_affected_users(...)`
- `open_challenge_window(...)`
- `finalize_incident(...)`
- `execute_payout_batch(...)`
- `register_commitment(...)`
- `evaluate_commitment(...)`
- `finalize_commitment(...)`
- `deposit(...)`
- `execute_compensation(...)`
- `recompute_score(...)`

Representative read methods:
- `get_protocol_metadata(...)`
- `get_protocol_owner_wallet(...)`
- `get_protocol_status(...)`
- `get_incident_status(...)`
- `get_incident_type(...)`
- `get_incident_total_amount(...)`
- `get_pool_balance(...)`
- `get_score(...)`
- `get_grade(...)`

## 2) HackDetection Contract (`hack_detection_contract.py`)

Primary scope:
- suspicious transaction analysis
- risk scoring and threat escalation
- emergency pause/circuit-breaker behavior
- blacklisting and security event history
- protocol pause signaling for integrated contracts

Representative write methods:
- `analyze_transaction(...)`
- `escalate_analysis(...)`
- `add_attack_pattern(...)`
- `fetch_patterns_from_source(...)`
- `set_thresholds(...)`
- `register_protocol(...)`
- `pause_protocol(...)`
- `clear_protocol_pause(...)`
- `unpause(...)`

Representative admin/role methods:
- `add_admin(...)`
- `remove_admin(...)`
- `set_role(...)`
- `get_role(...)`

Representative read methods:
- `should_pause_protocol(...)`
- `get_protocol_pause_status(...)`
- `get_risk_score(...)`
- `get_tx_analysis(...)`
- `is_address_blacklisted(...)`
- `get_security_events(...)`

## Integration Model

CERTLAYER treats HackDetection as an integrated capability, not a separate product:

- reliability incidents and security incidents both feed protocol trust posture
- emergency pause signals can be consumed by protocol guard checks
- admin/security operators use role-gated controls to manage incidents and threat response
- public consumers see reputation/reliability outcomes without internal control surfaces

## Important Constraint

HackDetection pause signaling is advisory unless integrated:

- protocol contract must check `should_pause_protocol(address(this))`, or
- automation must call the protocol’s own pause function.

Without one of these, protocol execution will not stop automatically.

## Trust Requirements

- multi-source evidence for incident/security decisions
- idempotent incident handling to prevent duplicate enforcement
- explicit challenge/dispute windows before final payout paths
- hard-fail enforcement when pool/accounting constraints are not met
