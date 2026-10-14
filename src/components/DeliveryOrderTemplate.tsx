"use client";

import type { DeliveryOrder } from "@/lib/types";

type Props = {
  order: DeliveryOrder;
  qrCodeUrl?: string;
};

export default function DeliveryOrderTemplate({ order, qrCodeUrl }: Props) {
  return (
    <div
      id="delivery-order-template"
      className="style-shell mx-auto w-[794px] max-w-full bg-white text-slate-900 shadow-sm"
      dir="rtl"
    >
      <div className="border-2 border-[#204978] p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#204978] pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.company.logoDataUrl || "/wasl-logo.jpg"}
              alt="Logo"
              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
            />
            <div className="text-right">
              <h1 className="text-xl font-bold text-[#204978]">
                {order.company.nameAr}
              </h1>
              <p className="text-sm text-slate-600">{order.company.addressAr}</p>
              <p className="text-sm text-slate-600" dir="ltr">
                {order.company.phone}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              سند تسليم / Delivery Order
            </p>
            <p className="text-lg font-bold text-[#204978]">
              #{order.invoiceNumber}
            </p>
            {order.status && (
              <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                {order.status}
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-500">تاريخ الإيصال / Reciept Date</span>
            <p className="font-semibold">{order.receiptDate || "—"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-500">تاريخ التسليم / Delivery Date</span>
            <p className="font-semibold">{order.deliveryDate || "—"}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Section title="معلومات المستلم / Receiver Information">
            <Row label="الاسم / Name" value={order.receiver.name} />
            <Row label="العنوان / Address" value={order.receiver.address} />
            <Row label="الجوال / Mobile" value={order.receiver.mobile} ltr />
          </Section>

          <Section title="معلومات السائق / Driver Information">
            <Row label="الاسم / Name" value={order.driver.name} />
            <Row label="رقم الإقامة / Iqama" value={order.driver.iqamaNumber} ltr />
            <Row label="الجوال / Mobile" value={order.driver.mobile} ltr />
          </Section>

          <Section title="معلومات النقل / Transportation Information">
            <Row label="من مدينة / From" value={order.transport.fromCity} />
            <Row label="إلى مدينة / To" value={order.transport.toCity} />
            <Row label="رقم الطلب / Order No" value={order.transport.orderNo} ltr />
          </Section>

          <Section title="معلومات السيارة / Car Information">
            <Row label="لوحة / Plate" value={order.car.plateNumber} />
            <Row label="المالك / Owner" value={order.car.owner} />
            <Row label="رقم الهوية / ID" value={order.car.idNumber} ltr />
          </Section>

          <Section title="معلومات الحمولة / Load Information">
            <Row label="النوع / Type" value={order.load.type} />
            <Row label="الوزن / Weight" value={order.load.weight} />
          </Section>

          <Section title="رمز الاستجابة / QR Code">
            <div
              data-role="qr-code"
              className="flex min-h-[140px] items-center justify-center"
            >
              {qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="h-32 w-32 object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">
                  سيتم إنشاء رمز QR عند التحميل
                </span>
              )}
            </div>
          </Section>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div className="mb-10 border-b border-dashed border-slate-300" />
            <p className="font-semibold">توقيع المستلم</p>
            <p className="text-xs text-slate-500">Receiver Signature</p>
          </div>
          <div>
            <div className="mb-10 border-b border-dashed border-slate-300" />
            <p className="font-semibold">توقيع السائق</p>
            <p className="text-xs text-slate-500">Driver Signature</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          وصل للتوصيل — المملكة العربية السعودية
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-bold text-[#204978]">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800" dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </span>
    </div>
  );
}
