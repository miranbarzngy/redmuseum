"use client";

import Link from "next/link";
import { SortableDataList } from "../../_components/SortableDataList";
import type { Column } from "../../_components/DataList";
import { RowCard } from "../../_components/RowCard";
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteCategory, reorderCategories } from "./actions";
import type { GalleryCategoryRow } from "@/lib/supabase/database.types";

const confirmFor = (c: GalleryCategoryRow) =>
  `سڕینەوەی پۆلی «${c.label_ku}»؟ ئەگەر وێنەی پەیوەستی هەبێت ناتوانرێت بسڕدرێتەوە.`;

export function CategoryList({ categories }: { categories: GalleryCategoryRow[] }) {
  const columns: Column<GalleryCategoryRow>[] = [
    {
      key: "label",
      header: "ناونیشان",
      cell: (c) => (
        <Link
          href={`/admin/gallery-categories/${c.id}`}
          className="font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {c.label_ku}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "سلاگ",
      className: "w-48",
      cell: (c) => (
        <span dir="ltr" className="text-fluid-xs text-ink-faint">
          {c.slug}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      className: "w-28",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <EditLink href={`/admin/gallery-categories/${c.id}`} />
          <DeleteButton action={deleteCategory.bind(null, c.id)} confirmMessage={confirmFor(c)} />
        </div>
      ),
    },
  ];

  return (
    <SortableDataList
      rows={categories}
      columns={columns}
      rowKey={(c) => c.id}
      onReorder={(ids) => reorderCategories(ids)}
      renderCard={(c, handle) => (
        <RowCard
          leading={handle}
          title={<Link href={`/admin/gallery-categories/${c.id}`}>{c.label_ku}</Link>}
          meta={c.slug}
          actions={
            <>
              <EditLink href={`/admin/gallery-categories/${c.id}`} />
              <DeleteButton action={deleteCategory.bind(null, c.id)} confirmMessage={confirmFor(c)} />
            </>
          }
        />
      )}
    />
  );
}
