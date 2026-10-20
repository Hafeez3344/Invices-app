"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  LoaderCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AlertModal from "@/components/AlertModal";
import DeliveryOrderTemplate from "@/components/DeliveryOrderTemplate";
import { authHeaders, isLoggedIn } from "@/lib/session";
import { addInvoiceToHistory } from "@/lib/idb";
import { downloadElementAsPdf } from "@/lib/pdf";
import { normalizeOrder } from "@/lib/normalizeOrder";
import type { AlertState, DeliveryOrder, InvoiceStatus } from "@/lib/types";

export default function OrderEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [zoom, setZoom] = useState(0.85);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
      return;
    }
    const raw = sessionStorage.getItem("currentOrder");
    if (!raw) {
      router.replace("/order/new");
      return;
    }
    try {
      const parsed = normalizeOrder(JSON.parse(raw));
      setOrder(parsed);
      setQrCodeUrl(parsed.qrCodeUrl || "");
      sessionStorage.setItem("currentOrder", JSON.stringify(parsed));
    } catch {
      router.replace("/order/new");
    }
  }, [id, router]);

  const customerUrl = useMemo(() => {
    if (!order) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/track/${order.id}`;
  }, [order]);

  function updateOrder(next: DeliveryOrder) {
    setOrder(next);
    sessionStorage.setItem("currentOrder", JSON.stringify(next));
  }

  function field<K extends keyof DeliveryOrder>(
    key: K,
    value: DeliveryOrder[K]
  ) {
    if (!order) return;
    updateOrder({
      ...order,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  }

  function nested<
    S extends
      | "company"
      | "car"
      | "receiver"
      | "sender"
      | "transport"
      | "driver"
      | "load"
  >(section: S, key: keyof DeliveryOrder[S], value: string) {
    if (!order) return;
    updateOrder({
      ...order,
      [section]: { ...order[section], [key]: value },
      updatedAt: new Date().toISOString(),
    });
  }

  async function generateQr(status: InvoiceStatus = "In Transit") {
    if (!order) return "";
    const res = await fetch("/api/generate-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: customerUrl || order.id,
        url: customerUrl || order.id,
        status,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "QR generation API failed");
    setQrCodeUrl(data.qrCodeUrl);
    return data.qrCodeUrl as string;
  }

  async function handleDownload() {
    if (!order) return;
    setBusy(true);
    try {
      setBusyLabel("Fetching status...");
      let status: InvoiceStatus = order.status || "In Transit";
      try {
        const st = await fetch(`/api/invoices/${order.id}`);
        if (st.ok) {
          const json = await st.json();
          if (json?.invoice?.status) status = json.invoice.status;
        }
      } catch {
        /* keep local status */
      }

      setBusyLabel("Generating QR code...");
      const qr = await generateQr(status);
      await new Promise((r) => setTimeout(r, 350));

      setBusyLabel("Generating PDF...");
      // Reset preview zoom so capture isn't affected by CSS transform
      const prevZoom = zoom;
      setZoom(1);
      await new Promise((r) => setTimeout(r, 120));

      const el = document.getElementById("delivery-order-template");
      if (!el) throw new Error("Template not found");

      const filename = `wathiqat-naql-${order.invoiceNumber}.pdf`;
      try {
        await downloadElementAsPdf(el, filename);
      } finally {
        setZoom(prevZoom);
      }

      const withMeta: DeliveryOrder = {
        ...order,
        status,
        qrCodeUrl: qr,
        encryptedInvoiceId: order.encryptedInvoiceId || order.id,
      };

      setBusyLabel("Saving...");
      await fetch("/api/invoices", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(withMeta),
      });
      await addInvoiceToHistory(withMeta);
      updateOrder(withMeta);

      setAlert({
        isOpen: true,
        title: "Success",
        message: "PDF downloaded (وثيقة نقل + بيان حمولة) and saved to history.",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      setAlert({
        isOpen: true,
        title: "Failed",
        message:
          e instanceof Error
            ? e.message
            : "An error occurred while downloading the invoice",
        type: "error",
      });
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-cairo">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-600">
            Loading invoice...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-cairo">
      <AppHeader />

      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:p-6 lg:flex-row">
        <aside className="w-full lg:w-[380px] shrink-0 space-y-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <Section title="بيانات الوثيقة">
            <Field
              label="رقم الوثيقة"
              value={order.invoiceNumber}
              onChange={(v) => field("invoiceNumber", v)}
            />
            <Field
              label="رقم الترخيص"
              value={order.licenseNumber}
              onChange={(v) => field("licenseNumber", v)}
            />
            <Field
              label="Start Date / تاريخ البداية"
              value={order.receiptDate}
              onChange={(v) => field("receiptDate", v)}
            />
            <Field
              label="End Date / تاريخ النهاية (بعد 5 أيام)"
              value={order.deliveryDate}
              onChange={(v) => field("deliveryDate", v)}
            />
            <Field
              label="قابلة للتداول"
              value={order.negotiable}
              onChange={(v) => field("negotiable", v)}
            />
          </Section>

          <Section title="Owner Details">
            <Field
              label="الاسم / Name (اسم المرسل)"
              value={order.sender.name}
              onChange={(v) => nested("sender", "name", v)}
            />
            <Field
              label="Owner ID"
              value={order.car.idNumber}
              onChange={(v) => nested("car", "idNumber", v)}
            />
            <Field
              label="Mobile Number"
              value={order.company.phone}
              onChange={(v) => nested("company", "phone", v)}
            />
            <Field
              label="Notes"
              value={order.company.notes}
              onChange={(v) => nested("company", "notes", v)}
            />
          </Section>

          <Section title="بيانات السائق">
            <Field
              label="اسم السائق"
              value={order.driver.name}
              onChange={(v) => nested("driver", "name", v)}
            />
            <Field
              label="رقم هوية السائق"
              value={order.driver.iqamaNumber}
              onChange={(v) => nested("driver", "iqamaNumber", v)}
            />
            <Field
              label="رقم الهاتف"
              value={order.driver.mobile}
              onChange={(v) => nested("driver", "mobile", v)}
            />
          </Section>

          <Section title="بيانات الشاحنة">
            <Field
              label="لوحة المركبة"
              value={order.car.plateNumber}
              onChange={(v) => nested("car", "plateNumber", v)}
            />
            <Field
              label="نوع لوحة المركبة"
              value={order.car.plateType}
              onChange={(v) => nested("car", "plateType", v)}
            />
          </Section>

          <Section title="بيانات المرسل">
            <Field
              label="العنوان"
              value={order.sender.address}
              onChange={(v) => nested("sender", "address", v)}
            />
            <Field
              label="المدينة"
              value={order.sender.city}
              onChange={(v) => nested("sender", "city", v)}
            />
            <Field
              label="المدينة (EN)"
              value={order.transport.fromCityEn}
              onChange={(v) => nested("transport", "fromCityEn", v)}
            />
            <Field
              label="رقم الهاتف"
              value={order.sender.phone}
              onChange={(v) => nested("sender", "phone", v)}
            />
            <Field
              label="ملاحظات المرسل"
              value={order.sender.notes}
              onChange={(v) => nested("sender", "notes", v)}
            />
          </Section>

          <Section title="بيانات المرسل إليه">
            <Field
              label="الاسم"
              value={order.receiver.name}
              onChange={(v) => nested("receiver", "name", v)}
            />
            <Field
              label="العنوان"
              value={order.receiver.address}
              onChange={(v) => nested("receiver", "address", v)}
            />
            <Field
              label="المدينة"
              value={order.receiver.city}
              onChange={(v) => nested("receiver", "city", v)}
            />
            <Field
              label="المدينة (EN)"
              value={order.transport.toCityEn}
              onChange={(v) => nested("transport", "toCityEn", v)}
            />
            <Field
              label="رقم الهاتف"
              value={order.receiver.mobile}
              onChange={(v) => nested("receiver", "mobile", v)}
            />
            <Field
              label="ملاحظات المرسل إليه"
              value={order.receiver.notes}
              onChange={(v) => nested("receiver", "notes", v)}
            />
          </Section>

          <Section title="خط سير الرحلة">
            <Field
              label="من مدينة"
              value={order.transport.fromCity}
              onChange={(v) =>
                updateOrder({
                  ...order,
                  transport: { ...order.transport, fromCity: v },
                  sender: { ...order.sender, city: v },
                  updatedAt: new Date().toISOString(),
                })
              }
            />
            <Field
              label="إلى مدينة"
              value={order.transport.toCity}
              onChange={(v) =>
                updateOrder({
                  ...order,
                  transport: { ...order.transport, toCity: v },
                  receiver: { ...order.receiver, city: v },
                  updatedAt: new Date().toISOString(),
                })
              }
            />
            <Field
              label="خط السير (اختياري)"
              value={order.transport.routeText}
              onChange={(v) => nested("transport", "routeText", v)}
            />
          </Section>

          <Section title="بيانات البضاعة">
            <Field
              label="وصف البضاعة"
              value={order.load.type}
              onChange={(v) => nested("load", "type", v)}
            />
            <Field
              label="العدد"
              value={order.load.quantity}
              onChange={(v) => nested("load", "quantity", v)}
            />
            <Field
              label="الوزن"
              value={order.load.weight}
              onChange={(v) => nested("load", "weight", v)}
            />
            <Field
              label="وحدة الوزن"
              value={order.load.weightUnit}
              onChange={(v) => nested("load", "weightUnit", v)}
            />
            <Field
              label="الأبعاد (متر)"
              value={order.load.dimensions}
              onChange={(v) => nested("load", "dimensions", v)}
            />
            <Field
              label="وحدة التعبئة"
              value={order.load.packingUnit}
              onChange={(v) => nested("load", "packingUnit", v)}
            />
            <Field
              label="الحالة"
              value={order.load.condition}
              onChange={(v) => nested("load", "condition", v)}
            />
          </Section>

          <button
            type="button"
            disabled={busy}
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#204978] py-3 text-sm font-bold text-white hover:bg-[#18365a] disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy ? busyLabel || "Generating PDF..." : "Download PDF"}
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-800">
              Preview — وثيقة نقل / بيان حمولة
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="rounded-lg bg-white border border-gray-200 p-2"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="rounded-lg bg-white border border-gray-200 p-2"
                title="Reset Zoom"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                className="rounded-lg bg-white border border-gray-200 p-2"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="overflow-auto rounded-xl border border-gray-200 bg-slate-200/60 p-4"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
            >
              <DeliveryOrderTemplate order={order} qrCodeUrl={qrCodeUrl} />
            </div>
          </div>
        </main>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <h2 className="font-bold text-[#204978]">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-[#204978]"
      />
    </label>
  );
}
