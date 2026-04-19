# Requirements Algorithm Specification

This document serves as the **Master Specification** for rewriting the `requirements-engine.ts`. It combines the UI/Wizard flow with the underlying physical and logical factors needed for the calculation.

## 1. Goal of the Rewrite
The new algorithm must:
1.  **Modular Logic**: Map logic cleanly to inputs.
2.  **Solar Differentiation**: Correctly separate "Roof Solar" (Faktor 0.85) from "Portable Solar" (Faktor 1.0).
3.  **Scenario Separation**: Clearly distinguish between "Bad Weather Autarchy" (Battery must survive) vs. "Average Autarchy" (Solar covers consumption).
4.  **Realistic Recommendations**: Provide a "Recommended" value that is cost-effective, while transparently warning about "Worst Case" scenarios.

---

## 2. Wizard Steps & Logic Integration

### Step 1: System Basics
**Inputs:**
- `systemVoltage`: `12V`, `24V`, `48V` (Base for all calculations)
- `vehicleVoltage`: `12V`, `24V` (Starter battery)
- `batteryPreference`: `LiFePO4`, `AGM`, `GEL`

**Logic & Factors:**
- **System Voltage**: All Power (W) calculations are converted to Current (A) using this voltage.
- **Booster Need**: If `vehicleVoltage` != `systemVoltage`, a B2B Booster with converter is mandatory.
- **Battery DoD (Depth of Discharge)**:
  - `LiFePO4`: **90%** (0.9)
  - `AGM` / `GEL`: **50%** (0.5)

### Step 2: Energy Sources
**Inputs:**
- **Sources**: `Solar`, `Alternator` (Lichtmaschine), `Shore Power` (Landstrom)

**Logic & Factors (Solar):**
- **Module Types**:
  - `Rigid (Frame)`: Standard Efficiency (Wp/m²).
  - `Flexible`: Lower Efficiency.
- **Mounting Factor**:
  - **Roof**: **0.85** (Flat mounting loss).
  - **Portable (Taschen)**: **1.00** (Perfect alignment possible).
- **Efficiency**:
  - **System/MPPT**: **0.85** (15% general loss).
  - **Roof Utilization**: **0.75** (Only 75% of a generic roof area is usable).

**Logic & Factors (Alternator/Booster):**
- **Classes**:
  - `Standard`: ~90-120A Alternator -> Recommend **30A** Booster.
  - `Enhanced`: ~150A+ Alternator -> Recommend **50A+** Booster.
  - `Euro 6d`: Smart Generator -> Limit to **30A** to protect system.
- **Contribution**: Depends heavily on *Standing Duration* (see Step 4).

**Logic & Factors (Shore Power):**
- **Charging Speed**:
  - `Slow`, `Normal`, `Fast` -> Determines Charger Amps (e.g., C-Rate).

### Step 3: Consumers (Consumption)
**Inputs:**
- List of devices with `Power (W)`, `Voltage (V)`, `Hours/Day`.
- **Special**: Cooling Devices (`Compressor` vs `Absorber`).
- **Special**: `Simultaneous Load` (Gleichzeitigkeitsfaktor).

**Logic & Factors:**
- **Daily Consumption (Wh)**: Sum of all devices.
- **Inverter Sizing**:
  - Only for 230V devices.
  - **Simultaneity Factor**:
    - Low: **0.3** | Moderate: **0.5** | High: **0.8**
  - Formula: $InverterW = MaxSingleLoad + (TotalLoad - MaxSingleLoad) \times SimFactor$.
  - **Rounding**: Round up to standard classes (500W, 1000W, ...).
- **Cooling Logic**:
  - **Absorber**: If Gas enabled, electrical consumption is just control electronics (e.g., 5%).

### Step 4: Travel Behavior (Solar & Alternator Impact)
**Inputs:**
- `season`: `Summer`, `All Year`, `Winter Focus`.
- `winterRegion`: `Germany/Alps`, `South Europe`, `Scandinavia`.
- `standingDuration`: `Short` (2d), `Medium` (5d), `Long` (14d).

**Logic & Factors - Solar Yield:**
- **Sun Hours (Peak)**:
  - `Summer`: **5.0h**
  - `All Year/Mix`: **3.5h**
  - `Winter`: **2.0h**
- **Location Factor (Winter)**:
  - `Scandinavia`: **0.6x**
  - `Germany`: **0.8x**
  - `South Europe`: **1.2x**
- **Cloudy Factor**: **0.2** (20% yield) for bad weather scenarios.

**Logic & Factors - Alternator Yield:**
- **Standing Duration**:
  - `Short` (drive e. 2 days) -> High alternator contribution.
  - `Long` (drive e. 14 days) -> Negligible alternator contribution.

### Step 5: Autarchy (Battery Dimensioning)
**Inputs:**
- `autarchyGoal`: `Weekend`, `Holiday`, `Full Autarchy`.
- `autarchyDays`: Target days (1-90).
- `space`: `Compact`, `Medium`, `Spacious`.

**Logic & Factors:**
- **Safety Factor**: Calculated Capacity x **1.3** (+30% Buffer).
- **Minimum Reserves**:
  - **Night Reserve**: Must cover **14h** of darkness (Basic Load).
  - **Bad Weather Reserve**: Must cover **1-4 days** (depending on Goal) assuming `Cloudy Factor` (20% solar).
- **Space Limits**:
  - `Compact`: Cap at ~150Ah.
  - `Medium`: Cap at ~280Ah.

