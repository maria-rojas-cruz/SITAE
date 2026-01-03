// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    token?: string  // ← El token del backend
    user: DefaultSession["user"]
  }

  interface User extends DefaultUser {
    token?: string  // ← El token del backend
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token?: string  // ← El token del backend
  }
}