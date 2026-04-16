import { countSystemSettings } from "@/lib/db/queries/health";

export async function GET() {
  const count = await countSystemSettings();
  return Response.json({ ok: true, systemSettingRows: count });
}
