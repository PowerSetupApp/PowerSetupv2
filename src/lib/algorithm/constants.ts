/**
 * Algorithm constants — 1:1 TypeScript mirror of SECTION B of
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Every value has a one-line source comment citing either inputs.md (spec)
 * or the relevant reference file. NO other file in
 * `src/lib/algorithm/**` introduces magic numbers.
 *
 * The new algorithm is pure — it does NOT read from the DB. If any of these
 * values ever become admin-tunable, the UI should feed them into
 * `computeAlgorithm(input, { alternatorLimitA, ... })` as named overrides.
 */

import type {
  BatteryPreference,
  ChargerSpeed,
  ConsumerVoltage,
  CoolingMethod,
  EnergySource,
  RoofModuleType,
  Season,
  ShoreAvailability,
  SimultaneousLoad,
  StandingDuration,
  SystemVoltage,
  TripDuration,
  WinterLocation,
} from "./types";

// ---------------------------------------------------------------------------
// B.1 Validation bounds (inputs.md B.1)
// ---------------------------------------------------------------------------

/** Max `Consumer.power` [W]. */
export const MAX_POWER_W = 20_000;
/** Max `Consumer.daily` [h/day]. */
export const MAX_HOURS_PER_DAY = 24;
/** Max `SolarBag.power` [Wp]. */
export const MAX_SOLAR_BAG_W = 4_000;
/** Max `RoofArea.length` / `width` [cm] (= 50 m). */
export const MAX_ROOF_DIM_CM = 5_000;
/** Max any `CableLengths.*` [m]. */
export const MAX_CABLE_LENGTH_M = 100;

// ---------------------------------------------------------------------------
// B.2 Autarky upper bounds per trip duration + top-up profile (inputs.md B.2)
// ---------------------------------------------------------------------------

/**
 * The "top-up profile" describes what keeps flowing into the bank while the
 * user is off-grid — derived from `energySources` by
 * `autarchyTopUpProfile(input)`:
 *
 *   - `battery_only`   — neither `solar` nor `alternator` (shore-only counts
 *                        as battery_only because shore power does not help
 *                        while off-grid by definition).
 *   - `solar_or_alt`   — exactly one of the two.
 *   - `solar_and_alt`  — both.
 */
export type AutarchyTopUpProfile =
  | "battery_only"
  | "solar_or_alt"
  | "solar_and_alt";

/**
 * Inclusive upper bound for `autarchyDays`, keyed on
 * `(tripDuration, topUpProfile)`.
 *
 * These are **soft-autarky** values — the number of days the user wants to
 * stay off-grid while solar and/or the alternator keep trickling in. The
 * battery only covers the residual deficit (see `sizeBattery`), so the caps
 * grow when a reliable top-up is present and shrink when the bank is on its
 * own.
 *
 * Realistic ceilings from `references/batteries.md` + `references/solar.md`:
 *   - `battery_only`  — bank alone, no recharge. Limited by usable chemistry
 *                       capacity and cost (multi-day bridge blows up Ah).
 *   - `solar_or_alt`  — one reliable top-up stream. Covers weekend / holiday
 *                       scenarios at mild latitudes.
 *   - `solar_and_alt` — both streams. "Permanent" users get up to ~90 days,
 *                       matching the legacy 1–90 slider range.
 *
 * The slider in `getAutarchyWizardMaxDays` mirrors these caps; the two
 * tables must stay in sync.
 */
export const MAX_AUTARCHY_DAYS: Record<
  TripDuration,
  Record<AutarchyTopUpProfile, number>
> = {
  weekend: { battery_only: 3, solar_or_alt: 5, solar_and_alt: 7 },
  week: { battery_only: 7, solar_or_alt: 10, solar_and_alt: 14 },
  extended: { battery_only: 14, solar_or_alt: 30, solar_and_alt: 45 },
  permanent: { battery_only: 21, solar_or_alt: 60, solar_and_alt: 90 },
};

// ---------------------------------------------------------------------------
// B.3 Autarky sentinel (inputs.md B.3)
// ---------------------------------------------------------------------------

/** "Maximum / unbegrenzt" marker — wizard clamps to `MAX_AUTARCHY_DAYS[td]`. */
export const AUTARCHY_UNBOUNDED = 999;

// ---------------------------------------------------------------------------
// B.4 Closed enum sets (inputs.md B.4)
// ---------------------------------------------------------------------------

