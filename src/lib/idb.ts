import { get, set, del, keys } from "idb-keyval";
import type { DeliveryOrder } from "./types";

const PREFIX = "history_invoice_";
const MAX_HISTORY = 5;

export async function getRecentInvoices(): Promise<DeliveryOrder[]> {
  try {
    const allKeys = await keys();
    const invoiceKeys = allKeys
      .map(String)
      .filter((k) => k.startsWith(PREFIX));

    const items: DeliveryOrder[] = [];
    for (const key of invoiceKeys) {
      const item = await get<DeliveryOrder>(key);
      if (item) {
        items.push({
          ...item,
          status: item.status ?? null,
          qrCodeUrl: item.qrCodeUrl || "",
          encryptedInvoiceId: item.encryptedInvoiceId || "",
        });
      }
    }

    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    console.error("Failed to fetch recent invoices from IndexedDB:", e);
    return [];
  }
}

export async function addInvoiceToHistory(order: DeliveryOrder): Promise<void> {
  try {
    const key = `${PREFIX}${order.id}`;
    const payload: DeliveryOrder = {
      ...order,
      status: order.status ?? null,
      qrCodeUrl: order.qrCodeUrl || "",
      encryptedInvoiceId: order.encryptedInvoiceId || "",
      createdAt: new Date().toISOString(),
    };

    const existing = await get(key);
    if (existing) {
      await set(key, payload);
      return;
    }

    const recent = await getRecentInvoices();
    if (recent.length >= MAX_HISTORY) {
      const oldest = recent[recent.length - 1];
      if (oldest) await del(`${PREFIX}${oldest.id}`);
    }

    await set(key, payload);
  } catch (e) {
    console.error("Failed to add invoice to history in IndexedDB:", e);
  }
}
