/**
 * Money handling.
 *
 * Backend money is NUMERIC(12,2) / NUMERIC(19,2), serialised as a STRING.
 * NEVER parse money into a JS `number` — binary floating point silently
 * misprices real orders (0.1 + 0.2 !== 0.3). We keep the string, brand it, and
 * do all arithmetic in integer cents.
 *
 * See FRONTEND_DEVELOPER_GUIDE.md → "Money as string" for the full rule.
 */

import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/core/config/constants";

/** A branded string. You cannot pass a raw string where a Money is expected. */
export type Money = string & { readonly __brand: "Money" };

/** Assert/brand a backend money string. Throws on obviously non-numeric input. */
export function toMoney(value: string): Money {
  if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
    throw new Error(`Invalid money string: "${value}"`);
  }
  return value.trim() as Money;
}

/** Convert a money string to integer cents (rounding to 2 dp). */
function toCents(value: Money): bigint {
  const negative = value.startsWith("-");
  const digits = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = digits.split(".");
  const cents = `${whole}${(fraction + "00").slice(0, 2)}`;
  const result = BigInt(cents || "0");
  return negative ? -result : result;
}

function fromCents(cents: bigint): Money {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / 100n;
  const fraction = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}` as Money;
}

/** Sum any number of Money values with exact integer-cent arithmetic. */
export function sumMoney(...values: Money[]): Money {
  const total = values.reduce((acc, v) => acc + toCents(v), 0n);
  return fromCents(total);
}

/** Multiply a Money value by an integer quantity (exact). */
export function multiplyMoney(value: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) {
    throw new Error(`Quantity must be an integer, got ${quantity}`);
  }
  return fromCents(toCents(value) * BigInt(quantity));
}

/**
 * Format a Money string for display. Uses Intl for locale-correct grouping and
 * currency symbol. Parses to Number ONLY at the display boundary — never for
 * arithmetic — which is safe for values within NUMERIC(12,2) range.
 */
export function formatMoney(
  value: Money | string,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(value));
}
