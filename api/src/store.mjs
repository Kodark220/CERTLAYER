export const db = {
  protocols: [],
  incidents: [],
  scores: [],
};

export function ensureProtocol(payload) {
  const ownerWallet = (payload.ownerWallet || "").toLowerCase();
  const protocol = {
    id: payload.id || `proto-${Date.now()}`,
    name: payload.name || "Unnamed Protocol",
    website: payload.website || "",
    protocolType: payload.protocolType || "other",
    uptimeBps: Number(payload.uptimeBps || 9990),
    ownerWallet,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.protocols.push(protocol);
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