### Step 6: Wiring
**Inputs:**
- Lengths for all major cable runs.

**Logic & Factors:**
- **Material**: Pure Copper ($\rho = 0.0178$).
- **Voltage Drop Limits**:
  - Critical (Inverter/Charger): max **2%**.
  - Standard / Solar: max **3%**.
- **Formula**: $A = \frac{2 \times L \times I}{56 \times \Delta U}$

### Step 7: Preferences (Non-Physical)
**Inputs:**
- `budget`: `Budget`, `Standard`, `Premium`.

**Logic & Factors:**
- **Product Matching**: Does not affect the *sizing* physics (Ah, W, mm²), but influences specific product recommendations (Brand X vs Brand Y) in the later matching phase.

### Step 8: Result Adjustment (Dynamic Solar)
**Inputs:**
- `addOnSolarPortable`: User adds +100W/200W/etc. if roof area is insufficient.

**Logic & Factors:**
- **System Type Change**: Switches system to `Mixed` (Roof + Portable).
- **Recalculation**: Adds the selected portable Wp to the total Wp using the `Portable Orientation Factor` (1.0).
- **Controller Sizing**: Must handle the *combined* Wp. May trigger `needsSeparatePortableController` logic if mismatch is too high or setup is complex.

---

## 3. Summary of Constants

| Factor | ID | Default Value | Description |
| :--- | :--- | :--- | :--- |
| **Battery Sizing** | | | |
| DoD LiFePO4 | `dodLifepo4` | **0.90** | Usable capacity for Lithium |
| DoD AGM | `dodAgm` | **0.50** | Usable capacity for AGM |
| DoD GEL | `dodGel` | **0.50** | Usable capacity for GEL |
| Safety Factor | `batterySafetyFactor` | **1.30** | Multiplier for calculated capacity (Buffer) |
| Max Backup | `maxBackupDays` | **4** | Cap for pure battery autarchy days (prevents huge banks) |
| **Battery Limits** | | | |
| Compact Space | `batteryCompact` | **100Ah** | Max Ah for 'Compact' setting |
| Medium Space | `batteryMedium` | **200Ah** | Max Ah for 'Medium' setting |
| Large Space | `batterySpacious` | **400Ah** | Max Ah for 'Spacious' setting |
| **Solar Yield** | | | |
| Peak Sun Summer | `sunHoursSummer` | **5.0h** | Average peak sun hours in summer |
| Peak Sun All Year | `sunHoursAllYear` | **3.5h** | Average peak sun hours mixed |
| Peak Sun Winter | `sunHoursWinter` | **2.0h** | Average peak sun hours in winter |
| Loc. Germany/Alps | `locationGermanyAlps` | **0.8x** | Winter modifier |
| Loc. South Europe | `locationSouthernEurope` | **1.2x** | Winter modifier |
| Loc. Scandinavia | `locationScandinavia` | **0.6x** | Winter modifier |
| **Solar Tech** | | | |
| Rigid Efficiency | `wpPerM2Rigid` | **180Wp** | Wp per m² for rigid panels |
| Flex Efficiency | `wpPerM2Flexible` | **160Wp** | Wp per m² for flexible panels |
| Roof Utilization | `roofUtilizationFactor` | **0.75** | Usable area factor for roof polygons |
| Roof Orientation | `roofOrientationFactor` | **0.85** | Loss factor for flat mounting |
| Portable Orientation | `portableOrientationFactor`| **1.00** | Factor for aligned portable panels |
| Cloudy Factor | `cloudyYieldFactor` | **0.20** | Yield factor during bad weather |
| Rec. Yield Factor | `recommendedSolarYieldFactor`| **0.70** | Safety buffer for "Recommended" solar result |
| MPPT Safety | `solarSafetyFactor` | **1.10** | Controller sizing buffer |
| **Alternator** | | | |
| Standard | `alternatorStandard` | **30A** | Assumed alternator size |
| Enhanced | `alternatorEnhanced` | **50A** | Assumed alternator size |
| Smart/Euro6 | `alternatorEuro6dSmart` | **30A** | Assumed alternator size |
| **Charging** | | | |
| Time Slow | `chargerTimeHoursSlow` | **8.0h** | Target hours for slow charging |
| Time Normal | `chargerTimeHoursNormal` | **5.0h** | Target hours for normal charging |
| Time Fast | `chargerTimeHoursFast` | **3.0h** | Target hours for fast charging |
| **Consumers** | | | |
| Sim. Low | `simultaneousLow` | **0.3** | Simultaneous factor for 'Low' usage |
| Sim. Moderate | `simultaneousModerate` | **0.5** | Simultaneous factor for 'Moderate' usage |
| Sim. High | `simultaneousHigh` | **0.7** | Simultaneous factor for 'High' usage |
| Duty Cycle Comp. | `dutyCycleCompressor` | **0.3** | Run-time factor for compressor fridges |
| Duty Cycle Abs. | `dutyCycleAbsorber` | **0.5** | Run-time factor for absorber fridges |
| **Wiring** | | | |
| Drop Critical | `voltageDropCritical` | **2.0%** | Max drop for critical loads |
| Drop Normal | `voltageDropNormal` | **3.0%** | Max drop for standard loads |
| Drop Solar | `voltageDropSolar` | **3.0%** | Max drop for solar lines |
| Copper Rho | `copperResistivity` | **0.0178** | Resistivity of copper |