export const SYSTEM_VOLTAGES: readonly SystemVoltage[] = [12, 24, 48] as const;
export const CONSUMER_VOLTAGES: readonly ConsumerVoltage[] = [
  12, 24, 48, 230,
] as const;
export const BATTERY_PREFERENCES: readonly BatteryPreference[] = [
  "lifepo4",
  "agm",
  "gel",
] as const;
export const ENERGY_SOURCES: readonly EnergySource[] = [
  "solar",
  "alternator",
  "shore_power",
] as const;
export const ROOF_MODULE_TYPES: readonly RoofModuleType[] = [
  "rigid",
  "flexible",
] as const;
export const CHARGER_SPEEDS: readonly ChargerSpeed[] = [
  "slow",
  "normal",
  "fast",
] as const;
export const SIMULTANEOUS_LOADS: readonly SimultaneousLoad[] = [
  "low",
  "moderate",
  "high",
] as const;
export const SEASONS: readonly Season[] = [
  "summer",
  "all_year",
  "winter",
] as const;
export const TRIP_DURATIONS: readonly TripDuration[] = [
  "weekend",
  "week",
  "extended",
  "permanent",
] as const;
export const WINTER_LOCATIONS: readonly WinterLocation[] = [
  "scandinavia",
  "germany",
  "southern",
  "eastern",
  "varies",
] as const;
export const STANDING_DURATIONS: readonly StandingDuration[] = [
  "short",
  "medium",
  "long",
] as const;
export const COOLING_METHODS: readonly CoolingMethod[] = [
  "compressor",
  "absorber",
] as const;

// ---------------------------------------------------------------------------
// B.5 Cable routes (inputs.md B.5) — fixed order, always 7 entries
// ---------------------------------------------------------------------------

/** One route per tuple: `[routeId, displayName, isCritical]`. */
export const ROUTES: readonly [string, string, boolean][] = [
  ["starter_to_booster", "Starter -> Ladebooster", true],
  ["booster_to_service", "Ladebooster -> Versorgerbatterie", true],
  ["charger_to_service", "Landlader -> Versorgerbatterie", false],
  ["service_to_inverter", "Versorgerbatterie -> Wechselrichter", true],
  ["solar_to_regulator", "PV -> Laderegler", false],
  ["regulator_to_service", "Laderegler -> Versorgerbatterie", false],
  ["battery_to_fuse_box", "Versorgerbatterie -> Sicherungskasten", true],
] as const;

/** cables.md: sensitive / critical DC feeders — 1 % drop budget. */
export const CRITICAL_DU_MAX_PCT = 1.0;
/** cables.md: standard DC distribution — 3 % drop budget. */
export const STANDARD_DU_MAX_PCT = 3.0;

// ---------------------------------------------------------------------------
// B.6 Physical / algorithm constants (inputs.md B.6)
// ---------------------------------------------------------------------------

/** η_inv for AC-Wh -> DC-Wh conversion (references/inverter.md). */
export const INVERTER_EFFICIENCY = 0.9;

/** No-load draw of a medium pure-sine inverter (references/inverter.md). */
export const INVERTER_STANDBY_W = 10;

/** Default on-hours for inverter standby (always-on). */
export const INVERTER_STANDBY_HOURS = 24;

/** η_B2B for starter-side current and daily alternator charge (references/alternator.md). */
export const BOOSTER_EFFICIENCY = 0.9;

/** η_shoreCharger for charge-time calculation (references/shore-power.md). */
export const CHARGER_EFFICIENCY = 0.92;

/** η_system for a flat-mounted camper array with good MPPT + LFP (references/solar.md). */
export const SOLAR_SYSTEM_EFFICIENCY = 0.75;

/** Permitted depth of discharge per chemistry (references/batteries.md). */
export const DOD_DEFAULTS: Record<BatteryPreference, number> = {
  lifepo4: 0.85,
  agm: 0.5,
  gel: 0.5,
};

/** Round-trip charge/discharge efficiency per chemistry (references/batteries.md). */
export const ROUNDTRIP_DEFAULTS: Record<BatteryPreference, number> = {
  lifepo4: 0.95,
  agm: 0.83,
  gel: 0.8,
};

/** Capacity reserve on top of min_capacity_ah (cold weather, ageing, headroom). */
export const RESERVE_FACTOR = 1.25;

