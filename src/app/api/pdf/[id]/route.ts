import * as z from "zod";

import type { Prisma } from "@/generated/prisma/client";

import { AIInvocationError } from "@/lib/ai/types";
import { ResultBlobUnavailableError, uploadResultSchematicPdf } from "@/lib/blob/result-schematic";
import { consumeCreditsAndStoreSchematic, getCreditBalance, InsufficientCreditsError } from "@/lib/db/queries/credits";
import { listProductsByIdsForSchematic } from "@/lib/db/queries/products";
import { getResultByIdForPublic } from "@/lib/db/queries/results";
import { htmlToPdfBuffer } from "@/lib/pdf/generator";
import { getPdfSchematicLimiter } from "@/lib/ratelimit";
import { parseResultViewModel } from "@/lib/results/parse-result-view-model";
import { isResultExpired } from "@/lib/results/result-helpers";
import { SCHEMATIC_PDF_CREDIT_COST } from "@/lib/schematic/constants";
import { generateSchematicPlanFromContext } from "@/lib/schematic/generate-schematic-plan";
import { schematicPlanToPrintHtml } from "@/lib/schematic/schematic-html";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

function clientKey(request: Request, id: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:pdf:${id}`;
}

export async function POST(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return Response.json({ error: "Ungültige ID" }, { status: 400 });
  }

  const decision = getPdfSchematicLimiter().consume(clientKey(request, id));
  if (!decision.ok) {
    return Response.json(
      { error: "Zu viele Anfragen. Bitte kurz warten." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  try {
    const row = await getResultByIdForPublic(id);
    if (!row) {
      return Response.json({ error: "Result nicht gefunden" }, { status: 404 });
    }
    if (isResultExpired(row.expiresAt)) {
      return Response.json({ error: "Ergebnis abgelaufen" }, { status: 410 });
    }
    if (row.generationStatus !== "succeeded") {
      return Response.json({ error: "Berechnung noch nicht fertig" }, { status: 409 });
    }

    if (row.schematicPdfUrl) {
      return Response.json({ url: row.schematicPdfUrl, cached: true });
    }

    const balance = await getCreditBalance(id);
    if (balance < SCHEMATIC_PDF_CREDIT_COST) {
      return Response.json({ error: "Keine Credits — bitte zuerst Schaltplan-Credits kaufen." }, { status: 402 });
    }

    const vm = parseResultViewModel(row);
    if (!vm.calculations) {
      return Response.json({ error: "Keine Berechnungsdaten" }, { status: 409 });
    }

    const products = await listProductsByIdsForSchematic(vm.productIdsForDisplay);
    const plan = await generateSchematicPlanFromContext({
      variant: row.schematicVariant,
      formData: row.formData,
      calculations: vm.calculations,
      products,
    });

    const html = schematicPlanToPrintHtml(plan);
    const pdf = await htmlToPdfBuffer(html);
    const url = await uploadResultSchematicPdf(id, pdf);

    await consumeCreditsAndStoreSchematic({
      resultId: id,
      cost: SCHEMATIC_PDF_CREDIT_COST,
      schematicData: plan as unknown as Prisma.InputJsonValue,
      schematicPdfUrl: url,
    });

    return Response.json({ url, cached: false });
  } catch (e) {
    if (e instanceof ResultBlobUnavailableError) {
      return Response.json({ error: e.message }, { status: 503 });
    }
    if (e instanceof InsufficientCreditsError) {
      return Response.json({ error: e.message }, { status: 402 });
    }
    if (e instanceof AIInvocationError) {
      return Response.json({ error: e.message }, { status: 502 });
    }
    const msg = e instanceof Error ? e.message : "PDF-Fehler";
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/pdf]", e);
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
