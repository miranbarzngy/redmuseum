"use client";

import { useId, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { GripVertical, ImageOff, Plus } from "lucide-react";
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
import { pickSectionTitle } from "@/lib/museumSectionTitle";
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteBiographyBlock, reorderBiographyBlocks } from "./actions";
import type { BiographyBlockRow } from "@/lib/supabase/database.types";

const CONFIRM = "ئەم بەشە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە.";
const HANDLE_LABEL = "گواستنەوە";

function titleNode(b: BiographyBlockRow) {
  const t = pickSectionTitle(b, "ku");
  return t || <span className="text-ink-faint">(هێشتا ناوی نەنراوە)</span>;
}

function SectionCard({ block }: { block: BiographyBlockRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card",
        isDragging && "relative z-10 opacity-90 shadow-soft"
      )}
    >
      <div className="relative h-40 w-full shrink-0 bg-canvas-paper">
        {block.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.image_url} alt="" className="block h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint">
            <ImageOff size={20} />
          </div>
        )}
        <button
          type="button"
          aria-label={HANDLE_LABEL}
          {...attributes}
          {...listeners}
          className="absolute end-2 top-2 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-full bg-white/90 text-ink-faint shadow-card backdrop-blur transition-colors hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-1 p-4 text-center">
        <Link
          href={`/admin/museums/blocks/${block.id}`}
          className="w-full truncate font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {titleNode(block)}
        </Link>
        <span className="text-fluid-xs text-ink-faint">
          {block.image_urls?.length ?? 0} وێنەی زیاتر
        </span>

        <div className="mt-3 flex items-start justify-center gap-3">
          <EditLink href={`/admin/museums/blocks/${block.id}`} showLabel />
          <DeleteButton
            action={deleteBiographyBlock.bind(null, block.id)}
            confirmMessage={CONFIRM}
            showLabel
          />
        </div>
      </div>
    </div>
  );
}

function AddSectionTile() {
  return (
    <Link
      href="/admin/museums/blocks/new"
      className="group flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/25 bg-canvas-paper/60 p-6 text-center text-ink-soft transition hover:border-ink/45 hover:bg-canvas-paper"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
        <Plus size={18} />
      </span>
      <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">زیادکردنی بەش</span>
    </Link>
  );
}

/** Image-forward grid of section cards — cover photo, title, photo count and
 * edit/delete actions, with drag-to-reorder (persisted via
 * reorderBiographyBlocks) and a trailing "+" tile to add a new section. */
export function SectionGrid({ blocks }: { blocks: BiographyBlockRow[] }) {
  const [ordered, setOrdered] = useState(blocks);
  // Re-sync when the server sends a fresh list (add / delete / revalidate),
  // using the sanctioned render-phase reconcile rather than an effect.
  const [seenBlocks, setSeenBlocks] = useState(blocks);
  if (seenBlocks !== blocks) {
    setSeenBlocks(blocks);
    setOrdered(blocks);
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
    const oldIndex = ordered.findIndex((b) => b.id === active.id);
    const newIndex = ordered.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    reorderBiographyBlocks(next.map((b) => b.id));
  }

  const ids = ordered.map((b) => b.id);

  return (
    <DndContext id={baseId} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((block) => (
            <SectionCard key={block.id} block={block} />
          ))}
          <AddSectionTile />
        </div>
      </SortableContext>
    </DndContext>
  );
}
