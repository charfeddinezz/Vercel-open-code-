import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * GET /api/qr?text=https://... — توليد QR PNG لمسحه بالهاتف
 */
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  if (!text || text.length > 2048) {
    return NextResponse.json({ error: "مرّر ?text= برابط صالح" }, { status: 400 });
  }
  try {
    const png = await QRCode.toBuffer(text, { type: "png", width: 512, margin: 2, color: { dark: "#111111", light: "#ffffff" } });
    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "تعذر توليد QR" }, { status: 500 });
  }
}
