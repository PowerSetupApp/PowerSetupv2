# Protection: fuses and breakers

## Core idea

**Fuses and breakers protect the *cable*, not the load.** A fuse's job is to open before the cable insulation melts. Pick the rating from the cable ampacity (see `cables.md`), not from the load current – although in practice you then verify the rating also covers the load.

Rule of selection:

```
I_load_continuous · 1.25  ≤  I_fuse  ≤  I_cable_ampacity
```

- The 1.25 factor is the standard derating for continuous loads (loads running > 3 h).
- If `I_fuse` computed this way exceeds cable ampacity, upsize the cable.

## Worked example

Inverter draws 185 A DC continuously at full power (see `inverter.md`). Cable: 50 mm² in free air, ampacity ~198 A.

```
I_fuse_min = 185 · 1.25 = 231 A
I_fuse_max = 198 A (cable ampacity)
```

Conflict: `231 > 198`. Cable is too small. Upsize to 70 mm² (ampacity ~245 A). Then fuse 250 A (next standard size between 231 and 245).

If the inverter's duty is **intermittent** (microwave peaks a few minutes at a time), the 1.25 factor may be dropped and the fuse can match the cable ampacity directly. Most camper inverter circuits run near-continuous though – size for continuous.

## Fuse types used in campers


| Type                                | Typical use                       | Breaking capacity | Notes                                                                                                                                    |
| ----------------------------------- | --------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Blade (ATO / ATC)**               | Distribution panels up to 30 A    | Low (~1 kA)       | Cheap, everywhere. Don't use above 30 A.                                                                                                 |
| **Midi / AMI**                      | 30–100 A DC                       | ~2 kA             | Screw-down, suitable for distribution                                                                                                    |
| **Mega / AMG**                      | 100–300 A DC                      | ~2 kA             | Battery main feeds up to 200 A                                                                                                           |
| **ANL / ANN**                       | 100–500 A DC                      | ~6 kA             | Inverter / windlass / battery main                                                                                                       |
| **Class T**                         | 100–400 A DC                      | **20 kA**         | Strongly recommended as the LiFePO4 battery terminal fuse — a large LFP's short-circuit current can exceed ANL's ~6 kA breaking capacity |
| **NH (DIN gG/aM)**                  | 100–1000 A DC                     | 50 kA             | Industrial, used on large 48 V banks                                                                                                     |
| **MCB (thermal-magnetic)**          | AC branch circuits 6–32 A         | per curve         | `shore-power.md`                                                                                                                         |
| **DC breaker (magnetic, DC-rated)** | Disconnect + protection, 30–300 A | DC-specific       | Polarity-sensitive on some models                                                                                                        |


### Why Class T matters for lithium

A 200 Ah LiFePO4 battery can deliver well over 5000 A into a dead short for a brief time. An ANL fuse rated at 6 kA breaking capacity may arc-through under that current instead of clearing — the fuse still exists afterwards but the short is not interrupted. Class T is rated for 20 kA and clears cleanly.

The practical consequence: for LFP banks of roughly 100 Ah and larger, use a Class T (or an equivalent NH/gG industrial fuse on big 48 V banks) at the battery + terminal. ANL is acceptable only on smaller banks whose realistic short-circuit current stays well under 6 kA. If in doubt, look up the cell datasheet's short-circuit current and compare it to the fuse's breaking capacity — that is the number that decides, not tradition.

## Placement rules

1. **As close to the source of energy as physically possible.** Rule of thumb: ≤ 30 cm from the battery positive terminal, ≤ 17 cm / 7 inches if the cable is unprotected (ABYC marine rule, useful for campers too).
2. **One fuse per cable, at the cable's source.** If a cable leaves a battery and runs to a busbar, fuse at the battery. Each downstream cable from the busbar gets its own fuse at the busbar.
3. **Fuse both ends of a long cable that connects two energy sources** (e.g. starter battery to house bank via B2B – see `alternator.md`). Each end can be the source of a fault current into the other.
4. **Grounded (negative) side is not fused** in a chassis-negative vehicle system. Fuse only the positive conductor.
5. **The main battery switch (disconnect)** goes between battery + and the main fuse, or between main fuse and the main busbar – manufacturer-dependent. Isolate before touching anything.

## DC vs AC breakers

An AC MCB cannot safely interrupt a DC fault – AC arcs self-extinguish at every zero crossing, DC arcs don't. A household 10 A B-curve MCB used on a 12 V DC circuit may weld shut on a short. **Use DC-rated breakers on DC circuits**, period.

Typical DC disconnects for camper use: Blue Sea / Victron battery switches (300–600 A continuous, DC-rated), magnetic-hydraulic breakers (e.g. Eaton Bussmann, E-T-A).

## Selectivity (nice-to-have)

"Selectivity" means a downstream fault opens only the nearest fuse, not the main fuse. In campers this is rarely a design goal – most installations are small enough that a main-fuse trip during a fault is acceptable. Two guidelines if you do want selectivity:

- Main fuse should be 1.6–2× the largest branch fuse.
- Faster-acting fuse class on branches, slower (time-delay) on the main.

## Summary table: typical fuse sizing in a camper


| Circuit                                      | Typical fuse                                          |
| -------------------------------------------- | ----------------------------------------------------- |
| Main battery + to busbar, 200 Ah LFP         | 200–250 A Class T                                     |
| Inverter 2 kW / 12 V                         | 250 A ANL or Class T                                  |
| Inverter 3 kW / 24 V                         | 200 A ANL or Class T                                  |
| B2B 50 A @ 12 V output                       | 70 A Midi (both ends of feeder)                       |
| Solar MPPT 50 A battery side                 | 60 A Midi                                             |
| Solar string input (per string)              | 15–20 A string fuse (only if > 2 strings in parallel) |
| Fridge (compressor, 8 A running, 20 A surge) | 15 A blade                                            |
| Water pump                                   | 7.5 or 10 A blade                                     |
| LED lighting bus                             | 5 or 10 A blade                                       |
| 12 V socket outlet (cigarette lighter)       | 15 A blade                                            |
| Shore inlet 16 A CEE                         | 16 A MCB B-curve (AC)                                 |
| Individual AC circuit                        | 6 or 10 A MCB B-curve (AC)                            |


## Safety notes (inline)

- **Every positive cable from a battery must be fused.** No exceptions, including "temporary" connections during installation.
- **Do not replace a blown fuse with a larger one.** A blown fuse is almost always the symptom of a real fault; increasing the rating converts a fuse event into a fire event.
- **Label every fuse** with circuit name and date of installation – a stranger (mechanic, partner, rescue crew) will need to find it.
- **Check fuse DC voltage rating.** Many AC-rated fuses work at 32 V DC max; a 12 V or 24 V circuit fuse at 58 V DC (48 V LFP) is out of spec.
- **Use busbars, not daisy chains.** Connecting six fused loads by stacking lugs on the battery post overheats the contact and loses the safety benefit.

## Bilingual terms


| EN                       | DE                                        |
| ------------------------ | ----------------------------------------- |
| Fuse                     | Sicherung                                 |
| Circuit breaker          | Leitungsschutzschalter, Sicherungsautomat |
| Main fuse / battery fuse | Hauptsicherung, Batteriesicherung         |
| Disconnect switch        | Batterietrennschalter, Hauptschalter      |
| Breaking capacity        | Abschaltvermögen                          |
| Time-delay / slow-blow   | träge                                     |
| Fast-acting              | flink                                     |
| Busbar                   | Sammelschiene                             |


