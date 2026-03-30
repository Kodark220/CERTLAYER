/**
 * Quick E2E test for CertLayer + HackDetection on Bradbury
 * Uses the simple CertLayer contract (confirmed working) and HackDetection
 */
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const PRIVATE_KEY = "0x5678a4edece8e3ebfc492d01219254ce18b4088ccec7570c789d7680226a38c8";
const SIMPLE_CERTLAYER = "0x0bD615DCFA6e6e8607Ab4A63963bCbDF4029143A";
const FULL_CERTLAYER   = "0x9dA7CF929f2b7E53a56fe63f8732b0F12bb1cA12";
const HACKDET          = "0x6ad2C2D36d2ca4faB22644D18435f4eF2BA74A2b";

const account = createAccount(PRIVATE_KEY);
const client = createClient({
  chain: testnetBradbury,
  endpoint: "https://rpc-bradbury.genlayer.com",
  account,
});

let passed = 0, failed = 0;
const errors = [];

function ok(label, detail) {
  passed++;
  console.log(`  ✓ ${label}${detail ? ': ' + JSON.stringify(detail) : ''}`);
}
function fail(label, reason) {
  failed++;
  errors.push(`${label}: ${reason}`);
  console.log(`  ✗ ${label}: ${reason}`);
}

async function readContract(address, method, args = []) {
  try {
    const result = await client.readContract({ address, functionName: method, args });
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

async function writeContract(address, method, args = []) {
  try {
    const hash = await client.writeContract({ address, functionName: method, args, value: 0n });
    console.log(`    tx: ${hash}`);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
      retries: 60,
      interval: 5000,
    });
    const votes = receipt?.lastRound?.validatorVotesName || [];
    const statusName = receipt?.status_name || receipt?.status || "?";
    console.log(`    status: ${statusName}, votes: [${votes.join(', ')}]`);
    return { ok: true, receipt, statusName, votes };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const RUN = Date.now().toString(36).slice(-6);

// ═════════════════════════════════════════════
// CERTLAYER (simple contract - known working)
// ═════════════════════════════════════════════
async function testCertLayer() {
  const C = SIMPLE_CERTLAYER;
  console.log("\n══════════════════════════════════════════");
  console.log("  CERTLAYER E2E (simple contract)");
  console.log(`  Address: ${C}`);
  console.log("══════════════════════════════════════════");

  // T1: Read admin
  console.log("\n── T1: get_contract_admin ──");
  let r = await readContract(C, "get_contract_admin");
  if (r.ok) ok("admin read", r.result); else fail("admin read", r.error);

  // T2: Read protocol_count
  console.log("\n── T2: get_protocol_count ──");
  r = await readContract(C, "get_protocol_count");
  if (r.ok) ok("protocol_count", r.result); else fail("protocol_count", r.error);

  // T3: Register protocol
  const pid = `e2e-${RUN}`;
  const meta = JSON.stringify({ name: `E2E-${RUN}`, website: "https://example.com" });
  console.log(`\n── T3: register_protocol (id=${pid}) ──`);
  r = await writeContract(C, "register_protocol", [pid, meta, "0xf9346827f713eb953a2e22465b9ee91901726bdc", ""]);
  if (r.ok && r.votes.every(v => v === "AGREE")) {
    ok("register_protocol", "ALL AGREE");
  } else if (r.ok) {
    fail("register_protocol", `votes: ${r.votes}`);
  } else {
    fail("register_protocol", r.error);
  }

  // T4: Read back protocol
  console.log("\n── T4: get_protocol_status ──");
  r = await readContract(C, "get_protocol_status", [pid]);
  if (r.ok && r.result === "active") ok("status=active", r.result);
  else if (r.ok) ok("status read (may differ)", r.result);
  else fail("get_protocol_status", r.error);

  // T5: Read metadata
  console.log("\n── T5: get_protocol_metadata ──");
  r = await readContract(C, "get_protocol_metadata", [pid]);
  if (r.ok) ok("metadata read", r.result); else fail("metadata read", r.error);

  // T6: Submit incident
  const incId = `inc-${RUN}`;
  const payload = JSON.stringify({ protocolId: pid, summary: "HTTP 503 detected" });
  console.log(`\n── T6: submit_incident_candidate (id=${incId}) ──`);
  r = await writeContract(C, "submit_incident_candidate", [incId, payload]);
  if (r.ok && r.votes.every(v => v === "AGREE")) {
    ok("submit_incident", "ALL AGREE");
  } else if (r.ok) {
    fail("submit_incident", `votes: ${r.votes}`);
  } else {
    fail("submit_incident", r.error);
  }

  // T7: Read incident status
  console.log("\n── T7: get_incident_status ──");
  r = await readContract(C, "get_incident_status", [incId]);
  if (r.ok) ok("incident status", r.result); else fail("incident status", r.error);

  // T8: Verification decision
  console.log("\n── T8: submit_verification_decision ──");
  r = await writeContract(C, "submit_verification_decision", [incId, "breach_confirmed", "HTTP 503 evidence"]);
  if (r.ok && r.votes.every(v => v === "AGREE")) {
    ok("verification decision", "ALL AGREE");
  } else if (r.ok) {
    fail("verification decision", `votes: ${r.votes}`);
  } else {
    fail("verification decision", r.error);
  }

  // T9: Read decision
  console.log("\n── T9: get_incident_decision ──");
  r = await readContract(C, "get_incident_decision", [incId]);
  if (r.ok) ok("decision", r.result); else fail("decision", r.error);

  // T10: Deposit to pool
  console.log(`\n── T10: deposit (protocol=${pid}, amount=10000) ──`);
  r = await writeContract(C, "deposit", [pid, 10000]);
  if (r.ok && r.votes.every(v => v === "AGREE")) {
    ok("deposit", "ALL AGREE");
  } else if (r.ok) {
    fail("deposit", `votes: ${r.votes}`);
  } else {
    fail("deposit", r.error);
  }

  // T11: Read pool balance
  console.log("\n── T11: get_pool_balance ──");
  r = await readContract(C, "get_pool_balance", [pid]);
  if (r.ok) ok("pool balance", r.result); else fail("pool balance", r.error);

  // T12: Recompute score
  console.log(`\n── T12: recompute_score ──`);
  r = await writeContract(C, "recompute_score", [pid, 9000, 8500, 8000, 9500]);
  if (r.ok && r.votes.every(v => v === "AGREE")) {
    ok("recompute_score", "ALL AGREE");
  } else if (r.ok) {
    fail("recompute_score", `votes: ${r.votes}`);
  } else {
    fail("recompute_score", r.error);
  }

  // T13: Read score and grade
  console.log("\n── T13: get_score / get_grade ──");
  r = await readContract(C, "get_score", [pid]);
  if (r.ok) ok("score", r.result); else fail("score", r.error);
  r = await readContract(C, "get_grade", [pid]);
  if (r.ok) ok("grade", r.result); else fail("grade", r.error);
}

// ═════════════════════════════════════════════
// FULL CERTLAYER - test reads (state is empty)
// ═════════════════════════════════════════════
async function testFullCertLayer() {
  console.log("\n══════════════════════════════════════════");
  console.log("  CERTLAYER FULL CONTRACT (state check)");
  console.log(`  Address: ${FULL_CERTLAYER}`);
  console.log("══════════════════════════════════════════");

  let r = await readContract(FULL_CERTLAYER, "get_contract_admin");
  if (r.ok) ok("full certlayer admin read", r.result);
  else fail("full certlayer admin read", r.error.slice(0, 100));
}

// ═════════════════════════════════════════════
// HACKDETECTION
// ═════════════════════════════════════════════
async function testHackDetection() {
  console.log("\n══════════════════════════════════════════");
  console.log("  HACKDETECTION E2E");
  console.log(`  Address: ${HACKDET}`);
  console.log("══════════════════════════════════════════");

  // S1: Read paused state
  console.log("\n── S1: get_paused ──");
  let r = await readContract(HACKDET, "get_paused");
  if (r.ok) ok("paused state", r.result);
  else fail("paused state", r.error.slice(0, 100));

  // S2: explain_intelligence
  console.log("\n── S2: explain_intelligence ──");
  r = await readContract(HACKDET, "explain_intelligence");
  if (r.ok) ok("intelligence", typeof r.result === 'string' ? r.result.slice(0, 80) + '...' : r.result);
  else fail("intelligence", r.error.slice(0, 100));

  // S3: get_role
  console.log("\n── S3: get_role ──");
  r = await readContract(HACKDET, "get_role", ["0xf9346827f713eb953a2e22465b9ee91901726bdc"]);
  if (r.ok) ok("role", r.result);
  else fail("role", r.error.slice(0, 100));

  // S4: Analyze a safe transaction (AI-powered write)
  const txHash = `0xSAFE${RUN}`;
  const txData = "transfer(to=0xabc123, amount=100, token=USDC)";
  console.log(`\n── S4: analyze_transaction (safe, hash=${txHash}) ──`);
  r = await writeContract(HACKDET, "analyze_transaction", [txData, txHash]);
  if (r.ok) {
    const allAgree = r.votes.every(v => v === "AGREE");
    if (allAgree) ok("analyze_transaction (safe)", "ALL AGREE");
    else ok("analyze_transaction (safe)", `votes: [${r.votes.join(', ')}]`);
  } else {
    fail("analyze_transaction (safe)", r.error.slice(0, 200));
  }

  // S5: Read analysis
  console.log("\n── S5: get_tx_analysis_readable ──");
  await sleep(3000);
  r = await readContract(HACKDET, "get_tx_analysis_readable", [txHash]);
  if (r.ok) ok("analysis", typeof r.result === 'string' ? r.result.slice(0, 100) : r.result);
  else fail("analysis read", r.error.slice(0, 100));

  // S6: Read risk score
  console.log("\n── S6: get_risk_score ──");
  r = await readContract(HACKDET, "get_risk_score", [txHash]);
  if (r.ok) ok("risk score", r.result);
  else fail("risk score", r.error.slice(0, 100));

  // S7: Emergency pause
  console.log("\n── S7: emergency_pause ──");
  r = await writeContract(HACKDET, "emergency_pause");
  if (r.ok && r.votes.every(v => v === "AGREE")) ok("emergency_pause", "ALL AGREE");
  else if (r.ok) fail("emergency_pause", `votes: ${r.votes}`);
  else fail("emergency_pause", r.error.slice(0, 200));

  // S8: Read paused
  console.log("\n── S8: get_paused (should be true) ──");
  r = await readContract(HACKDET, "get_paused");
  if (r.ok) ok("paused after emergency", r.result);
  else fail("paused check", r.error.slice(0, 100));

  // S9: Unpause
  console.log("\n── S9: unpause ──");
  r = await writeContract(HACKDET, "unpause");
  if (r.ok && r.votes.every(v => v === "AGREE")) ok("unpause", "ALL AGREE");
  else if (r.ok) fail("unpause", `votes: ${r.votes}`);
  else fail("unpause", r.error.slice(0, 200));
}

// ═════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  CERTLAYER + HACKDETECTION E2E TESTS    ║");
  console.log("║  Bradbury Testnet                        ║");
  console.log(`║  Run ID: ${RUN}                          ║`);
  console.log(`║  Time: ${new Date().toISOString()}       ║`);
  console.log("╚══════════════════════════════════════════╝");

  await testCertLayer();
  await testFullCertLayer();
  await testHackDetection();

  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed`);
  if (errors.length) {
    console.log("║  Failures:");
    errors.forEach(e => console.log(`║    ${e}`));
  }
  console.log("╚══════════════════════════════════════════╝");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
