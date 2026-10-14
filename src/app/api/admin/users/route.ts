import { NextResponse } from "next/server";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({
      users: [],
      message: "Supabase not configured",
    });
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, full_name, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const username = String(body.username || "").trim();
  const full_name = String(body.full_name || "").trim();
  const password = String(body.password || "");
  const role = body.role === "admin" ? "admin" : "user";
  const is_active = body.is_active !== false;

  if (!username || !password || !full_name) {
    return NextResponse.json(
      { error: "full_name, username and password are required" },
      { status: 400 }
    );
  }

  const password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from("app_users")
    .insert({
      username,
      full_name,
      role,
      is_active,
      password_hash,
    })
    .select("id, username, full_name, role, is_active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}
