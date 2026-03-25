import { NextRequest, NextResponse } from "next/server";
import {
  listRoutes,
  createRoute,
  validateRouteInput,
  CreateRouteInput,
} from "@/lib/routes";

export async function GET() {
  try {
    const routes = await listRoutes();
    return NextResponse.json(routes);
  } catch (error) {
    console.error("Erro ao listar rotas:", error);
    return NextResponse.json(
      { error: "Erro ao listar rotas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRouteInput = await request.json();

    const validationError = validateRouteInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const route = await createRoute(body);
    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar rota:", error);
    return NextResponse.json(
      { error: "Erro ao criar rota" },
      { status: 500 }
    );
  }
}
