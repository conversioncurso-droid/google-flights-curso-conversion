import { checkRateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("permite requisições dentro do limite", () => {
    const result = checkRateLimit("test-ip-1", {
      windowMs: 60000,
      maxRequests: 5,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("bloqueia após exceder o limite", () => {
    const config = { windowMs: 60000, maxRequests: 3 };
    const ip = "test-ip-block";

    checkRateLimit(ip, config); // 1
    checkRateLimit(ip, config); // 2
    checkRateLimit(ip, config); // 3

    const result = checkRateLimit(ip, config); // 4 — bloqueado
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("retorna remaining corretamente", () => {
    const config = { windowMs: 60000, maxRequests: 5 };
    const ip = "test-ip-remaining";

    const r1 = checkRateLimit(ip, config);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(ip, config);
    expect(r2.remaining).toBe(3);
  });
});
