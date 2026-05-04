'use client'
import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    const initObserver = () => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(initObserver, 100);

    const handleScroll = () => {
      const nav = document.getElementById('navbar');
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, []);

  const WA_DEMO = "https://wa.me/56991453680?text=Hola%2C%20me%20interesa%20Pecker.%20Mi%20nombre%20es%20____%20y%20soy%20de%20la%20casa%20de%20remates%20____";

  const bodyHTML = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

<nav id="navbar">
  <a href="#" class="nav-logo">
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="rgba(56,178,246,.12)" stroke="rgba(56,178,246,.3)" stroke-width="1"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="#14B8A6" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="nav-logo-text">Pecker</span>
  </a>
  <div class="nav-cta">
    <a href="${WA_DEMO}" target="_blank" class="btn-nav btn-ghost">Solicitar demo</a>
    <a href="/dashboard" class="btn-nav btn-solid">Ingresar →</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero" id="top">
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="orb orb3"></div>

  <div class="hero-inner">


    <h1 class="hero-title reveal">
      Los remates,<br/><em>reinventados.</em>
    </h1>

    <p class="hero-sub reveal">
      Plataforma digital para gestionar, operar y escalar remates
      en cualquier lugar del mundo — presencial, online o híbrido.
    </p>

    <div class="hero-btns reveal">
      <a href="${WA_DEMO}" target="_blank" class="btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L.057 23.492a.5.5 0 00.614.611l5.783-1.517A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.947 0-3.768-.497-5.35-1.367l-.383-.215-3.434.9.916-3.352-.234-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Solicitar demo gratis
      </a>
      <a href="/dashboard" class="btn-outline">Iniciar sesión →</a>
    </div>

    <!-- Dashboard mockup -->
    <div class="dash-mockup reveal">
      <div class="dash-bar">
        <div class="dash-dot" style="background:#f85149"></div>
        <div class="dash-dot" style="background:#d29922"></div>
        <div class="dash-dot" style="background:#3fb950"></div>
        <span class="dash-url">pecker.cl/sala</span>
      </div>
      <div class="dash-body">
        <div class="dash-sidebar">
          <div class="ds-logo">Pecker</div>
          <div class="ds-item active">● Sala en vivo</div>
          <div class="ds-item">  Lotes</div>
          <div class="ds-item">  Postores</div>
          <div class="ds-item">  Liquidaciones</div>
          <div class="ds-item">  Balance</div>
        </div>
        <div class="dash-content">
          <div class="dc-header">
            <div class="dc-title">LOTE 04 DE 12 · MUEBLES</div>
            <div class="dc-badge">● EN VIVO</div>
          </div>
          <div class="dc-lote">Escritorio de roble macizo</div>
          <div class="dc-price">$480.000</div>
          <div class="dc-sub">Próxima puja: $530.000 · Incremento: $50K</div>
          <div class="dc-bids-row">
            <div class="dc-ring">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" stroke="#30363d" stroke-width="3" fill="none"/>
                <circle cx="26" cy="26" r="22" stroke="#38B2F6" stroke-width="3" fill="none"
                  stroke-dasharray="138" stroke-dashoffset="46" stroke-linecap="round"
                  transform="rotate(-90 26 26)"/>
              </svg>
              <span class="ring-inner">12s</span>
            </div>
            <div class="dc-bids">
              <div class="dc-bid"><span class="bid-tag web">WEB</span><span class="bid-who">Online #24</span><span class="bid-amt">$480.000</span></div>
              <div class="dc-bid muted"><span class="bid-tag pres">PRES</span><span class="bid-who">Paleta 07</span><span class="bid-amt">$430.000</span></div>
              <div class="dc-bid muted"><span class="bid-tag web">WEB</span><span class="bid-who">Online #12</span><span class="bid-amt">$380.000</span></div>
            </div>
          </div>
        </div>
        <div class="dash-right-panel">
          <div class="drp-label">INCREMENTO</div>
          <div class="drp-inc-row">
            <div class="drp-inc active">$50K</div>
            <div class="drp-inc">$100K</div>
            <div class="drp-inc">$200K</div>
          </div>
          <div class="drp-label" style="margin-top:1rem">POSTURA PRESENCIAL</div>
          <div class="drp-input">Paleta 03</div>
          <div class="drp-input">$530.000</div>
          <div class="drp-btn">Confirmar postura</div>
        </div>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar reveal">
      <div class="stat">
        <div class="stat-num">15<span>s</span></div>
        <div class="stat-lbl">Adjudicación automática</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat-num">100<span>%</span></div>
        <div class="stat-lbl">Digital — sin papel</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat-num">∞</div>
        <div class="stat-lbl">Lotes por remate</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat-num">1<span> día</span></div>
        <div class="stat-lbl">Para estar operativo</div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="section" id="features">
  <div class="section-header reveal" style="align-items:center;text-align:center">
    <div class="section-tag" style="justify-content:center">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#14B8A6"/></svg>
      CARACTERÍSTICAS
    </div>
    <h2 class="section-title" style="text-align:center;margin:0 auto">Todo lo que necesita<br/>tu casa de remates</h2>
    <p class="section-sub" style="text-align:center;margin:0 auto;max-width:480px">Desde la inscripción del postor hasta la liquidación final — en un solo sistema completamente integrado.</p>
  </div>

  <!-- Bento grid -->
  <div class="bento-grid">

    <!-- Card grande izquierda -->
    <div class="bento-card bento-tall reveal">
      <div class="feat-icon blue-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <div class="feat-label">SALA EN VIVO</div>
      <div class="feat-title">Remates híbridos<br/>en tiempo real</div>
      <div class="feat-desc">Presencial, online e híbrido en la misma sala. Timer automático de 15 segundos. Feed de pujas en vivo con display para proyector incluido.</div>
      <div class="bento-preview">
        <div class="bp-row"><span class="bp-badge live">● EN VIVO</span><span class="bp-time">12s</span></div>
        <div class="bp-price">$480.000</div>
        <div class="bp-bids">
          <div class="bp-bid"><span class="bp-dot blue"></span>Online #24 — $480K</div>
          <div class="bp-bid muted"><span class="bp-dot teal"></span>Paleta 07 — $430K</div>
          <div class="bp-bid muted"><span class="bp-dot blue"></span>Online #12 — $380K</div>
        </div>
      </div>
    </div>

    <!-- Grid derecho 2x2 -->
    <div class="bento-card reveal">
      <div class="feat-icon teal-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      </div>
      <div class="feat-label">POSTORES</div>
      <div class="feat-title">Self-service público</div>
      <div class="feat-desc">Los postores se inscriben solos con validador RUT, suben comprobante y tú los validas con un click.</div>
    </div>

    <div class="bento-card reveal">
      <div class="feat-icon blue-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
      </div>
      <div class="feat-label">POST-REMATE</div>
      <div class="feat-title">Liquidaciones automáticas</div>
      <div class="feat-desc">PDF con tu logo generado al instante. Comisiones, IVA y gastos calculados automáticamente.</div>
    </div>

    <div class="bento-card reveal">
      <div class="feat-icon blue-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="feat-label">FINANZAS</div>
      <div class="feat-title">Reportes y balance</div>
      <div class="feat-desc">Balance por remate, estadísticas históricas, exportación CSV. Desglose con IVA automático.</div>
    </div>

    <div class="bento-card reveal">
      <div class="feat-icon teal-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      </div>
      <div class="feat-label">DISPLAY</div>
      <div class="feat-title">Pantalla para proyector</div>
      <div class="feat-desc">Overlay ADJUDICADO, foto del lote y timer visual. Conecta cualquier TV o pantalla.</div>
    </div>

    <!-- Card ancha bottom -->
    <div class="bento-card bento-wide reveal">
      <div class="feat-icon teal-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 9h20M9 21h6M12 17v4"/></svg>
      </div>
      <div class="feat-label">MULTI-TENANT</div>
      <div class="feat-title">Varias casas, un sistema centralizado</div>
      <div class="feat-desc">Cada casa tiene su propio acceso, logo, usuarios y datos completamente separados. Panel de administración centralizado para gestionar todo el grupo desde un único lugar.</div>
      <div class="bento-tags">
        <span class="btag">Datos aislados por casa</span>
        <span class="btag">Logos personalizados</span>
        <span class="btag">Usuarios independientes</span>
        <span class="btag">Admin centralizado</span>
      </div>
    </div>

  </div>
