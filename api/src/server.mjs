import { createServer } from "node:http";
import { createClient } from "genlayer-js";
import { localnet, studionet } from "genlayer-js/chains";
import { addIncident, db, ensureProtocol, upsertScore } from "./store.mjs";

const PORT = Number(process.env.PORT || 8080);
const SERVICE_NAME = process.env.SERVICE_NAME || "certlayer-api";
const API_KEY = process.env.API_KEY || "";

const GENLAYER_RPC_URL = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const GENLAYER_CHAIN = (process.env.GENLAYER_CHAIN || "studionet").toLowerCase();
const GENLAYER_CONTRACT_ADDRESS = process.env.GENLAYER_CONTRACT_ADDRESS || "";
const GENLAYER_SERVER_ACCOUNT = process.env.GENLAYER_SERVER_ACCOUNT || "";

const LIVE_MODE = Boolean(GENLAYER_CONTRACT_ADDRESS);

function send(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type,Authorization,x-api-key",
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function checkAuth(req) {
  if (!API_KEY) return true;
  return req.headers["x-api-key"] === API_KEY;
}

function buildClient(forWrite = false) {
  const cfg = {
    chain: GENLAYER_CHAIN === "localnet" ? localnet : studionet,
    endpoint: GENLAYER_RPC_URL,
  };
  if (forWrite && GENLAYER_SERVER_ACCOUNT) {
    cfg.account = GENLAYER_SERVER_ACCOUNT;
  }
  return createClient(cfg);
}

async function contractWrite(functionName, args) {
  const client = buildClient(true);
  if (!GENLAYER_SERVER_ACCOUNT) {
    throw new Error("GENLAYER_SERVER_ACCOUNT is required for contract write operations");
  }

  const txHash = await client.writeContract({
    address: GENLAYER_CONTRACT_ADDRESS,
    functionName,
    args,
    value: BigInt(0),
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "ACCEPTED",
    retries: 40,
    interval: 3000,
  });

  return { txHash, receipt };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "OPTIONS") return send(res, 204, {});

    if (req.method !== "GET" && !checkAuth(req)) {
      return send(res, 401, { error: "unauthorized" });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, {
        ok: true,
        service: SERVICE_NAME,
        product: "CertLayer",
        live_mode: LIVE_MODE,
        genlayer_chain: GENLAYER_CHAIN,
        genlayer_contract: GENLAYER_CONTRACT_ADDRESS || "",
        has_server_account: Boolean(GENLAYER_SERVER_ACCOUNT),
        protocols: db.protocols.length,
        incidents: db.incidents.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST" && url.pathname === "/v1/protocols/register") {
      const body = await readBody(req);
      const protocol = ensureProtocol(body);
      upsertScore(protocol.id, 70, "B");

      if (LIVE_MODE) {
        const metadataJson = JSON.stringify({
          name: protocol.name,
          website: protocol.website,
          protocolType: protocol.protocolType,
          uptimeBps: protocol.uptimeBps,
        });
        const ownerWallet = body.ownerWallet || "";
        const onchain = await contractWrite("register_protocol", [protocol.id, metadataJson, ownerWallet]);
        return send(res, 201, { protocol, onchain });
      }

      return send(res, 201, { protocol, mode: "local" });
    }

    if (req.method === "GET" && url.pathname === "/v1/protocols") {
      return send(res, 200, { items: db.protocols });
    }

    if (req.method === "POST" && url.pathname === "/v1/incidents") {
      const body = await readBody(req);
      if (!body.protocolId) return send(res, 400, { error: "protocolId required" });

      const incident = addIncident(body);

      if (LIVE_MODE) {
        const payloadJson = JSON.stringify({
          protocolId: incident.protocolId,
          severity: incident.severity,
          summary: incident.summary,
          createdAt: incident.createdAt,
        });
        const onchain = await contractWrite("submit_incident_candidate", [incident.id, payloadJson]);
        return send(res, 201, { incident, onchain });
      }

      return send(res, 201, { incident, mode: "local" });
    }

    if (req.method === "POST" && url.pathname === "/v1/incidents/decision") {
      const body = await readBody(req);
      if (!body.incidentId || !body.decision) {
        return send(res, 400, { error: "incidentId and decision required" });
      }

      if (LIVE_MODE) {
        const onchain = await contractWrite("submit_verification_decision", [
          body.incidentId,
          body.decision,
          body.reason || "",
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "GET" && url.pathname === "/v1/incidents") {
      return send(res, 200, { items: db.incidents });
    }

    if (req.method === "POST" && url.pathname === "/v1/pools/deposit") {
      const body = await readBody(req);
      if (!body.protocolId || body.amount === undefined) {
        return send(res, 400, { error: "protocolId and amount required" });
      }

      if (LIVE_MODE) {
        const onchain = await contractWrite("deposit", [body.protocolId, Number(body.amount)]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && url.pathname === "/v1/enforcement/execute") {
      const body = await readBody(req);
      if (!body.incidentId || !body.protocolId || body.totalAmount === undefined) {
        return send(res, 400, { error: "incidentId, protocolId, totalAmount required" });
      }

      if (LIVE_MODE) {
        const onchain = await contractWrite("execute_compensation", [
          body.incidentId,
          body.protocolId,
          Number(body.totalAmount),
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && url.pathname === "/v1/reputation/recompute") {
      const body = await readBody(req);
      if (!body.protocolId) return send(res, 400, { error: "protocolId required" });

      const uptime = Number(body.uptimeComponent ?? 7000);
      const incident = Number(body.incidentComponent ?? 7000);
      const response = Number(body.responseComponent ?? 7000);
      const poolHealth = Number(body.poolHealthComponent ?? 7000);
      const score = Math.round((uptime + incident + response + poolHealth) / 4 / 100);
      const grade = score >= 90 ? "AAA" : score >= 80 ? "AA" : score >= 70 ? "A" : score >= 60 ? "B" : "C";
      const localScore = upsertScore(body.protocolId, score, grade);

      if (LIVE_MODE) {
        const onchain = await contractWrite("recompute_score", [
          body.protocolId,
          uptime,
          incident,
          response,
          poolHealth,
        ]);
        return send(res, 200, { score: localScore, onchain });
      }

      return send(res, 200, { score: localScore, mode: "local" });
    }

    if (req.method === "GET" && url.pathname === "/v1/reputation/protocols") {
      const items = db.protocols.map((p) => {
        const score = db.scores.find((s) => s.protocolId === p.id) || {
          score: 0,
          grade: "N/A",
          updatedAt: null,
        };
        return {
          protocolId: p.id,
          name: p.name,
          protocolType: p.protocolType,
          score: score.score,
          grade: score.grade,
          updatedAt: score.updatedAt,
        };
      });
      return send(res, 200, { items });
    }

    return send(res, 404, { error: "not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    return send(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on http://localhost:${PORT} live_mode=${LIVE_MODE}`);
});
