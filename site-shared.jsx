/* global React */
/* ============================================================
   Honest Digital — shared site chrome & helpers
   Exposes: Nav, Footer, DriftingSeeds, SectionHeader, Reveal,
            Newsletter, SeedGlyph  → window
   Requires logo.jsx (HonestDigitalLogo, DandelionO) loaded first.
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

const NAV_ITEMS = [
{ label: 'Home', href: 'index.html', key: 'home' },
{ label: 'The Membership', href: 'join.html', key: 'join' },
{ label: 'About', href: 'about.html', key: 'about' },
{ label: 'Contact', href: 'contact.html', key: 'contact' }];


function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="container nav-inner">
        <a href="index.html" aria-label="Honest Digital — home" style={{ display: 'inline-flex' }}>
          <HonestDigitalLogo size={0.145} color="var(--ink)" bg="var(--cream)" textCase="lower" puffStyle="brush" variant="classic" seedCount={3} />
        </a>
        <nav className="nav-links">
          {NAV_ITEMS.filter((i) => i.key !== 'home').map((i) =>
          <a key={i.key} href={i.href} className={'nav-link' + (active === i.key ? ' active' : '')}>{i.label}</a>
          )}
          <a href="https://stan.store/thehonestdigital" target="_blank" rel="noopener" className="btn btn-clay hide-mobile" style={{ padding: '11px 20px', fontSize: 13 }}>Join · $37/mo</a>
        </nav>
      </div>
    </header>);

}

/* One dandelion seed glyph drawn in its own little SVG */
function SeedGlyph({ size = 40, color = 'currentColor' }) {
  const hairs = [
  { len: 9, dy: -6, c: 0.9 }, { len: 11, dy: -3, c: 0.4 },
  { len: 12, dy: 0, c: 0 }, { len: 11, dy: 3, c: -0.4 }, { len: 9, dy: 6, c: -0.9 }];

  return (
    <svg width={size} height={size * 1.5} viewBox="-20 -30 40 60" style={{ display: 'block', overflow: 'visible', color }}>
      {/* stem */}
      <line x1="0" y1="6" x2="0" y2="26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* seed body */}
      <ellipse cx="0" cy="28" rx="1.5" ry="2.4" fill="currentColor" />
      {/* parachute brush (pointing up) */}
      <g transform="translate(0 6) rotate(-90)">
        {hairs.map((h, j) =>
        <path key={j} d={`M 0 0 Q ${h.len * 0.5} ${h.dy * 0.4 + h.c * 2} ${h.len} ${h.dy}`}
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
        {hairs.map((h, j) => <circle key={'d' + j} cx={h.len} cy={h.dy} r="0.9" fill="currentColor" />)}
      </g>
    </svg>);

}

/* Full-viewport layer of seeds drifting gently upward */
function DriftingSeeds({ count = 14 }) {
  const seeds = useMemo(() => {
    const rnd = (a, b) => a + Math.random() * (b - a);
    const colors = ['var(--ink)', 'var(--clay)', 'var(--sage)', 'var(--marigold)', 'var(--ink)', 'var(--ink)'];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: rnd(0, 100),
      size: rnd(20, 46),
      dur: rnd(26, 52),
      delay: -rnd(0, 40),
      dx: rnd(-140, 160),
      r0: rnd(-40, 40),
      r1: rnd(160, 420),
      op: rnd(0.10, 0.26),
      color: colors[i % colors.length],
      rmHide: i % 3 !== 0 // keep only ~1/3 visible when reduced-motion
    }));
  }, [count]);

  return (
    <div className="seed-layer" aria-hidden="true">
      {seeds.map((s) =>
      <div
        key={s.id}
        className={'seed' + (s.rmHide ? ' rm-hide' : '')}
        style={{
          left: s.left + 'vw',
          color: s.color,
          opacity: 0,
          animationDuration: s.dur + 's',
          animationDelay: s.delay + 's',
          ['--dx']: s.dx + 'px',
          ['--r0']: s.r0 + 'deg',
          ['--r1']: s.r1 + 'deg',
          ['--op']: s.op
        }}>
        
          <SeedGlyph size={s.size} />
        </div>
      )}
    </div>);

}

