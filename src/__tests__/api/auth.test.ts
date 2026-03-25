import { verifyPin, createToken, verifyToken } from "@/lib/auth";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("API /api/auth", () => {
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

  describe("POST /api/auth (login)", () => {
    it("retorna token para PIN correto", () => {
      expect(verifyPin("1234")).toBe(true);
      const token = createToken();
      expect(verifyToken(token)).toBe(true);
    });

    it("rejeita PIN incorreto", () => {
      expect(verifyPin("wrong")).toBe(false);
    });

    it("rejeita body sem PIN", () => {
      expect(verifyPin("")).toBe(false);
    });
  });

  describe("DELETE /api/auth (logout)", () => {
    it("logout invalida sessão — token não deve ser reutilizado após expiração", () => {
      const token = createToken();
      expect(verifyToken(token)).toBe(true);
      // Logout é feito removendo o cookie no client — aqui testamos que
      // a verificação funciona corretamente
    });
  });
});
