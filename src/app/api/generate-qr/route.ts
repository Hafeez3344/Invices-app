import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Plain URL only — phone cameras / scanners open this directly
    const url = String(body.url || body.text || "").trim();
    const status = body.status || "In Transit";

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Optional status as query param (still a valid scannable link)
    let payload = url;
    try {
      const u = new URL(url);
      if (status) u.searchParams.set("status", String(status));
      payload = u.toString();
    } catch {
      payload = url;
    }

    const dataUrl = await QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl: dataUrl,
      status,
      scannedUrl: payload,
    });
  } catch (e) {
    console.error("QR generation API failed:", e);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
