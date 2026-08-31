import QRCode from "qrcode";
import { STATUS_LABELS } from "./status";
import { VISITOR_TYPE_LABELS } from "./visitorType";
import { formatVisitDate, formatSubmittedAt } from "./formatBookingDate";
import type { BookingRow, BookingStatus } from "@/lib/supabase/database.types";

// Solid status colours, matching STATUS_SOLID in status.ts.
const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "#A67C1E",
  confirmed: "#1F5F5B",
  checked_in: "#850B10",
  cancelled: "#9B3B3B",
  no_show: "#8A8580",
};

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/**
 * Opens a new window with an A4 booking sheet — museum logo + name, the QR
 * code, the visitor's face photo, and every field — then triggers the
 * browser print dialog. The window is opened synchronously (before any
 * await) so the click's user-gesture isn't lost to popup blockers.
 */
export async function openBookingPrint(
  booking: BookingRow,
  /** A resolved signed URL, or a promise for one (started by the caller so
   * the window can still open inside the click's user-gesture). */
  facePhoto: string | null | Promise<string | null>
): Promise<void> {
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) return;
  win.document.write(
    "<!doctype html><title>چاپکردن…</title><body style='font-family:sans-serif;padding:24px;direction:rtl'>ئامادەکردن بۆ چاپ…</body>"
  );

  const facePhotoUrl = await Promise.resolve(facePhoto).catch(() => null);
  const origin = window.location.origin;
  const statusUrl = `${origin}/ku/booking/${booking.public_token}`;
  const logoUrl = `${origin}/images/logo/logo.png`;
  const reference = booking.public_token.slice(0, 8).toUpperCase();
  const statusColor = STATUS_COLOR[booking.status] ?? "#1C1B19";
  const printedAt = formatSubmittedAt(new Date().toISOString());

  let qr = "";
  try {
    qr = await QRCode.toDataURL(statusUrl, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1C1B19", light: "#ffffff" },
    });
  } catch {
    /* QR is best-effort */
  }

  const rows: [string, string, boolean?][] = [
    ["ناو", booking.name],
    ["ژمارەی مۆبایل", booking.phone, true],
    ["ژمارەی میوان", String(booking.guest_count)],
    ["جۆری سەردان", VISITOR_TYPE_LABELS[booking.visitor_type]],
    ["بەرواری سەردان", formatVisitDate(booking.visit_date), true],
    ["دۆخ", STATUS_LABELS[booking.status]],
    ["ژمارەی سەردان", reference, true],
    ["نێردراوە لە", formatSubmittedAt(booking.created_at), true],
  ];

  const rowsHtml = rows
    .map(
      ([k, v, ltr]) =>
        `<div class="row"><span class="k">${esc(k)}</span><span class="v"${
          ltr ? ' dir="ltr"' : ""
        }>${esc(v)}</span></div>`
    )
    .join("");

  const noteHtml = booking.note
    ? `<div class="note"><div class="note-label">تێبینی</div><div class="note-body">${esc(
        booking.note
      )}</div></div>`
    : "";

  const asideHtml = `
    ${
      qr
        ? `<div class="qr"><img src="${qr}" alt=""/><div class="qr-cap">ئەم کۆدە لە کاتی هاتنتدا پیشان بدە بۆ بینینی دۆخی سەردان</div></div>`
        : ""
    }
    ${facePhotoUrl ? `<div class="face"><img src="${esc(facePhotoUrl)}" alt=""/></div>` : ""}
  `;

  const html = `<!doctype html>
<html lang="ku" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>سەردان — ${esc(reference)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Vazirmatn", "Segoe UI", Tahoma, system-ui, sans-serif;
    color: #1C1B19; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    font-size: 13px; line-height: 1.6;
  }
  .sheet { max-width: 720px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 14px; }
  .header img { width: 54px; height: 54px; object-fit: contain; }
  .brand { display: flex; flex-direction: column; }
  .brand .ku { font-weight: 700; font-size: 15px; }
  .brand .en { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #8A8580; }
  .rule { height: 3px; background: #850B10; border-radius: 3px; margin: 14px 0 20px; }
  .title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .title { font-size: 19px; font-weight: 700; }
  .status { display: inline-block; padding: 6px 16px; border-radius: 999px; color: #fff; font-weight: 600; font-size: 12px; background: ${statusColor}; }
  .body { display: flex; gap: 24px; align-items: flex-start; }
  .details { flex: 1; }
  .row { display: flex; justify-content: space-between; gap: 20px; padding: 9px 2px; border-bottom: 1px solid #EFEDE6; }
  .row:last-child { border-bottom: 0; }
  .k { color: #8A8580; font-weight: 500; }
  .v { font-weight: 600; text-align: end; }
  .aside { width: 210px; flex-shrink: 0; text-align: center; }
  .qr { border: 1px solid #E7E3D8; border-radius: 14px; padding: 12px; }
  .qr img { width: 100%; height: auto; display: block; }
  .qr-cap { font-size: 10.5px; color: #6b6862; margin-top: 8px; line-height: 1.5; }
  .face { margin-top: 16px; }
  .face img { width: 128px; height: 128px; border-radius: 50%; object-fit: cover; border: 4px solid #c8a96e; }
  .note { margin-top: 18px; }
  .note-label { color: #8A8580; font-weight: 500; margin-bottom: 5px; }
  .note-body { white-space: pre-wrap; border: 1px solid #EFEDE6; border-radius: 12px; padding: 10px 12px; }
  .footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid #EFEDE6; display: flex; justify-content: space-between; gap: 12px; font-size: 10px; color: #8A8580; }
</style>
</head>
<body onload="setTimeout(function(){try{window.focus();}catch(e){}window.print();}, 300)">
  <div class="sheet">
    <div class="header">
      <img src="${esc(logoUrl)}" alt=""/>
      <div class="brand">
        <span class="ku">مۆزەخانەی نیشتیمانی ئەمنە سورەکە</span>
        <span class="en">National Museum Amnasuraka</span>
      </div>
    </div>
    <div class="rule"></div>

    <div class="title-row">
      <span class="title">زانیاری سەردان</span>
      <span class="status">${esc(STATUS_LABELS[booking.status])}</span>
    </div>

    <div class="body">
      <div class="details">
        ${rowsHtml}
        ${noteHtml}
      </div>
      <div class="aside">
        ${asideHtml}
      </div>
    </div>

    <div class="footer">
      <span dir="ltr">${esc(statusUrl)}</span>
      <span>چاپکراوە: <span dir="ltr">${esc(printedAt)}</span></span>
    </div>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
