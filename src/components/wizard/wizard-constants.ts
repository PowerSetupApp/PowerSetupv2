import type { Step } from "@/components/ui/progress-steps";

/** Zweistellige Schrittnummer für UI (Eyebrow, Top-Bar). */
export function padWizardStep(n: number): string {
  return n.toString().padStart(2, "0");
}

export const WIZARD_STEPS: Step[] = [
  { id: 1, label: "Basis", shortLabel: "1" },
  { id: 2, label: "Energie", shortLabel: "2" },
  { id: 3, label: "Verbraucher", shortLabel: "3" },
  { id: 4, label: "Reise", shortLabel: "4" },
  { id: 5, label: "Autarkie", shortLabel: "5" },
  { id: 6, label: "Kabel", shortLabel: "6" },
  { id: 7, label: "Marken", shortLabel: "7" },
  { id: 8, label: "Check", shortLabel: "8" },
];

/** Zentral für WizardShell (Eyebrow, Seitentitel, Live-Summary-Zeilenetiketten). */
export const WIZARD_STEP_META: Record<
  number,
  { category: string; title: string; subtitle: string }
> = {
  1: {
    category: "Basis",
    title: "System-Basis",
    subtitle:
      "Bordnetz, Starterbatterie und bevorzugte Haus-Batterie-Chemie — die Grundlage für alle weiteren Schritte.",
  },
  2: {
    category: "Energie",
    title: "Energiequellen",
    subtitle:
      "Woher kommt der Strom? Bei Solar definierst du die verfügbaren Dachflächen.",
  },
  3: {
    category: "Verbraucher",
    title: "Verbraucher",
    subtitle: "Wähle Geräte aus dem Katalog oder füge eigene Verbraucher hinzu.",
  },
  4: {
    category: "Reise",
    title: "Wie nutzt du dein Fahrzeug?",
    subtitle:
      "Diese Angaben helfen uns, Solarertrag, Reserve und Lichtmaschinen-Nutzung an dein echtes Reiseverhalten anzupassen.",
  },
  5: {
    category: "Autarkie",
    title: "Wie viele Tage möchtest du off-grid stehen können?",
    subtitle:
      "Gemeint ist „weiche Autarkie“: Solar und – falls gewählt – die Lichtmaschine speisen weiter ein; die Batterie überbrückt nur den Rest.",
  },
  6: {
    category: "Kabel",
    title: "Kabelwege & Platzierung",
    subtitle:
      "Schätze die Entfernung zwischen den Komponenten — nur die Strecken, die zu deinen Quellen in Schritt 2 (und ggf. 230-V-Verbrauchern) passen.",
  },
  7: {
    category: "Marken",
    title: "Marken (optional)",
    subtitle:
      "Wenn du Marken bevorzugst, kannst du hier freie Hinweise setzen — oder alles leer lassen.",
  },
  8: {
    category: "Check",
    title: "Übersicht",
    subtitle:
      "Prüfe Solar, Batterie und Kabel. Anschließend erzeugen wir dein Ergebnis.",
  },
};
