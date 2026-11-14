/**
 * Money handling.
 *
 * Backend money is NUMERIC(12,2) / NUMERIC(19,2), serialised as a STRING.
 * NEVER parse money into a JS `number` — binary floating point silently
 * misprices real orders (0.1 + 0.2 !== 0.3). We keep the string, brand it, and
 * do all arithmetic in integer cents.
 */

import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/core/config/constants";

/** A branded string. You cannot pass a raw string where a Money is expected. */
export type Money = string & { readonly __brand: "Money" };

/** Assert/brand a backend money value (string or number). Throws on non-numeric input. */
export function toMoney(value: string | number): Money {
  const str = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(str)) {
    throw new Error(`Invalid money value: "${value}"`);
  }
  return str as Money;
}

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

/**
 * Format a Money string for display. Parses to Number ONLY at the display
 * boundary — never for arithmetic — which is safe within NUMERIC(12,2) range.
 */
export function formatMoney(
  value: Money | string | number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(value));
}
