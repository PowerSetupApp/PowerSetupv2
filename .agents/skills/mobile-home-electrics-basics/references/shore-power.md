# Shore power (230 V / 120 V AC input, Landstrom)

## Core idea

"Shore power" is the external AC feed that a camper connects to on a campground or at home. In Europe this is **230 V AC 50 Hz** via a CEE17 plug; in North America it is 120 V / 240 V via NEMA TT-30 or L14-30. Shore power does three jobs simultaneously:

1. Powers the AC circuits in the camper directly (through an RCD/MCB).
2. Runs the onboard battery charger (or inverter-charger), replenishing the house bank.
3. (When present) passes through the inverter-charger's transfer switch.

## Core formulas

Current drawn at a shore inlet for a given AC load `P_ac`:

```
I_ac = P_ac / (U_ac · cos φ)
```

For resistive loads (heaters, kettles, most camper appliances) `cos φ ≈ 1`. For motors / inductive loads `cos φ ≈ 0.7–0.9`; size the inlet breaker accordingly.

Time to charge the house bank from empty to full via shore charger of output `I_charger` at `U_battery`:

```
t_charge ≈ C_nom [Ah] · DoD / (I_charger · η_charger)  +  absorption tail (1–3 h)
```

For LFP, the absorption tail is short (minutes); for AGM/Gel it's 1–3 h of tapering current, which is why AGM needs a roughly 20–30 % longer total charge time than the bulk-phase alone suggests.

### Worked example

200 Ah LFP at 30 % SoC, Victron Phoenix 30 A charger, η = 0.92:

```
Bulk phase:  (200 · 0.7) / (30 · 0.92) ≈ 5.1 h
Absorption:  ~0.5 h
Total:       ~5.5 h to full
```

Shore-side current while charging: `I_ac ≈ 30 · 14.4 / 230 / 0.92 ≈ 2.0 A`. Fits easily on any CEE hookup.

## European CEE17 "Campingstecker"

The blue industrial connector you see on every European campsite.


| Parameter               | Typical campsite value                                                |
| ----------------------- | --------------------------------------------------------------------- |
| Plug                    | CEE17 IEC 60309, 3-pin, blue, 230 V                                   |
| Rated current           | **16 A** (pedestal breaker usually 6, 10, or 16 A – read the label)   |
| Continuous usable power | `230 V · 6 A = 1380 W` up to `230 V · 16 A = 3680 W`                  |
| Cable inside camper     | H07RN-F 3×2.5 mm² minimum (for 16 A)                                  |
| Extension lead          | Same cable cross-section, **fully unrolled** (coiled cables overheat) |


### The 6 A problem

Many European and almost all Italian/French campsites limit the pedestal to 6 A. That's **1380 W total** for the whole camper: water heater + fridge + kettle doesn't fit. The algorithm should warn the user about this and, if the user has an inverter-charger, recommend enabling PowerAssist / power-sharing (see `inverter.md`).

### Reverse polarity

On non-European campsites (Italy, parts of Eastern Europe) a CEE17 pedestal occasionally has live and neutral swapped. Consequences for an RCD-protected camper installation are usually harmless (both conductors are switched by the main breaker), but a polarity tester at the entry is good practice. Some inverter-chargers (Victron MultiPlus) simply reject reverse polarity and stay in inverter mode.

## North American hookups


| Plug       | Voltage               | Current | Use                      |
| ---------- | --------------------- | ------- | ------------------------ |
| NEMA TT-30 | 120 V                 | 30 A    | Standard "30A RV" hookup |
| NEMA 14-50 | 120/240 V split phase | 50 A    | Large US motorhomes      |
| NEMA 5-15  | 120 V                 | 15 A    | Household outlet         |


A European camper on a North American hookup needs a **step-up transformer** (240 → 230 V is fine; 120 → 230 V requires a dedicated transformer, typically 2 kVA).

## RCD / FI and MCB protection

European camper AC distribution should have, from inlet inward:

