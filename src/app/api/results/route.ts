import * as z from "zod";

import { createResultFromFormData } from "@/lib/db/queries/results";
import { createWizardResultBodySchema } from "@/lib/schemas/wizard-input";

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
    throw e;
  }
}
