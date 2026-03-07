# CERTLAYER Monorepo

CERTLAYER is a trustless reliability, compensation, and security coordination platform for web3 infrastructure.

## What CERTLAYER Offers

In one line:
Protocols commit to reliability and security guarantees, CERTLAYER verifies outcomes with independent evidence, then enforces consequences on-chain.

CERTLAYER has two integrated product capabilities:

1. Reliability Enforcement (core)
- monitors protocol uptime and service commitments from multiple independent signals
- manages incident lifecycle (candidate -> challenge -> finalized)
- runs explicit dispute/challenge windows with evidence tracking
- executes compensation/payout operations from coverage logic
- maintains transparent protocol reliability and reputation state

2. HackDetection (integrated)
- analyzes suspicious transactions using attack patterns + AI/consensus-assisted checks
- assigns transaction-level risk scores and stores analysis by tx hash
- triggers emergency controls (circuit-breaker pause, blacklisting, security events)
- supports cross-protocol pause signaling (`register_protocol`, `pause_protocol`, `should_pause_protocol`)
- integrates with off-chain bots for monitoring, alerts, and pattern updates

## Important HackDetection Limitation

HackDetection does **not** automatically halt unrelated protocols by itself.
A protocol is effectively paused only when either:
- that protocol checks `should_pause_protocol(address(this))` before sensitive actions, or
- an automation bot calls that protocol’s own pause function.

Reference:
- `docs/HACK_DETECTION.md`

## Core Contracts

### `contracts/genlayer/certlayer_contract.py`
Primary reliability and enforcement contract for:
- protocol registration + ownership mapping
- incident creation, verification, challenge, finalization
- compensation execution and recovery distribution flows
- commitments tracking and reputation-facing state

### `contracts/genlayer/hack_detection_contract.py`
Integrated security coordination contract for:
- suspicious activity analysis + risk scoring
- security event recording + emergency controls
- admin/security roles and thresholding
- protocol pause signaling and status querying

## Product Surfaces

### Public Reputation Explorer
Public view of protocol reliability posture and incident outcomes.

### Protocol Dashboard (Private)
Protocol-scoped operations for onboarded teams:
- registration + profile controls
- incident and payout lifecycle actions
- commitment and SLA workflows
- security controls exposed by role

### Internal Admin/Security Controls
Admin-only controls for global enforcement and security operations:
- global incident/security orchestration
- emergency response management
- integrated HackDetection operations

### API Portal
Partner-facing reliability and reputation data access.

## High-Level Runtime Flow

1. Protocol is registered and linked to owner/admin identities.
2. Monitoring/security signals produce candidate incidents or threat analyses.
3. Evidence is recorded and verification/challenge phases run.
4. Incident/security status finalizes.
5. Compensation and/or emergency controls execute.
6. Public reliability/reputation state updates for consumers.

## Monorepo Structure

- `frontend/` - Next.js App Router UI (TypeScript), Tailwind + shadcn/ui
- `api/` - Node API service (auth, workflow orchestration, public endpoints)
- `worker/` - background monitoring/automation jobs
- `contracts/genlayer/` - GenLayer intelligent contracts
- `infra/sql/` - DB initialization/migrations
- `docs/` - architecture, product, and contract docs

## Step-by-Step Setup (PowerShell)

### 0) Canonical GenLayer Studio endpoint

Use this exact endpoint in this project:

```env
GENLAYER_RPC_URL=https://studio.genlayer.com/api
GENLAYER_CHAIN=studionet
```

### 1) Install dependencies

From repo root:

```powershell
npm install
```

### 2) Create env files

```powershell
Copy-Item api/.env.example api/.env -Force
Copy-Item frontend/.env.example frontend/.env -Force
if (Test-Path worker/.env.example) { Copy-Item worker/.env.example worker/.env -Force }
```

### 3) Fix GenLayer init missing Studio API (important)

If GenLayer initialization did not set Studio endpoint automatically, set this manually in `api/.env`:

```env
GENLAYER_RPC_URL=https://studio.genlayer.com/api
GENLAYER_CHAIN=studionet
```

### 4) Choose your run mode

Local mode (no on-chain writes, easiest for UI/API flow testing):

```env
GENLAYER_CONTRACT_ADDRESS=
GENLAYER_SECURITY_CONTRACT_ADDRESS=
GENLAYER_SERVER_ACCOUNT=
GENLAYER_SERVER_PRIVATE_KEY=
```

Live mode (writes to GenLayer contracts):

```env
GENLAYER_CONTRACT_ADDRESS=<deployed_certlayer_contract>
GENLAYER_SECURITY_CONTRACT_ADDRESS=<deployed_hack_detection_contract_optional>
GENLAYER_SERVER_PRIVATE_KEY=<0x...private_key_for_signing>
GENLAYER_SERVER_ACCOUNT=<0x...derived_from_private_key>
```

Optional internal access (useful for quick API testing without wallet session):

