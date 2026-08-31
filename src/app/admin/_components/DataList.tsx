import clsx from "clsx";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
};

function alignClass(align: Column<unknown>["align"]) {
  return align === "end" ? "text-end" : align === "center" ? "text-center" : "text-start";
}

/**
 * Hybrid list: a real <table> from `md` up, stacked `renderCard` blocks
 * below. Callers compose their own links inside cells / cards — the row
 * isn't implicitly clickable (booking rows carry an interactive select).
 */
export function DataList<T>({
  rows,
  columns,
  rowKey,
  renderCard,
  rowClassName,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  renderCard: (row: T) => React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-card md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={clsx(
                    "font-kurdish px-4 py-3 text-fluid-xs font-medium text-ink-faint",
                    alignClass(c.align),
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={clsx(
                  "border-b border-ink/5 transition-colors last:border-0 hover:bg-canvas-paper/50",
                  rowClassName?.(row)
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      "px-4 py-3 align-middle text-fluid-sm text-ink",
                      alignClass(c.align),
                      c.className
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)}>{renderCard(row)}</div>
        ))}
      </div>
    </>
  );
}
