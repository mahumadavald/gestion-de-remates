'use client'
import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const handleScroll = () => {
      const nav = document.getElementById('navbar');
      if (!nav) return;
      if (window.scrollY > 50) {
        nav.style.boxShadow = '0 1px 12px rgba(0,0,0,.08)';
      } else {
        nav.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, []);

  const WA_DEMO = "https://wa.me/56991453680?text=Hola%2C%20me%20interesa%20GR%20Auction%20Software.%20Mi%20nombre%20es%20____%20y%20soy%20de%20la%20casa%20de%20remates%20____";

  const bodyHTML = `<nav id="navbar">
  <a href="#" class="nav-logo">
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="rgba(6,182,212,.15)" stroke="rgba(6,182,212,.3)" stroke-width="1"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#06B6D4" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="#1a1a1a" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    </svg>
    <div>
      <div class="nav-logo-text">GR Auction Software</div>
    </div>
  </a>
  <div class="nav-links">
    <a href="#features">Características</a>
    <a href="#how">Cómo funciona</a>
    <a href="#pricing">Planes</a>
    <a href="#contact">Contacto</a>
  </div>
  <div class="nav-cta">
    <a href="${WA_DEMO}" target="_blank" class="btn-nav btn-nav-ghost">Solicitar demo</a>
    <a href="/dashboard" class="btn-nav btn-nav-solid">Iniciar sesión →</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero" id="top">
  <div class="hero-orb orb1"></div>
  <div class="hero-orb orb2"></div>
  
  <h1 class="hero-title">
    Los remates,<br/><span class="teal">reinventados.</span>
  </h1>
  <p class="hero-sub">Plataforma digital para gestionar, operar y escalar remates en cualquier lugar.</p>
  <div class="hero-btns">
    <a href="${WA_DEMO}" target="_blank" class="btn-primary">
      Solicitar demo
    </a>
    <a href="/dashboard" class="btn-secondary">Iniciar sesión →</a>
  </div>
  <div class="hero-stats">
    <div class="stat-item"><div class="stat-num">15<span class="blue">s</span></div><div class="stat-lbl">Adjudicación automática</div></div>
    <div class="stat-div"></div>
    <div class="stat-item"><div class="stat-num">0<span class="blue"> papel</span></div><div class="stat-lbl">Todo digital</div></div>
    <div class="stat-div"></div>
    <div class="stat-item"><div class="stat-num">100<span class="blue">%</span></div><div class="stat-lbl">Online y presencial</div></div>
  </div>

</section>

<!-- FEATURES -->
<section class="section" id="features">
  <div class="reveal">
    <div class="section-tag">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#14B8A6" stroke-width="1.5"/><path d="M6 3v3l2 1.5" stroke="#14B8A6" stroke-width="1.5" stroke-linecap="round"/></svg>
      Características
    </div>
    <h2 class="section-title">Todo lo que necesita tu casa de remates</h2>
    <p class="section-sub">Desde la inscripción del postor hasta la liquidación final — en un solo sistema.</p>
  </div>
  <div class="features-grid">
    <div class="feat-card reveal">
      <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg></div>
      <div class="feat-title">Sala en vivo híbrida</div>
      <div class="feat-desc">Presencial, online e híbrido en la misma sala. Adjudicación automática a los 15 segundos. Timer visual y feed de pujas en tiempo real.</div>
    </div>
    <div class="feat-card reveal">
      <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="2" width="16" height="16" rx="3"/><path d="M6 10h8M6 6h8M6 14h5"/></svg></div>
      <div class="feat-title">Liquidaciones automáticas</div>
      <div class="feat-desc">Al adjudicar se genera la liquidación con comisiones, IVA y gastos administrativos. PDF con el logo de tu casa, listo para imprimir y enviar.</div>
    </div>
    <div class="feat-card reveal">
      <div class="feat-icon" style="background:rgba(20,184,166,.1);border-color:rgba(20,184,166,.2);color:var(--teal)"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="7" r="4"/><path d="M2 18c0-4 3-6 7-6s7 2 7 6"/><path d="M15 3l2 2-4 4"/></svg></div>
      <div class="feat-title">Postores self-service</div>
      <div class="feat-desc">Página pública de inscripción por casa. Los postores se inscriben solos con validador RUT, suben su comprobante y tú los validas con un click.</div>
    </div>
    <div class="feat-card reveal">
      <div class="feat-icon" style="background:rgba(20,184,166,.1);border-color:rgba(20,184,166,.2);color:var(--teal)"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="4" width="16" height="13" rx="2"/><path d="M2 8h16M6 2v2M14 2v2"/></svg></div>
      <div class="feat-title">Display para proyector</div>
      <div class="feat-desc">Pantalla dedicada para sala con foto del lote, oferta actual en grande, timer visual y overlay de ADJUDICADO. Conecta cualquier pantalla o TV.</div>
    </div>
    <div class="feat-card reveal">
      <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 14l4-5 3 3 4-6 5 4"/><path d="M2 18h16"/></svg></div>
      <div class="feat-title">Reportes y balance</div>
      <div class="feat-desc">Balance económico por remate, estadísticas históricas, exportación CSV. Desglose de comisiones judiciales, concursales y privadas con IVA automático.</div>
    </div>
    <div class="feat-card reveal">
      <div class="feat-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M8 3v14M3 8h5M3 12h5"/></svg></div>
      <div class="feat-title">Multi-empresa</div>
      <div class="feat-desc">Cada casa tiene su propio acceso, logo, usuarios y datos. Control de licencias desde el panel de administración de GR Auction Software.</div>
    </div>
  </div>
</section>

<div class="divider"></div>

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="how-inner">
    <div class="reveal" style="text-align:center">
      <div class="section-tag" style="justify-content:center">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#14B8A6" stroke-width="1.5" stroke-linecap="round"/></svg>
        Cómo funciona
      </div>
      <h2 class="section-title" style="margin:0 auto 1rem;text-align:center">Del registro al remate en minutos</h2>
      <p class="section-sub" style="margin:0 auto;text-align:center">Flujo completo para martilleros, postores y administradores.</p>
    </div>
    <div class="steps-grid">
      <div class="step-card reveal">
        <div class="step-num">01</div>
        <div class="step-title">Crea tu casa</div>
        <div class="step-desc">Registra tu casa de remates con logo, datos del martillero público y configuración. Se generan tus URLs únicas al instante.</div>
      </div>
      <div class="step-card reveal">
        <div class="step-num">02</div>
        <div class="step-title">Inscribe postores</div>
        <div class="step-desc">Comparte el link público. Los postores se inscriben solos, suben su comprobante y tú los validas con un click desde el panel.</div>
      </div>
      <div class="step-card reveal">
        <div class="step-num">03</div>
        <div class="step-title">Remata en vivo</div>
        <div class="step-desc">Carga lotes con fotos, activa la sala en vivo y adjudica. Timer automático de 15 segundos. Proyecta el display en sala.</div>
      </div>
      <div class="step-card reveal">
        <div class="step-num">04</div>
        <div class="step-title">Liquida al instante</div>
        <div class="step-desc">Al cerrar el remate se generan todas las liquidaciones con el logo de tu casa. PDF listo para enviar, devoluciones organizadas, balance automático.</div>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="section" id="pricing">
  <div class="reveal" style="text-align:center">
    <div class="section-tag" style="justify-content:center">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="#14B8A6" stroke-width="1.5"/><path d="M4 6h4M6 4v4" stroke="#14B8A6" stroke-width="1.5" stroke-linecap="round"/></svg>
      Planes
    </div>
    <h2 class="section-title" style="margin:0 auto 1rem;text-align:center">Planes diseñados para cada casa de remates</h2>
    <p class="section-sub" style="margin:0 auto 3rem;text-align:center">Contáctanos y te armamos el plan que mejor se ajusta a tu operación.</p>
  </div>

  <div class="pricing-grid reveal">

    <div class="plan-card">
      <div class="plan-name">Básico</div>
      <div class="plan-desc">Para casas pequeñas que realizan pocos remates al mes y necesitan lo esencial.</div>
      <div style="margin:1.5rem 0 1.75rem;padding:1.25rem;background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.15);border-radius:10px;text-align:center">
        <div style="font-family:'Poppins', sans-serif;font-size:.72rem;font-weight:700;color:var(--blue);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.4rem">Precio</div>
        <div style="font-family:'Poppins', sans-serif;font-size:1.4rem;font-weight:800;color:var(--dark)">Consulta con nosotros</div>
        <div style="font-size:.72rem;color:var(--gray);margin-top:.3rem">Adaptado a tu volumen de remates</div>
      </div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Remates mensuales limitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Sala en vivo + display</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Liquidaciones PDF con logo</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Postores self-service</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Hasta 2 usuarios</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan btn-plan-outline">Consultar precio →</a>
    </div>

    <div class="plan-card featured">
      <div class="plan-badge">Más popular</div>
      <div class="plan-name">Profesional</div>
      <div class="plan-desc">Para casas activas con volumen regular de remates y varios usuarios operando.</div>
      <div style="margin:1.5rem 0 1.75rem;padding:1.25rem;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.3);border-radius:10px;text-align:center">
        <div style="font-family:'Poppins', sans-serif;font-size:.72rem;font-weight:700;color:var(--blue);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.4rem">Precio</div>
        <div style="font-family:'Poppins', sans-serif;font-size:1.4rem;font-weight:800;color:var(--dark)">Consulta con nosotros</div>
        <div style="font-size:.72rem;color:var(--gray);margin-top:.3rem">Adaptado a tu volumen de remates</div>
      </div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Remates ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Lotes ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Hasta 5 usuarios</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Todos los módulos</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Reportes avanzados + CSV</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Soporte prioritario</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan btn-plan-solid">Consultar precio →</a>
    </div>

    <div class="plan-card">
      <div class="plan-name">Enterprise</div>
      <div class="plan-desc">Para grupos con múltiples casas de remates o necesidades personalizadas.</div>
      <div style="margin:1.5rem 0 1.75rem;padding:1.25rem;background:rgba(20,184,166,.05);border:1px solid rgba(20,184,166,.15);border-radius:10px;text-align:center">
        <div style="font-family:'Poppins', sans-serif;font-size:.72rem;font-weight:700;color:var(--teal);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.4rem">Precio</div>
        <div style="font-family:'Poppins', sans-serif;font-size:1.4rem;font-weight:800;color:var(--dark)">A convenir</div>
        <div style="font-size:.72rem;color:var(--gray);margin-top:.3rem">Cotización personalizada</div>
      </div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Múltiples casas de remates</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Usuarios ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Onboarding personalizado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Panel admin dedicado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>SLA garantizado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Soporte 24/7</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan btn-plan-outline">Cotizar ahora →</a>
    </div>

  </div>
</section>

<div class="divider"></div>

<!-- CTA -->
<section class="cta-section" id="contact">
  <div class="reveal">
    <div class="section-tag" style="justify-content:center">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#14B8A6" stroke-width="1.5" stroke-linecap="round"/></svg>
      Contacto
    </div>
    <h2 class="section-title" style="margin:0 auto 1rem;text-align:center;max-width:700px">¿Listo para modernizar tu casa de remates?</h2>
    <p class="section-sub" style="margin:0 auto 2.5rem;text-align:center">Contáctanos y te configuramos todo en un día.</p>
    <div class="hero-btns">
      <a href="${WA_DEMO}" target="_blank" class="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L.057 23.492a.5.5 0 00.614.611l5.783-1.517A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.947 0-3.768-.497-5.35-1.367l-.383-.215-3.434.9.916-3.352-.234-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Solicitar demo
      </a>
      <a href="mailto:contacto@grauction.cl" class="btn-secondary">contacto@grauction.cl</a>
    </div>
    <div class="cta-contact">
      <a href="https://wa.me/56991453680" target="_blank" class="contact-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        +56 9 9145 3680
      </a>
      <a href="mailto:contacto@grauction.cl" class="contact-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        contacto@grauction.cl
      </a>
      <span class="contact-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        gestionderemates.cl
      </span>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div style="display:flex;align-items:center;gap:.75rem">
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="rgba(6,182,212,.12)" stroke="rgba(6,182,212,.2)" stroke-width="1"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#06B6D4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
    <div class="footer-copy">© 2025 GR Auction Software · gestionderemates.cl</div>
  </div>
  <div class="footer-links">
    <a href="#features">Características</a>
    <a href="#pricing">Planes</a>
    <a href="/dashboard">Iniciar sesión</a>
    <a href="mailto:contacto@grauction.cl">Contacto</a>
  </div>
</footer>`;

  return (
    <>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#ffffff;
  --navy:#f4f4f2;
  --blue:#06B6D4;
  --teal:#14B8A6;
  --white:#ffffff;
  --dark:#1a1a1a;
  --gray:#6b7280;
  --light:#1a1a1a;
  --border:#e5e7eb;
}
html{scroll-behavior:smooth;}
body{background:#fff;color:#1a1a1a;font-family:'Inter',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:#f4f4f2;}
::-webkit-scrollbar-thumb{background:var(--blue);border-radius:2px;}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:1.25rem 4rem;background:#fff;backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:all .3s;}
.nav-logo{display:flex;align-items:center;gap:.75rem;text-decoration:none;}
.nav-logo-text{font-family:'Poppins', sans-serif;font-weight:800;font-size:1.05rem;color:#1a1a1a;}
.nav-logo-sub{font-size:.6rem;color:var(--blue);letter-spacing:.1em;text-transform:uppercase;font-weight:500;}
.nav-links{display:flex;align-items:center;gap:2.5rem;}
.nav-links a{font-size:.82rem;font-weight:500;color:var(--gray);text-decoration:none;letter-spacing:.02em;transition:color .2s;}
.nav-links a:hover{color:#1a1a1a;}
.nav-cta{display:flex;align-items:center;gap:.75rem;}
.btn-nav{padding:.5rem 1.2rem;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'Inter',sans-serif;}
.btn-nav-ghost{background:transparent;border:1px solid var(--border);color:var(--gray);}
.btn-nav-ghost:hover{border-color:var(--blue);color:var(--blue);}
.btn-nav-solid{background:var(--blue);border:1px solid var(--blue);color:#fff;}
.btn-nav-solid:hover{background:#0284C7;}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8rem 2rem 4rem;position:relative;overflow:hidden;background:#fff;}
.hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(#e5e7eb 1px,transparent 1px),linear-gradient(90deg,#e5e7eb 1px,transparent 1px);background-size:60px 60px;opacity:.5;pointer-events:none;}
.hero-orb{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none;}
.orb1{width:600px;height:600px;background:rgba(6,182,212,.08);top:-200px;left:-100px;animation:orbFloat 8s ease-in-out infinite alternate;}
.orb2{width:400px;height:400px;background:rgba(20,184,166,.06);bottom:-100px;right:-50px;animation:orbFloat 10s ease-in-out infinite alternate-reverse;}
@keyframes orbFloat{from{transform:translate(0,0)}to{transform:translate(30px,40px)}}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem 1rem;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);border-radius:20px;font-size:.72rem;font-weight:600;color:var(--blue);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2rem;animation:fadeUp .6s ease both;}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.hero-title{font-family:'Poppins', sans-serif;font-size:clamp(2.8rem,6vw,5.5rem);font-weight:800;color:#1a1a1a;line-height:1.05;letter-spacing:-.03em;max-width:900px;animation:fadeUp .7s ease .1s both;position:relative;z-index:1;}
.hero-title .blue{color:var(--blue);}
.hero-title .teal{color:var(--teal);}
.hero-sub{font-size:clamp(.9rem,2vw,1.15rem);color:var(--gray);max-width:560px;margin:1.5rem auto 2.5rem;line-height:1.7;animation:fadeUp .7s ease .2s both;position:relative;z-index:1;}
.hero-btns{display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap;animation:fadeUp .7s ease .3s both;position:relative;z-index:1;}
.btn-primary{padding:.9rem 2rem;border-radius:8px;background:var(--blue);border:none;color:#fff;font-family:'Inter',sans-serif;font-size:.92rem;font-weight:700;text-decoration:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:.5rem;}
.btn-primary:hover{background:#0284C7;transform:translateY(-2px);box-shadow:0 12px 30px rgba(6,182,212,.3);}
.btn-secondary{padding:.9rem 2rem;border-radius:8px;background:transparent;border:1px solid var(--border);color:#1a1a1a;font-family:'Inter',sans-serif;font-size:.92rem;font-weight:600;text-decoration:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:.5rem;}
.btn-secondary:hover{border-color:var(--blue);color:var(--blue);}
.hero-stats{display:flex;align-items:center;gap:3rem;justify-content:center;margin-top:4rem;padding-top:3rem;border-top:1px solid var(--border);animation:fadeUp .7s ease .4s both;flex-wrap:wrap;position:relative;z-index:1;}
.stat-num{font-family:'Poppins', sans-serif;font-size:2rem;font-weight:800;color:#1a1a1a;line-height:1;}
.stat-num .blue{color:var(--blue);}
.stat-lbl{font-size:.72rem;color:var(--gray);text-transform:uppercase;letter-spacing:.08em;margin-top:.35rem;}
.stat-div{width:1px;height:40px;background:var(--border);}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}

/* SECTION */
.section{padding:7rem 4rem;max-width:1200px;margin:0 auto;}
.section-tag{display:inline-flex;align-items:center;gap:.4rem;font-size:.7rem;font-weight:700;color:var(--teal);letter-spacing:.12em;text-transform:uppercase;margin-bottom:1rem;}
.section-title{font-family:'Poppins', sans-serif;font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;color:#1a1a1a;line-height:1.15;letter-spacing:-.02em;max-width:600px;margin-bottom:1rem;}
.section-sub{font-size:.95rem;color:var(--gray);max-width:500px;line-height:1.7;}

/* FEATURES */
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4rem;}
.feat-card{padding:2rem;background:#fff;border:1px solid var(--border);border-radius:16px;transition:all .3s;position:relative;overflow:hidden;}
.feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--blue),var(--teal));opacity:0;transition:opacity .3s;}
.feat-card:hover{border-color:rgba(6,182,212,.4);transform:translateY(-4px);box-shadow:0 12px 32px rgba(6,182,212,.1);}
.feat-card:hover::before{opacity:1;}
.feat-icon{width:44px;height:44px;border-radius:10px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.2);display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;color:var(--blue);}
.feat-title{font-family:'Poppins', sans-serif;font-size:1rem;font-weight:700;color:#1a1a1a;margin-bottom:.5rem;}
.feat-desc{font-size:.83rem;color:var(--gray);line-height:1.65;}

/* HOW */
.how-section{padding:7rem 4rem;background:#f4f4f2;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.how-inner{max-width:1200px;margin:0 auto;}
.steps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;margin-top:4rem;position:relative;}
.steps-grid::before{content:'';position:absolute;top:22px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--blue),var(--teal),transparent);}
.step-card{text-align:center;position:relative;}
.step-num{width:44px;height:44px;border-radius:50%;background:#fff;border:2px solid var(--blue);display:flex;align-items:center;justify-content:center;font-family:'Inter', sans-serif;font-size:.82rem;font-weight:700;color:var(--blue);margin:0 auto 1.25rem;position:relative;z-index:1;box-shadow:0 0 0 5px #f4f4f2;}
.step-title{font-family:'Poppins', sans-serif;font-size:.95rem;font-weight:700;color:#1a1a1a;margin-bottom:.5rem;}
.step-desc{font-size:.8rem;color:var(--gray);line-height:1.6;}

/* PRICING */
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4rem;align-items:start;}
.plan-card{padding:2rem 1.75rem;background:#fff;border:1px solid var(--border);border-radius:16px;transition:all .3s;position:relative;}
.plan-card:hover{border-color:rgba(6,182,212,.3);box-shadow:0 8px 24px rgba(6,182,212,.08);}
.plan-card.featured{border-color:var(--blue);border-width:2px;transform:scale(1.03);box-shadow:0 12px 40px rgba(6,182,212,.15);}
.plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,var(--blue),var(--teal));color:#fff;font-size:.65rem;font-weight:700;padding:.25rem .85rem;border-radius:20px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.plan-name{font-family:'Poppins', sans-serif;font-size:1.1rem;font-weight:800;color:#1a1a1a;margin-bottom:.25rem;}
.plan-desc{font-size:.78rem;color:var(--gray);margin-bottom:1.5rem;line-height:1.5;}
.plan-features{list-style:none;display:flex;flex-direction:column;gap:.6rem;margin-bottom:2rem;}
.plan-features li{display:flex;align-items:center;gap:.6rem;font-size:.82rem;color:var(--gray);}
.plan-features li svg{color:var(--teal);flex-shrink:0;}
.btn-plan{width:100%;padding:.8rem;border-radius:8px;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;}
.btn-plan-outline{background:transparent;border:1px solid var(--border);color:#1a1a1a;}
.btn-plan-outline:hover{border-color:var(--blue);color:var(--blue);}
.btn-plan-solid{background:var(--blue);border:1px solid var(--blue);color:#fff;}
.btn-plan-solid:hover{background:#0284C7;}

/* CTA */
.cta-section{padding:7rem 4rem;text-align:center;position:relative;overflow:hidden;background:#f4f4f2;}
.cta-contact{display:flex;align-items:center;justify-content:center;gap:2rem;margin-top:3rem;flex-wrap:wrap;}
.contact-item{display:flex;align-items:center;gap:.65rem;font-size:.85rem;color:var(--gray);text-decoration:none;transition:color .2s;}
.contact-item:hover{color:var(--blue);}
.contact-item svg{color:var(--blue);flex-shrink:0;}

/* FOOTER */
footer{padding:3rem 4rem;border-top:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;}
.footer-copy{font-size:.78rem;color:var(--gray);}
.footer-links{display:flex;gap:1.5rem;}
.footer-links a{font-size:.78rem;color:var(--gray);text-decoration:none;transition:color .2s;}
.footer-links a:hover{color:var(--blue);}
.divider{width:100%;height:1px;background:var(--border);}

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
}`}</style>
      <div dangerouslySetInnerHTML={{__html: bodyHTML}} />
    </>
  );
}
