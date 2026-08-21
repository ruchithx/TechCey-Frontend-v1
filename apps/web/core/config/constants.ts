/**
 * App-wide constants. Currency, locale, and other "decide once" values live
 * here — never as scattered literals.
 */

/**
 * ⚠️ NEEDS CONFIRMATION (see FRONTEND_DEVELOPER_GUIDE.md → Blockers).
 * The `orders` table defaults shipping_country to 'US', so we default to USD /
 * en-US. If the real target market differs (e.g. LKR / en-LK), change these two
 * constants — everything downstream (formatMoney) reads from here.
 */
export const DEFAULT_CURRENCY = "USD" as const;
export const DEFAULT_LOCALE = "en-US" as const;

/** Default shipping country (mirrors the orders table default). */
export const DEFAULT_COUNTRY = "US" as const;

/** Product list pagination defaults (mirror product-service query params). */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 0;

/** Fallback image for products with a null imageUrl. */
export const PRODUCT_IMAGE_FALLBACK = "/product-placeholder.svg";
