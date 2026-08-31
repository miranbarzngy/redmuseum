"use client";

import Link from "next/link";
import { pickSectionTitle } from "@/lib/museumSectionTitle";
import { SortableDataList } from "../../_components/SortableDataList";
import type { Column } from "../../_components/DataList";
import { RowCard, Thumb } from "../../_components/RowCard";
import { EditLink } from "../../_components/EditLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteBiographyBlock, reorderBiographyBlocks } from "./actions";
import type { BiographyBlockRow } from "@/lib/supabase/database.types";

const CONFIRM = "ئەم بەشە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە.";

function titleNode(b: BiographyBlockRow) {
  const t = pickSectionTitle(b, "ku");
  return t || <span className="text-ink-faint">(هێشتا ناوی نەنراوە)</span>;
}

export function SectionList({ blocks }: { blocks: BiographyBlockRow[] }) {
  const columns: Column<BiographyBlockRow>[] = [
    {
      key: "cover",
      header: "وێنە (١٦:٩)",
      className: "w-32",
      cell: (b) => (
        <Thumb src={b.image_url} className="aspect-video h-14" rounded="rounded-lg" fit="contain" />
      ),
    },
    {
      key: "title",
      header: "ناوی بەش",
      cell: (b) => (
        <Link
          href={`/admin/museums/blocks/${b.id}`}
          className="font-medium text-ink transition-colors hover:text-pigment-terracotta"
        >
          {titleNode(b)}
        </Link>
      ),
    },
    {
      key: "photos",
      header: "وێنەی زیاتر",
      align: "center",
      className: "w-28",
      cell: (b) => <span className="text-fluid-xs text-ink-faint">{b.image_urls?.length ?? 0}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      className: "w-28",
      cell: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <EditLink href={`/admin/museums/blocks/${b.id}`} />
          <DeleteButton action={deleteBiographyBlock.bind(null, b.id)} confirmMessage={CONFIRM} />
        </div>
      ),
    },
  ];

  return (
    <SortableDataList
      rows={blocks}
      columns={columns}
      rowKey={(b) => b.id}
      onReorder={(ids) => reorderBiographyBlocks(ids)}
      renderCard={(b, handle) => (
        <RowCard
          leading={
            <div className="flex items-center gap-2">
              {handle}
              <Thumb
                src={b.image_url}
                className="aspect-video h-12"
                rounded="rounded-lg"
                fit="contain"
              />
            </div>
          }
          title={<Link href={`/admin/museums/blocks/${b.id}`}>{titleNode(b)}</Link>}
          meta={`${b.image_urls?.length ?? 0} وێنەی زیاتر`}
          actions={
            <>
              <EditLink href={`/admin/museums/blocks/${b.id}`} />
              <DeleteButton action={deleteBiographyBlock.bind(null, b.id)} confirmMessage={CONFIRM} />
            </>
          }
        />
      )}
    />
  );
}
