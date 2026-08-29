import { describe, it, expect } from "vitest";
import { hasEnvelope, unwrapEnvelope } from "@/core/api/envelope";
import { isAppError } from "@/core/errors/app-error";

describe("unwrapEnvelope", () => {
  it("returns `data` for a wrapped (order-service) success response", () => {
    const wrapped = {
      success: true,
      message: "Success",
      data: { id: "abc", total: "42.00" },
      timestamp: "2025-01-15T10:30:00Z",
    };
    expect(unwrapEnvelope(wrapped)).toEqual({ id: "abc", total: "42.00" });
  });

  it("returns `data` for notification-service's slim { success, data } envelope", () => {
    const slim = { success: true, data: { content: [], number: 0 } };
    expect(unwrapEnvelope(slim)).toEqual({ content: [], number: 0 });
  });

  it("returns the body as-is for a bare (product/cart) response", () => {
    const bare = { id: 1, name: "Widget", price: "9.99" };
    expect(unwrapEnvelope(bare)).toEqual(bare);
  });

  it("returns arrays and primitives untouched when unwrapped", () => {
    expect(unwrapEnvelope([1, 2, 3])).toEqual([1, 2, 3]);
    expect(unwrapEnvelope("plain")).toBe("plain");
    expect(unwrapEnvelope(null)).toBeNull();
  });

  it("throws a typed AppError when the envelope reports success:false", () => {
    const failed = {
      success: false,
      message: "Order not found",
      data: null,
      timestamp: "2025-01-15T10:30:00Z",
    };
    try {
      unwrapEnvelope(failed, 404);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.status).toBe(404);
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toBe("Order not found");
      }
    }
  });
});

describe("hasEnvelope", () => {
  it("detects the common envelope shape", () => {
    expect(
      hasEnvelope({ success: true, message: "", data: {}, timestamp: "t" }),
    ).toBe(true);
  });

  it("detects the slim { success, data } envelope (notification-service)", () => {
    expect(hasEnvelope({ success: true, data: {} })).toBe(true);
  });

  it("rejects bare payloads that merely have a data field", () => {
    expect(hasEnvelope({ data: {} })).toBe(false);
    expect(hasEnvelope({ id: 1, name: "x" })).toBe(false);
    expect(hasEnvelope(null)).toBe(false);
  });
});
