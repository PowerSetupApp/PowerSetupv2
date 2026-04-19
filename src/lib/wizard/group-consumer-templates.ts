import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";

export type ConsumerTemplateCategoryGroup = {
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
  categoryIcon: string | null;
  templates: WizardConsumerTemplate[];
};

/** Stable category sections preserving device order from the input array. */
export function groupConsumerTemplatesByCategory(
  templates: WizardConsumerTemplate[],
): ConsumerTemplateCategoryGroup[] {
  const map = new Map<string, ConsumerTemplateCategoryGroup>();
  for (const t of templates) {
    let g = map.get(t.categoryId);
    if (!g) {
      g = {
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        categorySortOrder: t.categorySortOrder,
        categoryIcon: t.categoryIcon,
        templates: [],
      };
      map.set(t.categoryId, g);
    }
    g.templates.push(t);
  }
  return [...map.values()].sort((a, b) => a.categorySortOrder - b.categorySortOrder);
}
