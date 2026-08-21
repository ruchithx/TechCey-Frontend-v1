# core/api — HTTP + API contract layer (D2)

The one place the app talks to the backend. Feature code never calls `fetch`, never
parses the envelope, never hand-writes a URL or a query key.

## Files
| File | Responsibility |
|---|---|
| `endpoints.ts` | **Every** backend path. The only file allowed to contain URL path strings. |
| `http.ts` | `request<T>()` — base fetch: gateway base URL, bearer token, envelope unwrap, `AppError` mapping, timeout. |
| `envelope.ts` | `unwrapEnvelope()` — returns `data` for wrapped (order-service) responses, body as-is for bare (product/cart). |
| `money.ts` | `Money` branded type + `formatMoney` / `sumMoney` / `multiplyMoney`. **Money is a string, never a number.** |
| `page.ts` | `Page<T>` + `normalisePage()` — one pagination type for both backend page shapes. |
| `types.ts` | Hand-written DTOs (`TODO(openapi)` — regenerate with `pnpm --filter web api:types`). |
| `query-keys.ts` | Centralised TanStack Query keys — one source of truth, no drift. |
| `query-client.ts` | `makeQueryClient()` — global defaults (no retry on 4xx). |
| `index.ts` | Public surface — import from `@/core/api`. |

## Add a new endpoint
1. Add the path to `ENDPOINTS` in `endpoints.ts` (use `API_PREFIX` or `API_V1_PREFIX`).
2. Add a DTO to `types.ts` if needed.
3. Add a query key to `query-keys.ts` if it's read via TanStack Query.
4. Write a feature hook in `features/<domain>/services/` that calls `request()` + `ENDPOINTS`.
   Never call `fetch` or `useQuery` directly in a component.

## Query-key convention
```
queryKeys.products.list(filters)   // ['products','list',{...}]
queryKeys.products.detail(id)      // ['products','detail', id]
queryKeys.cart.all                 // ['cart']
queryKeys.orders.list(filters)     // ['orders','list',{...}]
```
Read and invalidate through the same `queryKeys.*` — never inline a key array.

## Money rule
Backend money is `NUMERIC` serialised as a string. Keep it a string end to end.
Use `sumMoney`/`multiplyMoney` for arithmetic (integer cents) and `formatMoney` only at display.
