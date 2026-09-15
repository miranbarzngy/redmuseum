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
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteExhibition, reorderExhibitions } from "./actions";
import type { ExhibitionRow } from "@/lib/supabase/database.types";

const HANDLE_LABEL = "گواستنەوە";
const confirmFor = (ex: ExhibitionRow) => `سڕینەوەی ڕووداوی «${ex.title_ku}»؟`;

function EventCard({ exhibition }: { exhibition: ExhibitionRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exhibition.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "relative flex flex-col items-center gap-2 rounded-2xl border border-pigment-crimson/40 bg-white p-5 text-center shadow-card",
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

      <span dir="rtl" className="rounded-full bg-canvas-paper px-3 py-1 text-fluid-xs font-medium text-ink-soft">
        {exhibition.year}
      </span>

      <Link
        href={`/admin/museumhistory/${exhibition.id}`}
        className="w-full truncate font-medium text-ink transition-colors hover:text-pigment-terracotta"
      >
        {exhibition.title_ku}
      </Link>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        <EditLink href={`/admin/museumhistory/${exhibition.id}`} />
        <DeleteButton action={deleteExhibition.bind(null, exhibition.id)} confirmMessage={confirmFor(exhibition)} />
      </div>
    </div>
  );
}

function AddEventTile() {
  return (
    <Link
      href="/admin/museumhistory/new"
      className="group flex h-full min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pigment-crimson/40 bg-canvas-paper/60 p-6 text-center text-ink-soft transition hover:border-pigment-crimson/70 hover:bg-canvas-paper"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
        <Plus size={18} />
      </span>
      <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">زیادکردنی ڕووداو</span>
    </Link>
  );
}

/** Grid of history-event cards — year, title, edit/delete actions — with
 * drag-to-reorder (persisted via reorderExhibitions) and a trailing "+" tile
 * to add a new event. Mirrors museums/SectionGrid, minus the cover photo
 * since exhibitions carry no image. */
export function EventGrid({ exhibitions }: { exhibitions: ExhibitionRow[] }) {
  const [ordered, setOrdered] = useState(exhibitions);
  // Re-sync when the server sends a fresh list (add / delete / revalidate),
  // using the sanctioned render-phase reconcile rather than an effect.
  const [seenExhibitions, setSeenExhibitions] = useState(exhibitions);
  if (seenExhibitions !== exhibitions) {
    setSeenExhibitions(exhibitions);
    setOrdered(exhibitions);
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
    const oldIndex = ordered.findIndex((ex) => ex.id === active.id);
    const newIndex = ordered.findIndex((ex) => ex.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    reorderExhibitions(next.map((ex) => ex.id));
  }

  const ids = ordered.map((ex) => ex.id);

  return (
    <DndContext id={baseId} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-5">
          {ordered.map((exhibition) => (
            <EventCard key={exhibition.id} exhibition={exhibition} />
          ))}
          <AddEventTile />
        </div>
      </SortableContext>
    </DndContext>
  );
}
