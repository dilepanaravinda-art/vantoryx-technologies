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
  return <main className='pv-page'>
    <header className='pv-page-nav'>
      <a href='/' className='pv-page-vx'><img src='/resources/vantoryx-logo.png' alt='Vantoryx Technologies'/></a>
      <a href='/' className='pv-page-back'>Vantoryx Home <ArrowRight size={15}/></a>
    </header>

    <section className='pv-page-hero'>
      <div className='pv-page-hero-copy'>
        <img src='/resources/planvanta-logo.png' className='pv-page-logo' alt='Planvanta'/>
        <p className='pv-page-kicker'>MANUFACTURING PLANNING &amp; OPERATIONAL INTELLIGENCE</p>
        <h1>Plan Smarter.<br/>See Clearly.<br/><span>Operate with Confidence.</span></h1>
        <p className='pv-page-lead'><b>Planvanta 2.0</b> is a web-based manufacturing planning and operational intelligence platform designed to help growing manufacturers bring planning, inventory, procurement, production and management visibility into one connected environment.</p>
        <p className='pv-page-sub'>Developed by <b>Vantoryx Technologies</b>, Planvanta transforms operational data into practical, decision-ready information — helping teams move beyond fragmented spreadsheets and disconnected reporting.</p>
        <strong className='pv-page-mantra'>Smarter planning. Better visibility. Stronger decisions.</strong>
        <div className='pv-page-actions'><a className='pv-btn-primary' href='/#contact'>Request a Demo <ArrowRight size={16}/></a><a className='pv-btn-secondary' href='#platform'>Explore Planvanta <ArrowRight size={16}/></a></div>
      </div>
      <div className='pv-page-hero-visual'><div className='pv-page-glow'/><img src='/resources/planvanta-interface.png' alt='Planvanta 2.0 Material Planning interface'/></div>
    </section>

    <section className='pv-page-section pv-reality'>
      <div className='pv-section-copy'><p className='pv-page-kicker'>BUILT FOR THE REALITY OF MODERN MANUFACTURING</p><h2>Move beyond fragmented<br/><span>operational visibility.</span></h2><p>Growing manufacturers often manage critical decisions across spreadsheets, reports, emails and disconnected systems. The result can be slower planning cycles, limited visibility, inventory imbalance and valuable management time spent consolidating information instead of acting on it.</p><strong>Planvanta 2.0 brings those decisions together.</strong></div>
      <div className='pv-fragment-map'><div className='pv-source-row'><span>Spreadsheets</span><span>ERP Data</span><span>Purchase Orders</span><span>Inventory</span><span>Production Plans</span></div><div className='pv-flow-line'>↓</div><div className='pv-core'>PLANVANTA <b>2.0</b><small>ONE CONNECTED OPERATIONAL VIEW</small></div></div>
    </section>

    <section className='pv-page-section pv-architecture'>
      <div className='pv-centered'><p className='pv-page-kicker'>ONE PLATFORM. CONNECTED OPERATIONS.</p><h2>Designed around how manufacturing<br/><span>organisations actually operate.</span></h2><p>A business can manage multiple manufacturing plants within one environment while maintaining plant-specific data, configuration, access permissions and operational visibility.</p></div>
      <div className='pv-architecture-flow'>{['Organisation / Group','Plants','Modules','Dashboards','Decisions'].map((x,i)=><div className='pv-arch-step' key={x}><small>0{i+1}</small><b>{x}</b>{i<4&&<i>→</i>}</div>)}</div>
    </section>

    <section className='pv-page-section pv-platform' id='platform'>
      <div className='pv-centered'><p className='pv-page-kicker'>EXPLORE THE PLATFORM</p><h2>Manufacturing intelligence<br/><span>in one environment.</span></h2><p>Planvanta brings focused operational capabilities together so planners and management can work from a clearer, more consistent view of the business.</p></div>
      <div className='pv-cap-grid'>{planvantaCapabilities.map(([t,d],i)=><article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{d}</p></article>)}</div>
      <div className='pv-product-proof'><div><p className='pv-page-kicker'>REAL PLANVANTA 2.0 INTERFACE</p><h3>See what needs attention.<br/><span>Act with clearer visibility.</span></h3><p>The interface brings planning status, material risk, purchase-order visibility and operational indicators into focused management views.</p></div><img src='/resources/planvanta-interface.png' alt='Planvanta 2.0 operational dashboard'/></div>
    </section>

    <section className='pv-page-section pv-decision'>
      <div className='pv-centered'><p className='pv-page-kicker'>FROM DATA TO DECISION</p><h2>A structured path from<br/><span>information to action.</span></h2></div>
      <div className='pv-decision-flow'>{[
        ['CONNECT','Bring supported operational information into Planvanta.'],
        ['STRUCTURE','Organise information around groups, plants, modules and responsibilities.'],
        ['CALCULATE','Apply standardised planning logic with authorised plant parameters.'],
        ['VISUALISE','Turn operational data into focused dashboards and indicators.'],
        ['IDENTIFY','Highlight shortages, requirements, trends and exceptions.'],
        ['ACT','Give teams decision-ready information for informed action.']
      ].map(([t,d],i)=><article key={t}><b>{String(i+1).padStart(2,'0')}</b><h3>{t}</h3><p>{d}</p></article>)}</div>
    </section>

    <section className='pv-page-section pv-questions'>
      <div className='pv-section-copy'><p className='pv-page-kicker'>MANUFACTURING INTELLIGENCE IN ACTION</p><h2>Designed around practical<br/><span>manufacturing decisions.</span></h2><p>Planvanta is not intended to replace human operational judgement. It is designed to strengthen it with structured calculations, dashboards and decision-support information.</p></div>
      <div className='pv-question-list'>{['What materials require attention?','Where are inventory risks developing?','Which purchase orders need follow-up?','How is material availability changing?','What does management need to see now?'].map(q=><div key={q}><span>↗</span>{q}</div>)}</div>
    </section>

    <section className='pv-page-section pv-multiplant'>
      <div className='pv-centered'><p className='pv-page-kicker'>MULTI-PLANT BY DESIGN</p><h2>Local operational control.<br/><span>Group-level visibility.</span></h2><p>Each plant can maintain its own operational data and authorised configuration while management receives consolidated organisational visibility — creating a common planning framework without removing the operational identity of individual plants.</p></div>
      <div className='pv-plant-flow'><div><span>PLANT A</span><span>PLANT B</span><span>PLANT C</span></div><i>→</i><strong>GROUP<br/><em>INTELLIGENCE</em></strong></div>
    </section>

    <section className='pv-page-section pv-growth'>
      <div className='pv-growth-copy'><p className='pv-page-kicker'>DESIGNED FOR GROWING MANUFACTURERS</p><h2>Enterprise thinking.<br/><span>Without enterprise complexity.</span></h2><p>Planvanta is designed for manufacturers that need better systems as operations become more complex, without adding unnecessary layers of traditional enterprise complexity.</p><p>Its web-based, configurable foundation supports a structured operational intelligence environment while retaining the flexibility growing organisations require.</p></div>
      <div className='pv-access-card'><small>RIGHT INFORMATION. RIGHT PEOPLE.</small><h3>Controlled visibility across the organisation.</h3><div className='pv-access-flow'>System <b>→</b> Organisation <b>→</b> Plant <b>→</b> Module <b>→</b> Dashboard <b>→</b> Permission</div><p>Role- and permission-based access principles help organisations control which plants, modules, dashboards and functions are available to different users.</p></div>
    </section>

    <section className='pv-page-section pv-why'>
      <div className='pv-centered'><p className='pv-page-kicker'>WHY PLANVANTA?</p><h2>A scalable foundation for<br/><span>clearer operations.</span></h2></div>
      <div className='pv-why-grid'>{[
        ['Connected Visibility','Bring important planning and operational information into one structured environment.'],
        ['Multi-Plant Architecture','Manage individual plants while maintaining consolidated organisational visibility.'],
        ['Manufacturing-Focused Planning','Designed around real material, inventory, procurement and operational planning requirements.'],
        ['Configurable Operations','Support common organisational standards alongside authorised plant-specific parameters.'],
        ['Role-Based Access','Provide users with access appropriate to their plants, modules and responsibilities.'],
        ['Decision-Ready Dashboards','Move beyond raw data toward information designed for operational action.']
      ].map(([t,d])=><article key={t}><h3>{t}</h3><p>{d}</p></article>)}</div>
    </section>

    <section className='pv-origin'><p>BUILT BY VANTORYX TECHNOLOGIES</p><h2>Built in Sri Lanka.<br/>Engineered for growing manufacturers.<br/><span>Designed to scale further.</span></h2></section>

    <section className='pv-final'>
      <img src='/resources/planvanta-logo.png' alt='Planvanta'/>
      <p className='pv-page-kicker'>MANUFACTURING PLANNING &amp; OPERATIONAL INTELLIGENCE</p>
      <h2>Make Your Operations<br/><span>Easier to See.</span></h2>
      <p>Your business already generates the data.<br/><b>Planvanta helps turn it into decisions.</b></p>
      <div className='pv-page-actions'><a className='pv-btn-primary' href='/#contact'>Request a Demo <ArrowRight size={16}/></a><a className='pv-btn-secondary' href='/#contact'>Talk to Vantoryx <ArrowRight size={16}/></a></div>
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