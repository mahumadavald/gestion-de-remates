'use client'
import React, { useState, useEffect, use } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);

/* ─── Mismo tema oscuro que sala en vivo ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; background: #0a0f1a; }

  :root {
    --bg:  #0a0f1a;
    --s1:  #0f1724;
    --s2:  #14202e;
    --s3:  #192840;
    --b1:  rgba(26,58,92,.45);
    --b2:  rgba(26,58,92,.28);
    --wh:  #e0eaf4;
    --wh2: #8ab4d4;
    --mu:  #5a7fa8;
    --mu2: #7a9ab8;
    --ac:  #38B2F6;
    --acH: #5cc8ff;
    --gr:  #14B8A6;
    --yl:  #f6ad55;
    --rd:  #f56565;
  }

  .disp-root {
    width: 100vw; height: 100vh;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--wh);
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  /* ── Header — mismo gradiente turquesa del proyecto ── */
  .disp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: .7rem 1.5rem;
    background: linear-gradient(160deg, #0e7490 0%, #06B6D4 60%, #14B8A6 100%);
    flex-shrink: 0;
    box-shadow: 0 2px 16px rgba(6,182,212,.3);
  }
  .disp-casa { font-size: .95rem; font-weight: 700; color: rgba(255,255,255,.9); }
  .disp-live-badge {
    display: inline-flex; align-items: center; gap: .45rem;
    padding: .28rem .9rem;
    background: rgba(255,255,255,.18);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 999px;
    font-size: .72rem; font-weight: 700; color: #fff;
    letter-spacing: .06em; text-transform: uppercase;
    backdrop-filter: blur(4px);
  }
  .disp-live-badge.sold { background: rgba(255,255,255,.12); }
  .disp-live-badge.wait { background: rgba(255,255,255,.08); color: rgba(255,255,255,.65); }
  .disp-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: blink 1.2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  /* ── Body — layout de 2 columnas igual que sala en vivo ── */
  .disp-body {
    display: grid;
    grid-template-columns: 1fr 390px;
    gap: 1rem;
    padding: 1rem 1.1rem;
    overflow: hidden;
    min-height: 0;
  }

  /* ── Panel izquierdo — igual que sala-left-card ── */
  .disp-left {
    background: var(--s2);
    border: 1px solid var(--b1);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  /* Badge en vivo */
  .disp-sala-badge {
    display: inline-flex; align-items: center; gap: .35rem;
    padding: .28rem .75rem;
    background: rgba(20,184,166,.15);
    color: var(--gr);
    border-radius: 20px;
    font-size: .7rem; font-weight: 700; letter-spacing: .04em;
    margin: .85rem auto 0;
    width: fit-content;
  }
  .disp-sala-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gr); animation: blink 1.2s infinite; }

  .disp-lot-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem; font-weight: 800; color: var(--wh);
    text-align: center; padding: .5rem 1.1rem .3rem; line-height: 1.25;
  }
  .disp-lot-cat {
    font-size: .75rem; color: var(--mu); text-align: center;
    padding: 0 1.1rem .4rem;
  }

  /* Foto */
  .disp-photo-wrap {
    position: relative;
    background: var(--s3);
    margin: .4rem .85rem;
    border-radius: 10px;
    overflow: hidden;
    flex: 1;
    min-height: 180px;
  }
  .disp-photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .disp-photo-placeholder {
    width: 100%; height: 100%; min-height: 180px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .6rem;
  }
  .disp-photo-dots { position: absolute; bottom: .75rem; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; }
  .disp-photo-dot  { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.3); cursor: pointer; transition: all .2s; }
  .disp-photo-dot.on { width: 20px; border-radius: 4px; background: var(--ac); }

  /* Timer — igual que sala en vivo */
  .disp-timer-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: .6rem 1.1rem .8rem;
    border-top: 1px solid var(--b1);
    margin-top: .4rem;
    background: rgba(0,0,0,.08);
    flex-shrink: 0;
  }
  .disp-timer-label { font-size: .68rem; font-weight: 600; color: var(--mu2); }
  .disp-timer-bar-wrap { flex: 1; margin: 0 .85rem; }
  .disp-timer-bar { height: 6px; background: var(--b1); border-radius: 3px; overflow: hidden; }
  .disp-timer-fill { height: 100%; border-radius: 3px; transition: width 1s linear, background .5s; }
  .disp-timer-num {
    font-family: 'Inter', monospace; font-size: 1.5rem; font-weight: 800;
    letter-spacing: .04em; min-width: 3ch; text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Panel derecho ── */
  .disp-right {
    display: flex; flex-direction: column; gap: .85rem;
    overflow-y: auto; min-height: 0;
  }
  .disp-right::-webkit-scrollbar { width: 4px; }
  .disp-right::-webkit-scrollbar-track { background: transparent; }
  .disp-right::-webkit-scrollbar-thumb { background: var(--b1); border-radius: 4px; }

  /* Card de puja — igual que sala-bid-card */
  .disp-bid-card {
    background: var(--s2);
    border: 1px solid var(--b1);
    border-radius: 14px;
    padding: 1.1rem;
    flex-shrink: 0;
  }
  .disp-bid-header { margin-bottom: .85rem; }
  .disp-bid-label {
    font-size: .65rem; font-weight: 700; color: var(--mu);
    text-transform: uppercase; letter-spacing: .07em; margin-bottom: .2rem;
  }
  .disp-bid-amount {
    font-size: 2.4rem; font-weight: 800; color: var(--ac);
    line-height: 1; letter-spacing: -.02em;
    transition: color .2s;
    font-variant-numeric: tabular-nums;
    font-family: 'Poppins', sans-serif;
  }
  .disp-bid-amount.flash { color: var(--yl); text-shadow: 0 0 20px rgba(246,173,85,.5); }
  .disp-bid-ganador {
    font-size: .88rem; font-weight: 600; color: var(--mu2); margin-top: .4rem;
    display: flex; align-items: center; gap: .4rem;
  }
  .disp-bid-ganador-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gr); animation: blink 1.2s infinite; }

  /* Base + pujas row */
  .disp-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; margin-top: .85rem; }
  .disp-stat-card {
    background: rgba(255,255,255,.025);
    border: 1px solid var(--b1);
    border-radius: 8px; padding: .6rem .75rem; text-align: center;
  }
  .disp-stat-val { font-size: 1rem; font-weight: 800; color: var(--wh); font-variant-numeric: tabular-nums; }
  .disp-stat-lbl { font-size: .58rem; font-weight: 500; color: var(--mu); text-transform: uppercase; letter-spacing: .05em; margin-top: .1rem; }

  /* Historial de pujas */
  .disp-hist-card {
    background: var(--s2);
    border: 1px solid var(--b1);
    border-radius: 14px;
    padding: 1rem 1.1rem;
    flex: 1; min-height: 0; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .disp-hist-title {
    font-size: .65rem; font-weight: 700; color: var(--mu);
    text-transform: uppercase; letter-spacing: .07em; margin-bottom: .65rem;
    display: flex; align-items: center; gap: .4rem;
  }
  .disp-hist-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .3rem; }
  .disp-hist-list::-webkit-scrollbar { width: 3px; }
  .disp-hist-list::-webkit-scrollbar-thumb { background: var(--b1); border-radius: 3px; }
  .disp-hist-row {
    display: flex; align-items: center; gap: .55rem;
    padding: .42rem .6rem;
    border-radius: 8px;
    background: rgba(255,255,255,.025);
    border: 1px solid var(--b1);
    animation: fdin .2s ease;
  }
  @keyframes fdin { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
  .disp-hist-row.top { background: rgba(56,178,246,.08); border-color: rgba(56,178,246,.2); }
  .disp-hist-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--ac); display: flex; align-items: center; justify-content: center;
    font-size: .6rem; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .disp-hist-row.top .disp-hist-avatar { background: var(--gr); }
  .disp-hist-pal { flex: 1; font-size: .76rem; font-weight: 600; color: var(--wh2); }
  .disp-hist-monto { font-size: .85rem; font-weight: 700; color: var(--wh); font-variant-numeric: tabular-nums; }
  .disp-hist-row.top .disp-hist-monto { color: var(--ac); }
  .disp-hist-empty { font-size: .75rem; color: var(--mu); padding: .5rem 0; }

  /* ── Waiting ── */
  .disp-waiting {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.5rem; text-align: center;
  }
  .disp-waiting-ring {
    width: 96px; height: 96px; border-radius: 50%;
    background: rgba(6,182,212,.06);
    border: 2px solid rgba(6,182,212,.2);
    display: flex; align-items: center; justify-content: center;
    animation: slowpulse 3s ease-in-out infinite;
  }
  @keyframes slowpulse { 0%,100%{box-shadow:0 0 0 0 rgba(6,182,212,.12)} 50%{box-shadow:0 0 0 14px rgba(6,182,212,.04)} }
  .disp-waiting-title { font-family: 'Poppins', sans-serif; font-size: 2rem; font-weight: 800; color: var(--wh2); }
  .disp-waiting-sub   { font-size: .95rem; color: var(--mu); }

  /* ── Sold overlay ── */
  .disp-sold-overlay {
    position: absolute; inset: 0;
    background: rgba(10,15,26,.88);
    backdrop-filter: blur(6px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1rem; z-index: 10;
    animation: fadeIn .35s ease;
  }
  @keyframes fadeIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:none} }
  .disp-sold-badge {
    font-family: 'Poppins', sans-serif; font-size: 3.2rem; font-weight: 800;
    background: linear-gradient(135deg, var(--gr), var(--ac));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: .06em;
  }
  .disp-sold-paleta { font-size: 1.4rem; color: var(--mu2); font-weight: 600; }
  .disp-sold-monto  { font-family: 'Poppins', sans-serif; font-size: 2.4rem; font-weight: 800; color: var(--wh); font-variant-numeric: tabular-nums; }

  /* ── Footer ── */
  .disp-footer {
    padding: .45rem 1.5rem;
    background: var(--s1);
    border-top: 1px solid var(--b1);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .disp-footer-txt { font-size: .68rem; color: var(--mu); }
  .disp-footer-url { font-size: .7rem; font-weight: 600; color: var(--ac); }
`;

export default function DisplayPage({ params }) {
  // Next.js 15: params es una Promise — usar React.use() para desempaquetar
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || "";

  const [casa,       setCasa]       = useState(null);
  const [loteActivo, setLoteActivo] = useState(null);
  const [oferta,     setOferta]     = useState(0);
  const [ganador,    setGanador]    = useState(null);
  const [historial,  setHistorial]  = useState([]);
  const [timer,      setTimer]      = useState(15);
  const [estado,     setEstado]     = useState("waiting");
  const [flash,      setFlash]      = useState(false);
  const [photoIdx,   setPhotoIdx]   = useState(0);

  const remateIdsRef  = React.useRef(null); // null = cargando, Set = listo
  const loteActivoRef = React.useRef(null);

  // Estado para disparar la suscripción realtime DESPUÉS de tener los IDs
  const [remateIds, setRemateIds] = useState(null);

  /* Cargar casa + remates + lote activo inicial */
  useEffect(()=>{
    if (!slug) return;
    supabase.from("casas").select("*").eq("slug",slug).single()
      .then(async ({ data: casaData }) => {
        if (!casaData) { setRemateIds([]); return; }
        setCasa(casaData);
        const { data: remates } = await supabase.from("remates").select("id").eq("casa_id", casaData.id);
        const ids = remates?.map(r => r.id) || [];
        remateIdsRef.current = new Set(ids);
        setRemateIds(ids); // dispara el useEffect del realtime

        if (ids.length > 0) {
          const { data: loteActual } = await supabase
            .from("lotes").select("*")
            .in("remate_id", ids)
            .eq("estado","en_subasta").limit(1).single();
          if (loteActual) {
            const fotos = Array.isArray(loteActual.imagenes) ? loteActual.imagenes : (loteActual.imagenes ? [loteActual.imagenes] : []);
            const l = { ...loteActual, fotos };
            setLoteActivo(l); loteActivoRef.current = l;
            setOferta(loteActual.base || 0); setEstado("live");
          }
        }
      });
  },[slug]);

  /* Realtime — se suscribe SOLO después de tener remateIds cargados */
  useEffect(()=>{
    if (remateIds === null) return; // todavía cargando, no suscribir aún
    const remateIdsSet = new Set(remateIds);

    const ch = supabase.channel(`display-live-${slug}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"pujas"},(p)=>{
        const puja = p.new;
        // Ignorar pujas si no hay lote activo O si la puja no es de este lote
        if (!loteActivoRef.current) return;
        if (puja.lote_id !== loteActivoRef.current.id) return;
        setOferta(puja.monto);
        setGanador(`Paleta ${String(puja.numero_postor).padStart(3,"0")}`);
        setEstado("live"); setTimer(15);
        setFlash(true); setTimeout(()=>setFlash(false),800);
        setHistorial(prev=>[{
          pal:`P-${String(puja.numero_postor).padStart(4,"0")}`, monto:puja.monto,
        },...prev].slice(0,10));
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"lotes"},(p)=>{
        const l = p.new;
        // Filtro estricto: solo lotes de los remates de ESTA casa
        if (!remateIdsSet.has(l.remate_id)) return;
        if (l.estado==="en_subasta") {
          const fotos = Array.isArray(l.imagenes) ? l.imagenes : (l.imagenes ? [l.imagenes] : []);
          const lc = { ...l, fotos };
          setLoteActivo(lc); loteActivoRef.current = lc;
          setOferta(l.base||0); setGanador(null); setHistorial([]);
          setEstado("live"); setTimer(15); setPhotoIdx(0);
        }
        if (l.estado==="vendido") setEstado("sold");
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[slug, remateIds]);

  /* Countdown */
  useEffect(()=>{
    if (estado!=="live") return;
    if (timer<=0) { setEstado("sold"); return; }
    const t = setTimeout(()=>setTimer(s=>s-1),1000);
    return ()=>clearTimeout(t);
  },[timer,estado]);

  /* Carrusel */
  const imgs = loteActivo?.fotos || [];
  useEffect(()=>{
    if (imgs.length<=1) return;
    const iv = setInterval(()=>setPhotoIdx(p=>(p+1)%imgs.length),5000);
    return ()=>clearInterval(iv);
  },[imgs.length]);

  const timerColor = timer>8 ? "var(--gr)" : timer>4 ? "var(--yl)" : "var(--rd)";
  const timerPct   = (timer/15)*100;
  const badgeCls   = estado==="live" ? "disp-live-badge" : estado==="sold" ? "disp-live-badge sold" : "disp-live-badge wait";

  return (
    <div className="disp-root">
      <style>{CSS}</style>

      {/* ── Header turquesa ── */}
      <div className="disp-header">
        <div style={{display:"flex",alignItems:"center",gap:"1.1rem"}}>
          {/* Logo Pecker blanco — TODO: reemplazar por logo final de Pecker */}
          <div style={{display:"flex",alignItems:"center",gap:".55rem",flexShrink:0}}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="rgba(255,255,255,.6)" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
            </svg>
            <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:".82rem",color:"#fff",lineHeight:1.2}}>
              Auction Software
              <div style={{fontSize:".58rem",color:"rgba(255,255,255,.65)",fontWeight:400,letterSpacing:".05em",textTransform:"uppercase",marginTop:1}}>Pecker</div>
            </div>
          </div>

          {(casa?.logo_url||casa?.nombre)&&<div style={{width:1,height:28,background:"rgba(255,255,255,.25)",margin:"0 .15rem"}}/>}
          {casa?.logo_url
            ? <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                <img src={casa.logo_url} alt={casa.nombre} style={{height:30,maxWidth:140,objectFit:"contain",filter:"brightness(0) invert(1)",opacity:.9}}/>
                <div className="disp-casa">{casa?.nombre||slug}</div>
              </div>
            : <div className="disp-casa">{casa?.nombre||slug}</div>
          }
        </div>

        <div className={badgeCls}>
          {estado==="live"&&<div className="disp-dot"/>}
          {estado==="live"?"EN VIVO":estado==="sold"?"ADJUDICADO":"PRÓXIMAMENTE"}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="disp-body">
        {!loteActivo ? (
          /* Estado de espera */
          <div className="disp-waiting">
            <div className="disp-waiting-ring">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round">
                <circle cx="21" cy="21" r="17"/><path d="M21 11v10l7 5"/>
              </svg>
            </div>
            <div className="disp-waiting-title">Esperando inicio del remate</div>
            <div className="disp-waiting-sub">{casa?.nombre||"El remate comenzará en breve"}</div>
          </div>
        ) : (<>

          {/* ── Columna izquierda — igual que sala-left-card ── */}
          <div className="disp-left">
            {/* Badge */}
            <div className="disp-sala-badge">
              <div className="disp-sala-badge-dot"/>
              {estado==="live"?"EN VIVO":estado==="sold"?"ADJUDICADO":"LOTE ACTIVO"}
            </div>

            {/* Nombre del lote */}
            <div className="disp-lot-title">{loteActivo.nombre}</div>
            {loteActivo.categoria&&<div className="disp-lot-cat">{loteActivo.categoria}</div>}

            {/* Foto */}
            <div className="disp-photo-wrap">
              {imgs.length>0 ? (
                <>
                  <img src={imgs[photoIdx]} alt={loteActivo.nombre}/>
                  {imgs.length>1&&(
                    <div className="disp-photo-dots">
                      {imgs.map((_,i)=>(
                        <div key={i} className={`disp-photo-dot${i===photoIdx?" on":""}`} onClick={()=>setPhotoIdx(i)}/>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="disp-photo-placeholder">
                  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="rgba(90,127,168,.4)" strokeWidth="1.5">
                    <rect x="6" y="12" width="52" height="40" rx="6"/>
                    <circle cx="32" cy="32" r="9"/>
                    <path d="M22 12l4-8h12l4 8"/>
                  </svg>
                  <div style={{fontSize:".82rem",color:"var(--mu)"}}>Sin fotos</div>
                </div>
              )}
              {/* Overlay adjudicado */}
              {estado==="sold"&&(
                <div className="disp-sold-overlay">
                  <div className="disp-sold-badge">ADJUDICADO</div>
                  {ganador&&<div className="disp-sold-paleta">{ganador}</div>}
                  <div className="disp-sold-monto">{fmt(oferta)}</div>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="disp-timer-row">
              <span className="disp-timer-label">Tiempo</span>
              <div className="disp-timer-bar-wrap">
                <div className="disp-timer-bar">
                  <div className="disp-timer-fill" style={{width:`${estado==="live"?timerPct:0}%`,background:timerColor}}/>
                </div>
              </div>
              <div className="disp-timer-num" style={{color:estado==="live"?timerColor:"var(--mu)"}}>{estado==="live"?timer+"s":"—"}</div>
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div className="disp-right">

            {/* Card oferta actual */}
            <div className="disp-bid-card">
              <div className="disp-bid-header">
                <div className="disp-bid-label">Oferta actual</div>
                <div className={`disp-bid-amount${flash?" flash":""}`}>{fmt(oferta||loteActivo.base||0)}</div>
                {ganador&&(
                  <div className="disp-bid-ganador">
                    <div className="disp-bid-ganador-dot"/>
                    {ganador}
                  </div>
                )}
              </div>
              <div className="disp-stats-row">
                <div className="disp-stat-card">
                  <div className="disp-stat-val">{fmt(loteActivo.base||0)}</div>
                  <div className="disp-stat-lbl">Base</div>
                </div>
                <div className="disp-stat-card">
                  <div className="disp-stat-val" style={{color:"var(--ac)"}}>{historial.length}</div>
                  <div className="disp-stat-lbl">Pujas</div>
                </div>
              </div>
            </div>

            {/* Historial de pujas */}
            <div className="disp-hist-card">
              <div className="disp-hist-title">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 1.5"/>
                </svg>
                Historial de pujas
              </div>
              <div className="disp-hist-list">
                {historial.length===0 ? (
                  <div className="disp-hist-empty">Sin pujas aún — esperando...</div>
                ) : historial.map((h,i)=>(
                  <div key={i} className={`disp-hist-row${i===0?" top":""}`}>
                    <div className="disp-hist-avatar">{h.pal.slice(-2)}</div>
                    <span className="disp-hist-pal">{h.pal}</span>
                    <span className="disp-hist-monto">{fmt(h.monto)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>)}
      </div>

      {/* ── Footer ── */}
      <div className="disp-footer">
        <div className="disp-footer-txt">Participa desde tu celular</div>
        <div className="disp-footer-url">pecker.cl/participar/{slug}</div>
        <div className="disp-footer-txt">{new Date().toLocaleString("es-CL",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})}</div>
      </div>
    </div>
  );
}
