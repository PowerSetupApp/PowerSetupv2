import { BatteryCharging, CalendarDays, Map } from "lucide-react";

import type { CardOption } from "@/components/ui/card-selection";
import type { AutarchyTopUpProfile } from "@/lib/algorithm/constants";
import { presetDaysAdaptive, type AutarchyPreset } from "@/lib/wizard/autarchy-ui";

export const STEP5_TITLE = "Wie viele Tage möchtest du off-grid stehen können?";

export const STEP5_DESCRIPTION =
  "Gemeint ist „weiche Autarkie“: Solar und – falls gewählt – die Lichtmaschine " +
  "speisen weiter ein; die Batterie überbrückt nur den Rest. " +
  "Je mehr Quellen du in Schritt 2 aktiviert hast und je länger du unterwegs bist, " +
  "desto höher darf der Slider hoch.";

export const AUTARCHY_LIMIT_ALERT_TITLE = "So interpretieren wir deine Autarkie";

/**
 * Profile-aware info banner copy — what reaches the battery during the
 * autarky window depends on whether solar / alternator are selected.
 */
export function autarchyProfileAlertDescription(
  profile: AutarchyTopUpProfile,
  maxDays: number,
): string {
  switch (profile) {
    case "battery_only":
      return `Du hast weder Solar noch Lichtmaschine gewählt — die Batterie muss alle ${maxDays} Tage allein abdecken. Mehr als ${maxDays} Tage werden unrealistisch teuer. Aktiviere in Schritt 2 eine Solarquelle oder die Lichtmaschine, um den Slider zu öffnen.`;
    case "solar_or_alt":
      return `Während der Autarkie-Tage rechnen wir deine gewählte Quelle mit einer bewölkten Woche weiter (Solar mit 50 % der Saison-PSH, Lichtmaschine mit deinem vollen Fahrzeit-Schnitt — wenn du fährst, wird geladen). Selbst bei Solar-Überschuss bleiben ~25 % des Tagesbedarfs (Nacht, Dämmerung) an der Batterie — so wirkt jeder Tag auf dem Slider bis ${maxDays}.`;
    case "solar_and_alt":
      return `Solar UND Lichtmaschine speisen weiter ein: Solar mit 50 % der Saison-PSH (bewölkte Woche), die Lichtmaschine mit deinem vollen Fahrzeit-Schnitt — sobald das Wohnmobil fährt, wird voll geladen. Die Batterie deckt immer mindestens den Nacht-/Dämmerungs-Anteil (~25 % des Tagesbedarfs), daher skaliert jeder zusätzliche Autarkie-Tag sichtbar — bis ${maxDays} Tage.`;
  }
}

export const AUTARCHY_TECH_NOTE =
  "Die Batterie wird für eine bewölkte Woche in deiner gewählten Saison " +
  "ausgelegt (PSH × 0,50, Lichtmaschine voll nach Fahrzeit). Selbst bei " +
  "Solar-Überschuss tragen ~25 % des Tagesbedarfs (Nacht, Dämmerung, Dauer-DC) " +
  "immer die Batterie — deshalb verändert jeder Regler-Tag auch für " +
  "überversorgte Systeme die Empfehlung. Oberhalb von 7 Tagen Brücke wächst " +
  "der Akku nicht weiter (längere Schlechtwetter-Strecken gibt es in Europa " +
  "kaum am Stück). Ein harter 1-Tages-Puffer ist immer eingerechnet.";

export function autarchyPresetCards(maxDays: number): CardOption<AutarchyPreset>[] {
  const weekendDays = presetDaysAdaptive("weekend", maxDays);
  const holidayDays = presetDaysAdaptive("holiday", maxDays);
  const fullDays = presetDaysAdaptive("full", maxDays);

  const holidayDisabled = maxDays < 3;
  const fullDisabled = maxDays <= holidayDays;

  return [
    {
      value: "weekend",
      title: `Kurz (${weekendDays} ${weekendDays === 1 ? "Tag" : "Tage"})`,
      description: "Kurzer Puffer für Wochenende / Hochsommer",
      icon: <CalendarDays className="h-6 w-6" aria-hidden />,
    },
    {
      value: "holiday",
      title: `Reise (${holidayDays} ${holidayDays === 1 ? "Tag" : "Tage"})`,
      description: holidayDisabled
        ? `(Max. ${maxDays} Tage)`
        : "Typische Tour mit gelegentlichem Schlechtwetter",
      icon: <Map className="h-6 w-6" aria-hidden />,
      disabled: holidayDisabled,
    },
    {
      value: "full",
      title: `Lang (${fullDays} ${fullDays === 1 ? "Tag" : "Tage"})`,
      description: fullDisabled
        ? `(Max. ${maxDays} Tage)`
        : "Langzeit / Dauerautark im Rahmen deiner Quellen",
      icon: <BatteryCharging className="h-6 w-6" aria-hidden />,
      disabled: fullDisabled,
    },
  ];
}
