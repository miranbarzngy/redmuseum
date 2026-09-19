"use client";

import { useTranslations } from "next-intl";
import { FileText, Download } from "lucide-react";

// Shared by the homepage contact section and the standalone /contact page.
// Falls back to a static /public asset when no admin-uploaded PDF is set —
// drop the real PDF at this path to make the button work without an upload.
const FALLBACK_GUIDE_FLYER_URL = "/downloads/amna-suraka-visitor-guide.pdf";

export function GuideFlyerCard({ href, className }: { href?: string | null; className?: string }) {
  const tPage = useTranslations("contactPage");

  return (
    <a
      href={href || FALLBACK_GUIDE_FLYER_URL}
      download
      target="_blank"
      rel="noreferrer noopener"
      className={`flex items-start gap-4 rounded-2xl border border-[#850B10]/20 bg-gradient-to-br from-[#850B10] to-[#5c0509] p-5 text-canvas shadow-card transition-transform hover:scale-[1.015] ${className ?? ""}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
        <FileText size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-fluid-xs uppercase tracking-[0.15em] text-canvas">{tPage("guideLabel")}</div>
        <div className="mt-1 text-fluid-sm font-semibold">{tPage("guideHeading")}</div>
        <p className="mt-1 text-fluid-xs leading-relaxed text-canvas">{tPage("guideDescription")}</p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-fluid-xs font-semibold text-[#850B10]">
          <Download size={14} />
          {tPage("guideDownload")}
        </span>
      </div>
    </a>
  );
}
