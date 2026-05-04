import type { AlgorithmInput, AlgorithmOutput, RequiredFuseCategory } from "./types";

const BLADE_MAX_A = 30;
const CABLE_SAFETY = 1.25;

/** Eingang ohne recurse — `buildRequiredFuseCategories` liest nur Kern-Felder. */
export type RequiredFuseCategoryInput = Pick<
  AlgorithmOutput,
  "battery" | "solar" | "booster" | "charger" | "inverter" | "controller" | "portableController" | "cables"
>;

/**
 * Deduplizierte Checkliste: welche Sicherungstyp-Bauformen in der Anlage vorkommen,
 * mit fachlichen Gründen (keine Nennwerte pro Slot).
 */
export function buildRequiredFuseCategories(
  input: AlgorithmInput,
  out: RequiredFuseCategoryInput,
): RequiredFuseCategory[] {
  const u = out.battery.voltage;
  const items: RequiredFuseCategory[] = [];
  const seen = new Set<string>();

  const push = (c: RequiredFuseCategory) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    items.push(c);
  };

  if (out.battery.recommendedCapacityAh > 0) {
    const lfp = input.batteryPreference === "lifepo4";
    const large = out.battery.recommendedCapacityAh >= 100;
    push({
      id: "battery_main",
      fuseFamily: "class_t",
      familyLabelDe: "Hauptabsicherung (Class T / ANL)",
      reasonDe: large && lfp
        ? "Sicherung direkt am Batterie-Plus: große LFP-Banken können sehr hohe Kurzschlussströme liefern. Class T bietet i. d. R. deutlich höheres Abschaltvermögen (z. B. 20 kA) als gängige ANL; ANL nur, wenn der erwartete Kurzschlussfall sicher unter dem Abschaltvermögen des Herstellers bleibt — Nennwert und Halter im Stromlaufplan."
        : "Hauptabsicherung am Batterie-Plus: schützt den Einspeisungssammelstrang. Typisch Class T (LiFePO4, hohe I_k) oder passend bemessene ANL; genaue Nennwerte im Schaltplan.",
    });
  }

  const hasDcConsumers = input.consumers.some((c) => c.voltage !== 230);
  if (hasDcConsumers && input.cableLengths.batteryToFuseBox > 0) {
    push({
      id: "dc_branch_atc",
      fuseFamily: "ato_atc",
      familyLabelDe: "Flachsicherung ATO/ATC (DC-Verteiler)",
      reasonDe: `Kleinabgänge an den ${u} V-Verteiler: ATO/ATC üblich bis ca. ${BLADE_MAX_A} A pro Stromkreis; pro Abgang Kabelquerschnitt abgesichert — Nennströme im Stromlaufplan.`,
    });
  }

  const b2f = out.cables.find((c) => c.route === "battery_to_fuse_box");
  const iFeed = b2f?.currentA ?? 0;
  if (iFeed * CABLE_SAFETY > BLADE_MAX_A && input.cableLengths.batteryToFuseBox > 0) {
    push({
      id: "dc_feed_hv",
      fuseFamily: "midi_ami",
      familyLabelDe: "Midi / MEGA (hohe DC-Ströme)",
      reasonDe: "Zuleitung/Strang oberhalb typischer Flachsicherungs-Bereiche: Sicherungshalter und Nennwerte im Midi- bis MEGA-Format; Kabelampazität und Spannungsfall beachten — Details im Schaltplan.",
    });
  }

  if (out.inverter.needed) {
    push({
      id: "inverter_dc",
      fuseFamily: "anl",
      familyLabelDe: "Wechselrichter-DC-Strang (z. B. ANL/MEGA)",
      reasonDe: "Separater Zug Versorgerbatterie → Wechselrichter: hohe DC-Ströme, keine Flach-Verteiler-Fläche; ANL/MEGA o. ä. am Kabelstrang — im Schaltplan verorten.",
    });
  }

  if (out.controller.needed && out.controller.currentA > 0) {
    push({
      id: "solar_mppt",
      fuseFamily: "midi_ami",
      familyLabelDe: "Laderegler (MPPT) → Batterie",
      reasonDe: "Batterie-Seite des MPPT: typisch Midi-Range; parallele PV-Strings ggf. mit String-Sicherungen — im Schaltplan prüfen.",
    });
  }

  if (out.booster.needed) {
    push({
      id: "b2b",
      fuseFamily: "midi_ami",
      familyLabelDe: "Ladebooster (Starter → Versorger)",
      reasonDe: "Jeder ungeschützte Leitungszug ab einer Quelle muss abgesichert werden; B2B oft Sicherung an Starter- und an Haus-Seite — Nennwerte im Schaltplan.",
    });
  }

  if (out.charger.needed) {
    push({
      id: "shore_charger_dc",
      fuseFamily: "midi_ami",
      familyLabelDe: "Bordladegerät → Batterie (DC-Seite)",
      reasonDe: "DC-Strang vom Ladegerät zum Hausspeicher: Sicherung am Kabel querschnittsgerecht; einzeln im Schaltplan legen.",
    });
  }

  if (input.energySources.includes("shore_power")) {
    push({
      id: "shore_230v",
      fuseFamily: "shore_ac",
      familyLabelDe: "230 V Landstrom (LS / FI)",
      reasonDe: "AC-Seite: Leitungsschutz und personenschutzmäßig (FI/RCD) planen — getrennt von der 12/24/48 V-DC-Flach-Verteilung; nicht in dieselbe Sicherungsdose mischen.",
    });
  }

  if (u === 48) {
    push({
      id: "dc_48v_rating",
      fuseFamily: "voltage_note",
      familyLabelDe: "Nenn-DC-Spannung der Schutzelemente",
      reasonDe: "48 V-System: Sicherungen, Trenner und Leitungsnachweise mit ausreichender DC-Bemessungsspannung wählen (häufig 58/60 V DC) — im Datenblatt prüfen.",
    });
  }

  return items;
}
