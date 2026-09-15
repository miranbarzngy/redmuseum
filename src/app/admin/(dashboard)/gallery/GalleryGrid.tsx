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
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { StatusBadge } from "../../_components/StatusBadge";
import { deleteGalleryImage, reorderGalleryImages } from "./actions";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";

type Row = GalleryRow & { category: GalleryCategoryRow | null };

const HANDLE_LABEL = "گواستنەوە";
const CONFIRM = "سڕینەوەی ئەم وێنەیە؟ ناتوانرێت هەڵبوەشێندرێتەوە.";

function stateBadge(g: Row) {
  return g.is_active ? (
    <StatusBadge tone="positive">چالاک</StatusBadge>
  ) : (
    <StatusBadge tone="muted">ناچالاک</StatusBadge>
  );
}

function GalleryCardBody({ item, handle }: { item: Row; handle?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-pigment-crimson/40 bg-white shadow-card">
      <div className="relative h-40 w-full shrink-0 bg-canvas-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt="" className="block h-full w-full object-cover" />
        {handle}
      </div>

      <div className="flex flex-col items-center gap-2 p-5 text-center">
        <Link
          href={`/admin/gallery/${item.id}`}
          className="w-full truncate font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {item.title || "—"}
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <StatusBadge tone="accent">{item.category?.label_ku ?? "—"}</StatusBadge>
          {stateBadge(item)}
        </div>

        <div className="mt-1 flex items-center justify-center gap-1.5">
          <EditLink href={`/admin/gallery/${item.id}`} />
          <DeleteButton action={deleteGalleryImage.bind(null, item.id)} confirmMessage={CONFIRM} />
        </div>
      </div>
    </div>
  );
}

function SortableGalleryCard({ item }: { item: Row }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const handle = (
    <button
      type="button"
      aria-label={HANDLE_LABEL}
      {...attributes}
      {...listeners}
      className="absolute end-2 top-2 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-full bg-white/90 text-ink-faint shadow-card backdrop-blur transition-colors hover:text-ink active:cursor-grabbing"
    >
      <GripVertical size={15} />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx("h-full", isDragging && "relative z-10 opacity-90")}
    >
      <GalleryCardBody item={item} handle={handle} />
    </div>
  );
}

function AddImageTile() {
  return (
    <Link
      href="/admin/gallery/new"
      className="group flex h-full min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pigment-crimson/40 bg-canvas-paper/60 p-6 text-center text-ink-soft transition hover:border-pigment-crimson/70 hover:bg-canvas-paper"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
        <Plus size={18} />
      </span>
      <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">زیادکردنی وێنە</span>
    </Link>
  );
}

/** Image-forward, one-per-row grid of gallery cards — cover photo, title,
 * category + active state badges, and edit/delete actions. `draggable` is
 * only true when the list is scoped to one category — display_order is
 * per-category, so reordering a mixed list is meaningless. */
export function GalleryGrid({ items, draggable }: { items: Row[]; draggable: boolean }) {
  const [ordered, setOrdered] = useState(items);
  // Re-sync when the server sends a fresh list (add / delete / revalidate),
  // using the sanctioned render-phase reconcile rather than an effect.
  const [seenItems, setSeenItems] = useState(items);
  if (seenItems !== items) {
    setSeenItems(items);
    setOrdered(items);
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
    const oldIndex = ordered.findIndex((g) => g.id === active.id);
    const newIndex = ordered.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    reorderGalleryImages(next.map((g) => g.id));
  }

  if (!draggable) {
    return (
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        <AddImageTile />
        {ordered.map((item) => (
          <GalleryCardBody key={item.id} item={item} />
        ))}
      </div>
    );
  }

  const ids = ordered.map((g) => g.id);

  return (
    <DndContext id={baseId} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          <AddImageTile />
          {ordered.map((item) => (
            <SortableGalleryCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
