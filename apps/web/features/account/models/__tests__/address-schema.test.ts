import { describe, it, expect } from "vitest";
import { addressSchema } from "../address-schema";

const valid = {
  label: "Home",
  line1: "100 Market St",
  line2: "",
  city: "Springfield",
  state: "CA",
  zip: "90210",
  country: "US",
};

describe("addressSchema", () => {
  it("accepts a complete address", () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });

  it("allows an empty label and line2", () => {
    expect(addressSchema.safeParse({ ...valid, label: "", line2: "" }).success).toBe(true);
  });

  it.each(["line1", "city", "state", "zip", "country"] as const)(
    "requires %s",
    (field) => {
      const result = addressSchema.safeParse({ ...valid, [field]: "" });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.path).toEqual([field]);
    },
  );

  it("rejects a label over 50 characters", () => {
    expect(addressSchema.safeParse({ ...valid, label: "x".repeat(51) }).success).toBe(false);
  });

  it("rejects a zip over 20 characters", () => {
    expect(addressSchema.safeParse({ ...valid, zip: "9".repeat(21) }).success).toBe(false);
  });
});
