-- Configuração global da SerpAPI
CREATE TABLE IF NOT EXISTS global_config (
  id SERIAL PRIMARY KEY,
  gl VARCHAR(10) DEFAULT 'br',
  hl VARCHAR(10) DEFAULT 'pt',
  location VARCHAR(255) DEFAULT 'Joao Pessoa, Paraiba, Brazil',
  currency VARCHAR(10) DEFAULT 'BRL',
  trip_type VARCHAR(20) DEFAULT 'round_trip',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir config padrão se não existir
INSERT INTO global_config (id, gl, hl, location, currency, trip_type)
VALUES (1, 'br', 'pt', 'Joao Pessoa, Paraiba, Brazil', 'BRL', 'round_trip')
ON CONFLICT (id) DO NOTHING;

-- Rotas monitoradas
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  outbound_date DATE NOT NULL,
  return_date DATE,
  trip_type VARCHAR(20),
  gl VARCHAR(10),
  hl VARCHAR(10),
  location VARCHAR(255),
  currency VARCHAR(10),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Snapshots diários
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  collected_at TIMESTAMPTZ DEFAULT now(),
  raw_response JSONB,
  search_params JSONB
);

-- Voos individuais extraídos
CREATE TABLE IF NOT EXISTS snapshot_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES snapshots(id) ON DELETE CASCADE,
  flight_group VARCHAR(20) NOT NULL,
  position INTEGER,
  airline VARCHAR(255),
  flight_number VARCHAR(20),
  price INTEGER,
  currency VARCHAR(10),
  duration_minutes INTEGER,
  stops INTEGER,
  stop_details JSONB,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  cabin_class VARCHAR(50),
  availability JSONB,
  promotions JSONB,
  legs JSONB
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_snapshots_route_date ON snapshots(route_id, collected_at);
CREATE INDEX IF NOT EXISTS idx_flights_snapshot ON snapshot_flights(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON snapshot_flights(airline);
CREATE INDEX IF NOT EXISTS idx_snapshots_collected_at ON snapshots(collected_at);
