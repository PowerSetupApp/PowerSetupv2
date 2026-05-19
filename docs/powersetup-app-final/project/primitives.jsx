/* global React */
// PowerSetup — shared hi-fi primitives for all screens
// Icons, buttons, chips, product illustrations, logo mark, topo background.

const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Icon set — line icons, 24x24, consistent stroke
// ─────────────────────────────────────────────────────────────
function Icon({ name, size = 18, stroke = 'currentColor', strokeWidth = 1.75, style }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const p = {
    // transport
    van: <><path d="M2 16 V9 L6 6 H14 L20 10 H22 V16 Z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M9 17 H15" /></>,
    car: <><path d="M3 14 L5 9 H19 L21 14 V18 H3 Z" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>,
    boat: <><path d="M3 15 C6 13 9 12 12 12 C15 12 18 13 21 15 L19 19 H5 Z" /><path d="M12 3 V12 M12 6 L17 12" /></>,
    // energy
    battery: <><rect x="3" y="8" width="16" height="10" rx="1.5" /><path d="M20 11 V15" /><path d="M6 11 V15 M10 11 V15 M14 11 V15" /></>,
    solar: <><rect x="4" y="5" width="16" height="12" rx="1" /><path d="M4 9 H20 M4 13 H20 M10 5 V17 M15 5 V17" /></>,
    alt: <><circle cx="12" cy="12" r="7" /><path d="M8 12 H16 M12 8 V16" /></>,
    plug: <><path d="M9 2 V6 M15 2 V6" /><path d="M6 6 H18 V12 A6 6 0 0 1 6 12 Z" /><path d="M12 18 V22" /></>,
    bolt: <path d="M13 2 L4 14 H11 L10 22 L20 10 H13 Z" />,
    // weather
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2 V4 M12 20 V22 M2 12 H4 M20 12 H22 M5 5 L6.5 6.5 M17.5 17.5 L19 19 M5 19 L6.5 17.5 M17.5 6.5 L19 5" /></>,
    snow: <><path d="M12 2 V22 M2 12 H22 M5 5 L19 19 M5 19 L19 5" /></>,
    leaf: <><path d="M5 19 C5 10 12 4 20 4 C20 12 14 19 5 19 Z" /><path d="M5 19 L14 10" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8 V12 L15 14" /></>,
    cable: <path d="M4 12 C4 8 8 8 8 12 C8 16 16 16 16 12 C16 8 20 8 20 12" />,
    // ui
    check: <path d="M5 12 L10 17 L20 7" />,
    chevron: <path d="M9 6 L15 12 L9 18" />,
    chevronDown: <path d="M6 9 L12 15 L18 9" />,
    chevronLeft: <path d="M15 6 L9 12 L15 18" />,
    chevronUp: <path d="M6 15 L12 9 L18 15" />,
    plus: <path d="M12 5 V19 M5 12 H19" />,
    minus: <path d="M5 12 H19" />,
    trash: <path d="M5 7 H19 M9 7 V4 H15 V7 M7 7 L8 20 H16 L17 7" />,
    copy: <><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M4 16 V4 H16" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 8 V8.01 M12 11 V16" /></>,
    alert: <><path d="M12 3 L22 20 H2 Z" /><path d="M12 10 V14" /><circle cx="12" cy="17.5" r="0.5" /></>,
    map: <><path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" /><path d="M9 4 V18 M15 6 V20" /></>,
    home: <path d="M3 11 L12 4 L21 11 V20 H3 Z" />,
    arrow: <><path d="M5 12 H19 M14 6 L20 12 L14 18" /></>,
    arrowDown: <><path d="M12 5 V19 M6 14 L12 20 L18 14" /></>,
    arrowUp: <><path d="M12 19 V5 M6 10 L12 4 L18 10" /></>,
    // appliances
    fridge: <><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M6 10 H18" /><path d="M9 6 V8 M9 13 V16" /></>,
    laptop: <><rect x="4" y="5" width="16" height="10" rx="1" /><path d="M2 18 H22" /></>,
    tv: <><rect x="3" y="5" width="18" height="12" rx="1.5" /><path d="M8 20 H16" /></>,
    coffee: <><path d="M5 8 H17 V14 A4 4 0 0 1 9 14 Z" /><path d="M17 10 H20 V13 H17" /><path d="M7 4 V6 M10 4 V6 M13 4 V6" /></>,
    heater: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 4 V20 M12 4 V20 M16 4 V20" /></>,
    water: <path d="M12 3 C8 9 6 12 6 15 A6 6 0 0 0 18 15 C18 12 16 9 12 3 Z" />,
    light: <><path d="M9 18 H15 M10 21 H14" /><path d="M12 3 A6 6 0 0 0 8 14 L9 17 H15 L16 14 A6 6 0 0 0 12 3 Z" /></>,
    // admin
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20 C3 16 5 14 9 14 C13 14 15 16 15 20" /><circle cx="17" cy="8" r="2.5" /><path d="M15 14 Q21 14 21 20" /></>,
    box: <><path d="M3 8 L12 3 L21 8 L21 16 L12 21 L3 16 Z" /><path d="M3 8 L12 13 L21 8 M12 13 V21" /></>,
    tag: <><path d="M3 12 V3 H12 L21 12 L12 21 Z" /><circle cx="8" cy="8" r="1.3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12 Q19 11 18.8 10 L20.5 8.5 L19 6 L17 6.8 Q16 6 15 5.5 L14.5 3.5 H12 L11.5 5.5 Q10 6 9 6.8 L7 6 L5.5 8.5 L7.2 10 Q7 11 7 12 Q7 13 7.2 14 L5.5 15.5 L7 18 L9 17.2 Q10 18 11 18.5 L11.5 20.5 H14.5 L15 18.5 Q16 18 17 17.2 L19 18 L20.5 15.5 L18.8 14 Q19 13 19 12 Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M16 16 L21 21" /></>,
    filter: <path d="M3 5 H21 L14 13 V20 L10 18 V13 L3 5 Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M3 9 H21 M8 3 V7 M16 3 V7" /></>,
    dollar: <><circle cx="12" cy="12" r="9" /><path d="M14 9 Q14 7.5 12 7.5 Q10 7.5 10 9 Q10 10.5 12 11 Q14 11.5 14 13 Q14 14.5 12 14.5 Q10 14.5 10 13" /><path d="M12 5.5 V7.5 M12 14.5 V17" /></>,
    download: <><path d="M12 3 V15 M6 10 L12 16 L18 10" /><path d="M4 20 H20" /></>,
    share: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11 L16 7 M8 13 L16 17" /></>,
    edit: <><path d="M4 20 L4 16 L16 4 L20 8 L8 20 Z" /><path d="M14 6 L18 10" /></>,
    dots: <><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>,
    sparkle: <><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11 V7 A4 4 0 0 1 16 7 V11" /></>,
    unlock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11 V7 A4 4 0 0 1 15 6" /></>,
    logout: <><path d="M10 4 H5 V20 H10" /><path d="M8 12 H20 M16 8 L20 12 L16 16" /></>,
    bell: <><path d="M6 16 V11 A6 6 0 0 1 18 11 V16 L20 18 H4 Z" /><path d="M10 21 Q10 22.5 12 22.5 Q14 22.5 14 21" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12 H21 M12 3 Q16 7.5 16 12 Q16 16.5 12 21 Q8 16.5 8 12 Q8 7.5 12 3 Z" /></>,
    eye: <><path d="M2 12 Q6 5 12 5 Q18 5 22 12 Q18 19 12 19 Q6 19 2 12 Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3 L21 21" /><path d="M10.5 6 Q11 6 12 6 Q18 6 22 12 Q20.5 15 18 17 M6 8 Q3.5 10 2 12 Q6 19 12 19 Q13.5 19 15 18.6" /></>,
    key: <><circle cx="8" cy="12" r="4" /><path d="M12 12 H22 M18 12 V16 M22 12 V15" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M8 5 H21 M8 12 H21 M8 19 H21" /><circle cx="4" cy="5" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="19" r="1" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="2.5" /><path d="M4 5 V12 Q4 14.5 12 14.5 Q20 14.5 20 12 V5" /><path d="M4 12 V19 Q4 21.5 12 21.5 Q20 21.5 20 19 V12" /></>,
    pdf: <><path d="M5 3 H15 L19 7 V21 H5 Z" /><path d="M15 3 V7 H19" /><path d="M8 12 H10 Q11 12 11 13 Q11 14 10 14 H8 V16 M13 12 H15 Q16 12 16 14 Q16 16 15 16 H13 V12 M17 12 H20 M17 14 H19" strokeWidth="1.2" /></>,
    refresh: <><path d="M3 12 A9 9 0 0 1 20 8" /><path d="M20 4 V9 H15" /><path d="M21 12 A9 9 0 0 1 4 16" /><path d="M4 20 V15 H9" /></>,
    chart: <><path d="M3 20 V4" /><path d="M3 20 H21" /><rect x="6" y="12" width="3" height="6" /><rect x="11" y="8" width="3" height="10" /><rect x="16" y="14" width="3" height="4" /></>,
    lightning: <path d="M13 3 L5 13 H11 L10 21 L18 11 H12 Z" />,
    star: <path d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 21 L12 17.5 L6.5 21 L8 14 L3 9.5 L9.5 9 Z" />,
    route: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 6 H13 A5 5 0 0 1 13 16 H11 A5 5 0 0 0 11 6" strokeDasharray="2 2" /></>,
    wrench: <path d="M14 3 A5 5 0 0 1 19 10 L6 22 L2 18 L14 6 A5 5 0 0 1 14 3 Z" />,
    layers: <><path d="M12 3 L21 8 L12 13 L3 8 Z" /><path d="M3 13 L12 18 L21 13" /><path d="M3 17 L12 22 L21 17" /></>,
    link: <><path d="M10 14 A4 4 0 0 1 10 8 L13 5 A4 4 0 1 1 19 11 L17 13" /><path d="M14 10 A4 4 0 0 1 14 16 L11 19 A4 4 0 1 1 5 13 L7 11" /></>,
    building: <><rect x="4" y="4" width="16" height="17" rx="1" /><path d="M8 8 H10 M14 8 H16 M8 12 H10 M14 12 H16 M8 16 H10 M14 16 H16" /></>,
    package: <><path d="M3 8 L12 3 L21 8 L12 13 Z" /><path d="M3 8 V17 L12 21 L21 17 V8" /><path d="M7.5 5.5 L16.5 10" /></>,
  };
  return <svg {...common}>{p[name] || p.info}</svg>;
}

