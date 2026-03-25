import { verifyPin, createToken, verifyToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DASHBOARD_PIN: "1234",
      JWT_SECRET: "test-secret-key-for-testing-purposes",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("verifyPin", () => {
    it("retorna true para PIN correto", () => {
      expect(verifyPin("1234")).toBe(true);
    });

    it("retorna false para PIN incorreto", () => {
      expect(verifyPin("0000")).toBe(false);
      expect(verifyPin("")).toBe(false);
    });

    it("lança erro se DASHBOARD_PIN não está configurada", () => {
      delete process.env.DASHBOARD_PIN;
      expect(() => verifyPin("1234")).toThrow("DASHBOARD_PIN não configurada");
    });
  });

  describe("createToken / verifyToken", () => {
    it("cria token válido e verifica com sucesso", () => {
      const token = createToken();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
      expect(verifyToken(token)).toBe(true);
    });

    it("rejeita token inválido", () => {
      expect(verifyToken("token.invalido.aqui")).toBe(false);
    });

    it("rejeita token expirado", () => {
      const expiredToken = jwt.sign(
        { authenticated: true },
        process.env.JWT_SECRET!,
        { expiresIn: -10 }
      );
      expect(verifyToken(expiredToken)).toBe(false);
    });

    it("lança erro se JWT_SECRET não está configurada", () => {
      delete process.env.JWT_SECRET;
      expect(() => createToken()).toThrow("JWT_SECRET não configurada");
    });
  });
});
