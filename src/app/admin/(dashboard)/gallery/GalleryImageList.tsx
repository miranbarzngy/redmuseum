"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical, Pencil } from "lucide-react";
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
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteGalleryImage, reorderGalleryImages } from "./actions";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";

type GalleryRowWithCategory = GalleryRow & { category: GalleryCategoryRow | null };

function ImageRow({ item, draggable }: { item: GalleryRowWithCategory; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card ${
        isDragging ? "z-10 opacity-90 shadow-soft" : ""
      }`}
    >
      {draggable && (
        <button
          type="button"
          aria-label="گواستنەوە"
          {...attributes}
          {...listeners}
          className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      )}

      <div className="aspect-video h-16 shrink-0 overflow-hidden rounded-xl bg-canvas-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-fluid-sm font-medium text-ink">{item.title || "—"}</div>
        <div className="text-fluid-xs text-ink-faint">
          {item.category?.label_ku ?? "—"} · ڕیزبەندی {item.display_order}
          {!item.is_active && " · ناچالاک"}
        </div>
      </div>
      <Link
        href={`/admin/gallery/${item.id}`}
        aria-label="دەستکاریکردن"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
      >
        <Pencil size={15} />
      </Link>
      <DeleteButton
        action={deleteGalleryImage.bind(null, item.id)}
        confirmMessage="سڕینەوەی ئەم وێنەیە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
      />
    </div>
  );
}

/** `draggable` should only be true when the list is scoped to a single
 * category — display_order is per-category, so reordering a mixed "all
 * categories" list wouldn't mean anything coherent. */
export function GalleryImageList({
  items,
  draggable,
}: {
  items: GalleryRowWithCategory[];
  draggable: boolean;
}) {
  const [ordered, setOrdered] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex((i) => i.id === active.id);
    const newIndex = ordered.findIndex((i) => i.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    reorderGalleryImages(next.map((i) => i.id));
  }

  if (!draggable) {
    return (
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ImageRow key={item.id} item={item} draggable={false} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {ordered.map((item) => (
            <ImageRow key={item.id} item={item} draggable />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
