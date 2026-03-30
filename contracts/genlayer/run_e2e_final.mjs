/**
 * Final comprehensive E2E for the simple CertLayer contract
 * Tests the full lifecycle: register → incident → verify → deposit → score → read all
 */
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const PK = "0x5678a4edece8e3ebfc492d01219254ce18b4088ccec7570c789d7680226a38c8";
const C = "0x0bD615DCFA6e6e8607Ab4A63963bCbDF4029143A";

const account = createAccount(PK);
const client = createClient({ chain: testnetBradbury, endpoint: "https://rpc-bradbury.genlayer.com", account });

let passed = 0, failed = 0;

async function R(label, method, args = []) {
  try {
    const r = await client.readContract({ address: C, functionName: method, args });
    passed++;
    console.log(`  ✓ READ  ${label}: ${JSON.stringify(r)}`);
    return r;
  } catch (e) {
    failed++;
    console.log(`  ✗ READ  ${label}: ${e.message?.slice(0, 80)}`);
    return null;
  }
}

async function W(label, method, args = []) {
  try {
    const hash = await client.writeContract({ address: C, functionName: method, args, value: 0n });
    const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 60, interval: 5000 });
    const votes = receipt?.lastRound?.validatorVotesName || [];
    const allAgree = votes.every(v => v === "AGREE");
    if (allAgree) { passed++; console.log(`  ✓ WRITE ${label}: ALL ${votes.length} AGREE`); }
    else { failed++; console.log(`  ✗ WRITE ${label}: [${votes.join(', ')}]`); }
    return { ok: allAgree, votes };
  } catch (e) {
    failed++;
    console.log(`  ✗ WRITE ${label}: ${e.message?.slice(0, 120)}`);
    return { ok: false };
  }
}

const RUN = Date.now().toString(36).slice(-5);

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  CertLayer Simple Contract — Full E2E Suite      ║");
  console.log(`║  Contract: ${C}  ║`);
  console.log(`║  Run: ${RUN}  Time: ${new Date().toISOString()}  ║`);
  console.log("╚═══════════════════════════════════════════════════╝\n");

  // ── Phase 1: Read initial state ──
  console.log("── Phase 1: Initial State Reads ──");
  const admin = await R("contract admin", "get_contract_admin");
  await R("protocol count", "get_protocol_count");

  // ── Phase 2: Register protocol ──
  const pid = `certlayer-e2e-${RUN}`;
  console.log(`\n── Phase 2: Register Protocol (${pid}) ──`);
  await W("register_protocol", "register_protocol", [pid, JSON.stringify({name: `CertLayer-E2E-${RUN}`, chain: "ethereum", website: "https://certlayer.vercel.app"}), "0xf9346827f713eb953a2e22465b9ee91901726bdc", "0x0000000000000000000000000000000000000001"]);

  // Read back
  await R("protocol status", "get_protocol_status", [pid]);
  await R("protocol metadata", "get_protocol_metadata", [pid]);
  await R("protocol owner", "get_protocol_owner_wallet", [pid]);
  await R("protocol contract addr", "get_protocol_contract_address", [pid]);
  await R("protocol count (after reg)", "get_protocol_count");

  // ── Phase 3: Set protocol status ──
  console.log(`\n── Phase 3: Set Protocol Status ──`);
  await W("set status → paused", "set_protocol_status", [pid, "paused"]);
  await R("status after pause", "get_protocol_status", [pid]);
  await W("set status → active", "set_protocol_status", [pid, "active"]);

  // ── Phase 4: Set contract address ──
  console.log(`\n── Phase 4: Set Contract Address ──`);
  await W("update contract addr", "set_protocol_contract_address", [pid, "0x0000000000000000000000000000000000000099"]);
  await R("contract addr after update", "get_protocol_contract_address", [pid]);

  // ── Phase 5: Submit incident ──
  const incId = `inc-certlayer-${RUN}`;
  const payload = JSON.stringify({ protocolId: pid, summary: "HTTP 503 endpoint unreachable", source: "uptime_monitor" });
  console.log(`\n── Phase 5: Submit Incident (${incId}) ──`);
  await W("submit incident candidate", "submit_incident_candidate", [incId, payload]);
  await R("incident status", "get_incident_status", [incId]);
  await R("incident decision", "get_incident_decision", [incId]);
  await R("incident protocol_id", "get_incident_protocol_id", [incId]);

  // ── Phase 6: Create structured incident ──
  const incId2 = `inc2-certlayer-${RUN}`;
  const ts = Math.floor(Date.now() / 1000);
  console.log(`\n── Phase 6: Create Structured Incident (${incId2}) ──`);
  await W("create_incident", "create_incident", [incId2, pid, ts, "sha256:abcdef1234567890"]);
  await R("incident2 status", "get_incident_status", [incId2]);

  // ── Phase 7: Verification decision ──
  console.log(`\n── Phase 7: Verification Decision ──`);
  await W("verify breach", "submit_verification_decision", [incId, "breach_confirmed", "Uptime monitor confirmed 503 for 2 hours"]);
  await R("decision after verify", "get_incident_decision", [incId]);
  await R("status after verify", "get_incident_status", [incId]);

  // ── Phase 8: Pool balance ──
  console.log(`\n── Phase 8: Pool Balance ──`);
  await W("add pool balance 10000", "add_pool_balance", [pid, 10000]);
  await R("pool balance", "get_pool_balance", [pid]);
  await W("add pool balance 5000 more", "add_pool_balance", [pid, 5000]);
  await R("pool balance (after 2nd)", "get_pool_balance", [pid]);

  // ── Phase 9: Read score/grade (default) ──
  console.log(`\n── Phase 9: Score & Grade (defaults) ──`);
  await R("score", "get_score", [pid]);
  await R("grade", "get_grade", [pid]);

  // ── Summary ──
  console.log(`\n${"═".repeat(55)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(55)}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
