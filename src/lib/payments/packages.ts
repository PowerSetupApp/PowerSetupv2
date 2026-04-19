export const CREDIT_PACKAGE_IDS = ["single", "starter", "pro"] as const;
export type CreditPackageId = (typeof CREDIT_PACKAGE_IDS)[number];

export type CreditPackageDef = {
  id: CreditPackageId;
  label: string;
  credits: number;
  amount: string;
  currency: "EUR";
};

export const CREDIT_PACKAGES: Record<CreditPackageId, CreditPackageDef> = {
  single: { id: "single", label: "Einzel", credits: 1, amount: "4.99", currency: "EUR" },
  starter: { id: "starter", label: "Starter", credits: 3, amount: "9.99", currency: "EUR" },
  pro: { id: "pro", label: "Pro", credits: 10, amount: "24.99", currency: "EUR" },
};

export function parseCreditPackageId(raw: string): CreditPackageId | null {
  if (CREDIT_PACKAGE_IDS.includes(raw as CreditPackageId)) return raw as CreditPackageId;
  return null;
}
