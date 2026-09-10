'use client'
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f4f6f9; --s2: #ffffff; --b1: #e5e7eb; --b2: #d1d5db;
    --ac: #06B6D4; --gr: #14B8A6; --rd: #ef4444; --yl: #f59e0b;
    --wh: #111827; --wh2: #374151; --mu: #6b7280; --mu2: #9ca3af;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0d1117; --s2: #161b22; --b1: #21262d; --b2: #30363d;
      --wh: #e6edf3; --wh2: #c9d1d9; --mu: #8b949e; --mu2: #6e7681;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0d1117; --s2: #161b22; --b1: #21262d; --b2: #30363d;
    --wh: #e6edf3; --wh2: #c9d1d9; --mu: #8b949e; --mu2: #6e7681;
  }
  html, body { background: var(--bg); color: var(--wh); font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  .fade { animation: fadeUp .25s ease both; }
  .spin { animation: spin .8s linear infinite; }

  .topbar {
    position: sticky; top: 0; z-index: 20;
    background: var(--s2); border-bottom: 1px solid var(--b1);
    padding: 0 1.25rem; height: 56px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .topbar-brand { display: flex; align-items: center; gap: .6rem; }
  .topbar-title { font-size: .85rem; font-weight: 800; color: var(--wh); letter-spacing: -.02em; }
  .topbar-sub { font-size: .72rem; color: var(--mu); font-weight: 400; }
  .logout-btn { background: none; border: 1px solid var(--b2); border-radius: 8px;
    padding: .35rem .8rem; font-size: .78rem; color: var(--mu); cursor: pointer;
    font-family: inherit; transition: all .15s; }
  .logout-btn:hover { border-color: var(--rd); color: var(--rd); }

  .body { max-width: 480px; margin: 0 auto; padding: 1.25rem 1.25rem 100px; }

  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1.25rem; background: linear-gradient(160deg,#0e7490 0%,#06B6D4 60%,#14B8A6 100%); }
  .login-card { background: var(--s2); border-radius: 20px; padding: 2rem 1.75rem; width: 100%; max-width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
  .login-logo { display: flex; align-items: center; gap: .65rem; margin-bottom: 1.5rem; }
  .login-title { font-size: 1.25rem; font-weight: 800; color: var(--wh); letter-spacing: -.03em; }
  .login-sub { font-size: .82rem; color: var(--mu); margin-bottom: 1.5rem; line-height: 1.5; }
  .fi { width: 100%; padding: .65rem .85rem; border: 1.5px solid var(--b2); border-radius: 10px;
    font-family: inherit; font-size: .9rem; color: var(--wh); background: var(--bg); outline: none;
    transition: border-color .15s; margin-bottom: .75rem; }
  .fi:focus { border-color: var(--ac); }
  .btn-login { width: 100%; padding: .75rem; background: linear-gradient(135deg,#06B6D4,#14B8A6);
    color: #fff; border: none; border-radius: 10px; font-family: inherit;
    font-size: .95rem; font-weight: 700; cursor: pointer; transition: opacity .15s; }
  .btn-login:hover { opacity: .9; }
  .btn-login:disabled { opacity: .6; cursor: default; }
  .login-err { font-size: .8rem; color: var(--rd); margin-bottom: .75rem; padding: .5rem .75rem;
    background: rgba(239,68,68,.06); border-radius: 8px; border: 1px solid rgba(239,68,68,.2); }

  .section-label { font-size: .65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .1em; color: var(--mu); margin-bottom: .75rem; display: flex;
    align-items: center; gap: .5rem; }
  .section-label::after { content:''; flex:1; height:1px; background:var(--b1); }
  .remate-btn { width: 100%; text-align: left; padding: 1rem 1.1rem;
    background: var(--s2); border: 1.5px solid var(--b1); border-radius: 12px;
    font-family: inherit; cursor: pointer; margin-bottom: .6rem; color: var(--wh);
    transition: border-color .15s, box-shadow .15s; }
  .remate-btn:hover { border-color: var(--ac); box-shadow: 0 4px 16px rgba(6,182,212,.1); }
  .remate-btn-name { font-size: .95rem; font-weight: 700; color: var(--wh); }
  .remate-btn-meta { font-size: .75rem; color: var(--mu); margin-top: .2rem; }

  .search-card { background: var(--s2); border: 1.5px solid var(--b1); border-radius: 16px;
    padding: 1.25rem; margin-bottom: 1rem; }
  .search-title { font-size: .8rem; font-weight: 700; color: var(--mu); margin-bottom: .75rem; text-transform: uppercase; letter-spacing: .07em; }
  .num-input { width: 100%; font-size: 2.2rem; font-weight: 900; text-align: center;
    padding: .75rem; border: 2.5px solid var(--b2); border-radius: 12px;
    font-family: 'Inter', sans-serif; color: var(--ac); background: rgba(6,182,212,.03);
    outline: none; transition: border-color .15s; letter-spacing: .05em; }
  .num-input:focus { border-color: var(--ac); background: rgba(6,182,212,.05); }
  .btn-buscar { width: 100%; margin-top: .75rem; padding: .8rem;
    background: linear-gradient(135deg,#06B6D4,#14B8A6); color: #fff; border: none;
    border-radius: 12px; font-size: 1rem; font-weight: 800; cursor: pointer;
    font-family: inherit; transition: opacity .15s; display: flex; align-items: center;
    justify-content: center; gap: .5rem; }
  .btn-buscar:disabled { opacity: .6; cursor: default; }

  .buyer-card { background: var(--s2); border-radius: 16px; overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,.08); margin-bottom: 1rem; border: 1px solid var(--b1); }
  .buyer-header { padding: 1rem 1.25rem; display: flex; align-items: center; gap: .9rem; }
  .buyer-num { font-size: 2rem; font-weight: 900; color: var(--ac); font-family: 'Inter',sans-serif;
    min-width: 60px; text-align: center; line-height: 1; }
  .buyer-name { font-size: 1rem; font-weight: 700; color: var(--wh); }
  .buyer-rut { font-size: .75rem; color: var(--mu); margin-top: .2rem; }
  .status-banner { padding: .85rem 1.25rem; display: flex; align-items: center; gap: .65rem;
    font-size: .88rem; font-weight: 700; }
  .status-pagado { background: rgba(20,184,166,.1); color: #0d9488; border-top: 1px solid rgba(20,184,166,.2); }
  .status-pendiente { background: rgba(245,158,11,.08); color: #b45309; border-top: 1px solid rgba(245,158,11,.2); }

  .lote-list { border-top: 1px solid var(--b1); }
  .lote-item { display: flex; align-items: center; gap: .85rem; padding: .9rem 1.25rem;
    border-bottom: 1px solid var(--b1); transition: background .12s; cursor: pointer; }
  .lote-item:last-child { border-bottom: none; }
  .lote-item:active { background: rgba(6,182,212,.04); }
  .lote-item.done { opacity: .55; }
  .lot-check { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--b2); background: var(--bg); transition: all .2s; }
  .lot-check.checked { background: var(--gr); border-color: var(--gr); }
  .lot-info { flex: 1; min-width: 0; }
  .lot-nombre { font-size: .88rem; font-weight: 600; color: var(--wh);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lot-codigo { font-size: .72rem; color: var(--mu); margin-top: .12rem; }

  .tabs { position: fixed; bottom: 0; left: 0; right: 0; background: var(--s2);
    border-top: 1px solid var(--b1); display: flex;
    box-shadow: 0 -4px 20px rgba(0,0,0,.07); z-index: 30; }
  .tab { flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: .25rem; padding: .65rem .5rem .55rem; font-size: .62rem; font-weight: 600;
    color: var(--mu); cursor: pointer; border: none; background: none;
    font-family: inherit; transition: color .15s; position: relative; }
  .tab.on { color: var(--ac); }
  .tab-dot { position: absolute; top: .5rem; right: 50%; transform: translateX(180%);
    width: 7px; height: 7px; background: var(--rd); border-radius: 50%; }

  .list-item { background: var(--s2); border: 1px solid var(--b1); border-radius: 12px;
    padding: .9rem 1.1rem; margin-bottom: .6rem; }
  .list-buyer { font-size: .78rem; font-weight: 700; color: var(--ac);
    display: flex; align-items: center; gap: .4rem; margin-bottom: .4rem; }
  .list-lot { font-size: .82rem; color: var(--wh2); display: flex; align-items: center;
    gap: .5rem; padding: .3rem 0; cursor: pointer; }
  .list-lot:active { opacity: .7; }
  .dot-pend { width: 8px; height: 8px; border-radius: 50%; background: var(--yl); flex-shrink: 0; }
  .dot-done  { width: 8px; height: 8px; border-radius: 50%; background: var(--gr); flex-shrink: 0; }
  .empty-state { text-align: center; padding: 3rem 1rem; color: var(--mu); }

  .remate-chip { display: flex; align-items: center; gap: .5rem; padding: .5rem .8rem .5rem .65rem;
    background: rgba(6,182,212,.07); border: 1px solid rgba(6,182,212,.2); border-radius: 20px;
    font-size: .72rem; font-weight: 700; color: var(--ac); cursor: pointer; width: fit-content; }
  .remate-chip:active { opacity: .8; }

  .refresh-btn { background: none; border: 1px solid var(--b2); border-radius: 8px;
    padding: .32rem .65rem; font-size: .72rem; color: var(--mu); cursor: pointer;
    font-family: inherit; display: flex; align-items: center; gap: .35rem; }
  .refresh-btn:active { opacity: .7; }
  .refresh-btn:disabled { opacity: .4; cursor: default; }

  @media (min-width: 480px) {
    .tabs { max-width: 480px; left: 50%; transform: translateX(-50%); border-radius: 16px 16px 0 0; }
  }
`;

const fmtClp = n => n ? `$${Number(n).toLocaleString("es-CL")}` : "—";

const TakkaLogo = ({size=26, color="#0891b2"}) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <rect x="2" y="3" width="32" height="9" rx="3" fill={color}/>
    <polygon points="13,12 24,12 18,34 13,34" fill={color}/>
    <polygon points="18,34 24,12 24,34" fill={color==="white"?"rgba(255,255,255,.48)":"#0d9488"}/>
  </svg>
);

const Spinner = () => (
  <div style={{width:22,height:22,border:"2.5px solid var(--b1)",borderTopColor:"#06B6D4",borderRadius:"50%"}} className="spin"/>
);

export default function EntregarPage() {
  const [screen,        setScreen]        = useState("loading");
  const [session,       setSession]       = useState(null);
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPass,     setLoginPass]     = useState("");
  const [loginErr,      setLoginErr]      = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);

  const [remates,        setRemates]        = useState([]);
  const [selectedRemate, setSelectedRemate] = useState(null);

  const [tab,      setTab]      = useState("buscar");
  const [numStr,   setNumStr]   = useState("");
  const [buscando, setBuscando] = useState(false);
  const [postor,   setPostor]   = useState(null);
  const [lotesPostor, setLotesPostor] = useState([]); // array of liquidaciones

  const [notFound,          setNotFound]          = useState(false);
  const [allPostores,       setAllPostores]       = useState([]);
  const [allLiquidaciones,  setAllLiquidaciones]  = useState([]);
  const [loadingAll,        setLoadingAll]        = useState(false);

  useEffect(() => {
    if (!supabase) { setScreen("login"); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setScreen("login"); return; }
      const { data: perfil } = await supabase.from("usuarios")
        .select("*, casas(id,nombre,slug), bodegas(nombre)").eq("id", data.session.user.id).single();
      if (!perfil) { await supabase.auth.signOut(); setScreen("login"); return; }
      const roles = perfil.roles || [];
      if (!roles.some(r => ["admin","martillero","entregador"].includes(r))) {
        await supabase.auth.signOut(); setScreen("login"); return;
      }
      setSession({ id: perfil.id, name: perfil.nombre, email: perfil.email,
        role: roles[0], casaId: perfil.casas?.id, casaNombre: perfil.casas?.nombre || "TAKKA",
        bodegaId: perfil.bodega_id || null, bodegaNombre: perfil.bodegas?.nombre || null });
      cargarRemates(perfil.casas?.id || null, roles.includes("admin"));
    });
  }, []);

  const cargarRemates = async (casaId, isAdmin) => {
    if (!supabase) return;
    let q = supabase.from("remates").select("*")
      .in("estado",["activo","en_vivo","finalizado","cerrado"]).order("fecha",{ascending:false});
    if (!isAdmin && casaId) q = q.eq("casa_id", casaId);
    const { data } = await q;
    setRemates(data || []);
    setScreen("remates");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr(""); setLoginLoading(true);
    if (!supabase) { setLoginErr("Error de configuración."); setLoginLoading(false); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPass });
    if (error) { setLoginErr("Credenciales incorrectas."); setLoginLoading(false); return; }
    const { data: perfil } = await supabase.from("usuarios")
      .select("*, casas(id,nombre,slug), bodegas(nombre)").eq("id", data.user.id).single();
    if (!perfil) { setLoginErr("Usuario no encontrado."); await supabase.auth.signOut(); setLoginLoading(false); return; }
    const roles = perfil.roles || [];
    if (!roles.some(r => ["admin","martillero","entregador"].includes(r))) {
      setLoginErr("Sin permiso de acceso."); await supabase.auth.signOut(); setLoginLoading(false); return;
    }
    setSession({ id: perfil.id, name: perfil.nombre, email: perfil.email,
      role: roles[0], casaId: perfil.casas?.id, casaNombre: perfil.casas?.nombre || "TAKKA",
      bodegaId: perfil.bodega_id || null });
    setLoginLoading(false);
    cargarRemates(perfil.casas?.id || null, roles.includes("admin"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setSelectedRemate(null); setPostor(null);
    setLotesPostor([]); setNumStr(""); setNotFound(false);
    setScreen("login");
  };

  const selectRemate = (r) => {
    setSelectedRemate(r);
    setPostor(null); setLotesPostor([]); setNumStr(""); setNotFound(false);
    setScreen("main");
    cargarTodoDelRemate(r.id);
  };

  const cargarTodoDelRemate = useCallback(async (remateId) => {
    if (!supabase) return;
    setLoadingAll(true);
    const [{ data: ps }, { data: liqs }] = await Promise.all([
      supabase.from("postores").select("*").eq("remate_id", remateId),
      supabase.from("liquidaciones").select("*").eq("remate_id", remateId),
    ]);
    // Enrich liquidaciones with postor numero via name matching
    const byName = {};
    (ps || []).forEach(p => { if (p.nombre) byName[p.nombre.toLowerCase().trim()] = p; });
    const enriched = (liqs || []).map(liq => {
      const p = byName[(liq.postor || "").toLowerCase().trim()];
      return { ...liq, _numero: p?.numero ?? null };
    });
    setAllPostores(ps || []);
    setAllLiquidaciones(enriched);
    setLoadingAll(false);
  }, []);

  const winnersMap = useCallback(() => {
    const byNum = {};
    allLiquidaciones.forEach(liq => {
      if (liq._numero !== null && liq._numero !== undefined) {
        if (!byNum[liq._numero]) byNum[liq._numero] = [];
        byNum[liq._numero].push(liq);
      }
    });
    return byNum;
  }, [allLiquidaciones]);

  const buscar = async () => {
    const num = parseInt(numStr);
    if (!num || !selectedRemate) return;
    setBuscando(true); setPostor(null); setLotesPostor([]); setNotFound(false);
    const { data: p } = await supabase.from("postores")
      .select("*").eq("remate_id", selectedRemate.id).eq("numero", num).maybeSingle();
    if (!p) { setNotFound(true); setBuscando(false); return; }
    setPostor(p);
    const wmap = winnersMap();
    setLotesPostor(wmap[num] || []);
    setBuscando(false);
  };

  // Track delivery via liquidaciones.retiro (synced with Dashboard's "Retiro de Bienes")
  const toggleEntregado = async (liq) => {
    const fecha = liq.retiro ? null : new Date().toLocaleDateString("es-CL");
    const { error } = await supabase.from("liquidaciones").update({ retiro: fecha }).eq("id", liq.id);
    if (error) return;
    const updated = { ...liq, retiro: fecha };
    setLotesPostor(prev => prev.map(l => l.id === liq.id ? updated : l));
    setAllLiquidaciones(prev => prev.map(l => l.id === liq.id ? updated : l));
  };

  if (screen === "loading") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f4f6f9"}}>
      <style>{CSS}</style>
      <Spinner/>
    </div>
  );

  if (screen === "login") return (
    <>
      <style>{CSS}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <TakkaLogo size={32}/>
            <div><div className="login-title">Entregas TAKKA</div></div>
          </div>
          <div className="login-sub">Acceso para el equipo de entregas de la bodega. Ingresa con tu cuenta de la casa de remates.</div>
          {loginErr && <div className="login-err">{loginErr}</div>}
          <form onSubmit={handleLogin}>
            <input className="fi" type="email" placeholder="tu@email.cl" value={loginEmail}
              onChange={e=>setLoginEmail(e.target.value)} autoComplete="email" required/>
            <input className="fi" type="password" placeholder="Contraseña" value={loginPass}
              onChange={e=>setLoginPass(e.target.value)} autoComplete="current-password" required/>
            <button className="btn-login" type="submit" disabled={loginLoading}>
              {loginLoading ? <Spinner/> : "Entrar →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );

  if (screen === "remates") return (
    <>
      <style>{CSS}</style>
      <div className="topbar">
        <div className="topbar-brand">
          <TakkaLogo size={24}/>
          <div>
            <div className="topbar-title">Entregas</div>
            <div className="topbar-sub">{session?.casaNombre}{session?.bodegaNombre ? ` · ${session.bodegaNombre}` : ""}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Salir</button>
      </div>
      <div className="body">
        <div style={{padding:"1.5rem 0 1rem"}}>
          <div style={{fontSize:"1.15rem",fontWeight:800,color:"var(--wh)",marginBottom:".4rem"}}>
            Hola, {session?.name?.split(" ")[0]} 👋
          </div>
          <div style={{fontSize:".85rem",color:"var(--mu)"}}>Selecciona el remate para gestionar las entregas</div>
        </div>
        <div className="section-label">Remates disponibles</div>
        {remates.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize:"2rem",marginBottom:".5rem"}}>📦</div>
            No hay remates disponibles.
          </div>
        ) : remates.map(r => (
          <button key={r.id} className="remate-btn fade" onClick={() => selectRemate(r)}>
            <div className="remate-btn-name">{r.nombre}</div>
            <div className="remate-btn-meta">{r.fecha}{r.modalidad ? ` · ${r.modalidad}` : ""} · <span style={{color:r.estado==="en_vivo"?"#dc2626":r.estado==="activo"?"#0d9488":"var(--mu)",fontWeight:700,textTransform:"uppercase"}}>{r.estado}</span></div>
          </button>
        ))}
      </div>
    </>
  );

  // ── MAIN ──
  const wmap = winnersMap();

  const porEntregar = allPostores
    .filter(p => p.pagado)
    .map(p => ({ ...p, liqsPend: (wmap[p.numero] || []).filter(l => !l.retiro) }))
    .filter(p => p.liqsPend.length > 0);

  const entregados = allLiquidaciones.filter(l => l.retiro);

  const lotesPendTotal = allPostores.filter(p => p.pagado)
    .flatMap(p => (wmap[p.numero] || []).filter(l => !l.retiro));

  return (
    <>
      <style>{CSS}</style>
      <div className="topbar">
        <div className="topbar-brand">
          <TakkaLogo size={24}/>
          <div>
            <div className="topbar-title">Entregas</div>
            <div className="topbar-sub">{session?.casaNombre}{session?.bodegaNombre ? ` · ${session.bodegaNombre}` : ""}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Salir</button>
      </div>

      <div className="body">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem"}}>
          <div className="remate-chip" onClick={() => setScreen("remates")}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="2" width="14" height="12" rx="2"/><path d="M1 6h14M5 2v4M11 2v4"/></svg>
            {selectedRemate?.nombre}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5l3 3 3-3"/></svg>
          </div>
          <button className="refresh-btn" onClick={() => selectedRemate && cargarTodoDelRemate(selectedRemate.id)} disabled={loadingAll}>
            {loadingAll
              ? <Spinner/>
              : <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4"/><path d="M12 4h-1.5V2.5M4 12h1.5V13.5"/></svg>
            }
            Actualizar
          </button>
        </div>

        {/* ── TAB BUSCAR ── */}
        {tab === "buscar" && (
          <div className="fade">
            <div className="search-card">
              <div className="search-title">Número de paleta / comprador</div>
              <input className="num-input" type="number" inputMode="numeric" min="1" max="999"
                placeholder="000" value={numStr}
                onChange={e => { setNumStr(e.target.value); setPostor(null); setNotFound(false); }}
                onKeyDown={e => e.key === "Enter" && buscar()}/>
              <button className="btn-buscar" onClick={buscar} disabled={!numStr || buscando}>
                {buscando ? <Spinner/> : <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
                  Buscar comprador
                </>}
              </button>
            </div>

            {notFound && (
              <div className="fade" style={{textAlign:"center",padding:"1.5rem",color:"var(--mu)",background:"var(--s2)",borderRadius:12,border:"1px solid var(--b1)"}}>
                <div style={{fontSize:"1.5rem",marginBottom:".5rem"}}>🔍</div>
                Comprador #{numStr} no encontrado en este remate.
              </div>
            )}

            {postor && (
              <div className="buyer-card fade">
                <div className="buyer-header">
                  <div className="buyer-num">#{String(postor.numero).padStart(2,"0")}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="buyer-name">{postor.nombre}</div>
                    {postor.rut && <div className="buyer-rut">RUT {postor.rut}</div>}
                  </div>
                </div>

                <div className={`status-banner ${postor.pagado ? "status-pagado" : "status-pendiente"}`}>
                  {postor.pagado ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M6.5 10l2.5 2.5 4.5-5"/></svg>
                      PAGADO — Listo para entregar
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v4.5M10 13v.5"/></svg>
                      PENDIENTE DE PAGO — No entregar aún
                    </>
                  )}
                </div>

                {postor.pagado && (
                  <div className="lote-list">
                    {lotesPostor.length === 0 ? (
                      <div style={{padding:"1.25rem",textAlign:"center",fontSize:".82rem",color:"var(--mu)"}}>
                        Sin lotes adjudicados registrados.{allLiquidaciones.length === 0 && " El remate aún no ha sido cerrado."}
                      </div>
                    ) : lotesPostor.map(liq => (
                      <div key={liq.id} className={`lote-item${liq.retiro?" done":""}`}
                        onClick={() => toggleEntregado(liq)}>
                        <div className={`lot-check${liq.retiro?" checked":""}`}>
                          {liq.retiro && <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5.5l4 4L13 1"/></svg>}
                        </div>
                        <div className="lot-info">
                          <div className="lot-nombre">{liq.lote}</div>
                          <div className="lot-codigo">{fmtClp(liq.monto)}{liq.retiro ? ` · Retirado ${liq.retiro}` : ""}</div>
                        </div>
                        <span style={{fontSize:".65rem",fontWeight:700,padding:".18rem .5rem",borderRadius:6,
                          background:liq.retiro?"rgba(20,184,166,.1)":"rgba(245,158,11,.08)",
                          color:liq.retiro?"#0d9488":"#b45309",whiteSpace:"nowrap",flexShrink:0}}>
                          {liq.retiro ? "✓ Entregado" : "Pendiente"}
                        </span>
                      </div>
                    ))}
                    {lotesPostor.length > 0 && (
                      <div style={{padding:".75rem 1.25rem",fontSize:".72rem",color:"var(--mu)",background:"rgba(20,184,166,.04)",borderTop:"1px solid var(--b1)",display:"flex",justifyContent:"space-between"}}>
                        <span>{lotesPostor.filter(l=>l.retiro).length} / {lotesPostor.length} entregados</span>
                        {lotesPostor.every(l=>l.retiro) && <span style={{color:"var(--gr)",fontWeight:700}}>✓ Completo</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB POR ENTREGAR ── */}
        {tab === "por-entregar" && (
          <div className="fade">
            <div style={{marginBottom:".75rem",fontSize:".72rem",color:"var(--mu)"}}>
              {loadingAll ? "Cargando..." : `${lotesPendTotal.length} lotes pendientes de retiro`}
            </div>
            {loadingAll ? (
              <div style={{display:"flex",justifyContent:"center",padding:"2rem"}}><Spinner/></div>
            ) : porEntregar.length === 0 ? (
              <div className="empty-state">
                <div style={{fontSize:"2.5rem",marginBottom:".75rem"}}>🎉</div>
                <div style={{fontWeight:700,color:"var(--wh2)",marginBottom:".4rem"}}>Todo entregado</div>
                <div style={{fontSize:".82rem"}}>No hay compradores con entregas pendientes.</div>
              </div>
            ) : porEntregar.map(p => (
              <div key={p.id} className="list-item fade">
                <div className="list-buyer">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="5" r="3"/><path d="M1 13c0-3 2.7-5 6-5s6 2 6 5"/></svg>
                  #{String(p.numero).padStart(2,"0")} · {p.nombre}
                </div>
                {p.liqsPend.map(liq => (
                  <div key={liq.id} className="list-lot" onClick={() => {
                    setTab("buscar"); setNumStr(String(p.numero));
                    setPostor(p); setLotesPostor(wmap[p.numero] || []);
                  }}>
                    <div className="dot-pend"/>
                    <span style={{flex:1,fontSize:".8rem"}}>{liq.lote}</span>
                    <span style={{fontSize:".72rem",color:"var(--mu)"}}>{fmtClp(liq.monto)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB ENTREGADOS ── */}
        {tab === "entregados" && (
          <div className="fade">
            <div style={{marginBottom:".75rem",fontSize:".72rem",color:"var(--mu)"}}>
              {loadingAll ? "Cargando..." : `${entregados.length} lotes entregados`}
            </div>
            {loadingAll ? (
              <div style={{display:"flex",justifyContent:"center",padding:"2rem"}}><Spinner/></div>
            ) : entregados.length === 0 ? (
              <div className="empty-state">
                <div style={{fontSize:"2.5rem",marginBottom:".75rem"}}>📦</div>
                <div style={{fontWeight:700,color:"var(--wh2)",marginBottom:".4rem"}}>Sin entregas aún</div>
                <div style={{fontSize:".82rem"}}>Los lotes entregados aparecen aquí.</div>
              </div>
            ) : entregados.map(liq => {
              const p = allPostores.find(x => x.numero === liq._numero);
              return (
                <div key={liq.id} className="list-item fade">
                  <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                    <div className="dot-done"/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:".88rem",color:"var(--wh)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{liq.lote}</div>
                      <div style={{fontSize:".72rem",color:"var(--mu)",marginTop:".12rem"}}>
                        {fmtClp(liq.monto)} {p ? `· #${String(p.numero).padStart(2,"0")} ${p.nombre}` : liq.postor ? `· ${liq.postor}` : ""}
                      </div>
                      {liq.retiro && <div style={{fontSize:".65rem",color:"var(--gr)",marginTop:".1rem"}}>Retirado: {liq.retiro}</div>}
                    </div>
                    <span style={{fontSize:".65rem",fontWeight:700,padding:".18rem .5rem",borderRadius:6,background:"rgba(20,184,166,.1)",color:"#0d9488",flexShrink:0}}>✓ Entregado</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <nav className="tabs">
        {[
          { id:"buscar",       label:"Buscar",
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="9" r="6"/><path d="M14 14l3 3"/></svg> },
          { id:"por-entregar", label:"Por entregar", dot: lotesPendTotal.length > 0,
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="5" width="14" height="12" rx="2"/><path d="M3 9h14M7 5V3h6v2"/></svg> },
          { id:"entregados",   label:"Entregados",
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M6.5 10l2.5 2.5 4.5-5"/></svg> },
        ].map(t => (
          <button key={t.id} className={`tab${tab===t.id?" on":""}`} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
            {t.dot && <div className="tab-dot"/>}
          </button>
        ))}
      </nav>
    </>
  );
}
