"use client";

/**
 * A switch that is really a checkbox <input>, so inside a plain <form> it
 * still submits `name=on` exactly like the bare checkbox it replaces.
 * Works controlled (checked + onChange) or uncontrolled (defaultChecked).
 *
 * Moves like a native switch: the knob springs across with a slight
 * overshoot, and while pressed it stretches toward the middle (iOS-style),
 * which is the visual stand-in for haptic feedback.
 */
export function Toggle({
  id,
  name,
  value,
  defaultChecked,
  checked,
  onChange,
  disabled,
}: {
  id?: string;
  name?: string;
  /** Submitted value when checked — e.g. distinguishing several same-`name`
   * checkboxes in a permission matrix. Native checkboxes default to "on". */
  value?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <span className="relative inline-flex h-[1.625rem] w-12 shrink-0 items-center">
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        disabled={disabled}
        className="peer h-full w-full cursor-pointer appearance-none rounded-full bg-ink/[0.13] shadow-[inset_0_1px_2px_rgba(28,27,25,0.12)] outline-none transition-colors duration-300 checked:bg-brand focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
      />
      {/* Off: knob at the start edge (right, in RTL). On: springs to the end.
          Pressed: 4px wider, growing toward the centre from either side. */}
      <span className="pointer-events-none absolute right-[3px] h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_rgba(28,27,25,0.2),0_0_0_0.5px_rgba(28,27,25,0.06)] transition-[transform,width] duration-300 ease-spring peer-checked:-translate-x-[22px] peer-active:w-6 peer-checked:peer-active:-translate-x-[18px] peer-disabled:shadow-none" />
    </span>
  );
}
