"use client";

import { inputClassName, labelClassName } from "@/components/wizard/field-styles";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import { useWizardStore } from "@/store/wizard";

export function Step7Brands() {
  const brandPreferences = useWizardStore((s) => s.input.brandPreferences);
  const setBrandPreferences = useWizardStore((s) => s.setBrandPreferences);

  return (
    <div className="flex flex-col gap-8">
      <WizardStepHeader
        title="Marken (optional)"
        description="Wenn du Marken bevorzugst, trage später die IDs aus der Produkt-Datenbank ein — oder frei lassen."
      />
      <div>
        <label className={labelClassName()} htmlFor="brand-solar">
          Solar (Brand-ID)
        </label>
        <input
          id="brand-solar"
          className={inputClassName()}
          value={brandPreferences.solar ?? ""}
          placeholder="leer = egal"
          onChange={(e) =>
            setBrandPreferences({ solar: e.target.value.trim() === "" ? null : e.target.value.trim() })
          }
        />
      </div>
      <div>
        <label className={labelClassName()} htmlFor="brand-battery">
          Batterie (Brand-ID)
        </label>
        <input
          id="brand-battery"
          className={inputClassName()}
          value={brandPreferences.battery ?? ""}
          placeholder="leer = egal"
          onChange={(e) =>
            setBrandPreferences({ battery: e.target.value.trim() === "" ? null : e.target.value.trim() })
          }
        />
      </div>
      <div>
        <label className={labelClassName()} htmlFor="brand-charger">
          Lader / Booster (Brand-ID)
        </label>
        <input
          id="brand-charger"
          className={inputClassName()}
          value={brandPreferences.charger ?? ""}
          placeholder="leer = egal"
          onChange={(e) =>
            setBrandPreferences({ charger: e.target.value.trim() === "" ? null : e.target.value.trim() })
          }
        />
      </div>
    </div>
  );
}
