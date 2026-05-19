# Graph Report - PowerSetup2  (2026-05-19)

## Corpus Check
- 421 files · ~389,827 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1230 nodes · 1406 edges · 82 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 353 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 294|Community 294]]
- [[_COMMUNITY_Community 295|Community 295]]
- [[_COMMUNITY_Community 296|Community 296]]
- [[_COMMUNITY_Community 297|Community 297]]
- [[_COMMUNITY_Community 298|Community 298]]
- [[_COMMUNITY_Community 299|Community 299]]
- [[_COMMUNITY_Community 300|Community 300]]
- [[_COMMUNITY_Community 301|Community 301]]
- [[_COMMUNITY_Community 302|Community 302]]
- [[_COMMUNITY_Community 303|Community 303]]
- [[_COMMUNITY_Community 304|Community 304]]
- [[_COMMUNITY_Community 305|Community 305]]
- [[_COMMUNITY_Community 306|Community 306]]
- [[_COMMUNITY_Community 307|Community 307]]
- [[_COMMUNITY_Community 308|Community 308]]
- [[_COMMUNITY_Community 309|Community 309]]
- [[_COMMUNITY_Community 310|Community 310]]
- [[_COMMUNITY_Community 311|Community 311]]
- [[_COMMUNITY_Community 312|Community 312]]
- [[_COMMUNITY_Community 313|Community 313]]
- [[_COMMUNITY_Community 314|Community 314]]
- [[_COMMUNITY_Community 315|Community 315]]
- [[_COMMUNITY_Community 316|Community 316]]
- [[_COMMUNITY_Community 317|Community 317]]
- [[_COMMUNITY_Community 318|Community 318]]
- [[_COMMUNITY_Community 319|Community 319]]
- [[_COMMUNITY_Community 320|Community 320]]
- [[_COMMUNITY_Community 321|Community 321]]
- [[_COMMUNITY_Community 322|Community 322]]
- [[_COMMUNITY_Community 323|Community 323]]
- [[_COMMUNITY_Community 324|Community 324]]
- [[_COMMUNITY_Community 325|Community 325]]
- [[_COMMUNITY_Community 326|Community 326]]
- [[_COMMUNITY_Community 327|Community 327]]
- [[_COMMUNITY_Community 328|Community 328]]
- [[_COMMUNITY_Community 329|Community 329]]
- [[_COMMUNITY_Community 330|Community 330]]
- [[_COMMUNITY_Community 331|Community 331]]
- [[_COMMUNITY_Community 332|Community 332]]
- [[_COMMUNITY_Community 333|Community 333]]
- [[_COMMUNITY_Community 334|Community 334]]
- [[_COMMUNITY_Community 335|Community 335]]
- [[_COMMUNITY_Community 336|Community 336]]
- [[_COMMUNITY_Community 337|Community 337]]

