export const db = {
  protocols: [],
  incidents: [],
  scores: [],
  commitments: [],
};

export function ensureProtocol(payload) {
  const ownerWallet = (payload.ownerWallet || "").toLowerCase();
  const protocol = {
    id: payload.id || `proto-${Date.now()}`,
    name: payload.name || "Unnamed Protocol",
    website: payload.website || "",
    protocolType: payload.protocolType || "other",
    uptimeBps: Number(payload.uptimeBps || 9990),
    coveragePoolUsdc: Number(payload.coveragePoolUsdc || 0),
    ownerWallet,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.protocols.push(protocol);
  return protocol;
}

export function addProtocolPool(protocolId, amount) {
  const protocol = findProtocol(protocolId);
  if (!protocol) return null;
  protocol.coveragePoolUsdc = Number(protocol.coveragePoolUsdc || 0) + Number(amount || 0);
  protocol.updatedAt = new Date().toISOString();
  return protocol;
}

export function findProtocol(protocolId) {
  return db.protocols.find((p) => p.id === protocolId) || null;
}

export function listProtocolsByOwnerWallet(ownerWallet) {
  const wallet = (ownerWallet || "").toLowerCase();
  return db.protocols.filter((p) => (p.ownerWallet || "").toLowerCase() === wallet);
}

export function updateProtocol(protocolId, patch) {
  const protocol = findProtocol(protocolId);
  if (!protocol) return null;

  if (patch.name !== undefined) protocol.name = patch.name;
  if (patch.website !== undefined) protocol.website = patch.website;
  if (patch.protocolType !== undefined) protocol.protocolType = patch.protocolType;
  if (patch.uptimeBps !== undefined) protocol.uptimeBps = Number(patch.uptimeBps);
  protocol.updatedAt = new Date().toISOString();
  return protocol;
}

export function addIncident(payload) {
  const incident = {
    id: payload.id || `inc-${Date.now()}`,
    protocolId: payload.protocolId,
    status: payload.status || "open",
    severity: payload.severity || "medium",
    summary: payload.summary || "SLA anomaly detected",
    createdAt: new Date().toISOString(),
  };
  db.incidents.push(incident);
  return incident;
}

export function upsertScore(protocolId, score, grade) {
  const existing = db.scores.find((s) => s.protocolId === protocolId);
  if (existing) {
    existing.score = score;
    existing.grade = grade;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const created = {
    protocolId,
    score,
    grade,
    updatedAt: new Date().toISOString(),
  };
  db.scores.push(created);
  return created;
}

export function upsertCommitment(payload) {
  const now = new Date().toISOString();
  const existing = db.commitments.find(
    (c) => c.protocolId === payload.protocolId && c.commitmentId === payload.commitmentId
  );

  if (existing) {
    if (payload.commitmentType !== undefined) existing.commitmentType = payload.commitmentType;
    if (payload.sourceUrl !== undefined) existing.sourceUrl = payload.sourceUrl;
    if (payload.commitmentTextHash !== undefined) existing.commitmentTextHash = payload.commitmentTextHash;
    if (payload.amount !== undefined) existing.amount = Number(payload.amount);
    if (payload.asset !== undefined) existing.asset = payload.asset;
    if (payload.deadlineTs !== undefined) existing.deadlineTs = Number(payload.deadlineTs);
    if (payload.verificationRule !== undefined) existing.verificationRule = payload.verificationRule;
    if (payload.result !== undefined) existing.result = payload.result;
    if (payload.evidenceHash !== undefined) existing.evidenceHash = payload.evidenceHash;
    if (payload.status !== undefined) existing.status = payload.status;
    existing.updatedAt = now;
    return existing;
  }

  const created = {
    protocolId: payload.protocolId,
    commitmentId: payload.commitmentId,
    commitmentType: payload.commitmentType || "other",
    sourceUrl: payload.sourceUrl || "",
    commitmentTextHash: payload.commitmentTextHash || "",
    amount: Number(payload.amount || 0),
    asset: payload.asset || "USDC",
    deadlineTs: Number(payload.deadlineTs || 0),
    verificationRule: payload.verificationRule || "",
    result: payload.result || "",
    evidenceHash: payload.evidenceHash || "",
    status: payload.status || "registered",
    createdAt: now,
    updatedAt: now,
  };
  db.commitments.push(created);
  return created;
}

export function listCommitmentsByProtocol(protocolId) {
  return db.commitments.filter((c) => c.protocolId === protocolId);
}
