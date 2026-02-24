export const db = {
  protocols: [],
  incidents: [],
  scores: [],
};

export function ensureProtocol(payload) {
  const protocol = {
    id: payload.id || `proto-${Date.now()}`,
    name: payload.name || "Unnamed Protocol",
    website: payload.website || "",
    protocolType: payload.protocolType || "other",
    uptimeBps: Number(payload.uptimeBps || 9990),
    createdAt: new Date().toISOString(),
  };
  db.protocols.push(protocol);
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
