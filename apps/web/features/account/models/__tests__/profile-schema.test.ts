import { describe, it, expect } from "vitest";
import { profileSchema } from "../profile-schema";

describe("profileSchema", () => {
  it("accepts a valid first/last name and trims surrounding whitespace", () => {
    const result = profileSchema.safeParse({ firstName: "  Ada  ", lastName: "Lovelace" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    }
  });

  it("rejects a blank field (backend @Size(min=1))", () => {
    const result = profileSchema.safeParse({ firstName: "   ", lastName: "Lovelace" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["firstName"]);
    }
  });

  it("rejects a field longer than 255 characters", () => {
    const result = profileSchema.safeParse({
      firstName: "a".repeat(256),
      lastName: "Lovelace",
    });
    expect(result.success).toBe(false);
  });

  it("requires both fields to be present", () => {
    expect(profileSchema.safeParse({ firstName: "Ada" }).success).toBe(false);
  });
});
