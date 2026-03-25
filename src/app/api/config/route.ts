import { NextRequest, NextResponse } from "next/server";
import { getGlobalConfig, updateGlobalConfig } from "@/lib/config";

export async function GET() {
  try {
    const config = await getGlobalConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const config = await updateGlobalConfig(body);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configuração" },
      { status: 500 }
    );
  }
}
