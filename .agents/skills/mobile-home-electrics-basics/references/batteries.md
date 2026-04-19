# Batteries: chemistry, capacity, sizing

## Core formulas

From daily energy demand `E_day` in Wh to nominal battery capacity:

```
E_battery_in  = E_day / (η_inv · η_wiring · η_charge_disch)     [Wh]
C_nom [Wh]    = E_battery_in / DoD
C_nom [Ah]    = C_nom [Wh] / U_system
```

with typical efficiency factors for camper use:


| Factor           | Typical value                                     | Where it comes from                           |
| ---------------- | ------------------------------------------------- | --------------------------------------------- |
| `η_inv`          | 0.88–0.93                                         | Inverter DC→AC efficiency (see `inverter.md`) |
| `η_wiring`       | 0.97–0.99                                         | Cable and fuse losses                         |
| `η_charge_disch` | 0.95 (LiFePO4), 0.80–0.85 (AGM), 0.75 (lead-acid) | Round-trip battery efficiency                 |
| `DoD`            | 0.8–0.9 (LiFePO4), 0.5 (AGM), 0.3–0.5 (lead-acid) | Permitted depth of discharge                  |


Include `η_inv` only for loads that actually go through the inverter. Pure 12 V DC loads (fridge, lights, pump) skip it.

## Worked example

A camper draws `E_day = 1800 Wh` at 12 V, of which 1200 Wh is DC and 600 Wh runs through an inverter (η = 0.9). Chemistry: LiFePO4, DoD 0.8, η_roundtrip 0.95.

```
E_battery_in = 1200 / (1 · 0.98 · 0.95) + 600 / (0.9 · 0.98 · 0.95)
             = 1289 + 715
             = 2004 Wh

C_nom [Wh] = 2004 / 0.8 = 2505 Wh
C_nom [Ah] = 2505 / 12  = 209 Ah    → round up: 200–220 Ah LiFePO4
```

Same load on AGM with DoD 0.5 and η_roundtrip 0.85:

```
E_battery_in ≈ 1200 / 0.83 + 600 / 0.75 ≈ 1446 + 800 = 2246 Wh
C_nom [Ah]   = 2246 / 0.5 / 12 ≈ 374 Ah
```

AGM needs roughly **1.8× the capacity** for the same usable energy – and weighs 2–3× more.

## Chemistry at a glance


| Chemistry                          | Usable DoD    | Roundtrip η | Cycles (to 80 %) | Energy density (Wh/kg) | Self-discharge / month | Notes                                                                                      |
| ---------------------------------- | ------------- | ----------- | ---------------- | ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| **LiFePO4 (LFP)**                  | 0.80–0.90     | 0.94–0.97   | 3000–6000        | 90–120                 | 1–3 %                  | Camper default since ~2020. Flat discharge curve, no sulfation. Cannot charge below 0 °C.  |
| **AGM lead-acid**                  | 0.50 (cyclic) | 0.80–0.85   | 400–800          | 30–40                  | 3–5 %                  | Cheap, heavy. Needs absorption + float stages. Dies from deep cycling.                     |
| **Gel lead-acid**                  | 0.50          | 0.80        | 500–1000         | 30–40                  | 2–3 %                  | Similar to AGM, more tolerant of slow deep cycling, less tolerant of high charge currents. |
| **Flooded lead-acid**              | 0.30–0.50     | 0.70–0.80   | 300–500          | 25–35                  | 5–10 %                 | Cheapest Wh, needs vented compartment, requires topping up with distilled water.           |
| **NMC / Li-ion (rare in campers)** | 0.80          | 0.95        | 1000–2000        | 150–220                | 2 %                    | Higher energy density but worse thermal safety than LFP; avoid for house banks.            |


## Key limits a sizing algorithm must respect

### Charge / discharge current (C-rate)

C-rate = current / nominal capacity. "1 C" on a 100 Ah battery = 100 A.


| Chemistry | Typical max continuous charge  | Typical max continuous discharge   |
| --------- | ------------------------------ | ---------------------------------- |
| LiFePO4   | 0.5–1 C (drop-in: often 0.5 C) | 1 C (drop-in: often 1 C, 2 C peak) |
| AGM       | 0.2–0.3 C                      | 0.5 C (deep-cycle models)          |
| Gel       | 0.1–0.2 C                      | 0.3 C                              |


