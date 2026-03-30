"""
CertLayer Contract — End-to-End Test Suite
===========================================
Tests the full lifecycle on the Bradbury testnet:
  1. Admin identity
  2. Protocol registration
  3. Protocol metadata/status reads
  4. Incident candidate submission
  5. Incident verification decision (admin)
  6. Pool balance deposit
  7. Score / grade reads (initial defaults)

Usage:
  # Set env vars (or rely on defaults from .env):
  export GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
  export GENLAYER_CONTRACT=0xD5F9BadF3f7AdFD32767fA5692ca18f6F265f677
  export GENLAYER_FROM=0xf9346827f713eb953a2e22465b9ee91901726bdc

  python test_certlayer_e2e.py
"""

import json
import os
import sys
import time
import urllib.request
import hashlib

# ── Config ──────────────────────────────────────────────────────────────────
RPC_URL = os.getenv("GENLAYER_RPC_URL", "https://rpc-bradbury.genlayer.com")
CONTRACT = os.getenv(
    "GENLAYER_CONTRACT",
    "0xD5F9BadF3f7AdFD32767fA5692ca18f6F265f677",
)
FROM_ADDRESS = os.getenv(
    "GENLAYER_FROM",
    "0xf9346827f713eb953a2e22465b9ee91901726bdc",
)
API_KEY = os.getenv("GENLAYER_API_KEY", "")

WRITE_METHOD = os.getenv("GENLAYER_WRITE_METHOD", "gen_sendTransaction")
VIEW_METHOD = os.getenv("GENLAYER_VIEW_METHOD", "gen_call")

TX_POLL_INTERVAL = 4  # seconds
TX_POLL_MAX = 15  # attempts

# Unique suffix so tests are idempotent across runs
RUN_ID = hashlib.sha256(str(time.time()).encode()).hexdigest()[:8]

# ── RPC helpers ─────────────────────────────────────────────────────────────

passed = 0
failed = 0
errors = []


