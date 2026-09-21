import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BarChart3, Layers3, Menu, Mouse, Settings2, ShieldCheck, X } from 'lucide-react';

type Point = { x: number; y: number; phase: number; speed: number; size: number };

function CinematicWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let frame = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars: Point[] = Array.from({ length: 145 }, (_, i) => ({
      x: ((i * 67) % 997) / 997,
      y: ((i * 113) % 991) / 991,
      phase: i * 0.73,
      speed: 0.006 + (i % 7) * 0.001,
      size: 0.45 + (i % 5) * 0.22
    }));

    const drawArc = (cx: number, cy: number, rx: number, ry: number, lift: number, phase: number, color: string, w: number) => {
      const startX = cx - rx;
      const endX = cx + rx;
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      ctx.bezierCurveTo(cx - rx * 0.5, cy - ry - lift, cx + rx * 0.5, cy - ry - lift, endX, cy);
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
      const t = reduced ? 0.58 : (frame * 0.0022 + phase) % 1;
      const mt = 1 - t;
      const x = mt * mt * mt * startX + 3 * mt * mt * t * (cx - rx * 0.5) + 3 * mt * t * t * (cx + rx * 0.5) + t * t * t * endX;
      const y = mt * mt * mt * cy + 3 * mt * mt * t * (cy - ry - lift) + 3 * mt * t * t * (cy - ry - lift) + t * t * t * cy;
      ctx.fillStyle = '#EDE9FE';
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#020713');
      sky.addColorStop(0.47, '#041329');
      sky.addColorStop(0.68, '#07152d');
      sky.addColorStop(1, '#020713');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((s) => {
        const pulse = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase));
        ctx.fillStyle = 'rgba(160,210,255,' + pulse + ')';
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h * 0.72, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Milky-way style cyan/violet cloud band behind the globe.
      ctx.save(); ctx.translate(w*.52,h*.13); ctx.rotate(-.16); const cloud=ctx.createLinearGradient(-w*.45,0,w*.45,0); cloud.addColorStop(0,'rgba(0,0,0,0)'); cloud.addColorStop(.25,'rgba(51,92,180,.10)'); cloud.addColorStop(.5,'rgba(165,208,255,.22)'); cloud.addColorStop(.7,'rgba(73,82,190,.12)'); cloud.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=cloud; ctx.filter='blur(18px)'; ctx.fillRect(-w*.55,-18,w*1.1,36); ctx.filter='none'; ctx.restore();

      const nebula = ctx.createRadialGradient(w * 0.55, h * 0.18, 0, w * 0.55, h * 0.18, w * 0.48);
      nebula.addColorStop(0, 'rgba(34,211,238,.08)');
      nebula.addColorStop(0.34, 'rgba(35,91,200,.075)');
      nebula.addColorStop(0.68, 'rgba(124,58,237,.04)');
      nebula.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.665;
      const cy = h * 0.56;
      const r = Math.min(w * 0.305, h * 0.52);
      const earth = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.38, r * 0.08, cx, cy, r);
      earth.addColorStop(0, '#3b8fe2');
      earth.addColorStop(0.28, '#0b4d96');
      earth.addColorStop(0.63, '#041f4a');
      earth.addColorStop(0.88, '#071634');
      earth.addColorStop(1, '#020713');
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = earth;
      ctx.fillRect(cx - r, cy - r, r * 2, r);

      // Abstract illuminated continental masses make the sphere read as Earth, not a network dome.
      const land = [[-.42,-.42,.17,.09,-.25],[-.28,-.31,.11,.19,.18],[-.15,-.12,.08,.22,-.1],[.02,-.38,.13,.08,.15],[.16,-.30,.18,.12,-.12],[.29,-.15,.13,.20,.12],[.40,-.02,.08,.12,.32],[.08,-.06,.12,.18,-.25]];
      land.forEach(([lx,ly,rx,ry,rot]) => { ctx.save(); ctx.translate(cx+lx*r,cy+ly*r); ctx.rotate(rot); const g=ctx.createRadialGradient(0,0,0,0,0,rx*r); g.addColorStop(0,'rgba(36,211,238,.28)'); g.addColorStop(.55,'rgba(25,116,176,.18)'); g.addColorStop(1,'rgba(15,75,130,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,0,rx*r,ry*r,0,0,Math.PI*2); ctx.fill(); ctx.restore(); });

      for (let i = 0; i < 112; i++) {
        const a = (i * 2.399 + frame * 0.00016) % (Math.PI * 2);
        const rr = r * (0.14 + ((i * 47) % 79) / 100);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.58 - r * 0.08;
        if (y < cy) {
          ctx.fillStyle = i % 5 === 0 ? 'rgba(167,139,250,.9)' : 'rgba(34,211,238,.78)';
          ctx.shadowBlur = 7;
          ctx.shadowColor = i % 5 === 0 ? '#7C3AED' : '#22D3EE';
          ctx.beginPath();
          ctx.arc(x, y, i % 9 === 0 ? 1.8 : 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.shadowBlur = 26;
      ctx.shadowColor = '#22D3EE';
      ctx.strokeStyle = 'rgba(34,211,238,.86)';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Bright atmospheric crown matching the approved cinematic reference.
      const atmosphere=ctx.createRadialGradient(cx,cy-r*.9,0,cx,cy-r*.9,r*.72); atmosphere.addColorStop(0,'rgba(96,190,255,.34)'); atmosphere.addColorStop(.45,'rgba(31,126,255,.11)'); atmosphere.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=atmosphere; ctx.fillRect(cx-r,cy-r*1.45,r*2,r*.9);
      ctx.strokeStyle = 'rgba(167,139,250,.48)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.018, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();

      drawArc(cx, cy - r * 0.02, r * 0.72, r * 0.2, r * 0.46, 0.04, 'rgba(34,211,238,.62)', 1);
      drawArc(cx, cy - r * 0.01, r * 0.54, r * 0.16, r * 0.32, 0.38, 'rgba(124,58,237,.72)', 1.05);
      drawArc(cx, cy - r * 0.01, r * 0.37, r * 0.11, r * 0.24, 0.7, 'rgba(74,139,255,.7)', 0.9);
      drawArc(cx, cy, r * 0.84, r * 0.2, r * 0.22, 0.84, 'rgba(167,139,250,.48)', 0.8);

      const hy = h * 0.625;
      const flare = ctx.createRadialGradient(w * 0.58, hy, 0, w * 0.58, hy, w * 0.28);
      flare.addColorStop(0, 'rgba(237,233,254,.98)');
      flare.addColorStop(0.012, 'rgba(167,139,250,.95)');
      flare.addColorStop(0.05, 'rgba(34,211,238,.44)');
      flare.addColorStop(0.22, 'rgba(124,58,237,.13)');
      flare.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = flare;
      ctx.fillRect(0, hy - h * 0.18, w, h * 0.36);

      ctx.strokeStyle = 'rgba(34,211,238,.36)';
      ctx.lineWidth = 0.8;
      for (let i = -24; i <= 24; i++) {
        const ex = w * 0.58 + i * w * 0.055;
        ctx.beginPath();
        ctx.moveTo(w * 0.58, hy);
        ctx.lineTo(ex, h * 1.04);
        ctx.stroke();
      }
      for (let i = 0; i < 22; i++) {
        const shift = reduced ? 0 : (frame * 0.00024) % 1;
        const p = (i / 22 + shift) % 1;
        const y = hy + (h - hy) * Math.pow(p, 2.2);
        ctx.strokeStyle = i % 5 === 0 ? 'rgba(124,58,237,.46)' : 'rgba(34,211,238,' + (0.07 + p * 0.33) + ')';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const beamX = w * 0.58;
      ctx.strokeStyle = 'rgba(167,139,250,.45)';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#7C3AED';
      ctx.beginPath();
      ctx.moveTo(beamX, hy);
      ctx.lineTo(beamX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      frame += 1;
      if (!reduced) raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className='world-canvas' aria-hidden='true' />;
}

const features = [
  { icon: Layers3, title: 'Plan Smarter', text: 'Turn data into clarity' },
  { icon: ShieldCheck, title: 'Source Better', text: 'Make confident decisions' },
  { icon: Settings2, title: 'Control Efficiently', text: 'Simplify complex operations' },
  { icon: BarChart3, title: 'Grow Further', text: 'Build a stronger tomorrow' }
];

const planvantaCapabilities = [
  ['Material Planning','Turn demand, inventory and planning parameters into structured material requirements and ordering decisions.'],
  ['Inventory Intelligence','Build clearer visibility into inventory positions, material movements and areas requiring attention.'],
  ['Procurement Visibility','Bring purchasing requirements and purchase-order information into a structured operational view.'],
  ['Plant-Level Dashboards','Give individual plants focused operational visibility based on their own data and responsibilities.'],
  ['Consolidated Group Overview','Move from individual plant information to consolidated organisational visibility for management.'],
  ['Operational Intelligence','Surface risks, exceptions and decision-ready information so teams can focus attention where it matters.']
];

function PlanvantaProductPage(){
  // Product route intentionally shares Vantoryx visual language with the corporate site.
  return <main className='pv3'>
    <header className='pv3-nav'>
      <a href='/' className='pv3-vx'><img src='/resources/vantoryx-logo.png' alt='Vantoryx Technologies'/></a>
      <nav><a href='#platform'>Platform</a><a href='#architecture'>Architecture</a><a href='#decisions'>Intelligence</a><a className='pv3-demo' href='/#contact'>Request a Demo <ArrowRight size={14}/></a></nav>
    </header>

    <section className='pv3-hero'>
      <div className='pv3-grid'/>
      <div className='pv3-aura pv3-aura-a'/><div className='pv3-aura pv3-aura-b'/>
      <div className='pv3-hero-copy'>
        <img src='/resources/planvanta-logo.png' className='pv3-logo' alt='Planvanta'/>
        <p className='pv3-kicker'>MANUFACTURING PLANNING &amp; OPERATIONAL INTELLIGENCE</p>
        <h1>Manufacturing<br/>Intelligence.<br/><em>Connected.</em></h1>
        <p className='pv3-lead'>One environment for clearer material planning, inventory, procurement, plant operations and management visibility.</p>
        <div className='pv3-actions'><a href='/#contact' className='pv3-primary'>Request a Demo <ArrowRight size={16}/></a><a href='#platform'>Explore the Platform <ArrowRight size={16}/></a></div>
      </div>
      <div className='pv3-stage'>
        <div className='pv3-stage-meta'><span>PLANVANTA 2.0</span><i>OPERATIONAL VIEW</i></div>
        <div className='pv3-screen'><div className='pv3-browser'><i/><i/><i/><b>PLANVANTA / MATERIAL PLANNING</b></div><img src='/resources/planvanta-interface.png' alt='Planvanta 2.0 operational interface'/></div>
        <div className='pv3-stage-foot'><span>PLAN</span><span>SOURCE</span><span>CONTROL</span><span>GROW</span></div>
      </div>
      <div className='pv3-scroll'>SCROLL TO EXPLORE <span>↓</span></div>
    </section>

    <section className='pv3-statement'>
      <p>THE OPERATING LAYER FOR GROWING MANUFACTURERS</p>
      <h2>Less time consolidating information.<br/><em>More clarity on what needs attention.</em></h2>
      <div className='pv3-statement-line'/>
      <p className='pv3-statement-copy'>Planvanta 2.0 is a web-based manufacturing planning and operational intelligence platform developed by Vantoryx Technologies. It brings fragmented operational information into a structured environment designed around manufacturing decisions.</p>
    </section>

    <section className='pv3-product' id='platform'>
      <div className='pv3-section-no'>01 / PLATFORM</div>
      <div className='pv3-product-head'><h2>The product is<br/><em>the experience.</em></h2><p>Focused operational views help planners and management see planning status, material risk, purchase-order visibility and the information requiring attention.</p></div>
      <div className='pv3-product-stage'>
        <div className='pv3-product-halo'/>
        <div className='pv3-product-screen'><div className='pv3-browser'><i/><i/><i/><b>REAL PLANVANTA 2.0 INTERFACE</b></div><img src='/resources/planvanta-interface.png' alt='Real Planvanta 2.0 interface'/></div>
        <div className='pv3-callout pv3-callout-a'><small>01</small><b>MATERIAL PLANNING</b><span>Structured requirements &amp; ordering visibility</span></div>
        <div className='pv3-callout pv3-callout-b'><small>02</small><b>INVENTORY INTELLIGENCE</b><span>Clearer positions &amp; areas requiring attention</span></div>
        <div className='pv3-callout pv3-callout-c'><small>03</small><b>PROCUREMENT VISIBILITY</b><span>Requirements &amp; PO information in context</span></div>
      </div>
      <div className='pv3-capabilities'>
        <article><span>04</span><h3>Plant-Level Dashboards</h3><p>Focused operational visibility based on each plant's own data and responsibilities.</p></article>
        <article><span>05</span><h3>Consolidated Group Overview</h3><p>Move from individual plant information to consolidated organisational visibility.</p></article>
        <article><span>06</span><h3>Operational Intelligence</h3><p>Surface risks, exceptions and decision-ready information where attention matters.</p></article>
      </div>
    </section>

    <section className='pv3-flow'>
      <div className='pv3-section-no'>02 / OPERATING MODEL</div>
      <div className='pv3-flow-head'><p>FROM OPERATIONAL DATA</p><h2>One continuous path<br/>from <em>signal to decision.</em></h2></div>
      <div className='pv3-flow-line'>
        {[
          ['01','CONNECT','Operational information'],
          ['02','STRUCTURE','Groups, plants & modules'],
          ['03','CALCULATE','Planning logic'],
          ['04','VISUALISE','Focused dashboards'],
          ['05','IDENTIFY','Risks & exceptions'],
          ['06','ACT','Decision-ready information']
        ].map(([n,t,d])=><article key={n}><span>{n}</span><i/><h3>{t}</h3><p>{d}</p></article>)}
      </div>
    </section>

    <section className='pv3-decisions' id='decisions'>
      <div className='pv3-section-no'>03 / INTELLIGENCE</div>
      <div className='pv3-decisions-copy'><p className='pv3-kicker'>BUILT AROUND PRACTICAL MANUFACTURING DECISIONS</p><h2>See the question.<br/><em>Find the signal.</em></h2><p>Planvanta is designed to strengthen human operational judgement with structured calculations, dashboards and decision-support information.</p></div>
      <div className='pv3-question-list'>
        {['What materials require attention?','Where are inventory risks developing?','Which purchase orders need follow-up?','How is material availability changing?','What does management need to see now?'].map((q,i)=><div key={q}><small>0{i+1}</small><b>{q}</b><span>↗</span></div>)}
      </div>
    </section>

    <section className='pv3-architecture' id='architecture'>
      <div className='pv3-section-no'>04 / MULTI-PLANT ARCHITECTURE</div>
      <div className='pv3-architecture-head'><h2>Local operational control.<br/><em>Group-level visibility.</em></h2><p>Individual plants retain their operational identity while management receives a consolidated organisational view.</p></div>
      <div className='pv3-network'>
        <div className='pv3-plants'><div><b>PLANT A</b><span>Operational view</span></div><div><b>PLANT B</b><span>Operational view</span></div><div><b>PLANT C</b><span>Operational view</span></div></div>
        <div className='pv3-connectors'><i/><i/><i/></div>
        <div className='pv3-core'><small>ORGANISATION / GROUP</small><b>PLANVANTA</b><span>CONNECTED OPERATIONAL INTELLIGENCE</span></div>
        <div className='pv3-arrow'>→</div>
        <div className='pv3-management'><small>MANAGEMENT VIEW</small><b>Consolidated<br/>Visibility</b></div>
      </div>
    </section>

    <section className='pv3-access'>
      <div><p className='pv3-kicker'>CONTROLLED VISIBILITY</p><h2>Right information.<br/><em>Right people.</em></h2><p>Role- and permission-based access principles help organisations control which plants, modules, dashboards and functions are available to different users.</p></div>
      <div className='pv3-access-path'>{['SYSTEM','ORGANISATION','PLANT','MODULE','DASHBOARD','PERMISSION'].map((x,i)=><span key={x}><small>0{i+1}</small>{x}</span>)}</div>
    </section>

    <section className='pv3-origin'>
      <span>BUILT BY VANTORYX TECHNOLOGIES</span>
      <h2>Built in Sri Lanka.<br/>Engineered for growing manufacturers.<br/><em>Designed to scale further.</em></h2>
    </section>

    <section className='pv3-final'>
      <div className='pv3-final-aura'/>
      <img src='/resources/planvanta-logo.png' alt='Planvanta'/>
      <p>MANUFACTURING INTELLIGENCE. CONNECTED.</p>
      <h2>Make your operations<br/><em>easier to see.</em></h2>
      <div className='pv3-actions'><a href='/#contact' className='pv3-primary'>Request a Demo <ArrowRight size={16}/></a><a href='/#contact'>Talk to Vantoryx <ArrowRight size={16}/></a></div>
      <small>Developed by Vantoryx Technologies</small>
    </section>
  </main>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  if (window.location.pathname === '/products/planvanta') return <PlanvantaProductPage />;

  return (
    <>
      <main className='site-shell'>
      <section className='hero' id='home'>
        <div className='hero-background' aria-hidden='true' />
        <div className='cinematic-stars cinematic-stars-far' aria-hidden='true' />
        <div className='cinematic-stars cinematic-stars-near' aria-hidden='true' />
        <div className='cinematic-orbit-pulse pulse-one' aria-hidden='true' />
        <div className='cinematic-orbit-pulse pulse-two' aria-hidden='true' />
        <div className='cinematic-atmosphere' aria-hidden='true' />
        <div className='cinematic-vignette' aria-hidden='true' />
        <header className='nav'>
          <a className='brand' href='#home' aria-label='Vantoryx Technologies home'>
            <span className='brand-plate'><img src='/resources/vantoryx-logo.png' alt='Vantoryx Technologies' /></span>
          </a>
          <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label='Main navigation'>
            <a className='active' href='#home' onClick={() => setMenuOpen(false)}>Home</a>
            <a href='#products' onClick={() => setMenuOpen(false)}>Products</a>
            <a href='#technology' onClick={() => setMenuOpen(false)}>Technology</a>
            <a href='#about' onClick={() => setMenuOpen(false)}>About</a>
            <a href='#contact' onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
          <a className='demo' href='#contact'>Book a Demo <ArrowRight size={16} /></a>
          <button className='menu-button' onClick={() => setMenuOpen(!menuOpen)} aria-label='Toggle navigation'>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>

        <div className='hero-copy'>
          <p className='kicker'>INTELLIGENCE FOR A BRIGHTER TOMORROW</p>
          <h1>BUILDING<br /><span>INTELLIGENCE</span><br />FOR BUSINESS.</h1>
          <p className='intro'>We develop intelligent software solutions to help businesses plan,<br className='desktop-break' /> source, control and grow with confidence.</p>
          <div className='hero-actions'>
            <a className='primary' href='#products'>Explore Our Products <ArrowRight size={17} /></a>
            <a className='secondary' href='#technology'>Our Technology <ArrowRight size={16} /></a>
          </div>
        </div>

        <div className='signal-copy' aria-hidden='true'><i /><span>CONNECTING<br />BUSINESSES<br />A SMARTER<br />TOMORROW</span></div>
        <div className='principles' aria-hidden='true'><i /><span>PLAN<br />SOURCE<br />CONTROL<br />GROW</span></div>

        <div className='capability-strip'>
          {features.map(({ icon: Icon, title, text }) => (
            <div className='capability' key={title}>
              <span className='cap-icon'><Icon size={25} /></span>
              <span className='cap-copy'><strong>{title}</strong><small>{text}</small></span>
            </div>
          ))}
        </div>
        <div className='scroll-cue' aria-hidden='true'><span /><Mouse size={20} /><b>SCROLL TO EXPLORE</b><span /></div>
      </section>

      <section className='products-section' id='products'>
        <div className='section-glow section-glow-one' aria-hidden='true' />
        <div className='products-inner'>
          <div className='section-heading'>
            <p className='section-kicker'>VANTORYX PRODUCTS</p>
            <h2>Intelligence built for<br /><span>real operations.</span></h2>
            <p>Purpose-built platforms that turn complex operational data into clear, controlled decisions.</p>
          </div>

          <div className='product-showcase'>
            <article className='planvanta-card' id='planvanta'>
              <div className='planvanta-card__copy'>
                <img className='planvanta-card__logo' src='/resources/planvanta-logo.png' alt='Planvanta' />
                <p className='planvanta-card__eyebrow'>INTRODUCING PLANVANTA 2.0</p>
                <h3>Manufacturing Intelligence. <span>Connected.</span></h3>
                <p className='planvanta-card__body'>Planvanta 2.0 is Vantoryx Technologies' manufacturing planning and operational intelligence platform — bringing material planning, inventory, procurement, plant operations and management visibility into one connected environment.</p>
                <p className='planvanta-card__support'>Built for growing manufacturers. Designed for multi-plant operations. Engineered to turn operational data into clearer decisions.</p>
                <p className='planvanta-card__statement'>Plan Smarter. See Clearly. Operate with Confidence.</p>
                <div className='planvanta-card__actions'>
                  <a className='planvanta-card__primary' href='/products/planvanta'>Explore Planvanta 2.0 <ArrowRight size={17}/></a>
                  <a className='planvanta-card__secondary' href='#contact'>Request a Demo <ArrowRight size={17}/></a>
                </div>
              </div>
              <div className='planvanta-card__visual'>
                <div className='planvanta-card__sweep planvanta-card__sweep--one' aria-hidden='true' />
                <div className='planvanta-card__sweep planvanta-card__sweep--two' aria-hidden='true' />
                <div className='planvanta-card__halo' aria-hidden='true' />
                <img src='/resources/planvanta-interface.png' alt='Planvanta 2.0 Material Planning dashboard' />
              </div>
            </article>

            <article className='product-panel vendora-panel'>
              <div className='product-number'>02</div>
              <div className='product-body'>
                <div className='product-brand product-brand-official vendora-brand'>
                  <img src='/resources/vendora-logo.png' alt='VENDORA — Supplier Intelligence Platform' />
                </div>
                <p className='product-eyebrow'>DISCOVER · VERIFY · SOURCE</p>
                <h3>Find better suppliers.<br />Source with confidence.</h3>
                <p className='product-description'>Supplier intelligence designed to make discovery, qualification and sourcing decisions clearer and more structured.</p>
                <div className='product-tags'><span>Discovery</span><span>Verification</span><span>Supplier Intelligence</span></div>
                <a href='#vendora'>Explore VENDORA <ArrowRight size={17} /></a>
              </div>
              <div className='product-visual vendora-visual' aria-hidden='true'>
                <div className='supplier-network'>
                  <div className='network-rings'><i /><i /><i /></div>
                  <span className='network-hub'><ShieldCheck size={30} /><small>SUPPLIER<br/>INTELLIGENCE</small></span>
                  <span className='supplier-node sn1'>01</span><span className='supplier-node sn2'>02</span><span className='supplier-node sn3'>03</span><span className='supplier-node sn4'>04</span>
                  <span className='network-line nl1'/><span className='network-line nl2'/><span className='network-line nl3'/><span className='network-line nl4'/>
                </div>
                <div className='vendor-card vc1'><small>VERIFICATION</small><b>Verified supplier</b></div>
                <div className='vendor-card vc2'><small>RISK PROFILE</small><b>Low exposure</b></div>
                <div className='vendor-card vc3'><small>SOURCING</small><b>Qualified</b></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <span id='technology' className='anchor' />
      <span id='about' className='anchor' />
      <span id='contact' className='anchor' />
      </main>
    </>
  );
}
export default App;
/* deployment-sync: Planvanta homepage logo sizing */