/**
 * Derate on the chosen-season PSH when estimating the solar contribution
 * during a soft-autarky bridge window (references/solar.md "the winter
 * problem" + "shoulder-season sizing"). The idea: the user already picked
 * a season, so the base PSH reflects their typical conditions — but during
 * the autarky window we assume a *cloudy-week stretch* inside that season.
 *
 * Calibrated against real-world camper experience: 1 kWp on a roof in
 * Southern Spain winter + an all-year 200 Ah @ 24 V LFP bank is known to
 * be sufficient for a permanent user with ~1.7 kWh/day demand. That only
 * holds if the bridge model assumes a *cloudy* week (~50 % of seasonal
 * PSH), not a catastrophic one (~30 %). 0.30 was too pessimistic and
 * produced 900+ Ah recommendations for that exact setup.
 *
 * The per-season PSH table itself already captures the north-vs-south
 * reality (scandinavia winter 0.3 PSH vs southern winter 1.9 PSH); the
 * derate multiplier is applied on top of those values.
 *
 * Used by `sizeBattery` when computing `solarTopUpWh`. The solar phase
 * itself (`sizeSolar`) keeps using the raw PSH — this derate only affects
 * battery sizing.
 */
export const AUTARCHY_PSH_DERATE = 0.5;

/**
 * Physical upper bound on the "bad-weather streak" we size the battery for.
 *
 * `autarchyDays` is the user-facing slider (1..`MAX_AUTARCHY_DAYS[td][profile]`,
 * up to 90 for `permanent + solar_and_alt`). Naively multiplying a per-day
 * deficit across the whole slider range gives physically impossible bank
 * sizes — nobody gets 60+ consecutive bad-weather-parked days. Over long
 * horizons the seasonal average dominates, not a sustained worst case.
 *
 * 7 days is the practical ceiling on contiguous cloudy stretches in
 * European climates (references/solar.md). Above this, additional slider
 * days no longer grow the battery because the assumption "every day is a
 * bad day" stops holding and the user will either see sun again or drive.
 */
export const AUTARCHY_MAX_BRIDGE_DAYS = 7;

/**
 * Upper bound on the fraction of daily demand that solar + alternator
 * top-ups can offset during the soft-autarky bridge.
 *
 * Physical rationale: even with massively oversized solar, the battery
 * still has to carry the night / dawn / dusk share of daily consumption
 * (fridge, router, heater controller never stop). Solar can offset the
 * daytime-window share AND re-top the bank during the day — but it can
 * never offset the night. Empirically ≈ 25 % of daily consumption is
 * non-offsetable on a typical permanent-camper load profile, so a 0.75
 * cap reflects that.
 *
 * This is the central knob that makes every wizard input "matter":
 *
 *   - Without the cap: `max(dailyWh − dailyTopUp, 0)` collapses to 0 as
 *     soon as solar+alternator cover daily demand, which makes the
 *     autarky-day slider, solar-bag toggle and alternator on/off all
 *     become invisible (only the 1-day hard floor remains).
 *
 *   - With the cap at 0.75 (plus the portable bump above when bags exist):
 *     the bridge deficit is `dailyWh × (1 − coverageRatio)` with
 *     `coverageRatio = min(rawCoverage, effectiveCap)`, so autarky days
 *     scale the battery linearly up to `AUTARCHY_MAX_BRIDGE_DAYS`, and
 *     *reducing* `dailyTopUp` (fewer panels, no bag, no alternator) always
 *     grows the battery until raw coverage drops below the effective cap.
 */
export const TOP_UP_COVERAGE_CAP = 0.75;

/**
 * PSH band for scaling the **base** top-up coverage cap in `sizeBattery`
 * (before the portable bump). At {@link TOP_UP_COVERAGE_PSH_BAND_HIGH} and
 * above, the base cap equals {@link TOP_UP_COVERAGE_CAP}; at
 * {@link TOP_UP_COVERAGE_PSH_BAND_LOW} and below it equals
 * {@link TOP_UP_COVERAGE_CAP_AT_LOW_PSH}. Linear in between.
 *
 * Anchors align with `PSH_TABLE` (southern `all_year` ≈ 2.5 h; harsh winter /
 * north `all_year` down to ≈ 0.8 h).
 */
export const TOP_UP_COVERAGE_PSH_BAND_HIGH = 2.5;
export const TOP_UP_COVERAGE_PSH_BAND_LOW = 0.8;
/**
 * Minimum trusted fraction of `dailyWh` that solar + alternator can offset
 * during the soft bridge when PSH is at or below {@link TOP_UP_COVERAGE_PSH_BAND_LOW}.
 * Lower than {@link TOP_UP_COVERAGE_CAP} → larger battery in grey winters.
 */
