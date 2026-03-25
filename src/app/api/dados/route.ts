import { NextRequest, NextResponse } from "next/server";
import { getFlightData, getAirlineRankings, getRouteStats } from "@/lib/dados";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("route_id") || undefined;
    const days = parseInt(searchParams.get("days") || "30", 10);
    const type = searchParams.get("type") || "all";

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Período deve ser entre 1 e 365 dias" },
        { status: 400 }
      );
    }

    switch (type) {
      case "flights":
        return NextResponse.json(await getFlightData(routeId, days));
      case "rankings":
        return NextResponse.json(await getAirlineRankings(routeId, days));
      case "stats":
        return NextResponse.json(await getRouteStats(days));
      case "all":
      default: {
        const [flights, rankings, stats] = await Promise.all([
          getFlightData(routeId, days),
          getAirlineRankings(routeId, days),
          getRouteStats(days),
        ]);
        return NextResponse.json({ flights, rankings, stats });
      }
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    );
  }
}
