# Solar: irradiance, panel sizing, MPPT vs PWM

## Core formulas

Solar yield is modelled with **peak sun hours (PSH)** per day – the number of equivalent hours of 1000 W/m² that reach the panel's plane on an average day. PSH is numerically identical to the daily global irradiation on the panel plane expressed in **kWh/m²/day**.

Daily energy produced by a panel of peak power `P_peak` (Wp):

```
E_day [Wh] = P_peak [Wp] · PSH [h/day] · η_system
```

Solving for the required array size to cover an energy demand `E_day`:

```
P_peak [Wp] = E_day / (PSH · η_system)
```

System efficiency factor `η_system` bundles real-world losses:


| Loss source                        | Typical factor                                    |
| ---------------------------------- | ------------------------------------------------- |
| Module temperature (panel > 25 °C) | 0.88–0.93                                         |
| Soiling (dust, pollen, rain spots) | 0.95–0.98                                         |
| Cable + connector losses           | 0.97–0.99                                         |
| MPPT tracker efficiency            | 0.96–0.98                                         |
| Battery charge acceptance          | 0.95 (LFP) / 0.85 (lead-acid)                     |
| Mismatch / partial shading         | 0.90–0.98 (catastrophic if unmanaged – see below) |
| **Product, typical camper roof**   | **≈ 0.70–0.80**                                   |


**Use `η_system = 0.75` as the default** for a flat-mounted camper array with a good MPPT and LFP battery, unless you know otherwise. Drop to 0.60 if the roof is partially shaded by sat dome / AC unit / roof rack.

## Peak sun hours (PSH) by region and season

Daily average irradiation on a horizontal plane, kWh/m²/day (≈ PSH). For a roof-mounted flat array on a camper these values are realistic. Add ~15 % in winter if you can tilt panels 30–45°; subtract 10–20 % in summer from the same tilt.


| Region                                   | Winter (Dec–Feb) | Spring/Autumn | Summer (Jun–Aug) | Annual avg |
| ---------------------------------------- | ---------------- | ------------- | ---------------- | ---------- |
| Scandinavia (60–65° N)                   | 0.2–0.6          | 2.5–4.0       | 4.5–5.5          | ~2.5       |
| Northern Europe (50–55° N, UK, NL, N-DE) | 0.5–1.0          | 2.5–4.0       | 4.5–5.5          | ~2.7       |
| Central Europe (DE, AT, CH, 47–51° N)    | 0.8–1.3          | 3.0–4.5       | 5.0–6.0          | ~3.0       |
| Alps (mountain, altitude bonus)          | 1.2–1.8          | 3.5–5.0       | 5.5–6.5          | ~3.5       |
| Southern Europe (ES, IT, south of 45° N) | 1.8–2.5          | 4.5–6.0       | 6.0–7.5          | ~4.5       |
| Morocco / Tunisia / Canary Is.           | 3.5–4.5          | 5.5–6.5       | 6.5–8.0          | ~5.5       |
| Sahara interior                          | 4.5–5.5          | 6.5–7.5       | 7.5–8.5          | ~6.5       |
| US Northeast / PNW                       | 0.8–1.5          | 3.0–4.5       | 5.0–6.0          | ~3.0       |
| US Southwest (AZ, NV, CA desert)         | 3.0–4.0          | 5.5–7.0       | 7.0–8.5          | ~6.0       |
| Australia (south, Vic/Tas)               | 2.0–3.0          | 4.0–5.5       | 6.0–7.0          | ~4.5       |
| Australia (outback)                      | 4.5–5.5          | 6.0–7.0       | 7.0–8.0          | ~6.0       |


Values are approximate averages of long-term datasets (PVGIS-SARAH, NASA POWER). For a specific location the tool of choice is **PVGIS** (Europe/Africa) or **NREL NSRDB** (Americas).

### The winter problem

The drop from summer to winter in central Europe is **~5×**. A camper system sized for July will *not* cover daily consumption in December if you're north of the Alps. Two realistic reactions for the algorithm:

1. **Size for shoulder season** (March / October PSH ≈ 3) and accept shore-power / driving top-ups in midwinter.
2. **Size for full autonomy** only up to a chosen latitude / date and tell the user explicitly.

## Worked examples

### Size an array for summer autonomy in central Europe

`E_day = 1800 Wh`, summer PSH = 5.0, `η_system = 0.75`:

```
P_peak = 1800 / (5.0 · 0.75) = 480 Wp
```

Round up → 500–600 Wp typical camper roof (two 300 Wp modules).

### Same demand, winter autonomy in central Europe

Winter PSH = 1.0:

```
P_peak = 1800 / (1.0 · 0.75) = 2400 Wp
```

That array doesn't fit on most camper roofs. Conclusion: winter autonomy from solar alone is unrealistic in central Europe – the algorithm must pair solar with a B2B charger (driving days) or shore power.

