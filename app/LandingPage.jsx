'use client'
import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 90);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const handleScroll = () => {
      const nav = document.getElementById('navbar');
      if (!nav) return;
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, []);

  const WA_DEMO = "https://wa.me/56991453680?text=Hola%2C%20me%20interesa%20GR%20Auction%20Software.%20Mi%20nombre%20es%20____%20y%20soy%20de%20la%20casa%20de%20remates%20____";

  const bodyHTML = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

<nav id="navbar">
  <a href="#" class="nav-logo">
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="rgba(56,178,246,.12)" stroke="rgba(56,178,246,.3)" stroke-width="1"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="#14B8A6" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="nav-logo-text">GR Auction</span>
  </a>
  <div class="nav-links">
    <a href="#features">Características</a>
    <a href="#how">Cómo funciona</a>
    <a href="#pricing">Planes</a>
    <a href="#contact">Contacto</a>
  </div>
  <div class="nav-cta">
    <a href="${WA_DEMO}" target="_blank" class="btn-nav btn-ghost">Demo</a>
    <a href="/dashboard" class="btn-nav btn-solid">Ingresar →</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero" id="top">
  <div class="hero-grid"></div>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="orb orb3"></div>

  <div class="hero-inner">
    <div class="hero-badge reveal">
      <span class="badge-dot"></span>
      PLATAFORMA DE REMATES ONLINE
    </div>

    <h1 class="hero-title reveal">
      Los remates,<br/><em>reinventados.</em>
    </h1>

    <p class="hero-sub reveal">
      Plataforma digital para gestionar, operar y escalar<br/>
      remates en cualquier lugar del mundo.
    </p>

    <div class="hero-btns reveal">
      <a href="${WA_DEMO}" target="_blank" class="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L.057 23.492a.5.5 0 00.614.611l5.783-1.517A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.947 0-3.768-.497-5.35-1.367l-.383-.215-3.434.9.916-3.352-.234-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Solicitar demo
      </a>
      <a href="/dashboard" class="btn-outline">Iniciar sesión →</a>
    </div>

    <div class="stats-bar reveal">
      <div class="stat">
        <div class="stat-num">15<span>s</span></div>
        <div class="stat-lbl">Adjudicación automática</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat-num">0<span> papel</span></div>
        <div class="stat-lbl">Todo 100% digital</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat-num">∞<span></span></div>
        <div class="stat-lbl">Online y presencial</div>
      </div>
    </div>

    <!-- Dashboard mockup -->
    <div class="dash-mockup reveal">
      <div class="dash-bar">
        <div class="dash-dot" style="background:#f85149"></div>
        <div class="dash-dot" style="background:#d29922"></div>
        <div class="dash-dot" style="background:#3fb950"></div>
        <span class="dash-url">gestionderemates.cl/sala</span>
      </div>
      <div class="dash-body">
        <div class="dash-sidebar">
          <div class="ds-logo">GR Auction</div>
          <div class="ds-item active">● Sala en vivo</div>
          <div class="ds-item">  Lotes</div>
          <div class="ds-item">  Postores</div>
          <div class="ds-item">  Liquidaciones</div>
        </div>
        <div class="dash-content">
          <div class="dc-header">
            <div class="dc-title">LOTE 04 DE 12 · MUEBLES</div>
            <div class="dc-badge">● EN VIVO</div>
          </div>
          <div class="dc-lote">Escritorio de roble macizo</div>
          <div class="dc-price">$480.000</div>
          <div class="dc-sub">Próxima puja: $530.000 · Incremento: $50K</div>
          <div class="dc-ring">
            <div class="ring-inner">12s</div>
          </div>
          <div class="dc-bids">
            <div class="dc-bid"><span class="bid-who">Paleta 07</span><span class="bid-amt">$480.000</span></div>
            <div class="dc-bid muted"><span class="bid-who">Paleta 03</span><span class="bid-amt">$430.000</span></div>
            <div class="dc-bid muted"><span class="bid-who">Online #12</span><span class="bid-amt">$380.000</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="section" id="features">
  <div class="section-header reveal">
    <div class="section-tag">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#14B8A6"/></svg>
      CARACTERÍSTICAS
    </div>
    <h2 class="section-title">Todo lo que necesita<br/>tu casa de remates</h2>
    <p class="section-sub">Desde la inscripción del postor hasta la liquidación final — en un solo sistema.</p>
  </div>

  <div class="feat-grid">
    <div class="feat-card reveal">
      <div class="feat-icon blue-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <div class="feat-label">SALA EN VIVO</div>
      <div class="feat-title">Híbrida en tiempo real</div>
      <div class="feat-desc">Presencial, online e híbrido en la misma sala. Timer automático de 15 segundos. Feed de pujas y display para proyector incluido.</div>
    </div>

    <div class="feat-card reveal">
      <div class="feat-icon blue-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
      </div>
      <div class="feat-label">POST-REMATE</div>
      <div class="feat-title">Liquidaciones automáticas</div>
      <div class="feat-desc">Al adjudicar se genera la liquidación con comisiones, IVA y gastos. PDF con tu logo listo para enviar al instante.</div>
    </div>

    <div class="feat-card reveal">
      <div class="feat-icon teal-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      </div>
      <div class="feat-label">POSTORES</div>
      <div class="feat-title">Self-service público</div>
      <div class="feat-desc">Página pública por casa. Los postores se inscriben solos con validador RUT, suben comprobante y tú validas con un click.</div>
    </div>

    <div class="feat-card reveal">
      <div class="feat-icon teal-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      </div>
      <div class="feat-label">DISPLAY</div>
      <div class="feat-title">Pantalla para proyector</div>
      <div class="feat-desc">Pantalla dedicada con foto del lote, oferta en grande, timer visual y overlay de ADJUDICADO. Conecta cualquier TV o pantalla.</div>
    </div>

    <div class="feat-card reveal">
      <div class="feat-icon blue-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="feat-label">FINANZAS</div>
      <div class="feat-title">Reportes y balance</div>
      <div class="feat-desc">Balance económico por remate, estadísticas históricas, exportación CSV. Desglose de comisiones con IVA automático.</div>
    </div>

    <div class="feat-card reveal">
      <div class="feat-icon teal-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 9h20M9 21h6M12 17v4"/></svg>
      </div>
      <div class="feat-label">MULTI-TENANT</div>
      <div class="feat-title">Varias casas, un sistema</div>
      <div class="feat-desc">Cada casa tiene su propio acceso, logo, usuarios y datos separados. Panel de administración centralizado para todo el grupo.</div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="section-header reveal" style="text-align:center;align-items:center">
    <div class="section-tag" style="justify-content:center">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#38B2F6"/></svg>
      CÓMO FUNCIONA
    </div>
    <h2 class="section-title" style="text-align:center;max-width:600px;margin:0 auto">Del registro al remate<br/>en minutos</h2>
    <p class="section-sub" style="text-align:center;margin:0 auto">Flujo completo para martilleros, postores y administradores.</p>
  </div>

  <div class="steps-grid">
    <div class="step reveal">
      <div class="step-num">01</div>
      <div class="step-connector"></div>
      <div class="step-body">
        <div class="step-title">Crea tu casa</div>
        <div class="step-desc">Registra tu casa de remates con logo, datos del martillero público y configuración. Se generan tus URLs únicas al instante.</div>
      </div>
    </div>
    <div class="step reveal">
      <div class="step-num">02</div>
      <div class="step-connector"></div>
      <div class="step-body">
        <div class="step-title">Inscribe postores</div>
        <div class="step-desc">Comparte el link público. Los postores se inscriben solos, suben su comprobante y tú los validas con un click desde el panel.</div>
      </div>
    </div>
    <div class="step reveal">
      <div class="step-num">03</div>
      <div class="step-connector"></div>
      <div class="step-body">
        <div class="step-title">Remata en vivo</div>
        <div class="step-desc">Carga lotes con fotos, activa la sala en vivo y adjudica. Timer automático de 15 segundos. Proyecta el display en sala.</div>
      </div>
    </div>
    <div class="step reveal">
      <div class="step-num">04</div>
      <div class="step-body">
        <div class="step-title">Liquida al instante</div>
        <div class="step-desc">Al cerrar el remate se generan todas las liquidaciones con tu logo. PDF listo para enviar, balance automático.</div>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="section" id="pricing">
  <div class="section-header reveal" style="align-items:center;text-align:center">
    <div class="section-tag" style="justify-content:center">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#14B8A6"/></svg>
      PLANES
    </div>
    <h2 class="section-title" style="text-align:center;margin:0 auto">Planes para cada<br/>casa de remates</h2>
    <p class="section-sub" style="text-align:center;margin:0 auto">Contáctanos y te armamos el plan que mejor se ajusta a tu operación.</p>
  </div>

  <div class="pricing-grid">
    <div class="plan-card reveal">
      <div class="plan-tier">BÁSICO</div>
      <div class="plan-name">Para comenzar</div>
      <div class="plan-price">Consulta con nosotros</div>
      <div class="plan-price-sub">Adaptado a tu volumen</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Remates mensuales limitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Sala en vivo + display</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Liquidaciones PDF con logo</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Postores self-service</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Hasta 2 usuarios</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan-outline">Consultar precio →</a>
    </div>

    <div class="plan-card featured reveal">
      <div class="plan-popular">Más popular</div>
      <div class="plan-tier" style="color:#38B2F6">PROFESIONAL</div>
      <div class="plan-name">Para casas activas</div>
      <div class="plan-price">Consulta con nosotros</div>
      <div class="plan-price-sub">Adaptado a tu volumen</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#38B2F6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Remates ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#38B2F6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Lotes ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#38B2F6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Hasta 5 usuarios</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#38B2F6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Todos los módulos</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#38B2F6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Reportes avanzados + CSV</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#38B2F6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Soporte prioritario</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan-solid">Consultar precio →</a>
    </div>

    <div class="plan-card reveal">
      <div class="plan-tier" style="color:#14B8A6">ENTERPRISE</div>
      <div class="plan-name">Para grupos</div>
      <div class="plan-price">A convenir</div>
      <div class="plan-price-sub">Cotización personalizada</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Múltiples casas de remates</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Usuarios ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Onboarding personalizado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Panel admin dedicado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>SLA garantizado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#14B8A6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Soporte 24/7</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan-outline">Cotizar ahora →</a>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section" id="contact">
  <div class="cta-orb"></div>
  <div class="cta-inner reveal">
    <div class="section-tag" style="justify-content:center">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#38B2F6"/></svg>
      CONTACTO
    </div>
    <h2 class="cta-title">¿Listo para modernizar<br/>tu casa de remates?</h2>
    <p class="cta-sub">Contáctanos y te configuramos todo en un día.</p>
    <div class="cta-btns">
      <a href="${WA_DEMO}" target="_blank" class="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L.057 23.492a.5.5 0 00.614.611l5.783-1.517A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.947 0-3.768-.497-5.35-1.367l-.383-.215-3.434.9.916-3.352-.234-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Solicitar demo
      </a>
      <a href="mailto:contacto@grauction.cl" class="btn-outline">contacto@grauction.cl</a>
    </div>
    <div class="contact-row">
      <a href="https://wa.me/56991453680" target="_blank" class="contact-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        +56 9 9145 3680
      </a>
      <a href="mailto:contacto@grauction.cl" class="contact-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        contacto@grauction.cl
      </a>
      <span class="contact-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        gestionderemates.cl
      </span>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="rgba(56,178,246,.1)" stroke="rgba(56,178,246,.2)" stroke-width="1"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="#14B8A6" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="footer-copy">© 2025 GR Auction Software · gestionderemates.cl</span>
  </div>
  <div class="footer-links">
    <a href="#features">Características</a>
    <a href="#pricing">Planes</a>
    <a href="/dashboard">Ingresar</a>
    <a href="mailto:contacto@grauction.cl">Contacto</a>
  </div>
