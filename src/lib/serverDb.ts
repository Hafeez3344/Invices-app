import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { isInvoiceExpired, type DeliveryOrder, type InvoiceStatus, type UserRole } from "./types";

export interface ServerUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  password_hash: string;
  is_seed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServerInvoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  payload: DeliveryOrder;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseSchema {
  users: ServerUser[];
  invoices: ServerInvoice[];
  version: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Default seed admin (bcrypt hash of 'admin123')
const DEFAULT_SEED_ADMIN: ServerUser = {
  id: "00000000-0000-0000-0000-000000000001",
  username: process.env.ADMIN_USERNAME || "admin",
  full_name: process.env.ADMIN_FULL_NAME || "مسؤول النظام",
  role: "admin",
  is_active: true,
  password_hash:
    "$2b$10$1TLo/UbIp4GY4leyuEEVPeGuSmw4ibpnaBse2v7bhS/.uu5r5AVD2",
  is_seed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        version: 1,
        users: [DEFAULT_SEED_ADMIN],
        invoices: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content) as DatabaseSchema;
    if (!parsed.users || !Array.isArray(parsed.users)) parsed.users = [DEFAULT_SEED_ADMIN];
    if (!parsed.invoices || !Array.isArray(parsed.invoices)) parsed.invoices = [];

    // Ensure seed admin is present if users is empty
    if (parsed.users.length === 0) {
      parsed.users.push(DEFAULT_SEED_ADMIN);
      writeDbDirect(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database file, returning fallback:", err);
    return {
      version: 1,
      users: [DEFAULT_SEED_ADMIN],
      invoices: [],
    };
  }
}

function writeDbDirect(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error("Failed to write to database file:", err);
  }
}

/** Purge invoices older than 5 days from local server database */
export function purgeLocalExpiredInvoices(): void {
  try {
    const db = ensureDbFile();
    const beforeCount = db.invoices.length;
    db.invoices = db.invoices.filter((inv) => !isInvoiceExpired(inv.created_at));
    if (db.invoices.length !== beforeCount) {
      writeDbDirect(db);
    }
  } catch (e) {
    console.error("Failed to purge expired local invoices:", e);
  }
}

// ================= USER OPERATIONS =================

function stripPassword(user: ServerUser): Omit<ServerUser, "password_hash"> {
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    ...(user.is_seed !== undefined ? { is_seed: user.is_seed } : {}),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function dbGetUsers(): Promise<Array<Omit<ServerUser, "password_hash">>> {
  // If Supabase is configured, try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("app_users")
        .select("id, username, full_name, role, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Array<Omit<ServerUser, "password_hash">>;
      }
    } catch (e) {
      console.warn("Supabase getUsers failed, using local DB:", e);
    }
  }

  // Fallback to local server database
  const db = ensureDbFile();
  return db.users.map(stripPassword);
}

export async function dbGetUserById(id: string): Promise<ServerUser | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("app_users")
        .select("id, username, full_name, role, is_active, password_hash, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) return data as ServerUser;
    } catch {
      /* fallback */
    }
  }

  const db = ensureDbFile();
  return db.users.find((u) => u.id === id) || null;
}

export async function dbGetUserByUsername(username: string): Promise<ServerUser | null> {
  const clean = username.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("app_users")
        .select("id, username, full_name, role, is_active, password_hash, created_at, updated_at")
        .eq("username", username.trim())
        .maybeSingle();

      if (!error && data) return data as ServerUser;
    } catch {
      /* fallback */
    }
  }

  const db = ensureDbFile();
  return db.users.find((u) => u.username.toLowerCase() === clean) || null;
}

export async function dbCreateUser(params: {
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  password_hash: string;
}): Promise<{ success: true; user: Omit<ServerUser, "password_hash"> } | { error: string }> {
  const username = params.username.trim();
  const db = ensureDbFile();

  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { error: "اسم المستخدم مسجل مسبقاً / Username already exists" };
  }

  const newUser: ServerUser = {
    id: crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username,
    full_name: params.full_name.trim(),
    role: params.role || "user",
    is_active: params.is_active !== false,
    password_hash: params.password_hash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.unshift(newUser);
  writeDbDirect(db);

  // If Supabase configured, attempt cloud insert
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      await supabase.from("app_users").insert({
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
        is_active: newUser.is_active,
        password_hash: newUser.password_hash,
      });
    } catch (e) {
      console.warn("User saved locally, cloud insert failed:", e);
    }
  }

  return { success: true, user: stripPassword(newUser) };
}

