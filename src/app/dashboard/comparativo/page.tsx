"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import type { RouteStats } from "@/lib/dados";

const COLORS = ["#1649FF", "#6788FF", "#10B981", "#F59E0B", "#EF4444"];

export default function ComparativoPage() {
  const [stats, setStats] = useState<RouteStats[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dados?type=stats&days=${days}`);
      const data = await res.json();
      setStats(data);
    } catch {
      console.error("Erro ao carregar comparativo");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = stats
    .filter((s) => s.avg_price)
    .map((s) => ({
      name: `${s.origin}→${s.destination}`,
      min: Number(s.min_price),
      avg: Number(s.avg_price),
      max: Number(s.max_price),
    }));

  if (loading) {
    return <p className="text-text-muted">Carregando comparativo...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text font-[family-name:var(--font-manrope)]">
          Comparativo entre Rotas
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Período"
        >
          <option value={7}>7 dias</option>
          <option value={14}>14 dias</option>
          <option value={30}>30 dias</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <Card>
          <p className="text-text-muted text-center py-8">
            Sem dados para comparar. Adicione rotas e extraia dados primeiro.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Preços por Rota"
              description="Comparação de preço mínimo, médio e máximo"
            />
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      min: "Mínimo",
                      avg: "Média",
                      max: "Máximo",
                    };
                    return [
                      `R$ ${Number(value).toFixed(2)}`,
                      labels[String(name)] || String(name),
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      min: "Mínimo",
                      avg: "Média",
                      max: "Máximo",
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="min" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg" fill="#1649FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardHeader title="Detalhes por Rota" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Rota</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Coletas</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Mínimo</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Média</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Máximo</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Companhias</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.route_id} className="border-b border-border/50 hover:bg-background/50">
                      <td className="py-2 px-3 font-medium text-text">
                        {stat.origin} → {stat.destination}
                      </td>
                      <td className="py-2 px-3 text-right text-text-muted">{stat.total_snapshots}</td>
                      <td className="py-2 px-3 text-right text-success">
                        {stat.min_price ? `R$ ${Number(stat.min_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-text">
                        {stat.avg_price ? `R$ ${Number(stat.avg_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-danger">
                        {stat.max_price ? `R$ ${Number(stat.max_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-text-muted">{stat.airline_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
