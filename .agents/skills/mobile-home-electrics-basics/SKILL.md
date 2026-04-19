---

## name: mobile-home-electrics-basics

description: Electrical and electronic reference for mobile homes, camper vans, RVs, caravans and boats. Use whenever the user asks about 12 V, 24 V or 48 V DC systems, 230 V / 120 V AC shore power, cable cross-section / Kabelquerschnitt, voltage drop / Spannungsabfall, battery sizing (LiFePO4, AGM, Gel, lead-acid), solar panel yield, MPPT vs PWM charge controllers, alternators or B2B chargers (Ladebooster), inverters (Wechselrichter), fuse and breaker sizing, or any kind of camper electrical planning. Also use this skill when another skill (for example a camper electrical advisor / sizing algorithm) needs the underlying physics, formulas and rules of thumb to compute recommendations from user input.

# Mobile Home Electrics – Basics

A formula-first knowledge base for the electrical system of mobile homes, camper vans, RVs, caravans and boats. It covers DC systems at 12 V, 24 V and 48 V, 230 V AC shore power, cables, batteries, solar, alternators and B2B chargers, inverters and protection.

This skill is a **reference** – it does not ask the user questions and does not make product recommendations. Its job is to give the model (or another skill) the correct physics and numbers so it can reason about a concrete camper setup.

## Who uses this skill

Two callers are expected:

1. **A human user** asking concrete questions ("what cross-section for 120 A at 3 m on 12 V?", "how big a battery for 1800 Wh/day on LiFePO4?"). Answer directly using the relevant reference file.
2. **Another skill** (for example an advisor algorithm that turns user input into recommended battery / solar / charger sizes). That skill will read this one for formulas, tables and derating factors and then do the arithmetic itself. Keep all numeric data in clean, copy-pasteable form so it works in both cases.

## How to use this skill

1. Identify the topic of the question (cables, battery, solar, alternator, inverter, shore power, protection, or choice of system voltage).
2. Open the matching file in `references/`. Each file starts with the core formula and a minimal worked example, then lists derating factors, typical ranges, bilingual EN/DE terms, and inline safety notes.
3. If the question spans several topics (e.g. "size a full 12 V solar + LiFePO4 system"), read the relevant files and combine the formulas. Do not guess values you don't have – open the reference.
4. When numbers in the reference are given as a range, pick the conservative end unless the caller explicitly asked for optimistic/best-case values.

## Reference index


| File                           | Use when the question is about                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `references/system-voltage.md` | Choosing 12 V vs 24 V vs 48 V, consequences for cable size, inverter size, safety                           |
| `references/cables.md`         | Cable cross-section, voltage drop, ampacity, length, colours, connectors                                    |
| `references/batteries.md`      | Battery chemistry, usable capacity, DoD, C-rate, temperature, cycle life, sizing from Wh/day                |
| `references/solar.md`          | Solar irradiance by region/season, panel sizing, MPPT vs PWM, tilt/azimuth, shading                         |
| `references/alternator.md`     | Starter alternator output, smart/Euro-6 alternators, B2B (Ladebooster) sizing, cabling from starter battery |
| `references/inverter.md`       | Continuous vs peak power, efficiency, standby draw, pure sine vs modified, 12/24/48 V input                 |
| `references/shore-power.md`    | 230 V / 120 V AC input, CEE17 plug, RCD/FI, galvanic isolation, onboard charger sizing                      |
| `references/protection.md`     | Fuses and breakers: type, rating, placement, selectivity                                                    |
| `references/glossary.md`       | Consolidated EN/DE glossary and master table of formula symbols                                             |


## Conventions used in every reference file

To keep the numbers usable by both humans and a downstream algorithm, every file follows the same conventions.

- **SI units** unless noted: volt `V`, ampere `A`, watt `W`, watt-hour `Wh`, ohm `Ω`, metre `m`, millimetre-squared `mm²`, degree Celsius `°C`.
- **System voltage symbol** `U` in volts. **Current** `I` in amperes. **Power** `P` in watts. **Energy** `E` in watt-hours.
- **Cable length `L`** is the *one-way* length from source to load in metres. The round-trip length `2·L` is always handled explicitly inside the formula, never smuggled into `L`.
- **Cable cross-section `A*`* is in `mm²` (European convention). AWG equivalents are given in `cables.md` when relevant.
- **Conductor material** is copper (`ρ_Cu ≈ 0.0178 Ω·mm²/m` at 20 °C) unless aluminium is explicitly mentioned.
- **Efficiency `η`** is a dimensionless factor between 0 and 1 (e.g. inverter efficiency `η = 0.92`). Percentages are converted to factors before being multiplied.
- **"Usable capacity"** of a battery means nominal capacity `C_nom` × permitted depth of discharge `DoD`. Never size loads against nominal capacity directly.
- **Irradiance / solar yield** is expressed as **peak sun hours per day (PSH)**, i.e. equivalent hours of 1000 W/m². Daily yield of a panel `E_day ≈ P_peak · PSH · η_system`.
- **Temperatures** are in °C. Where a derating curve is given, the reference temperature is 25 °C.
- **Safety margins**: for continuous DC loads, size cables and fuses for ≥ 1.25 × nominal current (see `protection.md`).

## Golden formulas (quick lookup)

These are the formulas most often needed. Full derivations, derating factors and examples are in the referenced file.

