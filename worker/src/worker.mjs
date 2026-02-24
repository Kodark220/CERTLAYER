const WORKER_NAME = process.env.WORKER_NAME || "certlayer-worker";
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 60000);
const API_BASE_URL = (process.env.API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

async function tick() {
  const now = new Date().toISOString();
  try {
    const protocols = await fetchJson(`${API_BASE_URL}/v1/protocols`);
    for (const protocol of protocols.items || []) {
      if (Math.random() < 0.15) {
        await fetchJson(`${API_BASE_URL}/v1/incidents`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            protocolId: protocol.id,
            severity: "medium",
            summary: `Automated monitoring detected SLA anomaly at ${now}`,
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
