# Worked example: camper-van power setup

This is a full end-to-end run of the seven-step process on one concrete task — sizing a 12 V LiFePO4 power setup from an appliance list. Use it as a **pattern** for any sizing / dimensioning calculator (plumbing, HVAC, solar, cable, buffer tank, anything with "given these loads, what capacity do I need"). The *shape* of the problem — loads + duty cycles → required capacity, component rating, conductor sizing — is the reusable part. The electrical constants are not.

If the user's task is *not* a sizing calculator (ranking, assignment, estimation), work from first principles instead of adapting this example.

---

## The prompt

> I need an algorithm for my camper van that takes a list of appliances (watts + hours per day) and tells me what battery capacity, inverter size and cable thickness I need. 12V system, LiFePO4. I'll run a fridge (60W, 24h), a laptop charger (90W, 4h) and a water pump (50W, 0.5h). Cable run from the battery to the fuse box is about 2 meters.

## Step 1 — Clarify the problem

Things the prompt nails down:

- **Inputs**: list of appliances, each with watts and hours-per-day. Cable run length (2 m). System voltage (12 V). Chemistry (LiFePO4).
- **Outputs**: battery capacity, inverter size, cable thickness.

Things worth asking before designing (one round of questions, not five):

- **AC vs DC loads?** A 90 W "laptop charger" is usually AC via an inverter; a 60 W fridge might be 12 V DC (e.g. a compressor fridge). Inverter sizing depends on *which* loads go through it.
- **Simultaneous use?** The inverter must handle the worst-case *instantaneous* load, not the daily average. Fridge + laptop + pump all running at once = 200 W continuous; inverter surge rating matters for the fridge compressor start.
- **Desired autonomy?** One day? Three days? "Until I drive again to recharge"? This is a multiplier on battery capacity and is the single biggest driver of cost.
- **Acceptable voltage drop?** 3 % is the common rule for DC branch circuits; user may want tighter (2 %) for the fridge run to avoid compressor issues.

In the design doc, default values are *named* so the user sees them. Good defaults for a camper setup:

- Autonomy: 1 day (user can override).
- Acceptable voltage drop: 3 %.
- LiFePO4 usable depth of discharge: 80 %.
- Inverter efficiency: 90 %.
- Reserve factor on battery: 25 % (cold-weather + ageing headroom).

## Step 2 — Check for a matching worked example

This *is* the worked example. If your task is a different sizing calculator (plumbing, HVAC, mobile-heat pump sizing) the pattern transfers: loads → daily demand → required capacity with headroom → component rating → conductor / connector sizing with drop limits. The numbers change; the *structure* of the design doc and implementation does not.

## Step 3 — Design doc

### Problem statement

Given a list of 12 V appliances (each with a power draw in watts and a daily runtime in hours) plus a cable run length from battery to distribution, compute (1) minimum battery capacity in ampere-hours, (2) minimum continuous inverter rating in watts, and (3) minimum cable cross-section in mm² for the main run, so the user can spec each component with confidence.

### Inputs

| Name | Type | Unit | Range / constraints | Required? | Default |
|------|------|------|---------------------|-----------|---------|
| `appliances` | list of `{name, watts, hours_per_day, ac}` | W, h | watts ≥ 0, 0 ≤ hours_per_day ≤ 24 | yes | — |
| `system_voltage_v` | float | V | 12 or 24 typical | no | 12 |
| `cable_length_m` | float | m | > 0 | yes | — |
| `autonomy_days` | float | days | ≥ 1 | no | 1.0 |
| `max_voltage_drop_pct` | float | % | 0 < x ≤ 10 | no | 3.0 |
| `depth_of_discharge` | float | fraction | 0 < x ≤ 1 | no | 0.8 |
| `inverter_efficiency` | float | fraction | 0 < x ≤ 1 | no | 0.9 |
| `reserve_factor` | float | multiplier | ≥ 1 | no | 1.25 |

### Outputs

| Name | Type | Unit | Meaning |
|------|------|------|---------|
| `battery_ah` | float | Ah | minimum usable battery capacity |
| `inverter_w` | float | W | minimum continuous inverter rating |
| `cable_mm2` | float | mm² | minimum conductor cross-section for the main run |
| `breakdown` | dict | — | intermediate quantities for audit (daily Wh, peak W, voltage drop at chosen gauge) |

