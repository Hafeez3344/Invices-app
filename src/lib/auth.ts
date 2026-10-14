import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getSupabase, isSupabaseConfigured } from "./supabase";
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

  // Enrich full_name from DB when possible (keep JWT user if not in DB — env admin)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("app_users")
        .select("id, username, full_name, role, is_active")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        if (!data.is_active) return null;
        return {
          id: data.id,
          username: data.username,
          full_name: data.full_name || data.username,
          role: data.role as UserRole,
        };
      }
    } catch {
      // fall through to JWT user
    }
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

  // Prefer Supabase users table
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("app_users")
        .select("id, username, full_name, role, is_active, password_hash")
        .eq("username", u)
        .maybeSingle();

      if (!error && data) {
        if (!data.is_active) {
          return { success: false, error: "User is inactive" };
        }
        const ok = await bcrypt.compare(p, data.password_hash);
        if (!ok) return { success: false, error: "Invalid credentials" };

        const user: SessionUser = {
          id: data.id,
          username: data.username,
          full_name: data.full_name || data.username,
          role: data.role as UserRole,
        };
        const token = await signToken(user);
        return { success: true, token, user };
      }
    } catch (e) {
      console.error("Supabase login failed, falling back to env auth:", e);
    }
  }

  // Env / seed fallback (same pattern as reference)
  const envUser = process.env.ADMIN_USERNAME || "admin";
  const envPass = process.env.ADMIN_PASSWORD || "admin123";
  const envName = process.env.ADMIN_FULL_NAME || "مسؤول النظام";

  if (u === envUser && p === envPass) {
    const user: SessionUser = {
      id: "00000000-0000-0000-0000-000000000001",
      username: envUser,
      full_name: envName,
      role: "admin",
    };
    const token = await signToken(user);
    return { success: true, token, user };
  }

  return { success: false, error: "Invalid credentials" };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
