/**
 * Targeted E2E test using the existing test-proto-1 protocol
 * that was successfully registered via CLI
 */
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const PRIVATE_KEY = "0x5678a4edece8e3ebfc492d01219254ce18b4088ccec7570c789d7680226a38c8";
const CERTLAYER = "0x0bD615DCFA6e6e8607Ab4A63963bCbDF4029143A";

const account = createAccount(PRIVATE_KEY);
const client = createClient({
  chain: testnetBradbury,
  endpoint: "https://rpc-bradbury.genlayer.com",
  account,
});

const RUN = Date.now().toString(36).slice(-4);

async function read(method, args = []) {
  try {
    const result = await client.readContract({ address: CERTLAYER, functionName: method, args });
    console.log(`  READ  ${method}: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    console.log(`  READ  ${method}: ERROR - ${e.message?.slice(0, 80)}`);
    return null;
  }
}

async function write(method, args = []) {
  try {
    console.log(`  WRITE ${method}...`);
    const hash = await client.writeContract({ address: CERTLAYER, functionName: method, args, value: 0n });
    console.log(`    tx: ${hash}`);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
      retries: 60,
      interval: 5000,
    });
    const votes = receipt?.lastRound?.validatorVotesName || [];
    console.log(`    votes: [${votes.join(', ')}]`);
    return { votes, receipt };
  } catch (e) {
    console.log(`    ERROR: ${e.message?.slice(0, 150)}`);
    return { error: e.message };
  }
}

async function main() {
  console.log("=== TARGETED CertLayer E2E (test-proto-1) ===\n");

  // 1. Read existing protocol data
  console.log("-- Reads (existing state) --");
  await read("get_contract_admin");
  await read("get_protocol_count");
  await read("get_protocol_status", ["test-proto-1"]);
  await read("get_protocol_metadata", ["test-proto-1"]);
  await read("get_protocol_owner_wallet", ["test-proto-1"]);

  // 2. Try to register a new protocol
  const pid = `proto-${RUN}`;
  console.log(`\n-- Register new protocol: ${pid} --`);
  await write("register_protocol", [pid, `{"name":"Test-${RUN}"}`, "0xf9346827f713eb953a2e22465b9ee91901726bdc", ""]);

  // 3. Read it back
  await read("get_protocol_status", [pid]);
  await read("get_protocol_count");

  // 4. Try deposit on existing test-proto-1
  console.log("\n-- Deposit on test-proto-1 --");
  await write("deposit", ["test-proto-1", 5000]);
  await read("get_pool_balance", ["test-proto-1"]);

  // 5. Try incident on test-proto-1
  const incId = `inc-${RUN}`;
  const payload = JSON.stringify({ protocolId: "test-proto-1", summary: "HTTP 503" });
  console.log(`\n-- Incident on test-proto-1: ${incId} --`);
  await write("submit_incident_candidate", [incId, payload]);
  await read("get_incident_status", [incId]);
  await read("get_incident_decision", [incId]);

  console.log("\n=== DONE ===");
}

main().catch(e => { console.error(e); process.exit(1); });
