"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Modal } from "../../_components/Modal";
import { Field } from "../../_components/Field";
import { btnPrimary, btnSecondary } from "../../_components/Button";
import { createUser, updateUser } from "./actions";
import type { AdminRoleRow, AdminUserRow } from "@/lib/supabase/database.types";

/** Create-or-edit modal for one admin_users row — self-contained (renders
 * its own trigger button + Modal + open state), same "own its interaction"
 * pattern DeleteButton uses for ConfirmDialog. Calls the Server Action
 * directly inside useTransition rather than via the form's native `action`
 * so it can close itself on success and show the error inline on failure. */
export function UserFormModal({
  roles,
  user,
  variant = "button",
}: {
  roles: AdminRoleRow[];
  user?: AdminUserRow;
  /** "tile" renders the trigger as the dashed "+" grid tile used by
   * UserGrid, instead of the solid pill button used in the panel header.
   * Only meaningful for the "add" case (no `user`). */
  variant?: "button" | "tile";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        if (user) await updateUser(user.id, formData);
        else await createUser(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "هەڵەیەک ڕوویدا.");
      }
    });
  }

  return (
    <>
      {user ? (
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
          <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">
            زیادکردنی بەکارهێنەر
          </span>
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
          <Plus size={16} /> زیادکردنی بەکارهێنەر
        </button>
      )}

      <Modal
        open={open}
        title={user ? "دەستکاریکردنی بەکارهێنەر" : "زیادکردنی بەکارهێنەر"}
        onClose={() => setOpen(false)}
        footer={
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
              {user ? "پاشەکەوتکردن" : "زیادکردن"}
            </button>
          </>
        }
      >
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-pigment-crimson/10 px-3 py-2 text-fluid-xs text-pigment-crimson">
              {error}
            </p>
          )}
          <Field label="ناوی تەواو" name="full_name" required defaultValue={user?.full_name} />
          <Field label="ئیمەیل" name="email" type="email" required dir="ltr" defaultValue={user?.email} />
          <Field
            label="وشەی نهێنی"
            name="password"
            type="password"
            dir="ltr"
            required={!user}
            hint={user ? "بەجێی هێڵە بۆ نەگۆڕینی وشەی نهێنی." : undefined}
          />
          <Field label="ڕۆڵ" name="role_id" select required defaultValue={user?.role_id ?? roles[0]?.id}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Field>
        </form>
      </Modal>
    </>
  );
}