export const TOP_UP_COVERAGE_CAP_AT_LOW_PSH = 0.58;

/**
 * Portable solar (Solartaschen) can push the effective coverage cap above
 * {@link TOP_UP_COVERAGE_CAP}. Reason: when roof + alternator already hit
 * the flat 0.75 cap, `min(rawCoverage, 0.75)` ignores **any** extra Wp from
 * bags — the user sees zero effect on battery Ah. In reality deployable
 * panels are tilted/aimed in bad weather and add marginal Wh that chip
 * away at the uncoverageable night share.
 *
 * `effectiveCap = min(TOP_UP_COVERAGE_ABS_MAX, TOP_UP_COVERAGE_CAP +
 *   min(TOP_UP_COVERAGE_PORTABLE_CAP_BUMP,
 *       (portableBridgeSolarWh / dailyWh) × TOP_UP_COVERAGE_PORTABLE_WEIGHT))`
 *
 * Only the **bag** portion of bridge solar (`portableEffectiveWp × …`) is
 * used here — roof Wp does not get this bump (it is already in rawCoverage).
 */
export const TOP_UP_COVERAGE_PORTABLE_WEIGHT = 0.55;
export const TOP_UP_COVERAGE_PORTABLE_CAP_BUMP = 0.18;
/** Never claim > 97 % of daily demand can be offset (BMS, wiring, clouds). */
export const TOP_UP_COVERAGE_ABS_MAX = 0.97;

/**
 * Fraction of {@link alternatorTopUpWh} credited toward the battery **coverage
 * bridge** only (`rawCoverage` in `sizeBattery`). Full alternator Wh still
 * feed `dailyTopUpWh`, `netDailyDeficitWh`, booster, and UI — long parked
 * stretches are less LM-reliant than calendar-average drive hours, so the
 * bridge must not plateau against the PSH cap when standing is short vs long.
 *
 * See `references/alternator.md` (combine alternator / solar / shore; parked
 * days vs driving every day).
 */
export const ALTERNATOR_BRIDGE_STANDING_CREDIT: Record<
  StandingDuration,
  number
> = {
  short: 1,
  medium: 0.82,
  long: 0.38,
};

/**
 * Multiplier on the **effective** top-up coverage cap (PSH base + portable
 * bump, before `Math.min(rawCoverage, cap)`) when the alternator is selected.
 *
 * `DRIVE_HOURS_PER_DAY.permanent` is identical for short/medium/long (0.5 h),
 * so LM Wh alone cannot differentiate standing — after
 * {@link ALTERNATOR_BRIDGE_STANDING_CREDIT} the derated `rawCoverage` can
 * still sit above the PSH cap (e.g. 0.83 > 0.75). This multiplier lowers the
 * cap for long/medium standing so `coverageRatio` and battery Ah move.
 *
 * **Applied only** in `sizeBattery` when `tripDuration === "permanent"` and
 * the alternator is selected — other trip rows already vary drive hours by
 * `standingDuration`, so skipping avoids double-penalising `extended` / `week`.
 */
export const TOP_UP_COVERAGE_STANDING_CAP_MULT: Record<
  StandingDuration,
  number
> = {
  short: 1,
  medium: 0.96,
  long: 0.9,
};

/**
 * Minimum days of raw daily consumption the battery must cover
 * independent of top-ups. One day = "stormy parked day with nothing
 * coming in". Applies uniformly to every profile; the soft bridge scales
 * above this for users who set more autarky days, and the coverage cap
 * above keeps the soft bridge non-zero so the slider actually moves the
 * recommendation.
 */
export const HARD_BRIDGE_DAYS = 1.0;

/** Roof-mounted panel peak-power density by module type (references/solar.md). */
export const WP_PER_M2: Record<RoofModuleType, number> = {
  rigid: 200.0,
  flexible: 150.0,
};

/** Fraction of a rectangular roof area that can actually be panelled. */
export const ROOF_PACKING_FACTOR = 0.8;

/**
 * Fraction of days the user actually deploys portable panels (wind, travel,
 * theft risk). references/solar.md — conservative planning, not best-case.
 */
export const SOLAR_BAG_UTILIZATION = 0.6;

/**
 * Extra effective yield vs same nominal Wp on a flat roof: tilt/azimuth
 * optimisation is worth more when the sun is low (winter / north) and less
 * when the sun is high (summer / south). references/solar.md (PSH, tilt).
 */