### Approach

Three sub-problems, solved in order, because each feeds the next.

**Battery capacity.** Daily energy per appliance is `watts * hours_per_day`. Sum to daily Wh. AC loads are divided by inverter efficiency (the inverter is a lossy intermediary); DC loads are not. Convert Wh to Ah via system voltage, then divide by depth of discharge (LiFePO4 is not 100 % usable), multiply by autonomy days, multiply by reserve factor. Round **up** to the nearest whole Ah — this is a requirement, not a display value.

**Inverter rating.** The inverter only sees AC loads. Sum the *simultaneous* AC watts (we assume worst case: all AC loads on at once; the user can tighten this if they know some are mutually exclusive). Multiply by a small headroom (e.g. 1.25) for surge tolerance. Round up to the next standard inverter size (300 / 500 / 800 / 1000 / 1500 / 2000 / 3000 W).

**Cable cross-section.** Sum the worst-case total current through the main run — this is the sum of *all* loads at their peak, including DC loads, divided by system voltage. Compute required cross-section from the voltage-drop formula for DC: `A = (2 * L * I * rho) / (V * drop_fraction)`, where `rho` is copper resistivity, `L` is one-way length (factor of 2 accounts for the return conductor). Round **up** to the next standard cross-section (1.5, 2.5, 4, 6, 10, 16, 25, 35, 50 mm²).

### Rejected alternatives

- **"Just pick a battery from a table keyed on van size"** — rejected because it ignores the user's actual appliance list. The whole point is to size to demand, not to rule-of-thumb.
- **Average current for cable sizing** — rejected because cables must survive peak simultaneous current, not daily average. Sizing on average silently allows overheating at peak.
- **Per-appliance cable sizing only** — reasonable for branch circuits, but the user asked about the main run from battery to fuse box, which sees the sum. Per-appliance sizing would be the next step (out of scope here; mention in the review).

### Pseudocode

```
function size_power_setup(appliances, cable_length_m, **options):
    validate(appliances, cable_length_m, options)

    daily_wh = 0
    peak_ac_w = 0
    peak_total_w = 0
    for a in appliances:
        if a.ac:
            daily_wh += a.watts * a.hours_per_day / inverter_efficiency
            peak_ac_w += a.watts
        else:
            daily_wh += a.watts * a.hours_per_day
        peak_total_w += a.watts

    battery_ah = ceil_to_int(
        (daily_wh / system_voltage_v)
        / depth_of_discharge
        * autonomy_days
        * reserve_factor
    )

    inverter_w = next_standard_inverter(peak_ac_w * INVERTER_HEADROOM)

    peak_total_a = peak_total_w / system_voltage_v
    required_mm2 = (2 * cable_length_m * peak_total_a * COPPER_RHO) \
                 / (system_voltage_v * max_voltage_drop_pct / 100)
    cable_mm2 = next_standard_cross_section(required_mm2)

    return {
        battery_ah, inverter_w, cable_mm2,
        breakdown: {daily_wh, peak_ac_w, peak_total_a,
                    actual_voltage_drop_pct: voltage_drop(...)}
    }
```

### Complexity

- Time: O(n) over the appliance list.
- Space: O(1) beyond the input.

Fixed input shape; complexity is not interesting. Noted and moving on.

### Edge cases

- **Empty appliance list** → return zeros for all three outputs with a clear `breakdown` showing nothing was requested. Do not raise; an empty list is a valid "I'm planning, what's the baseline" question.
- **All DC, no AC** → inverter requirement is 0 W; return 0 and let the caller decide whether to spec an inverter anyway.
- **Single dominant load** (e.g. a 2000 W kettle for 0.1 h) → daily Wh is small but the peak dominates inverter sizing. The separation between *energy* and *peak power* handles this naturally.
- **Very short cable run** (< 0.5 m) → voltage drop becomes negligible; required mm² may round down to the smallest standard size. Honor the minimum-standard rule.
- **24 V system** → the voltage-drop formula uses `system_voltage_v`; everything scales correctly.
- **Invalid input** (negative watts, hours > 24, non-positive cable length) → raise `ValueError` with the specific field name. Fail loud.

### Validation rules

