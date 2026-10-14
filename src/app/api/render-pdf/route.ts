import { NextResponse } from "next/server";

/**
 * Accepts HTML and returns it for client-side PDF generation fallback.
 * Primary PDF path uses html2canvas + jspdf in the browser (reliable on Vercel).
 * This endpoint exists for compatibility with the reference app flow.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const html = String(body.html || "");
    if (!html) {
      return NextResponse.json({ error: "html is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mode: "client",
      message: "Use client-side PDF renderer",
    });
  } catch (e) {
    console.error("PDF Generation failed:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