</section>

<!-- TESTIMONIAL -->

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="section-header reveal" style="text-align:center;align-items:center">
    <div class="section-tag" style="justify-content:center">
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#38B2F6"/></svg>
      CÓMO FUNCIONA
    </div>
    <h2 class="section-title" style="text-align:center;max-width:600px;margin:0 auto">Del registro al remate<br/>en minutos</h2>
    <p class="section-sub" style="text-align:center;margin:0 auto;max-width:480px">Flujo completo y sin fricciones para martilleros, postores y administradores.</p>
  </div>

  <div class="steps-grid">
    <div class="step reveal">
      <div class="step-num">01</div>
      <div class="step-body">
        <div class="step-title">Crea tu casa</div>
        <div class="step-desc">Registra tu casa de remates con logo, datos del martillero público y configuración. URLs únicas generadas al instante.</div>
      </div>
    </div>
    <div class="step reveal">
      <div class="step-num">02</div>
      <div class="step-body">
        <div class="step-title">Inscribe postores</div>
        <div class="step-desc">Comparte el link público. Los postores se inscriben solos, suben su comprobante y tú los validas con un click desde el panel.</div>
      </div>
    </div>
    <div class="step reveal">
      <div class="step-num">03</div>
      <div class="step-body">
        <div class="step-title">Remata en vivo</div>
        <div class="step-desc">Carga lotes con fotos, activa la sala en vivo y adjudica. Timer de 15 segundos automático. Proyecta en sala con un click.</div>
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

    <!-- ── Pecker Básico ── -->
    <div class="plan-card reveal">
      <div class="plan-bird plan-bird--basic">
        <!-- TODO: reemplazar por logo final de Pecker (pájaro) en color turquesa -->
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <ellipse cx="20" cy="30" rx="13" ry="10" fill="#06B6D4"/>
          <circle cx="33" cy="18" r="8" fill="#06B6D4"/>
          <path d="M41 15 L48 13 L41 20Z" fill="#06B6D4"/>
          <path d="M8 28 L1 35 L9 37Z" fill="#06B6D4" opacity=".65"/>
          <ellipse cx="20" cy="28" rx="9" ry="6" fill="white" opacity=".15"/>
          <circle cx="35" cy="16" r="2" fill="white" opacity=".9"/>
        </svg>
      </div>
      <div class="plan-tier" style="color:#06B6D4">BÁSICO</div>
      <div class="plan-name">Pecker Básico</div>
      <div class="plan-price">Consulta con nosotros</div>
      <div class="plan-price-sub">Adaptado a tu volumen</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#06B6D4" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Remates mensuales limitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#06B6D4" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Sala en vivo + display</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#06B6D4" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Liquidaciones PDF con logo</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#06B6D4" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Postores self-service</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#06B6D4" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Hasta 2 usuarios</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan-outline">Consultar precio →</a>
    </div>

    <!-- ── Pecker Gold ── -->
    <div class="plan-card plan-card--gold featured reveal">
      <div class="plan-popular plan-popular--gold">Más popular</div>
      <div class="plan-bird plan-bird--gold">
        <!-- TODO: reemplazar por logo final de Pecker (pájaro) en color dorado -->
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <ellipse cx="20" cy="30" rx="13" ry="10" fill="#F59E0B"/>
          <circle cx="33" cy="18" r="8" fill="#F59E0B"/>
          <path d="M41 15 L48 13 L41 20Z" fill="#D97706"/>
          <path d="M8 28 L1 35 L9 37Z" fill="#F59E0B" opacity=".65"/>
          <ellipse cx="20" cy="28" rx="9" ry="6" fill="white" opacity=".15"/>
          <circle cx="35" cy="16" r="2" fill="white" opacity=".9"/>
        </svg>
      </div>
      <div class="plan-tier" style="color:#F59E0B">GOLD</div>
      <div class="plan-name">Pecker Gold</div>
      <div class="plan-price">Consulta con nosotros</div>
      <div class="plan-price-sub">Adaptado a tu volumen</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Remates ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Lotes ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Hasta 5 usuarios</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Todos los módulos</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Reportes avanzados + CSV</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Soporte prioritario</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan-gold">Consultar precio →</a>
    </div>

    <!-- ── Pecker Platinum ── -->
    <div class="plan-card plan-card--platinum reveal">
      <div class="plan-bird plan-bird--platinum">
        <!-- TODO: reemplazar por logo final de Pecker (pájaro) en color platinum -->
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <ellipse cx="20" cy="30" rx="13" ry="10" fill="#8B5CF6"/>
          <circle cx="33" cy="18" r="8" fill="#8B5CF6"/>
          <path d="M41 15 L48 13 L41 20Z" fill="#7C3AED"/>
          <path d="M8 28 L1 35 L9 37Z" fill="#8B5CF6" opacity=".65"/>
          <ellipse cx="20" cy="28" rx="9" ry="6" fill="white" opacity=".15"/>
          <circle cx="35" cy="16" r="2" fill="white" opacity=".9"/>
        </svg>
      </div>
      <div class="plan-tier" style="color:#8B5CF6">PLATINUM</div>
      <div class="plan-name">Pecker Platinum</div>
      <div class="plan-price">A convenir</div>
      <div class="plan-price-sub">Cotización personalizada</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Múltiples casas de remates</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Usuarios ilimitados</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Onboarding personalizado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Panel admin dedicado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>SLA garantizado</li>
        <li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M2 7l4 4 6-7"/></svg>Soporte 24/7</li>
      </ul>
      <a href="${WA_DEMO}" target="_blank" class="btn-plan-platinum">Cotizar ahora →</a>
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
    <p class="cta-sub">Contáctanos y te configuramos todo en un día. Sin costos de setup.</p>
    <div class="cta-btns">
      <a href="${WA_DEMO}" target="_blank" class="btn-primary btn-primary-lg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L.057 23.492a.5.5 0 00.614.611l5.783-1.517A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.947 0-3.768-.497-5.35-1.367l-.383-.215-3.434.9.916-3.352-.234-.38A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Solicitar demo por WhatsApp
      </a>
      <a href="mailto:contacto@pecker.cl" class="btn-outline">contacto@pecker.cl</a>
    </div>
    <div class="contact-row">
      <a href="https://wa.me/56991453680" target="_blank" class="contact-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        +56 9 9145 3680
      </a>
      <a href="mailto:contacto@pecker.cl" class="contact-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        contacto@pecker.cl
      </a>
      <span class="contact-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        pecker.cl
      </span>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-wrap">
    <div class="footer-card reveal">
      <div class="footer-top">
        <div class="footer-brand">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="9" fill="rgba(6,182,212,.1)" stroke="rgba(6,182,212,.25)" stroke-width="1"/>
            <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#06B6D4" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M4 12 Q4 5 12 5 L20 5" stroke="#14B8A6" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          </svg>
          <span class="footer-brand-name">Pecker</span>
        </div>
        <p class="footer-desc">Software profesional para gestionar, operar y escalar remates en cualquier lugar de Chile.</p>
        <div class="footer-socials">
          <a href="mailto:contacto@pecker.cl" class="footer-social-btn" title="Email">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
          <a href="https://wa.me/56912345678" target="_blank" class="footer-social-btn" title="WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.857L.057 23.215a.75.75 0 0 0 .916.938l5.453-1.431A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.523-5.188-1.435l-.372-.221-3.865 1.015 1.035-3.763-.242-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <div class="footer-col-title">PÁGINAS</div>
          <a href="#features" class="footer-col-link">Características</a>
          <a href="#how" class="footer-col-link">Cómo funciona</a>
          <a href="#pricing" class="footer-col-link">Planes</a>
          <a href="/dashboard" class="footer-col-link">Ingresar</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">INFORMACIÓN</div>
          <a href="mailto:contacto@pecker.cl" class="footer-col-link">Contacto</a>
          <a href="/participar" class="footer-col-link">Participar</a>
          <a href="#" class="footer-col-link">Privacidad</a>
          <a href="#" class="footer-col-link">Términos de uso</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 Pecker — Auction Software · pecker.cl</span>
      <span>Hecho en Chile 🇨🇱</span>
    </div>
  </div>
