"use client";

import {
  loadAISettingsAction,
  loadGeminiImageModelsAction,
  loadGeminiModelsAction,
  loadOpenAIImageModelsAction,
  loadOpenAIModelsAction,
  saveAISettingsAction,
} from "@/app/admin/settings/actions";
import type { AIModelOption, AiProvider } from "@/lib/db/queries/admin-settings-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PLACEHOLDERS = ["{{PROMPT_FORMAT}}", "{{PRODUCT_CONTEXT}}"];

function formatLoadError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/does not exist in the current database/i.test(msg)) {
    return `${msg}\n\nDie Datenbank ist vermutlich hinter dem Prisma-Schema zurück (z. B. fehlende Spalte nach Schema-Update). Für eine Entwicklungs-DB hilft oft \`npx prisma db push\`; in Produktion fehlende Änderungen per SQL oder Migrations-Baseline nachziehen.`;
  }
  return msg;
}

export function AISettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [provider, setProvider] = useState<AiProvider>("google");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [model, setModel] = useState("");
  const [imageModel, setImageModel] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [specsPrompt, setSpecsPrompt] = useState("");
  const [models, setModels] = useState<AIModelOption[]>([]);
  const [imageModels, setImageModels] = useState<AIModelOption[]>([]);

  const refreshModels = useCallback(async (p: AiProvider, gKey: string, oKey: string) => {
    setFetching(true);
    try {
      if (p === "google") {
        const [t, i] = await Promise.all([loadGeminiModelsAction(gKey), loadGeminiImageModelsAction()]);
        setModels(t);
        setImageModels(i);
      } else {
        const [t, i] = await Promise.all([loadOpenAIModelsAction(oKey), loadOpenAIImageModelsAction(oKey)]);
        setModels(t);
        setImageModels(i);
      }
    } finally {
      setFetching(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const s = await loadAISettingsAction();
      setProvider(s.provider);
      setGeminiKey(s.geminiApiKey);
      setOpenaiKey(s.openaiApiKey);
      setModel(s.model);
      setImageModel(s.imageModel);
      setUserPrompt(s.userPromptTemplate);
      setImagePrompt(s.imagePromptTemplate);
      setSpecsPrompt(s.specsOptimizationPrompt);
      await refreshModels(s.provider, s.geminiApiKey, s.openaiApiKey);
    } catch (e) {
      setLoadError(formatLoadError(e));
    } finally {
      setLoading(false);
    }
  }, [refreshModels]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!loading) void refreshModels(provider, geminiKey, openaiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur bei Provider-Wechsel
  }, [provider]);

  const insertChip = (target: "user" | "image" | "specs", token: string) => {
    if (target === "user") setUserPrompt((t) => (t ? `${t} ${token}` : token));
    if (target === "image") setImagePrompt((t) => (t ? `${t} ${token}` : token));
    if (target === "specs") setSpecsPrompt((t) => (t ? `${t} ${token}` : token));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive whitespace-pre-wrap"
        >
          {loadError}
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Erneut laden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KI-Provider &amp; API-Keys</CardTitle>
          <CardDescription>Provider wählen und Schlüssel hinterlegen (werden in der Datenbank gespeichert).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="ai_provider" checked={provider === "google"} onChange={() => setProvider("google")} />
              Google Gemini
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="ai_provider" checked={provider === "openai"} onChange={() => setProvider("openai")} />
              OpenAI
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API-Key</Label>
              <Input
                id="gemini-key"
                type="password"
                autoComplete="off"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API-Key</Label>
              <Input
                id="openai-key"
                type="password"
                autoComplete="off"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Modelle</CardTitle>
            <CardDescription>Chat- und Bildmodell.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshModels(provider, geminiKey, openaiKey)} disabled={fetching}>
            <RefreshCw className={`size-4 ${fetching ? "animate-spin" : ""}`} aria-hidden />
            Liste aktualisieren
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chat-model">Chat-Modell</Label>
            <SimpleSelect
              id="chat-model"
              value={model}
              onValueChange={setModel}
              options={models.map((m) => ({ value: m.name, label: m.displayName }))}
              triggerClassName="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="img-model">Bildmodell</Label>
            <SimpleSelect
              id="img-model"
              value={imageModel}
              onValueChange={setImageModel}
              options={imageModels.map((m) => ({ value: m.id, label: m.displayName }))}
              triggerClassName="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt: Empfehlungen</CardTitle>
          <CardDescription>Aktive Vorlage für Produktempfehlungen (neue Version bei jedem Speichern).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((p) => (
              <Button key={p} type="button" variant="secondary" size="sm" className="text-xs" onClick={() => insertChip("user", p)}>
                {p}
              </Button>
            ))}
          </div>
          <Textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} rows={10} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt: Bildgenerierung</CardTitle>
          <CardDescription>Platzhalter z. B. {"{{SELECTED_PRODUCTS}}"}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => insertChip("image", "{{SELECTED_PRODUCTS}}")}>
            {"{{SELECTED_PRODUCTS}}"}
          </Button>
          <Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={6} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt: Specs-Optimierung</CardTitle>
          <CardDescription>Muss {"{{INPUT}}"} enthalten (KI „Mit KI optimieren“).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => insertChip("specs", "{{INPUT}}")}>
            {"{{INPUT}}"}
          </Button>
          <Textarea value={specsPrompt} onChange={(e) => setSpecsPrompt(e.target.value)} rows={6} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={async () => {
            setSaving(true);
            try {
              await saveAISettingsAction({
                provider,
                model,
                imageModel,
                geminiApiKey: geminiKey,
                openaiApiKey: openaiKey,
                userPromptTemplate: userPrompt,
                imagePromptTemplate: imagePrompt,
                specsOptimizationPrompt: specsPrompt,
              });
              await load();
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          Speichern
        </Button>
      </div>
    </div>
  );
}
