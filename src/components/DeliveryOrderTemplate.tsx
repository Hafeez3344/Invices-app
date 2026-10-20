"use client";

import type { CSSProperties } from "react";
import { buildRouteText } from "@/lib/defaults";
import { statusLabelAr, type DeliveryOrder } from "@/lib/types";

type Props = {
  order: DeliveryOrder;
  qrCodeUrl?: string;
};

const GREEN = "#1B7A6E";
const GREEN_DARK = "#155F56";
const LABEL_BG = "#F3F7F6";
const BORDER = "#9CA3AF";

/** Inline styles — more reliable for html2canvas PDF export than Tailwind utilities */
const pageStyle: CSSProperties = {
  width: 794,
  minHeight: 1123,
  boxSizing: "border-box",
  background: "#ffffff",
  padding: "28px 28px 40px",
  color: "#000000",
  fontFamily: "Cairo, Tahoma, Arial, sans-serif",
  fontSize: 12,
  direction: "rtl",
  position: "relative",
  overflow: "hidden",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "fixed",
  marginBottom: 12,
  border: `1px solid ${BORDER}`,
};

const thStyle: CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: "8px 6px",
  fontWeight: 700,
  background: "#E8F3F1",
  textAlign: "center",
  fontSize: 11,
  verticalAlign: "middle",
};

const tdLabelStyle: CSSProperties = {
  width: "30%",
  border: `1px solid ${BORDER}`,
  padding: "8px 10px",
  fontWeight: 700,
  color: GREEN_DARK,
  background: LABEL_BG,
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const tdValueStyle: CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: "8px 10px",
  verticalAlign: "middle",
  wordBreak: "break-word",
};