## God Nodes (most connected - your core abstractions)
1. `getPrisma()` - 51 edges
2. `POST()` - 44 edges
3. `readFromDatabase()` - 26 edges
4. `computeAlgorithm()` - 22 edges
5. `invalidateCatalogCache()` - 21 edges
6. `GET()` - 19 edges
7. `importAdminDomainInner()` - 18 edges
8. `runGenerateForResultId()` - 14 edges
9. `importProductFromAmazonAction()` - 13 edges
10. `callAI()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `loadAlgorithmSettingsAction()` --calls--> `getAlgorithmSettings()`  [INFERRED]
  src\app\admin\settings\actions.ts → src\lib\db\queries\admin-settings-algorithm.ts
- `loadAmazonSettingsAction()` --calls--> `getAmazonPartnerTag()`  [INFERRED]
  src\app\admin\settings\actions.ts → src\lib\db\queries\admin-settings-amazon.ts
- `readFromDatabase()` --calls--> `listProductsByIdsForResult()`  [INFERRED]
  src\lib\db\prisma-errors.ts → src\lib\db\queries\products.ts
- `generateAlgorithmReasons()` --calls--> `getTemplateReason()`  [INFERRED]
  docs\reference\recommendation\reasoning\algorithm-reasoner.ts → docs\reference\recommendation\reasoning\templates.ts
- `selectProductsHybrid()` --calls--> `GET()`  [INFERRED]
  docs\reference\recommendation\selection\hybrid-selector.ts → src\app\api\admin\ping\route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (46): importCatalogJsonAction(), getCatalogComponentDimensionStats(), syncComponentClassesFromDB(), isAdminExportDomain(), async(), consumeCreditsAndStoreSchematic(), getCreditBalance(), grantCreditsFromPurchase() (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (55): createAlgorithmTestUserPresetAction(), deleteAlgorithmTestUserPresetAction(), getAlgorithmTestPresetByIdAction(), listAlgorithmTestPresetsAction(), loadAISettingsAction(), loadAlgorithmSettingsAction(), loadAmazonSettingsAction(), loadGeminiImageModelsAction() (+47 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (54): saveAmazonSettingsAction(), runAdminCatalogDelete(), buildConsumerDeviceData(), createAdminBrand(), createAdminCategory(), createAdminCategoryFilter(), createAdminConsumerCategory(), createAdminConsumerDevice() (+46 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (35): runAlgorithmPreview(), applyCustomOverrides(), shoreBatteryBridgeReliefDays(), sizeBattery(), topUpCoverageBaseCapForPsh(), sizeBooster(), sizeCables(), sizeCharger() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (37): getAdminBrandById(), getAdminCategoryForEditorById(), getAdminCategorySlugById(), getAdminConsumerCategoryForEditorById(), getAdminConsumerDeviceForEditorById(), getAdminProductForEditorById(), getAdminProductPreviewById(), listAdminBrandFilterCategories() (+29 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (37): batteryRowFits(), bmsDischargeAFromRow(), effectiveBatteryVoltageV(), nominalSystemVoltageFromCellVoltage(), productNominalSystemVoltageV(), requiredInverterDischargeA(), ambientTempDerateFactor(), continuousAmpacityAForStandardMm2() (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (26): runAlgorithmTestAction(), saveAlgorithmSettingsAction(), normalizeAlgorithmSettingsImportRow(), backfillCableAmpacityColumnsIfNull(), ensureCableAmpacitySettings(), getAlgorithmSettings(), getAlgorithmSettingsCached(), stripUndefined() (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (26): exportAdminDomain(), importAdminDomain(), importAdminDomainInner(), invalidateCacheForDomain(), mapModelPricingForExport(), mapProductForExport(), buildExportEnvelope(), collectMissingConsumerDeviceCategories() (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (23): coerceSelectionRow(), extractSelectionsArray(), flattenProductGroups(), mapProductGroupKeyToBucket(), normalizeBucket(), parseJsonLenient(), parseProductSelectionJson(), selectProductsWithAI() (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (21): optimizeSpecsText(), renderPrompt(), backoffMs(), callAI(), chatBackendsOrder(), isMockAi(), mockCompletion(), sleep() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (16): creatorsItemResources(), fetchAmazonItemViaCreatorsApi(), extractAsinFromAmazonInput(), fetchAmazonItem(), isMockAmazonMode(), fetchMockAmazonItem(), absolutizeImageSrc(), buildScrapeContextText() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (17): appendMissingFuses(), buildProductDisplayLines(), ensurePortableControllerLine(), fuseLinesFromPrefilter(), lineProductPresent(), meetsMin(), prefilterScoreFor(), pushAiOrUnmet() (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (3): AdminCategoryForm(), AdminConsumerCategoryForm(), Icon()

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (9): consumerFromTemplate(), defaultConsumer(), newConsumerId(), templateToConsumerVoltage(), addFromTemplate(), addManualConsumer(), duplicateConsumer(), pruneExpandedIds() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.2
Nodes (9): AdminMediaUnavailableError, deleteAdminMedia(), ensureBlobToken(), listAdminMedia(), handleDelete(), sanitizeFilename(), uploadAdminMedia(), adminMediaDeleteAction() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (10): inputClassName(), labelClassName(), SolarRoofSection(), cn(), wizardCallout(), wizardCatalogScrollRegion(), wizardFormSection(), wizardInsetPanel() (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (7): areRequiredCableLengthsValid(), getRequiredCableLengthKeys(), useWizardResultSubmit(), canNavigateToStep(), completedWizardStepIds(), isWizardCompleteForSubmission(), validateWizardStep()

### Community 19 - "Community 19"
Cohesion: 0.27
Nodes (6): DeviceIconSlot(), isIconKey(), normalizeIconKey(), normalizeIconKeyOrFallback(), resolveIcon(), resolveIconKey()

### Community 20 - "Community 20"
Cohesion: 0.36
Nodes (9): filterValuesAsRecord(), isCableCategorySlug(), isDcShoreChargerCategorySlug(), isEmptyFilterValueEntry(), isIncompleteCategoryFilterValues(), isInverterCategorySlug(), isSolarChargerSlug(), isSolarControllerCategorySlug() (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.42
Nodes (9): deleteVercelBlobUrlIfOwned(), downloadAmazonProductImageToBlob(), hasBlobWriteToken(), hostnameOf(), isAmazonCdnImageUrl(), isVercelBlobPublicStorageUrl(), normalizeAmazonProductImageUrl(), resolveImportedProductImageUrl() (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (5): pickOne(), randomCableLengths(), randomInt(), randomizeAlgorithmTestFilters(), snapCableLength()

### Community 24 - "Community 24"
Cohesion: 0.42
Nodes (8): batteryTypeToSelect(), buildRecommendationScalars(), mapAmazonExtractionToImportPayload(), matchBrandId(), normalizeBatteryColumn(), valueForFilterKey(), voltageNumberToSelect(), voltsToMultiselect()

### Community 26 - "Community 26"
Cohesion: 0.38
Nodes (2): AmazonService, render()

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (3): WizardStepLayout(), WizardLayoutClient(), wizardStepFromParam()

### Community 28 - "Community 28"
Cohesion: 0.52
Nodes (6): asFilterValuesRecord(), buildProductPreviewFilterRows(), formatFilterScalar(), labelForExtraKey(), omitPreviewKeys(), withUnit()

### Community 29 - "Community 29"
Cohesion: 0.38
Nodes (5): autarchyPresetFromDays(), autarchyTopUpProfileFromSources(), getAutarchyWizardMaxDays(), presetDaysAdaptive(), handlePreset()

### Community 30 - "Community 30"
Cohesion: 0.4
Nodes (2): addBag(), newBagId()

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (2): clampRoofDimension(), parseDimension()

### Community 32 - "Community 32"
Cohesion: 0.6
Nodes (3): fmtAh(), fmtWp(), SystemSummaryCard()

### Community 34 - "Community 34"
Cohesion: 0.7
Nodes (4): buildSummary(), formatCurrent(), portableControllerFallback(), roofControllerFallback()

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (3): toggleSource(), defaultRoofArea(), newRoofId()

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (2): AdminConsumerDeviceForm(), useAdminConsumerDeviceForm()

### Community 43 - "Community 43"
Cohesion: 0.83
Nodes (3): isClickable(), isCompleted(), isCurrent()

### Community 45 - "Community 45"
Cohesion: 0.83
Nodes (3): baseBattery(), baseOutput(), baseSolar()

### Community 46 - "Community 46"
Cohesion: 0.83
Nodes (3): defaultCableLengths(), defaultTravelBehavior(), minimalInput()

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (2): cn(), label()

### Community 63 - "Community 63"
Cohesion: 0.67
Nodes (1): AIInvocationError

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (2): alignConsumersDcToSystem(), hydrateInput()

### Community 294 - "Community 294"
Cohesion: 1.0
Nodes (1): algorithm/camper_electrics_sizing.py =====================================  Pure

### Community 295 - "Community 295"
Cohesion: 1.0
Nodes (1): One rectangular roof patch; inputs.md A.2.1.

### Community 296 - "Community 296"
Cohesion: 1.0
Nodes (1): One portable solar bag; inputs.md A.2.2.

### Community 297 - "Community 297"
Cohesion: 1.0
Nodes (1): One electrical consumer; inputs.md A.3.1.      ``voltage == 230`` is the ONLY ma

### Community 298 - "Community 298"
Cohesion: 1.0
Nodes (1): Trip context; inputs.md A.4.

### Community 299 - "Community 299"
Cohesion: 1.0
Nodes (1): One-way lengths for every sized route; inputs.md A.6. All in metres,     each in

### Community 300 - "Community 300"
Cohesion: 1.0
Nodes (1): Full wizard payload; inputs.md Part A.

### Community 301 - "Community 301"
Cohesion: 1.0
Nodes (1): inputs.md C.7. One per route in ROUTES (always 7 entries).

### Community 302 - "Community 302"
Cohesion: 1.0
Nodes (1): Raise ValueError if value is not in allowed.

### Community 303 - "Community 303"
Cohesion: 1.0
Nodes (1): Raise ValueError if value is not in [lo, hi] (inclusive by default).

### Community 304 - "Community 304"
Cohesion: 1.0
Nodes (1): Raise ValueError if value is not a non-empty string.

### Community 305 - "Community 305"
Cohesion: 1.0
Nodes (1): Full structural + cross-field validation of AlgorithmInput.      Raises ValueErr

### Community 306 - "Community 306"
Cohesion: 1.0
Nodes (1): inputs.md A.7.1. Returns 0 when 'alternator' not selected.

### Community 307 - "Community 307"
Cohesion: 1.0
Nodes (1): inputs.md A.7.2. Returns one of ShoreAvailability literals.      Precedence:

### Community 308 - "Community 308"
Cohesion: 1.0
Nodes (1): PSH lookup. references/solar.md. See Assumption 1 at module top.

### Community 309 - "Community 309"
Cohesion: 1.0
Nodes (1): Split consumers into DC / AC Wh and peak W totals.      Returns:         (dc_wh,

### Community 310 - "Community 310"
Cohesion: 1.0
Nodes (1): Total Wp from rectangular roof areas * density * packing factor.

### Community 311 - "Community 311"
Cohesion: 1.0
Nodes (1): references/batteries.md + inputs.md C.1.      Formulas::          C_usable_Wh =

### Community 312 - "Community 312"
Cohesion: 1.0
Nodes (1): references/solar.md + inputs.md C.2.      Formulas::          roof_wp          =

### Community 313 - "Community 313"
Cohesion: 1.0
Nodes (1): references/alternator.md + inputs.md C.3.      Formulas::          i_out = min(

### Community 314 - "Community 314"
Cohesion: 1.0
Nodes (1): references/shore-power.md + inputs.md C.4.      Formulas::          target_c

### Community 315 - "Community 315"
Cohesion: 1.0
Nodes (1): references/inverter.md + inputs.md C.5.      Formula::          recommended_w =

### Community 316 - "Community 316"
Cohesion: 1.0
Nodes (1): references/solar.md "Sizing the MPPT" + inputs.md C.6.      Formulas::

### Community 317 - "Community 317"
Cohesion: 1.0
Nodes (1): references/cables.md + inputs.md C.7.      For each route, resolve (L, I, U) per

### Community 318 - "Community 318"
Cohesion: 1.0
Nodes (1): Size a camper 12/24/48 V electrical system.      See the module docstring for th

### Community 319 - "Community 319"
Cohesion: 1.0
Nodes (1): Tiny builder used by tests + worked example, DRYs the constructors.

### Community 320 - "Community 320"
Cohesion: 1.0
Nodes (1): Plan test 1: 12 V LFP, fridge 60 W / 24 h DC, laptop 90 W / 4 h AC,     2 m cabl

### Community 321 - "Community 321"
Cohesion: 1.0
Nodes (1): Plan test 2: no consumers -> all zeros, no crash.

### Community 322 - "Community 322"
Cohesion: 1.0
Nodes (1): Plan test 3: all DC -> inverter.needed False, standby NOT added.

### Community 323 - "Community 323"
Cohesion: 1.0
Nodes (1): Plan test 4: invalid inputs raise ValueError.

### Community 324 - "Community 324"
Cohesion: 1.0
Nodes (1): Plan test 5: adding a consumer never reduces battery.recommended_capacity_ah.

### Community 325 - "Community 325"
Cohesion: 1.0
Nodes (1): Plan test 6: Wh at 12 V -> Ah -> Wh comes back within 1e-9.

### Community 326 - "Community 326"
Cohesion: 1.0
Nodes (1): ``autarchy_days = 999`` is clamped to MAX_AUTARCHY_DAYS[trip_duration]     and e

### Community 327 - "Community 327"
Cohesion: 1.0
Nodes (1): full_time only when trip_duration=permanent AND charger_speed != slow.

### Community 328 - "Community 328"
Cohesion: 1.0
Nodes (1): References/cables.md worked example: 120 A continuous at 12 V, 3 m,     3 % drop

### Community 329 - "Community 329"
Cohesion: 1.0
Nodes (1): references/alternator.md worked example: 40 A / 24 V B2B from 12 V alt     draws

### Community 330 - "Community 330"
Cohesion: 1.0
Nodes (1): solar_shortfall_wh >= 0 even when yield > demand.

### Community 331 - "Community 331"
Cohesion: 1.0
Nodes (1): Roof area cm^2 -> m^2 -> Wp conversion.

### Community 332 - "Community 332"
Cohesion: 1.0
Nodes (1): Spec C: recommendation = '' and recommended_cross_section == min_cross_section.

### Community 333 - "Community 333"
Cohesion: 1.0
Nodes (1): Spec C.3 legacy: booster.current_a must equal booster.output_current_a.

### Community 334 - "Community 334"
Cohesion: 1.0
Nodes (1): Output always has 7 cables in the ROUTES order -- shape stability.

### Community 335 - "Community 335"
Cohesion: 1.0
Nodes (1): Execute every test above, print a summary line, raise on first failure.

### Community 336 - "Community 336"
Cohesion: 1.0
Nodes (1): Realistic camper: 12 V LFP, 2 roof panels, 200 W compressor fridge +     laptop

### Community 337 - "Community 337"
Cohesion: 1.0
Nodes (1): Pretty-print an AlgorithmOutput so the human can eyeball numbers.

## Knowledge Gaps
- **44 isolated node(s):** `algorithm/camper_electrics_sizing.py =====================================  Pure`, `One rectangular roof patch; inputs.md A.2.1.`, `One portable solar bag; inputs.md A.2.2.`, `One electrical consumer; inputs.md A.3.1.      ``voltage == 230`` is the ONLY ma`, `Trip context; inputs.md A.4.` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 26`** (7 nodes): `AmazonService`, `.constructor()`, `.getItem()`, `.initialize()`, `amazon-service.ts`, `render()`, `mermaid-diagram.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (6 nodes): `step-8-solar-bags.tsx`, `addBag()`, `effectivePortableWp()`, `newBagId()`, `removeAt()`, `setPowerAt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (6 nodes): `clampRoofDimension()`, `isPresetRoofName()`, `parseDimension()`, `RoofAreaRow()`, `constants.ts`, `roof-area-row.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `AdminConsumerDeviceForm()`, `admin-consumer-device-form.tsx`, `use-admin-consumer-device-form.ts`, `useAdminConsumerDeviceForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (3 nodes): `cn()`, `label()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (3 nodes): `types.ts`, `AIInvocationError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (3 nodes): `wizard.ts`, `alignConsumersDcToSystem()`, `hydrateInput()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 294`** (1 nodes): `algorithm/camper_electrics_sizing.py =====================================  Pure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 295`** (1 nodes): `One rectangular roof patch; inputs.md A.2.1.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 296`** (1 nodes): `One portable solar bag; inputs.md A.2.2.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 297`** (1 nodes): `One electrical consumer; inputs.md A.3.1.      ``voltage == 230`` is the ONLY ma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 298`** (1 nodes): `Trip context; inputs.md A.4.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 299`** (1 nodes): `One-way lengths for every sized route; inputs.md A.6. All in metres,     each in`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 300`** (1 nodes): `Full wizard payload; inputs.md Part A.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 301`** (1 nodes): `inputs.md C.7. One per route in ROUTES (always 7 entries).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 302`** (1 nodes): `Raise ValueError if value is not in allowed.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 303`** (1 nodes): `Raise ValueError if value is not in [lo, hi] (inclusive by default).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 304`** (1 nodes): `Raise ValueError if value is not a non-empty string.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 305`** (1 nodes): `Full structural + cross-field validation of AlgorithmInput.      Raises ValueErr`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 306`** (1 nodes): `inputs.md A.7.1. Returns 0 when 'alternator' not selected.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 307`** (1 nodes): `inputs.md A.7.2. Returns one of ShoreAvailability literals.      Precedence:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 308`** (1 nodes): `PSH lookup. references/solar.md. See Assumption 1 at module top.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 309`** (1 nodes): `Split consumers into DC / AC Wh and peak W totals.      Returns:         (dc_wh,`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 310`** (1 nodes): `Total Wp from rectangular roof areas * density * packing factor.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 311`** (1 nodes): `references/batteries.md + inputs.md C.1.      Formulas::          C_usable_Wh =`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 312`** (1 nodes): `references/solar.md + inputs.md C.2.      Formulas::          roof_wp          =`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 313`** (1 nodes): `references/alternator.md + inputs.md C.3.      Formulas::          i_out = min(`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 314`** (1 nodes): `references/shore-power.md + inputs.md C.4.      Formulas::          target_c`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 315`** (1 nodes): `references/inverter.md + inputs.md C.5.      Formula::          recommended_w =`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 316`** (1 nodes): `references/solar.md "Sizing the MPPT" + inputs.md C.6.      Formulas::`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 317`** (1 nodes): `references/cables.md + inputs.md C.7.      For each route, resolve (L, I, U) per`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 318`** (1 nodes): `Size a camper 12/24/48 V electrical system.      See the module docstring for th`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 319`** (1 nodes): `Tiny builder used by tests + worked example, DRYs the constructors.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 320`** (1 nodes): `Plan test 1: 12 V LFP, fridge 60 W / 24 h DC, laptop 90 W / 4 h AC,     2 m cabl`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 321`** (1 nodes): `Plan test 2: no consumers -> all zeros, no crash.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 322`** (1 nodes): `Plan test 3: all DC -> inverter.needed False, standby NOT added.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 323`** (1 nodes): `Plan test 4: invalid inputs raise ValueError.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 324`** (1 nodes): `Plan test 5: adding a consumer never reduces battery.recommended_capacity_ah.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 325`** (1 nodes): `Plan test 6: Wh at 12 V -> Ah -> Wh comes back within 1e-9.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 326`** (1 nodes): ```autarchy_days = 999`` is clamped to MAX_AUTARCHY_DAYS[trip_duration]     and e`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 327`** (1 nodes): `full_time only when trip_duration=permanent AND charger_speed != slow.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 328`** (1 nodes): `References/cables.md worked example: 120 A continuous at 12 V, 3 m,     3 % drop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 329`** (1 nodes): `references/alternator.md worked example: 40 A / 24 V B2B from 12 V alt     draws`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 330`** (1 nodes): `solar_shortfall_wh >= 0 even when yield > demand.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 331`** (1 nodes): `Roof area cm^2 -> m^2 -> Wp conversion.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 332`** (1 nodes): `Spec C: recommendation = '' and recommended_cross_section == min_cross_section.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 333`** (1 nodes): `Spec C.3 legacy: booster.current_a must equal booster.output_current_a.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 334`** (1 nodes): `Output always has 7 cables in the ROUTES order -- shape stability.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 335`** (1 nodes): `Execute every test above, print a summary line, raise on first failure.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 336`** (1 nodes): `Realistic camper: 12 V LFP, 2 roof panels, 200 W compressor fridge +     laptop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 337`** (1 nodes): `Pretty-print an AlgorithmOutput so the human can eyeball numbers.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `Community 0` to `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 11`, `Community 16`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `getPrisma()` connect `Community 2` to `Community 0`, `Community 1`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `runRecommendationPipeline()` connect `Community 8` to `Community 0`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 48 inferred relationships involving `getPrisma()` (e.g. with `POST()` and `listAlgorithmTestPresets()`) actually correct?**
  _`getPrisma()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 28 inferred relationships involving `POST()` (e.g. with `isAdminExportDomain()` and `importAdminDomain()`) actually correct?**
  _`POST()` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `readFromDatabase()` (e.g. with `loadBrandsWithTypes()` and `listAdminProductCategories()`) actually correct?**
  _`readFromDatabase()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `computeAlgorithm()` (e.g. with `mergeAlgorithmTuning()` and `validate()`) actually correct?**
  _`computeAlgorithm()` has 21 INFERRED edges - model-reasoned connections that need verification._