```env
API_KEY=<your_secret_key>
ADMIN_WALLETS=0xAdminWallet1,0xAdminWallet2
```

### 5) Frontend env wiring

Set in `frontend/.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_CONTRACT_ADDRESS=<same_as_GENLAYER_CONTRACT_ADDRESS_or_blank_for_local>
NEXT_PUBLIC_API_KEY=<same_API_KEY_if_you_set_one>
NEXT_PUBLIC_SHOW_INTERNAL_CONTROLS=false
```

### 6) Run services

Use separate terminals:

```powershell
npm run dev:api
npm run dev:frontend
npm run dev:worker
```

## Try Out CERTLAYER Functions (API)

Set base values in PowerShell:

```powershell
$BASE = "http://localhost:8080"
$APIKEY = "<your_api_key_if_set>"
$H = @{ "content-type"="application/json" }
if ($APIKEY) { $H["x-api-key"] = $APIKEY }
```

### 1) Health check

```powershell
Invoke-RestMethod "$BASE/health"
```

Check:
- `live_mode`
- `security_live_mode`
- `genlayer_contract`
- `genlayer_security_contract`

### 2) Register a protocol

```powershell
Invoke-RestMethod -Method POST "$BASE/v1/protocols/register" -Headers $H -Body (@{
  id = "proto-demo-001"
  name = "Demo Protocol"
  website = "https://demo.protocol"
  protocolType = "rpc"
  uptimeBps = 9990
  ownerWallet = "0x1111111111111111111111111111111111111111"
} | ConvertTo-Json)
```

### 3) Fund pool

```powershell
Invoke-RestMethod -Method POST "$BASE/v1/pools/deposit" -Headers $H -Body (@{
  protocolId = "proto-demo-001"
  amount = 1000
} | ConvertTo-Json)
```

### 4) Run incident lifecycle (reliability flow)

Create incident:

```powershell
Invoke-RestMethod -Method POST "$BASE/v1/incidents/create-lifecycle" -Headers $H -Body (@{
  protocolId = "proto-demo-001"
  incidentId = "inc-demo-001"
  startTs = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  evidenceHash = "evidence-hash-001"
} | ConvertTo-Json)
```

Attach affected users:

```powershell
Invoke-RestMethod -Method POST "$BASE/v1/incidents/affected-users" -Headers $H -Body (@{
  protocolId = "proto-demo-001"
  incidentId = "inc-demo-001"
  walletsCsv = "0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222"
  amountsCsv = "50,75"
} | ConvertTo-Json)
```

Open challenge window:

```powershell
$challengeEnd = [DateTimeOffset]::UtcNow.AddHours(1).ToUnixTimeSeconds()
Invoke-RestMethod -Method POST "$BASE/v1/incidents/challenge/open" -Headers $H -Body (@{
  protocolId = "proto-demo-001"
  incidentId = "inc-demo-001"
  challengeEndsTs = $challengeEnd
} | ConvertTo-Json)
```

### 5) Public explorer data

```powershell
Invoke-RestMethod "$BASE/v1/public/reputation"
```

### 6) HackDetection quick checks (if `GENLAYER_SECURITY_CONTRACT_ADDRESS` is set)

Analyze suspicious tx:

```powershell
Invoke-RestMethod -Method POST "$BASE/v1/security/analyze" -Headers $H -Body (@{
  txData = "suspicious payload example"
  txHash = "0xabc123demo"
} | ConvertTo-Json)
```

Check risk score:

```powershell
Invoke-RestMethod "$BASE/v1/security/risk-score?txHash=0xabc123demo" -Headers (@{ "x-api-key" = $APIKEY })
```

## Try Out CERTLAYER Functions (Frontend)

1. Open `http://localhost:3000`.
2. Go to `/signin` and connect wallet.
3. Go to `/dashboard`.
4. Register protocol and fund pool.
5. If your wallet is in `ADMIN_WALLETS`, you can access:
- Incident Lifecycle
- Commitments
- Security Response
6. Open `/explorer` to view public reputation listing.

## Common Setup Issues

### Issue: GenLayer init did not bring Studio API
Fix:
- set `GENLAYER_RPC_URL=https://studio.genlayer.com/api`
- set `GENLAYER_CHAIN=studionet`
- restart API service

### Issue: `401 unauthorized` on POST endpoints
Fix one:
- provide wallet session token (`Authorization: Bearer <token>`)
Fix two:
- set `API_KEY` in `api/.env` and send header `x-api-key`

### Issue: live writes fail
Check:
- `GENLAYER_CONTRACT_ADDRESS` is correct
- `GENLAYER_SERVER_PRIVATE_KEY` is set
- `GENLAYER_SERVER_ACCOUNT` matches private key derived address
- health endpoint shows `has_server_private_key: true`

## Guiding Principle

CERTLAYER does not trust single-source claims.
It relies on corroborated evidence, explicit challenge windows, and transparent state transitions for both reliability enforcement and hack-response coordination.
