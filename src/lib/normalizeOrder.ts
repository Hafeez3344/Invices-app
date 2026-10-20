import { DEFAULT_ORDER_TEMPLATE } from "./defaults";
import type { DeliveryOrder } from "./types";

/** Fill missing fields when loading older saved orders */
export function normalizeOrder(raw: Partial<DeliveryOrder>): DeliveryOrder {
  const d = DEFAULT_ORDER_TEMPLATE;
  return {
    ...d,
    ...raw,
    schemaVersion: 2,
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
    load: {
      ...d.load,
      ...raw.load,
      weightUnit: raw.load?.weightUnit ?? d.load.weightUnit,
      quantity: raw.load?.quantity ?? d.load.quantity,
      dimensions: raw.load?.dimensions ?? d.load.dimensions,
      packingUnit: raw.load?.packingUnit ?? d.load.packingUnit,
      condition: raw.load?.condition ?? d.load.condition,
    },
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
