import * as z from "zod";

import { createResultFromFormData } from "@/lib/db/queries/results";
import { createWizardResultBodySchema } from "@/lib/schemas/wizard-input";

function getPrismaErrorCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    const code = (e as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function buildDevErrorDetail(e: unknown): string {
  if (!(e instanceof Error)) {
    return String(e);
  }
  const parts: string[] = [e.message];
  const code = getPrismaErrorCode(e);
  if (code) parts.push(`code=${code}`);
  const firstFrame = e.stack?.split("\n").slice(1, 2)[0]?.trim();
  if (firstFrame) parts.push(firstFrame);
  return parts.join(" | ");
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { formData } = createWizardResultBodySchema.parse(json);
    const { id } = await createResultFromFormData(formData);
    return Response.json({ id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }
    if (e instanceof Error && e.message.includes("DATABASE_URL")) {
      return Response.json({ error: "Datenbank nicht konfiguriert" }, { status: 503 });
    }

    console.error("[POST /api/results] failed:", e);

    const prismaCode = getPrismaErrorCode(e);
    const isDev = process.env.NODE_ENV !== "production";

    if (prismaCode === "P1001") {
      return Response.json(
        {
          error: "Datenbank nicht erreichbar",
          ...(isDev ? { detail: buildDevErrorDetail(e) } : {}),
        },
        { status: 503 },
      );
    }

    if (prismaCode === "P2021" || prismaCode === "P2022") {
      const hint =
        "Datenbank-Schema passt nicht zum Code — ausstehende Prisma-Migrationen anwenden: lokal `npm run db:migrate` (bzw. `npx prisma migrate dev`), Server/Preview `npm run db:migrate:deploy` (`npx prisma migrate deploy`). Bestehende Tabellenzeilen bleiben dabei erhalten; es werden Schema-Änderungen nachgezogen.";
      return Response.json(
        {
          error: hint,
          ...(isDev ? { detail: buildDevErrorDetail(e) } : {}),
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        error: "Speichern fehlgeschlagen",
        ...(isDev ? { detail: buildDevErrorDetail(e) } : {}),
      },
      { status: 500 },
    );
  }
}
