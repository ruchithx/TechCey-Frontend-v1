/** Public surface of the auth feature (login/callback UI). Core auth plumbing
 * (provider, guards, useAuth) lives in @/core/auth, not here. */
export { LoginPage, CallbackPage } from "./pages/pages";
export { authRoutes } from "./auth.routes";
