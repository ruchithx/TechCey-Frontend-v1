# Admin API Reference (for Frontend)

This document lists every **admin-only** (and admin-capable) endpoint in the platform, with
request/response shapes, headers, validation rules, and error codes — everything the Angular
admin console needs to integrate.

> Generated from the backend source on 2026-08-23. Cross-check against Swagger UI per service
> if anything drifts.

---

## 1. Ground rules

### Base URL — always go through the gateway
All frontend calls hit the **API Gateway**, never a service directly.

| Environment | Base URL |
|---|---|
| Local | `http://localhost:8085` |
| Prod | your ECS gateway URL |

The gateway routes by path prefix:

| Prefix | Service |
|---|---|
| `/api/products/**`, `/api/categories/**` | product-service |
| `/api/v1/orders/**` | order-service |
| `/api/v1/inventory/**` | inventory-service |
| `/api/v1/payments/**` | payment-service |
| `/api/v1/reviews/**` | review-service |
| `/api/v1/notifications/**`, `/api/v1/notification-templates/**` | notification-service |

### Authentication
1. The user logs in via **Keycloak** (realm `ecommerce`, issuer `http://localhost:8080/realms/ecommerce`).
2. Send the access token on every request:
   ```
   Authorization: Bearer <access_token>
   ```
3. The gateway validates the JWT, then injects `X-User-Id` (the `sub` claim) and
   `X-User-Roles` (comma-separated realm roles) into the downstream request.
   **The frontend must NOT send `X-User-Id` / `X-User-Roles`** — the gateway strips any
   client-supplied values and re-adds them from the verified token.

### Admin authorization
Admin endpoints require the Keycloak realm role **`ADMIN`** (`realm_access.roles` contains
`ADMIN`, mapped to `ROLE_ADMIN`). Role name is **case-sensitive**.

- Missing/invalid token → **401 Unauthorized**
- Valid token but not an admin → **403 Forbidden**

### CORS
Services allow origin `http://localhost:4200` with credentials, methods `GET, POST, PUT, DELETE, OPTIONS`.

### ⚠️ Response envelope is NOT uniform across services
This is important for the frontend — three different shapes exist:

| Services | Shape |
|---|---|
| order, inventory, payment | **Common envelope**: `{ "success", "message", "data", "timestamp" }` |
| notification | **Slim envelope**: `{ "success", "data" }` |
| **product, review** | **Raw DTO** — no envelope at all, the object is the body |

Handle each service's shape accordingly. Examples below show the exact body per endpoint.

**Common envelope example:**
```json
{
  "success": true,
  "message": "Success",
  "data": { "...": "..." },
  "timestamp": "2026-08-23T10:30:00Z"
}
```

**Errors** follow RFC 9457 `ProblemDetail` where implemented (`application/problem+json`):
```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "A record already exists for this product",
  "instance": "/api/v1/inventory"
}
```
Validation failures (`400`) return field errors. Treat any non-2xx as an error branch.

---

## 2. Product Service — Products (Admin)

**Base:** `/api/products` · **Envelope:** RAW DTO (no wrapper) · **Role:** `ADMIN` for writes.
`GET` endpoints are **public** (listed for reference).

### DTOs

**`ProductResponse`** (returned)
```json
{
  "id": 42,
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz mouse",
  "price": 19.99,
  "imageUrl": "https://cdn.example.com/mouse.png",
  "stock": 100,
  "category": {
    "id": 3,
    "name": "Accessories",
    "description": "Peripherals",
    "createdAt": "2026-08-01T09:00:00Z",
    "updatedAt": "2026-08-01T09:00:00Z"
  },
  "createdAt": "2026-08-10T12:00:00Z",
  "updatedAt": "2026-08-20T15:30:00Z"
}
```

**`CreateProductRequest` / `UpdateProductRequest`** (same fields)

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | ✅ | not blank |
| `description` | string | ❌ | — |
| `price` | number (BigDecimal) | ✅ | ≥ 0 |
| `imageUrl` | string | ❌ | — |
| `stock` | integer | ✅ | ≥ 0 |
| `categoryId` | integer (long) | ✅ | not null |

