import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const body = await req.json();

  if (!supabase) {
    return NextResponse.json({
      success: true,
      message: "Saved locally only (Supabase not configured)",
      invoice: body,
    });
  }

  const payload = {
    id: body.id,
    invoice_number: body.invoiceNumber,
    status: body.status || "In Transit",
    payload: body,
    created_by: user.id.startsWith("00000000") ? null : user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("invoices")
    .upsert(payload, { onConflict: "id" })
    .select("id, invoice_number, status")
    .single();

  if (error) {
    console.error("Failed to save invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, invoice: data });
}
