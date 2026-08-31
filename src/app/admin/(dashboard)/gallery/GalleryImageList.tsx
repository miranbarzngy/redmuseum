"use client";

import Link from "next/link";
import { DataList, type Column } from "../../_components/DataList";
import { SortableDataList } from "../../_components/SortableDataList";
import { RowCard, Thumb } from "../../_components/RowCard";
import { StatusBadge } from "../../_components/StatusBadge";
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteGalleryImage, reorderGalleryImages } from "./actions";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";

type Row = GalleryRow & { category: GalleryCategoryRow | null };

const CONFIRM = "سڕینەوەی ئەم وێنەیە؟ ناتوانرێت هەڵبوەشێندرێتەوە.";

function stateBadge(g: Row) {
  return g.is_active ? (
    <StatusBadge tone="positive">چالاک</StatusBadge>
  ) : (
    <StatusBadge tone="muted">ناچالاک</StatusBadge>
  );
}

/** `draggable` is only true when the list is scoped to one category —
 * display_order is per-category, so reordering a mixed list is meaningless. */
export function GalleryImageList({ items, draggable }: { items: Row[]; draggable: boolean }) {
  const columns: Column<Row>[] = [
    {
      key: "thumb",
      header: "وێنە",
      className: "w-24",
      cell: (g) => <Thumb src={g.image_url} className="aspect-video h-12" rounded="rounded-lg" />,
    },
    {
      key: "title",
      header: "ناونیشان",
      cell: (g) => (
        <Link
          href={`/admin/gallery/${g.id}`}
          className="font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {g.title || "—"}
        </Link>
      ),
    },
    {
      key: "category",
      header: "پۆل",
      className: "w-40",
      cell: (g) => <span className="text-fluid-xs text-ink-soft">{g.category?.label_ku ?? "—"}</span>,
    },
    {
      key: "state",
      header: "دۆخ",
      align: "center",
      className: "w-24",
      cell: stateBadge,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      className: "w-28",
      cell: (g) => (
        <div className="flex items-center justify-end gap-1.5">
          <EditLink href={`/admin/gallery/${g.id}`} />
          <DeleteButton action={deleteGalleryImage.bind(null, g.id)} confirmMessage={CONFIRM} />
        </div>
      ),
    },
  ];

  const card = (g: Row, handle?: React.ReactNode) => (
    <RowCard
      leading={
        <div className="flex items-center gap-2">
          {handle}
          <Thumb src={g.image_url} className="aspect-video h-12" rounded="rounded-lg" />
        </div>
      }
      title={<Link href={`/admin/gallery/${g.id}`}>{g.title || "—"}</Link>}
      meta={g.category?.label_ku ?? "—"}
      badges={stateBadge(g)}
      actions={
        <>
          <EditLink href={`/admin/gallery/${g.id}`} />
          <DeleteButton action={deleteGalleryImage.bind(null, g.id)} confirmMessage={CONFIRM} />
        </>
      }
    />
  );

  if (!draggable) {
    return <DataList rows={items} columns={columns} rowKey={(g) => g.id} renderCard={(g) => card(g)} />;
  }

  return (
    <SortableDataList
      rows={items}
      columns={columns}
      rowKey={(g) => g.id}
      onReorder={(ids) => reorderGalleryImages(ids)}
      renderCard={(g, handle) => card(g, handle)}
    />
  );
}
