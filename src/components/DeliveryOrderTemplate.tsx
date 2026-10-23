"use client";

import type { CSSProperties } from "react";
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
const BORDER = "#BFDBFE";

const pageStyle: CSSProperties = {
  width: 794,
  maxWidth: "100%",
  boxSizing: "border-box",
  background: "#ffffff",
  padding: "20px 22px 24px",
  color: "#0f172a",
  fontFamily: "Cairo, Tahoma, Arial, sans-serif",
  fontSize: 13,
  direction: "rtl",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #CBD5E1",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 13,
  fontFamily: "inherit",
  background: "#F8FAFC",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};

const sectionTitle: CSSProperties = {
  background: BLUE,
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: "8px 8px 0 0",
};

const sectionBody: CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderTop: "none",
  borderRadius: "0 0 8px 8px",
  padding: 10,
  marginBottom: 10,
  background: "#fff",
};

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
      className="pdf-page"
      style={pageStyle}
      dir="rtl"
      data-editable-form="true"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          borderBottom: `2px solid ${BLUE}`,
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.company.logoDataUrl || "/wasl-logo.jpg"}
            alt="logo"
            width={64}
            height={64}
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
            }}
            crossOrigin="anonymous"
          />
          <div style={{ flex: 1 }}>
            <Field
              value={order.company.nameAr}
              onChange={(v) => setNested("company", "nameAr", v)}
              style={{ fontWeight: 800, fontSize: 16, color: BLUE, marginBottom: 4 }}
            />
            <Field
              value={order.company.addressAr}
              onChange={(v) => setNested("company", "addressAr", v)}
              style={{ fontSize: 12, marginBottom: 4 }}
            />
            <Field
              value={order.company.phone}
              onChange={(v) => setNested("company", "phone", v)}
              dir="ltr"
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
        <div
          data-role="qr-code"
          style={{
            width: 100,
            height: 100,
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          {qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeUrl}
              alt="QR"
              width={92}
              height={92}
              style={{ width: 92, height: 92, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 10, color: "#94A3B8" }}>QR</span>
          )}
        </div>
      </div>

      {/* Dates row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 10,
        }}
      >
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

      {/* Car */}
      <div style={sectionTitle}>Car Information / معلومات المركبة</div>
      <div style={sectionBody}>
        <Row3
          a={{
            label: "Plate number / لوحة",
            value: order.car.plateNumber,
            onChange: (v) => setNested("car", "plateNumber", v),
          }}
          b={{
            label: "Owner / المالك",
            value: order.car.owner,
            onChange: (v) => setNested("car", "owner", v),
          }}
          c={{
            label: "ID number / رقم الهوية",
            value: order.car.idNumber,
            onChange: (v) => setNested("car", "idNumber", v),
            dir: "ltr",
          }}
        />
      </div>

      {/* Receiver */}
      <div style={sectionTitle}>Receiver Information / معلومات المستلم</div>
      <div style={sectionBody}>
        <Row3
          a={{
            label: "Receiver Name / الاسم",
            value: order.receiver.name,
            onChange: (v) => setNested("receiver", "name", v),
          }}
          b={{
            label: "Receiver Address / العنوان",
            value: order.receiver.address,
            onChange: (v) => setNested("receiver", "address", v),
          }}
          c={{
            label: "Receiver Mobile / الجوال",
            value: order.receiver.mobile,
            onChange: (v) => setNested("receiver", "mobile", v),
            dir: "ltr",
          }}
        />
      </div>

      {/* Transport */}
      <div style={sectionTitle}>Transportation Information / معلومات النقل</div>
      <div style={sectionBody}>
        <Row3
          a={{
            label: "From City / من",
            value: order.transport.fromCity,
            onChange: (v) => setNested("transport", "fromCity", v),
          }}
          b={{
            label: "To City / إلى",
            value: order.transport.toCity,
            onChange: (v) => setNested("transport", "toCity", v),
          }}
          c={{
            label: "Order No / رقم الطلب",
            value: order.transport.orderNo,
            onChange: (v) => setNested("transport", "orderNo", v),
            dir: "ltr",
          }}
        />
      </div>

      {/* Driver */}
      <div style={sectionTitle}>Driver Information / معلومات السائق</div>
      <div style={sectionBody}>
        <Row3
          a={{
            label: "Name / الاسم",
            value: order.driver.name,
            onChange: (v) => setNested("driver", "name", v),
          }}
          b={{
            label: "Iqama Number / الإقامة",
            value: order.driver.iqamaNumber,
            onChange: (v) => setNested("driver", "iqamaNumber", v),
            dir: "ltr",
          }}
          c={{
            label: "Mobile / الجوال",
            value: order.driver.mobile,
            onChange: (v) => setNested("driver", "mobile", v),
            dir: "ltr",
          }}
        />
      </div>

      {/* Goods table */}
      <div style={sectionTitle}>Load Information / معلومات الحمولة</div>
      <div style={{ ...sectionBody, padding: 0, overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#EFF6FF" }}>
              <th style={thCell}>Goods Type / نوع البضاعة</th>
              <th style={thCell}>Quantity / الكمية</th>
              <th style={thCell}>Weight / الوزن</th>
              <th style={{ ...thCell, width: 44 }} className="no-print">
                —
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={tdCell}>
                  <Field
                    value={item.type}
                    onChange={(v) => onUpdateItem(item.id, "type", v)}
                  />
                </td>
                <td style={tdCell}>
                  <Field
                    value={item.quantity}
                    onChange={(v) => onUpdateItem(item.id, "quantity", v)}
                    dir="ltr"
                  />
                </td>
                <td style={tdCell}>
                  <Field
                    value={`${item.weight}${item.weightUnit ? ` ${item.weightUnit}` : ""}`.trim()}
                    onChange={(v) => {
                      // keep simple: store full string in weight, clear unit or parse lightly
                      const parts = v.trim().split(/\s+/);
                      const weight = parts[0] || "";
                      const weightUnit = parts.slice(1).join(" ") || item.weightUnit;
                      onUpdateItem(item.id, "weight", weight);
                      if (parts.length > 1) onUpdateItem(item.id, "weightUnit", weightUnit);
                      else if (!v.includes(" ")) onUpdateItem(item.id, "weightUnit", "");
                    }}
                    dir="ltr"
                  />
                </td>
                <td style={tdCell} className="no-print">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      style={{
                        border: "none",
                        background: "#FEE2E2",
                        color: "#B91C1C",
                        borderRadius: 6,
                        padding: 6,
                        cursor: "pointer",
                        display: "flex",
                        margin: "0 auto",
                      }}
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

        <button
          type="button"
          onClick={onAddItem}
          className="no-print"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px",
            border: "none",
            borderTop: `1px dashed ${BORDER}`,
            background: "#F8FAFC",
            color: BLUE,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Plus size={16} />
          Add another item / إضافة صنف آخر
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "#94A3B8",
          marginTop: 8,
        }}
      >
        {order.company.nameAr} — المملكة العربية السعودية
      </p>
    </div>
  );
}

const thCell: CSSProperties = {
  padding: "8px 6px",
  fontSize: 11,
  fontWeight: 700,
  color: BLUE,
  borderBottom: `1px solid ${BORDER}`,
  textAlign: "center",
};

const tdCell: CSSProperties = {
  padding: 6,
  borderBottom: `1px solid #E2E8F0`,
  verticalAlign: "middle",
};

function MiniCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: 8,
        background: "#F8FAFC",
      }}
    >
      <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Row3({
  a,
  b,
  c,
}: {
  a: { label: string; value: string; onChange: (v: string) => void; dir?: string };
  b: { label: string; value: string; onChange: (v: string) => void; dir?: string };
  c: { label: string; value: string; onChange: (v: string) => void; dir?: string };
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
      }}
    >
      {[a, b, c].map((f) => (
        <div key={f.label}>
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            {f.label}
          </div>
          <Field value={f.value} onChange={f.onChange} dir={f.dir} />
        </div>
      ))}
    </div>
  );
}

function Field({
  value,
  onChange,
  dir,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  dir?: string;
  style?: CSSProperties;
}) {
  return (
    <input
      className="edit-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir={dir}
      style={{ ...inputStyle, ...style }}
    />
  );
}
