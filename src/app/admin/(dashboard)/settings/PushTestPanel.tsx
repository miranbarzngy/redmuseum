"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Panel } from "../../_components/Panel";
import { btnTonal } from "../../_components/Button";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { PUSH_TOKEN_KEY } from "../../_components/NativePushBridge";
import { sendTestPush } from "./actions";

type Result = { text: string; ok: boolean };

const NOT_REGISTERED = "ئەم مۆبایلە تۆمار نەکراوە — ئەپەکە دابخە و دووبارە بیکەرەوە";

export function PushTestPanel() {
  const native = useIsNativeApp();
  const [sending, startSending] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function handleSend() {
    // Inside the app only this phone is tested; from a browser, every
    // registered phone gets it.
    let token: string | null = null;
    if (native) {
      try {
        token = localStorage.getItem(PUSH_TOKEN_KEY);
      } catch {}
      if (!token) {
        setResult({ text: NOT_REGISTERED, ok: false });
        return;
      }
    }

    setResult(null);
    startSending(async () => {
      const res = await sendTestPush(token ?? undefined).catch(() => ({ error: "send_failed" as const }));
      if ("error" in res) {
        setResult({ text: "هەڵەیەک ڕوویدا — دووبارە هەوڵبدەوە", ok: false });
      } else if (!res.total) {
        setResult({
          text: native
            ? NOT_REGISTERED
            : "هیچ مۆبایلێک تۆمار نەکراوە — ئەپی ئەندرۆید بکەرەوە و ڕێگە بە ئاگادارکردنەوە بدە",
          ok: false,
        });
      } else if (!res.sent) {
        setResult({ text: "ناردن سەرکەوتوو نەبوو", ok: false });
      } else {
        setResult({
          text: native
            ? "✓ نێردرا"
            : `✓ نێردرا بۆ ${res.sent} مۆبایل${res.failed ? ` — ${res.failed} سەرکەوتوو نەبوو` : ""}`,
          ok: true,
        });
      }
    });
  }

  return (
    <Panel
      title="تاقیکردنەوەی ئاگادارکردنەوە"
      description={
        native
          ? "ئاگادارکردنەوەیەکی تاقیکاری بۆ ئەم مۆبایلە دەنێرێت بە دەنگی هەڵبژێردراو."
          : "ئاگادارکردنەوەیەکی تاقیکاری بۆ هەموو مۆبایلە تۆمارکراوەکان دەنێرێت."
      }
    >
      <button type="button" onClick={handleSend} disabled={sending} className={btnTonal}>
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        <span className="font-kurdish">ناردنی ئاگادارکردنەوەی تاقیکاری</span>
      </button>

      {result && (
        <p className={`font-kurdish mt-3 text-fluid-xs ${result.ok ? "text-emerald-700" : "text-pigment-crimson"}`}>
          {result.text}
        </p>
      )}
    </Panel>
  );
}
