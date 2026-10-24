import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { dbListInvoices, dbSaveInvoice } from "@/lib/serverDb";
import { purgeExpiredSupabaseInvoices } from "@/lib/invoiceCleanup";

export async function GET(req: Request) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await purgeExpiredSupabaseInvoices();
    const invoices = await dbListInvoices(100);
    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await purgeExpiredSupabaseInvoices();
    const body = await req.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Invoice data and id are required" },
        { status: 400 }
      );
    }

    const result = await dbSaveInvoice(body, user.id);
    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      message: "Invoice saved successfully",
    });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json(
      { error: "Failed to save invoice" },
      { status: 500 }
    );
  }
}
