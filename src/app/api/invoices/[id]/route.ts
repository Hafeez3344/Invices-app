import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ invoice: { status: null } });
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, payload")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoice: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth(req);
  if (!user) {
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
  const status = body.status;

  const { data, error } = await supabase
    .from("invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("id, invoice_number, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, invoice: data });
}
