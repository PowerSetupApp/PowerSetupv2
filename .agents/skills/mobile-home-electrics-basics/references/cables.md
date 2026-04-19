# Cables: cross-section, voltage drop, ampacity

## Core formulas

Copper resistivity used here: `ρ_Cu = 0.0178 Ω·mm²/m` (equivalently `σ ≈ 56 m/(Ω·mm²)`).

This is the **engineering value used in German/EU practice (VDE, DIN)**, not the pure physical value at 20 °C (`0.01724 Ω·mm²/m`). The ~3 % margin accounts for the fact that a cable carrying significant current is hotter than the lab. Copper resistivity rises by about **0.39 % per °C**, so a cable running at 70 °C (typical for a battery-to-inverter feeder under load) has ~20 % more resistance than at 20 °C. For heavy continuous loads near the cable's ampacity, assume real drop will be 10–20 % worse than the formula predicts, and size with that headroom — or use `ρ = 0.021 Ω·mm²/m` to bake it in.

Aluminium: `ρ_Al ≈ 0.028 Ω·mm²/m` (≈ 60 % more resistive than copper for the same cross-section).

Single-conductor resistance for length `L` (metres) and cross-section `A` (mm²):

```
R = ρ · L / A
```

For a DC circuit the current flows down one conductor and back up the other, so the **round-trip length is `2·L`** and the voltage drop is:

```
ΔU = 2 · L · I · ρ / A        [volts]
```

Solving for the minimum cross-section given a maximum allowed voltage drop `ΔU_max`:

```
A_min = 2 · L · I · ρ / ΔU_max   [mm²]
```

`ΔU_max` is usually expressed as a **percentage of the system voltage**:


| Circuit                                     | Typical ΔU_max |
| ------------------------------------------- | -------------- |
| Sensitive / long (LED lighting, sensors)    | 1 %            |
| Standard DC feeders (distribution)          | 3 %            |
| Starter / inverter / winch peak loads       | 3–5 %          |
| Solar panel to MPPT (open-circuit tolerant) | up to 5 %      |


## Worked example

120 A continuous at 12 V, one-way length 3 m, target ΔU ≤ 3 % = 0.36 V:

```
A_min = 2 · 3 · 120 · 0.0178 / 0.36
      = 35.6 mm²
Choose next standard size ≥ 35.6 → 50 mm²
```

Same load on 24 V (I halves to 60 A, ΔU_max doubles to 0.72 V):

```
A_min = 2 · 3 · 60 · 0.0178 / 0.72
      = 8.9 mm²
Choose next standard size ≥ 8.9 → 10 mm²
```

(This is why larger inverters migrate to 24 V or 48 V – see `system-voltage.md`.)

## Standard copper sizes (metric)

Commonly stocked: **1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120 mm²**. Always round **up** to the next standard size.

AWG ↔ mm² quick map (approximate):


| AWG | mm² |
| --- | --- |
| 14  | 2.5 |
| 12  | 4   |
| 10  | 6   |
| 8   | 10  |
| 6   | 16  |
| 4   | 25  |
| 2   | 35  |
| 1/0 | 50  |
| 2/0 | 70  |
| 4/0 | 120 |


## Ampacity (thermal limit)

The voltage-drop formula gives the **electrically sensible** size. Separately, a cable has a **thermal current limit** (ampacity) set by insulation type, routing and ambient temperature. Always meet **both** limits – pick the larger of the two cross-sections.

