# Inverter (DC → AC, Wechselrichter)

## Core formulas

Inverter DC input current at a given AC output power:

```
I_dc = P_ac / (U_dc · η_inv)
```

Typical inverter efficiency at ~50–70 % load: `η_inv ≈ 0.88–0.93`. Efficiency drops at very light load (idling losses dominate) and at > 90 % load (switching + thermal). Datasheet curves are usually U-shaped.

Battery energy consumed by an AC load running for time `t`:

```
E_dc [Wh] = P_ac · t / η_inv
```

Standby (no-load) consumption of the inverter itself:

```
E_standby [Wh/day] = P_standby · t_on [h/day]
```

Typical `P_standby`: 5–25 W for a 1–3 kW pure-sine inverter. Worst case (inverter left on 24 h) this is **120–600 Wh/day** – often more than the actual AC load. Realistic camper use:

- Inverter left on 24 h: `t_on = 24 h` (use this as the default for sizing unless the user confirms otherwise).
- Inverter switched off when idle, on only for specific loads: `t_on ≈ 2–6 h/day`, standby becomes ~10–150 Wh/day.
- Inverter with "eco / search" mode: draws `P_standby` only a few hundred ms every 1–3 s while searching, then full `P_standby` when a load is detected. Count it as `~0.2 · P_standby · 24 h` as a rough average.

The sizing algorithm should pick the scenario explicitly and either bake standby into the daily load or recommend a remote on/off switch, because it is the single most often ignored draw in camper systems.

## Continuous vs peak power

An inverter has two ratings:


| Rating                    | Meaning                                            |
| ------------------------- | -------------------------------------------------- |
| **Continuous** `P_nom`    | Can be delivered indefinitely at rated temperature |
| **Peak / surge** `P_peak` | 3–10 seconds for motor startup, capacitor charging |


Electric motors (fridge compressor, water pump, circular saw, hair dryer on high) draw 3–7× their running power at startup. A 1000 W hair dryer is fine on a 1500 W inverter; a 800 W refrigerator compressor may need a 2000 W inverter because of startup surge.

### Worked example: sizing an inverter for a mixed load

Loads on a camper: induction hob 1800 W, microwave 900 W (peak ~1400 W), coffee machine 1200 W, laptop 60 W.

- Peak *simultaneous* load is usually just one appliance at a time (you don't run induction and microwave together). Size continuous = largest single load ≈ **2000 W**.
- Inrush: microwave fan + transformer → peak ≈ 2000 W for 200 ms. Need peak rating ≥ 2500 W.
- **Pick a 2000 W continuous / 4000 W peak pure-sine inverter.**

DC current at 12 V full load:

```
I_dc = 2000 / (12 · 0.9) = 185 A
```

Cable & fuse from `cables.md` + `protection.md`: 50 mm² over < 1 m, 250 A fuse. This is the main reason large inverters push you to 24 V or 48 V – see `system-voltage.md`.

## Pure sine vs modified sine


|                 | **Pure sine**            | **Modified sine**                                                                                                              |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Waveform        | Sinusoidal, same as grid | Stepped square wave                                                                                                            |
| Compatible with | Everything               | Resistive loads (bulbs, heaters), some motors                                                                                  |
| Problems with   | –                        | Inductive motors run hot, switch-mode power supplies buzz, modern LED bulbs flicker/die, medical devices, CPAP, laser printers |
| Efficiency      | 88–94 %                  | 90–95 %                                                                                                                        |
| Cost            | 1×                       | 0.5×                                                                                                                           |


**Camper default: pure sine.** Modified sine is a false economy on any modern vehicle.

## Inverter / charger combinations

Many camper inverters are actually **inverter-chargers** (e.g. Victron MultiPlus, Mastervolt Combi): they provide inverter function when off-grid and become a shore-power charger + transfer switch when 230 V is connected. Key extra parameters:


| Parameter              | What it is                                                                    | Why it matters                                                                        |
| ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Transfer time          | ms to switch from shore to inverter output on power loss                      | 10–20 ms (UPS-grade) keeps laptops and fridges running; 40+ ms causes clocks to reset |
| PowerAssist / boost    | Inverter adds power on top of shore feed when appliance exceeds shore breaker | Lets a 6 A (1.4 kW) CEE hookup run a 2 kW kettle without tripping                     |
| Charger stage          | Bulk/absorption/float curve                                                   | Must match house-bank chemistry (`batteries.md`)                                      |
| Charger output current | A at battery voltage                                                          | ≤ 0.5 C for LFP drop-ins                                                              |


## Losses the sizing algorithm must account for

1. **Conversion loss**: `(1 − η_inv)` of every AC watt-hour comes out of the battery as heat.
2. **Standby loss**: `P_standby · 24 h` per day, every day the inverter is on.
3. **DC cable loss**: `I_dc² · R_cable`, negligible if cable is sized properly (< 3 % drop).
4. **Start-up draw**: for large inverters, the capacitor pre-charge draws a pulse that a small fuse/switch won't tolerate – use inverter-specific pre-charge resistor or DC breaker with pre-charge.

## Inverter input voltage windows

The inverter will cut off outside its window:


| System | Low cut-off                                    | High cut-off |
| ------ | ---------------------------------------------- | ------------ |
| 12 V   | 10.5 V (default), adjustable to 11.0 V for LFP | 16.0 V       |
| 24 V   | 21.0 V                                         | 32.0 V       |
| 48 V   | 42.0 V                                         | 64.0 V       |


For LFP banks, raise the low cut-off slightly above the BMS low-voltage cut-off so the inverter stops *before* the BMS opens (cleaner shutdown).

## Grounding and earth-neutral bonding on the AC output

This is a subtle but important topic. An inverter producing 230 V AC needs a neutral–earth bond somewhere, otherwise an RCD downstream cannot detect earth faults. Inverter-chargers typically handle this with an **internal ground relay** that closes in inverter mode and opens in shore mode (so you don't create a parallel neutral path). Details belong in the installation manual; the algorithm should just know: **an RCD downstream of the inverter is necessary** (see `shore-power.md`).

## Safety notes (inline)

- **Capacitor pre-charge**: connecting a large inverter (> 1.5 kW) directly with a switch can weld the contacts. Use a pre-charge resistor or a DC breaker rated for inverter use.
- **Heat dissipation**: inverters need airflow on all ventilation grilles. Mounting in a sealed cabinet under the bed is a classic failure mode.
- **Never parallel two inverters** not designed for parallel operation. Waveforms won't sync → short-circuit.
- **Do not connect an inverter AC output and shore power at the same time** without a proper transfer switch or inverter-charger – back-feeding the shore side can electrocute someone else on the pedestal.

## Bilingual terms


| EN                            | DE                                    |
| ----------------------------- | ------------------------------------- |
| Inverter                      | Wechselrichter                        |
| Inverter-charger              | Wechselrichter-Ladegerät, Kombi-Gerät |
| Pure sine wave                | reiner Sinus                          |
| Modified sine wave            | modifizierter Sinus, Trapezsinus      |
| Standby / no-load consumption | Standby-Verbrauch, Leerlaufverbrauch  |
| Transfer switch               | Netzumschalter, Netzvorrangschalter   |
| Continuous / peak power       | Dauerleistung / Spitzenleistung       |


