import * as z from "zod";

import { getPrisma } from "@/lib/db/client";

const amazonPartnerTagSchema = z
  .string()
  .max(30)
  .regex(/^[a-zA-Z0-9.-]*$/, "Nur Buchstaben, Ziffern, Punkt und Bindestrich (max. 30 Zeichen).");

export async function getAmazonPartnerTag(): Promise<string> {
  const row = await getPrisma().systemSetting.findUnique({ where: { key: "amazon_partner_tag" } });
  return row?.value ?? "";
}

export async function setAmazonPartnerTag(tag: string): Promise<void> {
  const normalized = tag.trim();
  amazonPartnerTagSchema.parse(normalized);
  await getPrisma().systemSetting.upsert({
    where: { key: "amazon_partner_tag" },
    create: { key: "amazon_partner_tag", value: normalized },
    update: { value: normalized },
  });
}
