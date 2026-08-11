import "server-only";
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "./admin";

/**
 * Uploads `fieldName` (a file input) to the `artwork` storage bucket if a
 * file was actually chosen, falling back to a plain pasted URL from
 * `urlFieldName`. Returns `undefined` to mean "leave the existing value
 * unchanged" — the caller decides whether that's meaningful (edit forms)
 * or should be treated as "no image" (create forms).
 */
export async function resolveUploadedImageUrl(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  fieldName: string,
  urlFieldName?: string
): Promise<string | null | undefined> {
  const file = formData.get(fieldName);
  const urlField = urlFieldName ? String(formData.get(urlFieldName) ?? "").trim() : "";

  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("artwork").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);

    const { data } = supabase.storage.from("artwork").getPublicUrl(path);
    return data.publicUrl;
  }

  if (urlField) return urlField;

  return undefined;
}

/**
 * Uploads every file chosen under `fieldName` (a `multiple` file input) to
 * the `artwork` bucket and returns their public URLs, in selection order.
 * Returns an empty array if no files were chosen.
 */
export async function resolveUploadedImageUrls(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  fieldName: string
): Promise<string[]> {
  const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("artwork").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);

    const { data } = supabase.storage.from("artwork").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
