"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FlightDataPoint } from "@/lib/dados";

interface PriceVariationProps {
  data: FlightDataPoint[];
}

export function PriceVariation({ data }: PriceVariationProps) {
  if (data.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">
        Sem dados de variação disponíveis.
      </p>
    );
  }

  // Agrupar por data: min, max, avg
  const grouped = new Map<string, number[]>();
  for (const point of data) {
    if (!point.price) continue;
    if (!grouped.has(point.date)) grouped.set(point.date, []);
    grouped.get(point.date)!.push(point.price);
  }

  const chartData = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, prices]) => ({
      date: date.slice(5),
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#64748B" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748B" }}
          tickLine={false}
          tickFormatter={(v) => `R$${v}`}
        />
        <Tooltip
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              min: "Mínimo",
              max: "Máximo",
              avg: "Média",
            };
            return [`R$ ${Number(value).toFixed(2)}`, labels[String(name)] || String(name)];
          }}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
          }}
        />
        <Area
          type="monotone"
          dataKey="max"
          stroke="#EF4444"
          fill="#EF4444"
          fillOpacity={0.1}
          strokeWidth={1}
        />
        <Area
          type="monotone"
          dataKey="avg"
          stroke="#1649FF"
          fill="#1649FF"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="min"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.1}
          strokeWidth={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
