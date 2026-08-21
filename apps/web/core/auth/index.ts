/** Public surface of the auth layer (D3). */

export { AuthProvider } from "@/core/auth/auth-provider";
export { AuthGuard, RoleGuard } from "@/core/auth/guards";
export { useAuth, takeReturnTo } from "@/core/auth/use-auth";
export type { AuthApi } from "@/core/auth/use-auth";
export { onLoginSuccess } from "@/core/auth/on-login";
export type { AppRole, CurrentUser } from "@/core/auth/jwt";
