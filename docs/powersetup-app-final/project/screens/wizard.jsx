/* global React, Logo, Button, Chip, Icon, TopoBg, ProductIllo, Input, Checkbox, ProgressRing, Stat */
// Wizard — 8 steps matching the PowerSetup spec:
// 1 Basis · 2 Energie · 3 Verbraucher · 4 Reise · 5 Autarkie · 6 Kabel · 7 Marken · 8 Check (Übersicht)

const WIZARD_STEPS = [
  { k: 'Basis',        title: 'System-Basis',         subtitle: 'Bordnetz, Fahrzeugspannung und Batterie-Chemie — die Grundlage für alles Weitere.' },
  { k: 'Energie',      title: 'Energiequellen & Dach', subtitle: 'Woher kommt der Strom? Bei Solar definierst du die verfügbaren Dachflächen.' },
  { k: 'Verbraucher',  title: 'Was willst du anschließen?', subtitle: 'Klick zusammen was an Bord kommt. Wir haben typische Werte hinterlegt, du kannst sie feintunen.' },
  { k: 'Reise',        title: 'Dein Reiseprofil',     subtitle: 'Wochenend-Setup oder 4 Monate Vanlife — das verändert die Dimensionierung fundamental.' },
  { k: 'Autarkie',     title: 'Wie viele Tage off-grid?', subtitle: 'Weiche Autarkie: Solar und Lichtmaschine speisen weiter, die Batterie überbrückt schlechtes Wetter.' },
  { k: 'Kabel',        title: 'Kabelwege & Platzierung', subtitle: 'Ungefähre Entfernungen für die Hauptstrecken — das bestimmt den Kabelquerschnitt.' },
  { k: 'Marken',       title: 'Markenpräferenz (optional)', subtitle: 'Leer lassen = wir suchen markenunabhängig das beste Preis-Leistungs-Verhältnis.' },
  { k: 'Check',        title: 'Übersicht & Feinjustierung', subtitle: 'Prüfe dein Setup. Passe Solar vs. Batterie-Fokus an und ergänze bei Bedarf Solartaschen.' },
];