export default function DeliveryOrderTemplate({ order, qrCodeUrl }: Props) {
  const statusAr = statusLabelAr(order.status);
  const route = buildRouteText(order);

  return (
    <div
      id="delivery-order-template"
      style={{
        width: 794,
        margin: "0 auto",
        fontFamily: "Cairo, Tahoma, Arial, sans-serif",
        color: "#000",
        direction: "rtl",
      }}
      dir="rtl"
    >
      {/* PAGE 1 */}
      <article className="pdf-page" style={{ ...pageStyle, marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={{ width: 70, verticalAlign: "middle" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.company.logoDataUrl || "/wasl-logo.jpg"}
                  alt="logo"
                  width={56}
                  height={56}
                  style={{ width: 56, height: 56, objectFit: "contain", display: "block" }}
                  crossOrigin="anonymous"
                />
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: GREEN_DARK,
                    letterSpacing: "normal",
                    lineHeight: 1.3,
                  }}
                >
                  وثيقة نقل
                </div>
              </td>
              <td style={{ width: 150, verticalAlign: "top" }}>
                <div
                  data-role="qr-code"
                  style={{
                    width: 140,
                    height: 140,
                    border: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "auto",
                    background: "#fff",
                    padding: 4,
                    boxSizing: "border-box",
                  }}
                >
                  {qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={130}
                      height={130}
                      style={{
                        width: 130,
                        height: 130,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>QR</span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", width: "50%" }}>
                <Meta label="رقم الوثيقة:" value={order.invoiceNumber} />
              </td>
              <td style={{ padding: "4px 0", width: "50%" }}>
                <Meta label="رقم الترخيص:" value={order.licenseNumber} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }} colSpan={2}>
                <span style={{ fontWeight: 700, marginLeft: 6 }}>تاريخ الوثيقة:</span>
                <span style={{ fontWeight: 700, direction: "ltr", unicodeBidi: "isolate" }}>
                  {order.receiptDate || "—"}
                </span>
                <span style={{ fontWeight: 700, margin: "0 8px" }}>إلى</span>
                <span style={{ fontWeight: 700, direction: "ltr", unicodeBidi: "isolate" }}>
                  {order.deliveryDate || "—"}
                </span>
                <span style={{ color: "#6B7280", marginRight: 8 }}>(5 أيام)</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Meta label="Start Date:" value={order.receiptDate} />
              </td>
              <td style={{ padding: "4px 0" }}>
                <Meta label="End Date:" value={order.deliveryDate} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }} colSpan={2}>
                <span style={{ fontWeight: 700, marginLeft: 8 }}>الحالة:</span>
                <span
                  style={{
                    display: "inline-block",
                    background: GREEN,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {statusAr}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <SectionBar title="Owner Details:" />
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tdLabelStyle}>الاسم / Name:</td>
              <td style={tdValueStyle} colSpan={3}>
                {order.sender.name}
              </td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Owner ID:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.car.idNumber}
              </td>
              <td style={tdLabelStyle}>Mobile Number:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.company.phone}
              </td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Notes:</td>
              <td style={tdValueStyle} colSpan={3}>
                {order.company.notes || "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...tableStyle, marginBottom: 12 }}>
          <tbody>
            <tr>
              <td
                colSpan={2}
                style={{
                  background: GREEN,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  width: "50%",
                }}
              >
                بيانات السائق:
              </td>
              <td
                colSpan={2}
                style={{
                  background: GREEN,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  width: "50%",
                }}
              >
                بيانات الشاحنة:
              </td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>اسم السائق:</td>
              <td style={tdValueStyle}>{order.driver.name}</td>
              <td style={tdLabelStyle}>لوحة المركبة:</td>
              <td style={tdValueStyle}>{order.car.plateNumber}</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>رقم هوية السائق:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.driver.iqamaNumber}
              </td>
              <td style={tdLabelStyle}>نوع لوحة المركبة:</td>
              <td style={tdValueStyle}>{order.car.plateType}</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>رقم الهاتف:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.driver.mobile}
              </td>
              <td style={tdLabelStyle}>تاريخ التسليم المتوقع:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.deliveryDate}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#6B7280",
            marginTop: 48,
          }}
        >
          الصفحة 1 من 2
        </div>
      </article>

      {/* PAGE 2 */}
      <article className="pdf-page" style={pageStyle}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={{ width: 80, verticalAlign: "top" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.company.logoDataUrl || "/wasl-logo.jpg"}
                  alt="logo"
                  width={56}
                  height={56}
                  style={{ width: 56, height: 56, objectFit: "contain", display: "block" }}
                  crossOrigin="anonymous"
                />
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: GREEN_DARK,
                    letterSpacing: "normal",
                    lineHeight: 1.3,
                  }}
                >
                  وثيقة بيان حمولة
                </div>
              </td>
              <td style={{ width: 80 }} />
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", width: "33%" }}>
                <Meta label="رقم الوثيقة:" value={order.invoiceNumber} />
              </td>
              <td style={{ padding: "4px 0", width: "33%" }}>
                <span style={{ fontWeight: 700, marginLeft: 8 }}>الحالة:</span>
                <span
                  style={{
                    display: "inline-block",
                    background: GREEN,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 4,
                  }}
                >
                  {statusAr}
                </span>
              </td>
              <td style={{ padding: "4px 0", width: "34%" }}>
                <Meta label="قابلة للتداول:" value={order.negotiable} />
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }} colSpan={3}>
                <span style={{ fontWeight: 700, marginLeft: 6 }}>تاريخ الوثيقة:</span>
                <span style={{ fontWeight: 700, direction: "ltr", unicodeBidi: "isolate" }}>
                  {order.receiptDate || "—"}
                </span>
                <span style={{ fontWeight: 700, margin: "0 8px" }}>إلى</span>
                <span style={{ fontWeight: 700, direction: "ltr", unicodeBidi: "isolate" }}>
                  {order.deliveryDate || "—"}
                </span>
                <span style={{ color: "#6B7280", marginRight: 8 }}>(Start → End / 5 days)</span>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <td
                colSpan={2}
                style={{
                  background: GREEN,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  width: "50%",
                }}
              >
                بيانات المرسل:
              </td>
              <td
                colSpan={2}
                style={{
                  background: GREEN,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  width: "50%",
                }}
              >
                بيانات المرسل إليه:
              </td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>الاسم:</td>
              <td style={tdValueStyle}>{order.sender.name}</td>
              <td style={tdLabelStyle}>الاسم:</td>
              <td style={tdValueStyle}>{order.receiver.name}</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>العنوان:</td>
              <td style={tdValueStyle}>{order.sender.address}</td>
              <td style={tdLabelStyle}>العنوان:</td>
              <td style={tdValueStyle}>{order.receiver.address}</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>المدينة:</td>
              <td style={tdValueStyle}>
                {order.sender.city || order.transport.fromCity}
                {order.transport.fromCityEn
                  ? ` / ${order.transport.fromCityEn}`
                  : ""}
              </td>
              <td style={tdLabelStyle}>المدينة:</td>
              <td style={tdValueStyle}>
                {order.receiver.city || order.transport.toCity}
                {order.transport.toCityEn
                  ? ` / ${order.transport.toCityEn}`
                  : ""}
              </td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>رقم الهاتف:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.sender.phone}
              </td>
              <td style={tdLabelStyle}>رقم الهاتف:</td>
              <td style={{ ...tdValueStyle, direction: "ltr", textAlign: "right" }}>
                {order.receiver.mobile}
              </td>
            </tr>
          </tbody>
        </table>

        <SectionBar title="خط سير الرحلة:" />
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderTop: "none",
            padding: "10px 12px",
            marginBottom: 12,
            lineHeight: 1.7,
            fontSize: 12,
          }}
        >
          {route}
        </div>

        <SectionBar title="بيانات البضاعة:" />
        <table style={tableStyle}>
          <thead>
            <tr>
              {[
                "وصف البضاعة",
                "العدد",
                "الوزن",
                "وحدة الوزن",
                "الأبعاد (متر)",
                "وحدة التعبئة",
                "الحالة",
              ].map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(order.items?.length ? order.items : [order.load]).map((item) => (
              <tr key={item.id || `${item.type}-${item.quantity}`}>
                <td style={{ ...tdValueStyle, textAlign: "center" }}>{item.type}</td>
                <td style={{ ...tdValueStyle, textAlign: "center", direction: "ltr" }}>
                  {item.quantity}
                </td>
                <td style={{ ...tdValueStyle, textAlign: "center", direction: "ltr" }}>
                  {item.weight}
                </td>
                <td style={{ ...tdValueStyle, textAlign: "center" }}>
                  {item.weightUnit}
                </td>
                <td style={{ ...tdValueStyle, textAlign: "center" }}>
                  {item.dimensions || "—"}
                </td>
                <td style={{ ...tdValueStyle, textAlign: "center" }}>
                  {item.packingUnit || "—"}
                </td>
                <td style={{ ...tdValueStyle, textAlign: "center" }}>
                  {item.condition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <td
                style={{
                  background: GREEN,
                  color: "#fff",
                  fontWeight: 700,
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  width: "50%",
                }}
              >
                ملاحظات المرسل:
              </td>
              <td
                style={{
                  background: GREEN,
                  color: "#fff",
                  fontWeight: 700,
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  width: "50%",
                }}
              >
                ملاحظات المرسل إليه:
              </td>
            </tr>
            <tr>
              <td
                style={{
                  ...tdValueStyle,
                  minHeight: 56,
                  height: 56,
                  verticalAlign: "top",
                }}
              >
                {order.sender.notes || "—"}
              </td>
              <td
                style={{
                  ...tdValueStyle,
                  minHeight: 56,
                  height: 56,
                  verticalAlign: "top",
                }}
              >
                {order.receiver.notes || "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#4B5563",
            margin: "16px 0 24px",
          }}
        >
          دون أدنى مسؤولية على محتويات الوثيقة
        </p>

        <div style={{ textAlign: "center", fontSize: 11, color: "#6B7280" }}>
          الصفحة 2 من 2
        </div>
      </article>
    </div>
  );
}

function SectionBar({ title }: { title: string }) {
  return (
    <div
      style={{
        background: GREEN,
        color: "#ffffff",
        fontWeight: 700,
        fontSize: 13,
        padding: "8px 12px",
        border: `1px solid ${BORDER}`,
        borderBottom: "none",
      }}
    >
      {title}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-block", lineHeight: 1.6 }}>
      <span style={{ fontWeight: 700, marginLeft: 6 }}>{label}</span>
      <span style={{ fontWeight: 700, direction: "ltr", unicodeBidi: "isolate" }}>
        {value || "—"}
      </span>
    </span>
  );
}
