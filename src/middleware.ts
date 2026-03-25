import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, COOKIE_NAME } from "@/lib/auth-edge";

const PUBLIC_API_PATHS = ["/api/auth"];
const CRON_PATHS = ["/api/coleta"];

// Rate limiting simples em memória
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string, max: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Middleware só atua em API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const maxRequests = pathname.startsWith("/api/auth") ? 10 : 60;

  if (!checkRate(ip, maxRequests)) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
      { status: 429 }
    );
  }

  // Rotas públicas de API
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // CRON_SECRET para rotas do cron
  if (CRON_PATHS.some((p) => pathname.startsWith(p))) {
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret) {
      if (cronSecret === process.env.CRON_SECRET) {
        return NextResponse.next();
      }
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  // Verificar autenticação para demais API routes
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const valid = await verifyTokenEdge(token);
  if (!valid) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