### Endpoints

#### ➕ Create product — `POST /api/products` 🔒 ADMIN
Request body: `CreateProductRequest`
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz mouse",
  "price": 19.99,
  "imageUrl": "https://cdn.example.com/mouse.png",
  "stock": 100,
  "categoryId": 3
}
```
Responses: **201 Created** → `ProductResponse` · 400 validation · 401 · 403 · 404 (category not found)

#### ✏️ Update product — `PUT /api/products/{id}` 🔒 ADMIN
Path: `id` (long). Body: `UpdateProductRequest` (all fields, same as create).
Responses: **200 OK** → `ProductResponse` · 400 · 401 · 403 · 404

#### 🗑️ Delete product — `DELETE /api/products/{id}` 🔒 ADMIN
Responses: **204 No Content** · 401 · 403 · 404

#### (public) List — `GET /api/products?keyword=&categoryId=&minPrice=&maxPrice=&page=0&size=20&sort=price,desc`
Returns `PageResponse<ProductResponse>`:
```json
{ "content": [ /* ProductResponse[] */ ], "page": 0, "size": 20, "totalElements": 57, "totalPages": 3, "last": false }
```
#### (public) Get one — `GET /api/products/{id}` → `ProductResponse`

---

## 3. Product Service — Categories (Admin)

**Base:** `/api/categories` · **Envelope:** RAW DTO · **Role:** `ADMIN` for writes.

**`CategoryResponse`**
```json
{ "id": 3, "name": "Accessories", "description": "Peripherals", "createdAt": "2026-08-01T09:00:00Z", "updatedAt": "2026-08-01T09:00:00Z" }
```
**`CreateCategoryRequest` / `UpdateCategoryRequest`**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | ✅ | not blank |
| `description` | string | ❌ | — |

#### ➕ `POST /api/categories` 🔒 ADMIN → **201** `CategoryResponse`
```json
{ "name": "Accessories", "description": "Peripherals" }
```
#### ✏️ `PUT /api/categories/{id}` 🔒 ADMIN → **200** `CategoryResponse`
#### 🗑️ `DELETE /api/categories/{id}` 🔒 ADMIN → **204**
#### (public) `GET /api/categories` → `CategoryResponse[]` · `GET /api/categories/{id}` → `CategoryResponse`

---

## 4. Inventory Service (Admin)

**Base:** `/api/v1/inventory` · **Envelope:** COMMON `{success,message,data,timestamp}`.
Reads of a single product's availability and `/batch` are public; everything below is `ADMIN`.

### DTOs

**`InventoryResponse`** (inside `data`)
```json
{
  "productId": 42,
  "sku": "WM-2024-BLK",
  "quantityOnHand": 120,
  "quantityReserved": 8,
  "quantityAvailable": 112,
  "reorderLevel": 20,
  "lowStock": false,
  "inStock": true,
  "warehouseCode": "MAIN",
  "updatedAt": "2026-08-22T11:00:00Z"
}
```

**`StockMovementResponse`** (ledger row)
```json
{
  "id": 9001,
  "productId": 42,
  "movementType": "COMMIT",
  "quantityDelta": -2,
  "onHandAfter": 118,
  "reservedAfter": 6,
  "referenceType": "ORDER",
  "referenceId": "a1b2c3d4-...",
  "reason": "CORRECTION",
  "note": "Water damage, pallet 7",
  "actorId": "keycloak-user-uuid",
  "createdAt": "2026-08-22T11:00:00Z"
}
```
`movementType` ∈ `INBOUND, RESERVE, RELEASE, COMMIT, ADJUSTMENT, RETURN, EXPIRE`.

### Endpoints

#### 📉 Low-stock report — `GET /api/v1/inventory/low-stock` 🔒 ADMIN
Items at/below reorder level, scarcest first. → **200** `data: InventoryResponse[]`

#### ➕ Create inventory record — `POST /api/v1/inventory` 🔒 ADMIN
Body: `CreateInventoryRequest`

| Field | Type | Required | Validation / default |
|---|---|---|---|
| `productId` | long | ✅ | not null |
| `sku` | string | ✅ | not blank, ≤ 100 chars |
| `quantityOnHand` | integer | ✅ | ≥ 0 |
| `reorderLevel` | integer | ❌ | ≥ 0; default **10** |
| `warehouseCode` | string | ❌ | ≤ 20; default **MAIN** |
```json
{ "productId": 42, "sku": "WM-2024-BLK", "quantityOnHand": 100, "reorderLevel": 20, "warehouseCode": "MAIN" }
```
Responses: **201** `data: InventoryResponse` (Location: `/api/v1/inventory/{productId}`) · 409 (record already exists) · 400 · 401 · 403

#### 📦 Set absolute stock (stock take) — `PUT /api/v1/inventory/{productId}` 🔒 ADMIN
Body: `SetStockRequest`

| Field | Type | Required | Validation |
|---|---|---|---|
| `quantityOnHand` | integer | ✅ | ≥ 0 |
| `note` | string | ❌ | ≤ 500 chars |
```json
{ "quantityOnHand": 85, "note": "Q3 stock take, warehouse A" }
```
Responses: **200** `message:"Stock updated"`, `data: InventoryResponse` · **409** if new figure is below reserved units · 400 · 401 · 403 · 404

#### 🔧 Adjust stock (relative) — `PATCH /api/v1/inventory/{productId}/adjust` 🔒 ADMIN
Body: `AdjustStockRequest`

| Field | Type | Required | Validation |
|---|---|---|---|
| `delta` | integer | ✅ | signed, must not be 0 |
| `reason` | enum | ✅ | `INBOUND, DAMAGED, LOST, RETURNED, CORRECTION, MANUAL` |
| `note` | string | ❌ | ≤ 500 chars |
```json
{ "delta": -5, "reason": "DAMAGED", "note": "Water damage, pallet 7" }
```
Responses: **200** `message:"Stock adjusted"`, `data: InventoryResponse` · **409** if result would fall below reserved · 400 · 401 · 403

#### 🔔 Update reorder level — `PATCH /api/v1/inventory/{productId}/reorder-level` 🔒 ADMIN
Body: `UpdateReorderLevelRequest`

| Field | Type | Required | Validation |
|---|---|---|---|
| `reorderLevel` | integer | ✅ | ≥ 0 |
```json
{ "reorderLevel": 25 }
```
Responses: **200** `message:"Reorder level updated"`, `data: InventoryResponse`

#### 📜 Audit ledger — `GET /api/v1/inventory/{productId}/movements` 🔒 ADMIN
Query params (all optional): `movementType` (enum), `fromDate` / `toDate` (ISO-8601 date-time),
`page` (default 0), `size` (default 50). Newest first.
→ **200** `data: PagedResponse<StockMovementResponse>`:
```json
{
  "success": true, "message": "Success", "timestamp": "...",
  "data": { "content": [ /* StockMovementResponse[] */ ], "page": 0, "size": 50, "totalElements": 12, "totalPages": 1, "last": true }
}
```

> Note: the `/api/v1/inventory/reservations/**` endpoints exist but are **internal** (not routed
> publicly / not for the admin UI) — omitted here.

---

## 5. Order Service (Admin)

**Base:** `/api/v1/orders` · **Envelope:** COMMON. Only **one** admin-specific endpoint;
all other order endpoints are customer-scoped by `X-User-Id`.

#### 🗑️ Delete order — `DELETE /api/v1/orders/{id}` 🔒 ADMIN
Path: `id` (UUID). Permanently deletes an order. Non-admin → 403.
Responses: **204 No Content** (empty body, no envelope) · 401 · 403 · 404

> For building admin order views you'll likely also use the customer endpoints
> (`GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `PATCH /api/v1/orders/{id}/cancel`), but those
> are scoped to the caller's own `X-User-Id` — there is currently **no** admin "list all orders"
> endpoint in this service.

---

## 6. Notification Service — Admin Notifications

**Base:** `/api/v1/notifications` · **Envelope:** SLIM `{ "success", "data" }`. All `ADMIN`.

### DTOs

**`NotificationResponse`**
```json
{
  "id": "uuid",
  "channel": "EMAIL",
  "templateCode": "ORDER_CONFIRMATION",
  "subject": "Your order is confirmed",
  "bodyPreview": "Hi Jane, your order #123...",
  "body": null,
  "recipient": "j***@example.com",
  "status": "SENT",
  "referenceType": "ORDER",
  "referenceId": "123",
  "readAt": null,
  "sentAt": "2026-08-22T10:00:00Z",
  "createdAt": "2026-08-22T09:59:00Z"
}
```
- `channel` ∈ `EMAIL, SMS, IN_APP, PUSH`
- `status` ∈ `PENDING, SENDING, SENT, FAILED, RETRYING, SUPPRESSED, CANCELLED`
- `recipient` is masked. `bodyPreview` (first 120 chars) is set in list views; `body` (full) only in detail/create responses.

#### 📤 Send ad-hoc notification — `POST /api/v1/notifications` 🔒 ADMIN
Body: `SendNotificationRequest`

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | UUID | ❌* | target user |
| `recipient` | string | ❌* | email (EMAIL/PUSH) or phone (SMS) |
| `channel` | enum | ✅ | `EMAIL, SMS, IN_APP, PUSH` |
| `templateCode` | string | ✅ | must resolve to an active template |
| `locale` | string | ❌ | defaults to user's preference |
| `priority` | integer | ❌ | 1–9, default 5 |
| `variables` | object (map) | ❌ | template variables |
| `referenceType` | string | ❌ | e.g. `ORDER` |
| `referenceId` | string | ❌ | |
```json
{
  "userId": "a1b2c3d4-...",
  "recipient": "jane@example.com",
  "channel": "EMAIL",
  "templateCode": "ORDER_CONFIRMATION",
  "locale": "en",
  "priority": 5,
  "variables": { "orderId": "123", "name": "Jane" },
  "referenceType": "ORDER",
  "referenceId": "123"
}
```
Responses: **201** `data: NotificationResponse` (full `body`) · 400 (validation / dispatch failed) · **404** template not found · **429** rate limit exceeded · 401 · 403

#### 🔁 Retry failed notification — `POST /api/v1/notifications/{id}/retry` 🔒 ADMIN
Path: `id` (UUID). Only a `FAILED` notification can be retried (resets to `PENDING`).
Responses: **200** `data: NotificationResponse` · **409/400** if not in FAILED state · **404** · 401 · 403

#### 📋 List all notifications — `GET /api/v1/notifications/admin` 🔒 ADMIN
Query (all optional): `userId` (UUID), `channel` (enum), `status` (enum), `referenceType` (string),
`referenceId` (string), `page` (default 0), `size` (default 20).
→ **200** `data:` **Spring `Page` object** (note: different shape from `PagedResponse`):
```json
{
  "success": true,
  "data": {
    "content": [ /* NotificationResponse (listItem: bodyPreview set, body null) */ ],
    "number": 0,
    "size": 20,
    "totalElements": 42,
    "totalPages": 3,
    "first": true,
    "last": false,
    "numberOfElements": 20,
    "sort": { "sorted": false, "empty": true, "unsorted": true },
    "pageable": { "pageNumber": 0, "pageSize": 20, "offset": 0, "paged": true, "unpaged": false }
  }
}
```
> The current page index is `data.number` here (Spring `Page`), not `data.page`.

#### 🚨 List failed queue — `GET /api/v1/notifications/admin/failed?page=0&size=20` 🔒 ADMIN
Shortcut for the above filtered to `status = FAILED`. Same `Page<NotificationResponse>` shape.

---

## 7. Notification Service — Templates (Admin)

**Base:** `/api/v1/notification-templates` · **Envelope:** SLIM `{success,data}`. All `ADMIN`.

### DTOs

**`TemplateResponse`**
```json
{
  "id": 5,
  "code": "ORDER_CONFIRMATION",
  "channel": "EMAIL",
  "locale": "en",
  "subjectTemplate": "Your order {{orderId}} is confirmed",
  "bodyTemplate": "Hi {{name}}, ...",
  "contentType": "HTML",
  "requiredVars": ["orderId", "name"],
  "description": "Sent after successful payment",
  "active": true,
  "versionNo": 3,
  "createdAt": "2026-07-01T00:00:00Z",
  "updatedAt": "2026-08-01T00:00:00Z"
}
```

**`TemplateRequest`** (create & update)

| Field | Type | Required | Validation |
|---|---|---|---|
| `code` | string | ✅ | not blank, ≤ 50 |
| `channel` | enum | ✅ | `EMAIL, SMS, IN_APP, PUSH` |
| `locale` | string | ❌ | ≤ 10; defaults to `en` |
| `subjectTemplate` | string | ❌ | ≤ 255 |
| `bodyTemplate` | string | ✅ | not blank |
| `contentType` | enum | ✅ | `TEXT, HTML` |
| `requiredVars` | string[] | ❌ | |
| `description` | string | ❌ | ≤ 255 |

### Endpoints

#### 📄 List — `GET /api/v1/notification-templates?page=0&size=20` 🔒 ADMIN
→ **200** `data:` Spring `Page<TemplateResponse>` (same page shape as §6).

#### ➕ Create — `POST /api/v1/notification-templates` 🔒 ADMIN
Body: `TemplateRequest`. Validates handlebars/template syntax.
```json
{
  "code": "ORDER_CONFIRMATION",
  "channel": "EMAIL",
  "locale": "en",
  "subjectTemplate": "Your order {{orderId}} is confirmed",
  "bodyTemplate": "Hi {{name}}, your order is confirmed.",
  "contentType": "HTML",
  "requiredVars": ["orderId", "name"],
  "description": "Sent after successful payment"
}
```
Responses: **201** `data: TemplateResponse` · 400 (syntax/validation) · 401 · 403 · 409 (duplicate code)

#### 🔎 Get one — `GET /api/v1/notification-templates/{id}` 🔒 ADMIN → **200** `data: TemplateResponse` · 404

#### ✏️ Update — `PUT /api/v1/notification-templates/{id}` 🔒 ADMIN
Body: `TemplateRequest`. Bumps `versionNo`. → **200** `data: TemplateResponse` · 400 · 404

#### 🗑️ Deactivate — `DELETE /api/v1/notification-templates/{id}` 🔒 ADMIN
Soft-deactivate (sets `active=false`). → **204 No Content** · 404

#### 👁️ Preview — `POST /api/v1/notification-templates/{id}/preview` 🔒 ADMIN
Renders template with sample variables without sending. Body: `PreviewRequest`
```json
{ "variables": { "orderId": "123", "name": "Jane" } }
```
→ **200** `data: PreviewResponse`:
```json
{ "subject": "Your order 123 is confirmed", "body": "Hi Jane, ...", "missingVariables": [] }
```

---

## 8. Review Service (Admin capability)

**Base:** `/api/v1/reviews` · **Envelope:** RAW DTO. No dedicated admin endpoints, but admins
have an **elevated privilege on delete**.

#### 🗑️ Delete review — `DELETE /api/v1/reviews/{id}`
- A normal user may delete **only their own** review.
- An **ADMIN** may delete **any** user's review.

Authorization is decided in the service layer from `X-User-Roles` (injected by the gateway).
The frontend just calls it with the admin's token; no special payload.
Responses: **204 No Content** · 403 (non-admin deleting someone else's) · 404

---

## 9. Payment Service

No admin-specific endpoints. `POST /api/v1/payments/checkout/{orderId}` and
`GET /api/v1/payments/{orderId}` are authenticated (any logged-in user); `/notify` is the
public PayHere webhook. Nothing here is `ADMIN`-gated.

---

## 10. Quick admin endpoint index

| # | Method | Path | Role | Body → Response |
|---|---|---|---|---|
| 1 | POST | `/api/products` | ADMIN | CreateProductRequest → 201 ProductResponse |
| 2 | PUT | `/api/products/{id}` | ADMIN | UpdateProductRequest → 200 ProductResponse |
| 3 | DELETE | `/api/products/{id}` | ADMIN | — → 204 |
| 4 | POST | `/api/categories` | ADMIN | CreateCategoryRequest → 201 CategoryResponse |
| 5 | PUT | `/api/categories/{id}` | ADMIN | UpdateCategoryRequest → 200 CategoryResponse |
| 6 | DELETE | `/api/categories/{id}` | ADMIN | — → 204 |
| 7 | GET | `/api/v1/inventory/low-stock` | ADMIN | — → 200 InventoryResponse[] |
| 8 | POST | `/api/v1/inventory` | ADMIN | CreateInventoryRequest → 201 InventoryResponse |
| 9 | PUT | `/api/v1/inventory/{productId}` | ADMIN | SetStockRequest → 200 InventoryResponse |
| 10 | PATCH | `/api/v1/inventory/{productId}/adjust` | ADMIN | AdjustStockRequest → 200 InventoryResponse |
| 11 | PATCH | `/api/v1/inventory/{productId}/reorder-level` | ADMIN | UpdateReorderLevelRequest → 200 InventoryResponse |
| 12 | GET | `/api/v1/inventory/{productId}/movements` | ADMIN | — → 200 PagedResponse<StockMovementResponse> |
| 13 | DELETE | `/api/v1/orders/{id}` | ADMIN | — → 204 |
| 14 | POST | `/api/v1/notifications` | ADMIN | SendNotificationRequest → 201 NotificationResponse |
| 15 | POST | `/api/v1/notifications/{id}/retry` | ADMIN | — → 200 NotificationResponse |
| 16 | GET | `/api/v1/notifications/admin` | ADMIN | — → 200 Page<NotificationResponse> |
| 17 | GET | `/api/v1/notifications/admin/failed` | ADMIN | — → 200 Page<NotificationResponse> |
| 18 | GET | `/api/v1/notification-templates` | ADMIN | — → 200 Page<TemplateResponse> |
| 19 | POST | `/api/v1/notification-templates` | ADMIN | TemplateRequest → 201 TemplateResponse |
| 20 | GET | `/api/v1/notification-templates/{id}` | ADMIN | — → 200 TemplateResponse |
| 21 | PUT | `/api/v1/notification-templates/{id}` | ADMIN | TemplateRequest → 200 TemplateResponse |
| 22 | DELETE | `/api/v1/notification-templates/{id}` | ADMIN | — → 204 |
| 23 | POST | `/api/v1/notification-templates/{id}/preview` | ADMIN | PreviewRequest → 200 PreviewResponse |
| 24 | DELETE | `/api/v1/reviews/{id}` | ADMIN can delete any | — → 204 |

---

## 11. Frontend integration notes / gotchas

- **Send `Authorization: Bearer <token>` on every admin call.** Never set `X-User-Id`/`X-User-Roles`.
- **Unwrap responses per service** (§1): product/review return the raw DTO; inventory/order/payment
  wrap in `{success,message,data,timestamp}` — read `.data`; notification wraps in `{success,data}`.
- **Two paging shapes:** product & inventory use `PageResponse`/`PagedResponse` where current page
  is `.page`; notification uses Spring `Page` where current page is `.number`.
- **`price` and `amount` are decimals** — parse carefully (avoid float rounding in the UI).
- **409 conflicts are expected UX**, not crashes: setting stock below reserved, duplicate inventory
  record, retrying a non-FAILED notification. Show a friendly message.
- **429 on ad-hoc notifications** = rate limited for that user; surface and let admin retry later.
- **204 responses have empty bodies** — don't try to `JSON.parse` them.
