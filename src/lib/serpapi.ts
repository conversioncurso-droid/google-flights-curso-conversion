import type { Route } from "./routes";
import type { GlobalConfig } from "./config";

interface SerpApiParams {
  engine: string;
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  type?: string;
  gl?: string;
  hl?: string;
  location?: string;
  currency?: string;
  api_key: string;
}

export interface SerpApiFlightResult {
  best_flights?: SerpApiFlight[];
  other_flights?: SerpApiFlight[];
  search_parameters?: Record<string, unknown>;
  search_metadata?: Record<string, unknown>;
  price_insights?: Record<string, unknown>;
}

export interface SerpApiFlight {
  flights: SerpApiLeg[];
  total_duration?: number;
  price?: number;
  type?: string;
  airline_logo?: string;
  departure_token?: string;
  carbon_emissions?: Record<string, unknown>;
  layovers?: SerpApiLayover[];
}

export interface SerpApiLeg {
  departure_airport?: { name?: string; id?: string; time?: string };
  arrival_airport?: { name?: string; id?: string; time?: string };
  duration?: number;
  airplane?: string;
  airline?: string;
  airline_logo?: string;
  flight_number?: string;
  travel_class?: string;
  legroom?: string;
  extensions?: string[];
  often_delayed_by_over_30_min?: boolean;
}

export interface SerpApiLayover {
  duration?: number;
  name?: string;
  id?: string;
}

function buildParams(
  route: Route,
  globalConfig: GlobalConfig
): SerpApiParams {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY não configurada");

  const tripType = route.trip_type || globalConfig.trip_type || "round_trip";

  const formatDate = (d: string | Date) =>
    d instanceof Date ? d.toISOString().split("T")[0] : String(d).split("T")[0];

  const params: SerpApiParams = {
    engine: "google_flights",
    departure_id: route.origin,
    arrival_id: route.destination,
    outbound_date: formatDate(route.outbound_date),
    gl: route.gl || globalConfig.gl,
    hl: route.hl || globalConfig.hl,
    currency: route.currency || globalConfig.currency,
    api_key: apiKey,
  };

  // Tipo de viagem: 1 = round trip, 2 = one way
  if (tripType === "one_way") {
    params.type = "2";
  } else {
    params.type = "1";
    if (route.return_date) {
      params.return_date = formatDate(route.return_date);
    }
  }

  // Location para simular origem do request
  const location = route.location || globalConfig.location;
  if (location) {
    params.location = location;
  }

  return params;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 5000]; // backoff exponencial

export async function fetchFlights(
  route: Route,
  globalConfig: GlobalConfig
): Promise<SerpApiFlightResult> {
  const params = buildParams(route, globalConfig);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const url = `https://serpapi.com/search.json?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`SerpAPI retornou status ${response.status}`);
      }

      const data: SerpApiFlightResult = await response.json();
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Tentativa ${attempt + 1}/${MAX_RETRIES} falhou para ${route.origin}-${route.destination}:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
      }
    }
  }

  throw lastError || new Error("Falha ao buscar voos");
}

export function extractSearchParams(
  route: Route,
  globalConfig: GlobalConfig
): Record<string, string> {
  const params = buildParams(route, globalConfig);
  // Remove a api_key para não armazenar no banco
  const { api_key: _, ...safeParams } = params;
  return safeParams as Record<string, string>;
}
