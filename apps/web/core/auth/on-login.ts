/**
 * Login-success seam (D3.7).
 *
 * cart-service exposes POST /api/cart/merge to fold a guest cart into the
 * authenticated one after login. That logic belongs to the CART feature owner,
 * not here. This module only provides the hook POINT: the cart feature calls
 * `onLoginSuccess(cb)` (e.g. in a provider mount) and the auth provider fires
 * all subscribers once, right after a successful sign-in.
 *
 * Do NOT implement merge logic here.
 */

import type { CurrentUser } from "@/core/auth/jwt";

type LoginSuccessHandler = (user: CurrentUser) => void;

const handlers = new Set<LoginSuccessHandler>();

/** Subscribe to login success. Returns an unsubscribe function. */
export function onLoginSuccess(handler: LoginSuccessHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

/** Fired by the auth provider after a successful sign-in. Internal use. */
export function emitLoginSuccess(user: CurrentUser): void {
  for (const handler of handlers) handler(user);
}
