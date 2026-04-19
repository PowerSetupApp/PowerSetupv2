"use server";

import { revalidatePath } from "next/cache";

import { AdminMediaUnavailableError, deleteAdminMedia, listAdminMedia, type AdminMediaBlob } from "@/lib/db/queries/admin-media";

export type AdminMediaListActionResult =
  | { ok: true; blobs: AdminMediaBlob[] }
  | { ok: false; reason: "unavailable"; message: string }
  | { ok: false; reason: "error"; message: string };

export async function adminMediaListAction(): Promise<AdminMediaListActionResult> {
  try {
    const blobs = await listAdminMedia();
    return { ok: true, blobs };
  } catch (e) {
    if (e instanceof AdminMediaUnavailableError) {
      return { ok: false, reason: "unavailable", message: e.message };
    }
    return {
      ok: false,
      reason: "error",
      message: "Mediathek konnte nicht geladen werden.",
    };
  }
}

export type AdminMediaDeleteActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function adminMediaDeleteAction(url: string): Promise<AdminMediaDeleteActionResult> {
  try {
    await deleteAdminMedia(url);
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    if (e instanceof AdminMediaUnavailableError) {
      return { ok: false, message: e.message };
    }
    return { ok: false, message: "Datei konnte nicht gelöscht werden." };
  }
}
