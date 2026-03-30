/**
 * CertLayer + HackDetection — End-to-End JS Test
 * ================================================
 * Uses genlayer-js SDK to test both contracts via signed transactions.
 *
 * Usage:
 *   cd contracts/genlayer
 *   npm install genlayer-js
 *   GENLAYER_PRIVATE_KEY=0x... node test_e2e.mjs
 */

import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { createHash } from "node:crypto";

// ── Config ──────────────────────────────────────────────────
const RPC_URL = process.env.GENLAYER_RPC_URL || "https://rpc-bradbury.genlayer.com";
const CERTLAYER_ADDRESS =
  process.env.GENLAYER_CONTRACT || "0xD5F9BadF3f7AdFD32767fA5692ca18f6F265f677";
const HACKDET_ADDRESS =
  process.env.GENLAYER_SECURITY_CONTRACT || "0x0E2497d18FB4f09Ef9A71C7bF5D6494c714D4728";
const PRIVATE_KEY = process.env.GENLAYER_PRIVATE_KEY || "";

if (!PRIVATE_KEY) {
  console.error("ERROR: Set GENLAYER_PRIVATE_KEY env var (0x + 64 hex chars)");
  process.exit(1);
}

const RUN_ID = createHash("sha256")
  .update(String(Date.now()))
  .digest("hex")
  .slice(0, 8);

// ── Client Setup ────────────────────────────────────────────
const account = createAccount(PRIVATE_KEY);
const client = createClient({
  chain: testnetBradbury,
  endpoint: RPC_URL,
  account,
});



let passed = 0;
let failed = 0;
const errors = [];

function ok(label) {
  passed++;
  console.log(`  OK    ${label}`);
}

function fail(label, reason) {
  failed++;
  errors.push(`FAIL  ${label}: ${reason}`);
  console.log(`  FAIL  ${label}: ${reason}`);
}

