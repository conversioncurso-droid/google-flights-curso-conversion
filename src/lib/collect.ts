import { getDb } from "./db";
import { getGlobalConfig } from "./config";
import { fetchFlights, extractSearchParams } from "./serpapi";
import type { Route } from "./routes";
import type { SerpApiFlight, SerpApiFlightResult } from "./serpapi";

interface CollectResult {
  route_id: string;
  origin: string;
  destination: string;
  success: boolean;
  error?: string;
  flights_count?: number;
}

async function storeSnapshot(
  route: Route,
  data: SerpApiFlightResult,
  searchParams: Record<string, string>
): Promise<string> {
  const sql = getDb();

  // Criar snapshot
  const snapshotRows = await sql`
    INSERT INTO snapshots (route_id, raw_response, search_params)
    VALUES (${route.id}, ${JSON.stringify(data)}, ${JSON.stringify(searchParams)})
    RETURNING id
  `;
  const snapshotId = snapshotRows[0].id as string;

  // Extrair e armazenar voos individuais
  const allFlights: Array<{ flight: SerpApiFlight; group: string }> = [];

  if (data.best_flights) {
    data.best_flights.forEach((f) =>
      allFlights.push({ flight: f, group: "best" })
    );
  }
  if (data.other_flights) {
    data.other_flights.forEach((f) =>
      allFlights.push({ flight: f, group: "other" })
    );
  }

  for (let i = 0; i < allFlights.length; i++) {
    const { flight, group } = allFlights[i];
    const firstLeg = flight.flights?.[0];
    const airline = firstLeg?.airline || "Desconhecida";
    const flightNumber = firstLeg?.flight_number || null;
    const departureTime = firstLeg?.departure_airport?.time || null;
    const arrivalTime =
      flight.flights?.[flight.flights.length - 1]?.arrival_airport?.time ||
      null;
    const cabinClass = firstLeg?.travel_class || null;

    await sql`
      INSERT INTO snapshot_flights (
        snapshot_id, flight_group, position, airline, flight_number,
        price, currency, duration_minutes, stops, stop_details,
        departure_time, arrival_time, cabin_class,
        availability, promotions, legs
      ) VALUES (
        ${snapshotId},
        ${group},
        ${i + 1},
        ${airline},
        ${flightNumber},
        ${flight.price ? Math.round(flight.price * 100) : null},
        ${searchParams.currency || "BRL"},
        ${flight.total_duration || null},
        ${flight.layovers?.length || 0},
        ${flight.layovers ? JSON.stringify(flight.layovers) : null},
        ${departureTime},
        ${arrivalTime},
        ${cabinClass},
        ${null},
        ${null},
        ${JSON.stringify(flight.flights)}
      )
    `;
  }

  return snapshotId;
}

export async function collectRoute(route: Route): Promise<CollectResult> {
  try {
    const globalConfig = await getGlobalConfig();
    const searchParams = extractSearchParams(route, globalConfig);
    const data = await fetchFlights(route, globalConfig);

    await storeSnapshot(route, data, searchParams);

    const flightsCount =
      (data.best_flights?.length || 0) + (data.other_flights?.length || 0);

    return {
      route_id: route.id,
      origin: route.origin,
      destination: route.destination,
      success: true,
      flights_count: flightsCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error(
      `Erro ao coletar ${route.origin}-${route.destination}:`,
      message
    );
    return {
      route_id: route.id,
      origin: route.origin,
      destination: route.destination,
      success: false,
      error: message,
    };
  }
}

export async function collectAllRoutes(): Promise<CollectResult[]> {
  const sql = getDb();
  const routes = (await sql`SELECT * FROM routes WHERE active = true`) as Route[];

  const results: CollectResult[] = [];
  for (const route of routes) {
    const result = await collectRoute(route);
    results.push(result);
  }

  return results;
}

export async function cleanupOldSnapshots(): Promise<number> {
  const sql = getDb();
  const rows = await sql`
    DELETE FROM snapshots
    WHERE collected_at < now() - INTERVAL '30 days'
    RETURNING id
  `;
  return rows.length;
}
