# HackDetection Intelligent Contract Documentation

## What This Is
HackDetection is a security coordination layer for smart contracts.

It combines on-chain threat signaling with off-chain automation so protocols can detect suspicious behavior early and trigger emergency pause workflows quickly.

## What It Does
- Analyzes suspicious transaction context using:
  - known attack-pattern matching
  - AI validator consensus checks
  - prediction fallback checks
- Assigns a risk score and stores analysis per transaction hash.
- Triggers emergency response when high-risk behavior is detected:
  - pauses the HackDetection contract itself
  - blacklists suspicious sender addresses
  - records security events
  - emits webhook/event signals for bots and dashboards
- Supports cross-protocol protection:
  - register protocols for protection
  - raise pause signals for those protocols
  - expose `should_pause_protocol(protocol)` for protocol-side guards

## Important Limitation (Read This)
HackDetection does **not** automatically halt unrelated protocols by magic.

A protocol only gets effectively paused when one of these is wired:
- its contract checks `should_pause_protocol(address(this))` before sensitive actions, or
- an automation bot listens to signals and calls that protocol's own pause function.

## How It Works End-to-End
1. Admin deploys HackDetection and configures roles/patterns.
2. Protocols are registered via `register_protocol(protocol_address)`.
3. Monitor/relayer feeds suspicious activity into `analyze_transaction(tx_data, tx_hash)`.
4. If threat is confirmed, circuit breaker triggers.
5. HackDetection emits pause signals and marks registered protocols as paused.
6. Integrated protocols enforce halt by reading `should_pause_protocol(address(this))`.
7. Recovery is handled by admin via `unpause()` and `clear_protocol_pause(protocol)` when safe.

## Core Contract Features
- Real-time detection (AI + pattern matching)
- Deep threat analysis and escalation
- Proactive prediction and risk assessment
- Emergency response (circuit breaker, blacklisting, pausing, alerts)
- Multi-admin and role-based permissions
- Notification/event hooks for external automation
- Cross-protocol pause signaling for integrated protocols

## Usage Guide

### 1. Deployment
- Deploy with initial admin.

### 2. Admin Controls
- Add/remove admins: `add_admin`, `remove_admin`
- Set user roles: `set_role(user, role)`

### 3. Pattern Management
- Add attack pattern: `add_attack_pattern(signature, description)`
- Record pattern fetch request: `fetch_patterns_from_source(url)`

### 4. Detection & Response
- Analyze transaction: `analyze_transaction(tx_data, tx_hash)`
- Escalate analysis: `escalate_analysis(tx_hash)`
- Unpause detector: `unpause()`

### 5. Cross-Protocol Protection
- Register protocol: `register_protocol(protocol_address)`
- Unregister protocol: `unregister_protocol(protocol_address)`
- Manual protocol pause signal: `pause_protocol(protocol_address, reason, tx_hash, risk_score)`
- Clear protocol pause signal: `clear_protocol_pause(protocol_address)`
- Guard check: `should_pause_protocol(protocol_address)`
- Detailed status: `get_protocol_pause_status(protocol_address)`

Recommended protocol-side guards:
- `should_pause_protocol(address(this)) == false`
- Optional sender check: `is_address_blacklisted(msg.sender) == false`

## Off-Chain Automation

### Pattern Updater Bot
`pattern_updater.py` fetches candidate attack patterns from feeds, validates them, and can submit approved patterns on-chain.

Feed formats:
- JSON list: `[{"signature":"...","description":"...","confidence":85}]`
- JSON object: `{"patterns":[...]}`
- Text lines: `signature|description|confidence`

Key environment variables:
- `GENLAYER_RPC_URL`
- `GENLAYER_CONTRACT`
- `GENLAYER_FROM`
- `GENLAYER_API_KEY`
- `PATTERN_FEED_URLS`
- `PATTERN_SOURCE_ALLOWLIST`
- `PATTERN_MIN_CONFIDENCE`
- `PATTERN_MAX_PER_RUN`
- `PATTERN_DRY_RUN`
- `PATTERN_SIGNATURE_REGEX`

Example:
```bash
set PATTERN_FEED_URLS=https://example.com/patterns.json,https://example.com/patterns.txt
set GENLAYER_CONTRACT=0xYourContractAddress
set PATTERN_DRY_RUN=1
python pattern_updater.py
```

Continuous mode:
```bash
set PATTERN_SOURCE_ALLOWLIST=example.com,raw.githubusercontent.com
set PATTERN_SIGNATURE_REGEX=^[a-zA-Z0-9_\-:.()/,\s]{6,180}$
set PATTERN_DRY_RUN=0
python pattern_updater.py --interval 600
```

### Bot Supervisor
`bot_supervisor.py` runs `monitor.py` and `pattern_updater.py` together with restart-on-failure.

Environment variables:
- `PATTERN_UPDATER_INTERVAL` (default `600`)
- `SUPERVISOR_RESTART_DELAY` (default `5`)
- `SUPERVISOR_CHECK_INTERVAL` (default `2`)
- `SUPERVISOR_LOG_DIR` (default `logs`)

Start:
```bash
set PATTERN_UPDATER_INTERVAL=600
python bot_supervisor.py
```

Logs:
- `logs/monitor.log`
- `logs/pattern_updater.log`

## Testing
- `test_contract_metadata.py`
- `test_protocol_pause_metadata.py`

## Onboarding Checklist
- Assign admin/security roles
- Register protocols to protect
- Add initial attack patterns
- Integrate protocol-side guard checks
- Run supervisor for continuous monitoring and updates

For more, see GenLayer documentation and the contract source code.
