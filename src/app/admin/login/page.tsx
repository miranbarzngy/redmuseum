import { signIn } from "./actions";
import { PasswordField } from "./PasswordField";
import { Field } from "../_components/Field";
import { BrandLockup } from "@/components/BrandLockup";

export const metadata = { title: "چوونەژوورەوەی بەڕێوەبردن — ئەمنە سورەکە" };

export default async function AdminLoginPage(
  props: {
    searchParams: Promise<{ error?: string; next?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const hasWrongPasswordError = searchParams.error === "1";
  const hasRateLimitError = searchParams.error === "2";
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
        {hasRateLimitError && (
          <p className="mt-4 rounded-lg bg-pigment-crimson/10 px-3 py-2 text-fluid-xs text-pigment-crimson">
            تکایە کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدەوە (هەوڵێک لە خولەکێکدا، و دوای 5 هەوڵی هەڵە بۆ 15 خولەک ڕادەگیرێت).
          </p>
        )}

        <form action={signIn} className="mt-8 flex flex-col gap-5">
          <input type="hidden" name="next" value={next} />
          <Field label="ئیمەیل" name="email" type="email" required dir="ltr" />
          <label className="flex flex-col gap-1.5">
            <span className="text-fluid-xs font-medium text-ink-soft">وشەی نهێنی</span>
            <PasswordField />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-[#850B10] px-4 py-3.5 text-fluid-base font-medium text-canvas transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6a090d] hover:shadow-soft active:translate-y-0 active:scale-95"
          >
            چوونەژوورەوە
          </button>
        </form>
      </div>
    </div>
  );
}
