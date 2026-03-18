'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = "https://xqkfcqibukghtyfjcwfb.supabase.co";
const SUPA_KEY = "sb_publishable_m2bABYE65JScB4oCJUBmFg_3eVzUuIR";
const supabase = createClient(SUPA_URL, SUPA_KEY);

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; background: #0d1117; }

  .disp-root {
    width: 100vw; height: 100vh;
    background: #0d1117;
    font-family: 'Inter', sans-serif;
    color: #e0eaf4;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  .disp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2.5rem;
    background: #1F2937;
    border-bottom: 2px solid #2d4060;
  }
  .disp-logo { font-family: 'Poppins', sans-serif; font-size: 1rem; font-weight: 800; color: #06B6D4; letter-spacing: .05em; text-transform: uppercase; }
  .disp-casa { font-size: .9rem; font-weight: 600; color: #7a9ab8; }
  .disp-live  { display: flex; align-items: center; gap: .6rem; font-size: .85rem; font-weight: 700; color: #14B8A6; }
  .disp-dot   { width: 10px; height: 10px; border-radius: 50%; background: #14B8A6; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

  .disp-body {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 0;
    overflow: hidden;
  }

  .disp-foto {
    position: relative;
    background: #0d1117;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .disp-foto img { width: 100%; height: 100%; object-fit: contain; }
  .disp-foto-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #2a3d52; }

  .disp-panel {
    background: #0d1117;
    border-left: 2px solid #2d4060;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .disp-lote-info {
    padding: 1.5rem 1.75rem;
    border-bottom: 1px solid #2d4060;
    flex-shrink: 0;
  }
  .disp-lote-num { font-family: 'Inter', sans-serif; font-size: .75rem; font-weight: 700; color: #06B6D4; letter-spacing: .1em; text-transform: uppercase; margin-bottom: .4rem; }
  .disp-lote-name { font-family: 'Poppins', sans-serif; font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: .4rem; }
  .disp-lote-cat  { font-size: .82rem; color: #4a6a8a; }

  .disp-oferta-wrap {
    padding: 1.5rem 1.75rem;
    border-bottom: 1px solid #2d4060;
    flex-shrink: 0;
  }
  .disp-oferta-label { font-size: .7rem; font-weight: 700; color: #4a6a8a; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .5rem; }
  .disp-oferta-val   { font-family: 'Poppins', sans-serif; font-size: 2.8rem; font-weight: 800; color: #14B8A6; line-height: 1; transition: color .3s; }
  .disp-oferta-val.flash { color: #f59e0b; }
  .disp-paleta       { font-family: 'Inter', sans-serif; font-size: .95rem; font-weight: 700; color: #7a9ab8; margin-top: .5rem; }

  .disp-timer-wrap {
    padding: 1rem 1.75rem;
    border-bottom: 1px solid #2d4060;
    flex-shrink: 0;
  }
  .disp-timer-label { font-size: .7rem; font-weight: 700; color: #4a6a8a; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .4rem; }
  .disp-timer-bar   { height: 8px; background: #2d4060; border-radius: 4px; overflow: hidden; }
  .disp-timer-fill  { height: 100%; border-radius: 4px; transition: width 1s linear, background .5s; }
  .disp-timer-num   { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 700; margin-top: .4rem; }

  .disp-hist {
    flex: 1; overflow-y: auto;
    padding: 1rem 1.75rem;
  }
  .disp-hist-title { font-size: .7rem; font-weight: 700; color: #4a6a8a; text-transform: uppercase; letter-spacing: .1em; margin-bottom: .65rem; }
  .disp-hist-row   { display: flex; align-items: center; justify-content: space-between; padding: .55rem 0; border-bottom: 1px solid rgba(255,255,255,.04); }
  .disp-hist-row:last-child { border-bottom: none; }
  .disp-hist-pal   { font-family: 'Inter', sans-serif; font-size: .82rem; color: #4a6a8a; }
  .disp-hist-monto { font-family: 'Inter', sans-serif; font-size: .9rem; font-weight: 700; color: #e0eaf4; }
  .disp-hist-row.top .disp-hist-monto { color: #14B8A6; }

  .disp-footer {
    padding: .65rem 2.5rem;
    background: #1F2937;
    border-top: 2px solid #2d4060;
    display: flex; align-items: center; justify-content: space-between;
  }
  .disp-footer-txt { font-size: .72rem; color: #2a4a6a; }
  .disp-footer-url { font-family: 'Inter', sans-serif; font-size: .72rem; color: #06B6D4; }

  .disp-waiting {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.5rem; text-align: center;
  }
  .disp-waiting-title { font-family: 'Poppins', sans-serif; font-size: 2.5rem; font-weight: 800; color: #2d4060; }
  .disp-waiting-sub   { font-size: 1rem; color: #2a3d52; }

  .disp-sold-overlay {
    position: absolute; inset: 0;
    background: rgba(4,11,20,.85);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1rem; z-index: 10;
    animation: fadeIn .3s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .disp-sold-badge { font-family: 'Poppins', sans-serif; font-size: 3.5rem; font-weight: 800; color: #14B8A6; }
  .disp-sold-paleta { font-family: 'Inter', sans-serif; font-size: 1.5rem; color: #7a9ab8; }
  .disp-sold-monto  { font-family: 'Poppins', sans-serif; font-size: 2rem; font-weight: 800; color: #fff; }

  .disp-foto-dots { position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
  .disp-foto-dot  { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.3); cursor: pointer; transition: all .2s; }
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

  return (
    <div className="disp-root">
      <style>{CSS}</style>

      <div className="disp-header">
        <div style={{display:"flex",alignItems:"center",gap:"1.25rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".65rem",flexShrink:0}}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="rgba(6,182,212,.15)" stroke="rgba(6,182,212,.3)" strokeWidth="1"/>
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#06B6D4" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
            </svg>
            <div>
              <div style={{fontFamily:"'Poppins', sans-serif",fontWeight:800,fontSize:".9rem",color:"#fff",letterSpacing:"-.01em",lineHeight:1}}>GR</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontWeight:400,fontSize:".55rem",color:"#7aaec8",letterSpacing:".08em",textTransform:"uppercase",marginTop:1}}>Auction Software</div>
            </div>
          </div>

          {casa?.logo_url && <div style={{width:1,height:32,background:"rgba(255,255,255,.12)"}}/>}

          {casa?.logo_url ? (
            <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
              <img src={casa.logo_url} alt={casa.nombre} style={{height:36,maxWidth:160,objectFit:"contain"}}/>
              <div className="disp-casa" style={{fontSize:".78rem"}}>{casa?.nombre||slug}</div>
            </div>
          ) : (
            <div className="disp-casa">{casa?.nombre||slug}</div>
          )}
        </div>

        <div className="disp-live">
          <div className="disp-dot"/>
          {estado==="live"?"EN VIVO":estado==="sold"?"ADJUDICADO":"PRÓXIMAMENTE"}
        </div>
      </div>

      <div className="disp-body">
        {!loteActivo ? (
          <div className="disp-waiting">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#2d4060" strokeWidth="2" strokeLinecap="round">
              <circle cx="40" cy="40" r="35"/><path d="M40 22v18l12 8"/>
            </svg>
            <div className="disp-waiting-title">Esperando inicio del remate</div>
            <div className="disp-waiting-sub">{casa?.nombre}</div>
          </div>
        ) : (<>
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
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="16" width="64" height="48" rx="6"/><circle cx="40" cy="40" r="12"/><path d="M28 16l5-10h14l5 10"/></svg>
                <div style={{fontSize:"1rem",color:"#2a3d52"}}>Sin fotos disponibles</div>
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

          <div className="disp-panel">
            <div className="disp-lote-info">
              <div className="disp-lote-num">Lote {loteActivo.orden||"—"} · {loteActivo.categoria}</div>
              <div className="disp-lote-name">{loteActivo.nombre}</div>
              <div className="disp-lote-cat">{loteActivo.descripcion?.split("|")[0]?.trim()||""}</div>
            </div>

            <div className="disp-oferta-wrap">
              <div className="disp-oferta-label">Oferta actual</div>
              <div className={`disp-oferta-val${flash?" flash":""}`}>{fmt(oferta||loteActivo.base||0)}</div>
              {ganador&&<div className="disp-paleta">{ganador}</div>}
              <div style={{marginTop:".75rem",display:"flex",alignItems:"center",gap:"1rem"}}>
                <div>
                  <div style={{fontSize:".6rem",color:"#4a6a8a",marginBottom:".15rem"}}>BASE</div>
                  <div style={{fontFamily:"'Inter', sans-serif",fontSize:".9rem",color:"#4a6a8a"}}>{fmt(loteActivo.base||0)}</div>
                </div>
                <div>
                  <div style={{fontSize:".6rem",color:"#4a6a8a",marginBottom:".15rem"}}>PUJAS</div>
                  <div style={{fontFamily:"'Inter', sans-serif",fontSize:".9rem",color:"#e0eaf4",fontWeight:700}}>{historial.length}</div>
                </div>
              </div>
            </div>

            {estado==="live"&&(
              <div className="disp-timer-wrap">
                <div className="disp-timer-label">Tiempo para adjudicar</div>
                <div className="disp-timer-bar">
                  <div className="disp-timer-fill" style={{width:`${timerPct}%`,background:timerColor}}/>
                </div>
                <div className="disp-timer-num" style={{color:timerColor}}>{timer}s</div>
              </div>
            )}

            <div className="disp-hist">
              <div className="disp-hist-title">Historial de pujas</div>
              {historial.length===0 ? (
                <div style={{color:"#2a3d52",fontSize:".8rem"}}>Sin pujas aún</div>
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

      <div className="disp-footer">
        <div className="disp-footer-txt">Sigue el remate desde tu celular</div>
        <div className="disp-footer-url">gestionderemates.cl/participar/{slug}</div>
        <div className="disp-footer-txt">{new Date().toLocaleString("es-CL",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})}</div>
      </div>
    </div>
  );
}
