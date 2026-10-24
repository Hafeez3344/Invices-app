import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { dbGetInvoice, dbUpdateInvoiceStatus, dbDeleteInvoice } from "@/lib/serverDb";
import { purgeExpiredSupabaseInvoices } from "@/lib/invoiceCleanup";
import type { InvoiceStatus } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await purgeExpiredSupabaseInvoices();
    const result = await dbGetInvoice(params.id);

    if (result.expired) {
      return NextResponse.json({ invoice: null, expired: true });
    }

    if (!result.invoice) {
      return NextResponse.json({ invoice: null });
    }

    return NextResponse.json({ invoice: result.invoice });
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const status = body.status as InvoiceStatus;

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  try {
    await purgeExpiredSupabaseInvoices();
    const result = await dbUpdateInvoiceStatus(params.id, status);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      message: `Status updated to ${status} successfully`,
    });
  } catch (error) {
    console.error("PATCH /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbDeleteInvoice(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
