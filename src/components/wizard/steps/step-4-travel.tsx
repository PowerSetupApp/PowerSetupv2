"use client";

import { useTranslations } from "next-intl";
import { useWizardStore, TravelSeason, TripDuration, WinterLocation, StandingDuration } from "@/lib/store/wizard-store";
import { CardSelection } from "@/components/ui/card-selection";
import { Sun, Snowflake, CalendarRange, Map, Timer, ChevronRight, Thermometer, Mountain, Palmtree, Compass } from "lucide-react";

export function Step4Travel() {
    const t = useTranslations("Wizard.Step5");
    const { travelBehavior, setTravelBehavior } = useWizardStore();

    // Season options
    const seasonOptions = [
        {
            value: "summer_only",
            title: t("season_summer"),
            description: t("season_summer_desc"),
            icon: <Sun className="h-6 w-6" />
        },
        {
            value: "all_year",
            title: t("season_all_year"),
            description: t("season_all_year_desc"),
            icon: <CalendarRange className="h-6 w-6" />
        },
        {
            value: "winter_focused",
            title: t("season_winter"),
            description: t("season_winter_desc"),
            icon: <Snowflake className="h-6 w-6" />
        }
    ];

    // Trip duration options
    const durationOptions = [
        {
            value: "weekend",
            title: t("duration_weekend"),
            description: t("duration_weekend_desc"),
            icon: <Timer className="h-5 w-5" />
        },
        {
            value: "week",
            title: t("duration_week"),
            description: t("duration_week_desc"),
            icon: <ChevronRight className="h-5 w-5" />
        },
        {
            value: "extended",
            title: t("duration_extended"),
            description: t("duration_extended_desc"),
            icon: <Map className="h-5 w-5" />
        },
        {
            value: "permanent",
            title: t("duration_permanent"),
            description: t("duration_permanent_desc"),
            icon: <Compass className="h-5 w-5" />
        }
    ];

    // Winter location options
    const winterOptions = [
        {
            value: "germany_alps",
            title: t("winter_germany_alps"),
            description: t("winter_germany_alps_desc"),
            icon: <Mountain className="h-5 w-5" />
        },
        {
            value: "southern_europe",
            title: t("winter_southern"),
            description: t("winter_southern_desc"),
            icon: <Palmtree className="h-5 w-5" />
        },
        {
            value: "scandinavia",
            title: t("winter_scandinavia"),
            description: t("winter_scandinavia_desc"),
            icon: <Thermometer className="h-5 w-5" />
        },
        {
            value: "varies",
            title: t("winter_varies"),
            description: t("winter_varies_desc"),
            icon: <Compass className="h-5 w-5" />
        }
    ];

    // Standing duration options
    const standingOptions = [
        {
            value: "short",
            title: t("standing_short"),
            description: t("standing_short_desc"),
            icon: <Timer className="h-5 w-5" />
        },
        {
            value: "medium",
            title: t("standing_medium"),
            description: t("standing_medium_desc"),
            icon: <Timer className="h-5 w-5" />
        },
        {
            value: "long",
            title: t("standing_long"),
            description: t("standing_long_desc"),
            icon: <Timer className="h-5 w-5" />
        }
    ];

    const showWinterSection = travelBehavior.season !== 'summer_only';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            {/* Season Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("season_title")}</h3>
                <CardSelection
                    options={seasonOptions}
                    value={travelBehavior.season}
                    onChange={(val) => setTravelBehavior({ season: val as TravelSeason })}
                    columns={3}
                />
            </div>

            {/* Trip Duration */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("duration_title")}</h3>
                <CardSelection
                    options={durationOptions}
                    value={travelBehavior.tripDuration}
                    onChange={(val) => setTravelBehavior({ tripDuration: val as TripDuration })}
                    columns={2}
                />
            </div>

            {/* Winter Location - Conditional */}
            {showWinterSection && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-lg font-semibold">{t("winter_title")}</h3>
                    <CardSelection
                        options={winterOptions}
                        value={travelBehavior.winterLocation}
                        onChange={(val) => setTravelBehavior({ winterLocation: val as WinterLocation })}
                        columns={2}
                    />
                </div>
            )}

            {/* Standing Duration */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("standing_title")}</h3>
                <CardSelection
                    options={standingOptions}
                    value={travelBehavior.standingDuration}
                    onChange={(val) => setTravelBehavior({ standingDuration: val as StandingDuration })}
                    columns={3}
                />
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {t("standing_hint")}
                </p>
            </div>
        </div>
    );
}
