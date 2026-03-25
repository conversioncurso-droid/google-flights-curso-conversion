import { NextRequest, NextResponse } from "next/server";
import { collectRoute, collectAllRoutes, cleanupOldSnapshots } from "@/lib/collect";
import { getRoute } from "@/lib/routes";

// POST — extração manual (do dashboard) ou cron
export async function POST(request: NextRequest) {
  try {
    // Verificar se é chamada do cron
    const cronSecret = request.headers.get("x-cron-secret");
    const isCron = cronSecret === process.env.CRON_SECRET;

    // Se não for cron, verificar autenticação (middleware já cuida)
    // Se for cron sem secret válido, rejeitar
    if (cronSecret && !isCron) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const routeId = (body as { route_id?: string }).route_id;

    let results;

    if (routeId) {
      // Extrair rota específica
      const route = await getRoute(routeId);
      if (!route) {
        return NextResponse.json(
          { error: "Rota não encontrada" },
          { status: 404 }
        );
      }
      if (!route.active) {
        return NextResponse.json(
          { error: "Rota está desativada" },
          { status: 400 }
        );
      }
      const result = await collectRoute(route);
      results = [result];
    } else {
      // Extrair todas as rotas ativas
      results = await collectAllRoutes();
    }

    // Limpeza de snapshots antigos (se for cron)
    let cleaned = 0;
    if (isCron) {
      cleaned = await cleanupOldSnapshots();
    }

    return NextResponse.json({
      results,
      cleaned_snapshots: cleaned,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro na coleta:", error);
    return NextResponse.json(
      { error: "Erro interno na coleta" },
      { status: 500 }
    );
  }
}