Typical continuous ampacity for single-core PVC-insulated copper cable in free air at 30 °C ambient (indicative – follow the manufacturer's datasheet / DIN VDE 0298-4 / NEC Table 310 for the final number):


| Cross-section | ~ Ampacity free air | ~ Ampacity in conduit/bundled |
| ------------- | ------------------- | ----------------------------- |
| 2.5 mm²       | 32 A                | 24 A                          |
| 4 mm²         | 42 A                | 32 A                          |
| 6 mm²         | 54 A                | 41 A                          |
| 10 mm²        | 73 A                | 57 A                          |
| 16 mm²        | 98 A                | 76 A                          |
| 25 mm²        | 129 A               | 101 A                         |
| 35 mm²        | 158 A               | 125 A                         |
| 50 mm²        | 198 A               | 151 A                         |
| 70 mm²        | 245 A               | 192 A                         |
| 95 mm²        | 292 A               | 232 A                         |


Derating factors (apply multiplicatively):


| Condition                      | Factor      |
| ------------------------------ | ----------- |
| Ambient 40 °C instead of 30 °C | × 0.87      |
| Ambient 50 °C                  | × 0.71      |
| Bundled with 3 cables          | × 0.70      |
| Bundled with 6 cables          | × 0.57      |
| Routed through insulation      | × 0.50–0.80 |


## Voltage drop in % (quick table, copper, 12 V DC)

Percent of 12 V dropped on the round-trip cable (both conductors) for the listed current `I` and one-way length `L`. Computed with `ΔU % = 100 · 2·L·I·ρ / (A · U)` at `ρ = 0.0178 Ω·mm²/m`. Read as: *at 10 m one-way, 50 A through 25 mm² drops about 5.9 % of 12 V ≈ 0.71 V*. Cells marked in **bold** exceed 10 % and mean the cable is seriously undersized for that combination — pick a larger cross-section.


| Cross-section | 20 A, 5 m | 50 A, 5 m | 50 A, 10 m | 100 A, 3 m | 200 A, 1 m |
| ------------- | --------- | --------- | ---------- | ---------- | ---------- |
| 6 mm²         | 0.99 %    | 2.47 %    | **4.94 %** | **14.8 %** | 9.89 %     |
| 10 mm²        | 0.59 %    | 1.48 %    | 2.97 %     | 8.90 %     | 5.93 %     |
| 16 mm²        | 0.37 %    | 0.93 %    | 1.85 %     | 5.56 %     | 3.71 %     |
| 25 mm²        | 0.24 %    | 0.59 %    | 1.19 %     | 3.56 %     | 2.37 %     |
| 35 mm²        | 0.17 %    | 0.42 %    | 0.85 %     | 2.54 %     | 1.70 %     |
| 50 mm²        | 0.12 %    | 0.30 %    | 0.59 %     | 1.78 %     | 1.19 %     |
| 70 mm²        | 0.08 %    | 0.21 %    | 0.42 %     | 1.27 %     | 0.85 %     |


Practical targets: aim for ≤ 3 % on standard distribution, ≤ 1 % on long sensor/LED runs, accept 3–5 % on peak-load cables (inverter, winch) — see the `ΔU_max` table at the top of this file. Any cell above those targets means **upsize the cable**.

For **24 V systems** at the same current, the percent drop halves (same absolute drop, but 2× the reference voltage). In real camper practice you also halve the current for the same load power, so the effective drop is quartered — this is the main reason inverters ≥ 2 kW migrate to 24 V (see `system-voltage.md`).

## DC cable colour conventions

- **Germany / EU (DIN)**: red = DC+, black = DC−. For chassis-negative systems, the chassis return is often unmarked.
- **Marine (ABYC, also used on many European boats)**: red = DC+, yellow = DC−, **black reserved for AC neutral**. Mixing camper and marine wiring is a common source of confusion.
- **Solar DC strings**: often both conductors are black with red/black labels at the connectors. Check polarity before plugging MC4.

## Connectors and terminations

- **Crimp, don't solder**, for vibration resistance. Use hexagonal crimpers for ≥ 10 mm² lugs.
- **Heat-shrink** the lug barrel to seal against moisture ingress and prevent wicking.
- **Stranded, fine-wire ("Klasse 5/6", "welding cable")** is the standard for flexible DC runs in vehicles. Solid-core building wire is not suitable on moving vehicles.

## Safety notes (inline)

- **Undersized cable is the #1 cause of camper fires.** Size from `ΔU_max` *and* ampacity, apply derating, then size the fuse to protect the *cable*, not the load (see `protection.md`).
- **Positive cable must be fused at the source** (battery +) within 30 cm / as close as physically possible.
- **Never crimp copper lugs onto aluminium cable** without a bimetal transition – galvanic corrosion will destroy the joint.
- **Strain relief**: secure cables every 30 cm; chafing through insulation onto chassis shorts straight to ground.

## Bilingual terms


| EN                                   | DE                           |
| ------------------------------------ | ---------------------------- |
| Cross-section                        | Querschnitt                  |
| Voltage drop                         | Spannungsabfall              |
| Ampacity / current carrying capacity | Strombelastbarkeit           |
| Conductor                            | Leiter                       |
| Single-core stranded                 | feindrähtig / H07V-K, H05V-K |
| Welding cable (flexible)             | Schweißkabel, Batteriekabel  |
| Lug                                  | Kabelschuh                   |
| Crimp                                | Pressen, Crimpen             |


