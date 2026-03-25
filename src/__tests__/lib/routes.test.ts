jest.mock("@/lib/db", () => ({
  getDb: jest.fn(),
}));

import { validateRouteInput } from "@/lib/routes";

describe("validateRouteInput", () => {
  const validInput = {
    origin: "JPA",
    destination: "MAO",
    outbound_date: "2026-04-15",
  };

  it("aceita input válido", () => {
    expect(validateRouteInput(validInput)).toBeNull();
  });

  it("aceita input com data de volta", () => {
    expect(
      validateRouteInput({ ...validInput, return_date: "2026-04-20" })
    ).toBeNull();
  });

  it("rejeita origem inválida", () => {
    expect(validateRouteInput({ ...validInput, origin: "" })).toBeTruthy();
    expect(validateRouteInput({ ...validInput, origin: "AB" })).toBeTruthy();
    expect(validateRouteInput({ ...validInput, origin: "ABCD" })).toBeTruthy();
    expect(validateRouteInput({ ...validInput, origin: "12A" })).toBeTruthy();
  });

  it("rejeita destino inválido", () => {
    expect(
      validateRouteInput({ ...validInput, destination: "" })
    ).toBeTruthy();
    expect(
      validateRouteInput({ ...validInput, destination: "AB" })
    ).toBeTruthy();
  });

  it("rejeita data de ida ausente", () => {
    expect(
      validateRouteInput({ ...validInput, outbound_date: "" })
    ).toBeTruthy();
  });

  it("rejeita formato de data inválido", () => {
    expect(
      validateRouteInput({ ...validInput, outbound_date: "15/04/2026" })
    ).toBeTruthy();
    expect(
      validateRouteInput({ ...validInput, return_date: "invalid" })
    ).toBeTruthy();
  });
});
