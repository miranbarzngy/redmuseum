import { signIn } from "./actions";
import { PasswordField } from "./PasswordField";
import { Field } from "../_components/Field";
import { BrandLockup } from "@/components/BrandLockup";
import { CooldownNotice, LoginSubmitButton } from "./Cooldown";

export const metadata = { title: "چوونەژوورەوەی بەڕێوەبردن — ئەمنە سورەکە" };

/**
 * Seconds from now until `until` (unix seconds, set by signIn when a login
 * is throttled). Display only — capped at the longest throttle (an hour)
 * so a hand-edited URL can't show a silly countdown; null if absent.
 */
function secondsUntil(until: string | undefined): number | null {
  const target = Number(until);
  if (!until || !Number.isFinite(target)) return null;
  return Math.min(3600, Math.max(0, Math.ceil(target - Date.now() / 1000)));
}

export default async function AdminLoginPage(
  props: {
    searchParams: Promise<{ error?: string; next?: string; until?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const hasWrongPasswordError = searchParams.error === "1";
  const hasRateLimitError = searchParams.error === "2";
  const cooldownSeconds = hasRateLimitError ? secondsUntil(searchParams.until) : null;
  const next = searchParams.next ?? "/admin";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-100 px-6 py-16">
      <BrandLockup size="lg" />
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-10 shadow-soft">
        <h1 className="text-center font-kurdish text-fluid-xl font-semibold text-ink">چوونەژوورەوە</h1>

        {hasWrongPasswordError && (
          <p className="mt-4 rounded-lg bg-pigment-crimson/10 px-3 py-2 text-fluid-xs text-pigment-crimson">
            ئیمەیل یان وشەی نهێنی هەڵەیە.
          </p>
        )}
        {hasRateLimitError && <CooldownNotice key={searchParams.until} seconds={cooldownSeconds} />}

        <form action={signIn} className="mt-8 flex flex-col gap-5">
          <input type="hidden" name="next" value={next} />
          <Field label="ئیمەیل" name="email" type="email" required dir="ltr" />
          <label className="flex flex-col gap-1.5">
            <span className="text-fluid-xs font-medium text-ink-soft">وشەی نهێنی</span>
            <PasswordField />
          </label>
          <LoginSubmitButton key={searchParams.until} cooldownSeconds={cooldownSeconds ?? 0} />
        </form>
      </div>
    </div>
  );
}
