"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/defaults";
import { getRecentInvoices } from "@/lib/idb";
import {
  statusLabelAr,
  type DeliveryOrder,
  type InvoiceStatus,
} from "@/lib/types";

export default function TrackClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const statusFromQr = searchParams.get("status") as InvoiceStatus | null;
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [status, setStatus] = useState<InvoiceStatus>(
    statusFromQr || "In Transit"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let found: DeliveryOrder | null = null;

      // 1) API / Supabase payload
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.invoice?.status) setStatus(data.invoice.status);
          if (data?.invoice?.payload) {
            found = data.invoice.payload as DeliveryOrder;
          }
        }
      } catch {
        /* continue */
      }

      // 2) localStorage (saved on download)
      if (!found) {
        try {
          const raw = localStorage.getItem(`public_invoice_${id}`);
          if (raw) found = JSON.parse(raw) as DeliveryOrder;
        } catch {
          /* continue */
        }
      }

      // 3) IndexedDB history
      if (!found) {
        try {
          const recent = await getRecentInvoices();
          found = recent.find((inv) => inv.id === id) || null;
        } catch {
          /* continue */
        }
      }

      if (found) {
        setOrder(found);
        if (found.status) setStatus(found.status);
      }
      setLoading(false);
    })();
  }, [id]);

  const items = order?.items?.length
    ? order.items
    : order?.load
      ? [order.load]
      : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-cairo py-6 px-3" dir="rtl">
      <div className="mx-auto w-full max-w-[794px] rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        {/* Header */}
        <div className="mb-4 grid grid-cols-[100px_1fr_100px] items-stretch gap-3 border-b-2 border-[#204978] pb-3">
          <div className="flex h-[100px] w-[100px] overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order?.company?.logoDataUrl || "/wasl-logo.jpg"}
              alt="logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1 text-sm">
            <p className="font-extrabold text-[#204978] text-base">
              {order?.company?.nameAr || BRAND.nameAr}
            </p>
            <p className="text-slate-600">
              {order?.company?.addressAr || "—"}
            </p>
            <p className="text-slate-600" dir="ltr">
              {order?.company?.phone || "—"}
            </p>
          </div>
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl bg-[#1B7A6E] text-center text-white p-2">
            <div>
              <p className="text-[10px] opacity-90">الحالة</p>
              <p className="text-sm font-bold leading-tight">
                {statusLabelAr(status)}
              </p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <InfoCard
            label="Invoice Number / رقم الطلب"
            value={order?.invoiceNumber || "—"}
          />
          <InfoCard
            label="Receipt Date / تاريخ الاستلام"
            value={order?.receiptDate || "—"}
          />
          <InfoCard
            label="Delivery Date / تاريخ التسليم"
            value={order?.deliveryDate || "—"}
          />
        </div>

        <Section title="Car Information / معلومات المركبة">
          <Row
            items={[
              ["Plate / لوحة", order?.car?.plateNumber],
              ["Owner / المالك", order?.car?.owner],
              ["ID / الهوية", order?.car?.idNumber],
            ]}
          />
        </Section>

        <Section title="Receiver Information / معلومات المستلم">
          <Row
            items={[
              ["Name / الاسم", order?.receiver?.name],
              ["Address / العنوان", order?.receiver?.address],
              ["Mobile / الجوال", order?.receiver?.mobile],
            ]}
          />
        </Section>

        <Section title="Transportation / معلومات النقل">
          <Row
            items={[
              ["From / من", order?.transport?.fromCity],
              ["To / إلى", order?.transport?.toCity],
              ["Order No", order?.transport?.orderNo],
            ]}
          />
        </Section>

        <Section title="Driver Information / معلومات السائق">
          <Row
            items={[
              ["Name / الاسم", order?.driver?.name],
              ["Iqama / الإقامة", order?.driver?.iqamaNumber],
              ["Mobile / الجوال", order?.driver?.mobile],
            ]}
          />
        </Section>

        <Section title="Load Information / معلومات الحمولة">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد أصناف</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-200 px-2 py-2 text-center font-bold text-[#204978]">
                      Goods Type
                    </th>
                    <th className="border border-slate-200 px-2 py-2 text-center font-bold text-[#204978]">
                      Quantity
                    </th>
                    <th className="border border-slate-200 px-2 py-2 text-center font-bold text-[#204978]">
                      Weight
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i}>
                      <td className="border border-slate-200 px-2 py-2 text-center font-semibold">
                        {item.type || "—"}
                      </td>
                      <td
                        className="border border-slate-200 px-2 py-2 text-center font-semibold"
                        dir="ltr"
                      >
                        {item.quantity || "—"}
                      </td>
                      <td
                        className="border border-slate-200 px-2 py-2 text-center font-semibold"
                        dir="ltr"
                      >
                        {[item.weight, item.weightUnit].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {!order && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Invoice details not found on this device. Download the PDF once from
            the app (with Supabase connected) so scan shows full details.
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-slate-400 break-all">
          ID: {id}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="rounded-t-lg bg-[#204978] px-3 py-2 text-[13px] font-bold text-white">
        {title}
      </div>
      <div className="rounded-b-lg border border-t-0 border-blue-200 bg-white p-3">
        {children}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-slate-50 p-2.5">
      <div className="mb-1 text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="font-bold text-slate-900" dir="ltr">
        {value}
      </div>
    </div>
  );
}

function Row({ items }: { items: Array<[string, string | undefined]> }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1 text-[11px] font-semibold text-slate-500">
            {label}
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-bold">
            {value || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
