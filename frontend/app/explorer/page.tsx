"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ExplorerRow = {
  protocolId: string;
  name: string;
  protocolType: string;
  uptimeBps: number;
  score: number;
  grade: string;
  incidentCount: number;
  openIncidentCount: number;
  updatedAt: string | null;
};

export default function ExplorerPage() {
  const [items, setItems] = useState<ExplorerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE_URL}/v1/public/reputation`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load explorer");
        }
        setItems(data.items || []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load explorer";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.score - a.score);
  }, [items]);

  return (
    <main className="shell grid" style={{ gap: 16 }}>
      <section className="card">
        <h1>Public Reputation Explorer</h1>
        <p>Verified reliability view across onboarded protocols.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/">
            <button>Back Home</button>
          </Link>
        </div>
      </section>

      <section className="card">
        {loading ? <p>Loading explorer...</p> : null}
        {error ? <p style={{ color: "#ff9d9d" }}>{error}</p> : null}
        {!loading && !error ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Uptime</th>
                  <th>Incidents</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No protocols published yet.</td>
                  </tr>
                ) : (
                  sorted.map((row) => (
                    <tr key={row.protocolId}>
                      <td>{row.name || row.protocolId}</td>
                      <td>{row.protocolType}</td>
                      <td>{row.score}</td>
                      <td>{row.grade}</td>
                      <td>{(row.uptimeBps / 100).toFixed(2)}%</td>
                      <td>{row.incidentCount}</td>
                      <td>{row.openIncidentCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

