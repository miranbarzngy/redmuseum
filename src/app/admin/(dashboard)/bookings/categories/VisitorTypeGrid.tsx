"use client";

import { useId, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { GripVertical, Plus } from "lucide-react";
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
import { EditLink } from "../../../_components/EditLink";
import { DeleteButton } from "../../../_components/DeleteButton";
import { deleteVisitorType, reorderVisitorTypes } from "./actions";
import type { BookingVisitorTypeRow } from "@/lib/supabase/database.types";

const HANDLE_LABEL = "گواستنەوە";
const confirmFor = (c: BookingVisitorTypeRow) =>
  `سڕینەوەی جۆری «${c.label_ku}»؟ ئەگەر سەردانی پەیوەستی هەبێت ناتوانرێت بسڕدرێتەوە.`;

function VisitorTypeCard({ category }: { category: BookingVisitorTypeRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "relative flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center shadow-card",
        isDragging && "relative z-10 opacity-90 shadow-soft"
      )}
    >
      <button
        type="button"
        aria-label={HANDLE_LABEL}
        {...attributes}
        {...listeners}
        className="absolute end-2 top-2 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={15} />
      </button>

      <span dir="ltr" className="rounded-full bg-canvas-paper px-3 py-1 text-fluid-xs text-ink-faint">
        {category.slug}
      </span>

      <Link
        href={`/admin/bookings/categories/${category.id}`}
        className="w-full truncate font-medium text-ink transition-colors hover:text-pigment-terracotta"
      >
        {category.label_ku}
      </Link>

      <div className="mt-2 flex items-start justify-center gap-3">
        <EditLink href={`/admin/bookings/categories/${category.id}`} showLabel />
        <DeleteButton
          action={deleteVisitorType.bind(null, category.id)}
          confirmMessage={confirmFor(category)}
          showLabel
        />
      </div>
    </div>
  );
}

function AddVisitorTypeTile() {
  return (
    <Link
      href="/admin/bookings/categories/new"
      className="group flex h-full min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/25 bg-canvas-paper/60 p-6 text-center text-ink-soft transition hover:border-ink/45 hover:bg-canvas-paper"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
        <Plus size={18} />
      </span>
      <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">زیادکردنی جۆر</span>
    </Link>
  );
}

/** Grid of booking visit-type cards — slug, title, edit/delete actions —
 * with drag-to-reorder (persisted via reorderVisitorTypes) and a trailing
 * "+" tile to add a new type. Mirrors gallery-categories/CategoryGrid,
 * since these categories carry no cover photo either. */
export function VisitorTypeGrid({ categories }: { categories: BookingVisitorTypeRow[] }) {
  const [ordered, setOrdered] = useState(categories);
  // Re-sync when the server sends a fresh list (add / delete / revalidate),
  // using the sanctioned render-phase reconcile rather than an effect.
  const [seenCategories, setSeenCategories] = useState(categories);
  if (seenCategories !== categories) {
    setSeenCategories(categories);
    setOrdered(categories);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const baseId = useId();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((c) => c.id === active.id);
    const newIndex = ordered.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    reorderVisitorTypes(next.map((c) => c.id));
  }

  const ids = ordered.map((c) => c.id);

  return (
    <DndContext id={baseId} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((category) => (
            <VisitorTypeCard key={category.id} category={category} />
          ))}
          <AddVisitorTypeTile />
        </div>
      </SortableContext>
    </DndContext>
  );
}
