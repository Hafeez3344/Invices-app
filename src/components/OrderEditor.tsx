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
import {
  createEmptyGoodsItem,
  type AlertState,
  type DeliveryOrder,
  type GoodsItem,
  type InvoiceStatus,
} from "@/lib/types";

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

  useEffect(() => {
    if (!order?.id || !customerUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/generate-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: customerUrl,
            status: order.status || "In Transit",
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.qrCodeUrl) {
          setQrCodeUrl(data.qrCodeUrl);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order?.id, order?.status, customerUrl]);

  function updateOrder(next: DeliveryOrder) {
    setOrder(next);
    sessionStorage.setItem("currentOrder", JSON.stringify(next));
  }

  function updateItem(itemId: string, key: keyof GoodsItem, value: string) {
    if (!order) return;
    const items = order.items.map((item) =>
      item.id === itemId ? { ...item, [key]: value } : item
    );
    updateOrder({
      ...order,
      items,
      load: items[0] || order.load,
      updatedAt: new Date().toISOString(),
    });
  }

  function addItem() {
    if (!order) return;
    const items = [...order.items, createEmptyGoodsItem()];
    updateOrder({
      ...order,
      items,
      load: items[0],
      updatedAt: new Date().toISOString(),
    });
  }

  function removeItem(itemId: string) {
    if (!order || order.items.length <= 1) return;
    const items = order.items.filter((item) => item.id !== itemId);
    updateOrder({
      ...order,
      items,
      load: items[0],
      updatedAt: new Date().toISOString(),
    });
  }

  async function handleDownload() {
    if (!order) return;
    setBusy(true);
    try {
      setBusyLabel("Preparing...");
      let status: InvoiceStatus = order.status || "In Transit";
      try {
        const st = await fetch(`/api/invoices/${order.id}`);
        if (st.ok) {
          const json = await st.json();
          if (json?.invoice?.status) status = json.invoice.status;
        }
      } catch {
        /* keep local */
      }

      setBusyLabel("QR...");
      let qr = qrCodeUrl;
      if (!qr) {
        const res = await fetch("/api/generate-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: customerUrl, status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "QR failed");
        qr = data.qrCodeUrl;
        setQrCodeUrl(qr);
        await new Promise((r) => setTimeout(r, 150));
      }

      setBusyLabel("PDF...");
      const el = document.getElementById("delivery-order-template");
      if (!el) throw new Error("Template not found");

      await downloadElementAsPdf(el, `invoice-${order.invoiceNumber}.pdf`);

      const withMeta: DeliveryOrder = {
        ...order,
        status,
        qrCodeUrl: qr,
        encryptedInvoiceId: order.encryptedInvoiceId || order.id,
      };

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
        message: "PDF downloaded successfully.",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      setAlert({
        isOpen: true,
        title: "Failed",
        message: e instanceof Error ? e.message : "Download failed",
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
        <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-cairo">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 pb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Invoice #{order.invoiceNumber}
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="rounded-md p-2 hover:bg-gray-100"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-semibold text-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.3, z + 0.1))}
              className="rounded-md p-2 hover:bg-gray-100"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="rounded-md p-2 hover:bg-gray-100"
              title="Reset"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-xl bg-slate-200/50 p-2 sm:p-4">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            <DeliveryOrderTemplate
              order={order}
              qrCodeUrl={qrCodeUrl}
              onChange={updateOrder}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleDownload}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#204978] py-3.5 text-sm font-bold text-white hover:bg-[#18365a] disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          {busy ? busyLabel || "Generating..." : "Download"}
        </button>
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
