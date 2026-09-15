"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Modal } from "../../_components/Modal";
import { Field } from "../../_components/Field";
import { Toggle } from "../../_components/Toggle";
import { btnPrimary, btnSecondary } from "../../_components/Button";
import { PERMISSIONS } from "@/lib/permissions";
import { createRole, updateRole } from "./actions";
import type { AdminRoleRow } from "@/lib/supabase/database.types";

const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.profileManage]: "پرۆفایل",
  [PERMISSIONS.museumsManage]: "بەشەکانی مۆزەخانە",
  [PERMISSIONS.museumHistoryManage]: "مێژووی مۆزەخانە",
  [PERMISSIONS.galleryManage]: "گەلەری",
  [PERMISSIONS.bookingsManage]: "سەردانەکان",
  [PERMISSIONS.messagesManage]: "پەیامەکان",
  [PERMISSIONS.usersManage]: "بەکارهێنەران و ڕۆڵەکان",
  [PERMISSIONS.auditView]: "تۆمارەکانی چاودێری",
  [PERMISSIONS.settingsManage]: "ڕێکخستنەکان",
};

/** Create-or-edit modal for one admin_roles row — same self-contained
 * trigger+modal+transition pattern as UserFormModal. The permission matrix
 * is one Toggle per src/lib/permissions.ts entry, all named "permissions"
 * with a distinct value, read back via formData.getAll("permissions"). */
export function RoleModal({
  role,
  variant = "button",
}: {
  role?: AdminRoleRow;
  /** "tile" renders the trigger as the dashed "+" grid tile used by
   * RoleGrid, instead of the secondary pill button used in the panel
   * header. Only meaningful for the "add" case (no `role`). */
  variant?: "button" | "tile";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isSuperAdmin = role?.permissions.includes("*") ?? false;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        if (role) await updateRole(role.id, formData);
        else await createRole(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "هەڵەیەک ڕوویدا.");
      }
    });
  }

  return (
    <>
      {role ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="دەستکاریکردن"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
        >
          <Pencil size={15} />
        </button>
      ) : variant === "tile" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex h-full min-h-[9.5rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pigment-crimson/40 bg-canvas-paper/60 p-6 text-center text-ink-soft transition hover:border-pigment-crimson/70 hover:bg-canvas-paper"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
            <Plus size={18} />
          </span>
          <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">زیادکردنی ڕۆڵ</span>
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={btnSecondary}>
          <Plus size={16} /> زیادکردنی ڕۆڵ
        </button>
      )}

      <Modal
        open={open}
        title={role ? "دەستکاریکردنی ڕۆڵ" : "زیادکردنی ڕۆڵ"}
        onClose={() => setOpen(false)}
        footer={
          isSuperAdmin ? (
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              داخستن
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => formRef.current?.requestSubmit()}
                className={btnPrimary}
              >
                {pending && <Loader2 size={15} className="animate-spin" />}
                {role ? "پاشەکەوتکردن" : "زیادکردن"}
              </button>
            </>
          )
        }
      >
        {isSuperAdmin ? (
          <p className="font-kurdish text-fluid-sm text-ink-faint">
            ڕۆڵی سوپەر ئەدمین هەموو دەسەڵاتەکانی هەیە و ناتوانرێت بگۆڕدرێت.
          </p>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-pigment-crimson/10 px-3 py-2 text-fluid-xs text-pigment-crimson">
                {error}
              </p>
            )}
            <Field label="ناوی ڕۆڵ" name="name" required defaultValue={role?.name} />

            <div className="flex flex-col gap-3">
              <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">دەسەڵاتەکان</span>
              {Object.values(PERMISSIONS).map((permission) => (
                <label key={permission} className="flex items-center justify-between gap-3">
                  <span className="font-kurdish text-fluid-sm text-ink">
                    {PERMISSION_LABELS[permission] ?? permission}
                  </span>
                  <Toggle
                    name="permissions"
                    value={permission}
                    defaultChecked={role?.permissions.includes(permission)}
                  />
                </label>
              ))}
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
