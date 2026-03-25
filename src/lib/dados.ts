import { getDb } from "./db";

export interface FlightDataPoint {
  date: string;
  airline: string;
  price: number;
  flight_group: string;
  stops: number;
  duration_minutes: number;
  position: number;
  route_origin: string;
  route_destination: string;
  route_id: string;
}

export interface AirlineRanking {
  airline: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  flight_count: number;
  avg_position: number;
  presence_count: number;
}

export interface RouteStats {
  route_id: string;
  origin: string;
  destination: string;
  total_snapshots: number;
  last_collection: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  airline_count: number;
}

export async function getFlightData(
  routeId?: string,
  days: number = 30
): Promise<FlightDataPoint[]> {
  const sql = getDb();

  if (routeId) {
    const rows = await sql`
      SELECT
        TO_CHAR(s.collected_at, 'YYYY-MM-DD') as date,
        sf.airline,
        sf.price / 100.0 as price,
        sf.flight_group,
        sf.stops,
        sf.duration_minutes,
        sf.position,
        r.origin as route_origin,
        r.destination as route_destination,
        r.id as route_id
      FROM snapshot_flights sf
      JOIN snapshots s ON sf.snapshot_id = s.id
      JOIN routes r ON s.route_id = r.id
      WHERE s.route_id = ${routeId}
        AND s.collected_at >= now() - make_interval(days => ${days})
      ORDER BY s.collected_at ASC, sf.position ASC
    `;
    return rows as FlightDataPoint[];
  }

  const rows = await sql`
    SELECT
      TO_CHAR(s.collected_at, 'YYYY-MM-DD') as date,
      sf.airline,
      sf.price / 100.0 as price,
      sf.flight_group,
      sf.stops,
      sf.duration_minutes,
      sf.position,
      r.origin as route_origin,
      r.destination as route_destination,
      r.id as route_id
    FROM snapshot_flights sf
    JOIN snapshots s ON sf.snapshot_id = s.id
    JOIN routes r ON s.route_id = r.id
    WHERE s.collected_at >= now() - make_interval(days => ${days})
    ORDER BY s.collected_at ASC, sf.position ASC
  `;
  return rows as FlightDataPoint[];
}

export async function getAirlineRankings(
  routeId?: string,
  days: number = 30
): Promise<AirlineRanking[]> {
  const sql = getDb();

  const whereRoute = routeId ? sql`AND s.route_id = ${routeId}` : sql``;

  const rows = await sql`
    SELECT
      sf.airline,
      ROUND(AVG(sf.price / 100.0), 2) as avg_price,
      MIN(sf.price / 100.0) as min_price,
      MAX(sf.price / 100.0) as max_price,
      COUNT(*) as flight_count,
      ROUND(AVG(sf.position), 1) as avg_position,
      COUNT(DISTINCT TO_CHAR(s.collected_at, 'YYYY-MM-DD')) as presence_count
    FROM snapshot_flights sf
    JOIN snapshots s ON sf.snapshot_id = s.id
    WHERE s.collected_at >= now() - make_interval(days => ${days})
      AND sf.price IS NOT NULL
      ${whereRoute}
    GROUP BY sf.airline
    ORDER BY avg_price ASC
  `;
  return rows as AirlineRanking[];
}

export async function getRouteStats(days: number = 30): Promise<RouteStats[]> {
  const sql = getDb();

  const rows = await sql`
    SELECT
      r.id as route_id,
      r.origin,
      r.destination,
      COUNT(DISTINCT s.id) as total_snapshots,
      MAX(s.collected_at) as last_collection,
      ROUND(AVG(sf.price / 100.0), 2) as avg_price,
      MIN(sf.price / 100.0) as min_price,
      MAX(sf.price / 100.0) as max_price,
      COUNT(DISTINCT sf.airline) as airline_count
    FROM routes r
    LEFT JOIN snapshots s ON r.id = s.route_id
      AND s.collected_at >= now() - make_interval(days => ${days})
    LEFT JOIN snapshot_flights sf ON s.id = sf.snapshot_id
      AND sf.price IS NOT NULL
    WHERE r.active = true
    GROUP BY r.id, r.origin, r.destination
    ORDER BY r.origin, r.destination
  `;
  return rows as RouteStats[];
}
