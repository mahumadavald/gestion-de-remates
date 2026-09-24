'use client'
import React, { useState, useEffect, use } from "react";
import { supabase } from "../../lib/supabase";
import { fmt } from "../../lib/format";

export const dynamic = 'force-dynamic';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; background: #0a0f1a; }

  :root {
    --bg:  #0a0f1a;
    --s1:  #0f1724;
    --s2:  #14202e;
    --s3:  #192840;
    --b1:  rgba(26,58,92,.5);
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

  /* ── Header ── */
  .disp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: .65rem 1.5rem;
    background: linear-gradient(160deg, #0e7490 0%, #06B6D4 60%, #14B8A6 100%);
    flex-shrink: 0;
    box-shadow: 0 2px 16px rgba(6,182,212,.3);
  }
  .disp-casa { font-size: .9rem; font-weight: 700; color: rgba(255,255,255,.9); }
  .disp-live-badge {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .26rem .85rem;
    background: rgba(255,255,255,.18);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 999px;
    font-size: .7rem; font-weight: 700; color: #fff;
    letter-spacing: .06em; text-transform: uppercase;
    backdrop-filter: blur(4px);
  }
  .disp-live-badge.sold { background: rgba(20,184,166,.25); border-color: rgba(20,184,166,.4); }
  .disp-live-badge.wait { background: rgba(255,255,255,.08); color: rgba(255,255,255,.6); }
  .disp-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: blink 1.2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  /* ── Body — 2 columnas ── */
  .disp-body {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
    min-height: 0;
  }

  /* ═══════════════════════════════
     PANEL IZQUIERDO
  ═══════════════════════════════ */
  .disp-left {
    background: var(--s2);
    border: 1px solid var(--b1);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  /* Tabs */
  .disp-tabs {
    display: flex;
    border-bottom: 1px solid var(--b1);
    flex-shrink: 0;
    background: var(--s1);
    border-radius: 16px 16px 0 0;
  }
  .disp-tab {
    flex: 1;
    padding: .75rem 1rem;
    font-size: .78rem; font-weight: 600;
    color: var(--mu);
    cursor: default;
    text-align: center;
    border-bottom: 2px solid transparent;
    transition: color .2s, border-color .2s;
  }
  .disp-tab.on { color: var(--ac); border-bottom-color: var(--ac); }

  /* ── Lote Actual tab ── */
  .disp-lote-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  .disp-lote-meta {
    padding: .85rem 1.1rem .6rem;
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .75rem;
  }
  .disp-lote-num-badge {
    font-size: .65rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: var(--ac); background: rgba(56,178,246,.1); border: 1px solid rgba(56,178,246,.2);
    border-radius: 6px; padding: .22rem .55rem; white-space: nowrap;
  }
  .disp-lote-cat-badge {
    font-size: .65rem; font-weight: 700; letter-spacing: .04em;
    color: var(--gr); background: rgba(20,184,166,.1); border: 1px solid rgba(20,184,166,.2);
    border-radius: 6px; padding: .22rem .55rem; white-space: nowrap;
  }
  .disp-lote-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.05rem; font-weight: 800; color: var(--wh);
    line-height: 1.3;
    padding: 0 1.1rem .5rem;
    flex-shrink: 0;
  }

  /* Foto carousel */
  .disp-photo-wrap {
    position: relative;
    background: var(--s3);
    margin: 0 .85rem;
    border-radius: 12px;
    overflow: hidden;
    flex: 1;
    min-height: 160px;
  }
  .disp-photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .disp-photo-placeholder {
    width: 100%; height: 100%; min-height: 160px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem;
  }
  .disp-photo-dots { position: absolute; bottom: .75rem; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; }
  .disp-photo-dot  { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.3); cursor: pointer; transition: all .2s; }
  .disp-photo-dot.on { width: 20px; border-radius: 4px; background: var(--ac); }
  /* Nav arrows */
  .disp-photo-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(10,15,26,.65); border: 1px solid var(--b1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s;
    color: var(--wh2);
  }
  .disp-photo-arrow:hover { background: rgba(56,178,246,.2); }
  .disp-photo-arrow.left { left: .6rem; }
  .disp-photo-arrow.right { right: .6rem; }

  /* Sold overlay */
  .disp-sold-overlay {
    position: absolute; inset: 0;
    background: rgba(10,15,26,.88);
    backdrop-filter: blur(6px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: .75rem; z-index: 10;
    animation: fadeIn .35s ease;
  }
  @keyframes fadeIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:none} }
  .disp-sold-badge {
    font-family: 'Poppins', sans-serif; font-size: 3rem; font-weight: 800;
    background: linear-gradient(135deg, var(--gr), var(--ac));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: .06em;
  }
  .disp-sold-paleta { font-size: 1.3rem; color: var(--mu2); font-weight: 600; }
  .disp-sold-monto  { font-family: 'Poppins', sans-serif; font-size: 2.2rem; font-weight: 800; color: var(--wh); font-variant-numeric: tabular-nums; }

  /* Specs grid */
  .disp-specs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .4rem;
    padding: .7rem .85rem .85rem;
    flex-shrink: 0;
  }
  .disp-spec-item {
    background: rgba(255,255,255,.03);
    border: 1px solid var(--b1);
    border-radius: 8px;
    padding: .4rem .55rem;
    text-align: center;
  }
  .disp-spec-val { font-size: .82rem; font-weight: 700; color: var(--wh); }
  .disp-spec-lbl { font-size: .58rem; font-weight: 500; color: var(--mu); text-transform: uppercase; letter-spacing: .05em; margin-top: .1rem; }

  /* ── Todos los lotes tab ── */
  .disp-todos-panel {
    flex: 1;
    overflow-y: auto;
    padding: .6rem .85rem .85rem;
    display: flex; flex-direction: column; gap: .4rem;
  }
  .disp-todos-panel::-webkit-scrollbar { width: 4px; }
  .disp-todos-panel::-webkit-scrollbar-thumb { background: var(--b1); border-radius: 4px; }

  .disp-lote-row {
    display: flex; align-items: center; gap: .75rem;
    padding: .55rem .7rem;
    border-radius: 10px;
    background: rgba(255,255,255,.025);
    border: 1px solid var(--b1);
    transition: border-color .2s;
  }
  .disp-lote-row.activo { background: rgba(56,178,246,.07); border-color: rgba(56,178,246,.25); }
  .disp-lote-row.vendido { opacity: .6; }

  .disp-lote-thumb {
    width: 44px; height: 44px; border-radius: 7px;
    object-fit: cover; flex-shrink: 0;
    background: var(--s3);
  }
  .disp-lote-thumb-ph {
    width: 44px; height: 44px; border-radius: 7px;
    background: var(--s3); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .disp-lote-row-info { flex: 1; min-width: 0; }
  .disp-lote-row-name {
    font-size: .8rem; font-weight: 600; color: var(--wh);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .disp-lote-row-meta { display: flex; align-items: center; gap: .45rem; margin-top: .2rem; }
  .disp-lote-row-num { font-size: .65rem; color: var(--mu); }
  .disp-lote-row-cat {
    font-size: .6rem; font-weight: 600; color: var(--gr);
    background: rgba(20,184,166,.1); border-radius: 4px; padding: .1rem .35rem;
  }
  .disp-lote-row-right { text-align: right; flex-shrink: 0; }
  .disp-lote-row-monto { font-size: .82rem; font-weight: 700; color: var(--wh); font-variant-numeric: tabular-nums; }
  .disp-lote-row-status {
    font-size: .6rem; font-weight: 700; letter-spacing: .04em;
    margin-top: .2rem;
  }
  .disp-lote-row-status.vendido { color: var(--gr); }
  .disp-lote-row-status.activo  { color: var(--ac); }
  .disp-lote-row-status.espera  { color: var(--mu); }

  /* ═══════════════════════════════
     PANEL DERECHO
  ═══════════════════════════════ */
  .disp-right {
    display: flex; flex-direction: column; gap: .85rem;
    overflow: hidden; min-height: 0;
  }

  /* EN VIVO area */
  .disp-live-area {
    background: var(--s1);
    border: 1px solid var(--b1);
    border-radius: 14px;
    padding: .85rem 1rem;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .disp-live-pill {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .28rem .75rem;
    background: rgba(20,184,166,.15);
    border: 1px solid rgba(20,184,166,.3);
    border-radius: 20px;
    font-size: .7rem; font-weight: 700; letter-spacing: .05em;
    color: var(--gr);
  }
  .disp-live-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gr); animation: blink 1.2s infinite; }
  .disp-viewers {
    font-size: .72rem; color: var(--mu);
    display: flex; align-items: center; gap: .35rem;
  }

  /* Timer */
  .disp-timer-row {
    display: flex; align-items: center; gap: .7rem;
  }
  .disp-timer-label { font-size: .65rem; font-weight: 600; color: var(--mu); white-space: nowrap; }
  .disp-timer-bar-wrap { flex: 1; }
  .disp-timer-bar { height: 5px; background: var(--b1); border-radius: 3px; overflow: hidden; }
  .disp-timer-fill { height: 100%; border-radius: 3px; transition: width 1s linear, background .5s; }
  .disp-timer-num {
    font-family: 'Inter', monospace; font-size: 1.3rem; font-weight: 800;
    letter-spacing: .02em; min-width: 3.5ch; text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Bid card */
  .disp-bid-card {
    background: var(--s2);
    border: 1px solid var(--b1);
    border-radius: 14px;
    padding: 1rem 1.1rem;
    flex-shrink: 0;
  }
  .disp-bid-label {
    font-size: .62rem; font-weight: 700; color: var(--mu);
    text-transform: uppercase; letter-spacing: .07em; margin-bottom: .3rem;
  }
  .disp-bid-amount {
    font-size: 2.8rem; font-weight: 800; color: var(--ac);
    line-height: 1; letter-spacing: -.02em;
    transition: color .2s;
    font-variant-numeric: tabular-nums;
    font-family: 'Poppins', sans-serif;
  }
  .disp-bid-amount.flash { color: var(--yl); text-shadow: 0 0 20px rgba(246,173,85,.5); }
  .disp-bid-ganador {
    font-size: .85rem; font-weight: 600; color: var(--mu2); margin-top: .5rem;
    display: flex; align-items: center; gap: .4rem;
  }
  .disp-bid-ganador-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gr); animation: blink 1.2s infinite; }
  .disp-bid-base {
    font-size: .72rem; color: var(--mu); margin-top: .5rem;
    display: flex; align-items: center; gap: .45rem;
  }
  .disp-bid-pujas {
    display: inline-flex; align-items: center; gap: .35rem;
    background: rgba(56,178,246,.1); border: 1px solid rgba(56,178,246,.18);
    border-radius: 6px; padding: .2rem .5rem;
    font-size: .68rem; font-weight: 700; color: var(--ac);
    margin-left: auto;
  }

  /* Historial */
  .disp-hist-card {
    background: var(--s2);
    border: 1px solid var(--b1);
    border-radius: 14px;
    padding: .85rem 1rem;
    flex: 1; min-height: 0; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .disp-hist-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: .65rem; flex-shrink: 0;
  }
  .disp-hist-title {
    font-size: .62rem; font-weight: 700; color: var(--mu);
    text-transform: uppercase; letter-spacing: .07em;
    display: flex; align-items: center; gap: .4rem;
  }
  .disp-hist-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .3rem; }
  .disp-hist-list::-webkit-scrollbar { width: 3px; }
  .disp-hist-list::-webkit-scrollbar-thumb { background: var(--b1); border-radius: 3px; }
  .disp-hist-row {
    display: grid;
    grid-template-columns: 22px 28px 1fr auto;
    align-items: center; gap: .45rem;
    padding: .45rem .6rem;
    border-radius: 8px;
    background: rgba(255,255,255,.025);
    border: 1px solid var(--b1);
    animation: fdin .2s ease;
  }
  @keyframes fdin { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
  .disp-hist-row.top { background: rgba(56,178,246,.08); border-color: rgba(56,178,246,.22); }
  .disp-hist-pos { font-size: .65rem; font-weight: 700; color: var(--mu); text-align: center; }
  .disp-hist-row.top .disp-hist-pos { color: var(--ac); }
  .disp-hist-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--ac); display: flex; align-items: center; justify-content: center;
    font-size: .58rem; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .disp-hist-row.top .disp-hist-avatar { background: var(--gr); }
  .disp-hist-pal { font-size: .74rem; font-weight: 600; color: var(--wh2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .disp-hist-monto { font-size: .82rem; font-weight: 700; color: var(--wh); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .disp-hist-row.top .disp-hist-monto { color: var(--ac); }
  .disp-hist-empty { font-size: .75rem; color: var(--mu); padding: .5rem 0; text-align: center; }

  /* ── Waiting ── */
  .disp-waiting {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.5rem; text-align: center;
  }
  .disp-waiting-ring {
    width: 88px; height: 88px; border-radius: 50%;
    background: rgba(6,182,212,.05);
    border: 2px solid rgba(6,182,212,.18);
    display: flex; align-items: center; justify-content: center;
    animation: slowpulse 3s ease-in-out infinite;
  }
  @keyframes slowpulse { 0%,100%{box-shadow:0 0 0 0 rgba(6,182,212,.12)} 50%{box-shadow:0 0 0 14px rgba(6,182,212,.04)} }
  .disp-waiting-title { font-family: 'Poppins', sans-serif; font-size: 1.8rem; font-weight: 800; color: var(--wh2); }
  .disp-waiting-sub   { font-size: .9rem; color: var(--mu); }

  /* ── Footer ── */
  .disp-footer {
    padding: .4rem 1.5rem;
    background: var(--s1);
    border-top: 1px solid var(--b1);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .disp-footer-txt { font-size: .65rem; color: var(--mu); }
  .disp-footer-url { font-size: .68rem; font-weight: 600; color: var(--ac); }

  /* ── MOBILE ── */
  @media (max-width: 700px) {
    html, body { overflow: auto; height: auto; }
    .disp-root { height: auto; min-height: 100dvh; overflow: visible; }
    .disp-body { grid-template-columns: 1fr; overflow: visible; padding: .75rem; gap: .75rem; height: auto; }
    .disp-left  { overflow: visible; min-height: 0; }
    .disp-right { overflow: visible; }
    .disp-photo-wrap { min-height: 210px; max-height: 250px; flex: none; }
    .disp-bid-amount  { font-size: 2.4rem; }
    .disp-hist-card   { display: none; }
    .disp-specs       { grid-template-columns: repeat(2,1fr); }
    .disp-footer-txt  { display: none; }
  }
`;

export default function DisplayPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || "";

  const [casa,       setCasa]       = useState(null);
  const [loteActivo, setLoteActivo] = useState(null);
  const [oferta,     setOferta]     = useState(0);
  const [ganador,    setGanador]    = useState(null);
  const [historial,  setHistorial]  = useState([]);
  const [timer,      setTimer]      = useState(15);
  const BID_TIMER = 15;
  const [estado,     setEstado]     = useState("waiting");
  const [flash,      setFlash]      = useState(false);
  const [photoIdx,   setPhotoIdx]   = useState(0);
  const [tab,        setTab]        = useState("lote");
  const [allLotes,   setAllLotes]   = useState([]);

  const remateIdsRef  = React.useRef(null);
  const loteActivoRef = React.useRef(null);
  const [remateIds,   setRemateIds]   = useState(null);

  const [authChecked,    setAuthChecked]    = useState(false);
  const [accesoDenegado, setAccesoDenegado] = useState(false);

  useEffect(()=>{
    if (!supabase || !slug) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/postor"; return; }
      const { data: perfil } = await supabase.from("usuarios").select("roles").eq("id", session.user.id).maybeSingle();
      const isStaff = perfil?.roles?.some(r => ["admin","martillero"].includes(r));
      if (isStaff) { setAuthChecked(true); return; }
      const { data: casaRow } = await supabase.from("casas").select("id").eq("slug", slug).single();
      if (!casaRow) { setAccesoDenegado(true); setAuthChecked(true); return; }
      const { data: postorRow } = await supabase.from("postores")
        .select("id").eq("user_id", session.user.id).eq("casa_id", casaRow.id).eq("estado","verificado").maybeSingle();
      if (!postorRow) setAccesoDenegado(true);
      setAuthChecked(true);
    });
  },[slug]);

  useEffect(()=>{
    if (!authChecked || accesoDenegado || !slug) return;
    supabase.from("casas").select("*").eq("slug",slug).single()
      .then(async ({ data: casaData }) => {
        if (!casaData) { setRemateIds([]); return; }
        setCasa(casaData);
        const { data: remates } = await supabase.from("remates").select("id").eq("casa_id", casaData.id);
        const ids = remates?.map(r => r.id) || [];
        remateIdsRef.current = new Set(ids);
        setRemateIds(ids);

        if (ids.length > 0) {
          // Cargar todos los lotes
          const { data: lotesData } = await supabase
            .from("lotes").select("id,nombre,categoria,numero,estado,imagenes,base,precio_final,comprador")
            .in("remate_id", ids).order("numero", { ascending: true });
          setAllLotes(lotesData || []);

          // Lote activo
          const { data: loteActual } = await supabase
            .from("lotes").select("*")
            .in("remate_id", ids)
            .eq("estado","en_subasta").limit(1).single();
          if (loteActual) {
            const fotos = Array.isArray(loteActual.imagenes) ? loteActual.imagenes : (loteActual.imagenes ? [loteActual.imagenes] : []);
            const l = { ...loteActual, fotos };
            setLoteActivo(l); loteActivoRef.current = l;
            setEstado("live");
            const { data: ultimaPuja } = await supabase
              .from("pujas").select("created_at,monto")
              .eq("lote_id", loteActual.id)
              .order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (ultimaPuja) {
              const elapsed = Math.floor((Date.now() - new Date(ultimaPuja.created_at).getTime()) / 1000);
              setTimer(Math.max(1, BID_TIMER - elapsed));
              setOferta(ultimaPuja.monto);
            } else {
              setOferta(loteActual.base || 0);
              setTimer(BID_TIMER);
            }
          }
        }
      });
  },[slug]);

  useEffect(()=>{
    if (remateIds === null || !authChecked || accesoDenegado) return;
    const remateIdsSet = new Set(remateIds);

    const ch = supabase.channel(`display-live-${slug}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"pujas"},(p)=>{
        const puja = p.new;
        if (!loteActivoRef.current) return;
        if (puja.lote_id !== loteActivoRef.current.id) return;
        setOferta(puja.monto);
        setGanador(`Paleta ${String(puja.numero_postor).padStart(3,"0")}`);
        setEstado("live");
        const elapsed = puja.created_at ? Math.floor((Date.now() - new Date(puja.created_at).getTime()) / 1000) : 0;
        setTimer(Math.max(1, BID_TIMER - elapsed));
        setFlash(true); setTimeout(()=>setFlash(false),800);
        setHistorial(prev=>[{
          pal:`P-${String(puja.numero_postor).padStart(4,"0")}`, monto:puja.monto,
        },...prev].slice(0,12));
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"lotes"},(p)=>{
        const l = p.new;
        if (!remateIdsSet.has(l.remate_id)) return;
        // Actualizar allLotes
        setAllLotes(prev => prev.map(lot => lot.id === l.id ? { ...lot, ...l } : lot));
        if (l.estado==="en_subasta") {
          const fotos = Array.isArray(l.imagenes) ? l.imagenes : (l.imagenes ? [l.imagenes] : []);
          const lc = { ...l, fotos };
          setLoteActivo(lc); loteActivoRef.current = lc;
          setOferta(l.base||0); setGanador(null); setHistorial([]);
          setEstado("live"); setTimer(BID_TIMER); setPhotoIdx(0);
        }
        if (l.estado==="vendido") setEstado("sold");
      })
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[slug, remateIds]);

  useEffect(()=>{
    if (estado!=="live") return;
    if (timer<=0) { setEstado("sold"); return; }
    const t = setTimeout(()=>setTimer(s=>s-1),1000);
    return ()=>clearTimeout(t);
  },[timer,estado]);

  const imgs = loteActivo?.fotos || [];
  useEffect(()=>{
    if (imgs.length<=1) return;
    const iv = setInterval(()=>setPhotoIdx(p=>(p+1)%imgs.length),5000);
    return ()=>clearInterval(iv);
  },[imgs.length]);

  const prevPhoto = () => setPhotoIdx(p => (p - 1 + imgs.length) % imgs.length);
  const nextPhoto = () => setPhotoIdx(p => (p + 1) % imgs.length);

  const timerColor = timer>8 ? "var(--gr)" : timer>4 ? "var(--yl)" : "var(--rd)";
  const timerPct   = (timer/BID_TIMER)*100;
  const badgeCls   = estado==="live" ? "disp-live-badge" : estado==="sold" ? "disp-live-badge sold" : "disp-live-badge wait";

  const vendidos  = allLotes.filter(l => l.estado === "vendido").length;
  const totalLots = allLotes.length;

  if (!authChecked) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0a0f1a",color:"#8ab4d4",fontSize:".9rem",gap:".75rem",flexDirection:"column"}}>
      <div style={{width:28,height:28,border:"2.5px solid #1a3a5c",borderTopColor:"#38B2F6",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Verificando acceso...
    </div>
  );

  if (accesoDenegado) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0a0f1a",color:"#e0eaf4",fontFamily:"Inter,sans-serif",padding:"2rem"}}>
      <div style={{textAlign:"center",maxWidth:380}}>
        <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🔒</div>
        <div style={{fontSize:"1.2rem",fontWeight:700,marginBottom:".75rem"}}>Acceso restringido</div>
        <div style={{fontSize:".88rem",color:"#5a7fa8",lineHeight:1.6,marginBottom:"1.5rem"}}>
          Debes estar inscrito y verificado en este remate para acceder a la sala en vivo.
        </div>
        <a href="/postor" style={{display:"inline-block",padding:".75rem 1.75rem",background:"#38B2F6",color:"#fff",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:".9rem"}}>
          Ir a mi portal →
        </a>
      </div>
    </div>
  );

  return (
    <div className="disp-root">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div className="disp-header">
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".5rem",flexShrink:0}}>
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
              <rect x="2" y="3" width="32" height="9" rx="3" fill="rgba(255,255,255,.92)"/>
              <polygon points="13,12 24,12 18,34 13,34" fill="rgba(255,255,255,.92)"/>
              <polygon points="18,34 24,12 24,34" fill="rgba(255,255,255,.48)"/>
            </svg>
            <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:".85rem",color:"#fff",letterSpacing:".08em"}}>TAKKA</div>
          </div>
          {(casa?.logo_url||casa?.nombre)&&<div style={{width:1,height:26,background:"rgba(255,255,255,.25)"}}/>}
          {casa?.logo_url
            ? <div style={{display:"flex",alignItems:"center",gap:".55rem"}}>
                <img src={casa.logo_url} alt={casa.nombre} style={{height:28,maxWidth:130,objectFit:"contain",filter:"brightness(0) invert(1)",opacity:.9}}/>
                <div className="disp-casa">{casa?.nombre||slug}</div>
              </div>
            : <div className="disp-casa">{casa?.nombre||slug}</div>
          }
          {totalLots > 0 && (
            <div style={{fontSize:".68rem",color:"rgba(255,255,255,.65)",marginLeft:".25rem"}}>
              {vendidos}/{totalLots} lotes
            </div>
          )}
        </div>
        <div className={badgeCls}>
          {estado==="live"&&<div className="disp-dot"/>}
          {estado==="live"?"EN VIVO":estado==="sold"?"ADJUDICADO":"PRÓXIMAMENTE"}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="disp-body">
        {!loteActivo ? (
          <div className="disp-waiting">
            <div className="disp-waiting-ring">
              <svg width="38" height="38" viewBox="0 0 42 42" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round">
                <circle cx="21" cy="21" r="17"/><path d="M21 11v10l7 5"/>
              </svg>
            </div>
            <div className="disp-waiting-title">Esperando inicio del remate</div>
            <div className="disp-waiting-sub">{casa?.nombre||"El remate comenzará en breve"}</div>
          </div>
        ) : (<>

          {/* ══ Panel izquierdo ══ */}
          <div className="disp-left">

            {/* Tabs */}
            <div className="disp-tabs">
              <div className={`disp-tab${tab==="lote"?" on":""}`} onClick={()=>setTab("lote")}>
                Lote Actual
              </div>
              <div className={`disp-tab${tab==="todos"?" on":""}`} onClick={()=>setTab("todos")}>
                Todos los lotes{totalLots>0?` (${totalLots})`:""}
              </div>
            </div>

            {tab==="lote" ? (
              <div className="disp-lote-panel">
                {/* Meta badges */}
                <div className="disp-lote-meta">
                  {loteActivo.numero&&<span className="disp-lote-num-badge">Lote #{loteActivo.numero}</span>}
                  {loteActivo.categoria&&<span className="disp-lote-cat-badge">{loteActivo.categoria}</span>}
                </div>

                {/* Título */}
                <div className="disp-lote-title">{loteActivo.nombre}</div>

                {/* Foto carousel */}
                <div className="disp-photo-wrap">
                  {imgs.length>0 ? (
                    <>
                      <img src={imgs[photoIdx]} alt={loteActivo.nombre}/>
                      {imgs.length>1&&(
                        <>
                          <div className="disp-photo-arrow left" onClick={prevPhoto}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 4L6 8l4 4"/>
                            </svg>
                          </div>
                          <div className="disp-photo-arrow right" onClick={nextPhoto}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 4l4 4-4 4"/>
                            </svg>
                          </div>
                          <div className="disp-photo-dots">
                            {imgs.map((_,i)=>(
                              <div key={i} className={`disp-photo-dot${i===photoIdx?" on":""}`} onClick={()=>setPhotoIdx(i)}/>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="disp-photo-placeholder">
                      <svg width="52" height="52" viewBox="0 0 64 64" fill="none" stroke="rgba(90,127,168,.35)" strokeWidth="1.5">
                        <rect x="6" y="12" width="52" height="40" rx="6"/>
                        <circle cx="32" cy="32" r="9"/>
                        <path d="M22 12l4-8h12l4 8"/>
                      </svg>
                      <div style={{fontSize:".78rem",color:"var(--mu)"}}>Sin fotos</div>
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

                {/* Specs grid — muestra campos si existen */}
                {(()=>{
                  const specs = [];
                  if (loteActivo.anio)          specs.push({ lbl:"Año",          val: loteActivo.anio });
                  if (loteActivo.km)            specs.push({ lbl:"Km",           val: Number(loteActivo.km).toLocaleString("es-CL") });
                  if (loteActivo.traccion)      specs.push({ lbl:"Tracción",     val: loteActivo.traccion });
                  if (loteActivo.combustible)   specs.push({ lbl:"Combustible",  val: loteActivo.combustible });
                  if (loteActivo.transmision)   specs.push({ lbl:"Transmisión",  val: loteActivo.transmision });
                  if (loteActivo.cilindrada)    specs.push({ lbl:"Cilindrada",   val: loteActivo.cilindrada });
                  if (loteActivo.garantia)      specs.push({ lbl:"Garantía",     val: fmt(loteActivo.garantia) });
                  if (loteActivo.base)          specs.push({ lbl:"Base",         val: fmt(loteActivo.base) });
                  if (specs.length === 0) return null;
                  return (
                    <div className="disp-specs">
                      {specs.map((s,i)=>(
                        <div key={i} className="disp-spec-item">
                          <div className="disp-spec-val">{s.val}</div>
                          <div className="disp-spec-lbl">{s.lbl}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Tab "Todos los lotes" */
              <div className="disp-todos-panel">
                {allLotes.length===0 ? (
                  <div style={{textAlign:"center",color:"var(--mu)",fontSize:".8rem",padding:"2rem 0"}}>
                    Sin lotes cargados
                  </div>
                ) : allLotes.map(lot=>{
                  const isActivo = lot.estado==="en_subasta";
                  const isVendido = lot.estado==="vendido";
                  const thumbSrc = Array.isArray(lot.imagenes) ? lot.imagenes[0] : (lot.imagenes || null);
                  return (
                    <div key={lot.id} className={`disp-lote-row${isActivo?" activo":isVendido?" vendido":""}`}>
                      {thumbSrc
                        ? <img className="disp-lote-thumb" src={thumbSrc} alt={lot.nombre}/>
                        : <div className="disp-lote-thumb-ph">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(90,127,168,.4)" strokeWidth="1.5">
                              <rect x="3" y="5" width="18" height="14" rx="2"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </div>
                      }
                      <div className="disp-lote-row-info">
                        <div className="disp-lote-row-name">{lot.nombre}</div>
                        <div className="disp-lote-row-meta">
                          {lot.numero&&<span className="disp-lote-row-num">#{lot.numero}</span>}
                          {lot.categoria&&<span className="disp-lote-row-cat">{lot.categoria}</span>}
                        </div>
                      </div>
                      <div className="disp-lote-row-right">
                        <div className="disp-lote-row-monto">
                          {isVendido ? fmt(lot.precio_final||lot.base||0) : fmt(lot.base||0)}
                        </div>
                        <div className={`disp-lote-row-status${isVendido?" vendido":isActivo?" activo":" espera"}`}>
                          {isVendido?"Vendido":isActivo?"En subasta":"Pendiente"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══ Panel derecho ══ */}
          <div className="disp-right">

            {/* EN VIVO area */}
            <div className="disp-live-area">
              <div className="disp-live-pill">
                {estado==="live"&&<div className="disp-live-pill-dot"/>}
                {estado==="live"?"EN VIVO":estado==="sold"?"ADJUDICADO":"EN ESPERA"}
              </div>
              <div className="disp-viewers">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
                  <circle cx="8" cy="8" r="2"/>
                </svg>
                Sala en vivo
              </div>
            </div>

            {/* Bid card */}
            <div className="disp-bid-card">
              <div className="disp-bid-label">Oferta actual</div>
              <div className={`disp-bid-amount${flash?" flash":""}`}>{fmt(oferta||loteActivo.base||0)}</div>
              {ganador&&(
                <div className="disp-bid-ganador">
                  <div className="disp-bid-ganador-dot"/>
                  {ganador}
                </div>
              )}
              <div className="disp-bid-base">
                <span>Base {fmt(loteActivo.base||0)}</span>
                {historial.length>0&&(
                  <span className="disp-bid-pujas">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 1v5l3 2"/><circle cx="6" cy="6" r="5"/></svg>
                    {historial.length} {historial.length===1?"puja":"pujas"}
                  </span>
                )}
              </div>
              {/* Timer */}
              <div className="disp-timer-row" style={{marginTop:".7rem"}}>
                <span className="disp-timer-label">Tiempo</span>
                <div className="disp-timer-bar-wrap">
                  <div className="disp-timer-bar">
                    <div className="disp-timer-fill" style={{width:`${estado==="live"?timerPct:0}%`,background:timerColor}}/>
                  </div>
                </div>
                <div className="disp-timer-num" style={{color:estado==="live"?timerColor:"var(--mu)"}}>{estado==="live"?timer+"s":"—"}</div>
              </div>
            </div>

            {/* Historial */}
            <div className="disp-hist-card">
              <div className="disp-hist-header">
                <div className="disp-hist-title">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 1.5"/>
                  </svg>
                  Historial de pujas
                </div>
                {historial.length>0&&(
                  <span style={{fontSize:".62rem",color:"var(--mu)"}}>últimas {historial.length}</span>
                )}
              </div>
              <div className="disp-hist-list">
                {historial.length===0 ? (
                  <div className="disp-hist-empty">Sin pujas aún — esperando...</div>
                ) : historial.map((h,i)=>(
                  <div key={i} className={`disp-hist-row${i===0?" top":""}`}>
                    <div className="disp-hist-pos">{i+1}</div>
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
        <div className="disp-footer-url">takka.cl/participar/{slug}</div>
        <div className="disp-footer-txt">{new Date().toLocaleString("es-CL",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})}</div>
      </div>
    </div>
  );
}
