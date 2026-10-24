import { NextResponse } from "next/server";
import QRCode from "qrcode";
import os from "os";

function getLocalIpAddress(): string {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === "IPv4" && !net.internal && !net.address.startsWith("127.")) {
          return net.address;
        }
      }
    }
  } catch {
    /* fallback */
  }
  return "localhost";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let url = String(body.url || body.text || "").trim();
    const status = body.status || "In Transit";

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const configuredBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

    try {
      const parsedUrl = new URL(url);

      if (configuredBase) {
        try {
          const base = new URL(configuredBase);
          parsedUrl.protocol = base.protocol;
          parsedUrl.host = base.host;
        } catch {
          /* ignore */
        }
      } else if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") {
        const localIp = getLocalIpAddress();
        if (localIp && localIp !== "localhost") {
          parsedUrl.hostname = localIp;
        }
      }

      if (status) {
        parsedUrl.searchParams.set("status", String(status));
      }
      url = parsedUrl.toString();
    } catch {
      // not a full URL, leave as is
    }

    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl: dataUrl,
      status,
      scannedUrl: url,
    });
  } catch (e) {
    console.error("QR generation API failed:", e);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
