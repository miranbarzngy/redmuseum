import { Plus, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/PageHeader";
import { EmptyState } from "../../../_components/EmptyState";
import { LinkButton } from "../../../_components/Button";
import { BookingsTabs } from "../BookingsTabs";
import { VisitorTypeGrid } from "./VisitorTypeGrid";

export default async function AdminBookingVisitorTypesPage() {
  const supabase = createClient();
  const { data: categories, error } = await supabase
    .from("booking_visitor_types")
    .select("*")
    .order("sort_order", { ascending: true });

  const hasRows = (categories?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8 mb-24 lg:mb-0">
      <PageHeader
        title="جۆرەکانی سەردان"
        description="جۆرەکانی سەردان کە لە فۆرمی «سەردان»ی ماڵپەڕی گشتیدا هەڵدەبژێردرێن. بە ڕاکێشان ڕیزبەندی بگۆڕە."
      />

      <BookingsTabs />

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی جۆرەکان: {error.message}
        </p>
      )}

      {!error && !hasRows && (
        <EmptyState icon={Tags} title="هێشتا هیچ جۆرێک نییە">
          <LinkButton href="/admin/bookings/categories/new">
            <Plus size={16} /> زیادکردنی یەکەم جۆر
          </LinkButton>
        </EmptyState>
      )}

      {!error && hasRows && <VisitorTypeGrid categories={categories!} />}
    </div>
  );
}
