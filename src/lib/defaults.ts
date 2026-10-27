import type { DeliveryOrder, GoodsItem } from "./types";
import { createEmptyGoodsItem } from "./types";

const defaultItem: GoodsItem = {
  ...createEmptyGoodsItem(),
  id: "item-default-1",
  type: "بضائع عامة",
  weight: "1.000 طن",
  weightUnit: "",
  quantity: "1",
  dimensions: "",
  packingUnit: "",
  condition: "سليمة",
};

/** Saudi Arabic defaults matching وثيقة نقل style */
export const DEFAULT_ORDER_TEMPLATE: Omit<
  DeliveryOrder,
  "id" | "createdAt" | "updatedAt"
> = {
  schemaVersion: 3,
  invoiceNumber: "00001",
  licenseNumber: "11/00000001",
  receiptDate: "",
  deliveryDate: "",
  negotiable: "نعم",
  company: {
    nameAr: "وصل للتوصيل",
    addressAr: "الرياض، المملكة العربية السعودية",
    phone: "+966538473427",
    logoDataUrl: "/wasl-logo.jpg",
    notes: "",
  },
  car: {
    plateNumber: "أ ب ج 1234",
    plateType: "نقل عام",
    owner: "وصل للتوصيل",
    idNumber: "7000000000",
  },
  sender: {
    name: "اسم المرسل",
    address: "جدة",
    city: "جدة",
    phone: "+966538473427",
    notes: "",
  },
  receiver: {
    name: "اسم المرسل إليه",
    address: "المدينة المنورة",
    city: "المدينة المنورة",
    mobile: "+966538473427",
    notes: "",
  },
  transport: {
    fromCity: "جدة",
    toCity: "المدينة المنورة",
    fromCityEn: "Jeddah",
    toCityEn: "Madinah",
    orderNo: "001",
    routeText: "",
  },
  driver: {
    name: "اسم السائق",
    iqamaNumber: "2000000000",
    mobile: "+966538473427",
  },
  load: { ...defaultItem },
  items: [{ ...defaultItem }],
  payment: {
    method: "كاش",
    paidBy: "المرسل",
    instructions: "",
  },
};

export const BRAND = {
  name: "Wasl",
  nameAr: "وصل",
  fullName: "وصل للتوصيل",
  color: "#204978",
  themeColor: "#204978",
};

export function buildRouteText(order: Pick<DeliveryOrder, "transport">): string {
  if (order.transport.routeText?.trim()) return order.transport.routeText;
  const fromEn = order.transport.fromCityEn || order.transport.fromCity;
  const toEn = order.transport.toCityEn || order.transport.toCity;
  return `من ${fromEn} , ${order.transport.fromCity} , المملكة العربية السعودية الى ${toEn} , ${order.transport.toCity} , المملكة العربية السعودية`;
}
