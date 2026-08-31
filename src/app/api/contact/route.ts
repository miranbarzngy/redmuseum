import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7).regex(/^[0-9+\-\s()]+$/),
  message: z.string().min(10),
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

  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").insert(parsed.data);

  if (error) {
    console.error("[contact] failed to save inquiry", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