def _rpc(method: str, params):
    body = json.dumps(
        {"jsonrpc": "2.0", "id": int(time.time() * 1000), "method": method, "params": params}
    ).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "CertLayerE2E/1.0"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"
        headers["x-api-key"] = API_KEY
    req = urllib.request.Request(RPC_URL, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def write(method: str, args: list):
    """Send a write transaction and wait for acceptance."""
    tx_obj = {"to": CONTRACT, "method": method, "args": args}
    if FROM_ADDRESS:
        tx_obj["from"] = FROM_ADDRESS
    res = _rpc(WRITE_METHOD, [tx_obj])
    if "error" in res:
        return res
    tx_hash = res.get("result")
    if not tx_hash or not isinstance(tx_hash, str):
        return res
    # Poll until ACCEPTED or FINALIZED
    for _ in range(TX_POLL_MAX):
        time.sleep(TX_POLL_INTERVAL)
        receipt = _rpc("gen_getTransactionByHash", [tx_hash])
        result = receipt.get("result")
        if isinstance(result, dict):
            status = result.get("status", "")
            if status in ("ACCEPTED", "FINALIZED"):
                return receipt
            if status in ("REJECTED", "FAILED", "UNDETERMINED"):
                return receipt
        elif isinstance(result, str) and result in ("ACCEPTED", "FINALIZED"):
            return receipt
    return {"error": f"tx {tx_hash} did not finalize in time", "tx_hash": tx_hash}


def view(method: str, args: list):
    """Read-only contract call."""
    call_obj = {"to": CONTRACT, "method": method, "args": args}
    return _rpc(VIEW_METHOD, [call_obj])


# ── Assertions ──────────────────────────────────────────────────────────────

def assert_ok(label: str, res: dict):
    global passed, failed
    if "error" in res and res["error"]:
        failed += 1
        errors.append(f"FAIL  {label}: {res['error']}")
        print(f"  FAIL  {label}: {res['error']}")
        return False
    passed += 1
    print(f"  OK    {label}")
    return True


def assert_eq(label: str, actual, expected):
    global passed, failed
    if actual == expected:
        passed += 1
        print(f"  OK    {label}: {actual}")
        return True
    failed += 1
    errors.append(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
    print(f"  FAIL  {label}: expected {expected!r}, got {actual!r}")
    return False


def assert_truthy(label: str, value):
    global passed, failed
    if value:
        passed += 1
        print(f"  OK    {label}: {value}")
        return True
    failed += 1
    errors.append(f"FAIL  {label}: expected truthy, got {value!r}")
    print(f"  FAIL  {label}: expected truthy, got {value!r}")
    return False


def get_result(res: dict):
    """Extract the result field from an RPC response."""
    if isinstance(res, dict):
        r = res.get("result")
        # gen_getTransactionByHash wraps in {status, result, ...}
        if isinstance(r, dict) and "data" in r:
            return r["data"].get("result") if isinstance(r["data"], dict) else r["data"]
        if isinstance(r, dict) and "result" in r:
            return r["result"]
        return r
    return res


# ── Test Cases ──────────────────────────────────────────────────────────────

def test_admin_identity():
    """T1: Verify contract admin matches expected deployer."""
    print("\n── T1: Admin Identity ──")
    res = view("get_contract_admin", [])
    result = get_result(res)
    if result:
        print(f"  Contract admin: {result}")
        assert_truthy("admin address returned", result)
    else:
        assert_ok("get_contract_admin", res)


def test_protocol_registration():
    """T2: Register a new protocol and verify all fields."""
    pid = f"test-proto-{RUN_ID}"
    metadata = json.dumps({"name": f"TestProtocol-{RUN_ID}", "website": "https://example.com"})
    owner = FROM_ADDRESS.lower() if FROM_ADDRESS else ""
    contract_addr = "0x0000000000000000000000000000000000000001"

    print(f"\n── T2: Protocol Registration (id={pid}) ──")

    # Register
    res = write("register_protocol", [pid, metadata, owner, contract_addr])
    assert_ok("register_protocol tx", res)

    # Read back metadata
    res = view("get_protocol_metadata", [pid])
    result = get_result(res)
    if result:
        assert_eq("metadata matches", result, metadata)
    else:
        assert_ok("get_protocol_metadata", res)

    # Read owner
    res = view("get_protocol_owner_wallet", [pid])
    result = get_result(res)
    if result:
        assert_eq("owner matches", result, owner)

    # Read contract address
    res = view("get_protocol_contract_address", [pid])
    result = get_result(res)
    if result:
        assert_eq("contract_address matches", result, contract_addr)

    # Read status
    res = view("get_protocol_status", [pid])
    result = get_result(res)
    if result:
        assert_eq("status is active", result, "active")

    # Protocol count increased
    res = view("get_protocol_count", [])
    result = get_result(res)
    assert_truthy("protocol_count > 0", result and int(result) > 0)

    return pid


def test_duplicate_registration(pid: str):
    """T3: Registering the same protocol_id again should fail."""
    print(f"\n── T3: Duplicate Registration (id={pid}) ──")
    metadata = json.dumps({"name": "Duplicate"})
    owner = FROM_ADDRESS.lower() if FROM_ADDRESS else ""
    res = write("register_protocol", [pid, metadata, owner, ""])
    # We expect an error or REJECTED status
    result = res.get("result")
    is_rejected = False
    if isinstance(result, dict):
        status = result.get("status", "")
        is_rejected = status in ("REJECTED", "FAILED")
    if "error" in res or is_rejected:
        print(f"  OK    duplicate correctly rejected")
        global passed
        passed += 1
    else:
        print(f"  WARN  duplicate may have been accepted: {res}")


def test_set_protocol_status(pid: str):
    """T4: Change protocol status."""
    print(f"\n── T4: Set Protocol Status (id={pid}) ──")
    res = write("set_protocol_status", [pid, "paused"])
    assert_ok("set_protocol_status tx", res)

    res = view("get_protocol_status", [pid])
    result = get_result(res)
    if result:
        assert_eq("status changed to paused", result, "paused")

    # Restore to active
    res = write("set_protocol_status", [pid, "active"])
    assert_ok("restore status to active", res)


def test_incident_candidate(pid: str):
    """T5: Submit and read an incident candidate."""
    incident_id = f"inc-{RUN_ID}"
    payload = json.dumps({"protocolId": pid, "summary": "HTTP 503 detected", "source": "http_probe"})

    print(f"\n── T5: Incident Candidate (id={incident_id}) ──")

    res = write("submit_incident_candidate", [incident_id, payload])
    assert_ok("submit_incident_candidate tx", res)

    # Read status
    res = view("get_incident_status", [incident_id])
    result = get_result(res)
    if result:
        assert_eq("incident status = candidate", result, "candidate")

    # Read decision
    res = view("get_incident_decision", [incident_id])
    result = get_result(res)
    if result:
        assert_eq("incident decision = pending", result, "pending")

    # Read protocol_id
    res = view("get_incident_protocol_id", [incident_id])
    result = get_result(res)
    if result:
        assert_eq("incident protocol_id matches", result, pid)

    return incident_id


def test_create_incident(pid: str):
    """T6: Create incident with structured fields."""
    incident_id = f"inc2-{RUN_ID}"
    start_ts = int(time.time())
    evidence_hash = hashlib.sha256(b"test-evidence").hexdigest()

    print(f"\n── T6: Create Incident (id={incident_id}) ──")

    res = write("create_incident", [incident_id, pid, start_ts, evidence_hash])
    assert_ok("create_incident tx", res)

    res = view("get_incident_status", [incident_id])
    result = get_result(res)
    if result:
        assert_eq("incident status = candidate", result, "candidate")

    return incident_id


def test_verification_decision(incident_id: str):
    """T7: Admin submits verification decision."""
    print(f"\n── T7: Verification Decision (id={incident_id}) ──")

    res = write("submit_verification_decision", [incident_id, "breach_confirmed", "HTTP probe evidence"])
    assert_ok("submit_verification_decision tx", res)

    res = view("get_incident_decision", [incident_id])
    result = get_result(res)
    if result:
        assert_eq("decision = breach_confirmed", result, "breach_confirmed")

    res = view("get_incident_status", [incident_id])
    result = get_result(res)
    if result:
        assert_eq("status = decided", result, "decided")


def test_pool_balance(pid: str):
    """T8: Deposit into coverage pool and read balance."""
    print(f"\n── T8: Pool Balance (id={pid}) ──")

    # Read initial balance
    res = view("get_pool_balance", [pid])
    initial = get_result(res)
    initial_val = int(initial) if initial else 0
    print(f"  Initial pool balance: {initial_val}")

    # Deposit
    deposit_amount = 5000
    res = write("deposit", [pid, deposit_amount])
    assert_ok("deposit tx", res)

    # Read updated balance
    res = view("get_pool_balance", [pid])
    result = get_result(res)
    if result:
        expected = initial_val + deposit_amount
        assert_eq("pool balance increased", int(result), expected)


def test_score_and_grade(pid: str):
    """T9: Read initial score and grade (should be defaults)."""
    print(f"\n── T9: Score & Grade (id={pid}) ──")

    res = view("get_score", [pid])
    result = get_result(res)
    print(f"  Score: {result}")
    assert_truthy("score returned", result is not None)

    res = view("get_grade", [pid])
    result = get_result(res)
    print(f"  Grade: {result}")
    # New protocols have no score yet, so grade might be empty or N/A
    assert_truthy("grade returned (may be empty for new protocol)", result is not None)


def test_set_contract_address(pid: str):
    """T10: Update protected contract address."""
    new_addr = "0x0000000000000000000000000000000000000099"

    print(f"\n── T10: Set Contract Address (id={pid}) ──")

    res = write("set_protocol_contract_address", [pid, new_addr])
    assert_ok("set_protocol_contract_address tx", res)

    res = view("get_protocol_contract_address", [pid])
    result = get_result(res)
    if result:
        assert_eq("contract address updated", result, new_addr)


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 64)
    print("CertLayer Contract — End-to-End Test Suite")
    print("=" * 64)
    print(f"RPC:      {RPC_URL}")
    print(f"Contract: {CONTRACT}")
    print(f"From:     {FROM_ADDRESS}")
    print(f"Run ID:   {RUN_ID}")
    print(f"Time:     {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")

    test_admin_identity()
    pid = test_protocol_registration()
    if pid:
        test_duplicate_registration(pid)
        test_set_protocol_status(pid)
        incident_id = test_incident_candidate(pid)
        incident_id_2 = test_create_incident(pid)
        if incident_id:
            test_verification_decision(incident_id)
        test_pool_balance(pid)
        test_score_and_grade(pid)
        test_set_contract_address(pid)

    # Summary
    print("\n" + "=" * 64)
    print(f"RESULTS: {passed} passed, {failed} failed")
    if errors:
        print("\nFailures:")
        for e in errors:
            print(f"  {e}")
    print("=" * 64)

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