</footer>`;

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#ffffff;
  --surface:#f4f4f2;
  --surface-2:#e9e9e7;
  --border:#e5e7eb;
  --text:#1a1a1a;
  --muted:#6b7280;
  --subtle:#9ca3af;
  --primary:#06B6D4;
  --primary-dark:#0891b2;
  --teal:#14B8A6;
  --teal-dark:#0D9488;
  --success:#3fb950;
  --warning:#d29922;
  --danger:#f85149;
}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:'Poppins',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:var(--surface);}
::-webkit-scrollbar-thumb{background:var(--primary);border-radius:2px;}

/* NAV */
nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:1.25rem 4rem;
  background:rgba(255,255,255,0);
  backdrop-filter:blur(0px);
  border-bottom:1px solid transparent;
  transition:all .4s ease;
}
nav.scrolled{
  background:rgba(255,255,255,0.92);
  backdrop-filter:blur(24px);
  border-bottom-color:var(--border);
}
.nav-logo{display:flex;align-items:center;gap:.7rem;text-decoration:none;}
.nav-logo-text{font-family:'Poppins',sans-serif;font-weight:800;font-size:1.1rem;color:#06B6D4;}
.nav-links{display:flex;align-items:center;gap:2.5rem;}
.nav-links a{font-size:.82rem;font-weight:500;color:var(--muted);text-decoration:none;letter-spacing:.02em;transition:color .2s;}
.nav-links a:hover{color:var(--text);}
.nav-cta{display:flex;align-items:center;gap:.75rem;}
.btn-nav{padding:.45rem 1.1rem;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'Poppins',sans-serif;}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--muted);}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);}
.btn-solid{background:var(--primary);border:1px solid var(--primary);color:#fff;}
.btn-solid:hover{background:var(--primary-dark);}

/* HERO */
.hero{
  min-height:100vh;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:9rem 2rem 6rem;
  position:relative;overflow:hidden;
}
.orb{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none;animation:float 12s ease-in-out infinite alternate;}
.orb1{width:800px;height:800px;background:rgba(56,178,246,.06);top:-300px;left:-200px;animation-duration:14s;}
.orb2{width:600px;height:600px;background:rgba(20,184,166,.05);bottom:-200px;right:-150px;animation-duration:10s;animation-direction:alternate-reverse;}
.orb3{width:400px;height:400px;background:rgba(56,178,246,.04);top:35%;left:45%;animation-duration:18s;}
@keyframes float{from{transform:translate(0,0)}to{transform:translate(50px,60px)}}

.hero-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;max-width:1100px;margin:0 auto;width:100%;}

.hero-badge{
  display:inline-flex;align-items:center;gap:.5rem;
  padding:.35rem 1.1rem;
  background:rgba(56,178,246,.07);
  border:1px solid rgba(56,178,246,.18);
  border-radius:20px;
  font-size:.66rem;font-weight:700;color:var(--primary);
  letter-spacing:.14em;text-transform:uppercase;
  margin-bottom:2.25rem;
}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}

.hero-title{
  font-family:'Poppins',sans-serif;
  font-size:clamp(3.5rem,8vw,7rem);
  font-weight:800;
  color:var(--text);
  line-height:1.0;
  letter-spacing:-.04em;
  margin-bottom:1.75rem;
}
.hero-title em{
  font-style:normal;
  background:linear-gradient(135deg,var(--primary) 20%,var(--teal) 80%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.hero-sub{
  font-size:clamp(1rem,2vw,1.2rem);
  color:var(--muted);
  max-width:540px;
  line-height:1.8;
  margin-bottom:2.75rem;
}
.hero-btns{
  display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap;
  margin-bottom:4.5rem;
}
.btn-primary{
  padding:.875rem 1.75rem;border-radius:8px;
  background:var(--primary);border:none;color:#fff;
  font-family:'Poppins',sans-serif;font-size:.9rem;font-weight:700;
  text-decoration:none;cursor:pointer;transition:all .2s;
  display:inline-flex;align-items:center;gap:.5rem;
  letter-spacing:.01em;
}
.btn-primary:hover{background:var(--primary-dark);transform:translateY(-2px);box-shadow:0 8px 24px rgba(56,178,246,.2);}
.btn-primary-lg{padding:1rem 2rem;font-size:.95rem;}
.btn-outline{
  padding:.875rem 1.75rem;border-radius:8px;
  background:transparent;border:1px solid var(--border);
  color:var(--text);font-family:'Poppins',sans-serif;
  font-size:.9rem;font-weight:600;
  text-decoration:none;cursor:pointer;transition:all .2s;
}
.btn-outline:hover{border-color:var(--primary);color:var(--primary);}

/* DASHBOARD MOCKUP */
.dash-mockup{
  width:100%;max-width:960px;
  border:1px solid var(--border);
  border-radius:16px;
  overflow:hidden;
  background:var(--surface);
  box-shadow:0 32px 100px rgba(0,0,0,.6),0 0 0 1px rgba(56,178,246,.08);
  margin-bottom:4.5rem;
}
.dash-bar{
  display:flex;align-items:center;gap:.5rem;
  padding:.8rem 1.25rem;
  background:var(--surface-2);
  border-bottom:1px solid var(--border);
}
.dash-dot{width:10px;height:10px;border-radius:50%;}
.dash-url{flex:1;text-align:center;font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:.72rem;color:var(--muted);}
.dash-body{display:flex;min-height:300px;}
.dash-sidebar{
  width:170px;flex-shrink:0;
  background:rgba(255,255,255,.85);
  border-right:1px solid var(--border);
  padding:1.1rem .8rem;
  display:flex;flex-direction:column;gap:.25rem;
}
.ds-logo{font-family:'Poppins',sans-serif;font-weight:800;font-size:.85rem;color:var(--text);margin-bottom:.75rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);}
.ds-item{font-size:.72rem;color:var(--muted);padding:.35rem .5rem;border-radius:5px;}
.ds-item.active{background:rgba(56,178,246,.1);color:var(--primary);border-left:2px solid var(--primary);}
.dash-content{flex:1;padding:1.4rem 1.6rem;text-align:left;}
.dc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem;}
.dc-title{font-size:.65rem;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;}
.dc-badge{font-size:.65rem;font-weight:700;color:var(--danger);animation:pulse 2s infinite;}
.dc-lote{font-family:'Poppins',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text);margin-bottom:.3rem;}
.dc-price{font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:2.2rem;font-weight:500;color:var(--primary);line-height:1;margin-bottom:.3rem;}
.dc-sub{font-size:.68rem;color:var(--muted);margin-bottom:1rem;}
.dc-bids-row{display:flex;align-items:flex-start;gap:1.5rem;}
.dc-ring{position:relative;width:52px;height:52px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.ring-inner{position:absolute;font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:.85rem;font-weight:500;color:var(--primary);}
.dc-bids{flex:1;display:flex;flex-direction:column;gap:.3rem;}
.dc-bid{display:flex;align-items:center;gap:.4rem;padding:.28rem .45rem;background:rgba(56,178,246,.06);border-radius:5px;font-size:.7rem;}
.dc-bid.muted{background:transparent;opacity:.45;}
.bid-tag{font-size:.58rem;font-weight:700;padding:.1rem .35rem;border-radius:3px;letter-spacing:.06em;}
.bid-tag.web{background:rgba(56,178,246,.15);color:var(--primary);}
.bid-tag.pres{background:rgba(20,184,166,.15);color:var(--teal);}
.bid-who{color:var(--text);flex:1;}
.bid-amt{font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;color:var(--primary);}

/* RIGHT PANEL MOCKUP */
.dash-right-panel{
  width:180px;flex-shrink:0;
  border-left:1px solid var(--border);
  padding:1.1rem 1rem;
  display:flex;flex-direction:column;gap:.5rem;
}
.drp-label{font-size:.6rem;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;}
.drp-inc-row{display:flex;gap:.35rem;flex-wrap:wrap;}
.drp-inc{font-size:.68rem;padding:.25rem .5rem;border-radius:5px;border:1px solid var(--border);color:var(--muted);font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;}
.drp-inc.active{border-color:var(--primary);color:var(--primary);background:rgba(56,178,246,.08);}
.drp-input{font-size:.7rem;padding:.35rem .55rem;border-radius:5px;border:1px solid var(--border);color:var(--muted);background:var(--bg);}
.drp-btn{font-size:.7rem;padding:.45rem .55rem;border-radius:6px;background:var(--primary);color:#fff;font-weight:700;text-align:center;margin-top:.25rem;}

/* STATS BAR */
.stats-bar{
  display:flex;align-items:center;gap:0;justify-content:center;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:14px;
  width:100%;max-width:720px;
  overflow:hidden;
}
.stat{flex:1;text-align:center;padding:1.5rem 1rem;}
.stat+.stat{border-left:1px solid var(--border);}
.stat-num{
  font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;
  font-size:1.8rem;font-weight:500;
  color:var(--text);line-height:1;
}
.stat-num span{color:var(--primary);font-size:1.3rem;}
.stat-lbl{font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.09em;margin-top:.45rem;}
.stat-sep{width:1px;height:36px;background:var(--border);}

/* SECTION */
.section{padding:9rem 4rem;max-width:1280px;margin:0 auto;}
.section-header{display:flex;flex-direction:column;gap:.75rem;margin-bottom:4.5rem;}
.section-tag{display:inline-flex;align-items:center;gap:.5rem;font-size:.66rem;font-weight:700;color:var(--teal);letter-spacing:.14em;text-transform:uppercase;}
.section-title{font-family:'Poppins',sans-serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:800;color:var(--text);line-height:1.1;letter-spacing:-.025em;}
.section-sub{font-size:.9rem;color:var(--muted);line-height:1.75;}

/* BENTO GRID */
.bento-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  grid-template-rows:auto auto;
  gap:1.25rem;
}
.bento-card{
  padding:2rem;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  transition:all .25s ease;
  position:relative;overflow:hidden;
}
.bento-card::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(56,178,246,.03),transparent 60%);
  opacity:0;transition:opacity .3s;
}
.bento-card:hover{border-color:rgba(56,178,246,.3);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.3);}
.bento-card:hover::before{opacity:1;}
.bento-tall{grid-row:span 2;display:flex;flex-direction:column;}
.bento-wide{grid-column:span 2;}
.bento-preview{
  margin-top:auto;padding-top:1.5rem;
  border-top:1px solid var(--border);
  margin-top:1.5rem;
}
.bp-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;}
.bp-badge{font-size:.65rem;font-weight:700;color:var(--danger);letter-spacing:.06em;animation:pulse 2s infinite;}
.bp-time{font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:1.1rem;font-weight:500;color:var(--primary);}
.bp-price{font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:1.6rem;font-weight:500;color:var(--text);margin-bottom:.75rem;}
.bp-bids{display:flex;flex-direction:column;gap:.35rem;}
.bp-bid{display:flex;align-items:center;gap:.5rem;font-size:.75rem;color:var(--text);}
.bp-bid.muted{color:var(--muted);}
.bp-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.bp-dot.blue{background:var(--primary);}
.bp-dot.teal{background:var(--teal);}
.bento-tags{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.25rem;}
.btag{font-size:.72rem;padding:.25rem .7rem;border-radius:20px;background:var(--surface-2);border:1px solid var(--border);color:var(--muted);}

.feat-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;}
.blue-icon{background:rgba(56,178,246,.1);border:1px solid rgba(56,178,246,.2);color:var(--primary);}
.teal-icon{background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.2);color:var(--teal);}
.feat-label{font-size:.63rem;font-weight:700;color:var(--muted);letter-spacing:.13em;text-transform:uppercase;margin-bottom:.4rem;}
.feat-title{font-family:'Poppins',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text);margin-bottom:.6rem;line-height:1.25;}
.feat-desc{font-size:.82rem;color:var(--muted);line-height:1.7;}

/* TESTIMONIAL */
.testimonial-section{
  padding:7rem 4rem;
  background:var(--surface);
  border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
}
.test-inner{
  max-width:800px;margin:0 auto;
  position:relative;
}
.test-quote{
  font-family:'Poppins',sans-serif;
  font-size:6rem;line-height:.6;
  color:var(--primary);opacity:.3;
  margin-bottom:1rem;
  display:block;
}
.test-text{
  font-family:'Poppins',sans-serif;
  font-size:clamp(1.3rem,2.5vw,1.85rem);
  font-weight:600;
  color:var(--text);
  line-height:1.4;
  margin-bottom:2rem;
  font-style:normal;
}
.test-author{display:flex;align-items:center;gap:1rem;}
.test-avatar{
  width:44px;height:44px;border-radius:50%;
  background:linear-gradient(135deg,var(--primary),var(--teal));
  display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:.85rem;color:#fff;flex-shrink:0;
}
.test-name{font-weight:600;font-size:.9rem;color:var(--text);}
.test-role{font-size:.78rem;color:var(--muted);margin-top:.1rem;}

/* HOW IT WORKS */
.how-section{
  padding:9rem 4rem;
  background:var(--bg);
}
.steps-grid{
  max-width:1200px;margin:5rem auto 0;
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:2rem;
  position:relative;
}
.steps-grid::before{
  content:'';
  position:absolute;top:22px;left:calc(12.5% + 22px);
  width:calc(75% - 44px);height:1px;
  background:linear-gradient(90deg,rgba(56,178,246,.3),rgba(20,184,166,.15));
}
.step{position:relative;text-align:center;}
.step-num{
  width:44px;height:44px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:.82rem;font-weight:500;
  color:var(--primary);
  border:2px solid rgba(56,178,246,.35);
  background:var(--bg);
  margin:0 auto 1.75rem;
  position:relative;z-index:1;
}
.step-body{padding:0 .5rem;}
.step-title{font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:.6rem;}
.step-desc{font-size:.8rem;color:var(--muted);line-height:1.7;}

/* PRICING */
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;align-items:start;}
.plan-card{
  padding:2.25rem 2rem;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  transition:all .25s;
  position:relative;
}
.plan-card:hover{border-color:rgba(56,178,246,.25);transform:translateY(-2px);}
.plan-card.featured{border-color:rgba(56,178,246,.5);background:rgba(56,178,246,.03);}
.plan-card--gold{border-color:rgba(245,158,11,.4)!important;background:rgba(245,158,11,.03)!important;}
.plan-card--gold:hover{border-color:rgba(245,158,11,.65)!important;transform:translateY(-2px);}
.plan-card--platinum{border-color:rgba(139,92,246,.35)!important;background:rgba(139,92,246,.03)!important;}
.plan-card--platinum:hover{border-color:rgba(139,92,246,.6)!important;transform:translateY(-2px);}
.plan-bird{margin-bottom:1.1rem;}
.plan-popular{
  position:absolute;top:-13px;left:50%;transform:translateX(-50%);
  background:linear-gradient(90deg,var(--primary),var(--teal));
  color:#fff;font-size:.62rem;font-weight:700;
  padding:.25rem .9rem;border-radius:20px;
  letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;
}
.plan-popular--gold{background:linear-gradient(90deg,#F59E0B,#D97706);}
.plan-tier{font-size:.66rem;font-weight:700;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-bottom:.4rem;}
.plan-name{font-family:'Poppins',sans-serif;font-size:1.15rem;font-weight:700;color:var(--text);margin-bottom:1rem;}
.plan-price{font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-size:1rem;font-weight:500;color:var(--text);}
.plan-price-sub{font-size:.75rem;color:var(--muted);margin-bottom:1.25rem;}
.plan-divider{height:1px;background:var(--border);margin:1.25rem 0;}
.plan-features{list-style:none;display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.75rem;}
.plan-features li{display:flex;align-items:center;gap:.6rem;font-size:.83rem;color:var(--muted);}
.btn-plan-outline{
  width:100%;padding:.8rem;border-radius:8px;
  background:transparent;border:1px solid var(--border);
  color:var(--text);font-family:'Poppins',sans-serif;
  font-size:.84rem;font-weight:600;
  cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;
}
.btn-plan-outline:hover{border-color:var(--primary);color:var(--primary);}
.btn-plan-solid{
  width:100%;padding:.8rem;border-radius:8px;
  background:var(--primary);border:1px solid var(--primary);
  color:#fff;font-family:'Poppins',sans-serif;
  font-size:.84rem;font-weight:700;
  cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;
}
.btn-plan-solid:hover{background:var(--primary-dark);transform:translateY(-1px);}
.btn-plan-gold{
  width:100%;padding:.8rem;border-radius:8px;
  background:#F59E0B;border:1px solid #F59E0B;
  color:#fff;font-family:'Poppins',sans-serif;
  font-size:.84rem;font-weight:700;
  cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;
}
.btn-plan-gold:hover{background:#D97706;transform:translateY(-1px);}
.btn-plan-platinum{
  width:100%;padding:.8rem;border-radius:8px;
  background:transparent;border:1px solid #8B5CF6;
  color:#8B5CF6;font-family:'Poppins',sans-serif;
  font-size:.84rem;font-weight:600;
  cursor:pointer;text-align:center;text-decoration:none;display:block;transition:all .2s;
}
.btn-plan-platinum:hover{background:#8B5CF6;color:#fff;transform:translateY(-1px);}

/* CTA */
.cta-section{
  padding:10rem 4rem;text-align:center;
  position:relative;overflow:hidden;
  background:var(--surface);
  border-top:1px solid var(--border);
}
.cta-orb{
  position:absolute;width:700px;height:700px;border-radius:50%;
  background:radial-gradient(circle,rgba(56,178,246,.07),transparent 65%);
  top:50%;left:50%;transform:translate(-50%,-50%);
  pointer-events:none;
}
.cta-inner{position:relative;z-index:1;max-width:700px;margin:0 auto;}
.cta-title{font-family:'Poppins',sans-serif;font-size:clamp(2.2rem,5vw,4rem);font-weight:800;color:var(--text);line-height:1.06;letter-spacing:-.03em;margin:1rem 0 1.5rem;}
.cta-sub{font-size:1rem;color:var(--muted);margin-bottom:3rem;line-height:1.7;}
.cta-btns{display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:2.5rem;}
.contact-row{display:flex;align-items:center;justify-content:center;gap:.75rem;flex-wrap:wrap;}
.contact-chip{
  display:inline-flex;align-items:center;gap:.5rem;
  padding:.4rem .9rem;border-radius:20px;
  background:var(--surface-2);border:1px solid var(--border);
  font-size:.78rem;color:var(--muted);text-decoration:none;
  transition:all .2s;
}
.contact-chip:hover{border-color:var(--primary);color:var(--primary);}

/* FOOTER */
footer{background:var(--surface);padding:2.5rem 2rem 1.5rem;}
.footer-wrap{max-width:1100px;margin:0 auto;}
.footer-card{
  background:#fff;
  border:1px solid var(--border);
  border-radius:1rem;
  padding:2.5rem;
  display:flex;
  justify-content:space-between;
  gap:2rem;
  flex-wrap:wrap;
}
.footer-top{display:flex;flex-direction:column;gap:1rem;max-width:280px;}
.footer-brand{display:flex;align-items:center;gap:.6rem;}
.footer-brand-name{font-weight:700;font-size:1rem;color:#06B6D4;}
.footer-desc{font-size:.82rem;color:var(--muted);line-height:1.6;}
.footer-socials{display:flex;gap:.6rem;}
.footer-social-btn{
  width:36px;height:36px;border-radius:50%;
  background:var(--surface);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  color:var(--muted);text-decoration:none;
  transition:all .2s;
}
.footer-social-btn:hover{background:var(--primary);border-color:var(--primary);color:#fff;}
.footer-cols{display:flex;gap:3rem;}
.footer-col{display:flex;flex-direction:column;gap:.6rem;}
.footer-col-title{font-size:.7rem;font-weight:600;letter-spacing:.1em;color:var(--subtle);margin-bottom:.25rem;text-transform:uppercase;}
.footer-col-link{font-size:.84rem;color:var(--muted);text-decoration:none;transition:color .2s;}
.footer-col-link:hover{color:var(--primary);}
.footer-bottom{
  display:flex;justify-content:space-between;align-items:center;
  padding:1.25rem .25rem 0;
  font-size:.76rem;color:var(--muted);
}

/* REVEAL */
.reveal{opacity:0;transform:translateY(32px);transition:opacity .75s ease,transform .75s ease;}
.reveal.visible{opacity:1;transform:none;}

/* RESPONSIVE */
@media(max-width:1100px){
  .bento-grid{grid-template-columns:repeat(2,1fr);}
  .bento-tall{grid-row:span 1;}
  .bento-wide{grid-column:span 2;}
  .steps-grid{grid-template-columns:repeat(2,1fr);}
  .steps-grid::before{display:none;}
  .pricing-grid{grid-template-columns:repeat(3,1fr);}
  .dash-right-panel{display:none;}
}
@media(max-width:768px){
  nav{padding:1rem 1.5rem;}
  .nav-links{display:none;}
  .section,.how-section,.cta-section,.testimonial-section{padding:5rem 1.5rem;}
  .bento-grid{grid-template-columns:1fr;}
  .bento-wide{grid-column:span 1;}
  .pricing-grid{grid-template-columns:1fr;}
  .steps-grid{grid-template-columns:1fr;gap:2rem;}
  footer{padding:2rem 1.5rem;flex-direction:column;text-align:center;}
  .stats-bar{flex-direction:column;border-radius:12px;}
  .stat+.stat{border-left:none;border-top:1px solid var(--border);}
  .dash-sidebar{display:none;}
  .dash-content{padding:1rem;}
  .hero-title{font-size:clamp(2.75rem,12vw,4rem);}
}
`}</style>
      <div dangerouslySetInnerHTML={{__html: bodyHTML}} />
    </>
  );
}
