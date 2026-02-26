"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "../../src/components/layout/PageHeader";
import { PageShell } from "../../src/components/layout/PageShell";

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
    <PageShell>
      <PageHeader
        title="Public Reputation Explorer"
        description="Verified reliability view across onboarded protocols."
        actions={
          <Button asChild variant="outline">
            <Link href="/">Back Home</Link>
          </Button>
        }
      />

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Protocol Reputation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading explorer...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error ? (
            <div className="overflow-x-auto rounded-md border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Protocol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Grade</TableHead>
                    <TableHead className="text-right">Uptime</TableHead>
                    <TableHead className="text-right">Incidents</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-sm text-muted-foreground">
                        No protocols published yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((row) => (
                      <TableRow key={row.protocolId} className="transition-colors hover:bg-muted/30">
                        <TableCell className="font-semibold">{row.name || row.protocolId}</TableCell>
                        <TableCell>{row.protocolType}</TableCell>
                        <TableCell className="text-right">{row.score}</TableCell>
                        <TableCell className="text-right">{row.grade}</TableCell>
                        <TableCell className="text-right">{(row.uptimeBps / 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{row.incidentCount}</TableCell>
                        <TableCell className="text-right">{row.openIncidentCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}

