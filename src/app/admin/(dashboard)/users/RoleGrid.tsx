import { DeleteButton } from "../../_components/DeleteButton";
import { StatusBadge } from "../../_components/StatusBadge";
import { RoleModal } from "./RoleModal";
import { deleteRole } from "./actions";
import type { AdminRoleRow } from "@/lib/supabase/database.types";

const CONFIRM = "سڕینەوەی ئەم ڕۆڵە؟ ئەگەر هێشتا بەکارهێنەری هەبێت، سڕینەوەکە سەرکەوتوو نابێت.";

/** Non-sortable card list of admin_roles — roles have no manual order. */
export function RoleGrid({ roles }: { roles: AdminRoleRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RoleModal variant="tile" />
      {roles.map((role) => {
        const isSuperAdmin = role.permissions.includes("*");
        return (
          <div
            key={role.id}
            className="flex flex-col gap-3 rounded-2xl border border-pigment-crimson/40 bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-kurdish font-semibold text-ink">{role.name}</p>
              {isSuperAdmin && <StatusBadge tone="warning">هەموو دەسەڵات</StatusBadge>}
            </div>

            {!isSuperAdmin && (
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.length > 0 ? (
                  role.permissions.map((p) => (
                    <StatusBadge key={p} tone="accent">
                      {p}
                    </StatusBadge>
                  ))
                ) : (
                  <span className="font-kurdish text-fluid-xs text-ink-faint">هیچ دەسەڵاتێک نییە</span>
                )}
              </div>
            )}

            <div className="mt-1 flex items-center gap-1.5">
              <RoleModal role={role} />
              {!isSuperAdmin && <DeleteButton action={deleteRole.bind(null, role.id)} confirmMessage={CONFIRM} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