</footer>`;

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#0d1117;
  --surface:#161b22;
  --surface-2:#21262d;
  --border:#30363d;
  --border-hover:#38B2F6;
  --text:#e6edf3;
  --muted:#8b949e;
  --subtle:#484f58;
  --primary:#38B2F6;
  --primary-dark:#1E90D4;
  --teal:#14B8A6;
  --teal-dark:#0D9488;
  --success:#3fb950;
  --warning:#d29922;
  --danger:#f85149;
}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:var(--surface);}
::-webkit-scrollbar-thumb{background:var(--primary);border-radius:2px;}

/* NAV */
nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:1.25rem 4rem;
  background:rgba(13,17,23,0.7);
  backdrop-filter:blur(24px);
  border-bottom:1px solid transparent;
  transition:all .3s ease;
}
nav.scrolled{background:rgba(13,17,23,0.92);border-bottom-color:var(--border);}
.nav-logo{display:flex;align-items:center;gap:.7rem;text-decoration:none;}
.nav-logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--text);}
.nav-links{display:flex;align-items:center;gap:2.5rem;}
.nav-links a{font-size:.82rem;font-weight:500;color:var(--muted);text-decoration:none;letter-spacing:.02em;transition:color .2s;}
.nav-links a:hover{color:var(--text);}
.nav-cta{display:flex;align-items:center;gap:.75rem;}
.btn-nav{padding:.45rem 1.1rem;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'Inter',sans-serif;}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--muted);}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);}
.btn-solid{background:var(--primary);border:1px solid var(--primary);color:#fff;}
.btn-solid:hover{background:var(--primary-dark);}

/* HERO */
.hero{
  min-height:100vh;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:9rem 2rem 5rem;
  position:relative;overflow:hidden;
}
.hero-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(var(--border) 1px,transparent 1px),
    linear-gradient(90deg,var(--border) 1px,transparent 1px);
  background-size:64px 64px;
  opacity:.18;
  pointer-events:none;
  mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent);
}
.orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;animation:float 10s ease-in-out infinite alternate;}
.orb1{width:700px;height:700px;background:rgba(56,178,246,.07);top:-200px;left:-150px;animation-duration:12s;}
.orb2{width:500px;height:500px;background:rgba(20,184,166,.06);bottom:-150px;right:-100px;animation-duration:9s;animation-direction:alternate-reverse;}
.orb3{width:300px;height:300px;background:rgba(56,178,246,.05);top:40%;left:50%;animation-duration:15s;}
@keyframes float{from{transform:translate(0,0)}to{transform:translate(40px,50px)}}

.hero-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;max-width:900px;margin:0 auto;}

.hero-badge{
  display:inline-flex;align-items:center;gap:.5rem;
  padding:.35rem 1rem;
  background:rgba(56,178,246,.08);
  border:1px solid rgba(56,178,246,.2);
  border-radius:20px;
  font-size:.68rem;font-weight:700;color:var(--primary);
  letter-spacing:.12em;text-transform:uppercase;
  margin-bottom:2rem;
  animation:fadeUp .6s ease both;
}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}

.hero-title{
  font-family:'Syne',sans-serif;
  font-size:clamp(3rem,7vw,6rem);
  font-weight:800;
  color:var(--text);
  line-height:1.02;
  letter-spacing:-.03em;
  margin-bottom:1.5rem;
  animation:fadeUp .7s ease .1s both;
}
.hero-title em{
  font-style:normal;
  background:linear-gradient(135deg,var(--primary),var(--teal));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.hero-sub{
  font-size:clamp(.95rem,2vw,1.15rem);
  color:var(--muted);
  max-width:520px;
  line-height:1.75;
  margin-bottom:2.5rem;
  animation:fadeUp .7s ease .2s both;
}
.hero-btns{
  display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap;
  margin-bottom:4rem;
  animation:fadeUp .7s ease .3s both;
}
.btn-primary{
  padding:.875rem 1.75rem;border-radius:8px;
  background:var(--primary);border:none;color:#fff;
  font-family:'Inter',sans-serif;font-size:.9rem;font-weight:700;
  text-decoration:none;cursor:pointer;transition:all .2s;
  display:inline-flex;align-items:center;gap:.5rem;
}
.btn-primary:hover{background:var(--primary-dark);transform:translateY(-2px);}
.btn-outline{
  padding:.875rem 1.75rem;border-radius:8px;
  background:transparent;border:1px solid var(--border);
  color:var(--text);font-family:'Inter',sans-serif;
  font-size:.9rem;font-weight:600;
  text-decoration:none;cursor:pointer;transition:all .2s;
}
.btn-outline:hover{border-color:var(--primary);color:var(--primary);}

.stats-bar{
  display:flex;align-items:center;gap:3rem;justify-content:center;
  padding:2rem 3rem;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:12px;
  margin-bottom:3.5rem;
  animation:fadeUp .7s ease .4s both;
  flex-wrap:wrap;gap:2rem;
}
.stat{text-align:center;}
.stat-num{
  font-family:'DM Mono',monospace;
  font-size:1.75rem;font-weight:500;
  color:var(--text);line-height:1;
}
.stat-num span{color:var(--primary);font-size:1.2rem;}
.stat-lbl{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:.4rem;}
.stat-sep{width:1px;height:36px;background:var(--border);}

/* DASHBOARD MOCKUP */
.dash-mockup{
  width:100%;max-width:820px;
  border:1px solid var(--border);
  border-radius:12px;
  overflow:hidden;
  background:var(--surface);
  animation:fadeUp .8s ease .5s both;
  box-shadow:0 24px 80px rgba(0,0,0,.5);
}
.dash-bar{
  display:flex;align-items:center;gap:.5rem;
  padding:.75rem 1rem;
  background:var(--surface-2);
  border-bottom:1px solid var(--border);
}
.dash-dot{width:10px;height:10px;border-radius:50%;}
.dash-url{
  flex:1;text-align:center;
  font-family:'DM Mono',monospace;
  font-size:.72rem;color:var(--muted);
}
.dash-body{display:flex;min-height:280px;}
.dash-sidebar{
  width:160px;flex-shrink:0;
  background:rgba(13,17,23,.6);
  border-right:1px solid var(--border);
  padding:1rem .75rem;
  display:flex;flex-direction:column;gap:.3rem;
}
.ds-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:.85rem;color:var(--text);margin-bottom:.75rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);}
.ds-item{font-size:.72rem;color:var(--muted);padding:.35rem .5rem;border-radius:5px;cursor:pointer;}
.ds-item.active{background:rgba(56,178,246,.1);color:var(--primary);border-left:2px solid var(--primary);}
.dash-content{flex:1;padding:1.25rem 1.5rem;text-align:left;}
.dc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;}
.dc-title{font-size:.65rem;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;}
.dc-badge{font-size:.65rem;font-weight:700;color:var(--danger);letter-spacing:.06em;animation:pulse 2s infinite;}
.dc-lote{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:.4rem;}
.dc-price{font-family:'DM Mono',monospace;font-size:2rem;font-weight:500;color:var(--primary);line-height:1;margin-bottom:.3rem;}
.dc-sub{font-size:.7rem;color:var(--muted);margin-bottom:1rem;}
.dc-ring{
  display:inline-flex;align-items:center;justify-content:center;
  width:52px;height:52px;border-radius:50%;
  border:3px solid var(--primary);
  margin-bottom:1rem;
}
.ring-inner{font-family:'DM Mono',monospace;font-size:.9rem;font-weight:500;color:var(--primary);}
.dc-bids{display:flex;flex-direction:column;gap:.3rem;}
.dc-bid{display:flex;justify-content:space-between;align-items:center;padding:.3rem .5rem;background:rgba(56,178,246,.06);border-radius:5px;font-size:.72rem;}
.dc-bid.muted{background:transparent;opacity:.5;}
.bid-who{color:var(--text);}
.bid-amt{font-family:'DM Mono',monospace;color:var(--primary);}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}

/* SECTION */
.section{padding:7rem 4rem;max-width:1280px;margin:0 auto;}
.section-header{display:flex;flex-direction:column;gap:.75rem;margin-bottom:4rem;}
.section-tag{display:inline-flex;align-items:center;gap:.5rem;font-size:.68rem;font-weight:700;color:var(--teal);letter-spacing:.14em;text-transform:uppercase;}
.section-title{font-family:'Syne',sans-serif;font-size:clamp(1.8rem,3.5vw,2.75rem);font-weight:800;color:var(--text);line-height:1.12;letter-spacing:-.02em;}
.section-sub{font-size:.9rem;color:var(--muted);max-width:480px;line-height:1.7;}

/* FEATURES */
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
.feat-card{
  padding:1.75rem;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:12px;
  transition:all .25s ease;
  position:relative;overflow:hidden;
}
.feat-card::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--primary),var(--teal));
  opacity:0;transition:opacity .25s;
}
.feat-card:hover{border-color:rgba(56,178,246,.35);transform:translateY(-3px);}
.feat-card:hover::after{opacity:1;}
.feat-icon{
  width:42px;height:42px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:1.1rem;
}
.blue-icon{background:rgba(56,178,246,.1);border:1px solid rgba(56,178,246,.2);color:var(--primary);}
.teal-icon{background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.2);color:var(--teal);}
.feat-label{font-size:.65rem;font-weight:700;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-bottom:.4rem;}
.feat-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:var(--text);margin-bottom:.5rem;}
.feat-desc{font-size:.82rem;color:var(--muted);line-height:1.65;}

/* HOW IT WORKS */
.how-section{
  padding:7rem 4rem;
  background:var(--surface);
  border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
}
.steps-grid{
  max-width:1280px;margin:4rem auto 0;
  display:grid;grid-template-columns:repeat(4,1fr);gap:0;
  position:relative;
}
.step{padding:0 2rem;position:relative;}
.step:not(:last-child)::after{
  content:'';position:absolute;top:20px;right:-2px;
  width:4px;height:1px;
  background:linear-gradient(90deg,var(--primary),var(--teal));
  width:100%;right:auto;left:50%;width:calc(100% - 4rem);
  top:22px;left:calc(50% + 22px);
  display:block;height:1px;
  background:linear-gradient(90deg,rgba(56,178,246,.4),rgba(20,184,166,.2));
}
.step-num{
  width:44px;height:44px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-family:'DM Mono',monospace;font-size:.82rem;font-weight:500;
  color:var(--primary);
  border:2px solid rgba(56,178,246,.4);
  background:rgba(56,178,246,.06);
  margin:0 auto 1.5rem;
  position:relative;z-index:1;
}
.step-body{text-align:center;}
.step-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:.5rem;}
.step-desc{font-size:.8rem;color:var(--muted);line-height:1.65;}

/* PRICING */
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;align-items:start;}
.plan-card{
  padding:2rem 1.75rem;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:12px;
  transition:all .25s;
  position:relative;
}
.plan-card:hover{border-color:rgba(56,178,246,.25);}
.plan-card.featured{border-color:rgba(56,178,246,.5);background:rgba(56,178,246,.04);}
.plan-popular{
  position:absolute;top:-12px;left:50%;transform:translateX(-50%);
  background:linear-gradient(90deg,var(--primary),var(--teal));
  color:#fff;font-size:.62rem;font-weight:700;
  padding:.22rem .85rem;border-radius:20px;
  letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;
}
.plan-tier{font-size:.68rem;font-weight:700;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-bottom:.4rem;}
.plan-name{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:1rem;}
.plan-price{font-family:'DM Mono',monospace;font-size:1rem;font-weight:500;color:var(--text);}
.plan-price-sub{font-size:.75rem;color:var(--muted);margin-bottom:1.25rem;}
.plan-divider{height:1px;background:var(--border);margin:1.25rem 0;}
.plan-features{list-style:none;display:flex;flex-direction:column;gap:.55rem;margin-bottom:1.75rem;}
.plan-features li{display:flex;align-items:center;gap:.6rem;font-size:.82rem;color:var(--muted);}
.btn-plan-outline{
  width:100%;padding:.75rem;border-radius:8px;
  background:transparent;border:1px solid var(--border);
  color:var(--text);font-family:'Inter',sans-serif;
  font-size:.84rem;font-weight:600;
  cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;
}
.btn-plan-outline:hover{border-color:var(--primary);color:var(--primary);}
.btn-plan-solid{
  width:100%;padding:.75rem;border-radius:8px;
  background:var(--primary);border:1px solid var(--primary);
  color:#fff;font-family:'Inter',sans-serif;
  font-size:.84rem;font-weight:700;
  cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;
}
.btn-plan-solid:hover{background:var(--primary-dark);}

/* CTA */
.cta-section{
  padding:8rem 4rem;text-align:center;
  position:relative;overflow:hidden;
  background:var(--surface);
  border-top:1px solid var(--border);
}
.cta-orb{
  position:absolute;width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(56,178,246,.08),transparent 70%);
  top:50%;left:50%;transform:translate(-50%,-50%);
  pointer-events:none;
}
.cta-inner{position:relative;z-index:1;max-width:700px;margin:0 auto;}
.cta-title{font-family:'Syne',sans-serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:800;color:var(--text);line-height:1.08;letter-spacing:-.025em;margin:1rem 0 1.25rem;}
.cta-sub{font-size:.95rem;color:var(--muted);margin-bottom:2.5rem;}
.cta-btns{display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:2.5rem;}
.contact-row{display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;}
.contact-chip{
  display:inline-flex;align-items:center;gap:.5rem;
  padding:.4rem .9rem;border-radius:20px;
  background:var(--surface-2);border:1px solid var(--border);
  font-size:.78rem;color:var(--muted);text-decoration:none;
  transition:all .2s;
}
.contact-chip:hover{border-color:var(--primary);color:var(--primary);}

/* FOOTER */
footer{
  padding:2.5rem 4rem;
  border-top:1px solid var(--border);
  background:var(--bg);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;
}
.footer-brand{display:flex;align-items:center;gap:.75rem;}
.footer-copy{font-size:.76rem;color:var(--muted);}
.footer-links{display:flex;gap:1.5rem;}
.footer-links a{font-size:.76rem;color:var(--muted);text-decoration:none;transition:color .2s;}
.footer-links a:hover{color:var(--primary);}

/* REVEAL */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease;}
.reveal.visible{opacity:1;transform:none;}

/* RESPONSIVE */
@media(max-width:1024px){
  .feat-grid{grid-template-columns:repeat(2,1fr);}
  .steps-grid{grid-template-columns:repeat(2,1fr);gap:2rem;}
  .step:not(:last-child)::after{display:none;}
}
@media(max-width:768px){
  nav{padding:1rem 1.5rem;}
  .nav-links{display:none;}
  .section,.how-section,.cta-section{padding:4rem 1.5rem;}
  .feat-grid{grid-template-columns:1fr;}
  .pricing-grid{grid-template-columns:1fr;}
  .steps-grid{grid-template-columns:1fr;}
  .plan-card.featured{transform:none;}
  footer{padding:2rem 1.5rem;flex-direction:column;text-align:center;}
  .stat-sep{display:none;}
  .stats-bar{padding:1.5rem;}
  .dash-sidebar{display:none;}
  .dash-content{padding:1rem;}
}
`}</style>
      <div dangerouslySetInnerHTML={{__html: bodyHTML}} />
    </>
  );
}
