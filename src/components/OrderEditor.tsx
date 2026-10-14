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
import type { AlertState, DeliveryOrder, InvoiceStatus } from "@/lib/types";

export default function OrderEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [zoom, setZoom] = useState(1);
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
      const parsed = JSON.parse(raw) as DeliveryOrder;
      if (id && parsed.id !== id) {
        // keep going with stored order
      }
      setOrder(parsed);
      setQrCodeUrl(parsed.qrCodeUrl || "");
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
    S extends "company" | "car" | "receiver" | "transport" | "driver" | "load"
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
      setBusyLabel("Stage 0: Fetching current status from Supabase...");
      let status: InvoiceStatus = order.status || "In Transit";
      try {
        const st = await fetch(`/api/invoices/${order.id}`);
        if (st.ok) {
          const json = await st.json();
          if (json?.invoice?.status) status = json.invoice.status;
        }
      } catch {
        console.warn("Failed to fetch current status, using provided status");
      }

      setBusyLabel("Stage 1: Generating QR code...");
      const qr = await generateQr(status);

      // Wait a tick so QR img paints
      await new Promise((r) => setTimeout(r, 300));

      setBusyLabel("Stage 2: Generating PDF...");
      const el = document.getElementById("delivery-order-template");
      if (!el) throw new Error("Template not found");

      const filename = `invoice-${order.invoiceNumber}.pdf`;
      await downloadElementAsPdf(el, filename);

      const withMeta: DeliveryOrder = {
        ...order,
        status,
        qrCodeUrl: qr,
        encryptedInvoiceId: order.encryptedInvoiceId || order.id,
      };

      setBusyLabel("SAVING TO SUPABASE...");
      await fetch("/api/invoices", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(withMeta),
      });

      setBusyLabel("Adding to history...");
      await addInvoiceToHistory(withMeta);
      updateOrder(withMeta);

      setAlert({
        isOpen: true,
        title: "Success",
        message: "PDF downloaded and invoice saved to history.",
        type: "success",
      });
    } catch (e) {
      console.error("An error occurred while downloading the invoice:", e);
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
        {/* Form */}
        <aside className="w-full lg:w-[380px] shrink-0 space-y-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-[#204978]">Invoice Details</h2>
            <Field
              label="Invoice Number / رقم الفاتورة"
              value={order.invoiceNumber}
              onChange={(v) => field("invoiceNumber", v)}
            />
            <Field
              label="Reciept Date / تاريخ الإيصال"
              value={order.receiptDate}
              onChange={(v) => field("receiptDate", v)}
            />
            <Field
              label="Delivery Date / تاريخ التسليم"
              value={order.deliveryDate}
              onChange={(v) => field("deliveryDate", v)}
            />
          </div>

          <Section title="Company / الشركة">
            <Field
              label="Name (AR)"
              value={order.company.nameAr}
              onChange={(v) => nested("company", "nameAr", v)}
            />
            <Field
              label="Address (AR)"
              value={order.company.addressAr}
              onChange={(v) => nested("company", "addressAr", v)}
            />
            <Field
              label="Phone"
              value={order.company.phone}
              onChange={(v) => nested("company", "phone", v)}
            />
          </Section>

          <Section title="Receiver Information">
            <Field
              label="Receiver Name"
              value={order.receiver.name}
              onChange={(v) => nested("receiver", "name", v)}
            />
            <Field
              label="Receiver Address"
              value={order.receiver.address}
              onChange={(v) => nested("receiver", "address", v)}
            />
            <Field
              label="Receiver Mobile"
              value={order.receiver.mobile}
              onChange={(v) => nested("receiver", "mobile", v)}
            />
          </Section>

          <Section title="Driver Information">
            <Field
              label="Driver Name"
              value={order.driver.name}
              onChange={(v) => nested("driver", "name", v)}
            />
            <Field
              label="Iqama Number"
              value={order.driver.iqamaNumber}
              onChange={(v) => nested("driver", "iqamaNumber", v)}
            />
            <Field
              label="Mobile"
              value={order.driver.mobile}
              onChange={(v) => nested("driver", "mobile", v)}
            />
          </Section>

          <Section title="Transportation Information">
            <Field
              label="From City"
              value={order.transport.fromCity}
              onChange={(v) => nested("transport", "fromCity", v)}
            />
            <Field
              label="To City"
              value={order.transport.toCity}
              onChange={(v) => nested("transport", "toCity", v)}
            />
            <Field
              label="Order No"
              value={order.transport.orderNo}
              onChange={(v) => nested("transport", "orderNo", v)}
            />
          </Section>

          <Section title="Car Information">
            <Field
              label="Plate number"
              value={order.car.plateNumber}
              onChange={(v) => nested("car", "plateNumber", v)}
            />
            <Field
              label="Owner"
              value={order.car.owner}
              onChange={(v) => nested("car", "owner", v)}
            />
            <Field
              label="ID number"
              value={order.car.idNumber}
              onChange={(v) => nested("car", "idNumber", v)}
            />
          </Section>

          <Section title="Load Information">
            <Field
              label="Load Type"
              value={order.load.type}
              onChange={(v) => nested("load", "type", v)}
            />
            <Field
              label="Goods Weight"
              value={order.load.weight}
              onChange={(v) => nested("load", "weight", v)}
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

        {/* Preview */}
        <main className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-800">Preview</h2>
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
                onClick={() => setZoom(1)}
                className="rounded-lg bg-white border border-gray-200 p-2"
                title="Reset Zoom"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
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
