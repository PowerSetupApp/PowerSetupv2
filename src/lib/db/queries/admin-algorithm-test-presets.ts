import type { AlgorithmTestUserPreset } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/client";

export type AlgorithmTestPresetListItem = Pick<AlgorithmTestUserPreset, "id" | "name" | "description" | "sortOrder">;

export async function listAlgorithmTestPresets(): Promise<AlgorithmTestPresetListItem[]> {
  const prisma = getPrisma();
  return prisma.algorithmTestUserPreset.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, sortOrder: true },
  });
}

export async function getAlgorithmTestPresetById(id: string): Promise<AlgorithmTestUserPreset | null> {
  const prisma = getPrisma();
  return prisma.algorithmTestUserPreset.findFirst({
    where: { id, isActive: true },
  });
}

export async function createAlgorithmTestPreset(input: {
  name: string;
  description: string | null;
  formData: object;
}): Promise<AlgorithmTestUserPreset> {
  const prisma = getPrisma();
  const last = await prisma.algorithmTestUserPreset.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;
  return prisma.algorithmTestUserPreset.create({
    data: {
      name: input.name,
      description: input.description,
      formData: input.formData,
      sortOrder,
    },
  });
}

export async function updateAlgorithmTestPreset(
  id: string,
  patch: { name?: string; description?: string | null; formData?: object },
): Promise<AlgorithmTestUserPreset> {
  const prisma = getPrisma();
  return prisma.algorithmTestUserPreset.update({
    where: { id },
    data: patch,
  });
}

export async function deleteAlgorithmTestPreset(id: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.algorithmTestUserPreset.delete({ where: { id } });
}
