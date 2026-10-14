import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body.text || body.url || "");
    const status = body.status || "In Transit";

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const payload = JSON.stringify({ url: text, status });
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      color: { dark: "#204978", light: "#ffffff" },
    });

    return NextResponse.json({ success: true, qrCodeUrl: dataUrl, status });
  } catch (e) {
    console.error("QR generation API failed:", e);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
