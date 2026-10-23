"use client";

import { Plus, Trash2 } from "lucide-react";
import type { DeliveryOrder, GoodsItem } from "@/lib/types";

type Props = {
  order: DeliveryOrder;
  qrCodeUrl?: string;
  onChange: (next: DeliveryOrder) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, key: keyof GoodsItem, value: string) => void;
};

const BLUE = "#204978";

export default function DeliveryOrderTemplate({
  order,
  qrCodeUrl,
  onChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: Props) {
  function set<K extends keyof DeliveryOrder>(key: K, value: DeliveryOrder[K]) {
    onChange({ ...order, [key]: value, updatedAt: new Date().toISOString() });
  }

  function setNested<
    S extends "company" | "car" | "receiver" | "sender" | "transport" | "driver"
  >(section: S, key: keyof DeliveryOrder[S], value: string) {
    onChange({
      ...order,
      [section]: { ...order[section], [key]: value },
      updatedAt: new Date().toISOString(),
    });
  }

  const items = order.items?.length ? order.items : [order.load];

  return (
    <div
      id="delivery-order-template"
      className="pdf-page mx-auto w-full max-w-[794px] rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-900 sm:p-5"
      style={{ fontFamily: "Cairo, Tahoma, Arial, sans-serif" }}
      dir="rtl"
      data-editable-form="true"
    >
      {/* Header: logo + 3 company rows + QR — logo & QR same size */}
      <div className="pdf-header mb-4 grid grid-cols-1 gap-3 border-b-2 border-[#204978] pb-3 sm:grid-cols-[140px_1fr_140px] sm:items-stretch sm:gap-3">
        {/* Logo — same size as QR */}
        <div className="pdf-logo mx-auto flex h-[140px] w-[140px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:mx-0 sm:h-auto sm:w-full sm:min-h-[140px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.company.logoDataUrl || "/wasl-logo.jpg"}
            alt="logo"
            width={140}
            height={140}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        </div>

        {/* 3 rows: name / address / phone — same total height as logo & QR */}
        <div className="flex min-w-0 flex-col justify-between gap-2">
          <Field
            value={order.company.nameAr}
            onChange={(v) => setNested("company", "nameAr", v)}
            className="h-full min-h-[40px] font-extrabold text-base text-[#204978]"
          />
          <Field
            value={order.company.addressAr}
            onChange={(v) => setNested("company", "addressAr", v)}
            className="h-full min-h-[40px] text-sm"
          />
          <Field
            value={order.company.phone}
            onChange={(v) => setNested("company", "phone", v)}
            dir="ltr"
            className="h-full min-h-[40px] text-sm"
          />
        </div>

        {/* QR — same size as logo */}
        <div
          data-role="qr-code"
          className="pdf-qr mx-auto flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white p-1.5 sm:mx-0 sm:h-auto sm:w-full sm:min-h-[140px]"
        >
          {qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeUrl}
              alt="QR"
              width={130}
              height={130}
              className="h-full w-full max-h-[130px] max-w-[130px] object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400">QR</span>
          )}
        </div>
      </div>

      {/* Dates — 1 col mobile, 3 col desktop */}
      <div className="pdf-dates mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MiniCard label="Invoice Number / رقم الطلب">
          <Field
            value={order.invoiceNumber}
            onChange={(v) => set("invoiceNumber", v)}
            dir="ltr"
          />
        </MiniCard>
        <MiniCard label="Receipt Date / تاريخ الاستلام">
          <Field
            value={order.receiptDate}
            onChange={(v) => set("receiptDate", v)}
            dir="ltr"
          />
        </MiniCard>
        <MiniCard label="Delivery Date / تاريخ التسليم">
          <Field
            value={order.deliveryDate}
            onChange={(v) => set("deliveryDate", v)}
            dir="ltr"
          />
        </MiniCard>
      </div>

      <Section title="Car Information / معلومات المركبة">
        <FieldRow
          fields={[
            {
              label: "Plate number / لوحة",
              value: order.car.plateNumber,
              onChange: (v) => setNested("car", "plateNumber", v),
            },
            {
              label: "Owner / المالك",
              value: order.car.owner,
              onChange: (v) => setNested("car", "owner", v),
            },
            {
              label: "ID number / رقم الهوية",
              value: order.car.idNumber,
              onChange: (v) => setNested("car", "idNumber", v),
              dir: "ltr",
            },
          ]}
        />
      </Section>

      <Section title="Receiver Information / معلومات المستلم">
        <FieldRow
          fields={[
            {
              label: "Receiver Name / الاسم",
              value: order.receiver.name,
              onChange: (v) => setNested("receiver", "name", v),
            },
            {
              label: "Receiver Address / العنوان",
              value: order.receiver.address,
              onChange: (v) => setNested("receiver", "address", v),
            },
            {
              label: "Receiver Mobile / الجوال",
              value: order.receiver.mobile,
              onChange: (v) => setNested("receiver", "mobile", v),
              dir: "ltr",
            },
          ]}
        />
      </Section>

      <Section title="Transportation Information / معلومات النقل">
        <FieldRow
          fields={[
            {
              label: "From City / من",
              value: order.transport.fromCity,
              onChange: (v) => setNested("transport", "fromCity", v),
            },
            {
              label: "To City / إلى",
              value: order.transport.toCity,
              onChange: (v) => setNested("transport", "toCity", v),
            },
            {
              label: "Order No / رقم الطلب",
              value: order.transport.orderNo,
              onChange: (v) => setNested("transport", "orderNo", v),
              dir: "ltr",
            },
          ]}
        />
      </Section>

      <Section title="Driver Information / معلومات السائق">
        <FieldRow
          fields={[
            {
              label: "Name / الاسم",
              value: order.driver.name,
              onChange: (v) => setNested("driver", "name", v),
            },
            {
              label: "Iqama Number / الإقامة",
              value: order.driver.iqamaNumber,
              onChange: (v) => setNested("driver", "iqamaNumber", v),
              dir: "ltr",
            },
            {
              label: "Mobile / الجوال",
              value: order.driver.mobile,
              onChange: (v) => setNested("driver", "mobile", v),
              dir: "ltr",
            },
          ]}
        />
      </Section>

      {/* Goods */}
      <div
        className="rounded-t-lg px-3 py-2 text-[13px] font-bold text-white"
        style={{ background: BLUE }}
      >
        Load Information / معلومات الحمولة
      </div>
      <div className="mb-3 overflow-hidden rounded-b-lg border border-t-0 border-blue-200 bg-white">
        {/* Mobile: stacked cards (hidden in PDF) */}
        <div className="pdf-goods-mobile space-y-3 p-3 sm:hidden">
          {items.map((item, index) => (
            <div
              key={`m-${item.id}`}
              className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#204978]">
                  Item {index + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="no-print rounded-md bg-red-100 p-1.5 text-red-700"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <LabeledField
                label="Goods Type / نوع البضاعة"
                value={item.type}
                onChange={(v) => onUpdateItem(item.id, "type", v)}
              />
              <LabeledField
                label="Quantity / الكمية"
                value={item.quantity}
                onChange={(v) => onUpdateItem(item.id, "quantity", v)}
                dir="ltr"
              />
              <LabeledField
                label="Weight / الوزن"
                value={`${item.weight}${item.weightUnit ? ` ${item.weightUnit}` : ""}`.trim()}
                onChange={(v) => {
                  const parts = v.trim().split(/\s+/);
                  onUpdateItem(item.id, "weight", parts[0] || "");
                  if (parts.length > 1) {
                    onUpdateItem(item.id, "weightUnit", parts.slice(1).join(" "));
                  } else if (!v.includes(" ")) {
                    onUpdateItem(item.id, "weightUnit", "");
                  }
                }}
                dir="ltr"
              />
            </div>
          ))}
        </div>

        {/* Desktop + PDF: table with ALL items */}
        <div className="pdf-goods-desktop hidden sm:block">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-blue-50">
                <th className="border-b border-blue-200 px-2 py-2 text-center text-[11px] font-bold text-[#204978]">
                  Goods Type / نوع البضاعة
                </th>
                <th className="border-b border-blue-200 px-2 py-2 text-center text-[11px] font-bold text-[#204978]">
                  Quantity / الكمية
                </th>
                <th className="border-b border-blue-200 px-2 py-2 text-center text-[11px] font-bold text-[#204978]">
                  Weight / الوزن
                </th>
                <th className="no-print w-11 border-b border-blue-200 px-2 py-2 text-center text-[11px] font-bold text-[#204978]">
                  —
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`d-${item.id}`}>
                  <td className="border-b border-slate-200 p-1.5">
                    <Field
                      value={item.type}
                      onChange={(v) => onUpdateItem(item.id, "type", v)}
                    />
                  </td>
                  <td className="border-b border-slate-200 p-1.5">
                    <Field
                      value={item.quantity}
                      onChange={(v) => onUpdateItem(item.id, "quantity", v)}
                      dir="ltr"
                    />
                  </td>
                  <td className="border-b border-slate-200 p-1.5">
                    <Field
                      value={`${item.weight}${item.weightUnit ? ` ${item.weightUnit}` : ""}`.trim()}
                      onChange={(v) => {
                        const parts = v.trim().split(/\s+/);
                        onUpdateItem(item.id, "weight", parts[0] || "");
                        if (parts.length > 1) {
                          onUpdateItem(
                            item.id,
                            "weightUnit",
                            parts.slice(1).join(" ")
                          );
                        } else if (!v.includes(" ")) {
                          onUpdateItem(item.id, "weightUnit", "");
                        }
                      }}
                      dir="ltr"
                    />
                  </td>
                  <td className="no-print border-b border-slate-200 p-1.5">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="mx-auto flex rounded-md bg-red-100 p-1.5 text-red-700"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="no-print flex w-full items-center justify-center gap-1.5 border-t border-dashed border-blue-200 bg-slate-50 py-2.5 text-[13px] font-bold text-[#204978]"
        >
          <Plus size={16} />
          Add another item / إضافة صنف آخر
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-slate-400">
        {order.company.nameAr} — المملكة العربية السعودية
      </p>
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
    <div className="mb-3">
      <div
        className="rounded-t-lg px-3 py-2 text-[13px] font-bold text-white"
        style={{ background: BLUE }}
      >
        {title}
      </div>
      <div className="rounded-b-lg border border-t-0 border-blue-200 bg-white p-3">
        {children}
      </div>
    </div>
  );
}

function FieldRow({
  fields,
}: {
  fields: Array<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    dir?: string;
  }>;
}) {
  return (
    <div className="pdf-field-row grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
      {fields.map((f) => (
        <LabeledField
          key={f.label}
          label={f.label}
          value={f.value}
          onChange={f.onChange}
          dir={f.dir}
        />
      ))}
    </div>
  );
}

function MiniCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-slate-50 p-2.5">
      <div className="mb-1.5 text-[11px] font-semibold text-slate-500">
        {label}
      </div>
      {children}
    </div>
  );
}

function LabeledField({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-1.5 text-[11px] font-semibold text-slate-500">
        {label}
      </div>
      <Field value={value} onChange={onChange} dir={dir} />
    </div>
  );
}

function Field({
  value,
  onChange,
  dir,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  dir?: string;
  className?: string;
}) {
  return (
    <input
      className={`edit-field w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:border-[#204978] focus:ring-1 focus:ring-[#204978]/30 sm:py-1.5 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir={dir}
    />
  );
}