export async function dbUpdateUser(
  id: string,
  updates: {
    full_name?: string;
    role?: UserRole;
    is_active?: boolean;
    password_hash?: string;
  }
): Promise<{ success: true; user: Omit<ServerUser, "password_hash"> } | { error: string }> {
  const db = ensureDbFile();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    return { error: "المستخدم غير موجود / User not found" };
  }

  if (updates.full_name !== undefined) user.full_name = updates.full_name.trim();
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.is_active !== undefined) user.is_active = updates.is_active;
  if (updates.password_hash) user.password_hash = updates.password_hash;
  user.updated_at = new Date().toISOString();

  writeDbDirect(db);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const cloudUpdates: Record<string, unknown> = {
        updated_at: user.updated_at,
      };
      if (updates.full_name !== undefined) cloudUpdates.full_name = user.full_name;
      if (updates.role !== undefined) cloudUpdates.role = user.role;
      if (updates.is_active !== undefined) cloudUpdates.is_active = user.is_active;
      if (updates.password_hash) cloudUpdates.password_hash = user.password_hash;

      await supabase.from("app_users").update(cloudUpdates).eq("id", id);
    } catch (e) {
      console.warn("User updated locally, cloud update failed:", e);
    }
  }

  return { success: true, user: stripPassword(user) };
}

export async function dbDeleteUser(id: string): Promise<{ success: true } | { error: string }> {
  const db = ensureDbFile();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    return { error: "المستخدم غير موجود / User not found" };
  }

  if (user.is_seed || user.username.toLowerCase() === "admin") {
    return { error: "لا يمكن حذف حساب المسؤول الأساسي / Cannot delete default admin" };
  }

  db.users = db.users.filter((u) => u.id !== id);
  writeDbDirect(db);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      await supabase.from("app_users").delete().eq("id", id);
    } catch (e) {
      console.warn("User deleted locally, cloud delete failed:", e);
    }
  }

  return { success: true };
}

// ================= INVOICE OPERATIONS =================

export async function dbSaveInvoice(
  order: DeliveryOrder,
  createdBy?: string | null
): Promise<{ success: true; invoice: ServerInvoice }> {
  purgeLocalExpiredInvoices();
  const db = ensureDbFile();

  const now = new Date().toISOString();
  const existingIdx = db.invoices.findIndex((inv) => inv.id === order.id);

  const invoiceRecord: ServerInvoice = {
    id: order.id,
    invoice_number: order.invoiceNumber,
    status: order.status || "In Transit",
    payload: {
      ...order,
      status: order.status || "In Transit",
      updatedAt: now,
    },
    created_by: createdBy || null,
    created_at: (existingIdx >= 0 ? db.invoices[existingIdx].created_at : order.createdAt) || now,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    db.invoices[existingIdx] = invoiceRecord;
  } else {
    db.invoices.unshift(invoiceRecord);
  }

  writeDbDirect(db);

  // If Supabase configured, sync with Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const cloudPayload = {
        id: invoiceRecord.id,
        invoice_number: invoiceRecord.invoice_number,
        status: invoiceRecord.status,
        payload: invoiceRecord.payload,
        created_by: invoiceRecord.created_by?.startsWith("00000000") ? null : invoiceRecord.created_by,
        updated_at: now,
      };
      await supabase.from("invoices").upsert(cloudPayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Invoice saved to local database, Supabase sync failed:", e);
    }
  }

  return { success: true, invoice: invoiceRecord };
}

