import { get, set, del, keys } from "idb-keyval";
import type { DeliveryOrder, InvoiceStatus } from "./types";
import { INVOICE_TTL_MS, isInvoiceExpired } from "./types";

const PREFIX = "history_invoice_";
const PUBLIC_PREFIX = "public_invoice_";
const MAX_HISTORY = 5;

export async function getRecentInvoices(): Promise<DeliveryOrder[]> {
  try {
    await purgeExpiredLocalInvoices();

    const allKeys = await keys();
    const invoiceKeys = allKeys
      .map(String)
      .filter((k) => k.startsWith(PREFIX));

    const items: DeliveryOrder[] = [];
    for (const key of invoiceKeys) {
      const item = await get<DeliveryOrder>(key);
      if (item && !isInvoiceExpired(item.createdAt)) {
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
    await purgeExpiredLocalInvoices();

    const key = `${PREFIX}${order.id}`;
    const payload: DeliveryOrder = {
      ...order,
      status: order.status ?? null,
      qrCodeUrl: order.qrCodeUrl || "",
      encryptedInvoiceId: order.encryptedInvoiceId || "",
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = await get(key);
    if (existing) {
      await set(key, {
        ...payload,
        createdAt: (existing as DeliveryOrder).createdAt || payload.createdAt,
      });
      return;
    }

    const recent = await getRecentInvoices();
    if (recent.length >= MAX_HISTORY) {
      const oldest = recent[recent.length - 1];
      if (oldest) {
        await del(`${PREFIX}${oldest.id}`);
        try {
          localStorage.removeItem(`${PUBLIC_PREFIX}${oldest.id}`);
        } catch {
          /* ignore */
        }
      }
    }

    await set(key, payload);
  } catch (e) {
    console.error("Failed to add invoice to history in IndexedDB:", e);
  }
}

/** Update status in IndexedDB + public localStorage (works without Supabase). */
export async function updateInvoiceStatusLocal(
  id: string,
  status: InvoiceStatus
): Promise<DeliveryOrder | null> {
  const key = `${PREFIX}${id}`;
  let updated: DeliveryOrder | null = null;

  try {
    const item = await get<DeliveryOrder>(key);
    if (item) {
      updated = {
        ...item,
        status,
        updatedAt: new Date().toISOString(),
      };
      await set(key, updated);
    }
  } catch (e) {
    console.error("Failed to update IndexedDB status:", e);
  }

  try {
    const raw = localStorage.getItem(`${PUBLIC_PREFIX}${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as DeliveryOrder;
      const next = {
        ...parsed,
        status,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${PUBLIC_PREFIX}${id}`, JSON.stringify(next));
      if (!updated) updated = next;
    }
  } catch {
    /* ignore */
  }

  return updated;
}

/** Remove invoices older than 5 days from IndexedDB + public localStorage. */
export async function purgeExpiredLocalInvoices(): Promise<void> {
  try {
    const allKeys = await keys();
    const invoiceKeys = allKeys
      .map(String)
      .filter((k) => k.startsWith(PREFIX));

    for (const key of invoiceKeys) {
      const item = await get<DeliveryOrder>(key);
      if (!item || isInvoiceExpired(item.createdAt)) {
        const id = key.replace(PREFIX, "");
        await del(key);
        try {
          localStorage.removeItem(`${PUBLIC_PREFIX}${id}`);
        } catch {
          /* ignore */
        }
      }
    }

    // Also sweep public_invoice_* keys not in history
    if (typeof localStorage !== "undefined") {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k?.startsWith(PUBLIC_PREFIX)) continue;
        try {
          const raw = localStorage.getItem(k);
          if (!raw) {
            toRemove.push(k);
            continue;
          }
          const parsed = JSON.parse(raw) as DeliveryOrder;
          if (isInvoiceExpired(parsed.createdAt)) toRemove.push(k);
        } catch {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {
    console.error("Failed to purge expired local invoices:", e);
  }
}

export { INVOICE_TTL_MS };
