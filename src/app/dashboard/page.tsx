"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { PriceEvolution } from "@/components/charts/price-evolution";
import { AirlineRanking } from "@/components/charts/airline-ranking";
import { PriceVariation } from "@/components/charts/price-variation";
import type { FlightDataPoint, AirlineRanking as AirlineRankingType, RouteStats } from "@/lib/dados";
import type { Route } from "@/lib/routes";

interface DashboardData {
  flights: FlightDataPoint[];
  rankings: AirlineRankingType[];
  stats: RouteStats[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [extractingAll, setExtractingAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days), type: "all" });
      if (selectedRoute) params.set("route_id", selectedRoute);

      const [dadosRes, rotasRes] = await Promise.all([
        fetch(`/api/dados?${params}`),
        fetch("/api/rotas"),
      ]);

      const dados = await dadosRes.json();
      const rotasData = await rotasRes.json();

      if (dados && !dados.error) setData(dados);
      if (Array.isArray(rotasData)) setRoutes(rotasData);
    } catch {
      console.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [days, selectedRoute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleExtractAll() {
    setExtractingAll(true);
    try {
      await fetch("/api/coleta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setTimeout(fetchData, 2000);
    } catch {
      console.error("Erro na extração");
    } finally {
      setExtractingAll(false);
    }
  }

  // Calcular KPIs
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.active).length;
  const cheapestFlight = data?.flights?.length
    ? Math.min(...data.flights.filter((f) => f.price).map((f) => f.price))
    : 0;
  const avgPrice = data?.flights?.length
    ? data.flights
        .filter((f) => f.price)
        .reduce((acc, f) => acc + f.price, 0) /
      data.flights.filter((f) => f.price).length
    : 0;

  // Companhias com menor e maior presença
  const leastPresent = data?.rankings?.length
    ? data.rankings.reduce((a, b) =>
        Number(a.presence_count) < Number(b.presence_count) ? a : b
      )
    : null;
  const mostPresent = data?.rankings?.length
    ? data.rankings.reduce((a, b) =>
        Number(a.presence_count) > Number(b.presence_count) ? a : b
      )
    : null;

  if (loading && !data) {
    return <p className="text-text-muted">Carregando dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text font-[family-name:var(--font-manrope)]">
          Visão Geral
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Filtrar por rota"
          >
            <option value="">Todas as rotas</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.origin} → {r.destination}
              </option>
            ))}
          </select>

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

          <Button
            onClick={handleExtractAll}
            disabled={extractingAll}
            size="sm"
          >
            {extractingAll ? "Extraindo..." : "Extrair Todas"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Rotas Ativas"
          value={`${activeRoutes}/${totalRoutes}`}
          subtitle="monitoradas"
        />
        <StatCard
          label="Menor Preço"
          value={cheapestFlight ? `R$ ${cheapestFlight.toFixed(2)}` : "—"}
          variant="success"
          subtitle={`últimos ${days} dias`}
        />
        <StatCard
          label="Preço Médio"
          value={avgPrice ? `R$ ${avgPrice.toFixed(2)}` : "—"}
          subtitle={`últimos ${days} dias`}
        />
        <StatCard
          label="Companhias"
          value={String(data?.rankings?.length || 0)}
          subtitle="detectadas"
        />
      </div>

      {/* Presença das companhias */}
      {(mostPresent || leastPresent) && (
        <div className="grid grid-cols-2 gap-4">
          {mostPresent && (
            <StatCard
              label="Maior Presença"
              value={mostPresent.airline}
              subtitle={`${mostPresent.presence_count} dias | Preço médio: R$ ${Number(mostPresent.avg_price).toFixed(2)}`}
              variant="success"
            />
          )}
          {leastPresent && (
            <StatCard
              label="Menor Presença"
              value={leastPresent.airline}
              subtitle={`${leastPresent.presence_count} dias | Preço médio: R$ ${Number(leastPresent.avg_price).toFixed(2)}`}
              variant="warning"
            />
          )}
        </div>
      )}

      {/* Evolução de preços */}
      <Card>
        <CardHeader
          title="Evolução Diária de Preços"
          description="Menor preço por companhia aérea ao longo do tempo"
        />
        <PriceEvolution data={data?.flights || []} />
      </Card>

      {/* Ranking e Variação lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Ranking de Companhias"
            description="Preço médio por companhia aérea"
          />
          <AirlineRanking data={data?.rankings || []} />
        </Card>

        <Card>
          <CardHeader
            title="Variação de Preços"
            description="Faixa de preço diária (mín, média, máx)"
          />
          <PriceVariation data={data?.flights || []} />
        </Card>
      </div>

      {/* Resumo por rota */}
      {data?.stats && data.stats.length > 0 && (
        <Card>
          <CardHeader title="Resumo por Rota" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-muted font-medium">
                    Rota
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">
                    Coletas
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">
                    Preço Mín
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">
                    Preço Médio
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">
                    Preço Máx
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">
                    Companhias
                  </th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">
                    Última Coleta
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.stats.map((stat) => (
                  <tr
                    key={stat.route_id}
                    className="border-b border-border/50 hover:bg-background/50"
                  >
                    <td className="py-2 px-3 font-medium text-text">
                      {stat.origin} → {stat.destination}
                    </td>
                    <td className="py-2 px-3 text-right text-text-muted">
                      {stat.total_snapshots}
                    </td>
                    <td className="py-2 px-3 text-right text-success">
                      {stat.min_price
                        ? `R$ ${Number(stat.min_price).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right text-text">
                      {stat.avg_price
                        ? `R$ ${Number(stat.avg_price).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right text-danger">
                      {stat.max_price
                        ? `R$ ${Number(stat.max_price).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right text-text-muted">
                      {stat.airline_count}
                    </td>
                    <td className="py-2 px-3 text-right text-text-muted text-xs">
                      {stat.last_collection
                        ? new Date(stat.last_collection).toLocaleString("pt-BR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
