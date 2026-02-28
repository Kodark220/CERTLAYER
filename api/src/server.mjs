import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { createClient } from "genlayer-js";
import { localnet, studionet } from "genlayer-js/chains";
import { getAddress, recoverMessageAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  addIncident,
  db,
  ensureProtocol,
  findProtocol,
  listCommitmentsByProtocol,
  listProtocolsByOwnerWallet,
  upsertCommitment,
  updateProtocol,
  upsertScore,
} from "./store.mjs";

const PORT = Number(process.env.PORT || 8080);
const SERVICE_NAME = process.env.SERVICE_NAME || "certlayer-api";
const API_KEY = process.env.API_KEY || "";
const ADMIN_WALLETS = new Set(
  (process.env.ADMIN_WALLETS || "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const GENLAYER_RPC_URL = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const GENLAYER_CHAIN = (process.env.GENLAYER_CHAIN || "studionet").toLowerCase();
const RAW_GENLAYER_CONTRACT_ADDRESS = process.env.GENLAYER_CONTRACT_ADDRESS || "";
const RAW_GENLAYER_SERVER_ACCOUNT = process.env.GENLAYER_SERVER_ACCOUNT || "";
const RAW_GENLAYER_SERVER_PRIVATE_KEY = process.env.GENLAYER_SERVER_PRIVATE_KEY || "";

function parseAddressOrEmpty(raw, name) {
  const value = (raw || "").trim();
  if (!value) return "";
  try {
    return getAddress(value);
  } catch {
    throw new Error(`${name} must be a valid 20-byte EVM address`);
  }
}

function parsePrivateKeyOrEmpty(raw, name) {
  const value = (raw || "").trim();
  if (!value) return "";
  if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(`${name} must be a 32-byte hex private key (0x + 64 hex chars)`);
  }
  return value;
}

const GENLAYER_CONTRACT_ADDRESS = parseAddressOrEmpty(RAW_GENLAYER_CONTRACT_ADDRESS, "GENLAYER_CONTRACT_ADDRESS");
const GENLAYER_SERVER_ACCOUNT = parseAddressOrEmpty(RAW_GENLAYER_SERVER_ACCOUNT, "GENLAYER_SERVER_ACCOUNT");
const GENLAYER_SERVER_PRIVATE_KEY = parsePrivateKeyOrEmpty(
  RAW_GENLAYER_SERVER_PRIVATE_KEY,
  "GENLAYER_SERVER_PRIVATE_KEY"
);
const GENLAYER_WRITE_ACCOUNT = GENLAYER_SERVER_PRIVATE_KEY
  ? privateKeyToAccount(GENLAYER_SERVER_PRIVATE_KEY)
  : "";

if (GENLAYER_SERVER_PRIVATE_KEY && GENLAYER_SERVER_ACCOUNT) {
  const derivedAddress = getAddress(privateKeyToAccount(GENLAYER_SERVER_PRIVATE_KEY).address);
  if (derivedAddress !== GENLAYER_SERVER_ACCOUNT) {
    throw new Error("GENLAYER_SERVER_ACCOUNT does not match address derived from GENLAYER_SERVER_PRIVATE_KEY");
  }
}

const LIVE_MODE = Boolean(GENLAYER_CONTRACT_ADDRESS);
const WRITE_SIGNING_MODE = GENLAYER_SERVER_PRIVATE_KEY
  ? "private_key"
  : GENLAYER_SERVER_ACCOUNT
    ? "address_only"
    : "none";
const NONCE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const walletNonces = new Map();
const sessions = new Map();

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

function isValidWallet(wallet) {
  return typeof wallet === "string" && /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

function normalizeWallet(wallet) {
  return wallet.toLowerCase();
}

function isAdminWallet(wallet) {
  return ADMIN_WALLETS.has(normalizeWallet(wallet));
}

function extractSessionToken(req) {
  const authHeader = req.headers.authorization || "";
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const headerToken = req.headers["x-session-token"];
  return typeof headerToken === "string" ? headerToken.trim() : "";
}

function getSession(req) {
  const token = extractSessionToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function createNonceMessage(wallet, nonce) {
  return [
    "CertLayer Authentication",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
    "Sign this message to authenticate. No blockchain transaction will be sent.",
  ].join("\n");
}

function isPublicPostRoute(pathname) {
  return pathname === "/v1/auth/wallet/nonce" || pathname === "/v1/auth/wallet/verify" || pathname.startsWith("/v1/auth/");
}

function hasInternalAccess(req) {
  return checkAuth(req);
}

function hasAdminSession(req) {
  const session = getSession(req);
  return Boolean(session && session.role === "admin");
}

function canAccessWrite(req, pathname) {
  if (isPublicPostRoute(pathname)) return true;
  if (hasInternalAccess(req)) return true;
  return Boolean(getSession(req));
}

function enforceProtocolOwnership(req, protocolId) {
  if (!protocolId) return { ok: false, status: 400, error: "protocolId required" };
  if (hasInternalAccess(req)) return { ok: true };

  const session = getSession(req);
  if (!session) return { ok: false, status: 401, error: "session required" };
  if (session.role === "admin") return { ok: true, session };

  const protocol = findProtocol(protocolId);
  if (!protocol) return { ok: false, status: 404, error: "protocol not found" };

  if (normalizeWallet(protocol.ownerWallet) !== normalizeWallet(session.wallet)) {
    return { ok: false, status: 403, error: "forbidden: cannot access another protocol" };
  }
  return { ok: true, session, protocol };
}

function buildClient(forWrite = false) {
  const cfg = {
    chain: GENLAYER_CHAIN === "localnet" ? localnet : studionet,
    endpoint: GENLAYER_RPC_URL,
  };
  if (forWrite && GENLAYER_WRITE_ACCOUNT) {
    cfg.account = GENLAYER_WRITE_ACCOUNT;
  }
  return createClient(cfg);
}

async function contractWrite(functionName, args) {
  const client = buildClient(true);
  if (!GENLAYER_WRITE_ACCOUNT) {
    throw new Error(
      "GENLAYER_SERVER_PRIVATE_KEY is required for live contract write operations"
    );
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
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") return send(res, 204, {});

    if (req.method !== "GET" && !canAccessWrite(req, pathname)) {
      return send(res, 401, { error: "unauthorized" });
    }

    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, {
        ok: true,
        service: SERVICE_NAME,
        product: "CertLayer",
        live_mode: LIVE_MODE,
        genlayer_chain: GENLAYER_CHAIN,
        genlayer_contract: GENLAYER_CONTRACT_ADDRESS || "",
        has_server_account: Boolean(GENLAYER_WRITE_ACCOUNT),
        has_server_private_key: Boolean(GENLAYER_SERVER_PRIVATE_KEY),
        write_signing_mode: WRITE_SIGNING_MODE,
        protocols: db.protocols.length,
        incidents: db.incidents.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "GET" && pathname === "/v1/public/reputation") {
      const items = db.protocols.map((p) => {
        const score = db.scores.find((s) => s.protocolId === p.id) || {
          score: 0,
          grade: "N/A",
          updatedAt: null,
        };
        const incidents = db.incidents.filter((i) => i.protocolId === p.id);
        return {
          protocolId: p.id,
          name: p.name,
          protocolType: p.protocolType,
          uptimeBps: Number(p.uptimeBps || 0),
          score: score.score,
          grade: score.grade,
          incidentCount: incidents.length,
          openIncidentCount: incidents.filter((i) => i.status === "open").length,
          updatedAt: score.updatedAt,
        };
      });

      return send(res, 200, {
        items,
        totals: {
          protocolCount: items.length,
          incidentCount: db.incidents.length,
        },
      });
    }

    if (req.method === "POST" && pathname === "/v1/auth/wallet/nonce") {
      const body = await readBody(req);
      const wallet = normalizeWallet(body.wallet || "");
      if (!isValidWallet(wallet)) {
        return send(res, 400, { error: "valid wallet is required" });
      }

      const nonce = randomBytes(16).toString("hex");
      const message = createNonceMessage(wallet, nonce);
      const expiresAt = Date.now() + NONCE_TTL_MS;
      walletNonces.set(wallet, { nonce, message, expiresAt });

      return send(res, 200, {
        wallet,
        message,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }

    if (req.method === "POST" && pathname === "/v1/auth/wallet/verify") {
      const body = await readBody(req);
      const wallet = normalizeWallet(body.wallet || "");
      const signature = body.signature || "";

      if (!isValidWallet(wallet)) {
        return send(res, 400, { error: "valid wallet is required" });
      }
      if (typeof signature !== "string" || !signature.startsWith("0x")) {
        return send(res, 400, { error: "valid signature is required" });
      }

      const stored = walletNonces.get(wallet);
      if (!stored || stored.expiresAt <= Date.now()) {
        walletNonces.delete(wallet);
        return send(res, 401, { error: "nonce expired or missing" });
      }

      const recovered = await recoverMessageAddress({
        message: stored.message,
        signature,
      });
      if (normalizeWallet(recovered) !== wallet) {
        return send(res, 401, { error: "signature verification failed" });
      }

      walletNonces.delete(wallet);
      const token = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + SESSION_TTL_MS;
      const role = isAdminWallet(wallet) ? "admin" : "owner";
      sessions.set(token, { wallet, role, expiresAt });

      return send(res, 200, {
        token,
        tokenType: "Bearer",
        wallet,
        role,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }

    if (req.method === "GET" && pathname === "/v1/auth/me") {
      const session = getSession(req);
      if (!session) {
        return send(res, 401, { error: "invalid session" });
      }
      return send(res, 200, {
        wallet: session.wallet,
        role: session.role,
        expiresAt: new Date(session.expiresAt).toISOString(),
      });
    }

    if (req.method === "POST" && pathname === "/v1/protocols/register") {
      const body = await readBody(req);
      const session = getSession(req);
      const isInternal = hasInternalAccess(req);
      if (!isInternal && !session) {
        return send(res, 401, { error: "session required" });
      }

      if (!body.ownerWallet && session) {
        body.ownerWallet = session.wallet;
      }

      if (!isValidWallet(body.ownerWallet || "")) {
        return send(res, 400, {
          error: "ownerWallet required (sign in with wallet session or provide ownerWallet in request body)",
        });
      }

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

    if (req.method === "POST" && pathname === "/v1/protocols/update") {
      const body = await readBody(req);
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      const updated = updateProtocol(body.protocolId, {
        name: body.name,
        website: body.website,
        protocolType: body.protocolType,
        uptimeBps: body.uptimeBps,
      });
      return send(res, 200, { protocol: updated });
    }

    if (req.method === "GET" && pathname === "/v1/protocols") {
      if (hasInternalAccess(req) || hasAdminSession(req)) {
        return send(res, 200, { items: db.protocols });
      }
      const session = getSession(req);
      if (!session) return send(res, 401, { error: "session required" });
      return send(res, 200, { items: listProtocolsByOwnerWallet(session.wallet) });
    }

    if (req.method === "GET" && pathname === "/v1/commitments") {
      const protocolId = url.searchParams.get("protocolId") || "";
      if (!protocolId) return send(res, 400, { error: "protocolId required" });

      const authz = enforceProtocolOwnership(req, protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      const items = listCommitmentsByProtocol(protocolId);
      return send(res, 200, { items });
    }

    if (req.method === "POST" && pathname === "/v1/incidents") {
      const body = await readBody(req);
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

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

    if (req.method === "POST" && pathname === "/v1/incidents/create-lifecycle") {
      const body = await readBody(req);
      if (!body.protocolId) return send(res, 400, { error: "protocolId required" });
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      const incidentId = body.incidentId || `inc-${Date.now()}`;
      const startTs = Number(body.startTs || Math.floor(Date.now() / 1000));
      const evidenceHash = body.evidenceHash || "";

      if (LIVE_MODE) {
        const onchain = await contractWrite("create_incident", [
          incidentId,
          body.protocolId,
          startTs,
          evidenceHash,
        ]);
        return send(res, 201, { ok: true, incidentId, onchain });
      }

      return send(res, 201, { ok: true, incidentId, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/affected-users") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId) {
        return send(res, 400, { error: "protocolId and incidentId required" });
      }
      if (!body.walletsCsv || !body.amountsCsv) {
        return send(res, 400, { error: "walletsCsv and amountsCsv required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("attach_affected_users", [
          body.incidentId,
          body.walletsCsv,
          body.amountsCsv,
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/challenge/open") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId) {
        return send(res, 400, { error: "protocolId and incidentId required" });
      }
      const challengeEndsTs = Number(body.challengeEndsTs);
      if (!challengeEndsTs) {
        return send(res, 400, { error: "challengeEndsTs required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("open_challenge_window", [
          body.incidentId,
          challengeEndsTs,
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/dispute") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId || !body.wallet) {
        return send(res, 400, { error: "protocolId, incidentId, wallet required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("raise_dispute", [
          body.incidentId,
          body.wallet,
          body.evidenceHash || "",
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/dispute/resolve") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId || !body.wallet || !body.decision) {
        return send(res, 400, { error: "protocolId, incidentId, wallet, decision required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("resolve_dispute", [
          body.incidentId,
          body.wallet,
          body.decision,
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/finalize") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId) {
        return send(res, 400, { error: "protocolId and incidentId required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });
      const nowTs = Math.floor(Date.now() / 1000);

      if (LIVE_MODE) {
        const onchain = await contractWrite("finalize_incident", [body.incidentId, nowTs]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/payout-batch") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId) {
        return send(res, 400, { error: "protocolId and incidentId required" });
      }
      const startIndex = Number(body.startIndex ?? 0);
      const limit = Number(body.limit ?? 20);
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });
      const nowTs = Math.floor(Date.now() / 1000);

      if (LIVE_MODE) {
        const onchain = await contractWrite("execute_payout_batch", [
          body.incidentId,
          body.protocolId,
          startIndex,
          limit,
          nowTs,
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/security-incidents/create") {
      const body = await readBody(req);
      if (!body.protocolId) return send(res, 400, { error: "protocolId required" });
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      const incidentId = body.incidentId || `sec-${Date.now()}`;
      const startTs = Number(body.startTs || Math.floor(Date.now() / 1000));
      const evidenceHash = body.evidenceHash || "";
      const lastCleanBlock = Number(body.lastCleanBlock || 0);
      const triggerSourcesCsv = body.triggerSourcesCsv || "";

      if (LIVE_MODE) {
        const onchain = await contractWrite("create_security_incident", [
          incidentId,
          body.protocolId,
          startTs,
          evidenceHash,
          lastCleanBlock,
          triggerSourcesCsv,
        ]);
        return send(res, 201, { ok: true, incidentId, onchain });
      }

      return send(res, 201, { ok: true, incidentId, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/security-incidents/loss-snapshot") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId || !body.walletsCsv || !body.lossesCsv) {
        return send(res, 400, { error: "protocolId, incidentId, walletsCsv, lossesCsv required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("attach_loss_snapshot", [
          body.incidentId,
          body.walletsCsv,
          body.lossesCsv,
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/security-incidents/recovery/record") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId || body.amount === undefined) {
        return send(res, 400, { error: "protocolId, incidentId, amount required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("record_recovery", [
          body.incidentId,
          Number(body.amount),
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/security-incidents/recovery/distribute") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId) {
        return send(res, 400, { error: "protocolId and incidentId required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });
      const startIndex = Number(body.startIndex ?? 0);
      const limit = Number(body.limit ?? 20);

      if (LIVE_MODE) {
        const onchain = await contractWrite("distribute_recovery_batch", [
          body.incidentId,
          startIndex,
          limit,
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/security-incidents/response-score") {
      const body = await readBody(req);
      if (!body.protocolId || !body.incidentId) {
        return send(res, 400, { error: "protocolId and incidentId required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("set_hack_response_scores", [
          body.incidentId,
          Number(body.responseSpeed ?? 0),
          Number(body.communicationQuality ?? 0),
          Number(body.poolAdequacy ?? 0),
          Number(body.postMortemQuality ?? 0),
          Number(body.recoveryEffort ?? 0),
        ]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/commitments/register") {
      const body = await readBody(req);
      if (!body.protocolId || !body.commitmentId || !body.commitmentType || !body.deadlineTs) {
        return send(res, 400, { error: "protocolId, commitmentId, commitmentType, deadlineTs required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      const commitment = upsertCommitment({
        protocolId: body.protocolId,
        commitmentId: body.commitmentId,
        commitmentType: body.commitmentType,
        sourceUrl: body.sourceUrl || "",
        commitmentTextHash: body.commitmentTextHash || "",
        deadlineTs: Number(body.deadlineTs),
        verificationRule: body.verificationRule || "",
        status: "registered",
      });

      if (LIVE_MODE) {
        const onchain = await contractWrite("register_commitment", [
          body.commitmentId,
          body.protocolId,
          body.commitmentType,
          body.sourceUrl || "",
          body.commitmentTextHash || "",
          Number(body.deadlineTs),
          body.verificationRule || "",
        ]);
        return send(res, 201, { ok: true, commitment, onchain });
      }

      return send(res, 201, { ok: true, commitment, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/commitments/evaluate") {
      const body = await readBody(req);
      if (!body.protocolId || !body.commitmentId || !body.result) {
        return send(res, 400, { error: "protocolId, commitmentId, result required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });
      const nowTs = Math.floor(Date.now() / 1000);

      const commitment = upsertCommitment({
        protocolId: body.protocolId,
        commitmentId: body.commitmentId,
        result: body.result,
        evidenceHash: body.evidenceHash || "",
        status: "evaluated",
      });

      if (LIVE_MODE) {
        const onchain = await contractWrite("evaluate_commitment", [
          body.commitmentId,
          body.result,
          body.evidenceHash || "",
          nowTs,
        ]);
        return send(res, 200, { ok: true, commitment, onchain });
      }

      return send(res, 200, { ok: true, commitment, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/commitments/evidence") {
      const body = await readBody(req);
      if (!body.protocolId || !body.commitmentId) {
        return send(res, 400, { error: "protocolId and commitmentId required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      const commitment = upsertCommitment({
        protocolId: body.protocolId,
        commitmentId: body.commitmentId,
        evidenceHash: body.evidenceHash || "",
        status: "evidence_submitted",
      });

      if (LIVE_MODE) {
        const onchain = await contractWrite("submit_commitment_fulfillment_evidence", [
          body.commitmentId,
          body.evidenceHash || "",
        ]);
        return send(res, 200, { ok: true, commitment, onchain });
      }

      return send(res, 200, { ok: true, commitment, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/commitments/finalize") {
      const body = await readBody(req);
      if (!body.protocolId || !body.commitmentId) {
        return send(res, 400, { error: "protocolId and commitmentId required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });
      const nowTs = Math.floor(Date.now() / 1000);

      const commitment = upsertCommitment({
        protocolId: body.protocolId,
        commitmentId: body.commitmentId,
        status: "finalized",
      });

      if (LIVE_MODE) {
        const onchain = await contractWrite("finalize_commitment", [body.commitmentId, nowTs]);
        return send(res, 200, { ok: true, commitment, onchain });
      }

      return send(res, 200, { ok: true, commitment, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/incidents/decision") {
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

    if (req.method === "GET" && pathname === "/v1/incidents") {
      if (hasInternalAccess(req) || hasAdminSession(req)) return send(res, 200, { items: db.incidents });
      const session = getSession(req);
      if (!session) return send(res, 401, { error: "session required" });
      const owned = listProtocolsByOwnerWallet(session.wallet).map((p) => p.id);
      const items = db.incidents.filter((i) => owned.includes(i.protocolId));
      return send(res, 200, { items });
    }

    if (req.method === "POST" && pathname === "/v1/pools/deposit") {
      const body = await readBody(req);
      if (!body.protocolId || body.amount === undefined) {
        return send(res, 400, { error: "protocolId and amount required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

      if (LIVE_MODE) {
        const onchain = await contractWrite("deposit", [body.protocolId, Number(body.amount)]);
        return send(res, 200, { ok: true, onchain });
      }

      return send(res, 200, { ok: true, mode: "local" });
    }

    if (req.method === "POST" && pathname === "/v1/enforcement/execute") {
      const body = await readBody(req);
      if (!body.incidentId || !body.protocolId || body.totalAmount === undefined) {
        return send(res, 400, { error: "incidentId, protocolId, totalAmount required" });
      }
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

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

    if (req.method === "POST" && pathname === "/v1/reputation/recompute") {
      const body = await readBody(req);
      if (!body.protocolId) return send(res, 400, { error: "protocolId required" });
      const authz = enforceProtocolOwnership(req, body.protocolId);
      if (!authz.ok) return send(res, authz.status, { error: authz.error });

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

    if (req.method === "GET" && pathname === "/v1/reputation/protocols") {
      const visibleProtocols = hasInternalAccess(req) || hasAdminSession(req)
        ? db.protocols
        : (() => {
            const session = getSession(req);
            if (!session) return [];
            return listProtocolsByOwnerWallet(session.wallet);
          })();

      if (!(hasInternalAccess(req) || hasAdminSession(req)) && visibleProtocols.length === 0) {
        const session = getSession(req);
        if (!session) return send(res, 401, { error: "session required" });
      }

      const items = visibleProtocols.map((p) => {
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
