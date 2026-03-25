import { getDb } from "./db";

export interface Route {
  id: string;
  origin: string;
  destination: string;
  outbound_date: string;
  return_date: string | null;
  trip_type: string | null;
  gl: string | null;
  hl: string | null;
  location: string | null;
  currency: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRouteInput {
  origin: string;
  destination: string;
  outbound_date: string;
  return_date?: string | null;
  trip_type?: string | null;
  gl?: string | null;
  hl?: string | null;
  location?: string | null;
  currency?: string | null;
}

export interface UpdateRouteInput extends Partial<CreateRouteInput> {
  active?: boolean;
}

export function validateRouteInput(input: CreateRouteInput): string | null {
  if (!input.origin || input.origin.length !== 3) {
    return "Origem deve ser um código IATA de 3 letras";
  }
  if (!input.destination || input.destination.length !== 3) {
    return "Destino deve ser um código IATA de 3 letras";
  }
  if (!/^[A-Z]{3}$/.test(input.origin.toUpperCase())) {
    return "Origem deve conter apenas letras";
  }
  if (!/^[A-Z]{3}$/.test(input.destination.toUpperCase())) {
    return "Destino deve conter apenas letras";
  }
  if (!input.outbound_date) {
    return "Data de ida é obrigatória";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.outbound_date)) {
    return "Data de ida deve estar no formato YYYY-MM-DD";
  }
  if (input.return_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.return_date)) {
    return "Data de volta deve estar no formato YYYY-MM-DD";
  }
  return null;
}

export async function listRoutes(): Promise<Route[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM routes ORDER BY created_at DESC`;
  return rows as Route[];
}

export async function getRoute(id: string): Promise<Route | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM routes WHERE id = ${id}`;
  return (rows[0] as Route) || null;
}

export async function createRoute(input: CreateRouteInput): Promise<Route> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO routes (origin, destination, outbound_date, return_date, trip_type, gl, hl, location, currency)
    VALUES (
      ${input.origin.toUpperCase()},
      ${input.destination.toUpperCase()},
      ${input.outbound_date},
      ${input.return_date || null},
      ${input.trip_type || null},
      ${input.gl || null},
      ${input.hl || null},
      ${input.location || null},
      ${input.currency || null}
    )
    RETURNING *
  `;
  return rows[0] as Route;
}

export async function updateRoute(
  id: string,
  input: UpdateRouteInput
): Promise<Route | null> {
  const sql = getDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.origin !== undefined) {
    fields.push("origin");
    values.push(input.origin.toUpperCase());
  }
  if (input.destination !== undefined) {
    fields.push("destination");
    values.push(input.destination.toUpperCase());
  }
  if (input.outbound_date !== undefined) {
    fields.push("outbound_date");
    values.push(input.outbound_date);
  }
  if (input.return_date !== undefined) {
    fields.push("return_date");
    values.push(input.return_date);
  }
  if (input.trip_type !== undefined) {
    fields.push("trip_type");
    values.push(input.trip_type);
  }
  if (input.gl !== undefined) {
    fields.push("gl");
    values.push(input.gl);
  }
  if (input.hl !== undefined) {
    fields.push("hl");
    values.push(input.hl);
  }
  if (input.location !== undefined) {
    fields.push("location");
    values.push(input.location);
  }
  if (input.currency !== undefined) {
    fields.push("currency");
    values.push(input.currency);
  }
  if (input.active !== undefined) {
    fields.push("active");
    values.push(input.active);
  }

  if (fields.length === 0) return getRoute(id);

  // Build dynamic update using parameterized query
  // Neon's tagged template doesn't support dynamic column names,
  // so we build the SET clause safely (column names are validated above)
  fields.push("updated_at");
  values.push(new Date().toISOString());

  const setClause = fields
    .map((f, i) => `${f} = $${i + 1}`)
    .join(", ");

  const query = `UPDATE routes SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
  values.push(id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (sql as any)(query, values);
  return (rows[0] as Route) || null;
}

export async function deleteRoute(id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`DELETE FROM routes WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function toggleRoute(
  id: string,
  active: boolean
): Promise<Route | null> {
  const sql = getDb();
  const rows = await sql`
    UPDATE routes SET active = ${active}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Route) || null;
}
