import clsx from "clsx";

export const fieldControlClass =
  "w-full rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15 disabled:cursor-not-allowed disabled:opacity-60";

type CommonProps = {
  label: string;
  name?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string | number;
  dir?: "rtl" | "ltr";
  /** class for the wrapping <label> */
  className?: string;
};

type InputFieldProps = CommonProps & {
  type?: "text" | "number";
  placeholder?: string;
  multiline?: false;
  select?: false;
};

type TextareaFieldProps = CommonProps & {
  multiline: true;
  rows?: number;
  resizable?: boolean;
  placeholder?: string;
};

type SelectFieldProps = CommonProps & {
  select: true;
  children: React.ReactNode;
};

export type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

/** One labelled control — text / number / textarea / select — with an
 * optional hint line. Replaces the repeated
 * `<label class="flex flex-col gap-1.5"><span/><input .../></label>` blocks. */
export function Field(props: FieldProps) {
  const { label, name, hint, required, disabled, defaultValue, dir, className } = props;

  return (
    <label className={clsx("flex flex-col gap-1.5", className)}>
      <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-pigment-crimson"> *</span>}
      </span>

      {"select" in props && props.select ? (
        <select
          name={name}
          required={required}
          disabled={disabled}
          defaultValue={defaultValue}
          dir={dir}
          className={fieldControlClass}
        >
          {props.children}
        </select>
      ) : "multiline" in props && props.multiline ? (
        <textarea
          name={name}
          required={required}
          disabled={disabled}
          defaultValue={defaultValue}
          dir={dir}
          rows={props.rows ?? 3}
          placeholder={props.placeholder}
          className={clsx(fieldControlClass, props.resizable ? "resize-y" : "resize-none")}
        />
      ) : (
        <input
          type={props.type ?? "text"}
          name={name}
          required={required}
          disabled={disabled}
          defaultValue={defaultValue}
          dir={dir}
          placeholder={props.placeholder}
          className={fieldControlClass}
        />
      )}

      {hint && <span className="font-kurdish text-fluid-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
