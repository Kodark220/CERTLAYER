import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.CERTLAYER_DATA_DIR || resolve(MODULE_DIR, "..", "data");
const EVENT_LOG_PATH = resolve(DATA_DIR, "event-log.jsonl");

export const db = {
  protocols: [],
  incidents: [],
  scores: [],
  commitments: [],
  evidence: [],
  enforcement: [],
  events: [],
};

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizeWallet(wallet) {
  return String(wallet || "").trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function incidentFingerprint(payload) {
  const evidence = Array.isArray(payload.evidence) ? payload.evidence : [];
  const normalizedEvidence = evidence
    .map((item) => JSON.stringify(item))
    .sort()
    .join("|");
  return createHash("sha256")
    .update([payload.protocolId || "", payload.summary || "", payload.evidenceHash || "", normalizedEvidence].join("|"))
    .digest("hex")
    .slice(0, 16);
}

function loadEvents() {
  ensureDataDir();
  if (!existsSync(EVENT_LOG_PATH)) {
    return [];
  }

  const raw = readFileSync(EVENT_LOG_PATH, "utf8").trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function updateCollection(target, items) {
  target.length = 0;
  target.push(...items);
}

function projectEvents(events) {
  const protocols = new Map();
  const incidents = new Map();
  const scores = new Map();
  const commitments = new Map();
  const evidence = [];
  const enforcement = [];

  for (const event of events) {
    const payload = event.payload || {};

    if (event.type === "protocol_registered") {
      protocols.set(payload.id, {
        id: payload.id,
        name: payload.name,
        website: payload.website,
        protocolType: payload.protocolType,
        uptimeBps: Number(payload.uptimeBps || 0),
        coveragePoolUsdc: Number(payload.coveragePoolUsdc || 0),
        compensationPaidUsdc: Number(payload.compensationPaidUsdc || 0),
        ownerWallet: normalizeWallet(payload.ownerWallet),
        contractAddress: payload.contractAddress || "",
        status: payload.status || "active",
        createdAt: payload.createdAt || event.at,
        updatedAt: payload.updatedAt || event.at,
      });
      continue;
    }

    if (event.type === "protocol_updated") {
      const protocol = protocols.get(payload.protocolId);
      if (!protocol) continue;
      if (payload.name !== undefined) protocol.name = payload.name;
      if (payload.website !== undefined) protocol.website = payload.website;
      if (payload.protocolType !== undefined) protocol.protocolType = payload.protocolType;
      if (payload.uptimeBps !== undefined) protocol.uptimeBps = Number(payload.uptimeBps);
      if (payload.contractAddress !== undefined) protocol.contractAddress = payload.contractAddress || "";
      if (payload.status !== undefined) protocol.status = payload.status;
      protocol.updatedAt = payload.updatedAt || event.at;
      continue;
    }

    if (event.type === "protocol_pool_deposited") {
      const protocol = protocols.get(payload.protocolId);
      if (!protocol) continue;
      protocol.coveragePoolUsdc = Number(protocol.coveragePoolUsdc || 0) + Number(payload.amount || 0);
      protocol.updatedAt = payload.updatedAt || event.at;
      continue;
    }

    if (event.type === "incident_candidate_recorded" || event.type === "security_incident_recorded") {
      incidents.set(payload.id, {
        id: payload.id,
        protocolId: payload.protocolId,
        status: payload.status || "candidate",
        severity: payload.severity || "medium",
        summary: payload.summary || "",
        type: payload.type || (event.type === "security_incident_recorded" ? "security" : "availability"),
        evidenceHash: payload.evidenceHash || "",
        createdAt: payload.createdAt || event.at,
        updatedAt: payload.updatedAt || event.at,
        evidenceCount: Number(payload.evidenceCount || 0),
        confidence: payload.confidence ?? null,
      });
      continue;
    }

    if (event.type === "incident_status_updated") {
      const incident = incidents.get(payload.incidentId);
      if (!incident) continue;
      if (payload.status !== undefined) incident.status = payload.status;
      if (payload.summary !== undefined) incident.summary = payload.summary;
      incident.updatedAt = payload.updatedAt || event.at;
      continue;
    }

    if (event.type === "incident_evidence_recorded") {
      evidence.push({
        id: payload.id,
        incidentId: payload.incidentId,
        sourceType: payload.sourceType || "unknown",
        sourceRef: payload.sourceRef || "",
        observedAt: payload.observedAt || event.at,
        payload: payload.payload || {},
        createdAt: payload.createdAt || event.at,
      });
      const incident = incidents.get(payload.incidentId);
      if (incident) {
        incident.evidenceCount = Number(incident.evidenceCount || 0) + 1;
        incident.updatedAt = payload.createdAt || event.at;
      }
      continue;
    }

    if (event.type === "score_recomputed") {
      scores.set(payload.protocolId, {
        protocolId: payload.protocolId,
        score: Number(payload.score || 0),
        grade: payload.grade || "N/A",
        updatedAt: payload.updatedAt || event.at,
      });
      continue;
    }

    if (event.type === "commitment_upserted") {
      const key = `${payload.protocolId}:${payload.commitmentId}`;
      const existing = commitments.get(key) || {
        protocolId: payload.protocolId,
        commitmentId: payload.commitmentId,
        commitmentType: "other",
        sourceUrl: "",
        commitmentTextHash: "",
        amount: 0,
        asset: "USDC",
        deadlineTs: 0,
        verificationRule: "",
        result: "",
        evidenceHash: "",
        status: "registered",
        createdAt: payload.createdAt || event.at,
        updatedAt: payload.updatedAt || event.at,
      };
      commitments.set(key, {
        ...existing,
        ...payload,
        amount: payload.amount !== undefined ? Number(payload.amount) : Number(existing.amount || 0),
        deadlineTs: payload.deadlineTs !== undefined ? Number(payload.deadlineTs) : Number(existing.deadlineTs || 0),
        updatedAt: payload.updatedAt || event.at,
      });
      continue;
    }

    if (event.type === "enforcement_executed") {
      enforcement.push({
        id: payload.id,
        protocolId: payload.protocolId,
        incidentId: payload.incidentId,
        totalAmount: Number(payload.totalAmount || 0),
        txHash: payload.txHash || "",
        createdAt: payload.createdAt || event.at,
      });
      const protocol = protocols.get(payload.protocolId);
      if (protocol) {
        protocol.compensationPaidUsdc = Number(protocol.compensationPaidUsdc || 0) + Number(payload.totalAmount || 0);
        protocol.updatedAt = payload.createdAt || event.at;
      }
    }
  }

  updateCollection(db.protocols, Array.from(protocols.values()));
  updateCollection(db.incidents, Array.from(incidents.values()));
  updateCollection(db.scores, Array.from(scores.values()));
  updateCollection(db.commitments, Array.from(commitments.values()));
  updateCollection(db.evidence, evidence);
  updateCollection(db.enforcement, enforcement);
  updateCollection(db.events, events);
}

function appendEvent(type, payload) {
  ensureDataDir();
  const event = {
    id: randomUUID(),
    type,
    at: nowIso(),
    payload,
  };
  appendFileSync(EVENT_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
  db.events.push(event);
  projectEvents(db.events);
  return event;
}

projectEvents(loadEvents());

export function ensureProtocol(payload) {
  const protocolId = payload.id || `proto-${Date.now()}`;
  if (findProtocol(protocolId)) {
    throw new Error("protocol already exists");
  }

  appendEvent("protocol_registered", {
    id: protocolId,
    name: payload.name || "Unnamed Protocol",
    website: payload.website || "",
    protocolType: payload.protocolType || "other",
    uptimeBps: Number(payload.uptimeBps || 9990),
    coveragePoolUsdc: Number(payload.coveragePoolUsdc || 0),
    compensationPaidUsdc: 0,
    ownerWallet: normalizeWallet(payload.ownerWallet),
    contractAddress: payload.contractAddress || "",
    status: payload.status || "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return findProtocol(protocolId);
}

export function addProtocolPool(protocolId, amount) {
  const protocol = findProtocol(protocolId);
  if (!protocol) return null;
  appendEvent("protocol_pool_deposited", {
    protocolId,
    amount: Number(amount || 0),
    updatedAt: nowIso(),
  });
  return findProtocol(protocolId);
}

export function recordEnforcement(protocolId, incidentId, totalAmount, txHash = "") {
  appendEvent("enforcement_executed", {
    id: randomUUID(),
    protocolId,
    incidentId,
    totalAmount: Number(totalAmount || 0),
    txHash,
    createdAt: nowIso(),
  });
}

export function findProtocol(protocolId) {
  return db.protocols.find((p) => p.id === protocolId) || null;
}

export function listProtocolsByOwnerWallet(ownerWallet) {
  const wallet = normalizeWallet(ownerWallet);
  return db.protocols.filter((p) => normalizeWallet(p.ownerWallet) === wallet);
}

export function updateProtocol(protocolId, patch) {
  const protocol = findProtocol(protocolId);
  if (!protocol) return null;
  appendEvent("protocol_updated", {
    protocolId,
    name: patch.name,
    website: patch.website,
    protocolType: patch.protocolType,
    uptimeBps: patch.uptimeBps,
    contractAddress: patch.contractAddress,
    status: patch.status,
    updatedAt: nowIso(),
  });
  return findProtocol(protocolId);
}

export function addIncident(payload) {
  const incidentId = payload.id || `inc-${incidentFingerprint(payload)}`;
  const existing = db.incidents.find((item) => item.id === incidentId);
  if (existing) {
    return existing;
  }

  const type = payload.type === "security" ? "security_incident_recorded" : "incident_candidate_recorded";
  appendEvent(type, {
    id: incidentId,
    protocolId: payload.protocolId,
    status: payload.status || "candidate",
    severity: payload.severity || "medium",
    summary: payload.summary || "Evidence-backed incident candidate",
    type: payload.type || "availability",
    evidenceHash: payload.evidenceHash || "",
    confidence: payload.confidence ?? null,
    createdAt: payload.createdAt || nowIso(),
    updatedAt: payload.createdAt || nowIso(),
    evidenceCount: Array.isArray(payload.evidence) ? payload.evidence.length : 0,
  });

  const evidence = Array.isArray(payload.evidence) ? payload.evidence : [];
  for (const item of evidence) {
    appendEvent("incident_evidence_recorded", {
      id: randomUUID(),
      incidentId,
      sourceType: item.sourceType || "unknown",
      sourceRef: item.sourceRef || "",
      observedAt: item.observedAt || nowIso(),
      payload: item.payload || {},
      createdAt: nowIso(),
    });
  }

  return db.incidents.find((item) => item.id === incidentId) || null;
}

export function listIncidentEvidence(incidentId) {
  return db.evidence.filter((item) => item.incidentId === incidentId);
}

export function upsertScore(protocolId, score, grade) {
  appendEvent("score_recomputed", {
    protocolId,
    score: Number(score || 0),
    grade: grade || "N/A",
    updatedAt: nowIso(),
  });
  return db.scores.find((item) => item.protocolId === protocolId) || null;
}

export function upsertCommitment(payload) {
  appendEvent("commitment_upserted", {
    protocolId: payload.protocolId,
    commitmentId: payload.commitmentId,
    commitmentType: payload.commitmentType,
    sourceUrl: payload.sourceUrl,
    commitmentTextHash: payload.commitmentTextHash,
    amount: payload.amount,
    asset: payload.asset,
    deadlineTs: payload.deadlineTs,
    verificationRule: payload.verificationRule,
    result: payload.result,
    evidenceHash: payload.evidenceHash,
    status: payload.status,
    createdAt: payload.createdAt,
    updatedAt: nowIso(),
  });
  return db.commitments.find(
    (item) => item.protocolId === payload.protocolId && item.commitmentId === payload.commitmentId
  ) || null;
}

export function listCommitmentsByProtocol(protocolId) {
  return db.commitments.filter((c) => c.protocolId === protocolId);
}