- **Ohm's law**: `U = I · R`
- **DC power**: `P = U · I`
- **Energy over time**: `E = P · t`
- **Cable resistance (copper, one-way length L, cross-section A)**:
`R = ρ · L / A`, with `ρ_Cu = 0.0178 Ω·mm²/m`
- **Voltage drop on a DC cable (round-trip)**:
`ΔU = 2 · L · I · ρ / A`
→ solve for cross-section: `A_min = 2 · L · I · ρ / ΔU_max`
See `references/cables.md`.
- **Required usable battery capacity from daily load**:
`C_usable [Wh] = E_day / (η_inv · η_wiring)` and `C_nom [Wh] = C_usable / DoD`
Convert to Ah at system voltage `U`: `C_nom [Ah] = C_nom [Wh] / U`.
See `references/batteries.md`.
- **Solar array size for a target daily yield**:
`P_peak [Wp] = E_day / (PSH · η_system)` with `η_system ≈ 0.7–0.85` for a typical MPPT + LiFePO4 camper system.
See `references/solar.md`.
- **B2B (Ladebooster) current on the starter side**:
`I_start ≈ P_booster / U_start · 1/η_booster`, typically `η ≈ 0.9`.
See `references/alternator.md`.
- **Inverter DC input current at full load**:
`I_dc = P_ac / (U_dc · η_inv)`. Cable and fuse are sized from `I_dc`.
See `references/inverter.md`.

## What this skill deliberately does *not* contain

- **Appliance consumption values** (fridge, heater, pump, laptop, …). That is the job of the advisor-algorithm skill.
- **Product or brand recommendations.** Same reason.
- **Installation step-by-step instructions.** This is a reference, not a how-to.
- **Legal / homologation rules** (e.g. German "Elektrofachkraft" requirement for 230 V work). Mention that such rules exist but do not try to enumerate them per country.

## Notation for calculations in responses

When answering a concrete calculation question, show the work compactly so the caller can verify and so a downstream algorithm can parse it:

```
Given:   U = 12 V, I = 100 A, L = 3 m, ΔU_max = 3 % · 12 V = 0.36 V
Formula: A_min = 2·L·I·ρ / ΔU_max
         = 2 · 3 · 100 · 0.0178 / 0.36
         = 29.7 mm²
Result:  choose next standard size ≥ 29.7 mm² → 35 mm²
```

Always in this order: `Given:` (inputs with units), `Formula:` (symbolic), the substituted formula with numbers, the intermediate result, `Result:` (final recommendation, rounded to the next standard size where applicable). The `Given:` and `Result:` labels are the anchors a consumer skill can parse — keep them literally.

## Contract for consumer skills (e.g. a sizing algorithm)

This section is what a downstream skill (for example an advisor that turns user answers into recommended component sizes) should rely on. Keep the contract stable.

### Minimal user inputs a full sizing needs

A complete sizing needs answers to all of these. If any is missing, ask the user — do not guess.

- `U_system` — system voltage (12 / 24 / 48 V). Default: 12 V for vans, 24 V for larger motorhomes / boats, 48 V for inverters ≥ 5 kW (see `references/system-voltage.md`).
- `E_day_dc [Wh/day]` — daily energy delivered directly from the battery as DC (fridge, lights, pump, DC fans, diesel heater controller).
- `E_day_ac [Wh/day]` — daily energy delivered through the inverter as AC (laptop via charger, coffee machine, microwave, etc.). Include inverter standby separately per `references/inverter.md`.
- `chemistry` — `LiFePO4` (default) | `AGM` | `Gel` | `Flooded` | `NMC`.
- `climate_zone` / `PSH_winter` / `PSH_summer` — either a named region from the table in `references/solar.md`, or explicit peak sun hours.
- `drive_hours_per_day` — how many hours per day the engine runs on travel days (used for B2B energy, see `references/alternator.md`).
- `shore_availability` — one of `never` / `occasional` / `nightly` / `full-time`.
- `ambient_temperature_range` — °C min/max of the battery compartment (the 0 °C LFP charge limit and the cable derating depend on this).

### Output format the consumer skill should parse

For every sub-calculation, emit the block shown above with `Given:` and `Result:`. For a full system sizing, aggregate into this structure (plain text, one item per line, so it is trivial to parse):

```
System voltage:      U_system = 12 V
Battery:             C_nom = 220 Ah LiFePO4  (usable 176 Ah @ 80 % DoD)
Solar array:         P_peak = 500 Wp         (flat roof, PSH 3.0, η_system 0.75)
B2B charger:         50 A   (draws ~56 A from 12 V alternator)
Shore charger:       30 A
Inverter:            2000 W continuous / 4000 W peak, pure sine
Main battery fuse:   250 A Class T
Battery→inverter:    50 mm² × 1 m, 250 A Class T fuse
Battery→busbar:      35 mm² × 1.5 m, 200 A MRBF/ANL fuse
```

### Rounding rules the consumer skill should apply

- **Cable cross-section**: next standard metric size up (1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120 mm²). Never round down.
- **Battery capacity**: next 10 Ah up for packs ≤ 200 Ah, next 25 Ah up above that.
- **Fuse rating**: next standard rating up that is ≤ cable ampacity. See `references/protection.md`.
- **Solar Wp**: round up to the next panel size the user actually plans to buy (typically 100 Wp increments).
- **Inverter**: round up to the next standard rating (800, 1200, 1500, 2000, 2500, 3000, 5000 W) and verify peak ≥ 2× continuous for motor loads.

### When to refuse or defer

This skill **does not** produce appliance consumption estimates, brand / product picks, installation step-by-steps, or country-specific legal homologation rules. If a user question is only about those, say so and redirect to the appropriate skill or a qualified electrician.