import { describe, it, expect } from "vitest";
import { profileSchema } from "../profile-schema";

const base = { firstName: "Ada", lastName: "Lovelace", phoneNumber: "", preferredLocale: "" };

describe("profileSchema", () => {
  it("accepts a valid profile and trims surrounding whitespace", () => {
    const result = profileSchema.safeParse({ ...base, firstName: "  Ada  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.firstName).toBe("Ada");
  });

  it("rejects a blank required field (backend @Size(min=1))", () => {
    const result = profileSchema.safeParse({ ...base, firstName: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["firstName"]);
  });

  it("rejects a field longer than 255 characters", () => {
    expect(profileSchema.safeParse({ ...base, firstName: "a".repeat(256) }).success).toBe(false);
  });

  it("allows an empty optional phone / locale", () => {
    expect(profileSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a well-formed phone number", () => {
    expect(profileSchema.safeParse({ ...base, phoneNumber: "+1 (555) 123-4567" }).success).toBe(true);
  });

  it("rejects a phone number with letters", () => {
    const result = profileSchema.safeParse({ ...base, phoneNumber: "call me" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number over 30 characters", () => {
    expect(profileSchema.safeParse({ ...base, phoneNumber: "1".repeat(31) }).success).toBe(false);
  });

  it("rejects a locale code over 10 characters", () => {
    expect(profileSchema.safeParse({ ...base, preferredLocale: "en-US-x-longvariant" }).success).toBe(
      false,
    );
  });
});