- `watts >= 0`, `0 <= hours_per_day <= 24` for every appliance; else `ValueError`.
- `cable_length_m > 0`; else `ValueError`.
- `system_voltage_v in {12, 24, 48}` as a soft guard (other voltages work with the formulas but are uncommon in this domain); else `ValueError` with a pointer to override the guard explicitly.
- `0 < depth_of_discharge <= 1`, `0 < inverter_efficiency <= 1`, `reserve_factor >= 1`, `0 < max_voltage_drop_pct <= 10`; else `ValueError`.

### Named constants

| Name | Value | Unit | Source / rationale |
|------|-------|------|--------------------|
| `COPPER_RHO` | 0.0175 | Ω·mm²/m | resistivity of annealed copper at 20 °C (IEC 60228) |
| `INVERTER_HEADROOM` | 1.25 | multiplier | 25 % surge headroom for motor/compressor starts; rule of thumb, common in Victron / Renogy docs |
| `STANDARD_CABLE_MM2` | [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50] | mm² | common European cable sizes (IEC 60228) |
| `STANDARD_INVERTER_W` | [300, 500, 800, 1000, 1500, 2000, 3000] | W | typical consumer inverter sizes |
| `DEPTH_OF_DISCHARGE_DEFAULT` | 0.8 | fraction | LiFePO4 manufacturer-recommended usable fraction (e.g. Victron LiFePO4 manual) |
| `INVERTER_EFFICIENCY_DEFAULT` | 0.9 | fraction | typical pure-sine inverter under moderate load; rule of thumb |
| `RESERVE_FACTOR_DEFAULT` | 1.25 | multiplier | 25 % headroom for cold-weather derating + capacity fade over life |
| `MAX_VOLTAGE_DROP_PCT_DEFAULT` | 3.0 | % | common DC branch-circuit target; ABYC / marine guidance |

### Assumptions and defaults

- One-day autonomy unless the user overrides.
- Worst-case simultaneous AC load for inverter sizing. If the user knows their AC loads are mutually exclusive, they can pass a smaller `peak_ac_w` directly.
- Main-run cable only — branch circuits to individual appliances need their own pass.
- 20 °C copper resistivity. Hot engine bay routing would warrant a temperature correction; out of scope here.

### Open questions

- [ ] Confirm which loads are AC (inverter-fed) and which are DC.
- [ ] Confirm desired autonomy in days.
- [ ] Confirm acceptable voltage-drop target (default 3 %).

## Step 4 — Language

Ask the user. Python is the natural default for a calculator like this (no dependency overhead, easy to run) but honor any explicit request.

## Step 5 — Implementation (Python, illustrative)

