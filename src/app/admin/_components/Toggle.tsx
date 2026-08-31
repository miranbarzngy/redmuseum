"use client";

/**
 * A switch that is really a checkbox <input>, so inside a plain <form> it
 * still submits `name=on` exactly like the bare checkbox it replaces.
 * Works controlled (checked + onChange) or uncontrolled (defaultChecked).
 */
export function Toggle({
  id,
  name,
  defaultChecked,
  checked,
  onChange,
  disabled,
}: {
  id?: string;
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        disabled={disabled}
        className="peer h-full w-full cursor-pointer appearance-none rounded-full border border-ink/15 bg-canvas-paper transition-colors checked:border-pigment-terracotta checked:bg-pigment-terracotta disabled:cursor-not-allowed disabled:opacity-60"
      />
      {/* Off: knob at the start edge (right, in RTL). On: slides to the end. */}
      <span className="pointer-events-none absolute right-1 h-4 w-4 rounded-full bg-white shadow-card transition-transform peer-checked:-translate-x-5" />
    </span>
  );
}
