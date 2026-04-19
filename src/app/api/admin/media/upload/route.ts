import { NextResponse } from "next/server";

import { AdminMediaUnavailableError, uploadAdminMedia } from "@/lib/db/queries/admin-media";
import { adminMediaUploadMetaSchema } from "@/lib/schemas/admin-media-upload";

export async function POST(req: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Ungültige FormData." }, { status: 400 });
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ ok: false, message: "Keine Datei empfangen." }, { status: 400 });
  }

  const meta = adminMediaUploadMetaSchema.safeParse({
    filename: fileEntry.name,
    mimeType: fileEntry.type,
    size: fileEntry.size,
  });
  if (!meta.success) {
    const message = meta.error.issues[0]?.message ?? "Ungültige Datei.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  try {
    const blob = await uploadAdminMedia(fileEntry, meta.data);
    return NextResponse.json({ ok: true, blob }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminMediaUnavailableError) {
      return NextResponse.json({ ok: false, message: err.message }, { status: 503 });
    }
    console.error("[admin/media/upload] failed", err);
    return NextResponse.json({ ok: false, message: "Upload fehlgeschlagen." }, { status: 500 });
  }
}