function SectionHeader({ eyebrow, title, cta, ctaHref = '#', dark, center }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: center ? 'center' : 'flex-end',
      flexDirection: center ? 'column' : 'row',
      textAlign: center ? 'center' : 'left',
      gap: 24, flexWrap: 'wrap'
    }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 22, color: dark ? 'rgba(246,242,234,0.6)' : undefined }}>{eyebrow}</div>
        <h2 className="display h-lg" style={{ maxWidth: 900, color: dark ? 'var(--cream)' : undefined }}>{title}</h2>
      </div>
      {cta && <a href={ctaHref} className="nav-link" style={{ borderBottom: '1.5px solid currentColor', paddingBottom: 4 }}>{cta}</a>}
    </div>);

}

/* Gentle scroll reveal */
function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {if (e.isIntersecting) {el.classList.add('in');io.unobserve(el);}});
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="reveal" style={{ transitionDelay: delay + 'ms', ...style }}>{children}</div>;
}

/* Newsletter inline form with success state */
function Newsletter({ dark, compact }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const submit = (e) => {e.preventDefault();if (email.trim()) setDone(true);};
  const sub = dark ? 'rgba(246,242,234,0.7)' : 'var(--warm-grey)';
  if (done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: dark ? 'var(--cream)' : 'var(--ink)' }}>
        <SeedGlyph size={28} color={dark ? 'var(--marigold)' : 'var(--clay)'} />
        <span className="italic" style={{ fontSize: 20 }}>Lovely. Watch your inbox, a note will drift in before long. No spam, ever.</span>
      </div>);

  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: compact ? 460 : 560 }}>
      <input
        className="input"
        type="email"
        required
        placeholder="you@band.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ flex: 1, minWidth: 220, background: dark ? 'rgba(246,242,234,0.06)' : 'var(--paper)', color: dark ? 'var(--cream)' : 'var(--ink)', borderColor: dark ? 'rgba(246,242,234,0.3)' : 'var(--line-strong)' }} />
      
      <button type="submit" className={'btn ' + (dark ? 'btn-clay' : 'btn-primary')}>Send me the field notes</button>
    </form>);

}

function Footer() {
  return (
    <footer className="footer" style={{ position: 'relative', zIndex: 1, paddingTop: 88, paddingBottom: 40 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.3fr', gap: 44 }} className="footer-grid">
          <div>
            <HonestDigitalLogo size={0.16} color="var(--cream)" bg="var(--ink)" textCase="lower" puffStyle="brush" variant="classic" seedCount={3} />
            <p className="italic" style={{ marginTop: 22, fontSize: 17, color: 'rgba(246,242,234,0.7)', maxWidth: 360, lineHeight: 1.55 }}>Marketing help for musicians, delivered straight. No jargon, no hype, no runaround. Just what works and how to do it.

            </p>
          </div>
          <FooterCol title="Explore" links={[['The Membership', 'join.html']]} />
          <FooterCol title="Contact" links={[['ali@thehonestdigital.com', 'contact.html']]} />
          <div className="fieldnotes">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span aria-hidden style={{ color: 'var(--marigold)', flexShrink: 0 }}>
                <DandelionO size={0.32} variant="classic" puffStyle="brush" withSeeds={true} seedCount={5} />
              </span>
              <div className="eyebrow" style={{ color: 'rgba(246,242,234,0.55)', margin: 0 }}>The field notes</div>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 15, color: 'rgba(246,242,234,0.7)', lineHeight: 1.55 }}>
              Short, straight notes for musicians doing their own marketing. No set schedule, they just drift in when there&rsquo;s something genuinely worth passing along.
            </p>
            <Newsletter dark compact />
          </div>
        </div>
        <div style={{ marginTop: 72, paddingTop: 24, borderTop: '1px solid rgba(246,242,234,0.16)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(246,242,234,0.55)' }}>
          <span>© 2026 Honest Digital, LLC</span>
          <span className="italic" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: 15 }}>Straight talk for working musicians.</span>
          <span>Privacy · Terms</span>
        </div>
      </div>
    </footer>);

}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 18, color: 'rgba(246,242,234,0.55)' }}>{title}</div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {links.map(([l, href]) => <li key={l}><a href={href} style={{ fontSize: 15 }}>{l}</a></li>)}
      </ul>
    </div>);

}

Object.assign(window, { Nav, Footer, DriftingSeeds, SectionHeader, Reveal, Newsletter, SeedGlyph });