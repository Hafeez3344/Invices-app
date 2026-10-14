import { NextResponse } from "next/server";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.full_name !== undefined) updates.full_name = String(body.full_name);
  if (body.role !== undefined)
    updates.role = body.role === "admin" ? "admin" : "user";
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.password) updates.password_hash = await hashPassword(String(body.password));

  const { data, error } = await supabase
    .from("app_users")
    .update(updates)
    .eq("id", params.id)
    .select("id, username, full_name, role, is_active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const { error } = await supabase.from("app_users").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
