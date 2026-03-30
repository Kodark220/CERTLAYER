# Bradbury Testnet E2E Test Report

**Date**: June 24, 2026  
**Network**: Bradbury Testnet (chainId 4221)  
**RPC**: https://rpc-bradbury.genlayer.com  
**GenVM version**: v0.2.11-x86_64-linux-release  
**CLI version**: genlayer v0.37.1  
**genlayer-js**: v0.23.1  
**Deployer account**: `0x7ded885a1f6f6c69dd8472b3e66d950396f4024a` (`advocateos`)

---

## Contracts Under Test

| Contract | Address |
|----------|---------|
| CertLayerContract | `0x2Beedb6570e3f15272363462985c89AfC88F6F09` |
| HackDetection | `0x3D91657256bcad522b201eaED2a6C9FEb3208Bd1` |

---

## Test Results Summary

| # | Contract | Method | Type | Args | Result |
|---|----------|--------|------|------|--------|
| 1 | CertLayer | `get_contract_admin()` | read | none | PASS — returned `0x7ded885a1f6f6c69dd8472b3e66d950396f4024a` |
| 2 | CertLayer | `get_protocol_count()` | read | none | PASS — returned `10` |
| 3 | CertLayer | `get_score("proto-test")` | read | str | PASS — returned `0` (empty TreeMap, no comparison needed) |
| 4 | CertLayer | `get_grade("proto-test")` | read | str | PASS — returned `""` (empty TreeMap, no comparison needed) |
| 5 | HackDetection | `get_paused()` | read | none | PASS — returned `true` (contract is currently paused) |
| 6 | HackDetection | `explain_intelligence()` | read | none | PASS — returned correct descriptive text |
| 7 | HackDetection | `get_role("0x7ded...")` | read | Address | **FAIL** — BUG #1 |
| 8 | HackDetection | `get_risk_score("0xabc123")` | read | str | **FAIL** — BUG #2 |
| 9 | CertLayer | `get_protocol_metadata("proto-test")` | read | str | **FAIL** — BUG #2 |
| 10 | CertLayer | `get_protocol_status("proto-test")` | read | str | **FAIL** — BUG #2 |
| 11 | HackDetection | `unpause()` | write | none | **FAIL** — BUG #3 |
| 12 | CertLayer | `register_protocol(...)` | write | str×4 | **FAIL** — BUG #3 |
| 13 | CertLayer | `get_incident_status("inc-test")` | read | str | **FAIL** — BUG #2 |
| 14 | HackDetection | `get_tx_analysis_readable("0xtest123")` | read | str | **FAIL** — BUG #2 |

**Score: 6 PASS / 8 FAIL**

---

## BUG #1: Address double-wrapping in GenVM

**Severity**: High  
**Affected**: Any method with `Address`-typed parameter  
**TEST**: #7 — `get_role("0x7ded885a1f6f6c69dd8472b3e66d950396f4024a")`

### Error
```
File "/contract.py", line 39, in get_role
    return self.roles.get(Address(user), "user")
File "/py/libs/genlayer/py/types.py", line 151, in __init__
    val = bytes(val)
TypeError: 'Address' object cannot be interpreted as an integer
```

### Root Cause
When the CLI passes a hex string like `"0x7ded..."` to a method parameter typed as `Address`, GenVM deserializes it into an `Address` object **before** it reaches the contract code. The contract then tries `Address(user)` which wraps an already-constructed `Address` object, and `Address.__init__` calls `bytes(val)` which fails because `val` is an `Address` object, not raw bytes.

### Location
`/py/libs/genlayer/py/types.py`, line 151 — `Address.__init__` does not handle receiving an existing `Address` instance.

### Suggested Fix
`Address.__init__` should check `isinstance(val, Address)` and short-circuit if the value is already an Address.

---

## BUG #2: CLI passes string arguments as Python `list` type inside GenVM

**Severity**: Critical (blocks ALL methods with args on populated TreeMaps)  
**Affected**: Every read/write method that takes a string argument and does a TreeMap lookup  
**TESTS**: #8, #9, #10, #13, #14

### Error
```
File "/py/libs/genlayer/py/storage/tree_map.py", line 420, in _get_fn
    if k < _Node.key:  # type: ignore
       ^^^^^^^^^^^^^
TypeError: '<' not supported between instances of 'list' and 'str'
```

### Root Cause
When the CLI `--args '["proto-test"]'` is used, GenVM deserializes the argument but delivers it to the contract method as a Python `list` type instead of `str`. When the method uses this `list`-typed value to look up a key in a **populated** `TreeMap[str, ...]`, the tree traversal attempts `k < _Node.key` where `k` is `list` and `_Node.key` is `str`, causing a `TypeError`.

