// Shared by the homepage contact section and the standalone /contact page —
// a small icon-badge + label + value card (phone, email, address, hours...).
// `aside` sits at the card's far end (the left in RTL), dropping to its own
// line when there isn't room beside the value.
export function InfoCard({
  icon,
  label,
  children,
  aside,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-card ${
        aside ? "flex-wrap" : ""
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#850B10]/10 text-[#850B10]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-fluid-xs uppercase tracking-[0.15em] text-ink-faint">{label}</div>
        <div className="mt-1 text-fluid-sm font-medium text-ink">{children}</div>
      </div>
      {aside && <div className="ms-auto shrink-0 self-center">{aside}</div>}
    </div>
  );
}
