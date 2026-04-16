import { getPrisma } from "@/lib/db/client";

/** Lightweight DB reachability check (no raw SQL). */
export async function countSystemSettings(): Promise<number> {
  return getPrisma().systemSetting.count();
}
