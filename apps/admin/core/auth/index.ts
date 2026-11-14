/** Public surface of the admin auth layer. */

export { AuthProvider } from "@/core/auth/auth-provider";
export { RoleGuard } from "@/core/auth/guards";
export { useAuth, takeReturnTo } from "@/core/auth/use-auth";
export type { AuthApi } from "@/core/auth/use-auth";
export type { AppRole, CurrentUser } from "@/core/auth/jwt";
