"use client";

import Link from "next/link";
import { SortableDataList } from "../../_components/SortableDataList";
import type { Column } from "../../_components/DataList";
import { RowCard } from "../../_components/RowCard";
import { StatusBadge } from "../../_components/StatusBadge";
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteExhibition, reorderExhibitions } from "./actions";
import type { ExhibitionRow } from "@/lib/supabase/database.types";

const confirmFor = (ex: ExhibitionRow) => `سڕینەوەی ڕووداوی «${ex.title_ku}»؟`;

export function ExhibitionList({ exhibitions }: { exhibitions: ExhibitionRow[] }) {
  const columns: Column<ExhibitionRow>[] = [
    {
      key: "title",
      header: "ناونیشان",
      cell: (ex) => (
        <Link
          href={`/admin/museumhistory/${ex.id}`}
          className="font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {ex.title_ku}
        </Link>
      ),
    },
    {
      key: "year",
      header: "ساڵ",
      className: "w-32",
      cell: (ex) => (
        <span dir="rtl" className="text-fluid-xs text-ink-soft">
          {ex.year}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      className: "w-28",
      cell: (ex) => (
        <div className="flex items-center justify-end gap-1.5">
          <EditLink href={`/admin/museumhistory/${ex.id}`} />
          <DeleteButton action={deleteExhibition.bind(null, ex.id)} confirmMessage={confirmFor(ex)} />
        </div>
      ),
    },
  ];

  return (
    <SortableDataList
      rows={exhibitions}
      columns={columns}
      rowKey={(ex) => ex.id}
      onReorder={(ids) => reorderExhibitions(ids)}
      renderCard={(ex, handle) => (
        <RowCard
          leading={handle}
          title={<Link href={`/admin/museumhistory/${ex.id}`}>{ex.title_ku}</Link>}
          badges={<StatusBadge tone="muted">{ex.year}</StatusBadge>}
          actions={
            <>
              <EditLink href={`/admin/museumhistory/${ex.id}`} />
              <DeleteButton action={deleteExhibition.bind(null, ex.id)} confirmMessage={confirmFor(ex)} />
            </>
          }
        />
      )}
    />
  );
}
