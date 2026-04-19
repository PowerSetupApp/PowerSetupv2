"use client";

import type { AlgorithmInput, CableLengths } from "@/lib/algorithm/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CableLengthRow } from "./cable-length-row";

export function CableGroups({
  input,
  setCableLengths,
}: {
  input: AlgorithmInput;
  setCableLengths: (patch: Partial<CableLengths>) => void;
}) {
  const { energySources, cableLengths, consumers, roofAreas, solarBags } = input;
  const hasAlternator = energySources.includes("alternator");
  const hasSolar = energySources.includes("solar");
  // Solar cable rows are only useful once the user configured at least one
  // source (roof area or portable bag). Mirrors `getRequiredCableLengthKeys`.
  const hasSolarSource = roofAreas.length > 0 || solarBags.length > 0;
  const showSolarCables = hasSolar && hasSolarSource;
  const hasShore = energySources.includes("shore_power");
  const hasInverter = consumers.some((c) => c.voltage === 230);

  return (
    <div className="flex flex-col gap-5">
      {hasSolar && !showSolarCables ? (
        <p className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Solar ist gewählt, aber es ist noch keine wirksame Dachfläche hinterlegt. Bitte Dachflächen in{" "}
          <span className="font-medium text-foreground">Schritt 2</span> ergänzen, damit die PV-Kabellängen
          relevant werden.
        </p>
      ) : null}

      {hasAlternator ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lichtmaschine / Ladebooster</CardTitle>
            <CardDescription>Entfernungen im Bordnetz zwischen Starter- und Versorgerbatterie.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <CableLengthRow
              cableKey="starterToService"
              value={cableLengths.starterToService}
              onChange={setCableLengths}
            />
            <CableLengthRow
              cableKey="boosterToService"
              value={cableLengths.boosterToService}
              onChange={setCableLengths}
            />
          </CardContent>
        </Card>
      ) : null}

      {showSolarCables ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solar</CardTitle>
            <CardDescription>PV-Leitung zum Laderegler und weiter zur Versorgerbatterie.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <CableLengthRow
              cableKey="solarToRegulator"
              value={cableLengths.solarToRegulator}
              onChange={setCableLengths}
            />
            <CableLengthRow
              cableKey="regulatorToService"
              value={cableLengths.regulatorToService}
              onChange={setCableLengths}
            />
          </CardContent>
        </Card>
      ) : null}

      {hasShore ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Landstrom</CardTitle>
            <CardDescription>DC-Strecke vom Batterieladegerät zur Versorgerbatterie.</CardDescription>
          </CardHeader>
          <CardContent>
            <CableLengthRow
              cableKey="chargerToService"
              value={cableLengths.chargerToService}
              onChange={setCableLengths}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verteilung</CardTitle>
          <CardDescription>Hauptstrang zur Absicherung und ggf. zum Wechselrichter.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <CableLengthRow
            cableKey="batteryToFuseBox"
            value={cableLengths.batteryToFuseBox}
            onChange={setCableLengths}
          />
          {hasInverter ? (
            <CableLengthRow
              cableKey="serviceToInverter"
              value={cableLengths.serviceToInverter}
              onChange={setCableLengths}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
