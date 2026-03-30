/**
 * E2E test for HackDetection simple contract on Bradbury testnet.
 * Tests: reads, emergency_pause, unpause, register_protocol, analyze_transaction (AI)
 */
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const PK = "0x5678a4edece8e3ebfc492d01219254ce18b4088ccec7570c789d7680226a38c8";
const CONTRACT = "0x0E2497d18FB4f09Ef9A71C7bF5D6494c714D4728";
const DEPLOYER = "0xf9346827f713eb953a2e22465b9ee91901726bdc";

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

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  HackDetection E2E — Fresh Contract            ║");
  console.log(`║  ${CONTRACT}  ║`);
  console.log(`║  Run: ${RUN}  ${new Date().toISOString()}      ║`);
  console.log("╚═══════════════════════════════════════════════╝\n");

  // ── Phase 1: Initial reads ──
  console.log("── Phase 1: Initial State ──");
  await read("is_paused", "get_paused");
  await read("explain_intelligence", "explain_intelligence");
  await read("admin role", "get_role", [DEPLOYER]);

  // ── Phase 2: Emergency pause / unpause ──
  console.log("\n── Phase 2: Emergency Pause / Unpause ──");
  await write("emergency_pause", "emergency_pause");
  await read("is_paused after pause", "get_paused");
  await write("unpause", "unpause");
  await read("is_paused after unpause", "get_paused");

  // ── Phase 3: Register protocol ──
  console.log("\n── Phase 3: Register Protocol ──");
  const fakeProto = "0x0000000000000000000000000000000000000042";
  await write("register_protocol", "register_protocol", [fakeProto]);

  // ── Phase 4: Analyze transaction (AI) ──
  console.log("\n── Phase 4: Analyze Transaction (AI-powered) ──");
  const normalTx = JSON.stringify({
    from: "0xabc123", to: "0xdef456", value: "0.01 ETH",
    type: "token_transfer", memo: "payment for services"
  });
  const txHash1 = `0x${RUN}normal1234567890abcdef1234567890abcdef1234567890abcdef12345678`;
  await write("analyze normal tx", "analyze_transaction", [normalTx, txHash1]);
  await read("risk score (normal)", "get_risk_score", [txHash1]);
  await read("analysis (normal)", "get_tx_analysis_readable", [txHash1]);

  // ── Phase 5: Analyze suspicious transaction ──
  console.log("\n── Phase 5: Analyze Suspicious Transaction (AI) ──");
  const suspiciousTx = JSON.stringify({
    from: "0xhacker", to: "0xvictim",
    value: "500000 ETH", type: "flash_loan_exploit",
    memo: "reentrancy attack draining vault funds, price manipulation via flash loan"
  });
  const txHash2 = `0x${RUN}susp001234567890abcdef1234567890abcdef1234567890abcdef12345678`;
  await write("analyze suspicious tx", "analyze_transaction", [suspiciousTx, txHash2]);
  await read("risk score (suspicious)", "get_risk_score", [txHash2]);
  await read("analysis (suspicious)", "get_tx_analysis_readable", [txHash2]);
  await read("is_paused (after threat?)", "get_paused");

  // ── Summary ──
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(50)}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
