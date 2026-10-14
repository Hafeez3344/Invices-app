import type { DeliveryOrder } from "./types";

/** Saudi Arabic defaults for new delivery orders */
export const DEFAULT_ORDER_TEMPLATE: Omit<
  DeliveryOrder,
  "id" | "createdAt" | "updatedAt"
> = {
  schemaVersion: 1,
  invoiceNumber: "00001",
  receiptDate: "",
  deliveryDate: "",
  company: {
    nameAr: "وصل للتوصيل",
    addressAr: "الرياض، المملكة العربية السعودية",
    phone: "966500000000",
    logoDataUrl: "/wasl-logo.jpg",
  },
  car: {
    plateNumber: "أ ب 1234",
    owner: "وصل للتوصيل",
    idNumber: "7000000000",
  },
  receiver: {
    name: "اسم المستلم",
    address: "الرياض",
    mobile: "0500000000",
  },
  transport: {
    fromCity: "الرياض",
    toCity: "جدة",
    orderNo: "001",
  },
  driver: {
    name: "اسم السائق",
    iqamaNumber: "2000000000",
    mobile: "0500000000",
  },
  load: {
    type: "بضائع عامة",
    weight: "0 كغ",
  },
};

export const BRAND = {
  name: "Wasl",
  nameAr: "وصل",
  fullName: "وصل للتوصيل",
  color: "#204978",
  themeColor: "#204978",
};
