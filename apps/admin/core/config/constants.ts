/**
 * App-wide constants for the admin console. Currency, locale, and other
 * "decide once" values live here — never as scattered literals.
 *
 * Kept in lockstep with apps/web/core/config/constants.ts — the storefront and
 * the console must format money and dates identically.
 */
export const DEFAULT_CURRENCY = "USD" as const;
export const DEFAULT_LOCALE = "en-US" as const;

/** Default list pagination size (mirrors most services' `size` default). */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 0;

/** Ledger/audit lists default to a larger page (movements `size` default is 50). */
export const LEDGER_PAGE_SIZE = 50;

/** Fallback image for products with a null imageUrl. */
export const PRODUCT_IMAGE_FALLBACK = "/window.svg";
