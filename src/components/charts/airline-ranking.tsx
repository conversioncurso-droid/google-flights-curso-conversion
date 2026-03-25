"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AirlineRanking as AirlineRankingType } from "@/lib/dados";

interface AirlineRankingProps {
  data: AirlineRankingType[];
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

export function AirlineRanking({ data }: AirlineRankingProps) {
  if (data.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">
        Sem dados de ranking disponíveis.
      </p>
    );
  }

  const chartData = data.slice(0, 10).map((d) => ({
    name: d.airline.length > 15 ? d.airline.slice(0, 15) + "…" : d.airline,
    fullName: d.airline,
    avg_price: Number(d.avg_price),
    flight_count: Number(d.flight_count),
    presence_count: Number(d.presence_count),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "#64748B" }}
          tickFormatter={(v) => `R$${v}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748B" }}
          width={130}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === "avg_price") return [`R$ ${Number(value).toFixed(2)}`, "Preço médio"];
            return [String(value), String(name)];
          }}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="avg_price" radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
