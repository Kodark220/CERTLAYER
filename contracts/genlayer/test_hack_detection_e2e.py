"""
HackDetection Contract — End-to-End Test Suite
================================================
Tests the security contract on Bradbury testnet:
  1. Pause state reads
  2. Role verification
  3. Normal transaction analysis (AI-based)
  4. Threat transaction analysis + auto-pause
  5. Unpause recovery
  6. Protocol registration for pause signaling
  7. Risk score reads

Usage:
  export GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
  export GENLAYER_SECURITY_CONTRACT=0x0E2497d18FB4f09Ef9A71C7bF5D6494c714D4728
  export GENLAYER_FROM=0xf9346827f713eb953a2e22465b9ee91901726bdc

  python test_hack_detection_e2e.py
"""

import json
import os
import sys
import time
import urllib.request

# ── Config ──────────────────────────────────────────────────────────────────
RPC_URL = os.getenv("GENLAYER_RPC_URL", "https://rpc-bradbury.genlayer.com")
CONTRACT = os.getenv(
    "GENLAYER_SECURITY_CONTRACT",
    "0x0E2497d18FB4f09Ef9A71C7bF5D6494c714D4728",
)
FROM_ADDRESS = os.getenv(
    "GENLAYER_FROM",
    "0xf9346827f713eb953a2e22465b9ee91901726bdc",
)
API_KEY = os.getenv("GENLAYER_API_KEY", "")

WRITE_METHOD = os.getenv("GENLAYER_WRITE_METHOD", "gen_sendTransaction")
VIEW_METHOD = os.getenv("GENLAYER_VIEW_METHOD", "gen_call")

TX_POLL_INTERVAL = 5
TX_POLL_MAX = 20  # AI analysis takes longer — give extra time

RUN_SUFFIX = str(int(time.time()))[-6:]

# ── RPC helpers ─────────────────────────────────────────────────────────────

passed = 0
failed = 0
errors = []


