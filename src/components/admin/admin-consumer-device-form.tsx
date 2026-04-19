"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import {
  adminCatalogCreateConsumerDeviceAction,
  adminCatalogUpdateConsumerDeviceAction,
} from "@/lib/admin/catalog-actions";
import { Button } from "@/components/ui/button";

import { AdminConsumerDeviceFormFields } from "./admin-consumer-device-form-fields";
import {
  useAdminConsumerDeviceForm,
  type AdminConsumerDeviceInitial,
} from "./use-admin-consumer-device-form";

type Props = {
  initial?: AdminConsumerDeviceInitial;
  categories: { id: string; name: string }[];
};

export function AdminConsumerDeviceForm({ initial, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useAdminConsumerDeviceForm(initial, categories[0]?.id ?? "");

  function submit() {
    setError(null);
    setSuccess(null);
    const built = form.buildPayload();
    if (!built.ok) {
      setError(built.message);
      return;
    }
    startTransition(async () => {
      if (initial?.id) {
        const res = await adminCatalogUpdateConsumerDeviceAction({ id: initial.id, ...built.data });
        if (!res.ok) return setError(res.message);
        setSuccess("Gespeichert.");
        router.refresh();
        return;
      }
      const res = await adminCatalogCreateConsumerDeviceAction(built.data);
      if (!res.ok) return setError(res.message);
      router.push(`/admin/consumer-devices/${res.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}

      <AdminConsumerDeviceFormFields form={form} categories={categories} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pending} onClick={() => submit()}>
          <Save className="mr-2 size-4" aria-hidden />
          {pending ? "Speichern…" : "Speichern"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/consumer-devices">Abbrechen</Link>
        </Button>
      </div>
    </div>
  );
}
