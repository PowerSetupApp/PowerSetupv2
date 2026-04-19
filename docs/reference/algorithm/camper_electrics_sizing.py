"""
algorithm/camper_electrics_sizing.py
=====================================

Pure, dependency-free sizing algorithm for mobile-home / camper-van 12/24/48 V
electrical systems. Maps an ``AlgorithmInput`` (wizard answers) to a full
``AlgorithmOutput`` of raw numbers -- battery Ah, solar Wp, booster & charger
currents, inverter watts, MPPT controller current, cable cross-sections in
mm^2. A downstream product-recommendation AI is expected to round these raw
numbers to concrete SKUs; this algorithm deliberately does NOT round to
standard sizes (spec ``algorithm/inputs.md`` Part C).

Public surface:

    - ``compute_algorithm(input, *, explain=False, alternator_limit_a=60.0)``
      One entry point. Pure function. Raises ``ValueError`` at the boundary for
      invalid input; never returns a silent "safe" default.
    - ``validate(input)`` -- same validation, if you want to validate before
      computing.

Sections (fat banner comments, grep-friendly):

    SECTION A -- INPUT TYPES          (dataclasses mirroring inputs.md Part A)
    SECTION B -- CONSTANTS & LIMITS   (validation bounds, physical constants,
                                       PSH table, C-rate table, Wp per m^2,
                                       absorption tail, standby, routes)
    SECTION C -- OUTPUT TYPES         (dataclasses mirroring inputs.md Part C)
    SECTION D -- VALIDATION           (one function, raises ValueError)
    SECTION E -- DERIVED SIGNALS      (driveHours, shore availability,
                                       peak factor, PSH lookup, roof Wp)
    SECTION F -- SUB-CALCULATIONS     (battery, solar, booster, charger,
                                       inverter, controller, cables)
    SECTION G -- MAIN compute_algorithm(input, *, explain=False)
    SECTION H -- TESTS & WORKED EXAMPLE (``if __name__ == "__main__"``)

Assumptions baked in (glance-once list):

    1.  Solar PSH for ``season=all_year`` uses the *annual average* from
        ``references/solar.md`` (not worst-case winter). ``solarShortfallWh``
        still surfaces any deficit so the downstream UI/AI can warn.
    2.  ``ALTERNATOR_CONTINUOUS_LIMIT_A = 60 A`` is a safe default for modern
        Euro-6 alternators. Pass ``alternator_limit_a=...`` to override.
    3.  ``ROOF_PACKING_FACTOR = 0.8`` of the rectangular roof area is assumed
        actually panelable (accounts for edges, vents, sat dome).
    4.  ``WP_PER_M2 = 200 (rigid) / 150 (flexible)`` -- mid-2020s commodity
        panel density.
    5.  ``simultaneousLoad`` drives inverter peak only, not DC bus sizing
        (per the open question in inputs.md -- left for V2).
    6.  LFP cold-charge (< 0 degC) is NOT enforced (spec's V2 deferral).
    7.  Cable sizing is voltage-drop-only. The ampacity cross-check from
        ``references/cables.md`` is left for the product-matching layer.
    8.  ``INVERTER_STANDBY_HOURS = 24`` (default always-on). Standby energy
        is only added when at least one AC consumer exists.
    9.  All outputs are raw floats / ints -- rounding to product sizes is
        explicitly out of scope per ``inputs.md`` Part C.
    10. ``recommendedCrossSection = minCrossSection`` and ``solar.recommendation
        = ""`` are legacy-compat stubs for the current TS ``AlgorithmOutput``
        type; the downstream AI overwrites them.

References (all in this repository):

    - ``algorithm/inputs.md``                                   -- canonical I/O spec
    - ``.agents/skills/mobile-home-electrics-basics/references/batteries.md``
    - ``.agents/skills/mobile-home-electrics-basics/references/solar.md``
    - ``.agents/skills/mobile-home-electrics-basics/references/alternator.md``
    - ``.agents/skills/mobile-home-electrics-basics/references/inverter.md``
    - ``.agents/skills/mobile-home-electrics-basics/references/cables.md``
    - ``.agents/skills/mobile-home-electrics-basics/references/shore-power.md``
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Tuple


# ---------------------------------------------------------------------------
# ROUTES constants (hoisted to the top per plan.md "File structure" block)
# ---------------------------------------------------------------------------
# Fixed output order for every ``AlgorithmOutput.cables`` entry. Each tuple
# is ``(route_id, display_name, is_critical)``. "Critical" routes carry
# significant continuous / peak current and use a tighter 1 %-of-U voltage
# drop budget; the remaining routes use the standard 3 % DC-distribution
# budget. See references/cables.md "ΔU_max table" and inputs.md B.5.
#
# The ROUTES tuple doubles as the schema anchor for the cables array: every
# output always contains exactly seven CableRecommendation entries in this
# order, even when a route is inactive (then length or current is zero and
# min_cross_section collapses to 0 -- shape stays stable).

ROUTES: Tuple[Tuple[str, str, bool], ...] = (
    ("starter_to_booster", "Starter -> Ladebooster", True),
    ("booster_to_service", "Ladebooster -> Versorgerbatterie", True),
    ("charger_to_service", "Landlader -> Versorgerbatterie", False),
    ("service_to_inverter", "Versorgerbatterie -> Wechselrichter", True),
    ("solar_to_regulator", "PV -> Laderegler", False),
    ("regulator_to_service", "Laderegler -> Versorgerbatterie", False),
    ("battery_to_fuse_box", "Versorgerbatterie -> Sicherungskasten", True),
)
CRITICAL_DU_MAX_PCT: float = 1.0  # cables.md: sensitive / critical DC feeders
STANDARD_DU_MAX_PCT: float = 3.0  # cables.md: standard DC distribution


# ===========================================================================
# ===========================================================================
# SECTION A -- INPUT TYPES
# ---------------------------------------------------------------------------
# Mirror of ``AlgorithmInput`` from inputs.md Part A. ``Literal`` enums
# match the closed sets in Part B.4. Fields not needed by the algorithm
# (icons, UI metadata) are still declared so the dataclass round-trips the
# full wizard payload without surprise.
# ===========================================================================
# ===========================================================================


# --- Literal type aliases (inputs.md Part B.4) ---------------------------
SystemVoltage = Literal[12, 24, 48]  # systemVoltage, vehicleVoltage, booster.*, battery.voltage
ConsumerVoltage = Literal[12, 24, 48, 230]  # 230 = AC via inverter; ONLY on Consumer.voltage
BatteryPreference = Literal["lifepo4", "agm", "gel"]
EnergySource = Literal["solar", "alternator", "shore_power"]
RoofModuleType = Literal["rigid", "flexible"]
ChargerSpeed = Literal["slow", "normal", "fast"]
SimultaneousLoad = Literal["low", "moderate", "high"]
Season = Literal["summer", "all_year", "winter"]
TripDuration = Literal["weekend", "week", "extended", "permanent"]
WinterLocation = Literal["scandinavia", "germany", "southern", "eastern", "varies"]
StandingDuration = Literal["short", "medium", "long"]
CoolingMethod = Literal["compressor", "absorber"]
# Derived signal, not a user input (inputs.md A.7.2):
ShoreAvailability = Literal["never", "occasional", "nightly", "nightly_fast", "full_time"]
# Output-only (inputs.md B.4): algorithm emits mppt only.
ControllerType = Literal["mppt", "pwm"]


@dataclass
class RoofArea:
    """One rectangular roof patch; inputs.md A.2.1."""

    id: str
    name: str
    length: float  # cm, 0 <= length <= MAX_ROOF_DIM_CM
    width: float  # cm, 0 <= width <= MAX_ROOF_DIM_CM


@dataclass
class SolarBag:
    """One portable solar bag; inputs.md A.2.2."""

    id: str
    power: float  # Wp, 0 <= power <= MAX_SOLAR_BAG_W


@dataclass
class Consumer:
    """One electrical consumer; inputs.md A.3.1.

    ``voltage == 230`` is the ONLY marker that identifies an AC load
    (goes through the inverter). Do NOT add a secondary ``loadType`` flag --
    inputs.md A.3.1 note deliberately forbids that.
    """

    id: str
    name: str
    power: float  # W, 0 <= power <= MAX_POWER_W
    daily: float  # h/day, 0 <= daily <= MAX_HOURS_PER_DAY
    voltage: int  # one of 12 | 24 | 48 | 230
    cooling_method: Optional[str] = None  # "compressor" | "absorber" | None
    electric_share: Optional[float] = None  # 0.0..1.0; absorber's electric share of total
    average_load_percent: Optional[int] = None  # 1..100; avg load relative to nominal
    source_device_id: Optional[str] = None  # catalogue ref, metadata only
    device_icon: Optional[str] = None  # UI only
    category_icon: Optional[str] = None  # UI only
    show_hours_field: Optional[bool] = None  # UI only
    daily_step: Optional[float] = None  # UI only


@dataclass
class TravelBehavior:
    """Trip context; inputs.md A.4."""

    season: str  # "summer" | "all_year" | "winter"
    trip_duration: str  # "weekend" | "week" | "extended" | "permanent"
    winter_location: str  # "scandinavia" | "germany" | "southern" | "eastern" | "varies"
    standing_duration: str  # "short" | "medium" | "long"


@dataclass
class CableLengths:
    """One-way lengths for every sized route; inputs.md A.6. All in metres,
    each in [0, MAX_CABLE_LENGTH_M]. Zero is allowed and means "this route
    does not exist" -- the algorithm still emits a CableRecommendation with
    ``minCrossSection = 0`` so the output shape stays stable.
    """

    starter_to_service: float  # Starter -> Ladebooster
    booster_to_service: float  # Ladebooster -> Versorgerbatterie
    solar_to_regulator: float  # PV -> Laderegler
    regulator_to_service: float  # Laderegler -> Versorgerbatterie
    charger_to_service: float  # Landlader -> Versorgerbatterie
    service_to_inverter: float  # Versorgerbatterie -> Wechselrichter
    battery_to_fuse_box: float  # Versorgerbatterie -> Sicherungskasten


@dataclass
class AlgorithmInput:
    """Full wizard payload; inputs.md Part A."""

    # A.1 system basis
    system_voltage: int  # 12 | 24 | 48
    vehicle_voltage: int  # 12 | 24 | 48
    battery_preference: str  # "lifepo4" | "agm" | "gel"

    # A.2 energy sources
    energy_sources: List[str]  # subset of {"solar","alternator","shore_power"}
    roof_module_type: str  # "rigid" | "flexible"
    roof_areas: List[RoofArea]
    solar_bags: List[SolarBag]
    charger_speed: str  # "slow" | "normal" | "fast"

    # A.3 consumers
    consumers: List[Consumer]
    simultaneous_load: str  # "low" | "moderate" | "high"

    # A.4 travel behaviour
    travel_behavior: TravelBehavior

    # A.5 autarky
    autarchy_days: int  # 1..999 (999 = "maximum" sentinel, see inputs.md B.3)

    # A.6 cable lengths
    cable_lengths: CableLengths


# ===========================================================================
# ===========================================================================
# SECTION B -- CONSTANTS & LIMITS
# ---------------------------------------------------------------------------
# Every value below has a one-line source comment citing either inputs.md
# (spec) or a file under references/ (domain). No magic numbers anywhere
# else in this module.
# ===========================================================================
# ===========================================================================


# --- B.1 validation bounds (inputs.md B.1) -------------------------------
MAX_POWER_W: int = 20_000  # max Consumer.power [W]
MAX_HOURS_PER_DAY: int = 24  # max Consumer.daily [h/day]
MAX_SOLAR_BAG_W: int = 4_000  # max SolarBag.power [Wp]
MAX_ROOF_DIM_CM: int = 5_000  # max RoofArea.length / width [cm] (= 50 m)
MAX_CABLE_LENGTH_M: int = 100  # max any cable length [m]

# --- B.2 autarkyDays upper bound per trip duration (inputs.md B.2) -------
# Source: src/lib/wizard/autarchy-ui.ts -> getAutarchyWizardMaxDays.
# Values are inclusive: tripDuration = "week" allows up to 10 days.
MAX_AUTARCHY_DAYS: Dict[str, int] = {
    "weekend": 3,
    "week": 10,
    "extended": 45,
    "permanent": 90,
}

# --- B.3 autarky sentinel (inputs.md B.3) --------------------------------
AUTARCHY_UNBOUNDED: int = 999  # "maximum / unbegrenzt" marker

# --- B.4 closed enum sets (inputs.md B.4) --------------------------------
# Kept as tuples so membership checks are O(1) enough and order-stable.
SYSTEM_VOLTAGES: Tuple[int, ...] = (12, 24, 48)
CONSUMER_VOLTAGES: Tuple[int, ...] = (12, 24, 48, 230)  # 230 ONLY on Consumer.voltage
BATTERY_PREFERENCES: Tuple[str, ...] = ("lifepo4", "agm", "gel")
ENERGY_SOURCES: Tuple[str, ...] = ("solar", "alternator", "shore_power")
ROOF_MODULE_TYPES: Tuple[str, ...] = ("rigid", "flexible")
CHARGER_SPEEDS: Tuple[str, ...] = ("slow", "normal", "fast")
SIMULTANEOUS_LOADS: Tuple[str, ...] = ("low", "moderate", "high")
SEASONS: Tuple[str, ...] = ("summer", "all_year", "winter")
TRIP_DURATIONS: Tuple[str, ...] = ("weekend", "week", "extended", "permanent")
WINTER_LOCATIONS: Tuple[str, ...] = (
    "scandinavia",
    "germany",
    "southern",
    "eastern",
    "varies",
)
STANDING_DURATIONS: Tuple[str, ...] = ("short", "medium", "long")
COOLING_METHODS: Tuple[str, ...] = ("compressor", "absorber")

# --- B.5 cable route IDs (inputs.md B.5) ---------------------------------
# The ``ROUTES`` tuple and its companions ``CRITICAL_DU_MAX_PCT`` /
# ``STANDARD_DU_MAX_PCT`` live at the top of the file (right after the
# module docstring, per plan.md "File structure" item 1) so a downstream
# reader can find the output schema without scrolling past SECTIONS A-B.

# --- B.6 physical / algorithm constants (inputs.md B.6) -------------------
# Every value with source comment pointing at references/*.md.

INVERTER_EFFICIENCY: float = 0.9
"""η_inv for AC-Wh -> DC-Wh conversion; references/inverter.md:
mid-load pure-sine typical 0.88..0.93, 0.9 is the default."""

INVERTER_STANDBY_W: int = 10
"""No-load draw of a medium pure-sine inverter; references/inverter.md:
typical 5..25 W for 1..3 kW class. 10 W is a mid/low value and matches
inputs.md B.6."""

INVERTER_STANDBY_HOURS: int = 24
"""Default on-hours for inverter standby (always-on); inputs.md B.6.
Only applied when at least one AC consumer exists (otherwise inverter
is assumed off)."""

BOOSTER_EFFICIENCY: float = 0.9
"""η_B2B for starter-side current and daily alternator charge;
references/alternator.md: modern B2B typical 0.88..0.92."""

CHARGER_EFFICIENCY: float = 0.92
"""η_shoreCharger for charge-time calculation; references/shore-power.md
worked example uses 0.92 (Victron Phoenix)."""

SOLAR_SYSTEM_EFFICIENCY: float = 0.75
"""η_system for a flat-mounted camper array with good MPPT + LFP;
references/solar.md: typical product of losses 0.70..0.80,
0.75 is the default in solar.md."""

DOD_DEFAULTS: Dict[str, float] = {
    "lifepo4": 0.85,  # references/batteries.md: 0.80..0.90 (conservative 0.85)
    "agm": 0.5,  # references/batteries.md: cyclic 0.50
    "gel": 0.5,  # references/batteries.md: 0.50
}
"""Permitted depth of discharge per chemistry. From inputs.md B.6 and
references/batteries.md "Chemistry at a glance" table."""

ROUNDTRIP_DEFAULTS: Dict[str, float] = {
    "lifepo4": 0.95,  # references/batteries.md: 0.94..0.97
    "agm": 0.83,  # references/batteries.md: 0.80..0.85 (mid)
    "gel": 0.80,  # references/batteries.md: 0.80
}
"""Round-trip charge/discharge efficiency per chemistry. inputs.md B.6."""

RESERVE_FACTOR: float = 1.25
"""Capacity reserve on top of min_capacity_ah for cold-weather, ageing,
and safety headroom. inputs.md B.6 and the worked example in
references/worked-examples/power-setup.md."""

# --- Roof / panel constants (references/solar.md) ------------------------
WP_PER_M2: Dict[str, float] = {
    "rigid": 200.0,  # mid-2020s commodity rigid modules (~200 Wp/m^2)
    "flexible": 150.0,  # flexible / semi-rigid modules (lower density)
}
"""Roof-mounted panel peak-power density by module type. Rule of thumb from
references/solar.md (mid-2020s commodity panels)."""

ROOF_PACKING_FACTOR: float = 0.8
"""Fraction of a rectangular roof area that can actually be covered with
panels after edge clearances, vents, AC unit, sat dome; references/solar.md.
Override if the user tiles edge-to-edge (rare)."""

# --- Cable / copper constants (references/cables.md) ---------------------
COPPER_RHO: float = 0.0178
"""Copper resistivity in Ω·mm²/m (engineering value used in German/EU
practice -- VDE, DIN -- at elevated cable temperature). Pure physical
value at 20 °C is 0.01724; references/cables.md explicitly uses 0.0178
for the ~3 % temperature margin."""

# --- Booster constants (references/alternator.md) ------------------------
C_RATE_CHARGE_MAX: Dict[str, float] = {
    "lifepo4": 0.5,  # references/batteries.md: drop-in LFP typical 0.5 C
    "agm": 0.2,  # references/batteries.md: 0.2..0.3 C (conservative)
    "gel": 0.15,  # references/batteries.md: 0.1..0.2 C (mid)
}
"""Maximum continuous charge C-rate per chemistry. The battery acceptance
limit for the booster (references/alternator.md, references/batteries.md)."""

ALTERNATOR_CONTINUOUS_LIMIT_A: float = 60.0
"""Safe continuous alternator output under-hood on a modern Euro-6 diesel
van. Override via ``alternator_limit_a=...`` for documented vehicles.
references/alternator.md: "B2Bs of 30, 50, 60 A per alternator are usually
safe". 60 A matches the largest drop-in B2B rating the vehicle side can
typically absorb without overheating."""

# --- Charger target C-rates (references/shore-power.md) ------------------
# Mapping shoreAvailability -> target C-rate for the shore charger.
# Rationale per references/shore-power.md "Shore charger sizing":
#   - occasional (slow)      : 0.1..0.15 C  -> 0.125
#   - nightly  (normal)      : 0.2..0.3  C  -> 0.25
#   - nightly_fast (fast)    : 0.4..0.5  C  -> 0.45 (LFP ceiling)
#   - full_time              : max(0.25 C, average load current)
CHARGER_TARGET_C_RATE: Dict[str, float] = {
    "occasional": 0.125,
    "nightly": 0.25,
    "nightly_fast": 0.45,
    "full_time": 0.25,  # floor; actual is max(this, I_avg_load)
}

# --- Charger absorption tail (references/shore-power.md) -----------------
ABSORPTION_TAIL_H: Dict[str, float] = {
    "lifepo4": 0.5,  # references/shore-power.md: "short (minutes)"
    "agm": 2.0,  # references/shore-power.md: "1..3 h"
    "gel": 2.5,  # references/shore-power.md: gel usually > AGM
}
"""Absorption / float tail added to the bulk charging time per chemistry."""

# --- Derived-signal tables (inputs.md A.7) -------------------------------
# A.7.1 Drive-hours-per-day: two-axis lookup on (tripDuration, standingDuration).
# None key means "any" for that axis.
DRIVE_HOURS_PER_DAY: Dict[Tuple[str, Optional[str]], float] = {
    ("weekend", None): 0.5,
    ("week", "short"): 1.0,
    ("week", "medium"): 0.75,
    ("week", "long"): 0.5,
    ("extended", "short"): 1.5,
    ("extended", "medium"): 1.0,
    ("extended", "long"): 0.5,
    ("permanent", None): 0.5,
}

# A.7.3 Peak factor on AC peak load.
PEAK_FACTOR: Dict[str, float] = {
    "low": 1.25,
    "moderate": 1.5,
    "high": 2.0,
}

# --- PSH table (references/solar.md) -------------------------------------
# Peak sun hours per day, keyed on (winterLocation, season). Values are at
# the conservative end of the ranges in references/solar.md, per the skill's
# "pick the conservative end unless explicitly asked otherwise" rule.
#   - summer    = bottom of the summer range
#   - winter    = bottom-mid of the winter range
#   - all_year  = annual average point value
# "eastern" is approximated with Northern-Europe (50..55 deg N) values since
# references/solar.md has no explicit Eastern-Europe row.
# "varies" defaults to the central-European (germany) column.
# See Assumption 1 at module top.
PSH_TABLE: Dict[str, Dict[str, float]] = {
    "scandinavia": {"summer": 4.5, "all_year": 2.5, "winter": 0.3},
    "germany": {"summer": 5.0, "all_year": 3.0, "winter": 0.9},
    "southern": {"summer": 6.0, "all_year": 4.5, "winter": 1.9},
    "eastern": {"summer": 4.5, "all_year": 2.7, "winter": 0.6},
    "varies": {"summer": 5.0, "all_year": 3.0, "winter": 0.9},
}


# ===========================================================================
# ===========================================================================
# SECTION C -- OUTPUT TYPES
# ---------------------------------------------------------------------------
# 1:1 mirror of inputs.md Part C. Legacy-compat stubs (empty strings,
# duplicated currents/cross-sections) are populated per the notes in
# inputs.md Part C so the existing TypeScript ``AlgorithmOutput`` type
# accepts the result without modification.
# ===========================================================================
# ===========================================================================


@dataclass
class BatteryRecommendation:
    """inputs.md C.1."""

    daily_wh: float  # Wh/day
    min_capacity_ah: float  # Ah (raw, no rounding)
    recommended_capacity_ah: float  # Ah (raw, no rounding)
    type: str  # batteryPreference enum
    voltage: int  # 12 | 24 | 48
    autarchy_days: int  # echoed, clamped per B.2 maxDays rule
    has_solar: bool  # convenience: 'solar' in energySources
    has_alternator: bool  # convenience: 'alternator' in energySources


@dataclass
class SolarRecommendation:
    """inputs.md C.2."""

    needed: bool
    required_wp: float  # Wp
    max_roof_wp: float  # Wp
    portable_wp: float  # Wp
    total_available_wp: float  # Wp
    daily_solar_yield_wh: float  # Wh/day
    solar_shortfall_wh: float  # Wh/day, >= 0
    recommendation: str = ""  # legacy: always "" (spec C.2 note)


@dataclass
class BoosterRecommendation:
    """inputs.md C.3."""

    needed: bool
    input_current_a: float  # A, starter-side
    output_current_a: float  # A, house-bank-side
    current_a: float  # legacy: == output_current_a (spec C.3 note)
    input_voltage: int  # 12 | 24 | 48 -- vehicle side
    output_voltage: int  # 12 | 24 | 48 -- house side
    needs_conversion: bool  # vehicle_voltage != system_voltage
    daily_alternator_charge_wh: float  # Wh/day
    original_current_a: Optional[float] = None  # optional intermediate


@dataclass
class ChargerRecommendation:
    """inputs.md C.4."""

    needed: bool
    target_current_a: float  # A (raw target before chemistry clamp)
    recommended_current_a: float  # A (raw, clamped to chemistry ceiling)
    charging_time_hours: float  # h
    original_recommended_current_a: Optional[float] = None


@dataclass
class InverterRecommendation:
    """inputs.md C.5."""

    needed: bool
    peak_load_w: float  # W (sum of AC consumer nominal power)
    recommended_w: float  # W (peak_load_w * peak_factor; raw, no rounding)
    original_recommended_w: Optional[float] = None


@dataclass
class ControllerRecommendation:
    """inputs.md C.6."""

    needed: bool
    type: str  # "mppt" (spec B.4: algorithm emits mppt only)
    current_a: float  # A, battery side
    max_input_wp: float  # Wp, the maximum peak the controller must accept
    original_current_a: Optional[float] = None


@dataclass
class CableRecommendation:
    """inputs.md C.7. One per route in ROUTES (always 7 entries)."""

    route: str  # one of B.5 route IDs
    display_name: str
    length_m: float
    current_a: float
    voltage: float  # typically 12 | 24 | 48; could be 230 for future AC routes
    min_cross_section: float  # mm^2, raw
    recommended_cross_section: float  # mm^2 -- legacy == min_cross_section
    is_critical: bool


@dataclass
class AlgorithmOutput:
    """inputs.md Part C."""

    battery: BatteryRecommendation
    solar: SolarRecommendation
    booster: BoosterRecommendation
    charger: ChargerRecommendation
    inverter: InverterRecommendation
    controller: ControllerRecommendation
    cables: List[CableRecommendation]
    breakdown: Optional[Dict[str, Any]] = None  # only populated when explain=True


# ===========================================================================
# ===========================================================================
# SECTION D -- VALIDATION
# ---------------------------------------------------------------------------
# One entry point, ``validate(input)``. Raises ValueError with a specific
# message naming the offending field. No silent repair, no fallback value.
# The intent is that calling ``compute_algorithm`` on malformed input
# produces a diagnosable error at the wizard boundary rather than a wrong
# but plausible number downstream.
# ===========================================================================
# ===========================================================================


def _require_enum(value: Any, allowed: Tuple[Any, ...], field_name: str) -> None:
    """Raise ValueError if value is not in allowed."""
    if value not in allowed:
        raise ValueError(
            f"{field_name}={value!r} must be one of {list(allowed)}"
        )


def _require_range(
    value: float,
    lo: float,
    hi: float,
    field_name: str,
    *,
    inclusive: bool = True,
) -> None:
    """Raise ValueError if value is not in [lo, hi] (inclusive by default)."""
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ValueError(f"{field_name}={value!r} must be numeric")
    if inclusive:
        if not (lo <= value <= hi):
            raise ValueError(
                f"{field_name}={value} out of range [{lo}, {hi}]"
            )
    else:
        if not (lo < value < hi):
            raise ValueError(
                f"{field_name}={value} out of range ({lo}, {hi})"
            )


def _require_non_empty(value: Any, field_name: str) -> None:
    """Raise ValueError if value is not a non-empty string."""
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name} must be a non-empty string")


def _validate_consumer(c: Consumer, idx: int) -> None:
    prefix = f"consumers[{idx}]"
    _require_non_empty(c.id, f"{prefix}.id")
    _require_non_empty(c.name, f"{prefix}.name")
    _require_range(c.power, 0, MAX_POWER_W, f"{prefix}.power")
    _require_range(c.daily, 0, MAX_HOURS_PER_DAY, f"{prefix}.daily")
    _require_enum(c.voltage, CONSUMER_VOLTAGES, f"{prefix}.voltage")
    if c.cooling_method is not None:
        _require_enum(
            c.cooling_method, COOLING_METHODS, f"{prefix}.cooling_method"
        )
    if c.electric_share is not None:
        _require_range(
            c.electric_share, 0.0, 1.0, f"{prefix}.electric_share"
        )
    if c.average_load_percent is not None:
        if (
            not isinstance(c.average_load_percent, int)
            or isinstance(c.average_load_percent, bool)
            or not (1 <= c.average_load_percent <= 100)
        ):
            raise ValueError(
                f"{prefix}.average_load_percent={c.average_load_percent} "
                f"must be an int in [1, 100]"
            )
    if c.daily_step is not None and not (c.daily_step > 0):
        raise ValueError(f"{prefix}.daily_step must be > 0 if set")


def _validate_roof_area(r: RoofArea, idx: int) -> None:
    prefix = f"roof_areas[{idx}]"
    _require_non_empty(r.id, f"{prefix}.id")
    _require_non_empty(r.name, f"{prefix}.name")
    _require_range(r.length, 0, MAX_ROOF_DIM_CM, f"{prefix}.length")
    _require_range(r.width, 0, MAX_ROOF_DIM_CM, f"{prefix}.width")


def _validate_solar_bag(b: SolarBag, idx: int) -> None:
    prefix = f"solar_bags[{idx}]"
    _require_non_empty(b.id, f"{prefix}.id")
    _require_range(b.power, 0, MAX_SOLAR_BAG_W, f"{prefix}.power")


def _validate_cable_lengths(cl: CableLengths) -> None:
    for name in (
        "starter_to_service",
        "booster_to_service",
        "solar_to_regulator",
        "regulator_to_service",
        "charger_to_service",
        "service_to_inverter",
        "battery_to_fuse_box",
    ):
        _require_range(
            getattr(cl, name), 0, MAX_CABLE_LENGTH_M, f"cable_lengths.{name}"
        )


def _validate_travel_behavior(tb: TravelBehavior) -> None:
    _require_enum(tb.season, SEASONS, "travel_behavior.season")
    _require_enum(tb.trip_duration, TRIP_DURATIONS, "travel_behavior.trip_duration")
    _require_enum(
        tb.winter_location, WINTER_LOCATIONS, "travel_behavior.winter_location"
    )
    _require_enum(
        tb.standing_duration,
        STANDING_DURATIONS,
        "travel_behavior.standing_duration",
    )


def validate(input: AlgorithmInput) -> None:
    """Full structural + cross-field validation of AlgorithmInput.

    Raises ValueError with a field-specific message on the first violation.
    Does not return a value; on success returns silently.
    """
    # --- A.1 system basis ---
    _require_enum(input.system_voltage, SYSTEM_VOLTAGES, "system_voltage")
    _require_enum(input.vehicle_voltage, SYSTEM_VOLTAGES, "vehicle_voltage")
    _require_enum(
        input.battery_preference, BATTERY_PREFERENCES, "battery_preference"
    )

    # --- A.2 energy sources ---
    if not isinstance(input.energy_sources, list):
        raise ValueError("energy_sources must be a list")
    for i, src in enumerate(input.energy_sources):
        _require_enum(src, ENERGY_SOURCES, f"energy_sources[{i}]")
    _require_enum(input.roof_module_type, ROOF_MODULE_TYPES, "roof_module_type")
    for i, ra in enumerate(input.roof_areas):
        _validate_roof_area(ra, i)
    for i, sb in enumerate(input.solar_bags):
        _validate_solar_bag(sb, i)
    _require_enum(input.charger_speed, CHARGER_SPEEDS, "charger_speed")

    # --- A.3 consumers ---
    for i, c in enumerate(input.consumers):
        _validate_consumer(c, i)
    _require_enum(
        input.simultaneous_load, SIMULTANEOUS_LOADS, "simultaneous_load"
    )

    # --- A.4 travel behaviour ---
    _validate_travel_behavior(input.travel_behavior)

    # --- A.5 autarky ---
    if (
        not isinstance(input.autarchy_days, int)
        or isinstance(input.autarchy_days, bool)
    ):
        raise ValueError(
            f"autarchy_days={input.autarchy_days!r} must be int"
        )
    if not (1 <= input.autarchy_days <= AUTARCHY_UNBOUNDED):
        raise ValueError(
            f"autarchy_days={input.autarchy_days} must be in [1, "
            f"{AUTARCHY_UNBOUNDED}]"
        )
    max_days = MAX_AUTARCHY_DAYS[input.travel_behavior.trip_duration]
    if (
        input.autarchy_days != AUTARCHY_UNBOUNDED
        and input.autarchy_days > max_days
    ):
        raise ValueError(
            f"autarchy_days={input.autarchy_days} exceeds max {max_days} "
            f"for trip_duration={input.travel_behavior.trip_duration!r} "
            f"(or use sentinel {AUTARCHY_UNBOUNDED} for 'maximum')"
        )

    # --- A.6 cable lengths ---
    _validate_cable_lengths(input.cable_lengths)

    # --- Cross-field rules ---
    # inputs.md A.4 note: tripDuration=permanent requires season=all_year.
    if (
        input.travel_behavior.trip_duration == "permanent"
        and input.travel_behavior.season != "all_year"
    ):
        raise ValueError(
            "travel_behavior.trip_duration='permanent' requires "
            "travel_behavior.season='all_year' (inputs.md A.4 note)"
        )


# ===========================================================================
# ===========================================================================
# SECTION E -- DERIVED SIGNALS
# ---------------------------------------------------------------------------
# Deterministic, pure lookups from input into intermediate signals used by
# the sub-calculations. Each maps 1:1 to a table in inputs.md Part A.7 or
# a reference file.
# ===========================================================================
# ===========================================================================


def _drive_hours(travel: TravelBehavior, energy_sources: List[str]) -> float:
    """inputs.md A.7.1. Returns 0 when 'alternator' not selected."""
    if "alternator" not in energy_sources:
        return 0.0
    td = travel.trip_duration
    sd = travel.standing_duration
    if (td, None) in DRIVE_HOURS_PER_DAY:
        return DRIVE_HOURS_PER_DAY[(td, None)]
    key = (td, sd)
    if key in DRIVE_HOURS_PER_DAY:
        return DRIVE_HOURS_PER_DAY[key]
    # Defensive: should never hit after validation.
    raise ValueError(
        f"no drive_hours_per_day mapping for trip_duration={td!r}, "
        f"standing_duration={sd!r}"
    )


def _shore_availability(input: AlgorithmInput) -> str:
    """inputs.md A.7.2. Returns one of ShoreAvailability literals.

    Precedence:
        1. 'shore_power' not in energy_sources -> 'never'
        2. permanent + non-slow charger       -> 'full_time'
        3. charger_speed mapping              -> occasional/nightly/nightly_fast
    """
    if "shore_power" not in input.energy_sources:
        return "never"
    if (
        input.travel_behavior.trip_duration == "permanent"
        and input.charger_speed != "slow"
    ):
        return "full_time"
    if input.charger_speed == "slow":
        return "occasional"
    if input.charger_speed == "normal":
        return "nightly"
    if input.charger_speed == "fast":
        return "nightly_fast"
    # Defensive -- should be unreachable after validation.
    raise ValueError(
        f"charger_speed={input.charger_speed!r} has no shore_availability mapping"
    )


def _psh(travel: TravelBehavior) -> float:
    """PSH lookup. references/solar.md. See Assumption 1 at module top."""
    loc_table = PSH_TABLE[travel.winter_location]  # validated upstream
    return loc_table[travel.season]


def _classify_consumers(
    consumers: List[Consumer],
) -> Tuple[float, float, float, float]:
    """Split consumers into DC / AC Wh and peak W totals.

    Returns:
        (dc_wh, ac_wh, peak_ac_w, peak_dc_w)

    ``load_wh`` per consumer:
        load_wh = power * daily * (average_load_percent/100 if set else 1)
        if cooling_method == 'absorber' and electric_share is set:
            load_wh *= electric_share
    """
    dc_wh = 0.0
    ac_wh = 0.0
    peak_ac_w = 0.0
    peak_dc_w = 0.0
    for c in consumers:
        factor = (
            (c.average_load_percent / 100.0)
            if c.average_load_percent is not None
            else 1.0
        )
        load_wh = c.power * c.daily * factor
        if c.cooling_method == "absorber" and c.electric_share is not None:
            load_wh *= c.electric_share
        if c.voltage == 230:
            ac_wh += load_wh
            peak_ac_w += c.power
        else:
            dc_wh += load_wh
            peak_dc_w += c.power
    return dc_wh, ac_wh, peak_ac_w, peak_dc_w


def _roof_wp(roof_areas: List[RoofArea], roof_module_type: str) -> float:
    """Total Wp from rectangular roof areas * density * packing factor."""
    wp_per_m2 = WP_PER_M2[roof_module_type]
    total = 0.0
    for r in roof_areas:
        area_m2 = (r.length * r.width) / 10_000.0  # cm*cm -> m^2
        total += area_m2 * wp_per_m2 * ROOF_PACKING_FACTOR
    return total


# ===========================================================================
# ===========================================================================
# SECTION F -- SUB-CALCULATIONS
# ---------------------------------------------------------------------------
# One function per AlgorithmOutput sub-field. All pure, all take explicit
# inputs (no hidden global state). Formulas 1:1 with algorithm/plan.md and
# the referenced skill reference files.
# ===========================================================================
# ===========================================================================


def _size_battery(
    daily_wh: float, effective_autarchy_days: int, input: AlgorithmInput
) -> BatteryRecommendation:
    """references/batteries.md + inputs.md C.1.

    Formulas::

        C_usable_Wh = daily_wh * autarchy_days / ROUNDTRIP
        C_nom_Wh    = C_usable_Wh / DoD
        min_Ah      = C_nom_Wh / system_voltage
        recommended = min_Ah * RESERVE_FACTOR
    """
    chem = input.battery_preference
    dod = DOD_DEFAULTS[chem]
    eta_rt = ROUNDTRIP_DEFAULTS[chem]
    u_sys = input.system_voltage

    c_usable_wh = daily_wh * effective_autarchy_days / eta_rt
    c_nom_wh = c_usable_wh / dod
    min_capacity_ah = c_nom_wh / u_sys
    recommended_capacity_ah = min_capacity_ah * RESERVE_FACTOR

    return BatteryRecommendation(
        daily_wh=daily_wh,
        min_capacity_ah=min_capacity_ah,
        recommended_capacity_ah=recommended_capacity_ah,
        type=chem,
        voltage=u_sys,
        autarchy_days=effective_autarchy_days,
        has_solar=("solar" in input.energy_sources),
        has_alternator=("alternator" in input.energy_sources),
    )


def _size_solar(
    daily_wh: float, psh: float, input: AlgorithmInput
) -> SolarRecommendation:
    """references/solar.md + inputs.md C.2.

    Formulas::

        roof_wp          = sum(l*w/10000 * WP_PER_M2[type] * ROOF_PACKING)
        portable_wp      = sum(bag.power)
        total            = roof_wp + portable_wp
        required_wp      = daily_wh / (psh * SOLAR_SYSTEM_EFFICIENCY)
        daily_yield_wh   = total * psh * SOLAR_SYSTEM_EFFICIENCY
        shortfall_wh     = max(0, daily_wh - daily_yield_wh)
    """
    roof_wp = _roof_wp(input.roof_areas, input.roof_module_type)
    portable_wp = sum(b.power for b in input.solar_bags)
    total_available_wp = roof_wp + portable_wp

    denom = psh * SOLAR_SYSTEM_EFFICIENCY
    required_wp = (daily_wh / denom) if denom > 0 else 0.0
    daily_solar_yield_wh = total_available_wp * psh * SOLAR_SYSTEM_EFFICIENCY
    solar_shortfall_wh = max(0.0, daily_wh - daily_solar_yield_wh)

    return SolarRecommendation(
        needed=("solar" in input.energy_sources),
        required_wp=required_wp,
        max_roof_wp=roof_wp,
        portable_wp=portable_wp,
        total_available_wp=total_available_wp,
        daily_solar_yield_wh=daily_solar_yield_wh,
        solar_shortfall_wh=solar_shortfall_wh,
        recommendation="",  # legacy-compat, inputs.md C.2 note
    )


def _size_booster(
    battery: BatteryRecommendation,
    drive_hours_per_day: float,
    input: AlgorithmInput,
    alternator_limit_a: float,
) -> BoosterRecommendation:
    """references/alternator.md + inputs.md C.3.

    Formulas::

        i_out = min(
            C_RATE_CHARGE_MAX[chem] * recommended_capacity_ah,
            alternator_limit_a * vehicle_voltage / system_voltage,
        )
        i_in  = system_voltage * i_out / (vehicle_voltage * BOOSTER_EFFICIENCY)
        E_drive_wh = drive_hours * i_out * system_voltage * BOOSTER_EFFICIENCY
    """
    chem = input.battery_preference
    needs_conversion = input.vehicle_voltage != input.system_voltage
    needed = "alternator" in input.energy_sources

    if not needed:
        return BoosterRecommendation(
            needed=False,
            input_current_a=0.0,
            output_current_a=0.0,
            current_a=0.0,
            input_voltage=input.vehicle_voltage,
            output_voltage=input.system_voltage,
            needs_conversion=needs_conversion,
            daily_alternator_charge_wh=0.0,
            original_current_a=None,
        )

    # Battery acceptance ceiling (Ah -> A via C-rate).
    battery_accept_a = (
        C_RATE_CHARGE_MAX[chem] * battery.recommended_capacity_ah
    )
    # Alternator's safe continuous power translated to house-side current.
    # P_alt = alternator_limit * vehicle_voltage ; house-side I = P / U_house
    alternator_max_output_a = (
        alternator_limit_a * input.vehicle_voltage
    ) / input.system_voltage
    output_current_a = min(battery_accept_a, alternator_max_output_a)
    input_current_a = (
        input.system_voltage * output_current_a
    ) / (input.vehicle_voltage * BOOSTER_EFFICIENCY)
    daily_alternator_charge_wh = (
        drive_hours_per_day
        * output_current_a
        * input.system_voltage
        * BOOSTER_EFFICIENCY
    )

    return BoosterRecommendation(
        needed=True,
        input_current_a=input_current_a,
        output_current_a=output_current_a,
        current_a=output_current_a,  # legacy alias
        input_voltage=input.vehicle_voltage,
        output_voltage=input.system_voltage,
        needs_conversion=needs_conversion,
        daily_alternator_charge_wh=daily_alternator_charge_wh,
        original_current_a=None,
    )


def _size_charger(
    battery: BatteryRecommendation,
    shore_availability: str,
    daily_wh: float,
    input: AlgorithmInput,
) -> ChargerRecommendation:
    """references/shore-power.md + inputs.md C.4.

    Formulas::

        target_c          = CHARGER_TARGET_C_RATE[shore_availability]
        i_target          = target_c * recommended_capacity_ah
                            (full_time uses max(i_target, i_avg_load))
        i_recommended     = min(i_target, C_RATE_CHARGE_MAX[chem] * cap)
        charging_time_h   = cap * DoD / (i_rec * CHARGER_EFFICIENCY)
                            + ABSORPTION_TAIL_H[chem]
    """
    if shore_availability == "never":
        return ChargerRecommendation(
            needed=False,
            target_current_a=0.0,
            recommended_current_a=0.0,
            charging_time_hours=0.0,
            original_recommended_current_a=None,
        )

    chem = input.battery_preference
    c_ah = battery.recommended_capacity_ah
    dod = DOD_DEFAULTS[chem]
    chem_ceiling_a = C_RATE_CHARGE_MAX[chem] * c_ah

    # Target current per shore availability.
    if shore_availability == "full_time":
        # Cover the 24 h rolling-average load as a floor, otherwise 0.25 C.
        if input.system_voltage > 0:
            i_avg_load = daily_wh / 24.0 / input.system_voltage
        else:
            i_avg_load = 0.0
        target_current_a = max(
            CHARGER_TARGET_C_RATE["full_time"] * c_ah, i_avg_load
        )
    else:
        target_current_a = (
            CHARGER_TARGET_C_RATE[shore_availability] * c_ah
        )

    # Clamp to chemistry charge ceiling.
    recommended_current_a = min(target_current_a, chem_ceiling_a)

    # Charging time: bulk from empty (DoD) + absorption tail.
    if recommended_current_a > 0:
        charging_time_hours = (
            (c_ah * dod) / (recommended_current_a * CHARGER_EFFICIENCY)
            + ABSORPTION_TAIL_H[chem]
        )
    else:
        # No current -> no finite charging time; report 0 rather than inf.
        charging_time_hours = 0.0

    return ChargerRecommendation(
        needed=True,
        target_current_a=target_current_a,
        recommended_current_a=recommended_current_a,
        charging_time_hours=charging_time_hours,
        original_recommended_current_a=None,
    )


def _size_inverter(peak_ac_w: float, peak_factor: float) -> InverterRecommendation:
    """references/inverter.md + inputs.md C.5.

    Formula::

        recommended_w = peak_ac_w * peak_factor  (raw, no rounding)
        needed        = peak_ac_w > 0
    """
    if peak_ac_w > 0:
        return InverterRecommendation(
            needed=True,
            peak_load_w=peak_ac_w,
            recommended_w=peak_ac_w * peak_factor,
            original_recommended_w=None,
        )
    return InverterRecommendation(
        needed=False,
        peak_load_w=0.0,
        recommended_w=0.0,
        original_recommended_w=None,
    )


def _size_controller(
    solar: SolarRecommendation, input: AlgorithmInput
) -> ControllerRecommendation:
    """references/solar.md "Sizing the MPPT" + inputs.md C.6.

    Formulas::

        current_a     = total_available_wp / system_voltage
        max_input_wp  = total_available_wp  (raw; downstream rounds up)
        needed        = solar.needed
    """
    if input.system_voltage > 0:
        current_a = solar.total_available_wp / input.system_voltage
    else:
        current_a = 0.0
    return ControllerRecommendation(
        needed=solar.needed,
        type="mppt",
        current_a=current_a,
        max_input_wp=solar.total_available_wp,
        original_current_a=None,
    )


def _size_cable(
    route_id: str,
    display_name: str,
    is_critical: bool,
    battery: BatteryRecommendation,
    solar: SolarRecommendation,
    booster: BoosterRecommendation,
    charger: ChargerRecommendation,
    inverter: InverterRecommendation,
    controller: ControllerRecommendation,
    peak_dc_w: float,
    input: AlgorithmInput,
) -> CableRecommendation:
    """references/cables.md + inputs.md C.7.

    For each route, resolve (L, I, U) per the route table in plan.md
    Section 9, then::

        dU_max_v          = U * (1 % critical / 3 % standard)
        min_cross_section = 2 * L * I * COPPER_RHO / dU_max_v   [mm^2]

    If L == 0 or I == 0, min_cross_section = 0 (route unused). The entry
    is still emitted so the output shape is stable.
    """
    cl = input.cable_lengths

    # The inverter DC input current at the house bank. Used twice (for
    # service_to_inverter and as a component of battery_to_fuse_box) -- hoist
    # once to avoid copy-paste drift.
    if inverter.recommended_w > 0 and input.system_voltage > 0:
        i_inv_dc = inverter.recommended_w / (
            input.system_voltage * INVERTER_EFFICIENCY
        )
    else:
        i_inv_dc = 0.0

    if route_id == "starter_to_booster":
        length_m = cl.starter_to_service
        current_a = booster.input_current_a
        voltage = float(input.vehicle_voltage)
    elif route_id == "booster_to_service":
        length_m = cl.booster_to_service
        current_a = booster.output_current_a
        voltage = float(input.system_voltage)
    elif route_id == "charger_to_service":
        length_m = cl.charger_to_service
        current_a = charger.recommended_current_a
        voltage = float(input.system_voltage)
    elif route_id == "service_to_inverter":
        length_m = cl.service_to_inverter
        current_a = i_inv_dc
        voltage = float(input.system_voltage)
    elif route_id == "solar_to_regulator":
        length_m = cl.solar_to_regulator
        current_a = controller.current_a
        voltage = float(input.system_voltage)
    elif route_id == "regulator_to_service":
        length_m = cl.regulator_to_service
        current_a = controller.current_a
        voltage = float(input.system_voltage)
    elif route_id == "battery_to_fuse_box":
        length_m = cl.battery_to_fuse_box
        current_a = (peak_dc_w / input.system_voltage) + i_inv_dc
        voltage = float(input.system_voltage)
    else:  # pragma: no cover -- defensive; ROUTES is closed
        raise ValueError(f"unknown route_id: {route_id!r}")

    du_max_pct = CRITICAL_DU_MAX_PCT if is_critical else STANDARD_DU_MAX_PCT
    du_max_v = voltage * du_max_pct / 100.0

    if length_m <= 0 or current_a <= 0 or du_max_v <= 0:
        min_cross_section = 0.0
    else:
        # Voltage-drop-limited minimum; references/cables.md core formula.
        min_cross_section = (2.0 * length_m * current_a * COPPER_RHO) / du_max_v

    return CableRecommendation(
        route=route_id,
        display_name=display_name,
        length_m=length_m,
        current_a=current_a,
        voltage=voltage,
        min_cross_section=min_cross_section,
        # Legacy: spec C.7 note says recommended == min until type is trimmed.
        recommended_cross_section=min_cross_section,
        is_critical=is_critical,
    )


# ===========================================================================
# ===========================================================================
# SECTION G -- MAIN compute_algorithm
# ---------------------------------------------------------------------------
# Orchestrates the sub-calculations in dependency order:
#     derive -> classify -> battery -> solar -> booster -> charger
#             -> inverter -> controller -> cables.
# ===========================================================================
# ===========================================================================


def compute_algorithm(
    input: AlgorithmInput,
    *,
    explain: bool = False,
    alternator_limit_a: float = ALTERNATOR_CONTINUOUS_LIMIT_A,
) -> AlgorithmOutput:
    """Size a camper 12/24/48 V electrical system.

    See the module docstring for the full contract. The return value is an
    ``AlgorithmOutput`` of raw numbers -- the downstream product-matching AI
    is responsible for rounding to standard Ah / Wp / mm^2 sizes.

    Args:
        input: Validated-by-this-function wizard payload (inputs.md Part A).
        explain: When True, ``AlgorithmOutput.breakdown`` is populated with
            every intermediate quantity used by the formulas. The pure
            numeric return values are identical whether explain is on or off.
        alternator_limit_a: Safe continuous alternator current override. Defaults
            to ``ALTERNATOR_CONTINUOUS_LIMIT_A`` = 60 A; override for
            documented higher-output alternators.

    Returns:
        AlgorithmOutput: Full output per inputs.md Part C (raw floats).

    Raises:
        ValueError: On any invalid input field or cross-field rule.
    """
    # --- validate at the boundary, before any computation ---
    validate(input)

    # --- clamp the autarky-days sentinel into the output domain ---
    max_days = MAX_AUTARCHY_DAYS[input.travel_behavior.trip_duration]
    effective_autarchy_days = min(input.autarchy_days, max_days)

    # --- derived signals ---
    drive_h = _drive_hours(input.travel_behavior, input.energy_sources)
    shore_avail = _shore_availability(input)
    peak_factor = PEAK_FACTOR[input.simultaneous_load]
    psh = _psh(input.travel_behavior)

    # --- energy classification ---
    dc_wh, ac_wh, peak_ac_w, peak_dc_w = _classify_consumers(input.consumers)
    # Inverter standby only when there is at least one AC load.
    inverter_standby_wh = (
        INVERTER_STANDBY_W * INVERTER_STANDBY_HOURS if peak_ac_w > 0 else 0.0
    )
    daily_wh = dc_wh + ac_wh / INVERTER_EFFICIENCY + inverter_standby_wh

    # --- sub-calculations in dependency order ---
    battery = _size_battery(daily_wh, effective_autarchy_days, input)
    solar = _size_solar(daily_wh, psh, input)
    booster = _size_booster(battery, drive_h, input, alternator_limit_a)
    charger = _size_charger(battery, shore_avail, daily_wh, input)
    inverter = _size_inverter(peak_ac_w, peak_factor)
    controller = _size_controller(solar, input)
    cables = [
        _size_cable(
            route_id,
            display_name,
            is_critical,
            battery,
            solar,
            booster,
            charger,
            inverter,
            controller,
            peak_dc_w,
            input,
        )
        for (route_id, display_name, is_critical) in ROUTES
    ]

    breakdown: Optional[Dict[str, Any]] = None
    if explain:
        breakdown = {
            "drive_hours_per_day": drive_h,
            "shore_availability": shore_avail,
            "peak_factor": peak_factor,
            "psh": psh,
            "dc_wh": dc_wh,
            "ac_wh": ac_wh,
            "peak_ac_w": peak_ac_w,
            "peak_dc_w": peak_dc_w,
            "inverter_standby_wh": inverter_standby_wh,
            "daily_wh": daily_wh,
            "effective_autarchy_days": effective_autarchy_days,
            "max_autarchy_days_for_trip": max_days,
            "alternator_limit_a": alternator_limit_a,
            "dod": DOD_DEFAULTS[input.battery_preference],
            "roundtrip_efficiency": ROUNDTRIP_DEFAULTS[input.battery_preference],
            "chem_c_rate_max": C_RATE_CHARGE_MAX[input.battery_preference],
            "absorption_tail_h": ABSORPTION_TAIL_H[input.battery_preference],
        }

    return AlgorithmOutput(
        battery=battery,
        solar=solar,
        booster=booster,
        charger=charger,
        inverter=inverter,
        controller=controller,
        cables=cables,
        breakdown=breakdown,
    )


# ===========================================================================
# ===========================================================================
# SECTION H -- TESTS & WORKED EXAMPLE
# ---------------------------------------------------------------------------
# Inline tests (no external framework). Running ``python
# algorithm/camper_electrics_sizing.py`` executes all tests and then prints
# a realistic camper worked example so the user can eyeball every
# intermediate quantity.
# ===========================================================================
# ===========================================================================


def _default_travel_behavior() -> TravelBehavior:
    return TravelBehavior(
        season="all_year",
        trip_duration="week",
        winter_location="germany",
        standing_duration="medium",
    )


def _default_cable_lengths(length: float = 2.0) -> CableLengths:
    return CableLengths(
        starter_to_service=length,
        booster_to_service=length,
        solar_to_regulator=length,
        regulator_to_service=length,
        charger_to_service=length,
        service_to_inverter=length,
        battery_to_fuse_box=length,
    )


def _minimal_input(
    *,
    consumers: Optional[List[Consumer]] = None,
    energy_sources: Optional[List[str]] = None,
    system_voltage: int = 12,
    vehicle_voltage: int = 12,
    battery_preference: str = "lifepo4",
    simultaneous_load: str = "low",
    autarchy_days: int = 1,
    cable_length: float = 2.0,
    travel: Optional[TravelBehavior] = None,
    roof_areas: Optional[List[RoofArea]] = None,
    solar_bags: Optional[List[SolarBag]] = None,
) -> AlgorithmInput:
    """Tiny builder used by tests + worked example, DRYs the constructors."""
    return AlgorithmInput(
        system_voltage=system_voltage,
        vehicle_voltage=vehicle_voltage,
        battery_preference=battery_preference,
        energy_sources=energy_sources if energy_sources is not None else [],
        roof_module_type="rigid",
        roof_areas=roof_areas if roof_areas is not None else [],
        solar_bags=solar_bags if solar_bags is not None else [],
        charger_speed="normal",
        consumers=consumers if consumers is not None else [],
        simultaneous_load=simultaneous_load,
        travel_behavior=travel if travel is not None else _default_travel_behavior(),
        autarchy_days=autarchy_days,
        cable_lengths=_default_cable_lengths(cable_length),
    )


def test_hand_computable() -> None:
    """Plan test 1: 12 V LFP, fridge 60 W / 24 h DC, laptop 90 W / 4 h AC,
    2 m cable, autarky 1 day, no energy sources.

    Pocket-calculator trace:
        dc_wh   = 60 * 24            = 1440
        ac_wh   = 90 * 4             =  360
        standby = 10 * 24            =  240  (peak_ac_w > 0 -> on)
        daily   = 1440 + 360/0.9 + 240 = 1440 + 400 + 240 = 2080 Wh

        battery (LFP, DoD=0.85, RT=0.95):
          c_usable = 2080 * 1 / 0.95 = 2189.47 Wh
          c_nom    = c_usable / 0.85 = 2575.85 Wh
          min_Ah   = c_nom / 12      =  214.65 Ah
          rec_Ah   = min_Ah * 1.25   =  268.32 Ah

        inverter (low sim -> 1.25):
          peak_load = 90 W
          rec_w     = 90 * 1.25      =  112.5 W

        cable battery_to_fuse_box (critical, 1 % drop, 12 V):
          i_inv_dc = 112.5 / (12 * 0.9) = 10.4167 A
          peak_dc  = 60 / 12            =  5.0 A
          I_total  = 15.4167 A
          dU_max   = 12 * 0.01 = 0.12 V
          min_mm^2 = 2 * 2 * 15.4167 * 0.0178 / 0.12 = 9.147 mm^2
    """
    consumers = [
        Consumer(id="fridge", name="Fridge", power=60, daily=24, voltage=12),
        Consumer(id="laptop", name="Laptop", power=90, daily=4, voltage=230),
    ]
    inp = _minimal_input(consumers=consumers, autarchy_days=1, cable_length=2.0)
    out = compute_algorithm(inp, explain=True)

    assert out.breakdown is not None
    assert abs(out.breakdown["dc_wh"] - 1440.0) < 1e-9, out.breakdown["dc_wh"]
    assert abs(out.breakdown["ac_wh"] - 360.0) < 1e-9, out.breakdown["ac_wh"]
    assert abs(out.breakdown["inverter_standby_wh"] - 240.0) < 1e-9
    assert abs(out.breakdown["daily_wh"] - 2080.0) < 1e-9, out.breakdown["daily_wh"]
    assert abs(out.battery.daily_wh - 2080.0) < 1e-9

    expected_min_ah = (2080.0 / 0.95) / 0.85 / 12
    expected_rec_ah = expected_min_ah * 1.25
    assert abs(out.battery.min_capacity_ah - expected_min_ah) < 1e-9
    assert abs(out.battery.recommended_capacity_ah - expected_rec_ah) < 1e-9

    assert out.inverter.needed is True
    assert abs(out.inverter.peak_load_w - 90.0) < 1e-9
    assert abs(out.inverter.recommended_w - 112.5) < 1e-9

    # No energy sources -> all supply paths quiet.
    assert out.solar.needed is False
    assert out.booster.needed is False
    assert out.charger.needed is False
    assert out.controller.needed is False

    # battery_to_fuse_box cable (last entry in ROUTES):
    b2f = next(c for c in out.cables if c.route == "battery_to_fuse_box")
    assert b2f.is_critical is True
    expected_i = (60.0 / 12.0) + (112.5 / (12.0 * 0.9))
    assert abs(b2f.current_a - expected_i) < 1e-9
    expected_min_mm2 = (2 * 2.0 * expected_i * COPPER_RHO) / (12.0 * 0.01)
    assert abs(b2f.min_cross_section - expected_min_mm2) < 1e-9
    assert b2f.recommended_cross_section == b2f.min_cross_section

    # Every route emitted exactly once, in ROUTES order.
    assert [c.route for c in out.cables] == [r[0] for r in ROUTES]


def test_empty_consumers() -> None:
    """Plan test 2: no consumers -> all zeros, no crash."""
    inp = _minimal_input(consumers=[])
    out = compute_algorithm(inp)

    assert out.battery.daily_wh == 0.0
    assert out.battery.min_capacity_ah == 0.0
    assert out.battery.recommended_capacity_ah == 0.0
    assert out.inverter.needed is False
    assert out.inverter.peak_load_w == 0.0
    assert out.inverter.recommended_w == 0.0
    # All currents on all routes should be zero.
    for c in out.cables:
        assert c.current_a == 0.0
        assert c.min_cross_section == 0.0
        assert c.recommended_cross_section == 0.0
    # Output shape is stable: 7 cables in ROUTES order.
    assert len(out.cables) == 7
    assert [c.route for c in out.cables] == [r[0] for r in ROUTES]


def test_all_dc_no_ac() -> None:
    """Plan test 3: all DC -> inverter.needed False, standby NOT added."""
    consumers = [
        Consumer(id="f", name="Fridge", power=60, daily=24, voltage=12),
        Consumer(id="p", name="Pump", power=50, daily=0.5, voltage=12),
    ]
    inp = _minimal_input(consumers=consumers)
    out = compute_algorithm(inp, explain=True)

    assert out.inverter.needed is False
    assert out.inverter.peak_load_w == 0.0
    assert out.inverter.recommended_w == 0.0
    assert out.breakdown is not None
    assert out.breakdown["inverter_standby_wh"] == 0.0
    expected_daily = 60 * 24 + 50 * 0.5
    assert abs(out.battery.daily_wh - expected_daily) < 1e-9


def test_invalid_input_raises() -> None:
    """Plan test 4: invalid inputs raise ValueError."""
    # bad consumer voltage
    try:
        compute_algorithm(
            _minimal_input(
                consumers=[
                    Consumer(id="x", name="X", power=10, daily=1, voltage=100)
                ]
            )
        )
        assert False, "expected ValueError on consumer voltage=100"
    except ValueError:
        pass

    # autarchy_days > 999
    try:
        compute_algorithm(_minimal_input(autarchy_days=1000))
        assert False, "expected ValueError on autarchy_days=1000"
    except ValueError:
        pass

    # autarchy_days exceeds per-trip-duration max (weekend -> 3)
    tb = TravelBehavior(
        season="summer",
        trip_duration="weekend",
        winter_location="germany",
        standing_duration="short",
    )
    try:
        compute_algorithm(_minimal_input(travel=tb, autarchy_days=5))
        assert False, "expected ValueError on autarchy_days=5 for weekend"
    except ValueError:
        pass

    # negative power
    try:
        compute_algorithm(
            _minimal_input(
                consumers=[
                    Consumer(id="x", name="X", power=-5, daily=1, voltage=12)
                ]
            )
        )
        assert False, "expected ValueError on negative power"
    except ValueError:
        pass

    # permanent + non-all_year season (cross-field rule)
    tb2 = TravelBehavior(
        season="summer",
        trip_duration="permanent",
        winter_location="germany",
        standing_duration="long",
    )
    try:
        compute_algorithm(_minimal_input(travel=tb2, autarchy_days=30))
        assert False, "expected ValueError on permanent+summer"
    except ValueError:
        pass

    # bad system_voltage
    try:
        bad = _minimal_input()
        bad.system_voltage = 110  # type: ignore[assignment]
        compute_algorithm(bad)
        assert False, "expected ValueError on system_voltage=110"
    except ValueError:
        pass


def test_monotonic_battery() -> None:
    """Plan test 5: adding a consumer never reduces battery.recommended_capacity_ah."""
    base = [Consumer(id="f", name="Fridge", power=60, daily=24, voltage=12)]
    more = base + [Consumer(id="l", name="Laptop", power=90, daily=4, voltage=230)]
    base_out = compute_algorithm(_minimal_input(consumers=base))
    more_out = compute_algorithm(_minimal_input(consumers=more))
    assert (
        more_out.battery.recommended_capacity_ah
        >= base_out.battery.recommended_capacity_ah
    )
    assert more_out.battery.daily_wh >= base_out.battery.daily_wh
    assert more_out.inverter.recommended_w >= base_out.inverter.recommended_w


def test_unit_round_trip_wh_ah() -> None:
    """Plan test 6: Wh at 12 V -> Ah -> Wh comes back within 1e-9."""
    wh = 1200.0
    u = 12.0
    ah = wh / u
    assert abs(ah * u - wh) < 1e-9
    # Spot-check the algorithm's internal conversion: c_nom_Wh / U_system = Ah.
    # For a consumer that burns exactly 1200 Wh/day at 12 V DC, 1 day autarky,
    # no AC, LFP: c_nom_Wh = 1200 / 0.95 / 0.85 ; min_ah = c_nom / 12.
    inp = _minimal_input(
        consumers=[Consumer(id="x", name="X", power=100, daily=12, voltage=12)]
    )
    out = compute_algorithm(inp)
    expected_c_nom_wh = (1200.0 / 0.95) / 0.85
    # min_ah * 12 should equal c_nom_wh within float precision.
    assert abs(out.battery.min_capacity_ah * 12.0 - expected_c_nom_wh) < 1e-9


def test_autarchy_sentinel_clamped() -> None:
    """``autarchy_days = 999`` is clamped to MAX_AUTARCHY_DAYS[trip_duration]
    and echoed in the output."""
    inp = _minimal_input(autarchy_days=AUTARCHY_UNBOUNDED)  # default trip=week -> 10
    out = compute_algorithm(inp)
    assert out.battery.autarchy_days == MAX_AUTARCHY_DAYS["week"]


def test_shore_availability_precedence() -> None:
    """full_time only when trip_duration=permanent AND charger_speed != slow."""
    tb_perm = TravelBehavior(
        season="all_year",
        trip_duration="permanent",
        winter_location="germany",
        standing_duration="long",
    )

    # shore_power absent -> never, regardless of charger_speed.
    inp = _minimal_input(travel=tb_perm, autarchy_days=30, energy_sources=[])
    assert _shore_availability(inp) == "never"

    # permanent + slow -> still "occasional" (row precedence in A.7.2).
    inp = _minimal_input(
        travel=tb_perm, autarchy_days=30, energy_sources=["shore_power"]
    )
    inp.charger_speed = "slow"
    assert _shore_availability(inp) == "occasional"

    # permanent + normal -> full_time.
    inp.charger_speed = "normal"
    assert _shore_availability(inp) == "full_time"

    # permanent + fast -> full_time.
    inp.charger_speed = "fast"
    assert _shore_availability(inp) == "full_time"

    # non-permanent follows charger_speed.
    inp = _minimal_input(energy_sources=["shore_power"])
    inp.charger_speed = "fast"
    assert _shore_availability(inp) == "nightly_fast"


def test_cable_sizing_matches_cables_md_worked_example() -> None:
    """References/cables.md worked example: 120 A continuous at 12 V, 3 m,
    3 % drop -> A_min = 35.6 mm^2. Our formula must reproduce this."""
    L = 3.0
    I = 120.0
    U = 12.0
    du_max_pct = 3.0
    du_max_v = U * du_max_pct / 100.0
    a_min = (2.0 * L * I * COPPER_RHO) / du_max_v
    assert abs(a_min - 35.6) < 0.1, a_min  # cables.md rounds to 35.6


def test_booster_for_24v_bank_from_12v_alt() -> None:
    """references/alternator.md worked example: 40 A / 24 V B2B from 12 V alt
    draws 89 A on starter side (i_in = 24*40 / (12*0.9) = 88.9)."""
    # Build a case that forces output_current_a = 40 A. Set recommended_capacity_ah
    # such that 0.5 * cap = 40 (-> cap = 80), and make the alternator limit very
    # large so the battery-acceptance ceiling wins.
    battery = BatteryRecommendation(
        daily_wh=0.0,
        min_capacity_ah=80.0,
        recommended_capacity_ah=80.0,
        type="lifepo4",
        voltage=24,
        autarchy_days=1,
        has_solar=False,
        has_alternator=True,
    )
    inp = _minimal_input(
        system_voltage=24, vehicle_voltage=12, energy_sources=["alternator"]
    )
    booster = _size_booster(battery, drive_hours_per_day=1.0, input=inp, alternator_limit_a=500.0)
    assert abs(booster.output_current_a - 40.0) < 1e-9
    expected_in = (24.0 * 40.0) / (12.0 * 0.9)
    assert abs(booster.input_current_a - expected_in) < 1e-9
    assert booster.needs_conversion is True


def test_solar_shortfall_nonnegative() -> None:
    """solar_shortfall_wh >= 0 even when yield > demand."""
    big_bags = [SolarBag(id="a", power=2000), SolarBag(id="b", power=2000)]
    inp = _minimal_input(
        consumers=[Consumer(id="f", name="F", power=60, daily=24, voltage=12)],
        energy_sources=["solar"],
        solar_bags=big_bags,
    )
    out = compute_algorithm(inp)
    assert out.solar.solar_shortfall_wh >= 0.0


def test_roof_wp_conversion() -> None:
    """Roof area cm^2 -> m^2 -> Wp conversion."""
    # 2 m x 1 m rigid = 200 cm x 100 cm = 2 m^2 ; 2 * 200 Wp/m^2 * 0.8 = 320 Wp.
    ra = [RoofArea(id="r", name="Roof", length=200, width=100)]
    wp = _roof_wp(ra, "rigid")
    assert abs(wp - 320.0) < 1e-9


def test_legacy_compat_fields() -> None:
    """Spec C: recommendation = '' and recommended_cross_section == min_cross_section."""
    consumers = [Consumer(id="l", name="Laptop", power=90, daily=4, voltage=230)]
    out = compute_algorithm(_minimal_input(consumers=consumers))
    assert out.solar.recommendation == ""
    for c in out.cables:
        assert c.recommended_cross_section == c.min_cross_section


def test_booster_output_equals_current_a_alias() -> None:
    """Spec C.3 legacy: booster.current_a must equal booster.output_current_a."""
    inp = _minimal_input(
        consumers=[Consumer(id="f", name="F", power=60, daily=24, voltage=12)],
        energy_sources=["alternator"],
        autarchy_days=2,
    )
    out = compute_algorithm(inp)
    assert out.booster.current_a == out.booster.output_current_a


def test_every_route_emitted_in_stable_order() -> None:
    """Output always has 7 cables in the ROUTES order -- shape stability."""
    inp = _minimal_input()
    out = compute_algorithm(inp)
    assert len(out.cables) == 7
    expected_order = [r[0] for r in ROUTES]
    assert [c.route for c in out.cables] == expected_order


def _run_tests() -> None:
    """Execute every test above, print a summary line, raise on first failure."""
    tests = [
        test_hand_computable,
        test_empty_consumers,
        test_all_dc_no_ac,
        test_invalid_input_raises,
        test_monotonic_battery,
        test_unit_round_trip_wh_ah,
        test_autarchy_sentinel_clamped,
        test_shore_availability_precedence,
        test_cable_sizing_matches_cables_md_worked_example,
        test_booster_for_24v_bank_from_12v_alt,
        test_solar_shortfall_nonnegative,
        test_roof_wp_conversion,
        test_legacy_compat_fields,
        test_booster_output_equals_current_a_alias,
        test_every_route_emitted_in_stable_order,
    ]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"\n{len(tests)} tests passed.\n")


def _worked_example() -> AlgorithmOutput:
    """Realistic camper: 12 V LFP, 2 roof panels, 200 W compressor fridge +
    laptop + pump, weekend trip in Germany, 2 days autarky, shore power and
    solar available (no alternator).
    """
    consumers = [
        Consumer(
            id="fridge",
            name="Compressor fridge",
            power=60,
            daily=24,
            voltage=12,
            average_load_percent=40,  # duty cycle ~40 %
            cooling_method="compressor",
        ),
        Consumer(id="laptop", name="Laptop", power=90, daily=4, voltage=230),
        Consumer(id="pump", name="Water pump", power=50, daily=0.5, voltage=12),
        Consumer(id="led", name="LED lighting", power=15, daily=5, voltage=12),
    ]
    roof = [
        RoofArea(id="r1", name="Front", length=160, width=80),
        RoofArea(id="r2", name="Rear", length=160, width=80),
    ]
    tb = TravelBehavior(
        season="summer",
        trip_duration="weekend",
        winter_location="germany",
        standing_duration="medium",
    )
    inp = AlgorithmInput(
        system_voltage=12,
        vehicle_voltage=12,
        battery_preference="lifepo4",
        energy_sources=["solar", "shore_power"],
        roof_module_type="rigid",
        roof_areas=roof,
        solar_bags=[],
        charger_speed="normal",
        consumers=consumers,
        simultaneous_load="moderate",
        travel_behavior=tb,
        autarchy_days=2,
        cable_lengths=CableLengths(
            starter_to_service=3.0,
            booster_to_service=1.0,
            solar_to_regulator=4.0,
            regulator_to_service=1.0,
            charger_to_service=1.5,
            service_to_inverter=0.8,
            battery_to_fuse_box=1.2,
        ),
    )
    return compute_algorithm(inp, explain=True)


def _print_output(out: AlgorithmOutput) -> None:
    """Pretty-print an AlgorithmOutput so the human can eyeball numbers."""
    b = out.battery
    print("--- battery ---")
    print(f"  daily_wh              = {b.daily_wh:.2f} Wh")
    print(f"  min_capacity_ah       = {b.min_capacity_ah:.2f} Ah")
    print(f"  recommended_capacity  = {b.recommended_capacity_ah:.2f} Ah")
    print(
        f"  type / voltage        = {b.type} / {b.voltage} V  "
        f"(autarchy {b.autarchy_days} d, solar={b.has_solar}, "
        f"alt={b.has_alternator})"
    )

    s = out.solar
    print("--- solar ---")
    print(f"  needed                = {s.needed}")
    print(f"  required_wp           = {s.required_wp:.2f} Wp")
    print(
        f"  max_roof_wp           = {s.max_roof_wp:.2f} Wp "
        f"(portable {s.portable_wp:.2f}, total {s.total_available_wp:.2f})"
    )
    print(f"  daily_solar_yield_wh  = {s.daily_solar_yield_wh:.2f} Wh")
    print(f"  solar_shortfall_wh    = {s.solar_shortfall_wh:.2f} Wh")

    bo = out.booster
    print("--- booster ---")
    print(f"  needed                = {bo.needed}")
    print(
        f"  output_current_a      = {bo.output_current_a:.2f} A  "
        f"(input {bo.input_current_a:.2f} A; conversion={bo.needs_conversion})"
    )
    print(
        f"  voltages              = {bo.input_voltage} V -> {bo.output_voltage} V"
    )
    print(f"  daily_alternator_wh   = {bo.daily_alternator_charge_wh:.2f} Wh")

    ch = out.charger
    print("--- charger ---")
    print(f"  needed                = {ch.needed}")
    print(f"  target_current_a      = {ch.target_current_a:.2f} A")
    print(f"  recommended_current_a = {ch.recommended_current_a:.2f} A")
    print(f"  charging_time_hours   = {ch.charging_time_hours:.2f} h")

    inv = out.inverter
    print("--- inverter ---")
    print(f"  needed                = {inv.needed}")
    print(f"  peak_load_w           = {inv.peak_load_w:.2f} W")
    print(f"  recommended_w         = {inv.recommended_w:.2f} W")

    co = out.controller
    print("--- controller ---")
    print(f"  needed / type         = {co.needed} / {co.type}")
    print(f"  current_a             = {co.current_a:.2f} A")
    print(f"  max_input_wp          = {co.max_input_wp:.2f} Wp")

    print("--- cables ---")
    for c in out.cables:
        print(
            f"  {c.route:<24}  L={c.length_m:4.1f} m  "
            f"I={c.current_a:7.2f} A  U={c.voltage:5.1f} V  "
            f"min={c.min_cross_section:6.2f} mm^2  critical={c.is_critical}"
        )

    if out.breakdown is not None:
        print("--- breakdown (explain=True) ---")
        for k, v in out.breakdown.items():
            if isinstance(v, float):
                print(f"  {k:<30} = {v:.4f}")
            else:
                print(f"  {k:<30} = {v}")


if __name__ == "__main__":
    print("Running inline tests...\n")
    _run_tests()
    print("=== Worked example: weekend trip, 12 V LFP, DE, summer ===\n")
    _print_output(_worked_example())
