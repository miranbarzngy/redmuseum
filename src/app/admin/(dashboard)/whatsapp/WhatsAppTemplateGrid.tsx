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
import { deleteWhatsAppTemplate, reorderWhatsAppTemplates } from "./actions";
import type { WhatsAppTemplateRow } from "@/lib/supabase/database.types";

const HANDLE_LABEL = "گواستنەوە";

function TemplateCard({ template, first }: { template: WhatsAppTemplateRow; first: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: template.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "relative flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5 shadow-card",
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

      <div className="flex min-w-0 flex-wrap items-center gap-2 pe-8">
        <Link
          href={`/admin/whatsapp/${template.id}`}
          className="min-w-0 truncate font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {template.title}
        </Link>
        {first && (
          <span className="font-kurdish shrink-0 rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            بنەڕەت
          </span>
        )}
      </div>

      {/* Padding on the wrapper, not the clamped <p> — otherwise the top of
          a sixth line peeks out through the bottom padding. */}
      <div className="rounded-xl bg-canvas-soft/40 px-3.5 py-2.5">
        <p className="font-kurdish line-clamp-5 whitespace-pre-line text-fluid-xs leading-relaxed text-ink-soft">
          {template.body}
        </p>
      </div>

      <div className="mt-auto flex items-start justify-center gap-3 pt-1">
        <EditLink href={`/admin/whatsapp/${template.id}`} showLabel />
        <DeleteButton
          action={deleteWhatsAppTemplate.bind(null, template.id)}
          confirmMessage={`سڕینەوەی پەیامی «${template.title}»؟`}
          showLabel
        />
      </div>
    </div>
  );
}

function AddTemplateTile() {
  return (
    <Link
      href="/admin/whatsapp/new"
      className="group flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/25 bg-canvas-paper/60 p-6 text-center text-ink-soft transition hover:border-ink/45 hover:bg-canvas-paper"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
        <Plus size={18} />
      </span>
      <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">زیادکردنی پەیام</span>
    </Link>
  );
}

/** Grid of WhatsApp message cards — title, text excerpt, edit/delete — with
 * drag-to-reorder (persisted via reorderWhatsAppTemplates) and a trailing
 * "+" tile. Mirrors bookings/categories/VisitorTypeGrid. The first card is
 * the one the bookings send sheet preselects, hence its «بنەڕەت» badge. */
export function WhatsAppTemplateGrid({ templates }: { templates: WhatsAppTemplateRow[] }) {
  const [ordered, setOrdered] = useState(templates);
  // Re-sync when the server sends a fresh list (add / delete / revalidate),
  // using the sanctioned render-phase reconcile rather than an effect.
  const [seenTemplates, setSeenTemplates] = useState(templates);
  if (seenTemplates !== templates) {
    setSeenTemplates(templates);
    setOrdered(templates);
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
    const oldIndex = ordered.findIndex((t) => t.id === active.id);
    const newIndex = ordered.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    reorderWhatsAppTemplates(next.map((t) => t.id));
  }

  return (
    <DndContext id={baseId} sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((template, i) => (
            <TemplateCard key={template.id} template={template} first={i === 0} />
          ))}
          <AddTemplateTile />
        </div>
      </SortableContext>
    </DndContext>
  );
}
