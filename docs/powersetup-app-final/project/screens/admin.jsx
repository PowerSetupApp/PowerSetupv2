/* global React, Logo, Button, Chip, Icon, Input, Checkbox, Avatar, ProductIllo, Stat, ProgressRing */
// Admin — conservative SaaS layout: left nav + content. Dashboard, CRUD tables, result detail, settings tabs.

const { useState: useS } = React;

function AdminShell({ active = 'dashboard', children, title, subtitle, rightActions, breadcrumb }) {
  const nav = [
    { k: 'dashboard', l: 'Dashboard', i: 'dashboard' },
    { k: 'results', l: 'Ergebnisse', i: 'list', badge: '128' },
    { k: 'users', l: 'Nutzer', i: 'users' },
    { k: 'products', l: 'Produkte', i: 'box' },
    { k: 'brands', l: 'Marken', i: 'tag' },
    { k: 'consumers', l: 'Verbraucher-Katalog', i: 'bolt' },
    { k: 'workshops', l: 'Werkstätten', i: 'building' },
    { k: 'orders', l: 'Bestellungen', i: 'package' },
    { k: 'settings', l: 'Einstellungen', i: 'settings' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '240px 1fr', background: 'var(--bg-1)', fontFamily: 'var(--font-body)', color: 'var(--fg-1)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--charcoal-600)', color: 'var(--sand-100)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--charcoal-500)' }}>
        <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Logo size={22} color="var(--sand-50)" accent="var(--amber-300)" />
          <div style={{ fontSize: 11, color: 'var(--sand-400)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Admin</div>
        </div>
        <div style={{ padding: '12px 10px', flex: 1, overflow: 'auto' }}>
          {nav.map(n => (
            <div key={n.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 6, background: n.k === active ? 'rgba(245,158,11,0.14)' : 'transparent', color: n.k === active ? 'var(--amber-300)' : 'var(--sand-300)', fontSize: 13.5, fontFamily: 'var(--font-display)', fontWeight: n.k === active ? 600 : 500, cursor: 'pointer', marginBottom: 2, borderLeft: n.k === active ? '2px solid var(--amber-400)' : '2px solid transparent', paddingLeft: 10 }}>
              <Icon name={n.i} size={16} stroke={n.k === active ? 'var(--amber-300)' : 'var(--sand-400)'} />
              <span style={{ flex: 1 }}>{n.l}</span>
              {n.badge && <span style={{ fontSize: 10.5, padding: '1px 7px', background: 'var(--amber-400)', color: 'var(--charcoal-700)', borderRadius: 999, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{n.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar name="Tobias Berg" size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--sand-50)' }}>Tobias Berg</div>
            <div style={{ fontSize: 10.5, color: 'var(--sand-400)' }}>Admin · Ops</div>
          </div>
          <Icon name="logout" size={16} stroke="var(--sand-400)" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border-1)' }}>
          <div>
            {breadcrumb && <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
              {breadcrumb.map((b, i) => <React.Fragment key={i}>{i > 0 && <span style={{ color: 'var(--sand-300)' }}>/</span>}<span style={{ color: i === breadcrumb.length - 1 ? 'var(--fg-1)' : 'var(--fg-3)', fontWeight: i === breadcrumb.length - 1 ? 600 : 400 }}>{b}</span></React.Fragment>)}
            </div>}
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', background: 'var(--sand-50)', border: '1px solid var(--border-1)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg-3)' }}>
              <Icon name="search" size={14} stroke="var(--fg-3)" /> Suchen… <span style={{ marginLeft: 24, padding: '1px 5px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10 }}>⌘K</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Icon name="bell" size={18} stroke="var(--fg-2)" />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--amber-400)', border: '2px solid var(--bg-2)' }} />
            </div>
            {rightActions}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────
function AdminDashboard() {
  return (
    <AdminShell active="dashboard" title="Dashboard" subtitle="Übersicht · letzte 30 Tage" rightActions={<><Button variant="secondary" size="sm" icon="calendar">Letzte 30 Tage</Button><Button size="sm" icon="download">Export</Button></>}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Setups geplant', v: '1.284', u: '', t: '+18%', i: 'layers' },
          { l: 'Fertige Bauplanungen', v: '942', u: '', t: '+22%', i: 'check' },
          { l: 'Werkstatt-Leads', v: '318', u: '', t: '+9%', i: 'building' },
          { l: 'Umsatz (PDF-Upsell)', v: '€ 7.428', u: '', t: '+34%', i: 'dollar' },
        ].map(k => (
          <div key={k.l} style={{ padding: 20, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: 'var(--sand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={k.i} size={16} stroke="var(--amber-600)" />
              </div>
              <Chip tone="forest" size="xs">{k.t}</Chip>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--charcoal-600)' }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 4 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* chart */}
        <div style={{ padding: 20, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Setups & Abschlüsse · letzte 30 Tage</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>Tagesauflösung · UTC</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--amber-400)' }} />Gestartet</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--charcoal-400)' }} />Abgeschlossen</div>
            </div>
          </div>
          {/* bars */}
          <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {[38,42,55,48,62,71,68,44,52,65,80,72,88,92,75,68,95,102,88,76,82,105,118,95,108,125,135,110,128,142].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                <div style={{ height: `${h * 0.75}%`, background: 'var(--amber-400)', borderRadius: '2px 2px 0 0' }} />
                <div style={{ height: `${h * 0.5}%`, background: 'var(--charcoal-400)', borderRadius: '2px 2px 0 0', marginTop: -2 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            {['26. März', '2. April', '9. April', '16. April', '23. April'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* conversion funnel */}
        <div style={{ padding: 20, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10 }}>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 18 }}>Conversion Funnel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { l: 'Landing → Konfigurator', v: '3.820', p: 100 },
              { l: 'Schritt 1 abgeschlossen', v: '2.945', p: 77 },
              { l: 'Schritt 4 (Verbraucher)', v: '1.824', p: 48 },
              { l: 'Ergebnis angezeigt', v: '1.284', p: 33.6 },
              { l: 'PDF freigeschaltet', v: '391', p: 10.2 },
            ].map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--fg-2)' }}>{r.l}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.v} <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>· {r.p}%</span></span>
                </div>
                <div style={{ height: 6, background: 'var(--sand-100)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${r.p}%`, height: '100%', background: i === 4 ? 'var(--amber-400)' : 'var(--charcoal-400)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* recent table + top products */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Letzte Ergebnisse</div>
            <Button variant="ghost" size="sm" iconRight="arrow">Alle ansehen</Button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--sand-50)', textAlign: 'left', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {['ID', 'Nutzer', 'Fahrzeug', 'Profil', 'Summe', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 14px', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'PS-24X8F1', u: 'Lena Bergmann', c: 'VW T6.1', p: 'Wochenende', s: '€ 2.847', st: 'PDF' },
                { id: 'PS-24X7Q3', u: 'Marco Huber', c: 'Fiat Ducato', p: 'Dauerbewohnt', s: '€ 5.120', st: 'PDF' },
                { id: 'PS-24X7KP', u: 'Jana Reiss', c: 'Sprinter L3H2', p: 'Autark', s: '€ 3.690', st: 'Neu' },
                { id: 'PS-24X6YH', u: 'Tom Schaefer', c: 'Dacia Jogger', p: 'Wochenende', s: '€ 1.120', st: 'Neu' },
                { id: 'PS-24X6BC', u: 'Anna Pohl', c: 'VW Crafter', p: 'Autark', s: '€ 4.820', st: 'Werkstatt' },
              ].map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-1)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--amber-600)', fontWeight: 600 }}>{r.id}</td>
                  <td style={{ padding: '12px 14px' }}>{r.u}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--fg-2)' }}>{r.c}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--fg-2)' }}>{r.p}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.s}</td>
                  <td style={{ padding: '12px 14px' }}><Chip tone={r.st === 'PDF' ? 'forest' : r.st === 'Werkstatt' ? 'amber' : 'neutral'} size="xs">{r.st}</Chip></td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}><Icon name="chevron" size={14} stroke="var(--fg-3)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 14 }}>Top Komponenten · 30 Tage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { k: 'battery', n: 'BattEnergy 200Ah LiFePO4', c: 412, p: 32 },
              { k: 'inverter', n: 'Victron Phoenix 12/2000', c: 298, p: 23 },
              { k: 'mppt', n: 'Victron SmartSolar 100/30', c: 267, p: 21 },
              { k: 'booster', n: 'Victron Orion-Tr 30A', c: 184, p: 14 },
              { k: 'monitor', n: 'Victron BMV-712', c: 122, p: 10 },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ProductIllo kind={p.k} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
                  <div style={{ height: 3, background: 'var(--sand-100)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${p.p * 3}%`, height: '100%', background: 'var(--amber-400)' }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-2)', fontWeight: 600, width: 36, textAlign: 'right' }}>{p.c}×</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

// ─── Products Table (CRUD) ─────────────────────────────────────────────
function AdminProducts() {
  const rows = [
    { on: true, k: 'battery', n: 'BattEnergy 200Ah LiFePO4', sku: 'BT-200LI', b: 'BattEnergy', cat: 'Batterie', p: '849.00', s: 142, used: 412 },
    { on: true, k: 'battery', n: 'Victron LiFePO4 Smart 200Ah', sku: 'BAT512120610', b: 'Victron', cat: 'Batterie', p: '1.420.00', s: 38, used: 89 },
    { on: true, k: 'solar', n: 'Victron 120W mono schwarz', sku: 'SPM041201200', b: 'Victron', cat: 'Solar', p: '159.00', s: 410, used: 298 },
    { on: true, k: 'solar', n: 'Offgridtec 200W ETFE', sku: 'OGT-200-FLEX', b: 'Offgridtec', cat: 'Solar', p: '285.00', s: 87, used: 112 },
    { on: false, k: 'mppt', n: 'Victron SmartSolar 75/15', sku: 'SCC010015050R', b: 'Victron', cat: 'Laderegler', p: '92.00', s: 28, used: 21 },
    { on: true, k: 'mppt', n: 'Victron SmartSolar 100/30', sku: 'SCC110030210', b: 'Victron', cat: 'Laderegler', p: '235.00', s: 154, used: 267 },
    { on: true, k: 'inverter', n: 'Victron Phoenix 12/2000', sku: 'PIN122221000', b: 'Victron', cat: 'Wechselrichter', p: '684.00', s: 62, used: 298 },
    { on: true, k: 'inverter', n: 'Renogy 2000W Pure Sine', sku: 'RNG-INV-2000', b: 'Renogy', cat: 'Wechselrichter', p: '412.00', s: 104, used: 81 },
    { on: true, k: 'booster', n: 'Victron Orion-Tr Smart 12/12-30', sku: 'ORI121236120', b: 'Victron', cat: 'Ladebooster', p: '329.00', s: 212, used: 184 },
    { on: true, k: 'monitor', n: 'Victron BMV-712 Smart', sku: 'BAM030712000', b: 'Victron', cat: 'Monitor', p: '189.00', s: 180, used: 122 },
  ];
  return (
    <AdminShell active="products" title="Produkte" subtitle="Katalog aller Komponenten, die der Konfigurator ausspielen darf" rightActions={<><Button variant="secondary" size="sm" icon="download">Export CSV</Button><Button size="sm" icon="plus">Produkt anlegen</Button></>}>
      {/* filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8, flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} stroke="var(--fg-3)" />
          <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Suchen nach Name, SKU, Marke…</div>
        </div>
        {[
          { l: 'Alle Kategorien', i: 'filter' },
          { l: 'Alle Marken', i: 'tag' },
          { l: 'Nur aktive', i: 'check' },
        ].map(f => (
          <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8, fontSize: 12.5 }}>
            <Icon name={f.i} size={14} stroke="var(--fg-3)" />
            <span>{f.l}</span>
            <Icon name="chevronDown" size={12} stroke="var(--fg-3)" />
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>10 von 284 Produkten</div>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--sand-50)', textAlign: 'left', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600, borderBottom: '1px solid var(--border-1)' }}>
              <th style={{ padding: '11px 14px', width: 32 }}><Checkbox /></th>
              <th style={{ padding: '11px 14px' }}>Aktiv</th>
              <th style={{ padding: '11px 14px' }}>Produkt</th>
              <th style={{ padding: '11px 14px' }}>SKU</th>
              <th style={{ padding: '11px 14px' }}>Marke</th>
              <th style={{ padding: '11px 14px' }}>Kategorie</th>
              <th style={{ padding: '11px 14px', textAlign: 'right' }}>Preis</th>
              <th style={{ padding: '11px 14px', textAlign: 'right' }}>Lager</th>
              <th style={{ padding: '11px 14px', textAlign: 'right' }}>30T · Nutzung</th>
              <th style={{ padding: '11px 14px', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-1)', background: i === 0 ? 'var(--amber-50)' : 'var(--bg-2)' }}>
                <td style={{ padding: '12px 14px' }}><Checkbox checked={i === 0} /></td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'inline-flex', width: 32, height: 18, borderRadius: 999, background: r.on ? 'var(--forest-500)' : 'var(--sand-300)', padding: 2, alignItems: 'center' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', marginLeft: r.on ? 14 : 0, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ProductIllo kind={r.k} size={32} />
                    <div style={{ fontWeight: 600, color: 'var(--fg-1)' }}>{r.n}</div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>{r.sku}</td>
                <td style={{ padding: '12px 14px' }}><Chip tone="neutral" size="xs">{r.b}</Chip></td>
                <td style={{ padding: '12px 14px', color: 'var(--fg-2)' }}>{r.cat}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'right' }}>€ {r.p}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', textAlign: 'right', color: r.s < 50 ? 'var(--rust-500)' : 'var(--fg-2)' }}>{r.s}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600 }}>{r.used}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}><Icon name="dots" size={16} stroke="var(--fg-3)" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-1)', background: 'var(--sand-50)' }}>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Seite 1 von 29</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border-1)', borderRadius: 5, background: 'var(--bg-2)' }}>←</div>
            {['1', '2', '3', '…', '29'].map(p => <div key={p} style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border-1)', borderRadius: 5, background: p === '1' ? 'var(--charcoal-600)' : 'var(--bg-2)', color: p === '1' ? 'var(--sand-50)' : 'var(--fg-2)', fontWeight: p === '1' ? 600 : 400 }}>{p}</div>)}
            <div style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border-1)', borderRadius: 5, background: 'var(--bg-2)' }}>→</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

// ─── Brands CRUD ───────────────────────────────────────────────────────
function AdminBrands() {
  const brands = [
    { n: 'Victron Energy', nl: 'Premium Marine/Off-Grid · Niederlande', p: 58, o: true, tier: 'Premium' },
    { n: 'BattEnergy', nl: 'DACH · Lithium-Spezialist', p: 14, o: true, tier: 'Mittel' },
    { n: 'Renogy', nl: 'US · Solar, Budget-freundlich', p: 42, o: true, tier: 'Budget' },
    { n: 'Offgridtec', nl: 'DE · Allrounder Off-Grid', p: 31, o: true, tier: 'Mittel' },
    { n: 'Büttner Elektronik', nl: 'DE · Wohnmobil-Klassiker', p: 22, o: true, tier: 'Mittel' },
    { n: 'EcoFlow', nl: 'CN · Mobile Powerstations', p: 18, o: false, tier: 'Mittel' },
    { n: 'Bluetti', nl: 'CN · Powerstations', p: 12, o: false, tier: 'Mittel' },
    { n: 'Wattstunde', nl: 'DE · Solar-Taschen, Dachmodule', p: 24, o: true, tier: 'Mittel' },
  ];
  return (
    <AdminShell active="brands" title="Marken" subtitle="Hersteller und ihre Produkt-Kataloge" rightActions={<><Button variant="secondary" size="sm" icon="filter">Filter</Button><Button size="sm" icon="plus">Marke anlegen</Button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {brands.map((b, i) => (
          <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: b.tier === 'Premium' ? 'var(--charcoal-600)' : b.tier === 'Budget' ? 'var(--sand-100)' : 'var(--amber-100)', color: b.tier === 'Premium' ? 'var(--amber-300)' : b.tier === 'Budget' ? 'var(--charcoal-400)' : 'var(--amber-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
                {b.n.split(' ').map(s => s[0]).slice(0, 2).join('')}
              </div>
              <div style={{ display: 'inline-flex', width: 32, height: 18, borderRadius: 999, background: b.o ? 'var(--forest-500)' : 'var(--sand-300)', padding: 2, alignItems: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', marginLeft: b.o ? 14 : 0 }} />
              </div>
            </div>
            <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 2 }}>{b.n}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 14, lineHeight: 1.45 }}>{b.nl}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px dashed var(--border-1)' }}>
              <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--fg-3)' }}>
                <span><span style={{ color: 'var(--fg-1)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{b.p}</span> Produkte</span>
                <Chip tone={b.tier === 'Premium' ? 'dark' : b.tier === 'Budget' ? 'neutral' : 'amber'} size="xs">{b.tier}</Chip>
              </div>
              <Icon name="dots" size={15} stroke="var(--fg-3)" />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

// ─── Consumers Catalog CRUD ────────────────────────────────────────────
function AdminConsumers() {
  const cats = ['Alle · 64', 'Küche · 12', 'Komfort · 18', 'Arbeit · 8', 'Heizen · 9', 'Beleuchtung · 11', 'Sonstiges · 6'];
  const rows = [
    { on: true, k: 'fridge', n: 'Kühlschrank Kompressor 50L', c: 'Küche', w: 420, u: 'Wh/Tag', p: 'Dauerbetrieb · 24h' },
    { on: true, k: 'fridge', n: 'Kühlschrank Kompressor 90L', c: 'Küche', w: 620, u: 'Wh/Tag', p: 'Dauerbetrieb · 24h' },
    { on: true, k: 'fridge', n: 'Kühlschrank Absorber 75L', c: 'Küche', w: 110, u: 'Wh/Tag', p: 'Gas-betrieben · 12V nur Anlasser' },
    { on: true, k: 'light', n: 'LED Spot 3W', c: 'Beleuchtung', w: 12, u: 'Wh/Tag', p: '4h Nutzung' },
    { on: true, k: 'coffee', n: 'Kaffeemaschine 600W', c: 'Küche', w: 35, u: 'Wh/Tag', p: '2 Tassen · 3.5 Min' },
    { on: true, k: 'coffee', n: 'Wasserkocher 1500W', c: 'Küche', w: 150, u: 'Wh/Tag', p: '1x 1L · 4 Min' },
    { on: true, k: 'laptop', n: 'Laptop 45W Netzteil', c: 'Arbeit', w: 65, u: 'Wh/Tag', p: '4h Arbeit · 220V' },
    { on: true, k: 'heater', n: 'Standheizung Diesel · Gebläse', c: 'Heizen', w: 18, u: 'Wh/Tag', p: '6h Laufzeit' },
    { on: true, k: 'water', n: 'Wasserpumpe Shurflo 12V', c: 'Sonstiges', w: 28, u: 'Wh/Tag', p: 'Intermittent · 30 Min' },
    { on: false, k: 'tv', n: 'TV 22" 12V · DVB-T2', c: 'Komfort', w: 80, u: 'Wh/Tag', p: '4h Abend' },
  ];
  return (
    <AdminShell active="consumers" title="Verbraucher-Katalog" subtitle="Geräte, aus denen Nutzer ihre Verbraucher wählen. Standardwerte für Wh/Tag." rightActions={<><Button variant="secondary" size="sm" icon="download">CSV</Button><Button size="sm" icon="plus">Gerät anlegen</Button></>}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflow: 'auto' }}>
        {cats.map((c, i) => (
          <div key={c} style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 999, background: i === 0 ? 'var(--charcoal-600)' : 'var(--bg-2)', color: i === 0 ? 'var(--sand-50)' : 'var(--fg-2)', border: `1px solid ${i === 0 ? 'var(--charcoal-600)' : 'var(--border-1)'}`, fontFamily: 'var(--font-display)', fontWeight: i === 0 ? 600 : 500, whiteSpace: 'nowrap' }}>{c}</div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--sand-50)', textAlign: 'left', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600, borderBottom: '1px solid var(--border-1)' }}>
              <th style={{ padding: '11px 14px' }}>Aktiv</th>
              <th style={{ padding: '11px 14px' }}>Verbraucher</th>
              <th style={{ padding: '11px 14px' }}>Kategorie</th>
              <th style={{ padding: '11px 14px', textAlign: 'right' }}>Wh/Tag</th>
              <th style={{ padding: '11px 14px' }}>Standard-Profil</th>
              <th style={{ padding: '11px 14px', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-1)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'inline-flex', width: 30, height: 16, borderRadius: 999, background: r.on ? 'var(--forest-500)' : 'var(--sand-300)', padding: 2, alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', marginLeft: r.on ? 14 : 0 }} />
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--sand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={r.k} size={16} stroke="var(--amber-600)" /></div>
                    <div style={{ fontWeight: 600 }}>{r.n}</div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--fg-2)' }}>{r.c}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'right' }}>{r.w}</td>
                <td style={{ padding: '12px 14px', color: 'var(--fg-2)', fontSize: 12 }}>{r.p}</td>
                <td style={{ padding: '12px 14px' }}><Icon name="edit" size={15} stroke="var(--fg-3)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

// ─── Result Detail ─────────────────────────────────────────────────────
function AdminResultDetail() {
  return (
    <AdminShell active="results" title="Setup PS-24X8F1" subtitle="Erstellt 23. April 2026 · 14:28 · Lena Bergmann" breadcrumb={['Ergebnisse', 'PS-24X8F1']}
      rightActions={<><Button variant="secondary" size="sm" icon="copy">Duplizieren</Button><Button variant="secondary" size="sm" icon="pdf">PDF erneut senden</Button><Button size="sm" icon="edit">Bearbeiten</Button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Tagesverbrauch', v: '612', u: 'Wh' },
              { l: 'Batterie', v: '200', u: 'Ah' },
              { l: 'Solar', v: '240', u: 'Wp' },
              { l: 'Autark', v: '3.4', u: 'Tage' },
            ].map(k => (
              <div key={k.l} style={{ padding: 16, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 6 }}>{k.l}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{k.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{k.u}</div>
                </div>
              </div>
            ))}
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-1)', marginBottom: 18 }}>
            {['Stückliste', 'Verbraucher', 'Berechnung', 'Schaltplan', 'History'].map((t, i) => (
              <div key={t} style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: i === 0 ? 'var(--fg-1)' : 'var(--fg-3)', borderBottom: i === 0 ? '2px solid var(--amber-400)' : '2px solid transparent', marginBottom: -1, cursor: 'pointer' }}>{t}</div>
            ))}
          </div>

          {/* BOM */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'var(--sand-50)', textAlign: 'left', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  <th style={{ padding: '11px 14px' }}>#</th>
                  <th style={{ padding: '11px 14px' }}>Komponente</th>
                  <th style={{ padding: '11px 14px' }}>Marke</th>
                  <th style={{ padding: '11px 14px' }}>SKU</th>
                  <th style={{ padding: '11px 14px', textAlign: 'right' }}>Menge</th>
                  <th style={{ padding: '11px 14px', textAlign: 'right' }}>Einzelpreis</th>
                  <th style={{ padding: '11px 14px', textAlign: 'right' }}>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { k: 'battery', n: 'BattEnergy 200Ah LiFePO4', b: 'BattEnergy', sku: 'BT-200LI', q: 1, p: 849, t: 849 },
                  { k: 'solar', n: 'Victron 120W mono', b: 'Victron', sku: 'SPM041201200', q: 2, p: 159, t: 318 },
                  { k: 'mppt', n: 'SmartSolar 100/30', b: 'Victron', sku: 'SCC110030210', q: 1, p: 235, t: 235 },
                  { k: 'inverter', n: 'Phoenix 12/2000', b: 'Victron', sku: 'PIN122221000', q: 1, p: 684, t: 684 },
                  { k: 'booster', n: 'Orion-Tr Smart 12/12-30', b: 'Victron', sku: 'ORI121236120', q: 1, p: 329, t: 329 },
                  { k: 'monitor', n: 'BMV-712 Smart', b: 'Victron', sku: 'BAM030712000', q: 1, p: 189, t: 189 },
                  { k: 'cables', n: 'Kabel- & Kleinteile-Paket', b: 'Generisch', sku: 'KIT-200A-35', q: 1, p: 243, t: 243 },
                ].map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-1)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{String(i + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <ProductIllo kind={r.k} size={30} />
                        <div style={{ fontWeight: 600 }}>{r.n}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}><Chip tone="neutral" size="xs">{r.b}</Chip></td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>{r.sku}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.q}×</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>€ {r.p.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>€ {r.t.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--charcoal-400)', background: 'var(--sand-50)' }}>
                  <td colSpan="6" style={{ padding: '14px', fontFamily: 'var(--font-display)', fontWeight: 700, textAlign: 'right' }}>Gesamtsumme</td>
                  <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>€ 2.847.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* sidebar */}
        <div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 14 }}>Nutzer</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <Avatar name="Lena Bergmann" size={40} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Lena Bergmann</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>lena.bergmann@example.de</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--fg-3)' }}>PLZ</span><span style={{ fontFamily: 'var(--font-mono)' }}>80331 München</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--fg-3)' }}>Kontaktiert</span><Chip tone="forest" size="xs">3×</Chip></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--fg-3)' }}>Signup</span><span>12. März 2026</span></div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 14 }}>Werkstatt-Vermittlung</div>
            <div style={{ padding: 12, background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Alpenvans Ausbau GmbH</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>München-Sendling · 4 km</div>
              <div style={{ fontSize: 11, marginTop: 6, color: 'var(--amber-700)' }}>Lead gesendet · 23.04. 14:30</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Lead-Status: <span style={{ color: 'var(--forest-500)', fontWeight: 600 }}>angenommen</span></div>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 12 }}>Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5 }}>
              {[
                { t: '14:28', e: 'Konfigurator gestartet', c: 'var(--fg-3)' },
                { t: '14:34', e: 'Ergebnis angezeigt', c: 'var(--forest-500)' },
                { t: '14:35', e: 'PDF gekauft · € 19', c: 'var(--amber-600)' },
                { t: '14:36', e: 'Lead an Werkstatt', c: 'var(--forest-500)' },
                { t: '16:12', e: 'Werkstatt kontaktiert Lena', c: 'var(--fg-3)' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 40, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{x.t}</div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: x.c, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ color: 'var(--fg-1)' }}>{x.e}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────
function AdminSettings() {
  const tabs = [
    { l: 'Rechenmodell', i: 'chart', a: true },
    { l: 'Preise & Zahlungen', i: 'dollar' },
    { l: 'E-Mail-Templates', i: 'globe' },
    { l: 'Werkstatt-Regeln', i: 'building' },
    { l: 'API & Integrationen', i: 'link' },
    { l: 'Team', i: 'users' },
    { l: 'Audit-Log', i: 'database' },
  ];
  return (
    <AdminShell active="settings" title="Einstellungen" subtitle="Rechenmodell, Preise, Templates, Integrationen" rightActions={<><Button variant="secondary" size="sm">Verwerfen</Button><Button size="sm" icon="check">Speichern</Button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        <div>
          {tabs.map(t => (
            <div key={t.l} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: t.a ? 'var(--bg-2)' : 'transparent', borderRadius: 6, color: t.a ? 'var(--fg-1)' : 'var(--fg-2)', fontSize: 13, fontWeight: t.a ? 600 : 500, fontFamily: 'var(--font-display)', marginBottom: 2, border: `1px solid ${t.a ? 'var(--border-1)' : 'transparent'}`, cursor: 'pointer' }}>
              <Icon name={t.i} size={15} stroke={t.a ? 'var(--amber-600)' : 'var(--fg-3)'} />
              {t.l}
            </div>
          ))}
        </div>

        <div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 12, padding: 24, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Rechenmodell · Batterie-Sizing</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 3, maxWidth: 500 }}>Parameter, mit denen der Konfigurator die nötige Batteriekapazität berechnet.</div>
              </div>
              <Chip tone="amber" icon="sparkle" size="xs">Letzte Änderung: 18.04.</Chip>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 22 }}>
              <Input label="Sicherheitsreserve" value="20" unit="%" hint="Zusätzliche Reserve über bedarf" tabular />
              <Input label="Tiefentladeschutz" value="20" unit="%" hint="Minimaler SOC ab dem entladen wird gestoppt" tabular />
              <Input label="Selbstentladung" value="2" unit="%/Monat" hint="Standard für LiFePO4" tabular />
              <Input label="Inverter-Standby" value="20" unit="Wh/Tag" hint="Dauerverbrauch auch ohne Last" tabular />
              <Input label="Solar-Derate-Faktor" value="0.75" unit="" hint="Reale Erträge / Nennleistung" tabular />
              <Input label="Peukert-Exponent" value="1.05" unit="" hint="Für Lithium ~1.0, für AGM ~1.3" tabular />
            </div>

            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Diese Werte gelten für alle neuen Berechnungen. Bestehende Ergebnisse werden nicht neu kalkuliert.</div>
              <Button variant="ghost" size="sm" icon="refresh">Standards wiederherstellen</Button>
            </div>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4 }}>Sizing-Regeln · Solar</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginBottom: 18 }}>Verhältnis zwischen Batterie, Solarleistung und erwartetem Verbrauch.</div>

            {/* regions table */}
            <div style={{ border: '1px solid var(--border-1)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--sand-50)', textAlign: 'left', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    <th style={{ padding: '10px 14px' }}>Region</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Volllast Std/Tag (Sommer)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Volllast Std/Tag (Winter)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Jahresertrag kWh/kWp</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { r: 'Mitteleuropa (DE/AT/CH)', s: '4.2', w: '0.9', y: '1.050' },
                    { r: 'Südeuropa (ES/IT/GR)', s: '5.6', w: '2.2', y: '1.480' },
                    { r: 'Skandinavien', s: '3.5', w: '0.3', y: '830' },
                    { r: 'UK/Irland', s: '3.8', w: '0.8', y: '940' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-1)' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.r}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.s}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.w}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { AdminDashboard, AdminProducts, AdminBrands, AdminConsumers, AdminResultDetail, AdminSettings });
