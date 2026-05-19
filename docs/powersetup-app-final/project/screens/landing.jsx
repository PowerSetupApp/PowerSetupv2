/* global React, Logo, Button, Chip, Icon, TopoBg, ProductIllo, Stat */
// Landing page — tall artboard showing hero, problem, how-it-works, proof, CTA.
// German copy. Warm sand bg, amber accent, topo texture.

function LandingPage() {
  return (
    <div style={{ width: '100%', background: 'var(--bg-1)', color: 'var(--fg-1)', fontFamily: 'var(--font-body)' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 56px', borderBottom: '1px solid var(--border-1)' }}>
        <Logo />
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {['So funktioniert\'s', 'Produkte', 'Werkstätten', 'Ratgeber'].map(x => (
            <div key={x} style={{ fontSize: 13.5, color: 'var(--fg-2)', fontWeight: 500 }}>{x}</div>
          ))}
          <Button variant="ghost" size="sm">Einloggen</Button>
          <Button size="sm" iconRight="arrow">Konfigurator starten</Button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', padding: '120px 56px 100px', overflow: 'hidden' }}>
        <TopoBg opacity={0.6} />
        <div style={{ position: 'absolute', top: 60, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.22), transparent 65%)', filter: 'blur(30px)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border-1)', marginBottom: 24 }}>
              <div style={{ padding: '3px 8px', background: 'var(--amber-400)', color: 'var(--charcoal-700)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 999, fontFamily: 'var(--font-display)' }}>NEU</div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>Jetzt inkl. Werkstatt-Vermittlung in DACH</div>
            </div>
            <h1 style={{ fontSize: 76, lineHeight: 0.98, letterSpacing: '-0.03em', fontWeight: 700, marginBottom: 28 }}>
              Die Stromanlage<br />für deinen Van.<br />
              <span style={{ color: 'var(--amber-500)', fontStyle: 'italic', fontWeight: 500 }}>In 5 Minuten geplant.</span>
            </h1>
            <p style={{ fontSize: 18.5, lineHeight: 1.55, color: 'var(--fg-2)', maxWidth: 540, marginBottom: 36 }}>
              Sag uns, was du fährst und was du anschließen willst.
              Wir geben dir den passenden Bauplan — Batterie, Solar, Wechselrichter, Kabel — und verbinden dich mit einer Werkstatt in der Nähe.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button size="lg" iconRight="arrow">Konfigurator starten · kostenlos</Button>
              <Button size="lg" variant="ghost" icon="globe">So funktioniert's</Button>
            </div>
            <div style={{ marginTop: 40, display: 'flex', gap: 28, color: 'var(--fg-3)', fontSize: 12.5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={13} stroke="var(--forest-500)" /> Keine Anmeldung</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={13} stroke="var(--forest-500)" /> Herstellerunabhängig</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={13} stroke="var(--forest-500)" /> Ergebnis als PDF</span>
            </div>
          </div>

          {/* Hero visual — stylised build summary card */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, left: -20, right: 20, bottom: 20, background: 'var(--charcoal-600)', borderRadius: 20, transform: 'rotate(-1.2deg)' }} />
            <div style={{ position: 'relative', background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 20, padding: 28, boxShadow: '0 24px 60px -20px rgba(52,44,27,0.28)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Dein Setup · Beispiel</div>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 4, letterSpacing: '-0.01em' }}>VW T6.1 · Wochenend-Tour</div>
                </div>
                <Chip tone="forest" icon="check">Autark · 3 Tage</Chip>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
                {[
                  { k: 'battery', l: 'Batterie', v: '200Ah LiFePO4' },
                  { k: 'solar', l: 'Solar', v: '2× 120W' },
                  { k: 'inverter', l: 'Wechselrichter', v: '2000W reine Sinus' },
                  { k: 'booster', l: 'Ladebooster', v: '30A · B2B' },
                ].map(x => (
                  <div key={x.k} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 10 }}>
                    <ProductIllo kind={x.k} size={54} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{x.l}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>{x.v}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 0', borderTop: '1px solid var(--border-1)' }}>
                <Stat label="Gesamtpreis" value="€ 2.847" tone="default" size="sm" />
                <Stat label="Tagesverbrauch" value="612" unit="Wh" size="sm" />
                <Stat label="Reserve" value="+41" unit="%" tone="forest" size="sm" />
              </div>
            </div>
            {/* Floating sparkle badge */}
            <div style={{ position: 'absolute', top: -22, right: -10, background: 'var(--amber-400)', color: 'var(--charcoal-700)', padding: '10px 14px', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, transform: 'rotate(4deg)', boxShadow: '0 8px 20px -4px rgba(122,68,2,0.35)' }}>
              <Icon name="sparkle" size={14} /> Live kalkuliert
            </div>
          </div>
        </div>
      </div>

      {/* Trust band */}
      <div style={{ padding: '28px 56px', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Kompatibel mit</div>
          {['Victron', 'BattEnergy', 'Renogy', 'EcoFlow', 'Büttner', 'Offgridtec'].map(b => (
            <div key={b} style={{ fontSize: 17, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sand-500)', letterSpacing: '-0.01em' }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Problem → Solution */}
      <div style={{ padding: '110px 56px', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', marginBottom: 64 }}>
          <div className="eyebrow" style={{ color: 'var(--amber-600)', marginBottom: 14 }}>Das Problem</div>
          <h2 style={{ fontSize: 56, lineHeight: 1, letterSpacing: '-0.025em', maxWidth: 900, margin: '0 auto' }}>
            Eine Van-Elektrik zu planen ist <span style={{ fontStyle: 'italic', color: 'var(--rust-500)', fontWeight: 500 }}>der Horror.</span>
          </h2>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 16, padding: 36, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rust-500)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 16 }}>Heute</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['14 Foren-Threads zu "welche Batterie?"', '3 Excel-Sheets mit Watt-Berechnungen', '2 YouTube-Tutorials die sich widersprechen', 'Ein Händler der dir das Teuerste verkauft', 'Keine Ahnung ob alles zusammenpasst'].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--rust-50)', color: 'var(--rust-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>×</div>
                  <div style={{ fontSize: 15, color: 'var(--fg-1)', lineHeight: 1.45 }}>{x}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed var(--border-1)', fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic' }}>
              ≈ 12–20 Stunden recherche, und am Ende baust du trotzdem dreimal um.
            </div>
          </div>

          <div style={{ background: 'var(--charcoal-600)', color: 'var(--sand-50)', borderRadius: 16, padding: 36, position: 'relative', overflow: 'hidden' }}>
            <TopoBg opacity={0.18} tint />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber-300)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 16 }}>Mit PowerSetup</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['8 Fragen zu deinem Fahrzeug & Leben', 'Live-Berechnung nach Verbrauchsprofil', 'Ein Bauplan, herstellerunabhängig', 'PDF mit Stückliste, Kabeln, Diagramm', 'Werkstatt in deiner Nähe — oder Selbstbau'].map((x, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--amber-400)', color: 'var(--charcoal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="check" size={13} stroke="var(--charcoal-700)" strokeWidth={3} />
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.45 }}>{x}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: 13, color: 'var(--sand-300)', fontStyle: 'italic' }}>
                ≈ 5 Minuten. Und du weißt wirklich, was du brauchst.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works — 3 steps */}
      <div style={{ padding: '110px 56px', background: 'var(--bg-2)', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="eyebrow" style={{ color: 'var(--amber-600)', marginBottom: 14 }}>So geht's</div>
            <h2 style={{ fontSize: 56, lineHeight: 1, letterSpacing: '-0.025em' }}>Drei Schritte zum fertigen Plan.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
            {[
              { n: '01', t: 'Fahrzeug & Reiseprofil', d: 'Fahrzeugtyp, Dachfläche, Klima-Region, wie lange du autark sein willst. 4 Fragen, keine versteckten Felder.', icon: 'van' },
              { n: '02', t: 'Deine Verbraucher', d: 'Kühlschrank, Laptop, Heizung — aus einer kuratierten Liste. Wir berechnen Wh/Tag automatisch.', icon: 'bolt' },
              { n: '03', t: 'Dein Bauplan', d: 'Batteriegröße, Solarmodule, Wechselrichter, Kabelquerschnitte, Preise. PDF zum Download.', icon: 'layers' },
            ].map((s, i) => (
              <div key={s.n} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 52, color: 'var(--amber-400)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ height: 1, flex: 1, background: 'var(--border-1)' }} />
                  <Icon name={s.icon} size={28} stroke="var(--charcoal-400)" />
                </div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 10 }}>{s.t}</div>
                <div style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.55 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Big outcome callout */}
      <div style={{ padding: '120px 56px', position: 'relative', overflow: 'hidden', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--amber-600)', marginBottom: 20 }}>Das Ergebnis</div>
          <h2 style={{ fontSize: 68, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 28 }}>
            Ein Bauplan, der wirklich <span style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--amber-500)' }}>funktioniert</span>.
          </h2>
          <p style={{ fontSize: 19, color: 'var(--fg-2)', maxWidth: 720, margin: '0 auto 48px', lineHeight: 1.5 }}>
            Keine Abos. Kein Account nötig. Einmal durchklicken — fertig ist dein Bauplan mit Stückliste, Kabelquerschnitten, Schaltplan und Werkstatt-Empfehlung.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {[
              { n: '14.800+', l: 'Setups geplant' },
              { n: '380', l: 'Werkstätten DACH' },
              { n: '4.9★', l: 'Aus 2.100 Bewertungen' },
              { n: '5 Min', l: 'Ø Dauer' },
            ].map(x => (
              <div key={x.l} style={{ padding: '22px 14px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--charcoal-600)', letterSpacing: '-0.02em' }}>{x.n}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ padding: '80px 56px 100px', background: 'var(--charcoal-600)', color: 'var(--sand-50)', position: 'relative', overflow: 'hidden' }}>
        <TopoBg opacity={0.15} tint />
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
          <div>
            <h2 style={{ fontSize: 44, letterSpacing: '-0.025em', lineHeight: 1.05, color: 'var(--sand-50)', maxWidth: 560 }}>
              Bereit? Der Konfigurator wartet.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--sand-300)', marginTop: 14, maxWidth: 500 }}>
              Fünf Minuten. Kein Account. Du bekommst sofort den Plan.
            </p>
          </div>
          <Button size="lg" iconRight="arrow">Jetzt konfigurieren</Button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '40px 56px 32px', background: 'var(--charcoal-700)', color: 'var(--sand-300)', fontSize: 12.5 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <Logo size={22} color="var(--sand-50)" accent="var(--amber-300)" />
          <div style={{ display: 'flex', gap: 28 }}>
            {['Impressum', 'Datenschutz', 'AGB', 'Kontakt', 'Für Werkstätten'].map(x => <div key={x} style={{ color: 'var(--sand-300)' }}>{x}</div>)}
          </div>
          <div>© 2026 PowerSetup GmbH</div>
        </div>
      </div>
    </div>
  );
}

window.LandingPage = LandingPage;