function eq(label, actual, expected) {
  if (actual === expected) {
    ok(`${label}: ${actual}`);
  } else {
    fail(label, `expected ${expected}, got ${actual}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function writeTx(address, functionName, args, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const hash = await client.writeContract({
        address,
        functionName,
        args,
        value: 0n,
      });
      console.log(`    tx hash: ${hash}`);
      const receipt = await client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.ACCEPTED,
        retries: 50,
        interval: 5000,
      });
      console.log(`    status: ${receipt.status}`);
      return receipt;
    } catch (e) {
      const msg = e.message || "";
      const isRetryable = msg.includes("nonce") || msg.includes("already known");
      if (isRetryable && attempt < maxRetries) {
        console.log(`    retry ${attempt}/${maxRetries}...`);
        await sleep(5000);
        continue;
      }
      throw e;
    }
  }
}

async function readTx(address, functionName, args) {
  return client.readContract({
    address,
    functionName,
    args,
  });
}

// ── CertLayer Tests ─────────────────────────────────────────

async function testCertLayerAdmin() {
  console.log("\n── C1: CertLayer Admin ──");
  try {
    const admin = await readTx(CERTLAYER_ADDRESS, "get_contract_admin", []);
    console.log(`  Admin: ${admin}`);
    if (admin) ok("admin address returned");
    else fail("admin", "empty result");
  } catch (e) {
    fail("get_contract_admin", e.message);
  }
}

async function testCertLayerRegistration() {
  const pid = `js-proto-${RUN_ID}`;
  const meta = JSON.stringify({ name: `JSTest-${RUN_ID}`, website: "https://example.com" });
  const owner = account.address.toLowerCase();

  console.log(`\n── C2: Register Protocol (${pid}) ──`);
  try {
    await writeTx(CERTLAYER_ADDRESS, "register_protocol", [pid, meta, owner, ""]);
    ok("register_protocol");
  } catch (e) {
    fail("register_protocol", e.message);
    return null;
  }

  try {
    const status = await readTx(CERTLAYER_ADDRESS, "get_protocol_status", [pid]);
    eq("status", status, "active");
  } catch (e) {
    fail("get_protocol_status", e.message);
  }

  try {
    const metadata = await readTx(CERTLAYER_ADDRESS, "get_protocol_metadata", [pid]);
    eq("metadata matches", metadata, meta);
  } catch (e) {
    fail("get_protocol_metadata", e.message);
  }

  try {
    const count = await readTx(CERTLAYER_ADDRESS, "get_protocol_count", []);
    console.log(`  Protocol count: ${count}`);
    if (Number(count) > 0) ok("count > 0");
    else fail("count", "expected > 0");
  } catch (e) {
    fail("get_protocol_count", e.message);
  }

  return pid;
}

async function testCertLayerIncident(pid) {
  const incidentId = `js-inc-${RUN_ID}`;
  const payload = JSON.stringify({
    protocolId: pid,
    summary: "JS test incident",
    source: "e2e_test",
  });

  console.log(`\n── C3: Incident Lifecycle (${incidentId}) ──`);

  try {
    await writeTx(CERTLAYER_ADDRESS, "submit_incident_candidate", [incidentId, payload]);
    ok("submit_incident_candidate");
  } catch (e) {
    fail("submit_incident_candidate", e.message);
    return;
  }

  try {
    const status = await readTx(CERTLAYER_ADDRESS, "get_incident_status", [incidentId]);
    eq("incident status", status, "candidate");
  } catch (e) {
    fail("get_incident_status", e.message);
  }

  // Verification decision (admin only)
  try {
    await writeTx(CERTLAYER_ADDRESS, "submit_verification_decision", [
      incidentId,
      "breach_confirmed",
      "JS e2e test evidence",
    ]);
    ok("submit_verification_decision");

    const decision = await readTx(CERTLAYER_ADDRESS, "get_incident_decision", [incidentId]);
    eq("decision", decision, "breach_confirmed");

    const status = await readTx(CERTLAYER_ADDRESS, "get_incident_status", [incidentId]);
    eq("status after decision", status, "decided");
  } catch (e) {
    fail("verification_decision", e.message);
  }
}

async function testCertLayerPool(pid) {
  console.log(`\n── C4: Pool Balance (${pid}) ──`);

  // Brief pause to let nonce sync after previous writes
  await new Promise((r) => setTimeout(r, 3000));

  try {
    const initial = await readTx(CERTLAYER_ADDRESS, "get_pool_balance", [pid]);
    const initialVal = Number(initial || 0);
    console.log(`  Initial balance: ${initialVal}`);

    await writeTx(CERTLAYER_ADDRESS, "add_pool_balance", [pid, 10000]);
    ok("add_pool_balance");

    const updated = await readTx(CERTLAYER_ADDRESS, "get_pool_balance", [pid]);
    eq("balance increased", Number(updated), initialVal + 10000);
  } catch (e) {
    fail("pool_balance", e.message);
  }
}

// ── HackDetection Tests ─────────────────────────────────────

async function testHackDetState() {
  console.log("\n── H1: HackDetection State ──");

  try {
    const explanation = await readTx(HACKDET_ADDRESS, "explain_intelligence", []);
    console.log(`  Intelligence: ${String(explanation).slice(0, 80)}...`);
    if (explanation) ok("explain_intelligence");
    else fail("explain_intelligence", "empty");
  } catch (e) {
    fail("explain_intelligence", e.message);
  }

  try {
    const paused = await readTx(HACKDET_ADDRESS, "get_paused", []);
    console.log(`  Paused: ${paused}`);
    ok(`paused state readable: ${paused}`);
  } catch (e) {
    fail("get_paused", e.message);
  }
}

async function testHackDetAnalysis() {
  const txHash = `0xJSSAFE${RUN_ID}`;
  console.log(`\n── H2: Analyze Transaction (${txHash}) ──`);

  // Ensure unpaused
  try {
    const paused = await readTx(HACKDET_ADDRESS, "get_paused", []);
    if (paused === true) {
      console.log("  Unpausing first...");
      await writeTx(HACKDET_ADDRESS, "unpause", []);
    }
  } catch (e) {
    console.log("  WARN: could not check/unpause:", e.message);
  }

  try {
    await writeTx(HACKDET_ADDRESS, "analyze_transaction", [
      "transfer(to=0xabc, amount=50, token=USDC)",
      txHash,
    ]);
    ok("analyze_transaction (safe)");
  } catch (e) {
    fail("analyze_transaction", e.message);
    return;
  }

  // Poll for analysis
  for (let i = 0; i < 10; i++) {
    try {
      const analysis = await readTx(HACKDET_ADDRESS, "get_tx_analysis_readable", [txHash]);
      if (analysis && !String(analysis).includes("No analysis")) {
        console.log(`  Analysis: ${analysis}`);
        ok("analysis returned");
        return;
      }
    } catch {
      // ignore
    }
    console.log(`    ... polling (${i + 1}/10)`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("  WARN: analysis not returned after polling");
}

async function testHackDetPauseCycle() {
  console.log("\n── H3: Pause/Unpause Cycle ──");

  try {
    await writeTx(HACKDET_ADDRESS, "emergency_pause", []);
    ok("emergency_pause");

    const paused = await readTx(HACKDET_ADDRESS, "get_paused", []);
    eq("paused after emergency_pause", paused, true);

    await writeTx(HACKDET_ADDRESS, "unpause", []);
    ok("unpause");

    const unpaused = await readTx(HACKDET_ADDRESS, "get_paused", []);
    eq("paused after unpause", unpaused, false);
  } catch (e) {
    fail("pause_cycle", e.message);
  }
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(64));
  console.log("CertLayer + HackDetection — JS E2E Test Suite");
  console.log("=".repeat(64));
  console.log(`RPC:       ${RPC_URL}`);
  console.log(`CertLayer: ${CERTLAYER_ADDRESS}`);
  console.log(`HackDet:   ${HACKDET_ADDRESS}`);
  console.log(`Account:   ${account.address}`);
  console.log(`Run ID:    ${RUN_ID}`);

  await client.initializeConsensusSmartContract();

  // CertLayer tests
  await testCertLayerAdmin();
  await sleep(2000);
  const pid = await testCertLayerRegistration();
  if (pid) {
    await sleep(3000);
    await testCertLayerIncident(pid);
    await testCertLayerPool(pid);
  }

  // HackDetection tests
  await sleep(3000);
  await testHackDetState();
  await sleep(2000);
  await testHackDetAnalysis();
  await sleep(3000);
  await testHackDetPauseCycle();

  // Summary
  console.log("\n" + "=".repeat(64));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log("\nFailures:");
    errors.forEach((e) => console.log(`  ${e}`));
  }
  console.log("=".repeat(64));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
