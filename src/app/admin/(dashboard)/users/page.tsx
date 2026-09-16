import { Users } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "../../_components/PageHeader";
import { Panel } from "../../_components/Panel";
import { EmptyState } from "../../_components/EmptyState";
import { UserGrid } from "./UserGrid";
import { UserFormModal } from "./UserFormModal";
import { RoleGrid } from "./RoleGrid";
import { RoleModal } from "./RoleModal";
import type { AdminRoleRow, AdminUserRow } from "@/lib/supabase/database.types";

// database.types.ts is hand-written with no Relationships metadata, so the
// joined select's shape is described locally (same pattern used throughout
// this admin panel — see gallery/page.tsx's GalleryRowWithCategory).
type UserRowWithRole = AdminUserRow & { role: AdminRoleRow | null };

export default async function AdminUsersPage() {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();

  const [{ data: users }, { data: roles }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("*, role:admin_roles(*)")
      .order("created_at", { ascending: true }),
    supabase.from("admin_roles").select("*").order("created_at", { ascending: true }),
  ]);

  const userRows = (users as UserRowWithRole[] | null) ?? [];
  const roleRows = roles ?? [];

  return (
    <div className="flex flex-col gap-8 mb-24 lg:mb-0">
      <PageHeader
        title="بەکارهێنەران و ڕۆڵەکان"
        description="بەڕێوەبردنی هەژمارەکانی بەڕێوەبردن و دەسەڵاتەکانیان."
      />

      <Panel
        title="بەکارهێنەرانی بەڕێوەبردن"
        action={<UserFormModal roles={roleRows} />}
      >
        {userRows.length === 0 ? (
          <EmptyState icon={Users} title="هێشتا هیچ بەکارهێنەرێک نییە" />
        ) : (
          <UserGrid users={userRows} roles={roleRows} currentUserId={session.id} />
        )}
      </Panel>

      <Panel title="ڕۆڵەکان" description="هەر ڕۆڵێک کۆمەڵێک دەسەڵاتی تایبەت بەخۆیەوەیە." action={<RoleModal />} collapsible>
        <RoleGrid roles={roleRows} />
      </Panel>
    </div>
  );
}
