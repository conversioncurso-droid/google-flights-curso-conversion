import { getDb } from "./db";

export interface GlobalConfig {
  id: number;
  gl: string;
  hl: string;
  location: string;
  currency: string;
  trip_type: string;
  updated_at: string;
}

export interface UpdateConfigInput {
  gl?: string;
  hl?: string;
  location?: string;
  currency?: string;
  trip_type?: string;
}

export async function getGlobalConfig(): Promise<GlobalConfig> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM global_config WHERE id = 1`;
  if (rows.length === 0) {
    // Inserir config padrão
    const inserted = await sql`
      INSERT INTO global_config (id, gl, hl, location, currency, trip_type)
      VALUES (1, 'br', 'pt', 'Joao Pessoa, Paraiba, Brazil', 'BRL', 'round_trip')
      RETURNING *
    `;
    return inserted[0] as GlobalConfig;
  }
  return rows[0] as GlobalConfig;
}

export async function updateGlobalConfig(
  input: UpdateConfigInput
): Promise<GlobalConfig> {
  const sql = getDb();
  const rows = await sql`
    UPDATE global_config SET
      gl = COALESCE(${input.gl ?? null}, gl),
      hl = COALESCE(${input.hl ?? null}, hl),
      location = COALESCE(${input.location ?? null}, location),
      currency = COALESCE(${input.currency ?? null}, currency),
      trip_type = COALESCE(${input.trip_type ?? null}, trip_type),
      updated_at = now()
    WHERE id = 1
    RETURNING *
  `;
  return rows[0] as GlobalConfig;
}
