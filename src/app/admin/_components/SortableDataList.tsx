"use client";

import { useId, useState } from "react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Column } from "./DataList";

const HANDLE_LABEL = "گواستنەوە";

function alignClass(align: Column<unknown>["align"]) {
  return align === "end" ? "text-end" : align === "center" ? "text-center" : "text-start";
}

// Pointer covers mouse + most touch; the small distance threshold keeps a
// plain tap from registering as a drag. TouchSensor is the explicit fallback
// for quirky mobile browsers. (Mirrors the config in the old GalleryImageList.)
function useReorderSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

function SortableRow<T>({ id, row, columns }: { id: string; row: T; columns: Column<T>[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "border-b border-ink/5 last:border-0 hover:bg-canvas-paper/50",
        isDragging && "relative z-10 bg-white opacity-90 shadow-soft"
      )}
    >
      <td className="w-10 px-2 py-3 align-middle">
        <button
          type="button"
          aria-label={HANDLE_LABEL}
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
      </td>
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
  );
}

function SortableCard<T>({
  id,
  row,
  renderCard,
}: {
  id: string;
  row: T;
  renderCard: (row: T, handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      aria-label={HANDLE_LABEL}
      {...attributes}
      {...listeners}
      className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink active:cursor-grabbing"
    >
      <GripVertical size={16} />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(isDragging && "relative z-10 opacity-90")}
    >
      {renderCard(row, handle)}
    </div>
  );
}

/**
 * Drag-to-reorder list, hybrid like DataList (table on `md+`, cards below).
 * Desktop and mobile each get their own DndContext so the shared row ids
 * don't collide. `onReorder` receives the full id list in the new order —
 * hand it a server action that writes `index` as sort_order.
 */
export function SortableDataList<T>({
  rows,
  columns,
  rowKey,
  renderCard,
  onReorder,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  renderCard: (row: T, handle: React.ReactNode) => React.ReactNode;
  onReorder: (orderedIds: string[]) => void | Promise<unknown>;
}) {
  const [ordered, setOrdered] = useState(rows);
  // Re-sync when the server sends a fresh list (add / delete / revalidate),
  // using the sanctioned render-phase reconcile rather than an effect.
  const [seenRows, setSeenRows] = useState(rows);
  if (seenRows !== rows) {
    setSeenRows(rows);
    setOrdered(rows);
  }

  const sensors = useReorderSensors();

  // Stable, SSR-consistent ids for the two DndContexts — without these,
  // dnd-kit's internal counter numbers the `aria-describedby` announcer ids
  // differently on server vs client and hydration mismatches.
  const baseId = useId();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((r) => rowKey(r) === active.id);
    const newIndex = ordered.findIndex((r) => rowKey(r) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    onReorder(next.map(rowKey));
  }

  const ids = ordered.map(rowKey);

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-card md:block">
        <DndContext id={`${baseId}-table`} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="w-10 px-2 py-3" aria-hidden />
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
                {ordered.map((row) => (
                  <SortableRow key={rowKey(row)} id={rowKey(row)} row={row} columns={columns} />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <DndContext id={`${baseId}-cards`} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {ordered.map((row) => (
              <SortableCard key={rowKey(row)} id={rowKey(row)} row={row} renderCard={renderCard} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}
