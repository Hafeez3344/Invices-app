export type UserRole = "admin" | "user";

export type InvoiceStatus = "In Transit" | "Delivered" | "Cancelled" | null;

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
}

export interface PartyInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  notes: string;
}

export interface GoodsItem {
  id: string;
  type: string;
  weight: string;
  weightUnit: string;
  quantity: string;
  dimensions: string;
  packingUnit: string;
  condition: string;
}

export interface DeliveryOrder {
  schemaVersion: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  licenseNumber: string;
  receiptDate: string;
  deliveryDate: string;
  status?: InvoiceStatus;
  qrCodeUrl?: string;
  encryptedInvoiceId?: string;
  negotiable: string;
  company: {
    nameAr: string;
    addressAr: string;
    phone: string;
    logoDataUrl: string;
    notes: string;
  };
  car: {
    plateNumber: string;
    plateType: string;
    owner: string;
    idNumber: string;
  };
  /** المرسل إليه — kept as receiver for compatibility */
  receiver: {
    name: string;
    address: string;
    city: string;
    mobile: string;
    notes: string;
  };
  /** المرسل */
  sender: PartyInfo;
  transport: {
    fromCity: string;
    toCity: string;
    fromCityEn: string;
    toCityEn: string;
    orderNo: string;
    routeText: string;
  };
  driver: {
    name: string;
    iqamaNumber: string;
    mobile: string;
  };
  /** @deprecated use items — kept for older saved orders */
  load: GoodsItem;
  /** Goods / بضاعة rows (multiple items supported) */
  items: GoodsItem[];
  payment: {
    method: string;
    paidBy: string;
    instructions: string;
  };
}

export function createEmptyGoodsItem(): GoodsItem {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "بضائع عامة",
    weight: "1.000 طن",
    weightUnit: "",
    quantity: "1",
    dimensions: "",
    packingUnit: "",
    condition: "سليمة",
  };
}

export interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
}

export function statusLabelAr(status?: InvoiceStatus): string {
  switch (status) {
    case "Delivered":
      return "تم التسليم";
    case "Cancelled":
      return "ملغاة";
    case "In Transit":
    default:
      return "نشطة";
  }
}
