"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { RotateCw, CheckCircle2, Clock, AlertTriangle, Truck } from "lucide-react";
import { BRAND } from "@/lib/defaults";
import { getRecentInvoices, purgeExpiredLocalInvoices } from "@/lib/idb";
import {
  isInvoiceExpired,
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expired, setExpired] = useState(false);

  const fetchInvoiceData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    let found: DeliveryOrder | null = null;

    try {
      // 1) Fetch from server API (serverDb or Supabase)
      const res = await fetch(`/api/invoices/${id}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.expired) {
          setExpired(true);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        if (data?.invoice?.status) {
          setStatus(data.invoice.status);
        }
        if (data?.invoice?.payload) {
          found = data.invoice.payload as DeliveryOrder;
          // Ensure payload status is synced with top-level invoice status
          if (data.invoice.status) {
            found.status = data.invoice.status;
          }
        }
      }
    } catch {
      /* continue to fallback */
    }

    // 2) Fallback to localStorage on same device
    if (!found) {
      try {
        const raw = localStorage.getItem(`public_invoice_${id}`);
        if (raw) found = JSON.parse(raw) as DeliveryOrder;
      } catch {
        /* continue */
      }
    }

    // 3) Fallback to IndexedDB history
    if (!found) {
      try {
        const recent = await getRecentInvoices();
        found = recent.find((inv) => inv.id === id) || null;
      } catch {
        /* continue */
      }
    }

    if (found) {
      if (isInvoiceExpired(found.createdAt)) {
        setExpired(true);
        try {
          localStorage.removeItem(`public_invoice_${id}`);
        } catch {
          /* ignore */
        }
      } else {
        setOrder(found);
        if (found.status) setStatus(found.status);
      }
    }

    setLastRefreshed(new Date());
    setLoading(false);
    if (!isSilent) setRefreshing(false);
  }, [id]);

  useEffect(() => {
    (async () => {
      await purgeExpiredLocalInvoices();
      await fetchInvoiceData(false);
    })();
  }, [fetchInvoiceData]);

  // Dynamic status polling: check server every 4 seconds for real-time status updates
  useEffect(() => {
    if (!id || expired) return;
    const interval = setInterval(() => {
      fetchInvoiceData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [id, expired, fetchInvoiceData]);

  const items = order?.items?.length
    ? order.items
    : order?.load
      ? [order.load]
      : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 font-cairo">
            جاري جلب تفاصيل الفاتورة... / Loading invoice details...
          </p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gray-100 font-cairo py-12 px-4" dir="rtl">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-md">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-[#204978]">
            انتهت صلاحية الفاتورة / Invoice Expired
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            يتم الاحتفاظ بالفواتير لمدة 5 أيام فقط ثم تُحذف تلقائياً وفق سياسة النظام.
          </p>
          <p className="mt-1 text-xs text-slate-400" dir="ltr">
            Invoices are retained for 5 days only and automatically pruned.
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 font-cairo py-12 px-4" dir="rtl">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-md">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800">
            لم يتم العثور على الفاتورة / Invoice Not Found
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            يرجى التأكد من مسح رمز QR الصحيح أو التواصل مع مرسل الشحنة.
          </p>
          <p className="mt-1 text-xs text-slate-400" dir="ltr">
            Please make sure you scanned a valid invoice QR code.
          </p>
          <button
            type="button"
            onClick={() => fetchInvoiceData(false)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#204978] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#18365a]"
          >
            <RotateCw className="h-4 w-4" />
            إعادة المحاولة / Retry
          </button>
        </div>
      </div>
    );
  }

  const statusTone =
    status === "Delivered"
      ? "bg-emerald-600 border-emerald-500 text-white"
      : status === "Sent"
        ? "bg-sky-600 border-sky-500 text-white"
        : status === "Failed"
          ? "bg-rose-600 border-rose-500 text-white"
          : status === "Cancelled"
            ? "bg-slate-600 border-slate-500 text-white"
            : "bg-[#204978] border-blue-600 text-white";

  return (
    <div className="min-h-screen bg-slate-100 font-cairo py-4 px-3 sm:py-8 sm:px-4" dir="rtl">
      {/* Header bar */}
      <div className="mx-auto mb-4 w-full max-w-[794px] flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h1 className="text-xl font-extrabold text-[#204978] sm:text-2xl">
            تفاصيل وثيقة النقل والتوصيل
          </h1>
          <p className="text-xs text-slate-500">
            Delivery Receipt & Live Tracking Status
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchInvoiceData(false)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition active:scale-95 disabled:opacity-60"
        >
          <RotateCw className={`h-3.5 w-3.5 text-[#204978] ${refreshing ? "animate-spin" : ""}`} />
          <span>تحديث الحالة</span>
          {lastRefreshed && (
            <span className="text-[10px] text-slate-400 hidden sm:inline" dir="ltr">
              ({lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
            </span>
          )}
        </button>
      </div>

      <div className="mx-auto w-full max-w-[794px] rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-md">
        {/* Top Company & Live Status Badge */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-[110px_1fr_130px] items-center gap-3 border-b-2 border-[#204978] pb-4">
          <div className="mx-auto sm:mx-0 flex h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.company?.logoDataUrl || "/wasl-logo.jpg"}
              alt="logo"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex flex-col justify-center text-center sm:text-right gap-1">
            <p className="font-extrabold text-[#204978] text-base sm:text-lg">
              {order.company?.nameAr || BRAND.nameAr}
            </p>
            <p className="text-xs text-slate-600">
              {order.company?.addressAr || "—"}
            </p>
            <p className="text-xs text-slate-600" dir="ltr">
              {order.company?.phone || "—"}
            </p>
          </div>

          {/* Dynamic Status Badge */}
          <div
            className={`mx-auto sm:mx-0 flex h-[90px] w-full max-w-[150px] flex-col items-center justify-center rounded-xl border p-2 text-center shadow-inner transition-colors duration-300 ${statusTone}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <p className="text-[10px] font-medium opacity-90">الحالة المباشرة</p>
            </div>
            <p className="text-base font-extrabold leading-tight">
              {statusLabelAr(status)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium opacity-80" dir="ltr">
              {status}
            </p>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <InfoCard
            label="رقم الفاتورة / Invoice Number"
            value={`#${order.invoiceNumber}`}
            highlight
          />
          <InfoCard
            label="تاريخ الاستلام / Receipt Date"
            value={order.receiptDate || "—"}
          />
          <InfoCard
            label="تاريخ التسليم / Delivery Date"
            value={order.deliveryDate || "—"}
          />
        </div>

        {/* Car info */}
        <Section title="معلومات المركبة / Vehicle Information">
          <Row
            items={[
              ["رقم اللوحة / Plate", order.car?.plateNumber],
              ["المالك / Owner", order.car?.owner],
              ["رقم الهوية / ID", order.car?.idNumber],
            ]}
          />
        </Section>

        {/* Sender info */}
        <Section title="معلومات المرسل / Sender Information">
          <Row
            items={[
              ["الاسم / Name", order.sender?.name],
              ["العنوان / City", order.sender?.city || order.sender?.address],
              ["الجوال / Mobile", order.sender?.phone],
            ]}
          />
        </Section>

        {/* Receiver info */}
        <Section title="معلومات المستلم / Receiver Information">
          <Row
            items={[
              ["الاسم / Name", order.receiver?.name],
              ["المدينة / City", order.receiver?.city || order.receiver?.address],
              ["الجوال / Mobile", order.receiver?.mobile],
            ]}
          />
        </Section>

        {/* Transportation */}
        <Section title="خط السير والنقل / Transportation Route">
          <Row
            items={[
              ["من / From", order.transport?.fromCity],
              ["إلى / To", order.transport?.toCity],
              ["رقم الطلب / Order No", order.transport?.orderNo],
            ]}
          />
        </Section>

        {/* Driver */}
        <Section title="معلومات السائق / Driver Information">
          <Row
            items={[
              ["الاسم / Name", order.driver?.name],
              ["رقم الإقامة / Iqama", order.driver?.iqamaNumber],
              ["رقم الجوال / Mobile", order.driver?.mobile],
            ]}
          />
        </Section>

        {/* Goods items */}
        <Section title="تفاصيل البضاعة المنقولة / Goods & Cargo Details">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">لا توجد أصناف مسجلة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[#204978]">
                    <th className="border border-slate-200 px-3 py-2 text-right font-bold">
                      نوع البضاعة / Goods Type
                    </th>
                    <th className="border border-slate-200 px-3 py-2 text-center font-bold">
                      الكمية / Quantity
                    </th>
                    <th className="border border-slate-200 px-3 py-2 text-center font-bold">
                      الوزن / Weight
                    </th>
                    <th className="border border-slate-200 px-3 py-2 text-center font-bold">
                      الحالة / Condition
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">
                        {item.type || "بضائع عامة"}
                      </td>
                      <td
                        className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700"
                        dir="ltr"
                      >
                        {item.quantity || "1"}
                      </td>
                      <td
                        className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700"
                        dir="ltr"
                      >
                        {[item.weight, item.weightUnit].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center font-medium text-slate-600">
                        {item.condition || "سليمة"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Footer info */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <span>معرف الوثيقة: {id}</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            بيانات الفاتورة موثقة ومحدثة لحظياً
          </span>
        </div>
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
      <div className="rounded-t-xl bg-[#204978] px-3.5 py-2 text-xs sm:text-[13px] font-bold text-white shadow-sm flex items-center justify-between">
        <span>{title}</span>
      </div>
      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? "border-blue-300 bg-blue-50/60"
          : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="mb-1 text-[11px] font-medium text-slate-500">{label}</div>
      <div
        className={`font-bold text-sm ${
          highlight ? "text-[#204978]" : "text-slate-900"
        }`}
        dir="ltr"
      >
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
          <div className="mb-0.5 text-[11px] font-medium text-slate-500">
            {label}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-900">
            {value || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
