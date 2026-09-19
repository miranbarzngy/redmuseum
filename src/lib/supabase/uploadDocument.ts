import "server-only";
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "./admin";

// Allow-listed by MIME type, not by filename extension — see uploadImage.ts
// for why (a client-supplied filename/extension can't be trusted).
const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
};

function assertAllowedDocument(file: File): string {
  const ext = ALLOWED_DOCUMENT_TYPES[file.type];
  if (!ext) {
    throw new Error("Unsupported file type. Use PDF.");
  }
  return ext;
}

/**
 * Uploads `fieldName` (a file input) to the `documents` storage bucket if a
 * file was actually chosen, falling back to a plain pasted URL from
 * `urlFieldName` — that field is always rendered (not conditionally, like
 * ImageField's "kept" hidden input), so an empty value there unambiguously
 * means "no flyer" rather than "untouched".
 */
export async function resolveUploadedDocumentUrl(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  fieldName: string,
  urlFieldName: string
): Promise<string | null> {
  const file = formData.get(fieldName);

  if (file instanceof File && file.size > 0) {
    const ext = assertAllowedDocument(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Document upload failed: ${error.message}`);

    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  }

  return String(formData.get(urlFieldName) ?? "").trim() || null;
}
