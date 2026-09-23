import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BarChart3, Layers3, Menu, Mouse, Settings2, ShieldCheck, X, Target, Share2, RefreshCw, Eye, TrendingUp } from 'lucide-react';

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
  // V7 premium light product visual system is deployed with this component.
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
        <div className='pv3-actions'><a href='mailto:demo@vantoryx.example?subject=Planvanta%202.0%20Demo%20Request' className='pv3-primary'>Request a Demo <ArrowRight size={16}/></a><a href='#platform'>Explore the Platform <ArrowRight size={16}/></a></div>
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
      <div className='pv3-architecture-head'><h2>Local operational control.<br/><em>Group-level visibility.</em></h2><p>Each plant maintains its own operational view while management receives consolidated visibility across the organisation.</p></div>
      <div className='pv3-network pv3-network--premium'>
        <div className='pv3-plants'><div><small>01</small><b>PLANT 01</b><span>Plant-level operational view</span></div><div><small>02</small><b>PLANT 02</b><span>Plant-level operational view</span></div><div><small>03</small><b>PLANT 03</b><span>Plant-level operational view</span></div></div>
        <div className='pv3-connectors'><i/><i/><i/></div>
        <div className='pv3-core'><small>ORGANISATION / GROUP</small><img src='/resources/planvanta-logo.png' alt='Planvanta'/><span>GROUP INTELLIGENCE</span><div><b>PLANT ISOLATION</b><b>CONNECTED VISIBILITY</b></div></div>
        <div className='pv3-arrow'><ArrowRight size={26}/></div>
        <div className='pv3-management'><small>MANAGEMENT VIEW</small><b>Consolidated Group<br/>Overview</b><span>Group-level visibility</span></div>
      </div>
      <div className='pv3-architecture-notes'><span>PLANT-LEVEL OPERATIONAL VIEWS</span><span>ISOLATED PLANT DATA</span><span>CONSOLIDATED GROUP VISIBILITY</span></div>
    </section>

    <section className='pv3-access'>
      <div className='pv3-access-copy'><p className='pv3-kicker'>05 / CONTROLLED VISIBILITY</p><h2>Right information.<br/><em>Right people.</em></h2><p>Access follows the operating structure. Users work within the organisations, plants, modules and dashboards made available to them, keeping operational visibility relevant and controlled.</p><div className='pv3-access-principles'><span>WORKSPACE ACCESS</span><span>PLANT ISOLATION</span><span>MODULE VISIBILITY</span></div></div>
      <div className='pv3-access-map'>
        <div className='pv3-access-path'>{['SYSTEM','ORGANISATION / GROUP','PLANT','MODULE','DASHBOARD','PERMISSION'].map((x,i)=><span key={x}><small>{String(i+1).padStart(2,'0')}</small><b>{x}</b><i/></span>)}</div>
        <p>CONTROLLED ACCESS PATH</p>
      </div>
    </section>

    <section className='pv3-origin'>
      <div><span>BUILT BY VANTORYX TECHNOLOGIES</span><h2>Built in Sri Lanka.<br/>Engineered for growing manufacturers.<br/><em>Designed to scale further.</em></h2></div>
      <p>Planvanta is developed around practical manufacturing and supply-chain requirements, with a product architecture designed to support growing operational complexity.</p>
    </section>

    <section className='pv3-final'>
      <div className='pv3-final-aura'/>
      <div className='pv3-final-inner'><img src='/resources/planvanta-logo.png' alt='Planvanta'/><p>MANUFACTURING INTELLIGENCE. CONNECTED.</p><h2>See what matters.<br/><em>Act with clarity.</em></h2><span>Bring material planning, inventory, procurement and operational visibility into one connected environment.</span><div className='pv3-actions'><a href='mailto:demo@vantoryx.example?subject=Planvanta%202.0%20Demo%20Request' className='pv3-primary'>Request a Demo <ArrowRight size={16}/></a><a href='mailto:hello@vantoryx.example?subject=Planvanta%20Enquiry'>Talk to Vantoryx <ArrowRight size={16}/></a></div><small>Developed by Vantoryx Technologies</small></div>
    </section>
  </main>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  if (window.location.pathname === '/products/planvanta') return <PlanvantaProductPage />;

  return <main className='vxh'>
    <section className='vxh-hero' id='home'>
      <CinematicWorld/>
      <div className='vxh-overlay'/>
      <header className='vxh-nav'>
        <a href='#home' className='vxh-brand'><img src='/resources/vantoryx-logo.png' alt='Vantoryx Technologies'/></a>
        <nav className={menuOpen ? 'open' : ''}>
          <a href='#home' onClick={()=>setMenuOpen(false)}>Home</a>
          <a href='#products' onClick={()=>setMenuOpen(false)}>Products</a>
          <a href='#solutions' onClick={()=>setMenuOpen(false)}>Solutions</a>
          <a href='#how' onClick={()=>setMenuOpen(false)}>How We Work</a>
          <a href='#about' onClick={()=>setMenuOpen(false)}>About</a>
          <a href='#contact' onClick={()=>setMenuOpen(false)}>Contact</a>
        </nav>
        <a className='vxh-nav-cta' href='#contact'>Discuss Your Requirement <ArrowRight size={14}/></a>
        <button className='vxh-menu' onClick={()=>setMenuOpen(!menuOpen)} aria-label='Toggle navigation'>{menuOpen?<X/>:<Menu/>}</button>
      </header>
      <div className='vxh-hero-copy'>
        <p>BUSINESS TECHNOLOGY · PRODUCTS · SOLUTIONS</p>
        <h1>Technology built<br/>around <em>your business.</em></h1>
        <h2>Products we develop. Solutions we design around you.</h2>
        <p className='vxh-lead'>Vantoryx Technologies develops intelligent business products and tailored digital solutions designed around real operational requirements.</p>
        <div className='vxh-actions'><a className='vxh-primary' href='#products'>Explore Our Products <ArrowRight size={16}/></a><a href='#contact'>Discuss Your Requirement <ArrowRight size={16}/></a></div>
      </div>
      <div className='vxh-hero-foot'><span>PLAN</span><span>CONNECT</span><span>AUTOMATE</span><span>UNDERSTAND</span><span>GROW</span></div>
    </section>

    <section className='vxh-paths'>
      <div className='vxh-wrap'>
        <div className='vxh-path-intro'>
          <div>
            <p className='vxh-kicker'>TWO WAYS TO WORK WITH VANTORYX</p>
            <h2>Use our technology where it fits.<br/><em>Or let us build around the requirement.</em></h2>
            <p className='vxh-path-lead'>Every business is different. Some need a proven platform. Others need a tailored solution. Vantoryx gives you both — practical technology built for real business operations.</p>
            <div className='vxh-path-principles'><span><Target/><i><b>PLAN</b><small>with clarity</small></i></span><span><Share2/><i><b>CONNECT</b><small>your data</small></i></span><span><RefreshCw/><i><b>AUTOMATE</b><small>your processes</small></i></span><span><Eye/><i><b>UNDERSTAND</b><small>what matters</small></i></span><span><TrendingUp/><i><b>GROW</b><small>with confidence</small></i></span></div>
          </div>
          
        </div>
        <div className='vxh-path-grid'>
          <article className='vxh-path-product'>
            <small>01 / VANTORYX PRODUCTS</small><h3>Purpose-built technology for real business operations.</h3>
            <p>We develop and commercialise our own software products designed around practical business and operational requirements.</p>
            <ul><li>Built from real operational requirements</li><li>Focused on everyday business use</li><li>Designed to evolve with the operation</li></ul>
            <div className='vxh-path-product-preview'><img src='/resources/planvanta-logo.png' alt='Planvanta'/><div className='vxh-device'><i/><img src='/resources/planvanta-interface.png' alt='Planvanta 2.0 interface'/></div><b>PLANVANTA 2.0</b><span>Manufacturing Intelligence. Connected.</span></div>
            <a href='#products'>Explore Products <ArrowRight size={15}/></a>
          </article>
          <article className='vxh-path-solutions'>
            <small>02 / BUSINESS SOLUTIONS</small><h3>Technology designed around your requirement.</h3>
            <p>Bring us an operational challenge, inefficient process, visibility gap or manual workflow. We work with you to understand the requirement and design an appropriate digital solution.</p>
            <div className='vxh-path-solution-list'><span><Settings2 size={18}/><b>Process Digitalisation</b><small>From manual to digital</small></span><span><Layers3 size={18}/><b>Workflow Automation</b><small>More efficient operations</small></span><span><BarChart3 size={18}/><b>Operational Dashboards</b><small>Clearer visibility</small></span><span><ShieldCheck size={18}/><b>Integration & Custom Solutions</b><small>Built around your business</small></span></div>
            <a href='#solutions'>Explore Solutions <ArrowRight size={15}/></a>
          </article>
        </div>
      </div>
    </section>

    <section className='vxh-products' id='products'>
      <div className='vxh-wrap'>
        <div className='vxh-section-head'><div><p className='vxh-kicker'>VANTORYX PRODUCTS</p><h2>Technology we build.<br/><em>Products businesses can use.</em></h2></div><p>Our portfolio is developed around real operational challenges — combining practical business understanding with technology designed for everyday use.</p></div>
        <div className='vxh-product-list'>
          {publicProducts.map(p=><article className='vxh-product' key={p.name}>
            <div className='vxh-product-copy'><small>{p.number} / VANTORYX PRODUCT</small><img src={p.logo} alt={p.name}/><p className='vxh-product-eyebrow'>{p.eyebrow}</p><h3>{p.title}</h3><p>{p.description}</p><b>{p.statement}</b><a href={p.href}>Explore {p.name} <ArrowRight size={16}/></a></div>
            <div className='vxh-product-visual'><img src={p.visual} alt={p.name+' interface'}/></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className='vxh-solutions' id='solutions'>
      <div className='vxh-wrap'>
        <div className='vxh-section-head vxh-section-head--light'><div><p className='vxh-kicker'>BUSINESS SOLUTIONS</p><h2>Your requirement.<br/><em>Our technology.</em></h2></div><p>Not every business challenge needs another off-the-shelf system. <b>Start with the operational problem. We design the technology around it.</b></p></div>
        <div className='vxh-solution-flow'><span>BUSINESS PROBLEM</span><ArrowRight/><span>REQUIREMENT</span><ArrowRight/><span>SOLUTION</span><ArrowRight/><span>VISIBILITY</span><ArrowRight/><span>IMPROVEMENT</span></div>
        <div className='vxh-solution-groups'>
          <section><small>DIGITALISE</small>{solutionCapabilities.filter(([n])=>n==='01'||n==='06').map(([n,t,d])=><article key={n}><i>{n}</i><h3>{t}</h3><p>{d}</p><span>Structured digital operations</span></article>)}</section>
          <section><small>CONNECT &amp; AUTOMATE</small>{solutionCapabilities.filter(([n])=>n==='04'||n==='05').map(([n,t,d])=><article key={n}><i>{n}</i><h3>{t}</h3><p>{d}</p><span>Connected workflows &amp; information</span></article>)}</section>
          <section><small>SEE &amp; CONTROL</small>{solutionCapabilities.filter(([n])=>n==='02'||n==='03').map(([n,t,d])=><article key={n}><i>{n}</i><h3>{t}</h3><p>{d}</p><span>Planning &amp; management visibility</span></article>)}</section>
        </div>
        <div className='vxh-problem vxh-problem--premium'>
          <div><p>YOU DON'T NEED TO ARRIVE WITH A SOFTWARE SPECIFICATION.</p><h3>Tell us the business problem.<br/><em>We'll help structure the technology around it.</em></h3><span>From an inefficient process to a visibility gap or disconnected workflow, start by telling us what needs to work better.</span><a href='#contact'>Discuss Your Requirement <ArrowRight size={16}/></a></div>
          <div className='vxh-problem-process'>{['UNDERSTAND','MAP','DESIGN','BUILD','IMPLEMENT','IMPROVE'].map((x,i)=><span key={x}><i>{String(i+1).padStart(2,'0')}</i>{x}</span>)}</div>
        </div>
      </div>
    </section>

    <section className='vxh-how' id='how'>
      <div className='vxh-wrap'>
        <p className='vxh-kicker'>HOW WE WORK</p>
        <h2>Business first.<br/><em>Technology second.</em></h2>
        <p className='vxh-how-lead'>We start by understanding how the operation works before deciding what technology should be built.</p>
        <div className='vxh-process'>{[
          ['01','Understand','Understand the business requirement, users and expected outcome.'],
          ['02','Map','Map workflows, information, responsibilities, controls and decision points.'],
          ['03','Design','Design how technology can simplify the process or improve visibility.'],
          ['04','Build','Turn the design into a working application, workflow, dashboard or integration.'],
          ['05','Implement','Bring the solution into the operation and establish the required workflow.'],
          ['06','Improve','Evolve the solution as the business and its requirements change.']
        ].map(([n,t,d])=><article key={n}><small>{n}</small><h3>{t}</h3><p>{d}</p></article>)}</div>
        <blockquote>We don't start by asking what software you want.<br/><b>We start by asking what your business needs to achieve.</b></blockquote>
      </div>
    </section>

    <section className='vxh-about' id='about'>
      <div className='vxh-wrap vxh-about-grid'>
        <div><p className='vxh-kicker'>ABOUT VANTORYX</p><h2>Technology should understand<br/><em>the business it serves.</em></h2></div>
        <div><p>Vantoryx Technologies is a Sri Lankan technology company developing business software products and tailored digital solutions around real operational requirements.</p><p>Effective business technology requires more than writing software. It requires understanding the process, the people using it, the information they need and the decisions they have to make.</p><div className='vxh-about-tags'><span>PRODUCTS</span><span>SOLUTIONS</span><span>INTELLIGENCE & AUTOMATION</span></div><h3>Built in Sri Lanka. <em>Designed to go further.</em></h3></div>
      </div>
    </section>

    <section className='vxh-contact' id='contact'>
      <div className='vxh-wrap'>
        <p className='vxh-kicker'>START A CONVERSATION</p>
        <h2>What does your business<br/><em>need to solve?</em></h2>
        <p className='vxh-contact-lead'>Whether you're interested in a Vantoryx product or need technology designed around a specific business requirement, start the conversation with us.</p>
        <div className='vxh-contact-grid'>
          <article><small>01 / PRODUCT</small><h3>Interested in Planvanta 2.0?</h3><p>Explore how an existing Vantoryx product could support your operation.</p><a href='/products/planvanta'>Explore Planvanta <ArrowRight size={15}/></a></article>
          <article><small>02 / BUSINESS REQUIREMENT</small><h3>Have a process or operational challenge?</h3><p>Tell us what you want to improve. We'll start by understanding the requirement before deciding what should be built.</p><a href='mailto:hello@vantoryx.example?subject=Business%20Requirement%20Enquiry'>Discuss Your Requirement <ArrowRight size={15}/></a><div className='vxh-contact-details'><span><b>Email</b> hello@vantoryx.example</span><span><b>Phone</b> +94 11 000 0000</span><span><b>Location</b> Colombo, Sri Lanka</span></div><em className='vxh-demo-note'>Temporary demonstration contact details — to be replaced before public launch.</em></article>
        </div>
      </div>
    </section>

    <footer className='vxh-footer'><div className='vxh-wrap'><img src='/resources/vantoryx-logo.png' alt='Vantoryx Technologies'/><p>Technology built around your business.</p><nav><a href='#products'>Products</a><a href='#solutions'>Solutions</a><a href='#how'>How We Work</a><a href='#about'>About</a><a href='#contact'>Contact</a></nav><small>© 2026 Vantoryx Technologies. All rights reserved.</small></div></footer>
  </main>;
}
export default App;
/* deployment-sync: temporary launch contact channels */
