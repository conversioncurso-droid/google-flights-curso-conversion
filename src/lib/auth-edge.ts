import { jwtVerify } from "jose";

const COOKIE_NAME = "dashboard_token";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurada");
  return new TextEncoder().encode(secret);
}

export async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
