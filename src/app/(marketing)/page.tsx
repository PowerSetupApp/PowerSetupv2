import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  FileText,
  ShoppingCart,
  Sun,
  Battery,
  Cable,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Clock
} from "lucide-react";

// Hero Section
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-amber-500 to-orange-600 opacity-20" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-20 md:px-6 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
            <Sparkles className="h-4 w-4" />
            <span>KI-gestützte Schaltplan-Erstellung</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Dein perfekter{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Schaltplan
            </span>{" "}
            in Minuten
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Konfiguriere deine Camper-Elektrik mit unserem intelligenten Assistenten.
            Erhalte professionelle Schaltpläne, Kabeldimensionierung und passende Produktempfehlungen.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-orange-500/25 border-0 transition-all hover:shadow-orange-500/40 hover:scale-[1.02]"
            >
              <Link href="/wizard?reset=true">
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="#how-it-works">So funktioniert&apos;s</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Keine Registrierung nötig</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Sofort als PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Von Experten geprüft</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: "Professionelle Schaltpläne",
      description: "Erhalte technisch korrekte Schaltpläne, die von Elektrikern verstanden werden. Wahlweise als vereinfachte oder DIN-konforme Version.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: ShoppingCart,
      title: "Produktempfehlungen",
      description: "Passende Komponenten von Amazon und eBay, automatisch auf dein Setup abgestimmt. Mit Affiliate-Links für beste Preise.",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: Cable,
      title: "Kabelberechnung",
      description: "Automatische Berechnung der Kabelquerschnitte und Sicherungen basierend auf deinem Verbrauch und Kabellängen.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Battery,
      title: "Batterie-Sizing",
      description: "Berechnung der optimalen Batteriegröße für deine gewünschte Autarkie-Zeit. Von Wochenendtrip bis Vollautark.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Sun,
      title: "Solar-Konfiguration",
      description: "Plane deine Solaranlage mit Dachmodulen oder mobilen Solartaschen. Inklusive Potenzialberechnung.",
      gradient: "from-yellow-500 to-amber-500",
    },
    {
      icon: Zap,
      title: "KI-Optimierung",
      description: "Unser KI-Assistent analysiert dein Setup und gibt Empfehlungen für maximale Effizienz und Sicherheit.",
      gradient: "from-rose-500 to-orange-500",
    },
  ];

  return (
    <section id="features" className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Alles was du für deinen{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Camper-Ausbau
            </span>{" "}
            brauchst
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Von der ersten Planung bis zum fertigen Schaltplan – PowerSetup begleitet dich durch jeden Schritt.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 transition-all hover:border-border hover:shadow-xl hover:shadow-black/5"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Konfiguriere dein Setup",
      description: "Wähle Fahrzeugtyp, Verbraucher, Ladequellen und gewünschte Autarkie-Zeit in unserem geführten Wizard.",
    },
    {
      step: "02",
      title: "KI analysiert & optimiert",
      description: "Unsere KI berechnet Batteriegröße, Kabelquerschnitte und wählt passende Komponenten aus.",
    },
    {
      step: "03",
      title: "Schaltplan & Shopping",
      description: "Lade deinen professionellen Schaltplan als PDF herunter und bestelle direkt die empfohlenen Produkte.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            In 3 Schritten zum{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              fertigen Schaltplan
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Unser intelligenter Assistent führt dich durch den gesamten Prozess.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-amber-500/50 to-transparent md:block" />
                )}

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500/20 bg-gradient-to-br from-amber-500 to-orange-600 text-3xl font-bold text-white shadow-xl shadow-orange-500/20">
                    {step.step}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xl shadow-orange-500/25 border-0"
          >
            <Link href="/wizard?reset=true">
              Jetzt konfigurieren
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Benefits Section
function BenefitsSection() {
  const benefits = [
    {
      icon: Shield,
      title: "Sicherheit zuerst",
      description: "Alle Berechnungen basieren auf VDE-Normen. Keine Fehler bei Sicherungen oder Kabelquerschnitten.",
    },
    {
      icon: Clock,
      title: "Stunden Zeit gespart",
      description: "Was Wochen Recherche dauern würde, erledigst du in 10 Minuten mit unserem Konfigurator.",
    },
    {
      icon: Sparkles,
      title: "Profi-Qualität",
      description: "Schaltpläne, die auch professionelle Elektriker beeindrucken und verstehen.",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-muted/30 to-background py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Side - Text */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Warum{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                PowerSetup
              </span>
              ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Entwickelt von Campern für Camper. Wir haben die Frustration selbst erlebt
              und eine Lösung gebaut, die wirklich funktioniert.
            </p>

            <div className="mt-8 space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                    <benefit.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Stats Card */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background p-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500">500+</div>
                  <div className="mt-1 text-sm text-muted-foreground">Schaltpläne erstellt</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500">98%</div>
                  <div className="mt-1 text-sm text-muted-foreground">Zufriedene Nutzer</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500">10min</div>
                  <div className="mt-1 text-sm text-muted-foreground">Durchschnittliche Zeit</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500">0€</div>
                  <div className="mt-1 text-sm text-muted-foreground">Kostenlos starten</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA Section
function CTASection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 md:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="relative text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Bereit für deinen Camper-Ausbau?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Starte jetzt kostenlos und erhalte in wenigen Minuten deinen professionellen Schaltplan.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base bg-white text-orange-600 hover:bg-white/90 shadow-xl border-0"
              >
                <Link href="/wizard?reset=true">
                  Jetzt kostenlos starten
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main Page Component
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection />
    </>
  );
}