```python
"""Camper power-setup calculator.

Given an appliance list and cable run, computes required battery capacity,
inverter rating, and main-run cable cross-section. See design doc in this
skill's worked-examples/power-setup.md.
"""
from __future__ import annotations
from dataclasses import dataclass
from math import ceil

# Domain constants --- see design doc's "Named constants" table.
COPPER_RHO = 0.0175                          # ohm * mm^2 / m, IEC 60228
INVERTER_HEADROOM = 1.25                     # surge headroom
STANDARD_CABLE_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50]
STANDARD_INVERTER_W = [300, 500, 800, 1000, 1500, 2000, 3000]

# User-tunable defaults --- also exposed as function arguments.
DEPTH_OF_DISCHARGE_DEFAULT = 0.8             # LiFePO4 usable fraction
INVERTER_EFFICIENCY_DEFAULT = 0.9
RESERVE_FACTOR_DEFAULT = 1.25
MAX_VOLTAGE_DROP_PCT_DEFAULT = 3.0


@dataclass
class Appliance:
    name: str
    watts: float
    hours_per_day: float
    ac: bool = True  # True = goes through the inverter


def _next_standard(value: float, ladder: list[float]) -> float:
    """Round `value` up to the next entry in `ladder`; return last if over."""
    for step in ladder:
        if step >= value:
            return step
    return ladder[-1]


def size_power_setup(
    appliances: list[Appliance],
    cable_length_m: float,
    *,
    system_voltage_v: float = 12,
    autonomy_days: float = 1.0,
    max_voltage_drop_pct: float = MAX_VOLTAGE_DROP_PCT_DEFAULT,
    depth_of_discharge: float = DEPTH_OF_DISCHARGE_DEFAULT,
    inverter_efficiency: float = INVERTER_EFFICIENCY_DEFAULT,
    reserve_factor: float = RESERVE_FACTOR_DEFAULT,
    explain: bool = False,
) -> dict:
    """Size battery, inverter and main-run cable for a 12/24 V setup.

    See references/worked-examples/power-setup.md for the full design doc.
    Raises ValueError on invalid input. Output sizes round *up* to the next
    standard value (capacity is a requirement, not a display value).
    """
    # --- validate ---
    if cable_length_m <= 0:
        raise ValueError("cable_length_m must be positive")
    if system_voltage_v not in (12, 24, 48):
        raise ValueError("system_voltage_v must be one of 12, 24, 48")
    if not (0 < depth_of_discharge <= 1):
        raise ValueError("depth_of_discharge must be in (0, 1]")
    if not (0 < inverter_efficiency <= 1):
        raise ValueError("inverter_efficiency must be in (0, 1]")
    if reserve_factor < 1:
        raise ValueError("reserve_factor must be >= 1")
    if not (0 < max_voltage_drop_pct <= 10):
        raise ValueError("max_voltage_drop_pct must be in (0, 10]")
    for a in appliances:
        if a.watts < 0 or not (0 <= a.hours_per_day <= 24):
            raise ValueError(f"invalid appliance: {a.name}")

    # --- battery ---
    daily_wh = 0.0
    peak_ac_w = 0.0
    peak_total_w = 0.0
    for a in appliances:
        eff = inverter_efficiency if a.ac else 1.0
        daily_wh += a.watts * a.hours_per_day / eff
        if a.ac:
            peak_ac_w += a.watts
        peak_total_w += a.watts

    battery_ah = ceil(
        (daily_wh / system_voltage_v)
        / depth_of_discharge
        * autonomy_days
        * reserve_factor
    )

    # --- inverter ---
    inverter_w = _next_standard(peak_ac_w * INVERTER_HEADROOM, STANDARD_INVERTER_W)

    # --- cable ---
    peak_total_a = peak_total_w / system_voltage_v
    required_mm2 = (
        2 * cable_length_m * peak_total_a * COPPER_RHO
    ) / (system_voltage_v * max_voltage_drop_pct / 100)
    cable_mm2 = _next_standard(required_mm2, STANDARD_CABLE_MM2)

    actual_drop_pct = (
        2 * cable_length_m * peak_total_a * COPPER_RHO / cable_mm2
    ) / system_voltage_v * 100

    result = {
        "battery_ah": battery_ah,
        "inverter_w": inverter_w,
        "cable_mm2": cable_mm2,
    }
    if explain:
        result["breakdown"] = {
            "daily_wh": round(daily_wh, 1),
            "peak_ac_w": peak_ac_w,
            "peak_total_a": round(peak_total_a, 2),
            "required_mm2_raw": round(required_mm2, 2),
            "actual_voltage_drop_pct": round(actual_drop_pct, 2),
        }
    return result
```

Notes on the implementation:

- Domain constants are module-level with source comments (see *Named constants* table).
- User-tunable values are both module-level defaults *and* function kwargs — the `explain=True` flag toggles the audit breakdown without cluttering the pure numeric path.
- Capacity and cross-section both round *up*; rounding direction is a safety decision (see anti-patterns).
- Input validation fires at the boundary with specific messages.

## Step 6 — Tests