**Why some tests pass**: Methods using empty TreeMaps (e.g., `get_score`, `get_grade`) pass because `_get_fn` returns the default value immediately without traversing any tree nodes — no comparison is attempted.

### Reproduction Steps
```bash
# This PASSES (protocol_score TreeMap is empty, no node comparison):
genlayer call 0x2Beedb6570e3f15272363462985c89AfC88F6F09 get_score --args '["proto-test"]'

# This FAILS (protocol_metadata TreeMap has 10 entries, comparison needed):
genlayer call 0x2Beedb6570e3f15272363462985c89AfC88F6F09 get_protocol_metadata --args '["proto-test"]'
```

### Location
- Deserialization: GenVM argument parsing (`_genlayer_runner.py` line 170-171, `meth2call(contract_instance, *cd.get('args', []))`)
- Crash: `/py/libs/genlayer/py/storage/tree_map.py`, line 420 in `_get_fn`

### Impact
This bug makes **all parameterized methods unusable** once any TreeMap in the contract has data. It blocks:
- All CertLayer read methods: `get_protocol_metadata`, `get_protocol_status`, `get_protocol_owner_wallet`, `get_protocol_contract_address`, `get_incident_status`, `get_incident_decision`, `get_incident_protocol_id`
- All HackDetection read methods: `get_risk_score`, `get_tx_analysis_readable`
- All write methods that check populated TreeMaps (see BUG #3)

---

## BUG #3: Write transactions fail — "Transaction not processed by consensus"

**Severity**: Critical (blocks ALL write operations)  
**Affected**: All write methods  
**TESTS**: #11, #12

### Error
```
Error: Transaction not processed by consensus
    at sendWithEncodedData (genlayer/dist/index.js:51810:15)
    at _sendTransaction (genlayer/dist/index.js:51844:12)
    at WriteAction.write (genlayer/dist/index.js:55083:21)
```

### Root Cause
Write methods fail because validators execute the same contract code and hit BUG #2. For example:
- `unpause()` calls `_require_admin()` → `self.roles.get(sender, "")` which traverses the populated `roles` TreeMap
- `register_protocol(...)` first checks `if protocol_id in self.protocol_metadata` which traverses the populated `protocol_metadata` TreeMap

Since all 5 validators hit the same TreeMap type error, none can produce a valid execution result, and the transaction cannot reach consensus.

### Impact
**No write operations work on either contract.** This means:
- Cannot register new protocols
- Cannot unpause the HackDetection contract (currently stuck in paused state)
- Cannot submit incidents
- Cannot analyze transactions
- Cannot change any contract state

---

## Additional Observations

### HackDetection contract is stuck in paused state
`get_paused()` returns `true`. Since `unpause()` fails due to BUG #3, the contract cannot be unpaused. The `analyze_transaction` method has an explicit pause check (`if self.is_paused: raise Exception("Contract is paused")`), so even if BUGs #2/#3 were fixed, transactions cannot be analyzed until a successful `unpause()` write is executed.

### GenVM runner version warning
Every call produces:
```
runner comment does not start with version, using default
```
This is because the contract uses `# { "Depends": ... }` header format which GenVM treats as v0.1.0 default. Not a bug, but may indicate the Depends comment format should also include version info.

### Deprecation warning (non-blocking)
```
[genlayer-js] initializeConsensusSmartContract() is deprecated and will be removed in a future release.
The consensus contract is now resolved from the static chain definition.
```

---

## Environment Details

```
OS: Windows 11
Node: v22.x
GenLayer CLI: v0.37.1
genlayer-js: v0.23.1
GenVM: v0.2.11-x86_64-linux-release
Network: Bradbury Testnet (chainId 4221)
RPC: https://rpc-bradbury.genlayer.com
Explorer: https://explorer-bradbury.genlayer.com
```

---

## Recommendations

1. **BUG #2 is the highest priority** — it's the root cause of most failures. The GenVM argument deserialization layer needs to unwrap the JSON array properly so that string arguments arrive as Python `str` type, not `list`.

2. **BUG #1 is a separate issue** — `Address.__init__` should be idempotent (handle receiving an existing `Address` instance gracefully).

3. **BUG #3 is a consequence of BUG #2** — once BUG #2 is fixed, write operations should also work again because validators will be able to execute the contract code without type errors.

4. **Consider redeploying contracts** after BUG #2 is fixed to start with fresh state and verify the full lifecycle (register → incident → verification → compensation).
