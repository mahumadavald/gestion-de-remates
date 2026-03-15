'use client'
export default function LandingPage() {
  return (
    <>
      <style>{`

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#0a0e17;--navy:#1F2937;--blue:#38B2F6;--teal:#14B8A6;--white:#ffffff;--gray:#94a3b8;--light:#e8f4fe;--border:rgba(255,255,255,.08);}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--light);font-family:'Inter',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--blue);border-radius:2px;}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:1.25rem 4rem;background:rgba(10,14,23,.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:all .3s;}
.nav-logo{display:flex;align-items:center;gap:.75rem;text-decoration:none;}
.nav-logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:1.05rem;color:var(--white);}
.nav-logo-sub{font-size:.6rem;color:var(--blue);letter-spacing:.1em;text-transform:uppercase;font-weight:500;}
.nav-links{display:flex;align-items:center;gap:2.5rem;}
.nav-links a{font-size:.82rem;font-weight:500;color:var(--gray);text-decoration:none;letter-spacing:.02em;transition:color .2s;}
.nav-links a:hover{color:var(--white);}
.nav-cta{display:flex;align-items:center;gap:.75rem;}
.btn-nav{padding:.5rem 1.2rem;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'Inter',sans-serif;}
.btn-nav-ghost{background:transparent;border:1px solid var(--border);color:var(--gray);}
.btn-nav-ghost:hover{border-color:var(--blue);color:var(--blue);}
.btn-nav-solid{background:var(--blue);border:1px solid var(--blue);color:#fff;}
.btn-nav-solid:hover{background:#5ec4f8;}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8rem 2rem 4rem;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(56,178,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(56,178,246,.04) 1px,transparent 1px);background-size:60px 60px;animation:gridDrift 30s linear infinite;pointer-events:none;}
@keyframes gridDrift{from{background-position:0 0}to{background-position:60px 60px}}
.hero-orb{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none;}
.orb1{width:600px;height:600px;background:rgba(56,178,246,.12);top:-200px;left:-100px;animation:orbFloat 8s ease-in-out infinite alternate;}
.orb2{width:400px;height:400px;background:rgba(20,184,166,.1);bottom:-100px;right:-50px;animation:orbFloat 10s ease-in-out infinite alternate-reverse;}
@keyframes orbFloat{from{transform:translate(0,0)}to{transform:translate(30px,40px)}}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem 1rem;background:rgba(56,178,246,.1);border:1px solid rgba(56,178,246,.25);border-radius:20px;font-size:.72rem;font-weight:600;color:var(--blue);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2rem;animation:fadeUp .6s ease both;}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.hero-title{font-family:'Syne',sans-serif;font-size:clamp(2.8rem,6vw,5.5rem);font-weight:800;color:var(--white);line-height:1.05;letter-spacing:-.03em;max-width:900px;animation:fadeUp .7s ease .1s both;}
.hero-title .blue{color:var(--blue);}
.hero-title .teal{color:var(--teal);}
.hero-sub{font-size:clamp(.9rem,2vw,1.15rem);color:var(--gray);max-width:560px;margin:1.5rem auto 2.5rem;line-height:1.7;animation:fadeUp .7s ease .2s both;}
.hero-btns{display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap;animation:fadeUp .7s ease .3s both;}
.btn-primary{padding:.9rem 2rem;border-radius:8px;background:var(--blue);border:none;color:#fff;font-family:'Inter',sans-serif;font-size:.92rem;font-weight:700;text-decoration:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:.5rem;}
.btn-primary:hover{background:#5ec4f8;transform:translateY(-2px);box-shadow:0 12px 30px rgba(56,178,246,.3);}
.btn-secondary{padding:.9rem 2rem;border-radius:8px;background:transparent;border:1px solid var(--border);color:var(--light);font-family:'Inter',sans-serif;font-size:.92rem;font-weight:600;text-decoration:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:.5rem;}
.btn-secondary:hover{border-color:var(--blue);color:var(--blue);}
.hero-stats{display:flex;align-items:center;gap:3rem;justify-content:center;margin-top:4rem;padding-top:3rem;border-top:1px solid var(--border);animation:fadeUp .7s ease .4s both;flex-wrap:wrap;}
.stat-num{font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:var(--white);line-height:1;}
.stat-num .blue{color:var(--blue);}
.stat-lbl{font-size:.72rem;color:var(--gray);text-transform:uppercase;letter-spacing:.08em;margin-top:.35rem;}
.stat-div{width:1px;height:40px;background:var(--border);}
.scroll-hint{position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.5rem;animation:fadeUp 1s ease .8s both;}
.scroll-line{width:1px;height:50px;background:linear-gradient(var(--blue),transparent);animation:scrollPulse 2s ease-in-out infinite;}
@keyframes scrollPulse{0%,100%{opacity:.3}50%{opacity:1}}
.scroll-txt{font-size:.62rem;color:var(--gray);letter-spacing:.12em;text-transform:uppercase;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}

/* SECTION */
.section{padding:7rem 4rem;max-width:1200px;margin:0 auto;}
.section-tag{display:inline-flex;align-items:center;gap:.4rem;font-size:.7rem;font-weight:700;color:var(--teal);letter-spacing:.12em;text-transform:uppercase;margin-bottom:1rem;}
.section-title{font-family:'Syne',sans-serif;font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;color:var(--white);line-height:1.15;letter-spacing:-.02em;max-width:600px;margin-bottom:1rem;}
.section-sub{font-size:.95rem;color:var(--gray);max-width:500px;line-height:1.7;}

/* FEATURES */
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4rem;}
.feat-card{padding:2rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:16px;transition:all .3s;position:relative;overflow:hidden;}
.feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--blue),var(--teal));opacity:0;transition:opacity .3s;}
.feat-card:hover{border-color:rgba(56,178,246,.25);transform:translateY(-4px);background:rgba(56,178,246,.04);}
.feat-card:hover::before{opacity:1;}
.feat-icon{width:44px;height:44px;border-radius:10px;background:rgba(56,178,246,.1);border:1px solid rgba(56,178,246,.2);display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;color:var(--blue);}
.feat-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:var(--white);margin-bottom:.5rem;}
.feat-desc{font-size:.83rem;color:var(--gray);line-height:1.65;}

/* HOW */
.how-section{padding:7rem 4rem;background:rgba(31,41,55,.3);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.how-inner{max-width:1200px;margin:0 auto;}
.steps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;margin-top:4rem;position:relative;}
.steps-grid::before{content:'';position:absolute;top:22px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--blue),var(--teal),transparent);}
.step-card{text-align:center;position:relative;}
.step-num{width:44px;height:44px;border-radius:50%;background:var(--navy);border:2px solid var(--blue);display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:.82rem;font-weight:700;color:var(--blue);margin:0 auto 1.25rem;position:relative;z-index:1;}
.step-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--white);margin-bottom:.5rem;}
.step-desc{font-size:.8rem;color:var(--gray);line-height:1.6;}

/* PRICING */
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4rem;align-items:start;}
.plan-card{padding:2rem 1.75rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:16px;transition:all .3s;position:relative;}
.plan-card.featured{background:rgba(56,178,246,.06);border-color:rgba(56,178,246,.4);transform:scale(1.03);}
.plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,var(--blue),var(--teal));color:#fff;font-size:.65rem;font-weight:700;padding:.25rem .85rem;border-radius:20px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.plan-name{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;color:var(--white);margin-bottom:.25rem;}
.plan-desc{font-size:.78rem;color:var(--gray);margin-bottom:1.5rem;line-height:1.5;}
.plan-price-num{font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:var(--white);line-height:1;}
.plan-price-num span{font-size:1rem;color:var(--gray);font-weight:400;}
.plan-price-sub{font-size:.72rem;color:var(--gray);margin-top:.3rem;margin-bottom:1.75rem;}
.plan-features{list-style:none;display:flex;flex-direction:column;gap:.6rem;margin-bottom:2rem;}
.plan-features li{display:flex;align-items:center;gap:.6rem;font-size:.82rem;color:var(--gray);}
.plan-features li svg{color:var(--teal);flex-shrink:0;}
.plan-features li.dim{opacity:.4;}
.plan-features li.dim svg{color:var(--gray);}
.btn-plan{width:100%;padding:.8rem;border-radius:8px;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;}
.btn-plan-outline{background:transparent;border:1px solid var(--border);color:var(--light);}
.btn-plan-outline:hover{border-color:var(--blue);color:var(--blue);}
.btn-plan-solid{background:var(--blue);border:1px solid var(--blue);color:#fff;}
.btn-plan-solid:hover{background:#5ec4f8;}

/* CTA */
.cta-section{padding:7rem 4rem;text-align:center;position:relative;overflow:hidden;}
.cta-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(56,178,246,.08) 0%,transparent 70%);pointer-events:none;}
.cta-contact{display:flex;align-items:center;justify-content:center;gap:2rem;margin-top:3rem;flex-wrap:wrap;}
.contact-item{display:flex;align-items:center;gap:.65rem;font-size:.85rem;color:var(--gray);text-decoration:none;transition:color .2s;}
.contact-item:hover{color:var(--blue);}
.contact-item svg{color:var(--blue);flex-shrink:0;}

/* FOOTER */
footer{padding:3rem 4rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;}
.footer-copy{font-size:.78rem;color:var(--gray);}
.footer-links{display:flex;gap:1.5rem;}
.footer-links a{font-size:.78rem;color:var(--gray);text-decoration:none;transition:color .2s;}
.footer-links a:hover{color:var(--blue);}
.divider{width:100%;height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);}

/* REVEAL */
.reveal{opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease;}
.reveal.visible{opacity:1;transform:none;}

/* RESPONSIVE */
@media(max-width:900px){
  nav{padding:1rem 1.5rem;}
  .nav-links{display:none;}
  .section,.how-section,.cta-section{padding:4rem 1.5rem;}
  .features-grid,.pricing-grid{grid-template-columns:1fr;}
  .steps-grid{grid-template-columns:1fr 1fr;}
  .steps-grid::before{display:none;}
  .plan-card.featured{transform:none;}
  footer{padding:2rem 1.5rem;flex-direction:column;text-align:center;}
  .stat-div{display:none;}
}

      `}</style>
      <div dangerouslySetInnerHTML={{__html: `` }} />
      <script dangerouslySetInnerHTML={{__html: `` }} />
    </>
  );
}
