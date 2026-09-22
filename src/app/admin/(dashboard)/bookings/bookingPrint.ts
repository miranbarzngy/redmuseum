import QRCode from "qrcode";
import { STATUS_LABELS } from "./status";
import { formatVisitDate, formatSubmittedAt } from "./formatBookingDate";
import type { BookingRow, BookingStatus } from "@/lib/supabase/database.types";

// Solid status colours for the print sheet's status pill.
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
  visitorTypeLabel: string,
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
  const kurdishFontUrl = `${origin}/font/kurdish.otf`;
  const reference = booking.public_token.slice(0, 8).toUpperCase();
  const statusColor = STATUS_COLOR[booking.status] ?? "#1C1B19";
  const printedAt = formatSubmittedAt(new Date().toISOString());

  let qr = "";
  try {
    qr = await QRCode.toDataURL(statusUrl, {
      width: 380,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1C1B19", light: "#ffffff" },
    });
  } catch {
    /* QR is best-effort */
  }

  // Reference + status move up into the header badge cluster now, so the
  // details table itself no longer repeats them.
  const rows: [string, string, boolean?][] = [
    ["ناو", booking.name],
    ["ژمارەی مۆبایل", booking.phone, true],
    ["ژمارەی میوان", String(booking.guest_count)],
    ["جۆری سەردان", visitorTypeLabel],
    ["بەرواری سەردان", formatVisitDate(booking.visit_date), true],
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
    ${facePhotoUrl ? `<div class="face"><img src="${esc(facePhotoUrl)}" alt=""/></div>` : ""}
    ${qr ? `<div class="qr"><img src="${qr}" alt=""/></div>` : ""}
  `;

  const TERMS = [
    "کارمەندانی پێشوازیکردن مافی پشکنینی ناسنامە هەیانە لە کاتی چوونەژوورەوە.",
    "تکایە ڕێزی ڕێنماییە ناوخۆییەکانی مۆزەخانە بگرە.",
    "بۆ گۆڕینی کات یان هەڵوەشاندنەوەی سەردان، پێش کاتەکە پەیوەندیمان پێوە بکە.",
  ];
  const termsHtml = TERMS.map((t) => `<li>${esc(t)}</li>`).join("");

  const html = `<!doctype html>
<html lang="ku" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>سەردان — ${esc(reference)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  /* Same face the admin panel itself uses (see the kurdish.otf loading in
     src/app/admin/layout.tsx), loaded directly here since this print sheet
     is a standalone popup document outside Next's font pipeline. The
     unicode-range excludes ASCII digits (U+30-39) because kurdish.otf draws
     0-9 as Eastern Arabic-Indic numerals — excluding that range lets digits
     (phone, dates, reference code) fall through to Vazirmatn/sans-serif
     below instead, keeping them plain Western numerals. */
  @font-face {
    font-family: "KurdishPrint";
    src: url("${kurdishFontUrl}") format("truetype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
    unicode-range: U+0-2F, U+3A-10FFFF;
  }
  /* @page margin is 0, not the usual 15-16mm — Chrome only reserves room
     for its own printed header/footer (the page URL + date line) inside
     that page margin, and only draws them if there's space. Setting it to
     0 leaves no room, so that browser-injected line disappears; the same
     15mm of visual whitespace is recreated below as padding on .sheet
     itself instead, which content controls rather than the browser. */
  @media print {
    @page { size: A4 portrait; margin: 0; }
    body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "KurdishPrint", "Vazirmatn", "Segoe UI", Tahoma, system-ui, sans-serif;
    color: #1C1B19; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    font-size: 14px; line-height: 1.65;
  }
  /* Exact A4 box (not just a max-width column) so the sheet always spans
     the full printable page instead of shrink-wrapping to its content and
     leaving blank space below whenever a booking has less to show (no
     note, no face photo). The three direct children below are fixed-size
     (top/bottom) and flex: 1 (middle) so the header stays pinned to the
     top, the terms/stamp/footer stay pinned to the bottom, and the
     QR+details section stretches to absorb whatever room is left between
     them, however long or short the content is. */
  .sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 15mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .section-top { flex: 0 0 auto; }
  .section-mid { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; padding: 24px 0; }
  .section-bottom { flex: 0 0 auto; }
  .header { display: flex; align-items: center; gap: 14px; }
  .header img { width: 54px; height: 54px; object-fit: contain; }
  .brand { display: flex; flex-direction: column; }
  .brand .ku { font-weight: 700; font-size: 15px; }
  .brand .en { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #8A8580; }
  .rule { height: 3px; background: #850B10; border-radius: 3px; margin: 14px 0 20px; }

  .title-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
  .title-block { display: flex; flex-direction: column; gap: 3px; }
  .title { font-size: 19px; font-weight: 700; }
  .title-en { font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: #8A8580; }
  .badge-block { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .status { display: inline-block; padding: 5px 16px; border-radius: 999px; color: #fff; font-weight: 600; font-size: 11.5px; background: ${statusColor}; }
  .ref-chip { display: inline-block; padding: 4px 12px; border-radius: 999px; border: 1px solid #E7E3D8; background: #F9F7F2; font-weight: 700; font-size: 11.5px; letter-spacing: .04em; }

  .body { display: flex; gap: 28px; align-items: center; }
  .details { flex: 1; }
  .details-card { border: 1px solid #E7E3D8; border-radius: 14px; padding: 4px 22px; }
  .row { display: flex; justify-content: space-between; gap: 20px; padding: 13px 2px; border-bottom: 1px solid #EFEDE6; font-size: 15px; }
  .row:last-child { border-bottom: 0; }
  .k { color: #8A8580; font-weight: 500; }
  .v { font-weight: 600; text-align: end; }
  .aside { width: 230px; flex-shrink: 0; text-align: center; }
  .qr { border: 1px solid #E7E3D8; border-radius: 14px; padding: 16px; }
  .qr img { width: 100%; height: auto; display: block; }
  .face { margin-bottom: 18px; }
  .face img { width: 100%; height: 200px; border-radius: 10px; object-fit: cover; }
  .note { margin-top: 20px; }
  .note-label { color: #8A8580; font-weight: 500; margin-bottom: 5px; }
  .note-body { white-space: pre-wrap; border: 1px solid #EFEDE6; border-radius: 12px; padding: 12px 14px; font-size: 14px; }

  .terms { margin-top: 28px; padding-top: 16px; border-top: 1px solid #EFEDE6; }
  .terms-title { font-weight: 700; font-size: 12px; margin-bottom: 8px; }
  .terms-list { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin: 0; padding-inline-start: 16px; font-size: 10px; line-height: 1.6; color: #6b6862; }

  .stamp-row { display: flex; gap: 16px; margin-top: 20px; }
  .stamp-box { flex: 1; height: 64px; border: 1px dashed #C9C4B6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #ACA79A; }

  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #EFEDE6; display: flex; justify-content: space-between; gap: 12px; font-size: 10px; color: #8A8580; }
</style>
</head>
<body onload="setTimeout(function(){try{window.focus();}catch(e){}window.print();}, 300)">
  <div class="sheet">
    <div class="section-top">
      <div class="header">
        <img src="${esc(logoUrl)}" alt=""/>
        <div class="brand">
          <span class="ku">مۆزەخانەی نیشتیمانی ئەمنە سورەکە</span>
          <span class="en">National Museum Amnasuraka</span>
        </div>
      </div>
      <div class="rule"></div>

      <div class="title-row">
        <div class="title-block">
          <span class="title">کارتی سەردانیکردن</span>
          <span class="title-en">Visit Pass</span>
        </div>
        <div class="badge-block">
          <span class="status">${esc(STATUS_LABELS[booking.status])}</span>
          <span class="ref-chip" dir="ltr">#${esc(reference)}</span>
        </div>
      </div>
    </div>

    <div class="section-mid">
      <div class="body">
        <div class="details">
          <div class="details-card">
            ${rowsHtml}
          </div>
          ${noteHtml}
        </div>
        <div class="aside">
          ${asideHtml}
        </div>
      </div>
    </div>

    <div class="section-bottom">
      <div class="terms">
        <div class="terms-title">ڕێنماییەکانی سەردان</div>
        <ul class="terms-list">
          ${termsHtml}
        </ul>
      </div>

      <div class="stamp-row">
        <div class="stamp-box">جێی مۆر</div>
        <div class="stamp-box">واژۆی میوان</div>
      </div>

      <div class="footer">
        <span dir="ltr">${esc(statusUrl)}</span>
        <span>چاپکراوە: <span dir="ltr">${esc(printedAt)}</span></span>
      </div>
    </div>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