// ─────────────────────────────────────────────────────────────
// Logo + mark
// ─────────────────────────────────────────────────────────────
function Logo({ size = 28, color = 'var(--charcoal-600)', accent = 'var(--amber-400)', withText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="7" fill={color} />
        <path d="M17 7 L10 18 L15 18 L14 25 L22 13 L16 13 Z" fill={accent} />
      </svg>
      {withText && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.6, letterSpacing: '-0.01em', color }}>
          PowerSetup
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Button — primary / secondary / ghost
// ─────────────────────────────────────────────────────────────
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, fullWidth, disabled, style, ...rest }) {
  const sizes = {
    sm: { padY: 7, padX: 12, font: 12, icon: 13, radius: 6 },
    md: { padY: 10, padX: 16, font: 13.5, icon: 15, radius: 8 },
    lg: { padY: 13, padX: 22, font: 15, icon: 16, radius: 10 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: 'var(--amber-400)', fg: 'var(--charcoal-700)', border: 'var(--amber-500)', hover: 'var(--amber-300)', shadow: '0 1px 2px rgba(122,68,2,0.12), 0 2px 8px -2px rgba(122,68,2,0.18)' },
    secondary: { bg: 'var(--bg-2)', fg: 'var(--fg-1)', border: 'var(--border-2)', hover: 'var(--sand-50)', shadow: 'none' },
    dark: { bg: 'var(--charcoal-600)', fg: 'var(--sand-50)', border: 'var(--charcoal-500)', hover: 'var(--charcoal-500)', shadow: 'var(--shadow-sm)' },
    ghost: { bg: 'transparent', fg: 'var(--fg-1)', border: 'transparent', hover: 'var(--sand-100)', shadow: 'none' },
    danger: { bg: 'var(--bg-2)', fg: 'var(--rust-700)', border: 'var(--rust-100)', hover: 'var(--rust-50)', shadow: 'none' },
  };
  const v = variants[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: `${s.padY}px ${s.padX}px`, borderRadius: s.radius,
        background: hover && !disabled ? v.hover : v.bg,
        color: v.fg, border: `1px solid ${v.border}`,
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: s.font,
        letterSpacing: '-0.005em', cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: hover && !disabled && variant === 'primary' ? '0 2px 4px rgba(122,68,2,0.15), 0 4px 12px -2px rgba(122,68,2,0.24)' : v.shadow,
        transition: 'all 140ms var(--ease-out)',
        transform: hover && !disabled ? 'translateY(-0.5px)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={s.icon} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.icon} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip / Tag / Badge
// ─────────────────────────────────────────────────────────────
function Chip({ children, tone = 'neutral', icon, size = 'sm', style }) {
  const tones = {
    neutral: { bg: 'var(--sand-100)', fg: 'var(--fg-2)', border: 'var(--sand-200)' },
    amber: { bg: 'var(--amber-50)', fg: 'var(--amber-700)', border: 'var(--amber-200)' },
    forest: { bg: 'var(--forest-50)', fg: 'var(--forest-700)', border: 'var(--forest-100)' },
    rust: { bg: 'var(--rust-50)', fg: 'var(--rust-700)', border: 'var(--rust-100)' },
    dark: { bg: 'var(--charcoal-600)', fg: 'var(--sand-50)', border: 'var(--charcoal-500)' },
  };
  const t = tones[tone];
  const padY = size === 'xs' ? 2 : size === 'sm' ? 3 : 5;
  const padX = size === 'xs' ? 7 : size === 'sm' ? 9 : 12;
  const font = size === 'xs' ? 10 : size === 'sm' ? 11 : 12.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: `${padY}px ${padX}px`, background: t.bg, color: t.fg, border: `1px solid ${t.border}`, borderRadius: 999, fontSize: font, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap', ...style }}>
      {icon && <Icon name={icon} size={font + 1} />}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Input / Select visual (static)
// ─────────────────────────────────────────────────────────────
function Input({ label, value, unit, placeholder, hint, error, disabled, icon, size = 'md', tabular, style }) {
  const padY = size === 'sm' ? 7 : size === 'md' ? 10 : 13;
  const font = size === 'sm' ? 12.5 : size === 'md' ? 13.5 : 15;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: `${padY}px 12px`, background: disabled ? 'var(--sand-50)' : 'var(--bg-2)', border: `1px solid ${error ? 'var(--rust-500)' : 'var(--border-2)'}`, borderRadius: 8, boxShadow: 'inset 0 1px 2px rgba(52,44,27,0.03)', opacity: disabled ? 0.6 : 1 }}>
        {icon && <Icon name={icon} size={font + 2} stroke="var(--fg-3)" />}
        <div style={{ flex: 1, fontSize: font, fontFamily: tabular ? 'var(--font-mono)' : 'var(--font-body)', fontVariantNumeric: tabular ? 'tabular-nums' : 'normal', color: value ? 'var(--fg-1)' : 'var(--fg-3)' }}>
          {value || placeholder}
        </div>
        {unit && <div style={{ fontSize: font - 1, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{unit}</div>}
      </div>
      {(hint || error) && <div style={{ fontSize: 11.5, color: error ? 'var(--rust-700)' : 'var(--fg-3)', fontFamily: 'var(--font-body)' }}>{error || hint}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Topo background — reusable pattern overlay
// ─────────────────────────────────────────────────────────────
function TopoBg({ opacity = 1, size = 360, tint, style }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'var(--topo-pattern)',
      backgroundSize: `${size}px`,
      opacity,
      mixBlendMode: tint ? 'screen' : 'normal',
      pointerEvents: 'none',
      ...style,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// Product illustration — stylised isometric-ish hi-fi placeholder.
// Renders category-specific SVG artwork on a dark gradient swatch.
// ─────────────────────────────────────────────────────────────
function ProductIllo({ kind = 'battery', size = 140, style }) {
  const arts = {
    battery: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="batBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b3a36" />
            <stop offset="1" stopColor="#101614" />
          </linearGradient>
          <linearGradient id="batTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3d534d" />
            <stop offset="1" stopColor="#1a2420" />
          </linearGradient>
        </defs>
        <g transform="translate(40 52)">
          {/* top face */}
          <path d="M0 20 L60 0 L120 20 L60 40 Z" fill="url(#batTop)" stroke="#486059" strokeWidth="0.8" />
          {/* body left */}
          <path d="M0 20 V 90 L60 110 V 40 Z" fill="url(#batBody)" />
          {/* body right */}
          <path d="M120 20 V 90 L60 110 V 40 Z" fill="#0d1412" />
          {/* terminals */}
          <rect x="20" y="6" width="14" height="7" rx="1" fill="#c9a060" transform="skewY(-18)" />
          <rect x="82" y="6" width="14" height="7" rx="1" fill="#c9a060" transform="skewY(-18)" />
          {/* label */}
          <rect x="14" y="58" width="38" height="26" rx="2" fill="#f5e9c8" opacity="0.95" transform="skewY(18)" />
          <text x="21" y="75" fontSize="7" fill="#1a2420" fontFamily="JetBrains Mono" fontWeight="700" transform="skewY(18)">200Ah</text>
          <text x="21" y="83" fontSize="5" fill="#555" fontFamily="JetBrains Mono" transform="skewY(18)">LiFePO4</text>
          {/* right side vent stripes */}
          <path d="M68 52 V 100 M 80 56 V 104 M 92 60 V 108 M 104 64 V 112" stroke="#3d534d" strokeWidth="0.6" opacity="0.6" />
        </g>
      </svg>
    ),
    solar: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="solarGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1a365a" />
            <stop offset="1" stopColor="#081629" />
          </linearGradient>
        </defs>
        <g transform="translate(30 60)">
          <path d="M0 30 L100 0 L140 20 L40 50 Z" fill="url(#solarGrad)" stroke="#2a4e78" strokeWidth="0.8" />
          {/* grid of cells */}
          {[0,1,2,3,4].map(r => [0,1,2,3,4,5].map(c => (
            <path key={`${r}-${c}`} d={`M${c*18 + r*4} ${30 - r*6 + c*0.8} L${c*18 + 16 + r*4} ${30 - r*6 + c*0.8 - 5.4} L${c*18 + 16 + r*4 + 2} ${30 - r*6 + c*0.8 - 5.4 + 7} L${c*18 + 2 + r*4} ${30 - r*6 + c*0.8 + 7} Z`} fill="#0f2a4a" stroke="#3d6fa5" strokeWidth="0.4" opacity={0.75 + r*0.05} />
          )))}
          {/* stand */}
          <path d="M20 55 L30 80 M110 25 L120 65" stroke="#555" strokeWidth="2" />
        </g>
        {/* sun glint */}
        <circle cx="155" cy="45" r="14" fill="rgba(255,210,120,0.22)" />
        <circle cx="155" cy="45" r="6" fill="rgba(255,210,120,0.6)" />
      </svg>
    ),
    mppt: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform="translate(50 60)">
          <rect x="0" y="0" width="100" height="80" rx="5" fill="#15181d" />
          <rect x="0" y="0" width="100" height="80" rx="5" fill="none" stroke="#2a2d33" strokeWidth="0.8" />
          {/* screen */}
          <rect x="12" y="12" width="76" height="22" rx="2" fill="#0a1f15" />
          <text x="18" y="27" fontSize="8" fill="#5EE39B" fontFamily="JetBrains Mono" fontWeight="700">14.4V</text>
          <text x="58" y="27" fontSize="8" fill="#5EE39B" fontFamily="JetBrains Mono" fontWeight="700">12A</text>
          {/* LEDs */}
          <circle cx="20" cy="48" r="2" fill="#5EE39B" />
          <circle cx="30" cy="48" r="2" fill="#F59E0B" />
          <circle cx="40" cy="48" r="2" fill="#444" />
          {/* logo bar */}
          <rect x="58" y="45" width="30" height="4" rx="1" fill="#F59E0B" />
          {/* bottom terminals */}
          <rect x="10" y="60" width="10" height="12" fill="#c9a060" />
          <rect x="24" y="60" width="10" height="12" fill="#c9a060" />
          <rect x="66" y="60" width="10" height="12" fill="#c9a060" />
          <rect x="80" y="60" width="10" height="12" fill="#c9a060" />
        </g>
      </svg>
    ),
    inverter: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform="translate(30 50)">
          <rect x="0" y="0" width="140" height="90" rx="6" fill="#1a1d22" stroke="#2d3038" strokeWidth="0.8" />
          {/* vent */}
          <g transform="translate(16 16)">
            {[0,1,2,3,4,5,6].map(i => (
              <line key={i} x1="0" y1={i*6} x2="30" y2={i*6} stroke="#0b0d10" strokeWidth="2.5" />
            ))}
          </g>
          {/* display */}
          <rect x="60" y="18" width="62" height="26" rx="2" fill="#050708" />
          <text x="66" y="35" fontSize="9" fill="#F59E0B" fontFamily="JetBrains Mono" fontWeight="700">2000W</text>
          <circle cx="115" cy="30" r="3" fill="#5EE39B" />
          {/* output socket */}
          <g transform="translate(62 55)">
            <rect x="0" y="0" width="32" height="28" rx="4" fill="#0a0b0d" />
            <rect x="6" y="10" width="4" height="10" rx="1" fill="#333" />
            <rect x="22" y="10" width="4" height="10" rx="1" fill="#333" />
            <circle cx="16" cy="8" r="1.5" fill="#333" />
          </g>
          {/* power button */}
          <circle cx="110" cy="68" r="6" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
          <line x1="110" y1="62" x2="110" y2="68" stroke="#F59E0B" strokeWidth="1.4" />
        </g>
      </svg>
    ),
    booster: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform="translate(36 56)">
          <rect x="0" y="0" width="128" height="80" rx="5" fill="#2a1a12" stroke="#3d281d" strokeWidth="0.8" />
          <rect x="0" y="0" width="128" height="18" rx="5" fill="#1a0f08" />
          <text x="10" y="13" fontSize="9" fill="#F59E0B" fontFamily="Space Grotesk" fontWeight="700">ORION-Tr 30A</text>
          <circle cx="118" cy="9" r="3" fill="#5EE39B" />
          {/* heatsink fins */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
            <rect key={i} x={8 + i*10} y={28} width="6" height="32" rx="1" fill="#1a0f08" />
          ))}
          {/* terminals bottom */}
          <rect x="10" y="66" width="20" height="10" rx="1" fill="#c9a060" />
          <rect x="98" y="66" width="20" height="10" rx="1" fill="#c9a060" />
        </g>
      </svg>
    ),
    cables: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform="translate(30 50)">
          {/* coiled red cable */}
          <g stroke="#B45A2C" strokeWidth="10" fill="none" strokeLinecap="round">
            <path d="M30 40 C 50 10, 90 10, 110 40 C 90 70, 50 70, 30 40 Z" />
          </g>
          <g stroke="#8e4422" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5">
            <path d="M30 40 C 50 10, 90 10, 110 40 C 90 70, 50 70, 30 40 Z" strokeDasharray="3 5" />
          </g>
          {/* terminal ends */}
          <circle cx="30" cy="40" r="8" fill="#c9a060" />
          <circle cx="110" cy="40" r="8" fill="#c9a060" />
          {/* coiled black cable behind */}
          <g stroke="#1a1d22" strokeWidth="10" fill="none" strokeLinecap="round" transform="translate(10 35)">
            <path d="M30 40 C 50 10, 90 10, 110 40 C 90 70, 50 70, 30 40 Z" />
          </g>
          <circle cx="40" cy="75" r="8" fill="#888" />
          <circle cx="120" cy="75" r="8" fill="#888" />
          {/* fuse */}
          <g transform="translate(118 22)">
            <rect x="0" y="0" width="24" height="10" rx="2" fill="#f5d84a" stroke="#8a7515" />
            <text x="6" y="7.5" fontSize="5.5" fill="#5a4e10" fontFamily="JetBrains Mono" fontWeight="700">200A</text>
          </g>
        </g>
      </svg>
    ),
    monitor: (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform="translate(45 45)">
          <rect x="0" y="0" width="110" height="110" rx="10" fill="#1a1d22" stroke="#2d3038" />
          <circle cx="55" cy="55" r="38" fill="#050708" stroke="#F59E0B" strokeWidth="1" />
          {/* gauge arc */}
          <path d="M 25 63 A 32 32 0 1 1 85 63" stroke="#2a2d33" strokeWidth="3.5" fill="none" />
          <path d="M 25 63 A 32 32 0 0 1 70 30" stroke="#F59E0B" strokeWidth="3.5" fill="none" />
          <text x="55" y="50" fontSize="13" fill="#F59E0B" fontFamily="JetBrains Mono" fontWeight="700" textAnchor="middle">82%</text>
          <text x="55" y="62" fontSize="6" fill="#888" fontFamily="JetBrains Mono" textAnchor="middle">STATE OF CHARGE</text>
          <text x="55" y="76" fontSize="8" fill="#5EE39B" fontFamily="JetBrains Mono" fontWeight="600" textAnchor="middle">13.4V · 2.1A</text>
          {/* mounting dots */}
          <circle cx="10" cy="10" r="1.5" fill="#444" />
          <circle cx="100" cy="10" r="1.5" fill="#444" />
          <circle cx="10" cy="100" r="1.5" fill="#444" />
          <circle cx="100" cy="100" r="1.5" fill="#444" />
        </g>
      </svg>
    ),
  };
  const grads = {
    battery: 'linear-gradient(135deg, #3a4943 0%, #131a17 100%)',
    solar: 'linear-gradient(135deg, #1a365a 0%, #051022 100%)',
    mppt: 'linear-gradient(135deg, #262a31 0%, #0f1116 100%)',
    inverter: 'linear-gradient(135deg, #2f3139 0%, #14151a 100%)',
    booster: 'linear-gradient(135deg, #4a2e1d 0%, #1a0f08 100%)',
    cables: 'linear-gradient(135deg, #3d2418 0%, #1a0f08 100%)',
    monitor: 'linear-gradient(135deg, #1f2228 0%, #0b0c10 100%)',
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: grads[kind] || grads.battery,
      position: 'relative', overflow: 'hidden',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -20px 30px rgba(0,0,0,0.2)',
      ...style,
    }}>
      {/* subtle light */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)', pointerEvents: 'none' }} />
      {/* grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '14px 14px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, padding: 6 }}>
        {arts[kind] || arts.battery}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat — large number with label/unit
// ─────────────────────────────────────────────────────────────
function Stat({ label, value, unit, trend, size = 'md', tone = 'default' }) {
  const sizes = {
    sm: { val: 18, label: 10, unit: 10 },
    md: { val: 24, label: 10.5, unit: 11 },
    lg: { val: 36, label: 11, unit: 13 },
    xl: { val: 52, label: 12, unit: 15 },
  };
  const s = sizes[size];
  const colors = {
    default: 'var(--fg-1)',
    amber: 'var(--amber-700)',
    forest: 'var(--forest-700)',
    rust: 'var(--rust-700)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: s.label, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: s.val, fontWeight: 600, color: colors[tone], letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
        {unit && <div style={{ fontFamily: 'var(--font-mono)', fontSize: s.unit, color: 'var(--fg-3)' }}>{unit}</div>}
        {trend && (
          <div style={{ fontSize: s.unit, color: trend.startsWith('+') ? 'var(--forest-500)' : 'var(--rust-500)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: 4 }}>{trend}</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar (initials-based, deterministic tint)
// ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 28 }) {
  const hash = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = ['#F59E0B', '#3E7548', '#B45A2C', '#554E42', '#7B7261', '#A85F03'];
  const bg = hues[hash % hues.length];
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.38, letterSpacing: '0.02em' }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Checkbox visual
// ─────────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, size = 16 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 4, border: `1.5px solid ${checked || indeterminate ? 'var(--amber-500)' : 'var(--border-2)'}`, background: checked || indeterminate ? 'var(--amber-400)' : 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && !indeterminate && <Icon name="check" size={size - 5} stroke="var(--charcoal-700)" strokeWidth={3} />}
      {indeterminate && <div style={{ width: size - 6, height: 2, background: 'var(--charcoal-700)', borderRadius: 1 }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress ring — for small metrics
// ─────────────────────────────────────────────────────────────
function ProgressRing({ value, size = 44, stroke = 5, color = 'var(--amber-400)', track = 'var(--sand-200)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

Object.assign(window, {
  Icon, Logo, Button, Chip, Input, TopoBg, ProductIllo, Stat, Avatar, Checkbox, ProgressRing,
});
