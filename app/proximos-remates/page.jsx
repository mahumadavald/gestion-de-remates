'use client'
import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f4f4f2; --s1: #f8f8f7; --s2: #ffffff;
    --b1: #e5e7eb; --b2: #d1d5db;
    --ac: #06B6D4; --acL: #22d3ee;
    --wh: #1a1a1a; --wh2: #374151;
    --mu: #6b7280; --mu2: #9ca3af;
    --gr: #14B8A6; --rd: #ef4444; --yl: #f59e0b;
  }
  html, body { height: 100%; background: var(--bg); color: var(--wh); font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 22px; height: 22px; border: 2.5px solid var(--b1); border-top-color: var(--ac); border-radius: 50%; animation: spin .8s linear infinite; flex-shrink: 0; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  .fade-up { animation: fadeUp .4s ease both; }

  /* ── TOPBAR ── */
  .topbar {
    position: sticky; top: 0; z-index: 10;
    background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--b1);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; height: 56px;
  }
  .topbar-brand { display: flex; align-items: center; gap: .6rem; text-decoration: none; }
  .topbar-name { font-size: .9rem; font-weight: 800; color: var(--wh); letter-spacing: -.02em; }

  /* ── HERO ── */
  .hero {
    background: linear-gradient(140deg, #0e7490 0%, #06B6D4 60%, #14B8A6 100%);
    padding: 3.5rem 2rem 4rem;
    text-align: center;
    position: relative; overflow: hidden;
  }
  .hero-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .18; pointer-events: none; }
  .hero-title { font-family: 'Poppins', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; color: #fff; letter-spacing: -.04em; line-height: 1.1; position: relative; }
  .hero-title span { color: #67e8f9; }
  .hero-sub { font-size: 1.05rem; color: rgba(255,255,255,.8); margin-top: .9rem; max-width: 500px; margin-left: auto; margin-right: auto; position: relative; }

  /* ── CONTENT ── */
  .content { max-width: 900px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

  /* ── CASA SECTION ── */
  .casa-section { margin-bottom: 2.5rem; }
  .casa-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.1rem; padding-bottom: .9rem; border-bottom: 2px solid var(--b1); }
  .casa-logo { width: 52px; height: 52px; border-radius: 10px; object-fit: contain; border: 1px solid var(--b1); background: var(--s2); padding: 4px; flex-shrink: 0; }
  .casa-logo-ph { width: 52px; height: 52px; border-radius: 10px; background: linear-gradient(135deg,#0e7490,#14B8A6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .casa-name { font-size: 1.15rem; font-weight: 800; color: var(--wh); letter-spacing: -.02em; }
  .casa-meta { font-size: .78rem; color: var(--mu); margin-top: .1rem; }

  /* ── REMATE CARD ── */
  .remate-card {
    background: var(--s2); border: 1.5px solid var(--b1); border-radius: 14px;
    padding: 1.1rem 1.25rem; margin-bottom: .75rem;
    display: flex; align-items: center; gap: 1.1rem;
    transition: border-color .15s, box-shadow .15s;
    text-decoration: none; color: inherit;
  }
  .remate-card:hover { border-color: var(--ac); box-shadow: 0 4px 20px rgba(6,182,212,.1); }
  .remate-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .remate-info { flex: 1; min-width: 0; }
  .remate-nombre { font-weight: 700; font-size: .95rem; color: var(--wh); }
  .remate-meta { font-size: .78rem; color: var(--mu); margin-top: .18rem; }
  .remate-badge { font-size: .65rem; font-weight: 700; padding: .2rem .6rem; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .badge-activo   { background: rgba(20,184,166,.12); color: #0d9488; border: 1px solid rgba(20,184,166,.3); }
  .badge-publicado{ background: rgba(6,182,212,.1);   color: var(--ac); border: 1px solid rgba(6,182,212,.25); }
  .badge-en_vivo  { background: rgba(239,68,68,.1);   color: #dc2626;  border: 1px solid rgba(239,68,68,.25); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.65} }

  .inscribirse-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .5rem 1rem; background: linear-gradient(135deg,#06B6D4,#14B8A6);
    color: #fff; border-radius: 8px; font-size: .8rem; font-weight: 700;
    text-decoration: none; white-space: nowrap; flex-shrink: 0;
    transition: opacity .15s, transform .15s;
  }
  .inscribirse-btn:hover { opacity: .9; transform: translateY(-1px); }

  /* ── EMPTY ── */
  .empty { text-align: center; padding: 4rem 1rem; color: var(--mu); }
  .empty-icon { margin: 0 auto 1.2rem; opacity: .35; }
  .empty-title { font-size: 1.1rem; font-weight: 700; color: var(--wh2); margin-bottom: .5rem; }
  .empty-sub { font-size: .88rem; line-height: 1.7; }

  /* ── FOOTER ── */
  .footer { border-top: 1px solid var(--b1); padding: 1.5rem 2rem; text-align: center; font-size: .75rem; color: var(--mu2); }

  @media (max-width: 600px) {
    .topbar { padding: 0 1rem; }
    .content { padding: 1.5rem 1rem 3rem; }
    .hero { padding: 2.5rem 1rem 3rem; }
    .remate-card { flex-wrap: wrap; }
    .inscribirse-btn { width: 100%; justify-content: center; }
  }
`;

function ProximosRemates() {
  const [casas,   setCasas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!supabase) { setError("Error de configuración."); setLoading(false); return; }

        const { data: casasData, error: casasErr } = await supabase
          .from("casas").select("*").order("nombre");

        if (casasErr) { setError("No se pudo cargar la información."); setLoading(false); return; }

        const casasList = casasData || [];

        const casasConRemates = await Promise.all(
          casasList.map(async (casa) => {
            const hoy = new Date(); hoy.setDate(hoy.getDate() - 1); const fechaMin = hoy.toISOString().slice(0,10);
            const { data: remates } = await supabase
              .from("remates").select("*")
              .eq("casa_id", casa.id)
              .in("estado", ["publicado", "en_vivo", "activo"])
              .gte("fecha", fechaMin)
              .order("fecha");
            return { ...casa, remates: remates || [] };
          })
        );

        // Solo mostrar casas que tengan al menos un remate activo/publicado
        const conRemates = casasConRemates.filter(c => c.remates.length > 0);
        setCasas(conRemates);
        setLoading(false);
      } catch (e) {
        setError("Error al cargar los remates.");
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtFecha = (fecha, hora) => {
    if (!fecha) return "Fecha por confirmar";
    try {
      const [year, month, day] = fecha.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const label = d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      return hora ? `${label} · ${hora} hrs` : label;
    } catch { return fecha; }
  };

  const badgeClass = (estado) => {
    if (estado === "en_vivo") return "badge-en_vivo";
    if (estado === "activo")  return "badge-activo";
    return "badge-publicado";
  };

  const badgeLabel = (estado) => {
    if (estado === "en_vivo") return "● EN VIVO";
    if (estado === "activo")  return "● Activo";
    return "Próximo";
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Topbar */}
      <div className="topbar">
        <a className="topbar-brand" href="https://takka.cl">
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="34" height="8" rx="2" fill="#0891b2"/>
            <rect x="1" y="9" width="11" height="26" rx="1" fill="#0891b2"/>
            <polygon points="12,9 35,1 35,21 18,27 12,27" fill="#0891b2"/>
            <polygon points="12,31 18,31 35,25 35,35 12,35" fill="#0891b2"/>
          </svg>
          <span className="topbar-name">TAKKA</span>
        </a>
        <span style={{fontSize:".78rem",color:"var(--mu)"}}>Plataforma de remates</span>
      </div>

      {/* Hero */}
      <div className="hero">
        <div className="hero-orb" style={{width:350,height:350,background:"#1d4ed8",top:-120,left:-80}}/>
        <div className="hero-orb" style={{width:250,height:250,background:"#0ea5e9",bottom:-80,right:-60}}/>
        <div className="hero-title" style={{position:"relative"}}>Próximos <span>Remates</span></div>
        <div className="hero-sub">Inscríbete en los remates disponibles y participa desde cualquier lugar.</div>
      </div>

      {/* Content */}
      <div className="content">
        {loading && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"4rem",gap:".75rem",color:"var(--mu)"}}>
            <div className="spinner"/>
            <span>Cargando remates...</span>
          </div>
        )}

        {error && (
          <div style={{textAlign:"center",padding:"3rem 1rem",color:"var(--mu)"}}>
            <div style={{fontSize:"1rem",fontWeight:700,color:"var(--wh2)",marginBottom:".5rem"}}>No pudimos cargar los remates</div>
            <div style={{fontSize:".85rem"}}>{error}</div>
            <button onClick={()=>window.location.reload()} style={{marginTop:"1.2rem",padding:".6rem 1.4rem",background:"var(--ac)",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:".85rem"}}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && casas.length === 0 && (
          <div className="empty fade-up">
            <svg className="empty-icon" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="8" y="10" width="40" height="38" rx="5"/><path d="M8 22h40M20 10v12M36 10v12"/>
            </svg>
            <div className="empty-title">No hay remates activos en este momento</div>
            <div className="empty-sub">Vuelve pronto — cuando haya remates publicados aparecerán aquí.</div>
          </div>
        )}

        {!loading && !error && casas.map((casa, ci) => (
          <div key={casa.id} className="casa-section fade-up" style={{animationDelay:`${ci * .08}s`}}>
            <div className="casa-header">
              {casa.logo_url
                ? <img src={casa.logo_url} alt={casa.nombre} className="casa-logo"/>
                : (
                  <div className="casa-logo-ph">
                    <svg width="22" height="22" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="34" height="8" rx="2" fill="rgba(255,255,255,.9)"/>
                      <rect x="1" y="9" width="11" height="26" rx="1" fill="rgba(255,255,255,.9)"/>
                      <polygon points="12,9 35,1 35,21 18,27 12,27" fill="rgba(255,255,255,.9)"/>
                      <polygon points="12,31 18,31 35,25 35,35 12,35" fill="rgba(255,255,255,.9)"/>
                    </svg>
                  </div>
                )
              }
              <div>
                <div className="casa-name">{casa.nombre}</div>
                {(casa.telefono || casa.email) && (
                  <div className="casa-meta">
                    {[casa.telefono, casa.email].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </div>

            {casa.remates.map(r => (
              <div key={r.id} className="remate-card">
                <div className="remate-dot" style={{
                  background: r.estado==="en_vivo"?"#dc2626": r.estado==="activo"?"#14B8A6":"#06B6D4",
                  boxShadow: r.estado==="en_vivo"?"0 0 8px rgba(220,38,38,.6)":"none"
                }}/>
                <div className="remate-info">
                  <div className="remate-nombre">{r.nombre}</div>
                  <div className="remate-meta">{fmtFecha(r.fecha, r.hora)} · {r.modalidad || "Presencial"}</div>
                </div>
                <span className={`remate-badge ${badgeClass(r.estado)}`}>{badgeLabel(r.estado)}</span>
                <a
                  href={`/participar?id=${casa.id}&remate=${r.id}`}
                  className="inscribirse-btn"
                >
                  Inscribirse
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7h10M7 2l5 5-5 5"/></svg>
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="footer">
        Powered by <strong>TAKKA</strong> · takka.cl · Plataforma de gestión de remates
      </div>
    </>
  );
}

export default function ProximosRematesPage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:".75rem",color:"#6b7280",fontSize:".9rem",background:"#f4f4f2"}}>
        <div style={{width:22,height:22,border:"2.5px solid #e5e7eb",borderTopColor:"#06B6D4",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Cargando...
      </div>
    }>
      <ProximosRemates />
    </Suspense>
  );
}
