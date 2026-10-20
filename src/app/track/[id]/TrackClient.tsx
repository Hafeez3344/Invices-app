"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/defaults";
import { statusLabelAr, type InvoiceStatus } from "@/lib/types";

export default function TrackClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const statusFromQr = searchParams.get("status") as InvoiceStatus | null;
  const [status, setStatus] = useState<InvoiceStatus>(
    statusFromQr || "In Transit"
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.invoice?.status) setStatus(data.invoice.status);
        if (data?.invoice?.invoice_number)
          setInvoiceNumber(data.invoice.invoice_number);
      } catch {
        /* keep QR status */
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 font-cairo flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wasl-logo.jpg"
          alt={BRAND.name}
          className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
        />
        <h1 className="text-xl font-bold text-[#204978]">{BRAND.nameAr}</h1>
        <p className="mt-2 text-sm text-slate-600">تتبع سند التسليم</p>

        {invoiceNumber && (
          <p className="mt-3 text-sm font-semibold text-slate-800">
            رقم الوثيقة: {invoiceNumber}
          </p>
        )}

        <div className="mt-4 rounded-xl bg-[#1B7A6E] px-4 py-3 text-white">
          <p className="text-xs opacity-90">الحالة / Status</p>
          <p className="text-lg font-bold">{statusLabelAr(status)}</p>
          <p className="text-xs opacity-80 mt-0.5" dir="ltr">
            {status || "In Transit"}
          </p>
        </div>

        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 break-all">
          ID: {id}
        </p>
      </div>
    </div>
  );
}