1. **Main switch** (2-pole, breaks live and neutral).
2. **RCD (Fehlerstromschutzschalter / FI-Schalter)**, 30 mA, type A minimum, type B if a frequency inverter or certain photovoltaic inverters are involved.
3. **MCBs (Leitungsschutzschalter / Sicherungsautomaten)** per final circuit, typically B-characteristic, 6 A or 10 A.
4. **Equipotential bonding** of chassis, water system and any metal fittings to the PE conductor.

Why this matters for the algorithm: the 30 mA RCD is a safety backbone that **does not depend** on a proper campsite earth. If the pedestal PE is missing (common in older installations), the RCD will not detect a single line-to-chassis fault. Some premium installations add an **isolation transformer** for exactly this reason.

## Galvanic isolation and shore-side earth

Two common problems:

- **Different neutral-earth bonding between shore and camper**: can cause circulating currents, tripping RCDs or corroding metal surfaces (especially on boats). Fix: isolation transformer.
- **Missing earth at pedestal**: dangerous. Detect with a polarity/PE tester; don't connect.

An isolation transformer (typically 3.6 kVA for a camper) solves both but adds ~20 kg and 1.5–2 % continuous loss. Not standard on small campers; more common on expedition vehicles and boats.

## Shore charger sizing


| House bank      | Recommended shore charger  |
| --------------- | -------------------------- |
| 100 Ah LFP      | 15–30 A                    |
| 200 Ah LFP      | 30–50 A                    |
| 300 Ah LFP      | 50–70 A (inverter-charger) |
| 200 Ah AGM      | 20 A (0.1–0.2 C)           |
| 400 Ah AGM bank | 40 A (0.1 C)               |


Larger chargers that exceed the battery's max charge C-rate are wasteful (the battery doesn't accept the extra current, the charger just tapers early). They can make sense in an inverter-charger that also needs to run AC loads while charging (the DC path uses what the batteries accept, the AC path covers the loads).

## Energy available from X hours on shore

```
E_shore [Wh] = min(P_shore_max, P_charger + P_ac_loads) · t
```

For quick planning:


| Pedestal                  | Usable power | 8 h overnight on shore                       |
| ------------------------- | ------------ | -------------------------------------------- |
| CEE 6 A                   | ~1.2 kW      | ~9.6 kWh available for chargers + appliances |
| CEE 10 A                  | ~2.2 kW      | ~17.6 kWh                                    |
| CEE 16 A                  | ~3.5 kW      | ~28 kWh                                      |
| NEMA TT-30 (30 A @ 120 V) | ~3.3 kW      | ~26 kWh                                      |


A full 200 Ah LFP recharge is only ~2.4 kWh of AC input – always fits in an overnight on any pedestal.

## Safety notes (inline)

- **Always use a CEE17 cable with matching cross-section (H07RN-F 3×2.5 mm² for 16 A).** Thinner household cables melt at the pedestal.
- **Extension reels must be fully unrolled** when carrying > 5 A – coiled cable acts as an inductor and overheats.
- **Never "adapt" a CEE17 to a Schuko household socket without the protective circuit** – household sockets on the camper side don't switch neutral and often lack the 30 mA RCD.
- **Test the RCD** periodically via the T-button; a stuck RCD is invisible until you need it.
- **230 V AC work** is legally restricted to qualified electricians in many jurisdictions (Germany: "Elektrofachkraft"). DC work on 12/24/48 V is usually unrestricted but still safety-critical.

## Bilingual terms


| EN                              | DE                                        |
| ------------------------------- | ----------------------------------------- |
| Shore power / shore connection  | Landstrom, Landanschluss                  |
| CEE plug / industrial plug      | CEE-Stecker, Campingstecker               |
| RCD (residual current device)   | FI-Schalter, Fehlerstromschutzschalter    |
| MCB (miniature circuit breaker) | Leitungsschutzschalter, Sicherungsautomat |
| Isolation transformer           | Trenntransformator                        |
| Protective earth (PE)           | Schutzleiter                              |
| Pedestal / hookup post          | Stromsäule                                |
| Inlet (shore inlet on camper)   | Einspeisesteckdose                        |


