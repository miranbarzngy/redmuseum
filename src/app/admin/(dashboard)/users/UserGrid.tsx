"use client";

import { useTransition } from "react";
import { StatusBadge } from "../../_components/StatusBadge";
import { Toggle } from "../../_components/Toggle";
import { formatMessageDate } from "../messages/formatMessageDate";
import { UserFormModal } from "./UserFormModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { setUserActive } from "./actions";
import type { AdminRoleRow, AdminUserRow } from "@/lib/supabase/database.types";

type Row = AdminUserRow & { role: AdminRoleRow | null };

function ActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Toggle
      checked={isActive}
      disabled={pending}
      onChange={(checked) => startTransition(() => setUserActive(userId, checked))}
    />
  );
}

/** Non-sortable card list of admin accounts — users have no manual order,
 * same plain-.map() pattern as MessageGrid. */
export function UserGrid({
  users,
  roles,
  currentUserId,
}: {
  users: Row[];
  roles: AdminRoleRow[];
  currentUserId: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UserFormModal roles={roles} variant="tile" />
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-col gap-3 rounded-2xl border border-pigment-crimson/40 bg-white p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-kurdish truncate font-semibold text-ink">{user.full_name}</p>
              <p dir="ltr" className="truncate text-fluid-xs text-ink-faint">
                {user.email}
              </p>
            </div>
            {user.is_active ? (
              <StatusBadge tone="positive">چالاک</StatusBadge>
            ) : (
              <StatusBadge tone="muted">ناچالاک</StatusBadge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone="accent">{user.role?.name ?? "—"}</StatusBadge>
          </div>

          <p className="font-kurdish text-fluid-xs text-ink-faint">
            دوا چوونەژوورەوە:{" "}
            {user.last_login ? <span dir="ltr">{formatMessageDate(user.last_login)}</span> : "—"}
          </p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <UserFormModal roles={roles} user={user} />
              <ResetPasswordModal userId={user.id} userName={user.full_name} />
            </div>
            {user.id !== currentUserId && <ActiveToggle userId={user.id} isActive={user.is_active} />}
          </div>
        </div>
      ))}
    </div>
  );
}
