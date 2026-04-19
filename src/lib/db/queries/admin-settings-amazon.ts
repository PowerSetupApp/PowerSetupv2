import { getPrisma } from "@/lib/db/client";

export async function getAmazonPartnerTag(): Promise<string> {
  const row = await getPrisma().systemSetting.findUnique({ where: { key: "amazon_partner_tag" } });
  return row?.value ?? "";
}

export async function setAmazonPartnerTag(tag: string): Promise<void> {
  await getPrisma().systemSetting.upsert({
    where: { key: "amazon_partner_tag" },
    create: { key: "amazon_partner_tag", value: tag },
    update: { value: tag },
  });
}
