# Graph Report - PowerSetup2  (2026-04-22)

## Corpus Check
- 338 files · ~299,198 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 967 nodes · 1091 edges · 76 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 294 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 238|Community 238]]
- [[_COMMUNITY_Community 239|Community 239]]
- [[_COMMUNITY_Community 240|Community 240]]
- [[_COMMUNITY_Community 241|Community 241]]
- [[_COMMUNITY_Community 242|Community 242]]
- [[_COMMUNITY_Community 243|Community 243]]
- [[_COMMUNITY_Community 244|Community 244]]
- [[_COMMUNITY_Community 245|Community 245]]
- [[_COMMUNITY_Community 246|Community 246]]
- [[_COMMUNITY_Community 247|Community 247]]
- [[_COMMUNITY_Community 248|Community 248]]
- [[_COMMUNITY_Community 249|Community 249]]
- [[_COMMUNITY_Community 250|Community 250]]
- [[_COMMUNITY_Community 251|Community 251]]
- [[_COMMUNITY_Community 252|Community 252]]
- [[_COMMUNITY_Community 253|Community 253]]
- [[_COMMUNITY_Community 254|Community 254]]
- [[_COMMUNITY_Community 255|Community 255]]
- [[_COMMUNITY_Community 256|Community 256]]
- [[_COMMUNITY_Community 257|Community 257]]
- [[_COMMUNITY_Community 258|Community 258]]
- [[_COMMUNITY_Community 259|Community 259]]
- [[_COMMUNITY_Community 260|Community 260]]
- [[_COMMUNITY_Community 261|Community 261]]
- [[_COMMUNITY_Community 262|Community 262]]
- [[_COMMUNITY_Community 263|Community 263]]
- [[_COMMUNITY_Community 264|Community 264]]
- [[_COMMUNITY_Community 265|Community 265]]
- [[_COMMUNITY_Community 266|Community 266]]
- [[_COMMUNITY_Community 267|Community 267]]
- [[_COMMUNITY_Community 268|Community 268]]
- [[_COMMUNITY_Community 269|Community 269]]
- [[_COMMUNITY_Community 270|Community 270]]
- [[_COMMUNITY_Community 271|Community 271]]
- [[_COMMUNITY_Community 272|Community 272]]
- [[_COMMUNITY_Community 273|Community 273]]
- [[_COMMUNITY_Community 274|Community 274]]
- [[_COMMUNITY_Community 275|Community 275]]
- [[_COMMUNITY_Community 276|Community 276]]
- [[_COMMUNITY_Community 277|Community 277]]
- [[_COMMUNITY_Community 278|Community 278]]
- [[_COMMUNITY_Community 279|Community 279]]
- [[_COMMUNITY_Community 280|Community 280]]
- [[_COMMUNITY_Community 281|Community 281]]

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 50 edges
2. `POST()` - 40 edges
3. `readFromDatabase()` - 24 edges
4. `computeAlgorithm()` - 20 edges
5. `invalidateCatalogCache()` - 20 edges
6. `importAdminDomainInner()` - 18 edges
7. `GET()` - 16 edges
8. `runGenerateForResultId()` - 14 edges
9. `callAI()` - 11 edges
10. `runAlgorithmTestAction()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `generateProductSelection()` --calls--> `selectProductsHybrid()`  [INFERRED]
  docs\reference\ai.ts → docs\reference\recommendation\selection\hybrid-selector.ts
- `generateText()` --calls--> `generateAIReasons()`  [INFERRED]
  docs\reference\ai.ts → docs\reference\recommendation\reasoning\ai-reasoner.ts
- `generateAlgorithmReasons()` --calls--> `getTemplateReason()`  [INFERRED]
  docs\reference\recommendation\reasoning\algorithm-reasoner.ts → docs\reference\recommendation\reasoning\templates.ts
- `loadBrandsWithTypes()` --calls--> `readFromDatabase()`  [INFERRED]
  src\app\admin\brands\page.tsx → src\lib\db\prisma-errors.ts
- `loadAISettingsAction()` --calls--> `getAISettings()`  [INFERRED]
  src\app\admin\settings\actions.ts → src\lib\db\queries\admin-settings-ai.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (52): createAlgorithmTestUserPresetAction(), deleteAlgorithmTestUserPresetAction(), getAlgorithmTestPresetByIdAction(), listAlgorithmTestPresetsAction(), loadAlgorithmSettingsAction(), loadAmazonSettingsAction(), loadGeminiImageModelsAction(), loadGeminiModelsAction() (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (49): runAdminCatalogDelete(), buildConsumerDeviceData(), createAdminBrand(), createAdminCategory(), createAdminCategoryFilter(), createAdminConsumerCategory(), createAdminConsumerDevice(), createAdminProduct() (+41 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): getAdminBrandById(), getAdminCategoryForEditorById(), getAdminConsumerCategoryForEditorById(), getAdminConsumerDeviceForEditorById(), getAdminProductForEditorById(), getAdminProductPreviewById(), listAdminBrandFilterCategories(), listAdminBrands() (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (28): consumeCreditsAndStoreSchematic(), getCreditBalance(), grantCreditsFromPurchase(), InsufficientCreditsError, htmlToPdfBuffer(), launchArgs(), resolveExecutablePath(), getGenerateLimiter() (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (32): mergeAlgorithmTuning(), mergeNested2(), mergeRecord(), shoreBatteryBridgeReliefDays(), sizeBattery(), topUpCoverageBaseCapForPsh(), sizeBooster(), sizeCables() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): generateAIReasons(), cleanReason(), generateAlgorithmReasons(), selectProductsAlgorithmically(), groupConsumerTemplatesByCategory(), countSystemSettings(), applyQuantitySafetyOverrides(), selectProductsHybrid() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (29): importCatalogJsonAction(), exportAdminDomain(), importAdminDomain(), importAdminDomainInner(), invalidateCacheForDomain(), mapModelPricingForExport(), mapProductForExport(), buildExportEnvelope() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (22): loadAISettingsAction(), getAISettings(), buildPrompt(), generateProductSelection(), generateText(), optimizeSpecsText(), renderPrompt(), backoffMs() (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (17): runAlgorithmPreview(), applyCustomOverrides(), existsResult(), extractFailureMessage(), GenerateResultError, parseInput(), runGenerateForResultId(), algorithmSettingsToComputeOptions() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (18): coerceSelectionRow(), extractSelectionsArray(), flattenProductGroups(), mapProductGroupKeyToBucket(), normalizeBucket(), parseJsonLenient(), parseProductSelectionJson(), selectProductsWithAI() (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (19): enforceAiSelectionsMinima(), batteryChemFromRow(), buildCableByRoute(), canonicalBatteryChem(), collectFuseTargets(), controllerKindFromRow(), detectBucket(), fuseRatingFromRow() (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (12): appendMissingFuses(), buildProductDisplayLines(), ensurePortableControllerLine(), fuseLinesFromPrefilter(), linePresent(), sortAiByBucket(), isAlgorithmOutput(), isPrefilterResult() (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (9): consumerFromTemplate(), defaultConsumer(), newConsumerId(), templateToConsumerVoltage(), addFromTemplate(), addManualConsumer(), duplicateConsumer(), pruneExpandedIds() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (9): AdminMediaUnavailableError, deleteAdminMedia(), ensureBlobToken(), listAdminMedia(), handleDelete(), sanitizeFilename(), uploadAdminMedia(), adminMediaDeleteAction() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (9): inputClassName(), labelClassName(), SolarRoofSection(), cn(), wizardCallout(), wizardCatalogScrollRegion(), wizardInsetPanel(), wizardScrollRegion() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (7): areRequiredCableLengthsValid(), getRequiredCableLengthKeys(), useWizardResultSubmit(), canNavigateToStep(), completedWizardStepIds(), isWizardCompleteForSubmission(), validateWizardStep()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (5): pickOne(), randomCableLengths(), randomInt(), randomizeAlgorithmTestFilters(), snapCableLength()

### Community 18 - "Community 18"
Cohesion: 0.38
Nodes (2): AmazonService, render()

### Community 19 - "Community 19"
Cohesion: 0.52
Nodes (6): asFilterValuesRecord(), buildProductPreviewFilterRows(), formatFilterScalar(), labelForExtraKey(), omitPreviewKeys(), withUnit()

### Community 20 - "Community 20"
Cohesion: 0.38
Nodes (5): autarchyPresetFromDays(), autarchyTopUpProfileFromSources(), getAutarchyWizardMaxDays(), presetDaysAdaptive(), handlePreset()

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (2): addBag(), newBagId()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (2): clampRoofDimension(), parseDimension()

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (3): fmtAh(), fmtWp(), SystemSummaryCard()

### Community 25 - "Community 25"
Cohesion: 0.7
Nodes (4): buildSummary(), formatCurrent(), portableControllerFallback(), roofControllerFallback()

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (3): toggleSource(), defaultRoofArea(), newRoofId()

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (2): AdminConsumerDeviceForm(), useAdminConsumerDeviceForm()

### Community 31 - "Community 31"
Cohesion: 0.83
Nodes (3): isClickable(), isCompleted(), isCurrent()

### Community 34 - "Community 34"
Cohesion: 0.83
Nodes (3): baseBattery(), baseOutput(), baseSolar()

### Community 35 - "Community 35"
Cohesion: 0.83
Nodes (3): defaultCableLengths(), defaultTravelBehavior(), minimalInput()

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (2): extractAsin(), scrapeAmazonProduct()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): AIInvocationError

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (2): alignConsumersDcToSystem(), hydrateInput()

### Community 238 - "Community 238"
Cohesion: 1.0
Nodes (1): algorithm/camper_electrics_sizing.py =====================================  Pure

### Community 239 - "Community 239"
Cohesion: 1.0
Nodes (1): One rectangular roof patch; inputs.md A.2.1.

### Community 240 - "Community 240"
Cohesion: 1.0
Nodes (1): One portable solar bag; inputs.md A.2.2.

### Community 241 - "Community 241"
Cohesion: 1.0
Nodes (1): One electrical consumer; inputs.md A.3.1.      ``voltage == 230`` is the ONLY ma

### Community 242 - "Community 242"
Cohesion: 1.0
Nodes (1): Trip context; inputs.md A.4.

### Community 243 - "Community 243"
Cohesion: 1.0
Nodes (1): One-way lengths for every sized route; inputs.md A.6. All in metres,     each in

### Community 244 - "Community 244"
Cohesion: 1.0
Nodes (1): Full wizard payload; inputs.md Part A.

### Community 245 - "Community 245"
Cohesion: 1.0
Nodes (1): inputs.md C.7. One per route in ROUTES (always 7 entries).

### Community 246 - "Community 246"
Cohesion: 1.0
Nodes (1): Raise ValueError if value is not in allowed.

### Community 247 - "Community 247"
Cohesion: 1.0
Nodes (1): Raise ValueError if value is not in [lo, hi] (inclusive by default).

### Community 248 - "Community 248"
Cohesion: 1.0
Nodes (1): Raise ValueError if value is not a non-empty string.

### Community 249 - "Community 249"
Cohesion: 1.0
Nodes (1): Full structural + cross-field validation of AlgorithmInput.      Raises ValueErr

### Community 250 - "Community 250"
Cohesion: 1.0
Nodes (1): inputs.md A.7.1. Returns 0 when 'alternator' not selected.

### Community 251 - "Community 251"
Cohesion: 1.0
Nodes (1): inputs.md A.7.2. Returns one of ShoreAvailability literals.      Precedence:

### Community 252 - "Community 252"
Cohesion: 1.0
Nodes (1): PSH lookup. references/solar.md. See Assumption 1 at module top.

### Community 253 - "Community 253"
Cohesion: 1.0
Nodes (1): Split consumers into DC / AC Wh and peak W totals.      Returns:         (dc_wh,

### Community 254 - "Community 254"
Cohesion: 1.0
Nodes (1): Total Wp from rectangular roof areas * density * packing factor.

### Community 255 - "Community 255"
Cohesion: 1.0
Nodes (1): references/batteries.md + inputs.md C.1.      Formulas::          C_usable_Wh =

### Community 256 - "Community 256"
Cohesion: 1.0
Nodes (1): references/solar.md + inputs.md C.2.      Formulas::          roof_wp          =

### Community 257 - "Community 257"
Cohesion: 1.0
Nodes (1): references/alternator.md + inputs.md C.3.      Formulas::          i_out = min(

### Community 258 - "Community 258"
Cohesion: 1.0
Nodes (1): references/shore-power.md + inputs.md C.4.      Formulas::          target_c

### Community 259 - "Community 259"
Cohesion: 1.0
Nodes (1): references/inverter.md + inputs.md C.5.      Formula::          recommended_w =

### Community 260 - "Community 260"
Cohesion: 1.0
Nodes (1): references/solar.md "Sizing the MPPT" + inputs.md C.6.      Formulas::

### Community 261 - "Community 261"
Cohesion: 1.0
Nodes (1): references/cables.md + inputs.md C.7.      For each route, resolve (L, I, U) per

### Community 262 - "Community 262"
Cohesion: 1.0
Nodes (1): Size a camper 12/24/48 V electrical system.      See the module docstring for th

### Community 263 - "Community 263"
Cohesion: 1.0
Nodes (1): Tiny builder used by tests + worked example, DRYs the constructors.

### Community 264 - "Community 264"
Cohesion: 1.0
Nodes (1): Plan test 1: 12 V LFP, fridge 60 W / 24 h DC, laptop 90 W / 4 h AC,     2 m cabl

### Community 265 - "Community 265"
Cohesion: 1.0
Nodes (1): Plan test 2: no consumers -> all zeros, no crash.

### Community 266 - "Community 266"
Cohesion: 1.0
Nodes (1): Plan test 3: all DC -> inverter.needed False, standby NOT added.

### Community 267 - "Community 267"
Cohesion: 1.0
Nodes (1): Plan test 4: invalid inputs raise ValueError.

### Community 268 - "Community 268"
Cohesion: 1.0
Nodes (1): Plan test 5: adding a consumer never reduces battery.recommended_capacity_ah.

### Community 269 - "Community 269"
Cohesion: 1.0
Nodes (1): Plan test 6: Wh at 12 V -> Ah -> Wh comes back within 1e-9.

### Community 270 - "Community 270"
Cohesion: 1.0
Nodes (1): ``autarchy_days = 999`` is clamped to MAX_AUTARCHY_DAYS[trip_duration]     and e

### Community 271 - "Community 271"
Cohesion: 1.0
Nodes (1): full_time only when trip_duration=permanent AND charger_speed != slow.

### Community 272 - "Community 272"
Cohesion: 1.0
Nodes (1): References/cables.md worked example: 120 A continuous at 12 V, 3 m,     3 % drop

### Community 273 - "Community 273"
Cohesion: 1.0
Nodes (1): references/alternator.md worked example: 40 A / 24 V B2B from 12 V alt     draws

### Community 274 - "Community 274"
Cohesion: 1.0
Nodes (1): solar_shortfall_wh >= 0 even when yield > demand.

### Community 275 - "Community 275"
Cohesion: 1.0
Nodes (1): Roof area cm^2 -> m^2 -> Wp conversion.

### Community 276 - "Community 276"
Cohesion: 1.0
Nodes (1): Spec C: recommendation = '' and recommended_cross_section == min_cross_section.

### Community 277 - "Community 277"
Cohesion: 1.0
Nodes (1): Spec C.3 legacy: booster.current_a must equal booster.output_current_a.

### Community 278 - "Community 278"
Cohesion: 1.0
Nodes (1): Output always has 7 cables in the ROUTES order -- shape stability.

### Community 279 - "Community 279"
Cohesion: 1.0
Nodes (1): Execute every test above, print a summary line, raise on first failure.

### Community 280 - "Community 280"
Cohesion: 1.0
Nodes (1): Realistic camper: 12 V LFP, 2 roof panels, 200 W compressor fridge +     laptop

### Community 281 - "Community 281"
Cohesion: 1.0
Nodes (1): Pretty-print an AlgorithmOutput so the human can eyeball numbers.

## Knowledge Gaps
- **44 isolated node(s):** `algorithm/camper_electrics_sizing.py =====================================  Pure`, `One rectangular roof patch; inputs.md A.2.1.`, `One portable solar bag; inputs.md A.2.2.`, `One electrical consumer; inputs.md A.3.1.      ``voltage == 230`` is the ONLY ma`, `Trip context; inputs.md A.4.` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (7 nodes): `AmazonService`, `.constructor()`, `.getItem()`, `.initialize()`, `amazon-service.ts`, `render()`, `mermaid-diagram.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (6 nodes): `step-8-solar-bags.tsx`, `addBag()`, `effectivePortableWp()`, `newBagId()`, `removeAt()`, `setPowerAt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `clampRoofDimension()`, `isPresetRoofName()`, `parseDimension()`, `RoofAreaRow()`, `constants.ts`, `roof-area-row.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `AdminConsumerDeviceForm()`, `admin-consumer-device-form.tsx`, `use-admin-consumer-device-form.ts`, `useAdminConsumerDeviceForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `scraper.ts`, `extractAsin()`, `scrapeAmazonProduct()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `types.ts`, `AIInvocationError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `wizard.ts`, `alignConsumersDcToSystem()`, `hydrateInput()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 238`** (1 nodes): `algorithm/camper_electrics_sizing.py =====================================  Pure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 239`** (1 nodes): `One rectangular roof patch; inputs.md A.2.1.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 240`** (1 nodes): `One portable solar bag; inputs.md A.2.2.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 241`** (1 nodes): `One electrical consumer; inputs.md A.3.1.      ``voltage == 230`` is the ONLY ma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 242`** (1 nodes): `Trip context; inputs.md A.4.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 243`** (1 nodes): `One-way lengths for every sized route; inputs.md A.6. All in metres,     each in`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 244`** (1 nodes): `Full wizard payload; inputs.md Part A.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 245`** (1 nodes): `inputs.md C.7. One per route in ROUTES (always 7 entries).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 246`** (1 nodes): `Raise ValueError if value is not in allowed.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 247`** (1 nodes): `Raise ValueError if value is not in [lo, hi] (inclusive by default).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 248`** (1 nodes): `Raise ValueError if value is not a non-empty string.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 249`** (1 nodes): `Full structural + cross-field validation of AlgorithmInput.      Raises ValueErr`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 250`** (1 nodes): `inputs.md A.7.1. Returns 0 when 'alternator' not selected.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 251`** (1 nodes): `inputs.md A.7.2. Returns one of ShoreAvailability literals.      Precedence:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 252`** (1 nodes): `PSH lookup. references/solar.md. See Assumption 1 at module top.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 253`** (1 nodes): `Split consumers into DC / AC Wh and peak W totals.      Returns:         (dc_wh,`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 254`** (1 nodes): `Total Wp from rectangular roof areas * density * packing factor.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 255`** (1 nodes): `references/batteries.md + inputs.md C.1.      Formulas::          C_usable_Wh =`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 256`** (1 nodes): `references/solar.md + inputs.md C.2.      Formulas::          roof_wp          =`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 257`** (1 nodes): `references/alternator.md + inputs.md C.3.      Formulas::          i_out = min(`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 258`** (1 nodes): `references/shore-power.md + inputs.md C.4.      Formulas::          target_c`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 259`** (1 nodes): `references/inverter.md + inputs.md C.5.      Formula::          recommended_w =`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 260`** (1 nodes): `references/solar.md "Sizing the MPPT" + inputs.md C.6.      Formulas::`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 261`** (1 nodes): `references/cables.md + inputs.md C.7.      For each route, resolve (L, I, U) per`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 262`** (1 nodes): `Size a camper 12/24/48 V electrical system.      See the module docstring for th`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 263`** (1 nodes): `Tiny builder used by tests + worked example, DRYs the constructors.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 264`** (1 nodes): `Plan test 1: 12 V LFP, fridge 60 W / 24 h DC, laptop 90 W / 4 h AC,     2 m cabl`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 265`** (1 nodes): `Plan test 2: no consumers -> all zeros, no crash.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 266`** (1 nodes): `Plan test 3: all DC -> inverter.needed False, standby NOT added.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 267`** (1 nodes): `Plan test 4: invalid inputs raise ValueError.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 268`** (1 nodes): `Plan test 5: adding a consumer never reduces battery.recommended_capacity_ah.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 269`** (1 nodes): `Plan test 6: Wh at 12 V -> Ah -> Wh comes back within 1e-9.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 270`** (1 nodes): ```autarchy_days = 999`` is clamped to MAX_AUTARCHY_DAYS[trip_duration]     and e`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 271`** (1 nodes): `full_time only when trip_duration=permanent AND charger_speed != slow.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 272`** (1 nodes): `References/cables.md worked example: 120 A continuous at 12 V, 3 m,     3 % drop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 273`** (1 nodes): `references/alternator.md worked example: 40 A / 24 V B2B from 12 V alt     draws`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 274`** (1 nodes): `solar_shortfall_wh >= 0 even when yield > demand.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 275`** (1 nodes): `Roof area cm^2 -> m^2 -> Wp conversion.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 276`** (1 nodes): `Spec C: recommendation = '' and recommended_cross_section == min_cross_section.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 277`** (1 nodes): `Spec C.3 legacy: booster.current_a must equal booster.output_current_a.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 278`** (1 nodes): `Output always has 7 cables in the ROUTES order -- shape stability.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 279`** (1 nodes): `Execute every test above, print a summary line, raise on first failure.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 280`** (1 nodes): `Realistic camper: 12 V LFP, 2 roof panels, 200 W compressor fridge +     laptop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 281`** (1 nodes): `Pretty-print an AlgorithmOutput so the human can eyeball numbers.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `Community 3` to `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `getPrisma()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `runAlgorithm()` connect `Community 8` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `getPrisma()` (e.g. with `POST()` and `listAlgorithmTestPresets()`) actually correct?**
  _`getPrisma()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 25 inferred relationships involving `POST()` (e.g. with `isAdminExportDomain()` and `importAdminDomain()`) actually correct?**
  _`POST()` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `readFromDatabase()` (e.g. with `loadBrandsWithTypes()` and `listAdminProductCategories()`) actually correct?**
  _`readFromDatabase()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `computeAlgorithm()` (e.g. with `mergeAlgorithmTuning()` and `validate()`) actually correct?**
  _`computeAlgorithm()` has 19 INFERRED edges - model-reasoned connections that need verification._