"use server";

import { revalidatePath, updateTag } from "next/cache";
import * as z from "zod";

import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  buildRecommendationTargets,
  enrichPrefilterForAdmin,
  type AlgorithmTestRecommendationPreviewPayload,
} from "@/lib/admin/algorithm-test-recommendation-preview";
import { runAlgorithmPreview } from "@/lib/admin/algorithm-preview";
import { importAdminDomain } from "@/lib/db/queries/admin-catalog-io";
import {
  getAISettings,
  listGeminiImageModels,
  listGeminiTextModels,
  listOpenAIImageModels,
  listOpenAITextModels,
  updateAISettings,
  type AiProvider,
} from "@/lib/db/queries/admin-settings-ai";
import {
  createAlgorithmTestPreset,
  deleteAlgorithmTestPreset,
  getAlgorithmTestPresetById,
  listAlgorithmTestPresets,
  updateAlgorithmTestPreset,
} from "@/lib/db/queries/admin-algorithm-test-presets";
import { getAlgorithmSettings, syncComponentClassesFromDB, updateAlgorithmSettings } from "@/lib/db/queries/admin-settings-algorithm";
import { getAmazonPartnerTag, setAmazonPartnerTag } from "@/lib/db/queries/admin-settings-amazon";
import { fetchAndSaveModelPricing, listModelPricing, updateModelPricingRow } from "@/lib/db/queries/admin-settings-pricing";
import { listActiveProductsForRecommendation } from "@/lib/db/queries/products";
import { runRecommendationPipeline } from "@/lib/recommendation";
import { parseAlgorithmInput } from "@/lib/schemas/wizard-input";
import { isAdminExportDomain, type AdminExportDomain } from "@/lib/schemas/admin-catalog-json";

export async function loadAISettingsAction() {
  return getAISettings();
}

export async function saveAISettingsAction(input: {
  provider: AiProvider;
  model: string;
  imageModel: string;
  geminiApiKey: string;
  openaiApiKey: string;
  userPromptTemplate: string;
  imagePromptTemplate: string;
  specsOptimizationPrompt: string;
}) {
  await updateAISettings(input);
  revalidatePath("/admin/settings");
}

export async function loadGeminiModelsAction(apiKey: string) {
  return listGeminiTextModels(apiKey);
}

export async function loadOpenAIModelsAction(apiKey: string) {
  return listOpenAITextModels(apiKey);
}

export async function loadGeminiImageModelsAction() {
  return listGeminiImageModels();
}

export async function loadOpenAIImageModelsAction(apiKey: string) {
  return listOpenAIImageModels(apiKey);
}

export async function loadAlgorithmSettingsAction() {
  return getAlgorithmSettings();
}

export async function saveAlgorithmSettingsAction(patch: Record<string, unknown>) {
  await updateAlgorithmSettings(patch as never);
  // Neue Werte sofort für die Result-Pipeline wirksam machen.
  updateTag(CACHE_TAGS.algorithmSettings);
  revalidatePath("/admin/settings");
}

export async function syncAlgorithmClassesAction() {
  const data = await syncComponentClassesFromDB();
  updateTag(CACHE_TAGS.algorithmSettings);
  revalidatePath("/admin/settings");
  return data;
}

export async function runAlgorithmTestAction(rawInput: unknown) {
  try {
    const input = parseAlgorithmInput(rawInput);
    // Der neue Algorithmus ist eine reine Funktion mit hartkodierten Konstanten —
    // es wird NICHT mehr aus `AlgorithmSettings` gemerged. `effectiveInput`
    // entspricht daher dem validierten Wizard-Input unverändert.
    const preview = runAlgorithmPreview(input);

    const productsResult = await listActiveProductsForRecommendation();
    const products = productsResult.ok ? productsResult.data : [];
    const productMap = new Map(products.map((p) => [p.id, p]));
    const pipeline = await runRecommendationPipeline({
      calculations: preview.output,
      runAi: false,
      perCategoryLimit: 8,
      productsOverride: products,
    });
    const recommendationPreview: AlgorithmTestRecommendationPreviewPayload = {
      catalogOk: productsResult.ok,
      targets: buildRecommendationTargets(preview.output),
      buckets: enrichPrefilterForAdmin(pipeline.prefilter, productMap),
    };

    return {
      ok: true as const,
      output: preview.output,
      breakdown: preview.breakdown,
      effectiveInput: input,
      hasDbSettings: false,
      recommendationPreview,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return { ok: false as const, message };
  }
}

export async function loadModelPricingAction() {
  return listModelPricing();
}

export async function saveModelPricingRowAction(modelId: string, inputPrice: number, outputPrice: number) {
  await updateModelPricingRow(modelId, inputPrice, outputPrice);
  revalidatePath("/admin/settings");
}

export async function refreshModelPricingFromProviderAction(provider: "openai" | "google") {
  const { count } = await fetchAndSaveModelPricing(provider);
  revalidatePath("/admin/settings");
  return { count };
}

export async function loadAmazonSettingsAction() {
  return { amazonPartnerTag: await getAmazonPartnerTag() };
}

export async function saveAmazonSettingsAction(amazonPartnerTag: string) {
  await setAmazonPartnerTag(amazonPartnerTag);
  revalidatePath("/admin/settings");
}

const algorithmTestPresetNameSchema = z.string().trim().min(1).max(160);

export async function listAlgorithmTestPresetsAction() {
  return listAlgorithmTestPresets();
}

export async function getAlgorithmTestPresetByIdAction(id: string) {
  if (!id) return null;
  return getAlgorithmTestPresetById(id);
}

export async function createAlgorithmTestUserPresetAction(input: {
  name: string;
  description?: string | null;
  formData: unknown;
}) {
  try {
    const name = algorithmTestPresetNameSchema.parse(input.name);
    const description = input.description?.trim() ? input.description.trim() : null;
    const formData = parseAlgorithmInput(input.formData);
    const preset = await createAlgorithmTestPreset({
      name,
      description,
      formData: formData as object,
    });
    revalidatePath("/admin/settings");
    return { ok: true as const, preset };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preset konnte nicht gespeichert werden.";
    return { ok: false as const, message };
  }
}

export async function updateAlgorithmTestUserPresetAction(
  id: string,
  input: { name?: string; description?: string | null; formData?: unknown },
) {
  try {
    const patch: { name?: string; description?: string | null; formData?: object } = {};
    if (input.name !== undefined) patch.name = algorithmTestPresetNameSchema.parse(input.name);
    if (input.description !== undefined) {
      patch.description = input.description?.trim() ? input.description.trim() : null;
    }
    if (input.formData !== undefined) {
      patch.formData = parseAlgorithmInput(input.formData) as object;
    }
    const preset = await updateAlgorithmTestPreset(id, patch);
    revalidatePath("/admin/settings");
    return { ok: true as const, preset };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preset konnte nicht aktualisiert werden.";
    return { ok: false as const, message };
  }
}

export async function deleteAlgorithmTestUserPresetAction(id: string) {
  try {
    await deleteAlgorithmTestPreset(id);
    revalidatePath("/admin/settings");
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preset konnte nicht gelöscht werden.";
    return { ok: false as const, message };
  }
}

export async function importCatalogJsonAction(domain: string, jsonString: string) {
  if (!isAdminExportDomain(domain)) {
    throw new Error("Unbekannte Import-Domain");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString) as unknown;
  } catch {
    throw new Error("Ungültiges JSON");
  }
  try {
    const result = await importAdminDomain(domain as AdminExportDomain, raw);
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/settings");
    return result;
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(JSON.stringify(e.flatten()));
    }
    throw e;
  }
}
