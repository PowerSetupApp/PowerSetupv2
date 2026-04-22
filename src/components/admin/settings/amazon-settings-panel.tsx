"use client";

import { loadAmazonSettingsAction, saveAmazonSettingsAction } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function AmazonSettingsPanel() {
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await loadAmazonSettingsAction();
      setTag(s.amazonPartnerTag);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amazon Partnerprogramm</CardTitle>
        <CardDescription>Partner-Tag für Affiliate-Links zu Produkten.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="partner-tag">Partner Tag</Label>
          <Input
            id="partner-tag"
            value={tag}
            onChange={(e) => {
              setError(null);
              setTag(e.target.value);
            }}
            placeholder="deinTag-21"
            aria-invalid={error ? true : undefined}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <Button
          type="button"
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await saveAmazonSettingsAction(tag);
              await load();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Speichern fehlgeschlagen.";
              setError(msg);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          Speichern
        </Button>
      </CardContent>
    </Card>
  );
}
