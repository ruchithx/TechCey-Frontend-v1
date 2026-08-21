/** Public surface of the HTTP + API contract layer (D2). */

export { ENDPOINTS } from "@/core/api/endpoints";
export { request, registerAuthTokenProvider, registerUnauthorizedHandler } from "@/core/api/http";
export type { RequestOptions } from "@/core/api/http";
export { unwrapEnvelope, hasEnvelope } from "@/core/api/envelope";
export { makeQueryClient } from "@/core/api/query-client";
export { queryKeys } from "@/core/api/query-keys";
export { normalisePage } from "@/core/api/page";
export type { Page } from "@/core/api/page";
export { toMoney, formatMoney, sumMoney, multiplyMoney } from "@/core/api/money";
export type { Money } from "@/core/api/money";
export * from "@/core/api/types";
