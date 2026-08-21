import { describe, it, expect } from "vitest";
import { toMoney, sumMoney, multiplyMoney, formatMoney } from "@/core/api/money";

describe("money (integer-cent arithmetic, never float)", () => {
  it("sums without floating-point error (the 0.1 + 0.2 case)", () => {
    expect(sumMoney(toMoney("0.10"), toMoney("0.20"))).toBe("0.30");
  });

  it("sums a realistic cart total exactly", () => {
    const total = sumMoney(toMoney("19.99"), toMoney("19.99"), toMoney("5.02"));
    expect(total).toBe("45.00");
  });

  it("multiplies unit price by quantity exactly", () => {
    expect(multiplyMoney(toMoney("9.99"), 3)).toBe("29.97");
  });

  it("handles values missing a fraction", () => {
    expect(sumMoney(toMoney("10"), toMoney("0.99"))).toBe("10.99");
  });

  it("rejects non-numeric money strings", () => {
    expect(() => toMoney("$9.99")).toThrow();
    expect(() => toMoney("abc")).toThrow();
  });

  it("formats for display with currency + locale", () => {
    expect(formatMoney(toMoney("1234.50"), "USD", "en-US")).toBe("$1,234.50");
  });
});