export async function dbGetInvoice(
  id: string
): Promise<{ invoice: ServerInvoice | null; expired?: boolean }> {
  purgeLocalExpiredInvoices();

  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, payload, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        if (isInvoiceExpired(data.created_at)) {
          await supabase.from("invoices").delete().eq("id", id);
          return { invoice: null, expired: true };
        }
        return {
          invoice: {
            id: data.id,
            invoice_number: data.invoice_number,
            status: data.status,
            payload: data.payload as DeliveryOrder,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
        };
      }
    } catch (e) {
      console.warn("Supabase fetch failed, looking up in local DB:", e);
    }
  }

  // Lookup in local server database
  const db = ensureDbFile();
  const found = db.invoices.find((inv) => inv.id === id);

  if (!found) {
    return { invoice: null, expired: false };
  }

  if (isInvoiceExpired(found.created_at)) {
    db.invoices = db.invoices.filter((inv) => inv.id !== id);
    writeDbDirect(db);
    return { invoice: null, expired: true };
  }

  return { invoice: found, expired: false };
}

export async function dbUpdateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<{ success: true; invoice: ServerInvoice } | { error: string; status?: number }> {
  purgeLocalExpiredInvoices();
  const db = ensureDbFile();
  const found = db.invoices.find((inv) => inv.id === id);

  if (!found) {
    // If not in local db, maybe in Supabase?
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data: cloudInv } = await supabase
          .from("invoices")
          .select("id, payload, created_at")
          .eq("id", id)
          .maybeSingle();

        if (cloudInv) {
          if (isInvoiceExpired(cloudInv.created_at)) {
            await supabase.from("invoices").delete().eq("id", id);
            return { error: "Invoice expired (kept 5 days)", status: 410 };
          }
          const nextPayload = cloudInv.payload
            ? { ...(cloudInv.payload as object), status }
            : { status };

          const { data: updated } = await supabase
            .from("invoices")
            .update({ status, payload: nextPayload, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("id, invoice_number, status, payload, created_at, updated_at")
            .single();

          if (updated) {
            const invoiceObj: ServerInvoice = {
              id: updated.id,
              invoice_number: updated.invoice_number,
              status: updated.status,
              payload: updated.payload as DeliveryOrder,
              created_at: updated.created_at,
              updated_at: updated.updated_at,
            };
            db.invoices.unshift(invoiceObj);
            writeDbDirect(db);
            return { success: true, invoice: invoiceObj };
          }
        }
      } catch {
        /* fallback */
      }
    }

    return { error: "الفاتورة غير موجودة / Invoice not found", status: 404 };
  }

  if (isInvoiceExpired(found.created_at)) {
    db.invoices = db.invoices.filter((inv) => inv.id !== id);
    writeDbDirect(db);
    return { error: "انتهت صلاحية الفاتورة (تحفظ لمدة 5 أيام فقط) / Invoice expired", status: 410 };
  }

  found.status = status;
  if (found.payload) {
    found.payload.status = status;
    found.payload.updatedAt = new Date().toISOString();
  }
  found.updated_at = new Date().toISOString();

  writeDbDirect(db);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      await supabase
        .from("invoices")
        .update({
          status,
          payload: found.payload,
          updated_at: found.updated_at,
        })
        .eq("id", id);
    } catch (e) {
      console.warn("Status updated locally, Supabase update failed:", e);
    }
  }

  return { success: true, invoice: found };
}

export async function dbListInvoices(limit = 100): Promise<ServerInvoice[]> {
  purgeLocalExpiredInvoices();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, payload, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          invoice_number: d.invoice_number,
          status: d.status,
          payload: d.payload as DeliveryOrder,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
      }
    } catch {
      /* fallback */
    }
  }

  const db = ensureDbFile();
  return db.invoices
    .filter((inv) => !isInvoiceExpired(inv.created_at))
    .slice(0, limit);
}

export async function dbDeleteInvoice(id: string): Promise<{ success: true }> {
  const db = ensureDbFile();
  db.invoices = db.invoices.filter((inv) => inv.id !== id);
  writeDbDirect(db);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase()!;
      await supabase.from("invoices").delete().eq("id", id);
    } catch (e) {
      console.warn("Deleted locally, cloud delete failed:", e);
    }
  }

  return { success: true };
}
