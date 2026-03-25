"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FlightDataPoint } from "@/lib/dados";

interface PriceEvolutionProps {
  data: FlightDataPoint[];
}

const COLORS = [
  "#1649FF",
  "#6788FF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export function PriceEvolution({ data }: PriceEvolutionProps) {
  if (data.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">
        Sem dados para exibir. Extraia dados de alguma rota primeiro.
      </p>
    );
  }

  // Agrupar por data e companhia (menor preço do dia por companhia)
  const grouped = new Map<string, Map<string, number>>();
  const airlines = new Set<string>();

  for (const point of data) {
    if (!point.price) continue;
    airlines.add(point.airline);

    if (!grouped.has(point.date)) {
      grouped.set(point.date, new Map());
    }
    const dateMap = grouped.get(point.date)!;
    const current = dateMap.get(point.airline);
    if (!current || point.price < current) {
      dateMap.set(point.airline, point.price);
    }
  }

  const chartData = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, airlineMap]) => {
      const entry: Record<string, string | number> = {
        date: date.slice(5), // MM-DD
      };
      for (const [airline, price] of airlineMap) {
        entry[airline] = price;
      }
      return entry;
    });

  const airlineList = Array.from(airlines);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
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
          formatter={(value) =>
            `R$ ${Number(value).toFixed(2)}`
          }
          labelFormatter={(label) => `Data: ${label}`}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
          }}
        />
        <Legend />
        {airlineList.map((airline, i) => (
          <Line
            key={airline}
            type="monotone"
            dataKey={airline}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
