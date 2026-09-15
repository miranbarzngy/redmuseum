"use client";

import { useRef, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import clsx from "clsx";
import { fieldControlClass } from "../../_components/Field";
import { btnSecondary } from "../../_components/Button";

/** Plain date/select inputs plus a free-text search box, following
 * FilterTabs' URL-searchParam idiom — more fields than a segmented control
 * fits. Date/select inputs re-submit immediately on change; the text field
 * only applies on Enter/submit so typing doesn't navigate per keystroke. */
export function AuditLogFilters({
  users,
  actions,
}: {
  users: { id: string; email: string }[];
  actions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) next.set(key, value);
    }
    router.push(next.size > 0 ? `${pathname}?${next.toString()}` : pathname);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-card"
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">لە بەرواری</span>
        <input
          type="date"
          name="from"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className={fieldControlClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">بۆ بەرواری</span>
        <input
          type="date"
          name="to"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className={fieldControlClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">بەکارهێنەر</span>
        <select
          name="user"
          defaultValue={searchParams.get("user") ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className={fieldControlClass}
        >
          <option value="">هەموو</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">کردار</span>
        <select
          name="action"
          defaultValue={searchParams.get("action") ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className={fieldControlClass}
        >
          <option value="">هەموو</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">گەڕان</span>
        <div className="relative">
          <input
            type="text"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="ئامانج یان ناسنامە..."
            dir="ltr"
            className={clsx(fieldControlClass, "ps-9")}
          />
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        </div>
      </label>
      <button type="submit" className={btnSecondary}>
        گەڕان
      </button>
    </form>
  );
}