export const SOLAR_BAG_ALIGNMENT_UPLIFT: Record<
  WinterLocation,
  Record<Season, number>
> = {
  scandinavia: { summer: 1.15, all_year: 1.55, winter: 2.0 },
  germany: { summer: 1.15, all_year: 1.45, winter: 1.8 },
  southern: { summer: 1.08, all_year: 1.2, winter: 1.4 },
  eastern: { summer: 1.15, all_year: 1.5, winter: 1.9 },
  varies: { summer: 1.15, all_year: 1.45, winter: 1.75 },
};

/** Copper resistivity in Ω·mm²/m (VDE / DIN engineering value at elevated T). */
export const COPPER_RHO = 0.0178;

/** Maximum continuous charge C-rate per chemistry (references/batteries.md). */
export const C_RATE_CHARGE_MAX: Record<BatteryPreference, number> = {
  lifepo4: 0.5,
  agm: 0.2,
  gel: 0.15,
};

/**
 * Safe continuous alternator output under-hood on a modern Euro-6 diesel van.
 * Override via `computeAlgorithm(input, { alternatorLimitA: ... })` for
 * documented higher-output alternators.
 */
export const ALTERNATOR_CONTINUOUS_LIMIT_A = 60.0;

/**
 * `shoreAvailability` → target C-rate for the shore charger. `full_time` is
 * a floor — actual target is `max(this × cap, i_avg_load)`.
 */
export const CHARGER_TARGET_C_RATE: Record<
  Exclude<ShoreAvailability, "never">,
  number
> = {
  occasional: 0.125,
  nightly: 0.25,
  nightly_fast: 0.45,
  full_time: 0.25,
};

/** Absorption / float tail added to bulk charging time per chemistry. */
export const ABSORPTION_TAIL_H: Record<BatteryPreference, number> = {
  lifepo4: 0.5,
  agm: 2.0,
  gel: 2.5,
};

/**
 * Drive-hours-per-day lookup (inputs.md A.7.1). Two-axis on
 * `(tripDuration, standingDuration)`. Entries keyed with `null` in the Python
 * source (meaning "any standing duration") are represented here with a
 * helper — see `getDriveHoursPerDay` in `derive.ts`. We store them as
 * explicit per-standing-duration triples to avoid runtime ambiguity.
 */
export const DRIVE_HOURS_PER_DAY: Record<
  TripDuration,
  Record<StandingDuration, number>
> = {
  weekend: { short: 0.5, medium: 0.5, long: 0.5 },
  week: { short: 1.0, medium: 0.75, long: 0.5 },
  extended: { short: 1.5, medium: 1.0, long: 0.5 },
  permanent: { short: 0.5, medium: 0.5, long: 0.5 },
};

/** Peak factor on AC peak load (inputs.md A.7.3). */
export const PEAK_FACTOR: Record<SimultaneousLoad, number> = {
  low: 1.25,
  moderate: 1.5,
  high: 2.0,
};

/**
 * Peak sun hours per day, keyed on `(winterLocation, season)`. Summer and
 * winter values pick the conservative end of the ranges in
 * `references/solar.md` (as in the Python reference).
 *
 * `all_year` is **winter-biased** ({@link https://github.com/.../skills/mobile-home-electrics-basics references/solar.md}
 * "size for shoulder season and accept shore-power / driving top-ups in
 * midwinter"): the Python reference used the annual average, which is about
 * 2× winter for most European regions and leads to optimistic solar sizing
 * for permanent / year-round users. The values below are closer to shoulder-
 * season PSH (≈ 1.3× winter) so a user who picks `all_year` + `permanent`
 * gets a solar recommendation that actually covers winter with some
 * backup — instead of an annual-average number that silently assumes the
 * user is never there in December.
 *
 * Summer-only users are unaffected; they keep the summer-worst-case row.
 */
export const PSH_TABLE: Record<WinterLocation, Record<Season, number>> = {
  scandinavia: { summer: 4.5, all_year: 0.8, winter: 0.3 },
  germany: { summer: 5.0, all_year: 1.5, winter: 0.9 },
  southern: { summer: 6.0, all_year: 2.5, winter: 1.9 },
  eastern: { summer: 4.5, all_year: 1.0, winter: 0.6 },
  varies: { summer: 5.0, all_year: 1.5, winter: 0.9 },
};
