# Alternator and B2B charger (Ladebooster)

## Core idea

The vehicle's alternator charges the starter battery. To also charge the house (leisure) battery **while driving**, three approaches exist:

1. **Direct parallel** via a relay/VSR (voltage-sensitive relay) or split-charge diode. Simple, cheap, **fails on Euro-6 smart alternators** and cannot boost voltage – only suitable for lead-acid house banks on old vehicles.
2. **B2B charger / DC-DC charger / Ladebooster**. Takes whatever the alternator gives (even 12.3 V on a smart alt) and produces a proper multi-stage charge curve at the required house-bank voltage. **Default choice for modern campers, and mandatory for LiFePO4 house banks.**
3. **Inverter + mains charger** (drive → run inverter → charge). Double conversion, poor efficiency, ignore.

## Core formula: starter-side current drawn by a B2B

A B2B rated for `I_out` at the house-bank voltage `U_house` draws from the starter side (alternator):

```
I_in = (U_house · I_out) / (U_start · η_B2B)
```

with `η_B2B ≈ 0.88–0.92` for modern units.

For a 12 V → 12 V B2B this simplifies to roughly `I_in ≈ I_out / 0.9` – i.e. a 50 A output B2B draws ~55 A from the alternator. On a 24 V or 48 V house bank the starter-side current **is higher** than the output current.

### Worked examples

**50 A / 12 V B2B, 12 V alternator:**

```
I_in = (12 · 50) / (12 · 0.9) = 55.6 A
```

At the starter battery, ~55 A over 4 m of cable → need ≥ 16 mm² at 3 % drop (see `cables.md`). Fuse the starter end at 70–80 A.

**40 A / 24 V B2B fed from a 12 V alternator:**

```
I_in = (24 · 40) / (12 · 0.9) = 89 A
```

This is the case that surprises DIY builders: charging a 24 V bank at 40 A costs **90 A on the starter side**. The cable from starter battery must be correspondingly heavy (35–50 mm²).

## How big should the B2B be?

Three constraints, pick the *smallest*:

1. **What the alternator can give continuously without overheating.** Alternator nameplate amps (e.g. 150 A) are *peak cold*; continuous output at under-hood temperature is ~50–70 % of that. Consumer B2Bs of 30, 50, 60 A per alternator are usually safe. Follow the vehicle manufacturer's limit – modern vans often specify a max auxiliary draw (e.g. Mercedes Sprinter: 30–40 A auxiliary circuit).
2. **What the house battery can accept continuously.** Max charge C-rate from `batteries.md`:
  - LiFePO4 drop-in, 0.5 C → 100 Ah battery accepts 50 A
  - AGM, 0.3 C → 100 Ah battery accepts 30 A
3. **What your cable and fuse route to the alternator can carry.** If the cable run from starter to house area is long and thin, that caps the realistic B2B size. Upgrading this cable is often the most expensive part of an alternator-charging upgrade.

### Rule of thumb table


| House battery | Drive time per day | Practical B2B size (12 V alt → 12 V house) |
| ------------- | ------------------ | ------------------------------------------ |
| 100 Ah LFP    | 1 h                | 30 A                                       |
| 200 Ah LFP    | 1 h                | 50 A                                       |
| 200 Ah LFP    | 2 h                | 30 A                                       |
| 300 Ah LFP    | 2 h                | 50 A                                       |
| 400 Ah LFP    | 2 h                | 60–80 A (check alternator!)                |
| 200 Ah AGM    | 2 h                | 30 A (charge acceptance is the limit)      |


Energy delivered while driving:

```
E_drive [Wh] = I_out · U_house · t_drive · η_B2B
```

A 50 A / 12 V B2B running for 1 h delivers roughly `50 · 12 · 1 · 0.9 ≈ 540 Wh`. Two hours of driving covers about 1 kWh of house energy – a useful number for the sizing algorithm.

## Smart (variable-voltage / Euro-6) alternators

Since roughly 2014 most European diesel vans run a "smart" alternator that:

- Regulates voltage as low as 12.3 V during cruise to reduce mechanical load on the engine (CO₂ saving).
- Spikes to 14.8 V during deceleration (recuperation).
- Is managed by the engine ECU; the battery sensor (IBS) must continue to see the original starter battery state.

Consequences:

- **A simple VSR/parallel connection will never reliably charge the house bank** – voltage is too low too often.
- **A B2B is required** and must be wired according to the manufacturer's instructions for smart alternators, usually with a D+ / ignition-sense trigger so the B2B only runs when the engine is running.
- **Never tap the IBS (battery sensor) circuit**; it lies to the ECU and can cause fault codes or battery-protection cutoffs.

## Cabling the starter-to-house feed

- Cross-section from `cables.md` based on peak `I_in` computed above and the full one-way length along the vehicle.
- **Fuse at both ends**: one close to the starter battery (protects the long cable), one close to the B2B input (protects the B2B).
- **Ground path**: use chassis for the return only if the chassis is genuinely bonded between cab and habitation. For motorhomes with a non-metallic habitation floor or for boats, run a dedicated return conductor of the same cross-section.

## Alternator vs solar vs shore – where the algorithm should prefer what


| Scenario                                   | Dominant charge source                               |
| ------------------------------------------ | ---------------------------------------------------- |
| Parked for days, summer, south of the Alps | Solar                                                |
| Driving every day, any season              | Alternator / B2B                                     |
| Campground with hookup                     | Shore power (230 V)                                  |
| Winter, parked, north of the Alps          | Shore power (planning), or drive to "harvest" energy |


The algorithm should expose all three as input sliders (driving hours/day, sun exposure, shore-power availability) and *combine* them, never assume only one.

## Safety notes (inline)

- **Do not parallel a LiFePO4 house bank with a lead-acid starter battery via a simple VSR.** The LFP will dump current into the starter at a rate that can melt the contactor and over-discharge itself.
- **Fuses on both ends of a long battery-to-battery cable.** A chafe in the middle of the cable without a fuse at the starter end is a guaranteed engine-bay fire.
- **Cable routing**: away from exhaust, fuel lines, sharp edges; use grommets at every panel pass-through.
- **Trigger wire (D+ / ignition)** must be properly fused and not confused with the power path.

## Bilingual terms


| EN                               | DE                                               |
| -------------------------------- | ------------------------------------------------ |
| Alternator                       | Lichtmaschine                                    |
| Smart / Euro-6 alternator        | intelligente Lichtmaschine, Euro-6-Lichtmaschine |
| Starter battery                  | Starterbatterie                                  |
| House / leisure battery          | Aufbaubatterie, Bordbatterie                     |
| B2B charger / DC-DC charger      | Ladebooster, Ladewandler                         |
| VSR / split-charge relay         | Trennrelais                                      |
| Ignition sense / D+              | D+-Klemme, Zündungsplus                          |
| IBS (intelligent battery sensor) | intelligenter Batteriesensor                     |