Consequence for the algorithm: a 100 Ah LiFePO4 cannot absorb a 60 A Ladebooster at full power for long. Either the booster limits current, or you need a larger / second battery.

### Temperature limits


| Chemistry | Charge allowed                            | Discharge allowed | Storage                 |
| --------- | ----------------------------------------- | ----------------- | ----------------------- |
| LiFePO4   | **0 … +45 °C** (hard limit, BMS cuts out) | −20 … +60 °C      | at ~50 % SoC, 0 … 25 °C |
| AGM       | −20 … +45 °C                              | −40 … +60 °C      | full charge, cool       |
| Gel       | −20 … +40 °C                              | −40 … +55 °C      | full charge, cool       |


**The 0 °C rule for LiFePO4** is why self-heating LFP or an insulated / cabin-mounted battery is needed for winter travel. Ignoring it kills the cells (lithium plating).

### Voltage windows (nominal → charged → low cut-off)


| Chemistry (per 12 V nominal) | Charge absorption                       | Float                | Low cut-off (rest) |
| ---------------------------- | --------------------------------------- | -------------------- | ------------------ |
| LiFePO4                      | 14.2–14.6 V                             | 13.5–13.8 V (or off) | 10.0–11.0 V (BMS)  |
| AGM                          | 14.4–14.7 V                             | 13.6–13.8 V          | 11.8 V (50 % DoD)  |
| Gel                          | 14.1–14.4 V                             | 13.5–13.7 V          | 11.8 V             |
| Flooded                      | 14.4–14.8 V (equalise higher, periodic) | 13.5–13.8 V          | 11.9 V             |


Multiply by 2 for 24 V systems, by 4 for 48 V.

## Cycle life vs depth of discharge

Lead-acid cycle life collapses with deeper cycles:


| DoD per cycle | AGM cycles | LiFePO4 cycles |
| ------------- | ---------- | -------------- |
| 100 %         | ~200       | ~2000          |
| 80 %          | ~400       | ~3000          |
| 50 %          | ~800       | ~5000          |
| 30 %          | ~1500      | ~6000+         |


Consequence for sizing: with lead-acid, oversizing the bank so daily DoD stays ≤ 30 % dramatically extends life. With LiFePO4, the cycle count at 80 % is already high enough that "size for what you need + 20 %" is fine.

## Parallel and series

- **Series** (e.g. 2× 12 V → 24 V): voltages add, capacity stays the same. All batteries **must** be the same chemistry, capacity, age and ideally from the same production batch.
- **Parallel**: capacity adds, voltage stays the same. Use equal-length cables to each battery (symmetric wiring) so current shares evenly.
- **Never mix chemistries** on the same bus. Their charge curves are incompatible; one will always be over- or under-charged.

## Safety notes (inline)

- **LiFePO4 BMS low-voltage cut-off** disconnects the battery from the load. Inverters and fridges can see this as a power failure; sensitive electronics may not restart cleanly.
- **Flooded lead-acid gas hydrogen when charged.** Ventilate to the outside; never in a sealed compartment with electronics.
- **Short-circuit current** of a modern 100 Ah LiFePO4 exceeds 3000 A. The positive terminal must be fused ≤ 30 cm from the post (see `protection.md`).
- **Cold charging a lithium below 0 °C** is silent damage: no warning, just lost cycles. Use a BMS that enforces the cut-off, or a battery with integrated heater.

## Bilingual terms


| EN                              | DE                                        |
| ------------------------------- | ----------------------------------------- |
| Depth of discharge (DoD)        | Entladetiefe                              |
| State of charge (SoC)           | Ladezustand                               |
| Battery management system (BMS) | Batteriemanagementsystem                  |
| Roundtrip efficiency            | Wirkungsgrad (Lade-/Entlade-)             |
| Absorption / float              | Konstantspannungs-/ Erhaltungsladung      |
| Equalise                        | Ausgleichsladung                          |
| Drop-in replacement             | Drop-in-Ersatz, LiFePO4-Austauschbatterie |


