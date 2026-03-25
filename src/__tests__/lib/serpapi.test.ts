jest.mock("@/lib/db", () => ({
  getDb: jest.fn(),
}));

import { extractSearchParams } from "@/lib/serpapi";
import type { Route } from "@/lib/routes";
import type { GlobalConfig } from "@/lib/config";

describe("serpapi", () => {
  const originalEnv = process.env;

  const mockGlobalConfig: GlobalConfig = {
    id: 1,
    gl: "br",
    hl: "pt",
    location: "Joao Pessoa, Paraiba, Brazil",
    currency: "BRL",
    trip_type: "round_trip",
    updated_at: "2026-01-01",
  };

  const mockRoute: Route = {
    id: "test-id",
    origin: "JPA",
    destination: "MAO",
    outbound_date: "2026-04-15",
    return_date: "2026-04-20",
    trip_type: null,
    gl: null,
    hl: null,
    location: null,
    currency: null,
    active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SERPAPI_KEY: "test-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("extractSearchParams", () => {
    it("usa configuração global como padrão", () => {
      const params = extractSearchParams(mockRoute, mockGlobalConfig);
      expect(params.engine).toBe("google_flights");
      expect(params.departure_id).toBe("JPA");
      expect(params.arrival_id).toBe("MAO");
      expect(params.gl).toBe("br");
      expect(params.hl).toBe("pt");
      expect(params.currency).toBe("BRL");
      expect(params.type).toBe("1"); // round trip
      expect(params.return_date).toBe("2026-04-20");
    });

    it("sobrescreve com configuração da rota", () => {
      const routeWithOverrides: Route = {
        ...mockRoute,
        gl: "us",
        currency: "USD",
        location: "New York, USA",
      };
      const params = extractSearchParams(routeWithOverrides, mockGlobalConfig);
      expect(params.gl).toBe("us");
      expect(params.currency).toBe("USD");
      expect(params.location).toBe("New York, USA");
    });

    it("configura tipo one_way corretamente", () => {
      const oneWayRoute: Route = {
        ...mockRoute,
        trip_type: "one_way",
        return_date: null,
      };
      const params = extractSearchParams(oneWayRoute, mockGlobalConfig);
      expect(params.type).toBe("2");
      expect(params.return_date).toBeUndefined();
    });

    it("não inclui api_key nos parâmetros de busca", () => {
      const params = extractSearchParams(mockRoute, mockGlobalConfig);
      expect("api_key" in params).toBe(false);
    });
  });
});
