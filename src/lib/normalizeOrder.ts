import { DEFAULT_ORDER_TEMPLATE } from "./defaults";
import { createEmptyGoodsItem, type DeliveryOrder, type GoodsItem } from "./types";

function normalizeItems(raw: Partial<DeliveryOrder>): GoodsItem[] {
  if (Array.isArray(raw.items) && raw.items.length > 0) {
    return raw.items.map((item) => ({
      ...createEmptyGoodsItem(),
      ...item,
      id: item.id || createEmptyGoodsItem().id,
    }));
  }

  // Migrate old single `load` object into items[]
  if (raw.load) {
    return [
      {
        ...createEmptyGoodsItem(),
        ...raw.load,
        id: raw.load.id || createEmptyGoodsItem().id,
      },
    ];
  }

  return [...DEFAULT_ORDER_TEMPLATE.items];
}

/** Fill missing fields when loading older saved orders */
export function normalizeOrder(raw: Partial<DeliveryOrder>): DeliveryOrder {
  const d = DEFAULT_ORDER_TEMPLATE;
  const items = normalizeItems(raw);
  const load = items[0] || d.load;

  return {
    ...d,
    ...raw,
    schemaVersion: 3,
    licenseNumber: raw.licenseNumber ?? d.licenseNumber,
    negotiable: raw.negotiable ?? d.negotiable,
    company: {
      ...d.company,
      ...raw.company,
      notes: raw.company?.notes ?? d.company.notes,
    },
    car: {
      ...d.car,
      ...raw.car,
      plateType: raw.car?.plateType ?? d.car.plateType,
    },
    sender: {
      ...d.sender,
      ...raw.sender,
    },
    receiver: {
      ...d.receiver,
      ...raw.receiver,
      city: raw.receiver?.city ?? d.receiver.city,
      notes: raw.receiver?.notes ?? d.receiver.notes,
    },
    transport: {
      ...d.transport,
      ...raw.transport,
      fromCityEn: raw.transport?.fromCityEn ?? d.transport.fromCityEn,
      toCityEn: raw.transport?.toCityEn ?? d.transport.toCityEn,
      routeText: raw.transport?.routeText ?? "",
    },
    driver: { ...d.driver, ...raw.driver },
    items,
    load,
    payment: {
      ...d.payment,
      ...raw.payment,
    },
    id: raw.id || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    invoiceNumber: raw.invoiceNumber || d.invoiceNumber,
    receiptDate: raw.receiptDate || "",
    deliveryDate: raw.deliveryDate || "",
  };
}
