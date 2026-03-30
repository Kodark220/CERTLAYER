/**
 * Clean E2E test for CertLayer simple contract on fresh deployment.
 * Adds a 10-second delay between write operations to avoid consensus queue issues.
 */
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const PK = "0x5678a4edece8e3ebfc492d01219254ce18b4088ccec7570c789d7680226a38c8";
const CONTRACT = "0xD5F9BadF3f7AdFD32767fA5692ca18f6F265f677";

const account = createAccount(PK);
const client = createClient({ chain: testnetBradbury, endpoint: "https://rpc-bradbury.genlayer.com", account });

let passed = 0, failed = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function read(label, method, args = []) {
  try {
    const r = await client.readContract({ address: CONTRACT, functionName: method, args });
    passed++;
    console.log(`  ✓ READ  ${label}: ${JSON.stringify(r)}`);
    return r;
  } catch (e) {
    failed++;
    console.log(`  ✗ READ  ${label}: ${e.message?.slice(0, 100)}`);
    return null;
  }
}

async function write(label, method, args = []) {
  try {
    const hash = await client.writeContract({ address: CONTRACT, functionName: method, args, value: 0n });
    const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 60, interval: 5000 });
    const votes = receipt?.lastRound?.validatorVotesName || [];
    const allAgree = votes.every(v => v === "AGREE");
    if (allAgree) { passed++; console.log(`  ✓ WRITE ${label}: ALL ${votes.length} AGREE`); }
    else { failed++; console.log(`  ✗ WRITE ${label}: [${votes.join(", ")}]`); }
    // Wait between writes to let validators settle
    await sleep(10_000);
    return { ok: allAgree, votes };
  } catch (e) {
    failed++;
    console.log(`  ✗ WRITE ${label}: ${e.message?.slice(0, 120)}`);
    await sleep(10_000);
    return { ok: false };
  }
}

async function main() {
  const RUN = Date.now().toString(36).slice(-5);
  const pid = `e2e-${RUN}`;
  const incId = `inc-${RUN}`;
  const incId2 = `inc2-${RUN}`;

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  CertLayer Clean E2E — Fresh Contract         ║");
  console.log(`║  ${CONTRACT}  ║`);
  console.log(`║  Run: ${RUN}  ${new Date().toISOString()}      ║`);
  console.log("╚═══════════════════════════════════════════════╝\n");

  // ── Phase 1: Initial reads ──
  console.log("── Phase 1: Initial State ──");
  await read("admin", "get_contract_admin");
  await read("protocol count", "get_protocol_count");

  // ── Phase 2: Register protocol ──
  console.log(`\n── Phase 2: Register Protocol (${pid}) ──`);
  await write("register_protocol", "register_protocol", [
    pid,
    JSON.stringify({ name: `E2E-${RUN}`, chain: "ethereum", website: "https://certlayer.vercel.app" }),
    "0xf9346827f713eb953a2e22465b9ee91901726bdc",
    "0x0000000000000000000000000000000000000001"
  ]);
  await read("status", "get_protocol_status", [pid]);
  await read("metadata", "get_protocol_metadata", [pid]);
  await read("owner", "get_protocol_owner_wallet", [pid]);
  await read("contract addr", "get_protocol_contract_address", [pid]);
  await read("protocol count", "get_protocol_count");

  // ── Phase 3: Update protocol status ──
  console.log(`\n── Phase 3: Set Protocol Status ──`);
  await write("set status → paused", "set_protocol_status", [pid, "paused"]);
  await read("status after pause", "get_protocol_status", [pid]);
  await write("set status → active", "set_protocol_status", [pid, "active"]);
  await read("status after reactivate", "get_protocol_status", [pid]);

  // ── Phase 4: Update contract address ──
  console.log(`\n── Phase 4: Set Contract Address ──`);
  await write("set contract addr", "set_protocol_contract_address", [pid, "0x0000000000000000000000000000000000000099"]);
  await read("contract addr", "get_protocol_contract_address", [pid]);

  // ── Phase 5: Submit incident ──
  console.log(`\n── Phase 5: Submit Incident (${incId}) ──`);
  await write("submit_incident_candidate", "submit_incident_candidate", [
    incId,
    JSON.stringify({ protocolId: pid, summary: "HTTP 503 for 2 hours", source: "uptime_monitor" })
  ]);
  await read("incident status", "get_incident_status", [incId]);
  await read("incident decision", "get_incident_decision", [incId]);
  await read("incident protocol_id", "get_incident_protocol_id", [incId]);

  // ── Phase 6: Create structured incident ──
  console.log(`\n── Phase 6: Create Incident (${incId2}) ──`);
  await write("create_incident", "create_incident", [incId2, pid, Math.floor(Date.now() / 1000), "sha256:abcdef1234567890"]);
  await read("incident2 status", "get_incident_status", [incId2]);

  // ── Phase 7: Verification decision ──
  console.log(`\n── Phase 7: Verification Decision ──`);
  await write("submit_verification_decision", "submit_verification_decision", [incId, "breach_confirmed", "Confirmed via uptime data"]);
  await read("decision", "get_incident_decision", [incId]);
  await read("status after decision", "get_incident_status", [incId]);

  // ── Phase 8: Pool balance ──
  console.log(`\n── Phase 8: Pool Balance ──`);
  await write("add_pool_balance 10000", "add_pool_balance", [pid, 10000]);
  await read("pool balance", "get_pool_balance", [pid]);
  await write("add_pool_balance 5000", "add_pool_balance", [pid, 5000]);
  await read("pool balance total", "get_pool_balance", [pid]);

  // ── Phase 9: Score & Grade ──
  console.log(`\n── Phase 9: Score & Grade ──`);
  await read("score", "get_score", [pid]);
  await read("grade", "get_grade", [pid]);

  // ── Summary ──
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(50)}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
