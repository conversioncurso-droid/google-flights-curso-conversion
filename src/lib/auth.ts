import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "dashboard_token";
const EXPIRATION_SECONDS = 60 * 60 * 24; // 24h

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurada");
  return secret;
}

export function verifyPin(pin: string): boolean {
  const correctPin = process.env.DASHBOARD_PIN;
  if (!correctPin) throw new Error("DASHBOARD_PIN não configurada");
  return pin === correctPin;
}

export function createToken(): string {
  return jwt.sign({ authenticated: true }, getSecret(), {
    expiresIn: EXPIRATION_SECONDS,
  });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthCookie();
  if (!token) return false;
  return verifyToken(token);
}

export { COOKIE_NAME, EXPIRATION_SECONDS };
