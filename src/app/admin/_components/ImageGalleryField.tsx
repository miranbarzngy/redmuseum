"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { GripVertical } from "lucide-react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NEW_IMAGE_SLOT } from "@/lib/galleryUploadSlot";
import { AddPhotoTile } from "./ImageField";
import { ConfirmDialog } from "./ConfirmDialog";
import { useReorderSensors } from "./SortableDataList";

const REMOVE_CONFIRM = "سڕینەوەی ئەم وێنەیە؟ ناتوانرێت هەڵبوەشێندرێتەوە.";
const HANDLE_LABEL = "گواستنەوە";

type GalleryItem = {
  id: string;
  /** Saved URL, or a blob: preview of a newly picked file. */
  src: string;
  /** Position in the file input's FileList — only set for new picks. */
  fileIndex?: number;
};

function SortablePhoto({
  item,
  keptName,
  previewClassName,
  onRemove,
}: {
  item: GalleryItem;
  keptName: string;
  previewClassName: string;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const isNew = item.fileIndex !== undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx("relative", isDragging && "z-10 opacity-90")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt=""
        draggable={false}
        className={clsx(
          "rounded-xl border bg-canvas-paper",
          isNew ? "border-dashed border-ink/20" : "border-ink/10",
          isDragging && "shadow-soft",
          previewClassName
        )}
      />
      {/* Rendered in display order, so the posted list follows the drag
          order; a new pick posts a stand-in the server swaps for its URL. */}
      <input
        type="hidden"
        name={keptName}
        value={isNew ? `${NEW_IMAGE_SLOT}${item.fileIndex}` : item.src}
      />
      {/* Only the handle starts a drag (and only it is touch-action: none),
          so a swipe across the grid still scrolls the page on a phone. The
          `before:` inset widens its hit area to a comfortable touch target. */}
      <button
        type="button"
        aria-label={HANDLE_LABEL}
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1.5 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-card backdrop-blur transition-colors before:absolute before:-inset-2 hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="سڕینەوە"
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-fluid-xs text-canvas shadow-card"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** Multi-image: a leading "+" tile whose `multiple` file input previews new
 * selections alongside, plus the kept photos (each removable). Every photo —
 * kept or newly picked — can be dragged into a new order by its grip handle;
 * the order posts as hidden `keptName` inputs, resolved server-side by
 * resolveGalleryImageUrls. Matches the museum-block and hero-gallery inputs.
 *
 * `previewClassName` sets the size/fit of each thumbnail — and of the tile —
 * default is a cropped square; pass an `aspect-video … object-contain` value
 * to show whole 16:9 images. */
export function ImageGalleryField({
  label,
  name,
  keptName,
  currentUrls,
  hint,
  fileLabel = "زیادکردنی وێنە",
  previewClassName = "h-28 w-28 object-cover",
}: {
  label: string;
  name: string;
  keptName: string;
  currentUrls: string[];
  hint?: string;
  fileLabel?: string;
  previewClassName?: string;
}) {
  const [items, setItems] = useState<GalleryItem[]>(() =>
    currentUrls.map((url, i) => ({ id: `saved-${i}`, src: url }))
  );
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const sensors = useReorderSensors();
  // SSR-stable id for dnd-kit's aria-describedby announcer (see SortableDataList).
  const dndId = useId();

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((item) => item.id === active.id);
      const to = prev.findIndex((item) => item.id === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-kurdish mb-4 text-fluid-xs font-medium text-ink-soft">{label}</legend>

      <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-3">
            {/* Leading tile stays at a stable position (and outside the
                sortable items), so its `multiple` input keeps a pending
                selection even as previews render and move after it. */}
            <AddPhotoTile
              name={name}
              multiple
              caption={fileLabel}
              sizeClassName={previewClassName}
              onChange={(e) => {
                // A new pick replaces the input's whole FileList, so the
                // previous picks' previews go and the new ones join the end.
                const picked = Array.from(e.target.files ?? []).map((file, i) => {
                  const src = URL.createObjectURL(file);
                  return { id: src, src, fileIndex: i };
                });
                setItems((prev) => [...prev.filter((item) => item.fileIndex === undefined), ...picked]);
              }}
            />

            {items.map((item) => (
              <SortablePhoto
                key={item.id}
                item={item}
                keptName={keptName}
                previewClassName={previewClassName}
                onRemove={item.fileIndex === undefined ? () => setPendingRemove(item.id) : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hint && <p className="font-kurdish text-fluid-xs text-ink-faint">{hint}</p>}

      <ConfirmDialog
        open={pendingRemove !== null}
        message={REMOVE_CONFIRM}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          setItems((prev) => prev.filter((item) => item.id !== pendingRemove));
          setPendingRemove(null);
        }}
      />
    </fieldset>
  );
}
