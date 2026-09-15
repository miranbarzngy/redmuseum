"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Modal } from "../../_components/Modal";
import { Field } from "../../_components/Field";
import { btnPrimary, btnSecondary } from "../../_components/Button";
import { resetUserPassword } from "./actions";

/** Quick "reset password" affordance on a user card — a lighter modal than
 * the full edit form, for the common case of just issuing someone a new
 * password without touching their other fields. */
export function ResetPasswordModal({ userId, userName }: { userId: string; userName: string }) {
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
        await resetUserPassword(userId, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "هەڵەیەک ڕوویدا.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="نوێکردنەوەی وشەی نهێنی"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
      >
        <KeyRound size={15} />
      </button>

      <Modal
        open={open}
        title={`نوێکردنەوەی وشەی نهێنی — ${userName}`}
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
              نوێکردنەوە
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
          <Field label="وشەی نهێنی نوێ" name="password" type="password" dir="ltr" required />
        </form>
      </Modal>
    </>
  );
}
