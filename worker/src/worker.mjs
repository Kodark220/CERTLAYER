import { createHash } from "node:crypto";

const WORKER_NAME = process.env.WORKER_NAME || "certlayer-worker";
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 60000);
const RESPONSE_TIMEOUT_MS = Number(process.env.WORKER_RESPONSE_TIMEOUT_MS || 8000);
const SLOW_RESPONSE_MS = Number(process.env.WORKER_SLOW_RESPONSE_MS || 4000);
const API_BASE_URL = (process.env.API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const API_KEY = process.env.API_KEY || "";

async function fetchJson(url, options) {
  const headers = new Headers(options?.headers || {});
  if (API_KEY) headers.set("x-api-key", API_KEY);
  const res = await fetch(url, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

async function probeProtocol(protocol) {
  if (!protocol.website) {
    return {
      ok: false,
      summary: "Protocol website missing from registry",
      severity: "low",
      evidence: [{
        sourceType: "registry_metadata",
        sourceRef: protocol.id,
        observedAt: new Date().toISOString(),
        payload: { missingField: "website" },
      }],
    };
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(protocol.website, {
      method: "GET",
      signal: AbortSignal.timeout(RESPONSE_TIMEOUT_MS),
    });
    const durationMs = Date.now() - startedAt;
    const evidence = [{
      sourceType: "http_probe",
      sourceRef: protocol.website,
      observedAt: new Date().toISOString(),
      payload: {
        status: response.status,
        ok: response.ok,
        durationMs,
      },
    }];

    if (!response.ok) {
      return {
        ok: false,
        summary: `HTTP probe failed with status ${response.status}`,
        severity: response.status >= 500 ? "high" : "medium",
        evidence,
      };
    }

    if (durationMs >= SLOW_RESPONSE_MS) {
      return {
        ok: false,
        summary: `HTTP probe exceeded latency threshold (${durationMs}ms)`,
        severity: "medium",
        evidence,
      };
    }

    return { ok: true, evidence };
  } catch (error) {
    return {
      ok: false,
      summary: "HTTP probe failed to complete",
      severity: "high",
      evidence: [{
        sourceType: "http_probe",
        sourceRef: protocol.website,
        observedAt: new Date().toISOString(),
        payload: {
          error: error instanceof Error ? error.message : String(error),
          timeoutMs: RESPONSE_TIMEOUT_MS,
        },
      }],
    };
  }
}

function buildIncidentId(protocolId, summary, evidence) {
  const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ protocolId, summary, evidence, bucket }))
    .digest("hex")
    .slice(0, 16);
  return `inc-${fingerprint}`;
}

async function tick() {
  const now = new Date().toISOString();
  try {
    const protocols = await fetchJson(`${API_BASE_URL}/v1/protocols`);
    for (const protocol of protocols.items || []) {
      const probe = await probeProtocol(protocol);
      if (!probe.ok) {
        const incidentId = buildIncidentId(protocol.id, probe.summary, probe.evidence);
        const evidenceHash = createHash("sha256")
          .update(JSON.stringify(probe.evidence))
          .digest("hex");
        await fetchJson(`${API_BASE_URL}/v1/incidents`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: incidentId,
            protocolId: protocol.id,
            severity: probe.severity,
            summary: `${probe.summary} (${now})`,
            evidenceHash,
            confidence: probe.severity === "high" ? 90 : 75,
            evidence: probe.evidence,
          }),
        });
      }
    }
    console.log(`[${WORKER_NAME}] tick=${now} protocols=${(protocols.items || []).length}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${WORKER_NAME}] tick=${now} error=${message}`);
  }
}

console.log(`[${WORKER_NAME}] started interval=${INTERVAL_MS}ms api=${API_BASE_URL}`);
void tick();
setInterval(() => void tick(), INTERVAL_MS);
