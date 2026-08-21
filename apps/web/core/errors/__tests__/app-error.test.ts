import { describe, it, expect } from "vitest";
import { mapHttpError, mapNetworkError } from "@/core/errors/app-error";

describe("mapHttpError", () => {
  it("maps status codes to the right code", () => {
    expect(mapHttpError(400, {}).code).toBe("VALIDATION");
    expect(mapHttpError(401, {}).code).toBe("UNAUTHENTICATED");
    expect(mapHttpError(403, {}).code).toBe("FORBIDDEN");
    expect(mapHttpError(404, {}).code).toBe("NOT_FOUND");
    expect(mapHttpError(500, {}).code).toBe("SERVER_ERROR");
    expect(mapHttpError(503, {}).code).toBe("SERVER_ERROR");
  });

  it("gives 409 a distinct INSUFFICIENT_STOCK code for the stock case", () => {
    const stock = mapHttpError(409, {
      errorCode: "INSUFFICIENT_STOCK",
      message: "Not enough stock",
    });
    expect(stock.code).toBe("INSUFFICIENT_STOCK");
    expect(stock.status).toBe(409);

    const plainConflict = mapHttpError(409, { message: "Version conflict" });
    expect(plainConflict.code).toBe("CONFLICT");
  });

  it("prefers the backend message when present", () => {
    expect(mapHttpError(404, { message: "Product 7 not found" }).message).toBe(
      "Product 7 not found",
    );
  });

  it("falls back to a safe default message when the backend gives none", () => {
    expect(mapHttpError(403, {}).message).toMatch(/permission/i);
  });

  it("reads the order-service ErrorResponse shape (errorCode/errors)", () => {
    const err = mapHttpError(400, {
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errors: { name: "must not be blank", price: "must be positive" },
    });
    expect(err.fieldErrors).toEqual({
      name: "must not be blank",
      price: "must be positive",
    });
  });

  it("reads the product/cart ApiError shape (error/message)", () => {
    const err = mapHttpError(404, { error: "NOT_FOUND", message: "no such product" });
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("no such product");
  });
});

describe("mapNetworkError", () => {
  it("maps a fetch abort (timeout) to TIMEOUT with status 0", () => {
    const abort = new DOMException("aborted", "AbortError");
    const err = mapNetworkError(abort);
    expect(err.status).toBe(0);
    expect(err.code).toBe("TIMEOUT");
  });

  it("maps a generic failure to OFFLINE with status 0", () => {
    const err = mapNetworkError(new TypeError("Failed to fetch"));
    expect(err.status).toBe(0);
    expect(err.code).toBe("OFFLINE");
  });
});
