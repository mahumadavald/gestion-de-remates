'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = "https://xqkfcqibukghtyfjcwfb.supabase.co";
const SUPA_KEY = "sb_publishable_m2bABYE65JScB4oCJUBmFg_3eVzUuIR";
const supabase = createClient(SUPA_URL, SUPA_KEY);

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; background: #f0f2f5; }

  .disp-root {
    width: 100vw; height: 100vh;
    background: #f0f2f5;
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  /* ── Header ── */
  .disp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: .85rem 2rem;
    background: linear-gradient(160deg, #0e7490 0%, #06B6D4 60%, #14B8A6 100%);
    box-shadow: 0 2px 12px rgba(6,182,212,.3);
  }
  .disp-casa { font-size: .95rem; font-weight: 700; color: rgba(255,255,255,.9); }
  .disp-live  {
    display: flex; align-items: center; gap: .55rem;
    font-size: .78rem; font-weight: 700; color: #0e7490;
    background: #fff;
    padding: .3rem .85rem; border-radius: 999px;
    letter-spacing: .05em; text-transform: uppercase;
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
  }
  .disp-live.sold { color: #0d9488; }
  .disp-live.wait { color: #6b7280; }
  .disp-dot   { width: 7px; height: 7px; border-radius: 50%; background: #06B6D4; animation: blink 1.4s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.35)} }

  /* ── Body grid ── */
  .disp-body {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
  }

  /* ── Foto ── */
  .disp-foto {
    position: relative;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 2px 12px rgba(0,0,0,.07);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .disp-foto img { width: 100%; height: 100%; object-fit: contain; }
  .disp-foto-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1rem; color: #d1d5db;
  }
  .disp-foto-empty svg { opacity: .4; }

  /* ── Right panel ── */
  .disp-panel {
    background: #fff;
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 12px rgba(0,0,0,.07);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* Lote info */
  .disp-lote-info {
    padding: 1.4rem 1.6rem 1.2rem;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }
  .disp-lote-num {
    display: inline-flex; align-items: center; gap: .4rem;
    font-size: .68rem; font-weight: 700; color: #06B6D4;
    letter-spacing: .1em; text-transform: uppercase;
    background: rgba(6,182,212,.08); border: 1px solid rgba(6,182,212,.2);
    padding: .15rem .55rem; border-radius: 4px;
    margin-bottom: .65rem;
  }
  .disp-lote-name { font-family: 'Poppins', sans-serif; font-size: 1.35rem; font-weight: 800; color: #1a1a1a; line-height: 1.2; margin-bottom: .35rem; }
  .disp-lote-cat  { font-size: .8rem; color: #9ca3af; }

  /* Oferta */
  .disp-oferta-wrap {
    padding: 1.4rem 1.6rem;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(6,182,212,.04) 0%, rgba(20,184,166,.04) 100%);
  }
  .disp-oferta-label {
    font-size: .65rem; font-weight: 700; color: #9ca3af;
    text-transform: uppercase; letter-spacing: .1em; margin-bottom: .5rem;
  }
  .disp-oferta-val {
    font-family: 'Poppins', sans-serif;
    font-size: 2.9rem; font-weight: 800;
    color: #06B6D4; line-height: 1;
    transition: color .25s;
    font-variant-numeric: tabular-nums;
  }
  .disp-oferta-val.flash { color: #f59e0b; }
  .disp-paleta { font-size: .88rem; font-weight: 600; color: #6b7280; margin-top: .45rem; }

  .disp-base-row { display: flex; gap: 1.5rem; margin-top: .85rem; }
  .disp-base-item-label { font-size: .58rem; color: #9ca3af; text-transform: uppercase; letter-spacing: .07em; margin-bottom: .1rem; }
  .disp-base-item-val   { font-size: .9rem; font-weight: 700; color: #374151; font-variant-numeric: tabular-nums; }

  /* Timer */
  .disp-timer-wrap {
    padding: .9rem 1.6rem;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }
  .disp-timer-label { font-size: .65rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .45rem; }
  .disp-timer-bar   { height: 7px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .disp-timer-fill  { height: 100%; border-radius: 4px; transition: width 1s linear, background .5s; }
  .disp-timer-num   { font-family: 'Poppins', sans-serif; font-size: 1.6rem; font-weight: 800; margin-top: .4rem; font-variant-numeric: tabular-nums; }

  /* Historial */
  .disp-hist {
    flex: 1; overflow-y: auto;
    padding: 1rem 1.6rem;
  }
  .disp-hist::-webkit-scrollbar { width: 4px; }
  .disp-hist::-webkit-scrollbar-track { background: transparent; }
  .disp-hist::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  .disp-hist-title { font-size: .65rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .6rem; }
  .disp-hist-row   {
    display: flex; align-items: center; justify-content: space-between;
    padding: .5rem .7rem; border-radius: 8px; margin-bottom: .25rem;
    transition: background .15s;
  }
  .disp-hist-row:hover { background: #f9fafb; }
  .disp-hist-row.top   { background: rgba(6,182,212,.07); }
  .disp-hist-pal   { font-size: .8rem; color: #6b7280; font-weight: 500; }
  .disp-hist-monto { font-size: .9rem; font-weight: 700; color: #374151; font-variant-numeric: tabular-nums; }
  .disp-hist-row.top .disp-hist-monto { color: #06B6D4; }
  .disp-hist-row.top .disp-hist-pal   { color: #0e7490; font-weight: 600; }

  /* Footer */
  .disp-footer {
    padding: .55rem 2rem;
    background: #fff;
    border-top: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: space-between;
  }
  .disp-footer-txt { font-size: .7rem; color: #9ca3af; }
  .disp-footer-url { font-size: .72rem; font-weight: 600; color: #06B6D4; }

  /* Waiting */
  .disp-waiting {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.5rem; text-align: center;
  }
  .disp-waiting-icon {
    width: 88px; height: 88px; border-radius: 50%;
    background: linear-gradient(135deg,rgba(6,182,212,.1),rgba(20,184,166,.1));
    border: 2px solid rgba(6,182,212,.2);
    display: flex; align-items: center; justify-content: center;
  }
  .disp-waiting-title { font-family: 'Poppins', sans-serif; font-size: 2rem; font-weight: 800; color: #1a1a1a; }
  .disp-waiting-sub   { font-size: .95rem; color: #6b7280; }

  /* Sold overlay */
  .disp-sold-overlay {
    position: absolute; inset: 0;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(6px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1rem; z-index: 10;
    animation: fadeIn .35s ease;
  }
  @keyframes fadeIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:none} }
  .disp-sold-badge  {
    font-family: 'Poppins', sans-serif; font-size: 3rem; font-weight: 800;
    background: linear-gradient(135deg,#0e7490,#14B8A6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: .04em;
  }
  .disp-sold-paleta { font-size: 1.4rem; color: #6b7280; font-weight: 600; }
  .disp-sold-monto  { font-family: 'Poppins', sans-serif; font-size: 2.2rem; font-weight: 800; color: #1a1a1a; font-variant-numeric: tabular-nums; }

  /* Foto dots */
  .disp-foto-dots { position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
  .disp-foto-dot  { width: 8px; height: 8px; border-radius: 50%; background: rgba(0,0,0,.18); cursor: pointer; transition: all .2s; }
  .disp-foto-dot.on { width: 22px; border-radius: 4px; background: #06B6D4; }
`;

export default function DisplayPage({ params }) {
  const slug = params?.slug || "rematesahumada";

  const [casa,       setCasa]       = useState(null);
  const [loteActivo, setLoteActivo] = useState(null);
  const [oferta,     setOferta]     = useState(0);
  const [ganador,    setGanador]    = useState(null);
  const [historial,  setHistorial]  = useState([]);
  const [timer,      setTimer]      = useState(15);
  const [estado,     setEstado]     = useState("waiting");
  const [flash,      setFlash]      = useState(false);
  const [photoIdx,   setPhotoIdx]   = useState(0);

  useEffect(()=>{
    supabase.from("casas").select("*").eq("slug",slug).single()
      .then(({data})=>{ if(data) setCasa(data); });
  },[slug]);

  useEffect(()=>{
    const ch = supabase.channel("display-live")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"pujas"},(p)=>{
        const puja = p.new;
        setOferta(puja.monto);
        setGanador(`Paleta ${String(puja.numero_postor).padStart(3,"0")}`);
        setEstado("live");
        setTimer(15);
        setFlash(true); setTimeout(()=>setFlash(false),800);
        setHistorial(prev=>[{
          pal:`P-${String(puja.numero_postor).padStart(4,"0")}`,
          monto: puja.monto,
        },...prev].slice(0,8));
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"lotes"},(p)=>{
        const l = p.new;
        if(l.estado==="en_subasta"){
          setLoteActivo(l);
          setOferta(l.base||0);
          setGanador(null);
          setHistorial([]);
          setEstado("live");
          setTimer(15);
          setPhotoIdx(0);
        }
        if(l.estado==="vendido"){
          setEstado("sold");
        }
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[]);

  useEffect(()=>{
    if(estado!=="live") return;
    if(timer<=0){ setEstado("sold"); return; }
    const t = setTimeout(()=>setTimer(s=>s-1),1000);
    return ()=>clearTimeout(t);
  },[timer,estado]);

  const imgs = loteActivo?.fotos || [];
  useEffect(()=>{
    if(imgs.length<=1) return;
    const iv = setInterval(()=>setPhotoIdx(p=>(p+1)%imgs.length),5000);
    return ()=>clearInterval(iv);
  },[imgs.length]);

  const timerColor = timer>8?"#14B8A6":timer>4?"#f59e0b":"#ef4444";
  const timerPct   = (timer/15)*100;

  const liveBadgeClass = estado==="live" ? "disp-live" : estado==="sold" ? "disp-live sold" : "disp-live wait";

  return (
    <div className="disp-root">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div className="disp-header">
        <div style={{display:"flex",alignItems:"center",gap:"1.25rem"}}>
          {/* Logo GR */}
          <div style={{display:"flex",alignItems:"center",gap:".6rem",flexShrink:0}}>
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="rgba(255,255,255,.65)" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
            </svg>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:".82rem",color:"#fff",lineHeight:1}}>Auction Software</div>
              <div style={{fontSize:".6rem",color:"rgba(255,255,255,.65)",letterSpacing:".06em",textTransform:"uppercase",marginTop:1}}>Gestión de Remates</div>
            </div>
          </div>

          {/* Divider + Logo casa */}
          {(casa?.logo_url || casa?.nombre) && (
            <div style={{width:1,height:32,background:"rgba(255,255,255,.25)",margin:"0 .25rem"}}/>
          )}
          {casa?.logo_url ? (
            <div style={{display:"flex",alignItems:"center",gap:".65rem"}}>
              <img src={casa.logo_url} alt={casa.nombre} style={{height:34,maxWidth:160,objectFit:"contain"}}/>
              <div className="disp-casa">{casa?.nombre||slug}</div>
            </div>
          ) : (
            <div className="disp-casa">{casa?.nombre||slug}</div>
          )}
        </div>

        <div className={liveBadgeClass}>
          {estado==="live" && <div className="disp-dot"/>}
          {estado==="live"?"EN VIVO":estado==="sold"?"ADJUDICADO":"PRÓXIMAMENTE"}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="disp-body">
        {!loteActivo ? (
          <div className="disp-waiting">
            <div className="disp-waiting-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round">
                <circle cx="20" cy="20" r="16"/><path d="M20 10v10l7 5"/>
              </svg>
            </div>
            <div className="disp-waiting-title">Esperando inicio del remate</div>
            <div className="disp-waiting-sub">{casa?.nombre || "El remate comenzará en breve"}</div>
          </div>
        ) : (<>
          {/* Foto */}
          <div className="disp-foto">
            {imgs.length>0 ? (
              <>
                <img src={imgs[photoIdx]} alt={loteActivo.nombre}/>
                {imgs.length>1&&(
                  <div className="disp-foto-dots">
                    {imgs.map((_,i)=>(
                      <div key={i} className={`disp-foto-dot${i===photoIdx?" on":""}`} onClick={()=>setPhotoIdx(i)}/>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="disp-foto-empty">
                <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <rect x="8" y="16" width="64" height="48" rx="8"/><circle cx="40" cy="40" r="12"/><path d="M28 16l5-10h14l5 10"/>
                </svg>
                <div style={{fontSize:"1rem",color:"#d1d5db",fontWeight:500}}>Sin fotos disponibles</div>
              </div>
            )}
            {estado==="sold"&&(
              <div className="disp-sold-overlay">
                <div className="disp-sold-badge">ADJUDICADO</div>
                {ganador&&<div className="disp-sold-paleta">{ganador}</div>}
                <div className="disp-sold-monto">{fmt(oferta)}</div>
              </div>
            )}
          </div>

          {/* Panel derecho */}
          <div className="disp-panel">
            {/* Lote info */}
            <div className="disp-lote-info">
              <div className="disp-lote-num">Lote {loteActivo.orden||"—"}{loteActivo.categoria ? ` · ${loteActivo.categoria}` : ""}</div>
              <div className="disp-lote-name">{loteActivo.nombre}</div>
              {loteActivo.descripcion && <div className="disp-lote-cat">{loteActivo.descripcion.split("|")[0]?.trim()}</div>}
            </div>

            {/* Oferta */}
            <div className="disp-oferta-wrap">
              <div className="disp-oferta-label">Oferta actual</div>
              <div className={`disp-oferta-val${flash?" flash":""}`}>{fmt(oferta||loteActivo.base||0)}</div>
              {ganador&&<div className="disp-paleta">{ganador}</div>}
              <div className="disp-base-row">
                <div>
                  <div className="disp-base-item-label">Base</div>
                  <div className="disp-base-item-val">{fmt(loteActivo.base||0)}</div>
                </div>
                <div>
                  <div className="disp-base-item-label">Pujas</div>
                  <div className="disp-base-item-val" style={{color:"#06B6D4"}}>{historial.length}</div>
                </div>
              </div>
            </div>

            {/* Timer */}
            {estado==="live"&&(
              <div className="disp-timer-wrap">
                <div className="disp-timer-label">Tiempo para adjudicar</div>
                <div className="disp-timer-bar">
                  <div className="disp-timer-fill" style={{width:`${timerPct}%`,background:timerColor}}/>
                </div>
                <div className="disp-timer-num" style={{color:timerColor}}>{timer}s</div>
              </div>
            )}

            {/* Historial */}
            <div className="disp-hist">
              <div className="disp-hist-title">Historial de pujas</div>
              {historial.length===0 ? (
                <div style={{color:"#d1d5db",fontSize:".82rem",marginTop:".25rem"}}>Sin pujas aún</div>
              ) : historial.map((h,i)=>(
                <div key={i} className={`disp-hist-row${i===0?" top":""}`}>
                  <span className="disp-hist-pal">{h.pal}</span>
                  <span className="disp-hist-monto">{fmt(h.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        </>)}
      </div>

      {/* ── Footer ── */}
      <div className="disp-footer">
        <div className="disp-footer-txt">Participa desde tu celular</div>
        <div className="disp-footer-url">gestionderemates.cl/participar/{slug}</div>
        <div className="disp-footer-txt">{new Date().toLocaleString("es-CL",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})}</div>
      </div>
    </div>
  );
}
