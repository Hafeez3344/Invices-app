import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { dbGetUserById, dbGetUserByUsername } from "./serverDb";
import type { SessionUser, UserRole } from "./types";

const JWT_SECRET = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "wasl-recipt-dev-secret-change-me"
  );

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET());
}

export async function verifyToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    return {
      id: String(payload.id),
      username: String(payload.username),
      full_name: String(payload.username),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export async function requireAuth(req: Request): Promise<SessionUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user) return null;

  // Enrich user from serverDb (which checks Supabase first if configured, else local DB)
  try {
    const dbUser = await dbGetUserById(user.id);
    if (dbUser) {
      if (!dbUser.is_active) return null;
      return {
        id: dbUser.id,
        username: dbUser.username,
        full_name: dbUser.full_name || dbUser.username,
        role: dbUser.role,
      };
    }
  } catch {
    // fall through
  }

  return user;
}

export async function requireAdmin(req: Request): Promise<SessionUser | null> {
  const user = await requireAuth(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

type LoginResult =
  | { success: true; token: string; user: SessionUser }
  | { success: false; error: string };

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<LoginResult> {
  const u = username.trim();
  const p = password;

  // 1. Check serverDb (checks Supabase if configured, and checks persistent local store)
  try {
    const dbUser = await dbGetUserByUsername(u);
    if (dbUser) {
      if (!dbUser.is_active) {
        return { success: false, error: "المستخدم غير نشط / User is inactive" };
      }
      const ok = await bcrypt.compare(p, dbUser.password_hash);
      if (ok) {
        const user: SessionUser = {
          id: dbUser.id,
          username: dbUser.username,
          full_name: dbUser.full_name || dbUser.username,
          role: dbUser.role,
        };
        const token = await signToken(user);
        return { success: true, token, user };
      }
    }
  } catch (e) {
    console.error("Database login failed, falling back to env:", e);
  }

  // 2. Env / seed admin fallback
  const envUser = process.env.ADMIN_USERNAME || "admin";
  const envPass = process.env.ADMIN_PASSWORD || "admin123";
  const envName = process.env.ADMIN_FULL_NAME || "مسؤول النظام";

  if (u.toLowerCase() === envUser.toLowerCase() && p === envPass) {
    const user: SessionUser = {
      id: "00000000-0000-0000-0000-000000000001",
      username: envUser,
      full_name: envName,
      role: "admin",
    };
    const token = await signToken(user);
    return { success: true, token, user };
  }

  return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة / Invalid credentials" };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