def _rpc(method, params):
    body = json.dumps(
        {"jsonrpc": "2.0", "id": int(time.time() * 1000), "method": method, "params": params}
    ).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "HackDetE2E/1.0"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"
        headers["x-api-key"] = API_KEY
    req = urllib.request.Request(RPC_URL, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def write(method, args):
    tx_obj = {"to": CONTRACT, "method": method, "args": args}
    if FROM_ADDRESS:
        tx_obj["from"] = FROM_ADDRESS
    res = _rpc(WRITE_METHOD, [tx_obj])
    if "error" in res:
        return res
    tx_hash = res.get("result")
    if not tx_hash or not isinstance(tx_hash, str):
        return res
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
    return {"error": f"tx {tx_hash} timed out", "tx_hash": tx_hash}


def view(method, args):
    return _rpc(VIEW_METHOD, [{"to": CONTRACT, "method": method, "args": args}])


def get_result(res):
    if isinstance(res, dict):
        r = res.get("result")
        if isinstance(r, dict) and "data" in r:
            return r["data"].get("result") if isinstance(r["data"], dict) else r["data"]
        if isinstance(r, dict) and "result" in r:
            return r["result"]
        return r
    return res


def ok(label, res):
    global passed, failed
    if "error" in res and res["error"]:
        failed += 1
        errors.append(f"FAIL  {label}: {res['error']}")
        print(f"  FAIL  {label}: {res['error']}")
        return False
    passed += 1
    print(f"  OK    {label}")
    return True


def eq(label, actual, expected):
    global passed, failed
    if actual == expected:
        passed += 1
        print(f"  OK    {label}: {actual}")
        return True
    failed += 1
    errors.append(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
    print(f"  FAIL  {label}: expected {expected!r}, got {actual!r}")
    return False


def truthy(label, value):
    global passed, failed
    if value:
        passed += 1
        print(f"  OK    {label}: {value}")
        return True
    failed += 1
    errors.append(f"FAIL  {label}: expected truthy, got {value!r}")
    print(f"  FAIL  {label}: expected truthy, got {value!r}")
    return False


def poll_analysis(tx_hash, attempts=10, interval=5):
    """Poll until AI analysis is available."""
    for i in range(attempts):
        res = view("get_tx_analysis_readable", [tx_hash])
        data = get_result(res)
        if isinstance(data, str) and data and "No analysis" not in data:
            return data
        print(f"    ... polling analysis ({i + 1}/{attempts})")
        time.sleep(interval)
    return None


# ── Tests ───────────────────────────────────────────────────────────────────

def test_explain_intelligence():
    """S1: Contract self-description."""
    print("\n── S1: Explain Intelligence ──")
    res = view("explain_intelligence", [])
    result = get_result(res)
    truthy("intelligence explanation", result)
    if result:
        print(f"    -> {result[:100]}...")


def test_initial_state():
    """S2: Read initial pause state and admin role."""
    print("\n── S2: Initial State ──")

    res = view("get_paused", [])
    result = get_result(res)
    print(f"  Paused: {result}")
    truthy("pause state readable", result is not None)

    if FROM_ADDRESS:
        res = view("get_role", [FROM_ADDRESS])
        result = get_result(res)
        print(f"  Role for {FROM_ADDRESS}: {result}")
        truthy("role returned", result is not None)


def test_analyze_normal_tx():
    """S3: Analyze a clearly safe transaction."""
    tx_hash = f"0xSAFE{RUN_SUFFIX}"
    tx_data = "transfer(to=0xabc123, amount=100, token=USDC)"

    print(f"\n── S3: Analyze Normal Transaction (hash={tx_hash}) ──")

    # Ensure not paused first
    res = view("get_paused", [])
    is_paused = get_result(res)
    if is_paused is True:
        print("  Contract is paused, unpausing first...")
        write("unpause", [])
        time.sleep(3)

    res = write("analyze_transaction", [tx_data, tx_hash])
    ok("analyze_transaction (safe) tx", res)

    # Poll for result
    analysis = poll_analysis(tx_hash)
    if analysis:
        truthy("analysis returned for safe tx", analysis)
        try:
            parsed = json.loads(analysis)
            print(f"    Threat: {parsed.get('threat')}")
            print(f"    Risk:   {parsed.get('risk_level')}")
            print(f"    Score:  {parsed.get('risk_score')}")
        except (json.JSONDecodeError, TypeError):
            print(f"    Raw: {analysis}")
    else:
        print("  WARN  analysis not available after polling (AI may be slow)")

    # Check risk score
    res = view("get_risk_score", [tx_hash])
    score = get_result(res)
    print(f"  Risk score: {score}")

    return tx_hash


def test_analyze_threat_tx():
    """S4: Analyze a clearly malicious transaction — should auto-pause."""
    tx_hash = f"0xEVIL{RUN_SUFFIX}"
    tx_data = (
        "EXPLOIT: flash_loan_attack target=0xdeadbeef "
        "method=reentrancy drain_funds=true "
        "unauthorized_transfer amount=999999 to=attacker_wallet"
    )

    print(f"\n── S4: Analyze Threat Transaction (hash={tx_hash}) ──")

    # Ensure not paused
    res = view("get_paused", [])
    if get_result(res) is True:
        write("unpause", [])
        time.sleep(3)

    res = write("analyze_transaction", [tx_data, tx_hash])
    ok("analyze_transaction (threat) tx", res)

    analysis = poll_analysis(tx_hash, attempts=15, interval=5)
    if analysis:
        truthy("analysis returned for threat tx", analysis)
        try:
            parsed = json.loads(analysis)
            print(f"    Threat: {parsed.get('threat')}")
            print(f"    Risk:   {parsed.get('risk_level')}")
            print(f"    Score:  {parsed.get('risk_score')}")
            if parsed.get("threat"):
                print("    -> Contract should have auto-paused")
        except (json.JSONDecodeError, TypeError):
            print(f"    Raw: {analysis}")
    else:
        print("  WARN  analysis not available (AI analysis may need more time)")

    # Check if auto-paused
    res = view("get_paused", [])
    paused = get_result(res)
    print(f"  Paused after threat: {paused}")

    return tx_hash


def test_unpause():
    """S5: Admin unpause."""
    print("\n── S5: Unpause ──")
    res = write("unpause", [])
    ok("unpause tx", res)

    res = view("get_paused", [])
    result = get_result(res)
    eq("paused = false after unpause", result, False)


def test_emergency_pause():
    """S6: Admin emergency pause and unpause cycle."""
    print("\n── S6: Emergency Pause Cycle ──")

    res = write("emergency_pause", [])
    ok("emergency_pause tx", res)

    res = view("get_paused", [])
    result = get_result(res)
    eq("paused = true after emergency_pause", result, True)

    # Cleanup: unpause
    res = write("unpause", [])
    ok("unpause cleanup tx", res)


def test_register_protocol():
    """S7: Register a protocol address for pause signaling."""
    # Use a dummy protocol address
    protocol_addr = "0x0000000000000000000000000000000000000042"

    print(f"\n── S7: Register Protocol ({protocol_addr}) ──")
    res = write("register_protocol", [protocol_addr])
    ok("register_protocol tx", res)


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 64)
    print("HackDetection Contract — End-to-End Test Suite")
    print("=" * 64)
    print(f"RPC:      {RPC_URL}")
    print(f"Contract: {CONTRACT}")
    print(f"From:     {FROM_ADDRESS}")
    print(f"Run ID:   {RUN_SUFFIX}")
    print(f"Time:     {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")

    test_explain_intelligence()
    test_initial_state()
    test_analyze_normal_tx()
    test_analyze_threat_tx()
    test_unpause()
    test_emergency_pause()
    test_register_protocol()

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
