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

export interface DeliveryOrder {
  schemaVersion: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  receiptDate: string;
  deliveryDate: string;
  status?: InvoiceStatus;
  qrCodeUrl?: string;
  encryptedInvoiceId?: string;
  company: {
    nameAr: string;
    addressAr: string;
    phone: string;
    logoDataUrl: string;
  };
  car: {
    plateNumber: string;
    owner: string;
    idNumber: string;
  };
  receiver: {
    name: string;
    address: string;
    mobile: string;
  };
  transport: {
    fromCity: string;
    toCity: string;
    orderNo: string;
  };
  driver: {
    name: string;
    iqamaNumber: string;
    mobile: string;
  };
  load: {
    type: string;
    weight: string;
  };
}

export interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
}
