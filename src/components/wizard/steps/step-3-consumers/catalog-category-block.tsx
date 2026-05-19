import type { Consumer } from "@/lib/algorithm/types";
import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";
import type { ConsumerTemplateCategoryGroup } from "@/lib/wizard/group-consumer-templates";

import { CatalogTemplateRow } from "./catalog-template-row";
import { countConsumersFromTemplate } from "./consumers-helpers";
import { DeviceIconSlot } from "./device-icon-slot";

type CatalogCategoryBlockProps = {
  group: ConsumerTemplateCategoryGroup;
  consumers: Consumer[];
  onAddTemplate: (t: WizardConsumerTemplate) => void;
};

export function CatalogCategoryBlock({ group, consumers, onAddTemplate }: CatalogCategoryBlockProps) {
  return (
    <section className="border-t border-primary/15 pt-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex min-w-0 items-center gap-2.5 rounded-lg bg-background/55 px-2 py-2 ring-1 ring-primary/10 dark:bg-background/30">
        <DeviceIconSlot icon={group.categoryIcon} active className="shrink-0" />
        <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-primary sm:text-lg">
          <span className="sr-only">Kategorie: </span>
          {group.categoryName}{" "}
          <span className="font-normal text-muted-foreground">({group.templates.length})</span>
        </h3>
      </div>
      <ul className="divide-y divide-primary/10">
        {group.templates.map((t) => (
          <li key={t.id}>
            <CatalogTemplateRow
              template={t}
              addedCount={countConsumersFromTemplate(consumers, t.id)}
              onAdd={onAddTemplate}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
