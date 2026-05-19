/* global React, Logo, Button, Chip, Icon, TopoBg, ProductIllo, Stat, ProgressRing */
// Result page — the "reveal moment". Desktop hi-fi, dense but breathable.

function ResultPage() {
  return (
    <div style={{ width: '100%', background: 'var(--bg-1)', color: 'var(--fg-1)', fontFamily: 'var(--font-body)' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Logo size={24} />
          <div style={{ width: 1, height: 22, background: 'var(--border-1)' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>
            Setup · <span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>PS-24X8F1</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button variant="ghost" size="sm" icon="share">Teilen</Button>
          <Button variant="ghost" size="sm" icon="edit">Anpassen</Button>
          <Button size="sm" icon="download">PDF herunterladen</Button>
        </div>
      </div>

      {/* Hero reveal */}
      <div style={{ position: 'relative', padding: '72px 56px 48px', overflow: 'hidden' }}>
        <TopoBg opacity={0.5} />
        <div style={{ position: 'absolute', top: -40, right: -140, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.2), transparent 65%)', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
            <Chip tone="amber" icon="sparkle">Dein Bauplan · fertig</Chip>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Berechnet für: VW T6.1 California · 3 Tage autark · Mitteleuropa</div>
          </div>
          <h1 style={{ fontSize: 64, lineHeight: 0.98, letterSpacing: '-0.03em', fontWeight: 700, marginBottom: 16, maxWidth: 900 }}>
            Dein Setup ist reif für{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--amber-500)' }}>3 Tage autark</span>,<br />
            sogar bei bedecktem Himmel.
          </h1>
          <p style={{ fontSize: 17.5, color: 'var(--fg-2)', maxWidth: 720, lineHeight: 1.5, marginBottom: 40 }}>
            Zusammengestellt aus <b>6 Komponenten</b> — herstellerunabhängig, mit realistischen Preisen von drei Händlern verglichen. Alles passt zusammen, alle Kabelquerschnitte sind durchgerechnet.
          </p>

          {/* key stats band */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 16, boxShadow: '0 2px 8px -2px rgba(52,44,27,0.08)', overflow: 'hidden' }}>
            {[
              { l: 'Batteriekapazität', v: '200', u: 'Ah · LiFePO4', s: '≈ 2.56 kWh' },
              { l: 'Solar-Leistung', v: '240', u: 'Wp', s: '2× 120W · Dach' },
              { l: 'Wechselrichter', v: '2000', u: 'W · reine Sinus', s: 'Victron Phoenix' },
              { l: 'Tagesverbrauch', v: '612', u: 'Wh/Tag', s: '6 Verbraucher' },
              { l: 'Gesamtpreis', v: '€ 2.847', u: 'inkl. MwSt.', s: '+ Einbau € 1.400' },
            ].map((x, i) => (
              <div key={i} style={{ padding: '22px 24px', borderLeft: i > 0 ? '1px solid var(--border-1)' : 'none' }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 8 }}>{x.l}</div>
                <div style={{ display: 'baseline', display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600, color: 'var(--charcoal-600)', letterSpacing: '-0.02em', lineHeight: 1 }}>{x.v}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{x.u}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{x.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Autonomie-Balken */}
      <div style={{ padding: '48px 56px', background: 'var(--charcoal-600)', color: 'var(--sand-50)', position: 'relative', overflow: 'hidden' }}>
        <TopoBg opacity={0.12} tint />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--amber-300)', marginBottom: 14 }}>Autonomie-Simulation</div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12, color: 'var(--sand-50)' }}>
              3 Tage ohne Sonne, ohne Landstrom — und du bist noch bei 41 % SOC.
            </div>
            <div style={{ fontSize: 14, color: 'var(--sand-300)', lineHeight: 1.55, maxWidth: 520 }}>
              Wir simulieren den worst case: deine 6 Verbraucher laufen wie geplant, die Sonne scheint nicht. Die Reserve zeigt, wieviel Puffer dir bleibt.
            </div>
          </div>

          {/* bar viz */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { d: 'Tag 1', start: 100, end: 76 },
                { d: 'Tag 2', start: 76, end: 52 },
                { d: 'Tag 3', start: 52, end: 28 },
                { d: 'Puffer', start: 28, end: 5, note: 'Tiefentladung-Schutz ab 20%' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, fontSize: 11.5, color: 'var(--sand-300)', fontFamily: 'var(--font-mono)' }}>{r.d}</div>
                  <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.06)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${100 - r.start}%`, width: `${r.start - r.end}%`, background: r.end < 20 ? 'var(--rust-500)' : r.end < 40 ? 'var(--amber-400)' : 'var(--forest-500)', borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 54, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--amber-300)' }}>{r.end}%</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: 11.5, color: 'var(--sand-300)' }}>
              Reserve von <span style={{ color: 'var(--amber-300)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+41%</span> über dem Ziel — du kannst also auch einen 4. Tag einplanen.
            </div>
          </div>
        </div>
      </div>

      {/* Stückliste */}
      <div style={{ padding: '64px 56px', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--amber-600)', marginBottom: 10 }}>Stückliste · 6 Komponenten</div>
              <h2 style={{ fontSize: 36, letterSpacing: '-0.025em' }}>Deine Komponenten.</h2>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="sm" icon="refresh">Alternative Marken</Button>
              <Button variant="secondary" size="sm" icon="edit">Anpassen</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              { k: 'battery', t: 'Batterie', n: 'BattEnergy 200Ah LiFePO4', s: 'BT-200LI · inkl. Bluetooth-BMS', p: '€ 849', alt: '3 Alternativen', primary: true },
              { k: 'solar', t: 'Solarmodule', n: '2× Victron 120W mono', s: 'SPM041201200 · schwarz', p: '€ 318', alt: '5 Alternativen' },
              { k: 'mppt', t: 'Solar-Laderegler', n: 'Victron SmartSolar 100/30', s: 'MPPT · Bluetooth', p: '€ 235', alt: '2 Alternativen' },
              { k: 'inverter', t: 'Wechselrichter', n: 'Victron Phoenix 12/2000', s: 'Reine Sinus · 2000 VA', p: '€ 684', alt: '3 Alternativen' },
              { k: 'booster', t: 'Ladebooster (B2B)', n: 'Victron Orion-Tr Smart 12/12-30', s: 'Isoliert · 30A', p: '€ 329', alt: '2 Alternativen' },
              { k: 'monitor', t: 'Batteriewächter', n: 'Victron BMV-712 Smart', s: '600A Shunt · Bluetooth', p: '€ 189', alt: 'Keine' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'var(--bg-2)', border: `1px solid ${c.primary ? 'var(--amber-300)' : 'var(--border-1)'}`, borderRadius: 14, padding: 20, position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
                {c.primary && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, color: 'var(--amber-700)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em' }}>HERZSTÜCK</div>}
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <ProductIllo kind={c.k} size={76} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{c.t}</div>
                    <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em', marginTop: 3, lineHeight: 1.25 }}>{c.n}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 3 }}>{c.s}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px dashed var(--border-1)' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="refresh" size={11} /> {c.alt}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--charcoal-600)' }}>{c.p}</div>
                </div>
              </div>
            ))}
          </div>

          {/* kabel + kleinteile */}
          <div style={{ marginTop: 20, padding: 22, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 14, display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 20, alignItems: 'center' }}>
            <ProductIllo kind="cables" size={90} />
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Kabel &amp; Kleinteile</div>
              <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 2 }}>Paket: 35mm² Hauptstrang · 10mm² Solar · 200A MEGA-Sicherung · Terminals · Schrumpfschlauch</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--fg-2)' }}>
                <span>Batterie ↔ Inverter: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>35mm² · 1.8m</span></span>
                <span>Batterie ↔ Booster: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>16mm² · 3m</span></span>
                <span>Solar ↔ MPPT: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>6mm² · 2× 4m</span></span>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--charcoal-600)' }}>€ 243</div>
          </div>
        </div>
      </div>

      {/* Schaltplan teaser */}
      <div style={{ padding: '64px 56px 88px', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 18, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* preview blurred */}
          <div style={{ padding: 36, background: 'var(--sand-50)', borderRight: '1px solid var(--border-1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ filter: 'blur(3px) grayscale(20%)', opacity: 0.7 }}>
              <svg viewBox="0 0 400 300" style={{ width: '100%', height: 280 }}>
                <rect x="10" y="10" width="380" height="280" fill="none" stroke="var(--charcoal-300)" strokeWidth="1" strokeDasharray="4 4" rx="4" />
                {/* batt */}
                <rect x="40" y="120" width="80" height="55" rx="4" fill="var(--bg-2)" stroke="var(--charcoal-400)" strokeWidth="1.4" />
                <text x="80" y="140" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--charcoal-500)">BATT</text>
                <text x="80" y="155" textAnchor="middle" fontSize="8" fontFamily="JetBrains Mono" fill="var(--charcoal-400)">200Ah</text>
                {/* solar */}
                <rect x="40" y="30" width="80" height="50" rx="4" fill="var(--bg-2)" stroke="var(--charcoal-400)" strokeWidth="1.4" />
                <text x="80" y="55" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--charcoal-500)">SOLAR</text>
                <text x="80" y="68" textAnchor="middle" fontSize="8" fontFamily="JetBrains Mono" fill="var(--charcoal-400)">240Wp</text>
                {/* mppt */}
                <rect x="160" y="30" width="80" height="50" rx="4" fill="var(--bg-2)" stroke="var(--charcoal-400)" strokeWidth="1.4" />
                <text x="200" y="55" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--charcoal-500)">MPPT</text>
                {/* inverter */}
                <rect x="280" y="120" width="80" height="55" rx="4" fill="var(--bg-2)" stroke="var(--charcoal-400)" strokeWidth="1.4" />
                <text x="320" y="140" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--charcoal-500)">INV 2kW</text>
                {/* booster */}
                <rect x="160" y="210" width="80" height="50" rx="4" fill="var(--bg-2)" stroke="var(--charcoal-400)" strokeWidth="1.4" />
                <text x="200" y="235" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--charcoal-500)">BOOSTER</text>
                {/* lines */}
                <path d="M120 145 L160 145 L160 55 M160 145 L280 145 M120 55 L160 55 M200 80 L200 120 M80 175 L80 235 L160 235" fill="none" stroke="var(--rust-500)" strokeWidth="2" />
                {/* fuse */}
                <circle cx="140" cy="145" r="5" fill="var(--amber-400)" stroke="var(--charcoal-500)" strokeWidth="1" />
                <circle cx="260" cy="145" r="5" fill="var(--amber-400)" stroke="var(--charcoal-500)" strokeWidth="1" />
              </svg>
            </div>
            {/* lock overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, rgba(251,250,247,0.2), rgba(251,250,247,0.85))' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--charcoal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px -8px rgba(52,44,27,0.3)' }}>
                <Icon name="lock" size={26} stroke="var(--amber-400)" />
              </div>
            </div>
          </div>

          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="eyebrow" style={{ color: 'var(--amber-600)', marginBottom: 12 }}>Premium · einmalig € 19</div>
            <h3 style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12, fontWeight: 600 }}>Schaltplan &amp; Verkabelungs-PDF freischalten.</h3>
            <p style={{ fontSize: 14.5, color: 'var(--fg-2)', lineHeight: 1.55, marginBottom: 24 }}>
              Der komplette Schaltplan mit Kabellängen, Sicherungsgrößen, Anschlusspunkten und Montage-Hinweisen. Wenn du selbst baust: unentbehrlich. Wenn eine Werkstatt baut: spart dir Stunden Abstimmung.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['20-seitiges PDF, druckbar auf A3', 'Kabelquerschnitte nach DIN für jeden Strang', 'Sicherungs- und Trennerpositionen', '3D-Einbauplan für dein Modell', 'Lifetime-Updates, wenn du umbaust'].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
                  <Icon name="check" size={16} stroke="var(--forest-500)" strokeWidth={2.5} />
                  <span>{x}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button size="lg" icon="unlock">Jetzt freischalten · € 19</Button>
              <Button size="lg" variant="ghost">Vorschau ansehen</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ResultPage = ResultPage;
