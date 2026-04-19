"use client";

import { useState } from "react";

export type AdminConsumerDeviceInitial = {
  id?: string;
  name: string;
  categoryId: string;
  icon: string | null;
  defaultPower: number;
  defaultVoltage: string;
  defaultHoursPerDay: number;
  stepHours: number;
  showHoursField: boolean;
  showFixedOption: boolean;
  isCooling: boolean;
  keywords: string[];
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  averageLoadPercent: number | null;
};

export const ADMIN_CONSUMER_DEVICE_DEFAULT: AdminConsumerDeviceInitial = {
  name: "",
  categoryId: "",
  icon: null,
  defaultPower: 50,
  defaultVoltage: "12V",
  defaultHoursPerDay: 2,
  stepHours: 0.5,
  showHoursField: true,
  showFixedOption: false,
  isCooling: false,
  keywords: [],
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
  averageLoadPercent: null,
};

export type AdminConsumerDeviceFormState = ReturnType<typeof useAdminConsumerDeviceForm>;

export function useAdminConsumerDeviceForm(initial?: AdminConsumerDeviceInitial, fallbackCategoryId = "") {
  const [f, setF] = useState<AdminConsumerDeviceInitial>(() => initial ?? {
    ...ADMIN_CONSUMER_DEVICE_DEFAULT,
    categoryId: fallbackCategoryId,
  });
  const [keywordsText, setKeywordsText] = useState<string>((initial?.keywords ?? []).join(", "));

  function update<K extends keyof AdminConsumerDeviceInitial>(k: K, v: AdminConsumerDeviceInitial[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function buildPayload(): { ok: true; data: Omit<AdminConsumerDeviceInitial, "id"> } | { ok: false; message: string } {
    if (!f.name.trim()) return { ok: false, message: "Name erforderlich." };
    if (!f.categoryId) return { ok: false, message: "Bitte Kategorie wählen." };
    const keywords = keywordsText.split(",").map((s) => s.trim()).filter(Boolean);
    return {
      ok: true,
      data: { ...f, name: f.name.trim(), icon: f.icon?.trim() || null, keywords },
    };
  }

  return { state: f, keywordsText, setKeywordsText, update, buildPayload };
}
