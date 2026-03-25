import { NextRequest, NextResponse } from "next/server";
import {
  getRoute,
  updateRoute,
  deleteRoute,
  toggleRoute,
  validateRouteInput,
  CreateRouteInput,
} from "@/lib/routes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const route = await getRoute(id);
    if (!route) {
      return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
    }
    return NextResponse.json(route);
  } catch (error) {
    console.error("Erro ao buscar rota:", error);
    return NextResponse.json({ error: "Erro ao buscar rota" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Se for toggle de ativação
    if (Object.keys(body).length === 1 && "active" in body) {
      const route = await toggleRoute(id, body.active);
      if (!route) {
        return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
      }
      return NextResponse.json(route);
    }

    // Update completo — validar campos obrigatórios se fornecidos
    if (body.origin || body.destination || body.outbound_date) {
      const existing = await getRoute(id);
      if (!existing) {
        return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
      }

      const merged: CreateRouteInput = {
        origin: body.origin || existing.origin,
        destination: body.destination || existing.destination,
        outbound_date: body.outbound_date || existing.outbound_date,
        return_date: body.return_date !== undefined ? body.return_date : existing.return_date,
      };

      const validationError = validateRouteInput(merged);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const route = await updateRoute(id, body);
    if (!route) {
      return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
    }
    return NextResponse.json(route);
  } catch (error) {
    console.error("Erro ao atualizar rota:", error);
    return NextResponse.json({ error: "Erro ao atualizar rota" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteRoute(id);
    if (!deleted) {
      return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar rota:", error);
    return NextResponse.json({ error: "Erro ao deletar rota" }, { status: 500 });
  }
}
