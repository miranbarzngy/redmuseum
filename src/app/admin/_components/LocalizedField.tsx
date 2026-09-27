"use client";

import { flushSync } from "react-dom";
import clsx from "clsx";
import { fieldControlClass } from "./Field";
import { ADMIN_LANGS, useLanguage } from "./LanguageTabs";

interface LocalizedFieldProps {
  name: string;
  label: string;
  defaults?: { ku?: string; en?: string; ar?: string };
  multiline?: boolean;
  required?: boolean;
  /** Lets the admin drag-resize the textarea. Off by default. */
  resizable?: boolean;
  hint?: string;
}

/**
 * Three inputs (ku/en/ar) sharing one `name` prefix — submitted as
 * `${name}_ku`, `${name}_en`, `${name}_ar`, matching the *_ku/*_en/*_ar
 * column naming used across every content table.
 *
 * Inside a <LanguageProvider> (with a <LanguageTabs> switch) only the active
 * language shows; the other two stay mounted but `hidden`, so the submitted
 * FormData is unchanged. With no provider it falls back to the old stacked
 * layout with per-language labels.
 *
 * `required` applies to Kurdish only — en/ar are optional overrides
 * everywhere (blank falls back to the site default).
 */
export function LocalizedField({
  name,
  label,
  defaults,
  multiline,
  required,
  resizable,
  hint,
}: LocalizedFieldProps) {
  const ctx = useLanguage();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-kurdish text-fluid-xs font-medium text-ink-soft">{label}</legend>
      {ADMIN_LANGS.map((lang) => {
        const fieldName = `${name}_${lang.code}`;
        const defaultValue = defaults?.[lang.code] ?? "";
        const hidden = ctx ? ctx.active !== lang.code : false;
        const isRequired = Boolean(required) && lang.code === "ku";
        // A `required` + `display:none` control can't be focused, so the
        // browser would block the submit with no visible message. When the
        // empty Kurdish field is hidden behind the en/ar tab, switch back to
        // ku synchronously inside the `invalid` event — browsers re-check
        // focusability after invalid listeners run, so the native "fill out
        // this field" bubble then shows on it.
        const onInvalid =
          isRequired && hidden && ctx ? () => flushSync(() => ctx.setActive("ku")) : undefined;
        return (
          <label
            key={lang.code}
            className={clsx(hidden ? "hidden" : "flex flex-col gap-1.5")}
          >
            {!ctx && <span className="text-fluid-xs text-ink-faint">{lang.label}</span>}
            {multiline ? (
              <textarea
                name={fieldName}
                dir={lang.dir}
                required={isRequired}
                onInvalid={onInvalid}
                defaultValue={defaultValue}
                rows={3}
                className={clsx(fieldControlClass, resizable ? "resize-y" : "resize-none")}
              />
            ) : (
              <input
                name={fieldName}
                dir={lang.dir}
                required={isRequired}
                onInvalid={onInvalid}
                defaultValue={defaultValue}
                className={fieldControlClass}
              />
            )}
          </label>
        );
      })}
      {hint && <span className="font-kurdish text-fluid-xs text-ink-faint">{hint}</span>}
    </fieldset>
  );
}
