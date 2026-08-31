import { SubmitButton } from "./SubmitButton";

/**
 * Sticky action bar for long forms — pins the save button to the bottom of
 * the viewport so it's always reachable without scrolling to the end.
 * Place it as the last child inside the <form> (so its <SubmitButton>'s
 * useFormStatus still sees the form), after the panels.
 */
export function SaveBar({
  children,
  label = "پاشەکەوتکردنی گۆڕانکارییەکان",
}: {
  children?: React.ReactNode;
  label?: string;
}) {
  return (
    <div
      className="sticky bottom-3 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-ink/10 bg-white/90 px-4 py-3 shadow-card backdrop-blur-md"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {children}
      <SubmitButton>{label}</SubmitButton>
    </div>
  );
}
