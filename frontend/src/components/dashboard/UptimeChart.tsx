"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const uptimeData = [
  { date: "Dec 1", uptime: 99.98 },
  { date: "Dec 15", uptime: 99.96 },
  { date: "Jan 1", uptime: 97.2 },
  { date: "Jan 15", uptime: 99.84 },
  { date: "Feb 1", uptime: 99.9 },
  { date: "Feb 25", uptime: 99.82 },
];

export function UptimeChart({ previewUptime }: { previewUptime?: number }) {
  const chartData = previewUptime
    ? uptimeData.map((point) => (point.date === "Jan 15" ? { ...point, uptime: previewUptime } : point))
    : uptimeData;

  return (
    <div className="h-44 min-h-[176px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2a76f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2a76f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" stroke="rgba(231,237,247,0.5)" tick={{ fontSize: 11 }} />
          <YAxis domain={[95, 100]} stroke="rgba(231,237,247,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(14,22,35,0.96)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#e7edf7",
            }}
          />
          <Area type="monotone" dataKey="uptime" stroke="#2a76f6" strokeWidth={2} fill="url(#uptimeGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
