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
import { deleteCategory, reorderCategories } from "./actions";
import type { GalleryCategoryRow } from "@/lib/supabase/database.types";

function CategoryRow({ category }: { category: GalleryCategoryRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card ${
        isDragging ? "z-10 opacity-90 shadow-soft" : ""
      }`}
    >
      <button
        type="button"
        aria-label="گواستنەوە"
        {...attributes}
        {...listeners}
        className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-fluid-sm font-medium text-ink">{category.label_ku}</div>
        <div className="text-fluid-xs text-ink-faint">
          {category.slug} · ڕیزبەندی {category.sort_order}
        </div>
      </div>

      <Link
        href={`/admin/gallery-categories/${category.id}`}
        aria-label="دەستکاریکردن"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
      >
        <Pencil size={15} />
      </Link>
      <DeleteButton
        action={deleteCategory.bind(null, category.id)}
        confirmMessage={`سڕینەوەی پۆلی "${category.label_ku}"؟ ئەگەر وێنەی پەیوەستی هەبێت ناتوانرێت بسڕدرێتەوە.`}
      />
    </div>
  );
}

export function CategoryList({ categories }: { categories: GalleryCategoryRow[] }) {
  const [items, setItems] = useState(categories);

  // Pointer covers mouse + most touch browsers; a small drag distance
  // threshold keeps a plain tap on the handle from being read as a drag.
  // TouchSensor is kept as an explicit fallback (older/quirky mobile
  // browsers) with a short press-and-hold delay so a scroll gesture
  // starting on the handle doesn't get hijacked into a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorderCategories(next.map((c) => c.id));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {items.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