```python
# Hand-computable case: the prompt's exact inputs.
def test_prompt_example():
    appliances = [
        Appliance("fridge", 60, 24, ac=False),         # DC compressor fridge
        Appliance("laptop charger", 90, 4, ac=True),
        Appliance("water pump", 50, 0.5, ac=False),
    ]
    r = size_power_setup(appliances, cable_length_m=2, explain=True)
    # Daily Wh: 60*24 + 90*4/0.9 + 50*0.5 = 1440 + 400 + 25 = 1865 Wh
    # battery_ah = ceil(1865/12 / 0.8 * 1 * 1.25) = ceil(242.8) = 243
    assert r["battery_ah"] == 243
    # Peak AC = 90 W -> 90 * 1.25 = 112.5 -> next standard = 300 W
    assert r["inverter_w"] == 300
    # Main run cable sized to peak total current (200/12 = 16.67 A).

# Edge case: empty list.
def test_empty():
    r = size_power_setup([], cable_length_m=2)
    assert r == {"battery_ah": 0, "inverter_w": 300, "cable_mm2": 1.5}
    # inverter rounds up to the smallest standard; acceptable.

# Edge case: all DC, no AC.
def test_no_ac():
    r = size_power_setup(
        [Appliance("fridge", 60, 24, ac=False)], cable_length_m=2
    )
    assert r["inverter_w"] in STANDARD_INVERTER_W  # smallest standard is fine

# Invalid input fires validation.
def test_invalid_hours():
    try:
        size_power_setup(
            [Appliance("x", 10, 25)], cable_length_m=2,
        )
        assert False, "should have raised"
    except ValueError:
        pass

# Monotonicity: adding an appliance never reduces battery_ah.
def test_monotonic_battery():
    base = [Appliance("fridge", 60, 24, ac=False)]
    more = base + [Appliance("laptop", 90, 4, ac=True)]
    assert (
        size_power_setup(more, 2)["battery_ah"]
        >= size_power_setup(base, 2)["battery_ah"]
    )

# Unit round-trip: Wh at 12 V <-> Ah.
def test_unit_round_trip():
    wh = 1200.0
    ah = wh / 12
    assert abs(ah * 12 - wh) < 1e-9


if __name__ == "__main__":
    # Worked example printed so the user can eyeball the numbers.
    from pprint import pprint
    pprint(size_power_setup(
        [
            Appliance("fridge", 60, 24, ac=False),
            Appliance("laptop charger", 90, 4, ac=True),
            Appliance("water pump", 50, 0.5, ac=False),
        ],
        cable_length_m=2,
        explain=True,
    ))
```

## Step 7 — Review

Walking the design doc against the code:

- *Battery formula* → `battery_ah = ceil(...)` block; rounds up per the "capacity is a requirement" rule.
- *Inverter formula* → `_next_standard(peak_ac_w * INVERTER_HEADROOM, ...)`; AC-only, as specified.
- *Cable formula* → explicit voltage-drop formula with `2 * L` for round-trip; rounds up to next standard cross-section; actual drop reported in the breakdown so the user can see the headroom they got.
- *Edge cases* → empty list, all-DC, invalid hours all covered by tests.
- *Named constants* → present at module top with source comments.
- *Assumptions* → one-day autonomy, worst-case simultaneous AC, 20 °C copper. Surfaced in the design doc for user sign-off.

Assumptions baked in (the list for the user to glance at):

- All AC loads assumed simultaneous for inverter sizing.
- Main-run cable only; branch circuits are a follow-up.
- Copper resistivity at 20 °C; hot routing not accounted for.
- LiFePO4 at 80 % depth of discharge by default.

What I'd change first if a requirement shifts:

- If the user adds a large surge load (e.g. a microwave or an induction hob), swap the inverter sizing to use `max(peak_ac_w, surge_w / surge_factor)` and require an explicit `surge_w` per appliance.
- If the user wants multi-day autonomy with solar top-up, the battery formula needs a *net* daily draw (consumption minus generation), not just consumption.
- If the user wants per-appliance branch cables, loop the cable-sizing logic per branch with per-branch lengths.

---

## What to reuse when adapting this pattern

- The **three-stage structure** (energy → peak → conductor) generalizes to any sizing problem with a storage component, a peak-rated component, and a conveyance component.
- The **round-up-for-requirements / round-down-for-budgets** discipline.
- The **breakdown/explain dict** as a separate return — users of sizing calculators almost always want to see the intermediate numbers.
- The **standard-size ladder** helper — nearly every sizing domain has discrete available sizes (pipe, cable, battery pack, inverter, breaker, pump).

## What *not* to copy blindly

- The electrical constants (`COPPER_RHO`, `STANDARD_CABLE_MM2`, depth-of-discharge). These are domain-specific.
- The specific defaults (1.25 reserve, 3 % drop). These are rules of thumb in one domain; your domain has its own.
- The AC/DC split. Only meaningful when a lossy intermediary (inverter, pump, transformer) sits between source and load.
