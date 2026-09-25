import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitedResponse, withinRateLimit } from "@/lib/rateLimit";
import { CONTACT_SUBJECTS } from "@/lib/contactSubjects";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().min(7).max(30).regex(/^[0-9+\-\s()]+$/),
  message: z.string().trim().min(10).max(5000),
  // Optional so the homepage's simpler contact form (which doesn't collect a
  // subject) keeps working unchanged — defaults to "general" when omitted.
  subject: z.enum(CONTACT_SUBJECTS).default("general"),
});

// TODO: also wire this up to a real email provider (Resend, SMTP, etc.) once
// credentials are available, so new inquiries page/notify someone in real
// time rather than only being visible next time the admin checks the inbox.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  if (!(await withinRateLimit("contact"))) {
    return rateLimitedResponse();
  }

  // Service-role insert: contact_messages has no anon INSERT policy (see
  // 0063_lock_down_anon_writes.sql), so this route — with its validation —
  // is the only way in. Only the validated fields are written; is_read and
  // created_at always take their column defaults.
  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    message: parsed.data.message,
    subject: parsed.data.subject,
  });

  if (error) {
    console.error("[contact] failed to save inquiry", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