### Yield of a fixed 400 Wp system over the year, central Europe

Annual avg PSH ≈ 3.0, η_system 0.75:

```
E_year = 400 · 3.0 · 0.75 · 365 ≈ 329 kWh/year
```

## MPPT vs PWM


|                                         | **PWM**                                                               | **MPPT**                                                                  |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Principle                               | Switches panel directly to battery, clamps voltage to battery voltage | Tracks the panel's maximum power point, DC-DC converts to battery voltage |
| Efficiency vs. a maximum-power baseline | 60–75 % (loses the Voc–Vbat gap)                                      | 93–98 %                                                                   |
| Best for                                | Small systems (≤ 100 Wp), panel Voc matched to battery                | Anything ≥ 100 Wp, cold climates, higher-voltage strings                  |
| Cold-weather gain                       | None                                                                  | Big: panel Vmp rises in cold, MPPT captures it                            |
| Cost per Wp at 400 Wp array             | Roughly same as MPPT at this size                                     | Worth it                                                                  |


**Camper default: MPPT.** PWM only for very small trickle-charge setups.

### Sizing the MPPT

Three numbers matter:

1. **Maximum PV input voltage (`Voc @ Tmin`)**. In cold conditions Voc rises. Rule of thumb: `Voc_cold ≈ Voc_STC · 1.2`. The MPPT's max input must be ≥ `Voc_cold` of the string. Exceeding it is a warranty-void event.
2. **Maximum PV input current / power**. Choose `P_mppt_rated ≥ P_array_peak`. Over-paneling by 20–30 % is usually allowed (clipping) and improves yield in low light – check the controller's datasheet.
3. **Battery-side current**:
  ```
   I_out = P_array / U_battery
  ```
   That's the current rating you need (e.g. 400 Wp on 12 V ≈ 33 A → pick a 40 A MPPT).

## Wiring panels: series vs parallel

- **Series** raises voltage, keeps current the same. **Preferred** for camper roofs because lower current = thinner cable from roof to MPPT.
- **Parallel** keeps voltage (~20 V per 36-cell module), doubles current.
- **Partial shading**: in a series string, one shaded panel drags the whole string down unless modules have bypass diodes (all modern ones do, per cell-string). Campers with objects on the roof should prefer either small separate strings into separate MPPTs, or module-level optimisers.

## Tilt and orientation

The PSH table above assumes a horizontal panel (as mounted flat on a camper roof). Ideal tilt for a fixed installation is approximately equal to the latitude, adjusted seasonally. Practical camper gains:


| Orientation                                  | Yield vs horizontal, summer | Yield vs horizontal, winter |
| -------------------------------------------- | --------------------------- | --------------------------- |
| Flat (0°)                                    | 100 %                       | 100 %                       |
| Tilted 20°, facing sun                       | +5 %                        | +20 %                       |
| Tilted 45°, facing sun                       | −5 %                        | +40 %                       |
| Vertical on side of camper (winter sun-trap) | −30 %                       | +30–60 %                    |


All "facing sun" and "winter sun-trap" rows assume the user **actively aims the panel at the sun** (parks the camper with that side south-facing in the northern hemisphere, or rotates a portable panel through the day). Average over random parking orientations, those gains roughly halve. The sizing algorithm should assume flat yield unless the user explicitly commits to aiming the panels.

If the user parks facing the sun and tilts a portable panel, winter yield can roughly double – useful for planned winter stays, not for general sizing.

## Shading sensitivity

Because bypass diodes operate per cell-string (3 per 60/72-cell module), a single leaf on a module can cut its output by 1/3. Roof objects (sat dome, AC, roof rack, ladder) that cast a moving shadow during the day are more destructive than a fixed partial shade. Spread panels apart, avoid placing a panel in the shadow of the AC unit.

## Safety notes (inline)

- **PV strings are always live in daylight.** There is no "off" switch on a panel. Always work with the DC disconnect between array and MPPT open, and cover the panels with opaque material if crimping live connectors.
- **MC4 connectors must be matched brand** – different manufacturers' MC4-compatibles are not always safe to mate (contact resistance → heat → fire).
- **Cable colour**: both PV conductors are often black. Label polarity at both ends before connecting.
- **MPPT fuse on the battery side** is a cable protection fuse, not an over-current protection for the MPPT itself.

## Bilingual terms


| EN                          | DE                             |
| --------------------------- | ------------------------------ |
| Peak sun hours              | Volllaststunden                |
| Irradiance / irradiation    | Einstrahlung                   |
| Maximum power point         | Maximaler Leistungspunkt (MPP) |
| Solar charge controller     | Solarladeregler                |
| String                      | Strang                         |
| Bypass diode                | Bypass-Diode                   |
| Open-circuit voltage (Voc)  | Leerlaufspannung               |
| Short-circuit current (Isc) | Kurzschlussstrom               |


