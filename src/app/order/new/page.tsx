"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_ORDER_TEMPLATE } from "@/lib/defaults";
import { getRecentInvoices } from "@/lib/idb";
import { isLoggedIn } from "@/lib/session";
import type { DeliveryOrder } from "@/lib/types";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function NewOrderPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
      return;
    }

    (async () => {
      const id =
        window.crypto?.randomUUID?.() ||
        `ord_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;

      const now = new Date();
      const deliveryDate = formatDate(now);
      const receipt = new Date(now);
      receipt.setDate(receipt.getDate() + 5);
      const receiptDate = formatDate(receipt);

      let invoiceNumber = DEFAULT_ORDER_TEMPLATE.invoiceNumber;
      try {
        const recent = await getRecentInvoices();
        if (recent.length > 0) {
          const max = recent.reduce((acc, cur) => {
            const a = parseInt(cur.invoiceNumber, 10) || 0;
            const b = parseInt(acc.invoiceNumber, 10) || 0;
            return a > b ? cur : acc;
          }, recent[0]);
          invoiceNumber = (
            (parseInt(max.invoiceNumber, 10) || 0) + 1
          )
            .toString()
            .padStart(5, "0");
        }
      } catch (e) {
        console.error(
          "Failed to get recent invoices for incremental number:",
          e
        );
      }

      const order: DeliveryOrder = {
        ...DEFAULT_ORDER_TEMPLATE,
        id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        invoiceNumber,
        receiptDate,
        deliveryDate,
        status: "In Transit",
      };

      sessionStorage.setItem("currentOrder", JSON.stringify(order));
      router.replace(`/order/edit?id=${id}`);
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-cairo">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-600">
          Preparing new invoice...
        </span>
      </div>
    </div>
  );
}
