# System voltage: 12 V vs 24 V vs 48 V

## Core idea

Power is `P = U · I`. For the same load power, doubling the system voltage halves the current. Current drives cable thickness, fuse size, connector cost and voltage drop. So the system voltage choice is really a choice about **how much copper and how many amps you want to push around the vehicle**.

## Rule of thumb

- **12 V** – default for vans and small campers with loads up to roughly 1.5–2 kW of AC output (inverter) and battery banks up to about 300 Ah usable. Everything in the camper aftermarket exists in 12 V.
- **24 V** – sweet spot for larger motorhomes, expedition trucks, boats and systems with inverters of 2–5 kW. Half the current, thinner cables, smaller fuses, often cheaper MPPT regulators for a given solar array size.
- **48 V** – used on large expedition vehicles, off-grid-style builds and whenever the inverter is ≥ 5 kW or the solar array ≥ ~2 kWp. LiFePO4 server-rack batteries and hybrid inverters come from the home-storage world and are cheap per kWh, but the 12 V ecosystem (fridges, pumps, LED lights) still needs a DC-DC converter.

## Consequences of doubling the voltage

For the same load power `P`:

- **Current** halves: `I_new = I_old / 2`.
- **Voltage drop** on the same cable quarters: `ΔU ∝ I` at constant `A`, and the allowed `ΔU_max` itself doubles (same % of a doubled `U`), so the *minimum required cross-section* scales as `A_new = A_old / 4`.
- **I²R losses** in the cable quarter: `P_loss = I² · R`.
- **Fuse ratings** halve; MCB / NH-fuse availability is better at lower currents.
- **Inverter DC input current** halves – a 3 kW inverter pulls ~250 A on 12 V, ~125 A on 24 V, ~62 A on 48 V.

## Worked example: inverter input current

3 kW inverter at 90 % efficiency:

```
I_dc = P_ac / (U_dc · η)
12 V:  3000 / (12 · 0.9) = 278 A
24 V:  3000 / (24 · 0.9) = 139 A
48 V:  3000 / (48 · 0.9) =  69 A
```

On 12 V the battery-to-inverter cable is typically 50–70 mm² over 1–1.5 m and fused at 300–350 A. On 48 V the same inverter runs on 16 mm² and a 100 A fuse.

## When to pick which


| Symptom / requirement                                                          | Pick                                                   |
| ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Stock camper van, factory 12 V appliances, inverter ≤ 2 kW                     | 12 V                                                   |
| Large motorhome, inverter 2–5 kW, long runs to rear battery bank               | 24 V                                                   |
| Induction cooking full-time, air conditioner, inverter ≥ 5 kW, big solar array | 48 V                                                   |
| Boat with long cable runs (bow thruster, windlass)                             | 24 V or 48 V                                           |
| Integration with existing 12 V starter/alternator battery                      | any, but add a B2B (Ladebooster) – see `alternator.md` |


## Cross-voltage coupling

- **Starter battery is almost always 12 V** (24 V only on trucks). Charging a 24 V or 48 V house bank from a 12 V alternator requires a **step-up B2B / Ladebooster**.
- **12 V loads on a 24 V or 48 V system** need a DC-DC converter. Size it for peak, not average, and add headroom for inrush (water pump, compressor fridge startup).
- **Solar can bridge voltages for free**: a 120 V panel string into an MPPT charger can charge a 12, 24 or 48 V battery – the charger does the conversion.

## Safety notes (inline)

- **DC arcs do not self-extinguish** like AC arcs. Higher DC voltage means more dangerous switching; at 48 V, use DC-rated switches and fuses, never AC-only parts.
- **SELV boundary is 60 V DC** in dry conditions (IEC 61140). 12 / 24 / 48 V nominal are all below it, but 48 V LiFePO4 tops out around 58 V when charging – still SELV, but close.
- **Lithium 48 V packs** are often 16S LiFePO4 (nominal 51.2 V, charge 58.4 V). Match the inverter/charger window.

## Bilingual terms


| EN                              | DE                                |
| ------------------------------- | --------------------------------- |
| System voltage                  | Systemspannung, Bordspannung      |
| House battery / leisure battery | Aufbaubatterie, Bordbatterie      |
| Starter battery                 | Starterbatterie                   |
| DC-DC converter                 | Gleichspannungswandler            |
| Step-up / step-down             | Hochsetzsteller / Tiefsetzsteller |