function WizardShell({ step, total = 8, title, subtitle, children, rightRail, nextLabel = 'Weiter', backLabel = 'Zurück', primaryDisabled = false }) {
  const pct = (step / total) * 100;
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', color: 'var(--fg-1)' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-2)' }}>
        <Logo size={24} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>
            Schritt <span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{String(step).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
            <span style={{ marginLeft: 10, color: 'var(--amber-600)', fontWeight: 600 }}>· {WIZARD_STEPS[step - 1].k}</span>
          </div>
          <Button variant="ghost" size="sm" icon="download">Fortschritt speichern</Button>
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height: 3, background: 'var(--sand-100)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${pct}%`, background: 'var(--amber-400)', transition: 'width 400ms var(--ease-out)' }} />
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: rightRail ? '1fr 340px' : '1fr', overflow: 'hidden' }}>
        <div style={{ padding: '44px 56px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--amber-500)', fontWeight: 600 }}>{String(step).padStart(2, '0')}</div>
            <div style={{ height: 1, flex: 0, width: 40, background: 'var(--amber-300)' }} />
          </div>
          <h1 style={{ fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.025em', fontWeight: 600, marginBottom: 10 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 15.5, color: 'var(--fg-2)', maxWidth: 640, lineHeight: 1.5, marginBottom: 32 }}>{subtitle}</div>}
          <div style={{ flex: 1 }}>{children}</div>

          {/* footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginTop: 24, borderTop: '1px solid var(--border-1)' }}>
            <Button variant="ghost" icon="chevronLeft">{backLabel}</Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>↵ Enter zum Fortfahren</div>
              <Button iconRight="arrow" disabled={primaryDisabled}>{nextLabel}</Button>
            </div>
          </div>
        </div>

        {rightRail && (
          <div style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border-1)', padding: '44px 28px', overflow: 'auto' }}>
            {rightRail}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right rail — live calculation summary ─────────────────────────────
function LiveSummary({ step }) {
  const rows = [
    { l: 'Fahrzeug',        v: step >= 1 ? 'VW T6.1 California' : '—',     done: step >= 1 },
    { l: 'System · Chemie', v: step >= 1 ? '12 V · LiFePO₄'       : '—',    done: step >= 1 },
    { l: 'Energiequellen',  v: step >= 2 ? 'Solar · Lichtmasch.' : '—',    done: step >= 2 },
    { l: 'Dachfläche',      v: step >= 2 ? '2,2 m² · 2 Flächen'  : '—',    done: step >= 2 },
    { l: 'Verbraucher',     v: step >= 3 ? '6 Geräte · 612 Wh/T' : '—',    done: step >= 3 },
    { l: 'Reisestil',       v: step >= 4 ? 'Urlaub · autark'     : '—',    done: step >= 4 },
    { l: 'Autarkie',        v: step >= 5 ? '3 Tage'              : '—',    done: step >= 5 },
    { l: 'Kabel',           v: step >= 6 ? '7 Strecken berechnet': '—',    done: step >= 6 },
  ];
  return (
    <div>
      <div className="eyebrow" style={{ color: 'var(--amber-600)', marginBottom: 14 }}>Dein Setup · Live</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
        {rows.map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px dashed var(--border-1)', fontSize: 13, color: r.done ? 'var(--fg-1)' : 'var(--fg-3)', gap: 10 }}>
            <div style={{ color: 'var(--fg-3)', flexShrink: 0 }}>{r.l}</div>
            <div style={{ fontWeight: r.done ? 600 : 400, fontFamily: r.done ? 'var(--font-display)' : 'inherit', textAlign: 'right' }}>{r.v}</div>
          </div>
        ))}
      </div>

      {step >= 3 && (
        <div style={{ background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--fg-3)' }}>Vorläufige Empfehlung</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Batterie</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>≈ 200 Ah</div>
            </div>
            <ProgressRing value={68} size={40} stroke={4} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)' }}>
            <span>Solar: <span style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>240 Wp</span></span>
            <span>Inverter: <span style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>2000 W</span></span>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.55 }}>
        Alle Angaben werden live berechnet und verändern sich, während du klickst. Kein Account nötig.
      </div>
    </div>
  );
}

// Small helpers used by multiple steps
function CardGrid({ cols = 3, children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>;
}
function OptionCard({ icon, title, sub, selected }) {
  return (
    <div style={{ padding: 18, background: selected ? 'var(--amber-50)' : 'var(--bg-2)', border: `1.5px solid ${selected ? 'var(--amber-400)' : 'var(--border-1)'}`, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 160ms var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        {icon && <Icon name={icon} size={24} stroke={selected ? 'var(--amber-600)' : 'var(--charcoal-400)'} />}
        {selected && (
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--amber-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={12} stroke="var(--charcoal-700)" strokeWidth={3} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 3 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}
function SectionLabel({ children, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--fg-2)' }}>{children}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Step 1 · Basis ───────────────────────────────────────────────────
// Fahrzeugname (Freitext, nur für Anzeige) + Systemspannung + Fahrzeugspannung + Batterietyp
function Step1Basis() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Vehicle name — free text, display-only */}
      <div>
        <SectionLabel sub="Nur für die Anzeige auf deinem Bauplan — fließt nicht in die Berechnung ein.">Wie nennst du dein Fahrzeug?</SectionLabel>
        <Input label="Fahrzeugname" value="VW T6.1 California" placeholder="z. B. Sprinter 2021, Willy der Kastenwagen…" style={{ maxWidth: 440 }} />
      </div>

      {/* System voltage (Bordbatterie) */}
      <div>
        <SectionLabel sub="Die Spannung deiner Haus-/Servicebatterie. 12 V ist Standard; 24 V / 48 V für große Setups mit dünneren Kabeln.">
          A · Systemspannung (Bordbatterie)
        </SectionLabel>
        <CardGrid cols={3}>
          <OptionCard icon="battery" title="12 V" sub="Standard für Van & Wohnmobil. Riesige Komponenten-Auswahl." selected />
          <OptionCard icon="battery" title="24 V" sub="Größere Setups. Halbierte Ströme, weniger Kabelverluste." />
          <OptionCard icon="battery" title="48 V" sub="Nur bei > 5 kW Dauerlast. Noch Nischen-Zubehör." />
        </CardGrid>
      </div>

      {/* Vehicle voltage */}
      <div>
        <SectionLabel sub="Die Spannung deiner Starterbatterie / Lichtmaschine. Bei den meisten PKW und Kastenwagen 12 V, bei LKW-basierten Wohnmobilen oft 24 V.">
          B · Fahrzeugspannung (Lichtmaschine)
        </SectionLabel>
        <CardGrid cols={3}>
          <OptionCard icon="car" title="12 V" sub="PKW, die meisten Kastenwagen & Wohnmobile." selected />
          <OptionCard icon="van" title="24 V" sub="LKW-basiert (Iveco Daily, MAN TGE, ältere Sprinter)." />
          <OptionCard icon="car" title="48 V" sub="Mild-Hybrid-Fahrzeuge. Selten." />
        </CardGrid>
      </div>

      {/* Battery chemistry */}
      <div>
        <SectionLabel sub="Bestimmt Kapazität, Gewicht, Ladeverfahren und Preis.">
          C · Batterietyp (Chemie)
        </SectionLabel>
        <CardGrid cols={3}>
          <OptionCard icon="battery" title="LiFePO₄" sub="Leicht, 80% nutzbar, 3000+ Zyklen. Empfohlen." selected />
          <OptionCard icon="battery" title="AGM" sub="Günstig, schwer, nur ~50% nutzbar." />
          <OptionCard icon="battery" title="Gel" sub="Robust, wartungsfrei. Selten noch sinnvoll." />
        </CardGrid>
        <div style={{ marginTop: 14, padding: 14, background: 'var(--forest-50)', border: '1px solid var(--forest-100)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="check" size={16} stroke="var(--forest-500)" strokeWidth={2.5} />
          <div style={{ fontSize: 13, color: 'var(--forest-700)' }}>LiFePO₄ hält 3 000+ Zyklen — das sind 8–10 Jahre tägliche Vollzyklen.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 · Energie & Dachflächen ───────────────────────────────────
function Step2Energie() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Sources */}
      <div>
        <SectionLabel sub="Mehrfachauswahl. Mindestens eine Quelle ist nötig.">Welche Energiequellen hast du?</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Chip tone="amber" icon="solar" size="md" style={{ padding: '8px 14px' }}>Solar</Chip>
          <Chip tone="amber" icon="refresh" size="md" style={{ padding: '8px 14px' }}>Lichtmaschine / Booster</Chip>
          <Chip tone="neutral" icon="plug" size="md" style={{ padding: '8px 14px' }}>Landstrom (230 V)</Chip>
          <Chip tone="neutral" icon="wind" size="md" style={{ padding: '8px 14px' }}>Brennstoffzelle / Gen.</Chip>
        </div>
      </div>

      {/* Roof surfaces */}
      <div style={{ background: 'var(--sand-50)', border: '1px dashed var(--border-2)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <SectionLabel sub="Mehrere Flächen für Bereiche zwischen Dachfenster, Lüfter oder Aufstelldach — das rechnet realistischer.">Dachflächen für Solarmodule</SectionLabel>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Modul-Typ</div>
            <div style={{ display: 'inline-flex', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 6, padding: 2 }}>
              <div style={{ padding: '5px 12px', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, background: 'var(--amber-400)', color: 'var(--charcoal-700)', borderRadius: 4 }}>Starr</div>
              <div style={{ padding: '5px 12px', fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Flexibel</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: 'Dach vorne',  l: 180, b: 90, area: '1,62 m²' },
            { name: 'Dach hinten', l: 120, b: 80, area: '0,96 m²' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr 28px', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Fläche</div>
                <div style={{ fontSize: 13.5, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{s.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Länge</div>
                <div style={{ display: 'inline-flex', border: '1px solid var(--border-1)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--bg-2)', fontVariantNumeric: 'tabular-nums' }}>{s.l} <span style={{ color: 'var(--fg-3)', marginLeft: 3 }}>cm</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Breite</div>
                <div style={{ display: 'inline-flex', border: '1px solid var(--border-1)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--bg-2)', fontVariantNumeric: 'tabular-nums' }}>{s.b} <span style={{ color: 'var(--fg-3)', marginLeft: 3 }}>cm</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 3 }}>Netto</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--amber-700)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s.area}</div>
              </div>
              <button style={{ width: 28, height: 28, border: '1px solid var(--border-1)', borderRadius: 6, background: 'var(--bg-2)', color: 'var(--fg-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          <button style={{ padding: '11px 14px', border: '1px dashed var(--border-2)', borderRadius: 8, background: 'transparent', color: 'var(--fg-2)', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
            <Icon name="plus" size={14} /> Weitere Dachfläche
          </button>
        </div>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="sun" size={15} stroke="var(--amber-600)" />
          <div style={{ fontSize: 12.5, color: 'var(--amber-700)', lineHeight: 1.5 }}>
            Rechnerisch passen aus deinen <b>2,58 m²</b> netto ca. <b style={{ fontFamily: 'var(--font-mono)' }}>440 Wp</b> Solar aufs Dach — später im Check anpassbar.
          </div>
        </div>
      </div>

      {/* Alternator context */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--sand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="refresh" size={22} stroke="var(--charcoal-500)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 2 }}>Lichtmaschine als Ladequelle</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Wir rechnen mit einem DC-DC-Ladebooster. Dimensionierung im Schritt „Kabel".</div>
        </div>
        <Chip tone="forest" size="sm" icon="check">Aktiv</Chip>
      </div>
    </div>
  );
}

// ─── Step 3 · Verbraucher ─────────────────────────────────────────────
function Step3Verbraucher() {
  const cats = [
    { k: 'fridge', l: 'Kühlschrank',          cnt: 1, w: 420, sel: true },
    { k: 'light',  l: 'Innenbeleuchtung LED', cnt: 6, w: 72,  sel: true },
    { k: 'water',  l: 'Wasserpumpe',          cnt: 1, w: 28,  sel: true },
    { k: 'laptop', l: 'Laptop',               cnt: 1, w: 65,  sel: true },
    { k: 'coffee', l: 'Kaffeemaschine',       cnt: 1, w: 35,  sel: true },
    { k: 'heater', l: 'Standheizung (Gebläse)',cnt: 1, w: 18, sel: true },
    { k: 'tv',     l: 'TV',                   cnt: 0, w: 0 },
    { k: 'coffee', l: 'Wasserkocher',         cnt: 0, w: 0 },
    { k: 'laptop', l: 'Handy laden',          cnt: 0, w: 0 },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32 }}>
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}>
            <Icon name="search" size={15} stroke="var(--fg-3)" />
            <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Verbraucher suchen…</div>
          </div>
          {['Alle', 'Küche', 'Komfort', 'Arbeit', 'Heizen', 'Sonstiges'].map((t, i) => (
            <Chip key={t} tone={i === 0 ? 'dark' : 'neutral'} size="md" style={{ cursor: 'pointer' }}>{t}</Chip>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {cats.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: c.sel ? 'var(--bg-2)' : 'var(--sand-50)', border: `1px solid ${c.sel ? 'var(--amber-300)' : 'var(--border-1)'}`, borderRadius: 10, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: c.sel ? 'var(--amber-100)' : 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={c.k} size={20} stroke={c.sel ? 'var(--amber-600)' : 'var(--fg-3)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontFamily: 'var(--font-display)', fontWeight: 600, color: c.sel ? 'var(--fg-1)' : 'var(--fg-2)' }}>{c.l}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{c.sel ? `${c.w} Wh/Tag` : 'Nicht ausgewählt'}</div>
              </div>
              {c.sel ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--sand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="minus" size={12} stroke="var(--fg-2)" />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, minWidth: 16, textAlign: 'center' }}>{c.cnt}</div>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--amber-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="plus" size={12} stroke="var(--charcoal-700)" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--sand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={12} stroke="var(--fg-2)" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--sand-50)', border: '1px dashed var(--border-2)', borderRadius: 10, fontSize: 12.5, color: 'var(--fg-2)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="plus" size={14} stroke="var(--fg-3)" />
          Eigenen Verbraucher anlegen (Leistung in W, Laufzeit h/Tag, Spannung)
        </div>
      </div>

      <div>
        <div style={{ position: 'sticky', top: 0, background: 'var(--charcoal-600)', color: 'var(--sand-50)', padding: 22, borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
          <TopoBg opacity={0.15} tint />
          <div style={{ position: 'relative' }}>
            <div className="eyebrow" style={{ color: 'var(--amber-300)', marginBottom: 12 }}>Tagesverbrauch</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 600, color: 'var(--amber-300)', letterSpacing: '-0.02em', lineHeight: 1 }}>612</div>
            <div style={{ fontSize: 12, color: 'var(--sand-300)', marginBottom: 20 }}>Wh pro Tag · hochgerechnet</div>

            <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 14 }}>
              {[35, 42, 88, 120, 65, 48, 30, 24, 20, 22, 50, 85, 92, 75, 60, 45, 58, 70, 62, 48, 40, 30, 25, 20].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--amber-400)', borderRadius: 1, opacity: i >= 18 || i < 6 ? 0.4 : 1 }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sand-300)', fontFamily: 'var(--font-mono)' }}>
              <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11.5, color: 'var(--sand-300)', lineHeight: 1.55 }}>
              Gleichzeitige 230 V-Last schätzen wir aus deiner Auswahl — dimensioniert den Wechselrichter.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 · Reise ───────────────────────────────────────────────────
function Step4Reise() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <SectionLabel>Wie reist du am häufigsten?</SectionLabel>
        <CardGrid cols={3}>
          <OptionCard title="Wochenende" sub="1–3 Tage, meist mit Landstrom in Reichweite" />
          <OptionCard title="Urlaub · autark" sub="1–2 Wochen, gern abseits von Stellplätzen" selected />
          <OptionCard title="Dauerbewohnt" sub="Monate unterwegs, Home-Office im Van" />
        </CardGrid>
      </div>

      <div>
        <SectionLabel sub="Ein ungenutzter Van verbraucht trotzdem Strom: Standheizung, Standby-Elektronik, Selbstentladung.">Wie oft steht dein Fahrzeug ungenutzt?</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { l: 'Täglich genutzt', pct: 10 },
            { l: 'Wochen-Pausen',   pct: 35, sel: true },
            { l: 'Mehrere Wochen',  pct: 65 },
            { l: 'Nur Saison',      pct: 90 },
          ].map((x, i) => (
            <div key={i} style={{ padding: 14, background: x.sel ? 'var(--amber-50)' : 'var(--bg-2)', border: `1.5px solid ${x.sel ? 'var(--amber-400)' : 'var(--border-1)'}`, borderRadius: 10 }}>
              <div style={{ fontSize: 13.5, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 8 }}>{x.l}</div>
              <div style={{ height: 4, background: 'var(--sand-100)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ width: `${x.pct}%`, height: '100%', background: x.sel ? 'var(--amber-400)' : 'var(--sand-300)' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{x.pct}% Standzeit</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel sub="Solar-Erträge und Heizenergie unterscheiden sich stark.">Wo reist du hauptsächlich?</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { l: 'Mitteleuropa', e: 'DE · AT · CH · BeNeLux',   h: '1 050 kWh/kWp', sel: true },
            { l: 'Südeuropa',    e: 'ES · IT · HR · GR · F-Süd', h: '1 480 kWh/kWp' },
            { l: 'Skandinavien', e: 'DK · SE · NO · FI',         h: '830 kWh/kWp' },
            { l: 'Weltreise',    e: 'Je nach Jahreszeit',        h: 'ganzjährig aktiv' },
          ].map((x, i) => (
            <div key={i} style={{ padding: '14px 16px', background: x.sel ? 'var(--amber-50)' : 'var(--bg-2)', border: `1.5px solid ${x.sel ? 'var(--amber-400)' : 'var(--border-1)'}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{x.l}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{x.e}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--amber-600)', fontWeight: 600 }}>{x.h}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Hauptreisezeit</SectionLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { l: 'Frühling', i: 'leaf' },
            { l: 'Sommer', i: 'sun', sel: true },
            { l: 'Herbst', i: 'leaf' },
            { l: 'Winter', i: 'snow' },
            { l: 'Ganzjährig', i: 'refresh', sel: true },
          ].map(x => (
            <Chip key={x.l} tone={x.sel ? 'amber' : 'neutral'} icon={x.i} size="md" style={{ cursor: 'pointer', padding: '8px 14px' }}>{x.l}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5 · Autarkie ────────────────────────────────────────────────
function Step5Autarkie() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ padding: 14, background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: 10, display: 'flex', gap: 10 }}>
        <Icon name="info" size={18} stroke="var(--amber-600)" />
        <div style={{ fontSize: 13, color: 'var(--amber-700)', lineHeight: 1.5 }}>
          Mit Solar + Lichtmaschine speist sich deine Anlage im Normalfall selbst — die Batterie überbrückt Regen- und Standphasen. Sinnvolles Max: <b>7 Tage</b>.
        </div>
      </div>

      <div>
        <SectionLabel>Wähle eine Voreinstellung</SectionLabel>
        <CardGrid cols={3}>
          <OptionCard icon="sun"  title="Kurz · 2 Tage"  sub="Für Sonnenregionen reicht das meist." />
          <OptionCard icon="leaf" title="Reise · 3–4 T." sub="Übliche Faustregel für Vanlife." selected />
          <OptionCard icon="snow" title="Lang · 7 Tage"  sub="Winter oder bewölkte Regionen." />
        </CardGrid>
      </div>

      <div style={{ padding: 22, background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Feinjustierung</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, color: 'var(--amber-600)' }}>3 Tage</div>
        </div>
        <div style={{ position: 'relative', height: 8, background: 'var(--sand-200)', borderRadius: 4, marginBottom: 10 }}>
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: '33%', background: 'var(--amber-400)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: -6, left: '33%', width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-2)', border: '3px solid var(--amber-400)', transform: 'translateX(-50%)', boxShadow: 'var(--shadow-sm)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
          <span>1 Tag</span><span>2</span><span>3</span><span>5</span><span>7 Tage (Max)</span>
        </div>
      </div>

      <div style={{ padding: 14, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.55 }}>
        PSH-Berechnung: <span style={{ fontFamily: 'var(--font-mono)' }}>Tagesbedarf × Tage + 25% Nachtanteil</span>. Cap bei > 7 Tagen, da ohne Quellen unrealistisch.
      </div>
    </div>
  );
}

// ─── Step 6 · Kabelwege ───────────────────────────────────────────────
function Step6Kabel() {
  const groups = [
    { t: 'Lichtmaschine / Ladebooster', i: 'refresh', rows: [['Starter → Servicebatterie', '4,2 m'], ['Booster → Servicebatterie', '1,8 m']] },
    { t: 'Solar',                       i: 'solar',   rows: [['Module → Laderegler', '3,0 m'], ['Laderegler → Servicebatterie', '1,2 m']] },
    { t: 'Verteilung',                  i: 'wire',    rows: [['Batterie → Sicherungskasten', '0,8 m'], ['Servicebatterie → Wechselrichter', '1,5 m']] },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map((g, i) => (
        <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'var(--sand-50)', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--sand-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={g.i} size={15} stroke="var(--charcoal-500)" />
            </div>
            <div style={{ fontSize: 13.5, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{g.t}</div>
          </div>
          <div style={{ padding: '6px 18px' }}>
            {g.rows.map(([label, m], j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: j === g.rows.length - 1 ? 'none' : '1px dashed var(--border-1)' }}>
                <div style={{ fontSize: 13 }}>{label}</div>
                <div style={{ display: 'inline-flex', border: '1px solid var(--border-1)', borderRadius: 6, padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--bg-2)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{m}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: 14, background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: 10, display: 'flex', gap: 10 }}>
        <Icon name="info" size={16} stroke="var(--amber-600)" />
        <div style={{ fontSize: 12.5, color: 'var(--amber-700)', lineHeight: 1.5 }}>
          Großzügig schätzen — 0,5 m Reserve ist besser als Neukauf. Wir rechnen realistische DIN-Querschnitte.
        </div>
      </div>
    </div>
  );
}

// ─── Step 7 · Marken (optional) ───────────────────────────────────────
function Step7Marken() {
  const fields = [
    { l: 'Solar',                 i: 'solar',   ph: 'z.B. Victron, Renogy, Offgridtec', val: 'Victron Energy' },
    { l: 'Batterie',              i: 'battery', ph: 'z.B. LiTime, EcoWorthy, Victron',  val: '' },
    { l: 'Lader / Booster',       i: 'bolt',    ph: 'z.B. Victron, CTEK, Sterling',     val: 'Victron Energy' },
    { l: 'Wechselrichter',        i: 'plug',    ph: 'z.B. Victron, Studer, Büttner',    val: '' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ padding: 14, background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 10, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55 }}>
        Optional. Leer lassen = wir suchen markenunabhängig die beste Kombination aus Preis, Verfügbarkeit und Tests.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.map((f, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={f.i} size={13} stroke="var(--fg-3)" /> {f.l}
            </div>
            <div style={{ padding: '11px 14px', border: `1px solid ${f.val ? 'var(--amber-300)' : 'var(--border-1)'}`, background: f.val ? 'var(--amber-50)' : 'var(--bg-2)', borderRadius: 8, fontSize: 13.5, fontFamily: 'var(--font-body)', color: f.val ? 'var(--fg-1)' : 'var(--fg-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {f.val || f.ph}
              {!f.val && <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>(leer = egal)</span>}
              {f.val && <Icon name="check" size={14} stroke="var(--amber-600)" strokeWidth={2.5} />}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 10, color: 'var(--fg-2)' }}>Schnellauswahl</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Victron Energy', 'BattEnergy', 'Renogy', 'Offgridtec', 'Büttner', 'EcoFlow', 'Keine Präferenz'].map((b, i) => (
            <Chip key={b} tone={i === 0 || i === 6 ? 'amber' : 'neutral'} size="md" icon={i < 6 ? 'check' : undefined} style={{ cursor: 'pointer', padding: '8px 14px' }}>{b}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 8 · Check (Übersicht + Solartaschen + Solar/Batterie-Fokus) ─
function Step8Check() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Hero summary */}
      <div style={{ padding: 22, background: 'var(--charcoal-600)', color: 'var(--sand-50)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
        <TopoBg opacity={0.14} tint />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--amber-300)', marginBottom: 10 }}>Dein Bauplan · fertig berechnet</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6 }}>
              <span style={{ color: 'var(--sand-50)' }}>VW T6.1 California</span><br />
              <span style={{ color: 'var(--amber-300)', fontStyle: 'italic', fontWeight: 500 }}>3 Tage autark · Mitteleuropa</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--sand-300)', marginTop: 12, lineHeight: 1.55 }}>
              6 Verbraucher · 612 Wh/Tag · LiFePO₄ 12 V · Solar + Lichtmaschine
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { l: 'Batterie',   v: '200 Ah', s: '2,56 kWh' },
              { l: 'Solar Dach', v: '440 Wp', s: '2 Module' },
              { l: 'Inverter',   v: '2000 W', s: 'Reinsinus' },
              { l: 'Booster',    v: '30 A',   s: 'DC-DC' },
            ].map((x, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sand-300)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{x.l}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--amber-300)', marginTop: 2 }}>{x.v}</div>
                <div style={{ fontSize: 11, color: 'var(--sand-300)', fontFamily: 'var(--font-mono)' }}>{x.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solar/Battery focus slider */}
      <div style={{ padding: 22, background: 'var(--bg-2)', border: '1.5px solid var(--amber-300)', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 14.5, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Fokus: Solar vs. Batterie</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2 }}>Gleiche Autarkie, anderes Mischverhältnis — mehr Dach oder mehr Speicher?</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>Mitte = ausgewogen</div>
        </div>

        <div style={{ position: 'relative', marginTop: 22, marginBottom: 10 }}>
          {/* track */}
          <div style={{ position: 'relative', height: 10, background: 'linear-gradient(90deg, var(--amber-200), var(--sand-200), var(--charcoal-200))', borderRadius: 5 }}>
            {/* active mid fill */}
            <div style={{ position: 'absolute', left: '40%', right: '50%', top: 0, bottom: 0, background: 'var(--amber-400)', borderRadius: 5 }} />
            {/* handle */}
            <div style={{ position: 'absolute', top: -7, left: '50%', width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-2)', border: '3px solid var(--amber-500)', transform: 'translateX(-50%)', boxShadow: 'var(--shadow-md)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--amber-600)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5 }}>Mehr Solar</div>
              <div>520 Wp · 160 Ah</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5 }}>Ausgewogen</div>
              <div>440 Wp · 200 Ah</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--charcoal-600)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12.5 }}>Mehr Batterie</div>
              <div>320 Wp · 280 Ah</div>
            </div>
          </div>
        </div>
      </div>

      {/* Solartaschen + 2 secondary blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div style={{ padding: 20, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Solartaschen (portabel)</div>
            <Chip tone="amber" size="xs">Solar-Shortfall bei Regen</Chip>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginBottom: 14 }}>Nur wenn die Dach-Solarleistung an grauen Tagen nicht reicht. Die Taschen legst du aufs Dach oder in die Sonne.</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--amber-50)', border: '1px solid var(--amber-300)', borderRadius: 999, fontSize: 12.5, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              <Icon name="solar" size={13} stroke="var(--amber-600)" /> 200 Wp Tasche
              <Icon name="trash" size={12} stroke="var(--fg-3)" style={{ marginLeft: 4, cursor: 'pointer' }} />
            </div>
            <button style={{ padding: '8px 12px', fontSize: 12.5, fontFamily: 'var(--font-display)', fontWeight: 600, border: '1px dashed var(--border-2)', background: 'transparent', borderRadius: 999, color: 'var(--fg-2)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Icon name="plus" size={12} /> Weitere Tasche
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { w: '100 Wp', p: '€ 180', s: 'Einstieg' },
              { w: '200 Wp', p: '€ 320', s: 'Empfohlen', sel: true },
              { w: '400 Wp', p: '€ 560', s: 'Max Leistung' },
            ].map((t, i) => (
              <div key={i} style={{ padding: 12, background: t.sel ? 'var(--amber-50)' : 'var(--bg-2)', border: `1.5px solid ${t.sel ? 'var(--amber-400)' : 'var(--border-1)'}`, borderRadius: 8, cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: t.sel ? 'var(--amber-700)' : 'var(--fg-1)' }}>{t.w}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{t.s}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', marginTop: 4, fontWeight: 600 }}>{t.p}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 20, background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 14 }}>Konfiguration im Überblick</div>
          {[
            ['Systemspannung', '12 V'],
            ['Fahrzeugspannung', '12 V'],
            ['Batterietyp', 'LiFePO₄'],
            ['Energiequellen', 'Solar · LM'],
            ['Dachflächen', '2 · 2,58 m²'],
            ['Autarkie', '3 Tage'],
            ['Reiseprofil', 'Urlaub · autark'],
            ['Hauptregion', 'Mitteleuropa'],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12.5, borderBottom: i === 7 ? 'none' : '1px dashed var(--border-1)' }}>
              <span style={{ color: 'var(--fg-3)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview grid */}
      <div style={{ border: '1px solid var(--border-1)', background: 'var(--bg-2)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="eyebrow" style={{ color: 'var(--amber-600)' }}>Berechnete Komponenten · Vorschau</div>
          <Chip tone="forest" size="sm" icon="check">Alles dimensioniert</Chip>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            ['Batterie', '200 Ah', 'LiFePO₄ 12V'],
            ['Solar Dach', '440 Wp', '2 × 220W starr'],
            ['Solar Tasche', '200 Wp', 'portabel'],
            ['Laderegler', 'MPPT 50A', '15 A Reserve'],
            ['Wechselrichter', '2000 W', 'Reinsinus'],
            ['DC-DC Booster', '30 A', 'Lichtmaschine'],
            ['Landstrom-Lader', '30 A', 'optional'],
            ['Kabel gesamt', '~ 24 m', 'DIN-Querschnitte'],
          ].map(([l, v, s], i) => (
            <div key={i} style={{ padding: 12, background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{l}</div>
              <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 2 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, background: 'var(--forest-50)', border: '1px solid var(--forest-100)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--forest-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={17} stroke="var(--sand-50)" strokeWidth={3} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--forest-700)' }}>Bereit zum Ergebnis</div>
          <div style={{ fontSize: 12.5, color: 'var(--forest-700)' }}>Klick auf „Ergebnis anzeigen" — der komplette Bauplan samt Stückliste und Kabelquerschnitten.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Frame exports ─────────────────────────────────────────────────────
function WizardFrame({ step = 1 }) {
  const meta = WIZARD_STEPS[step - 1];
  const contents = {
    1: <Step1Basis />,
    2: <Step2Energie />,
    3: <Step3Verbraucher />,
    4: <Step4Reise />,
    5: <Step5Autarkie />,
    6: <Step6Kabel />,
    7: <Step7Marken />,
    8: <Step8Check />,
  };
  const nextLabel = step === 7 ? 'Zur Übersicht' : step === 8 ? 'Ergebnis anzeigen' : 'Weiter';
  // no rail on step 1 (fresh start) and step 8 (full-width overview)
  const rail = step !== 1 && step !== 8 ? <LiveSummary step={step} /> : null;
  return (
    <WizardShell step={step} title={meta.title} subtitle={meta.subtitle} rightRail={rail} nextLabel={nextLabel}>
      {contents[step]}
    </WizardShell>
  );
}

window.WizardFrame = WizardFrame;
