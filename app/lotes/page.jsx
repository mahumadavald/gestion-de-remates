'use client'
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const fmtClp = n => n && n > 0 ? `$${Number(n).toLocaleString("es-CL")}` : null;

function LoteCard({ lote }) {
  const [hover, setHover] = useState(false);
  const imgs = Array.isArray(lote.imagenes) ? lote.imagenes : lote.imagenes ? [lote.imagenes] : [];
  const img = imgs[0] || null;
  const precio = fmtClp(lote.base);
  const precioMin = fmtClp(lote.minimo);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#0d1117",
        border: `1px solid ${hover ? "#06B6D4" : "#21262d"}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all .2s ease",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover ? "0 12px 40px rgba(6,182,212,.18)" : "0 2px 8px rgba(0,0,0,.3)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", paddingTop: "72%", background: "#161b22", overflow: "hidden" }}>
        {img ? (
          <img
            src={img}
            alt={lote.nombre}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              transition: "transform .3s ease", transform: hover ? "scale(1.04)" : "scale(1)" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", background: "linear-gradient(135deg,#161b22,#0d1117)" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#30363d" strokeWidth="1.5">
              <rect x="4" y="8" width="32" height="24" rx="3"/>
              <circle cx="14" cy="16" r="3"/>
              <path d="M4 26l8-6 6 5 5-4 13 9"/>
            </svg>
            <span style={{ color: "#30363d", fontSize: ".65rem", marginTop: ".5rem" }}>Sin imagen</span>
          </div>
        )}
        {/* Category badge */}
        {lote.categoria && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(6,182,212,.15)",
            border: "1px solid rgba(6,182,212,.4)", backdropFilter: "blur(8px)",
            color: "#06B6D4", fontSize: ".6rem", fontWeight: 800, padding: ".2rem .55rem",
            borderRadius: 5, letterSpacing: ".05em", textTransform: "uppercase" }}>
            {lote.categoria}
          </div>
        )}
        {/* Lot code */}
        {lote.codigo && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(8px)", color: "rgba(255,255,255,.6)",
            fontSize: ".58rem", fontWeight: 700, padding: ".2rem .45rem", borderRadius: 4 }}>
            #{lote.codigo}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: ".5rem" }}>
        <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#e6edf3", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {lote.nombre}
        </div>

        {/* Remate */}
        <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#6b7280" strokeWidth="1.5">
            <rect x="1" y="2" width="8" height="7" rx="1"/>
            <path d="M3 1v2M7 1v2M1 5h8"/>
          </svg>
          <span style={{ fontSize: ".65rem", color: "#6b7280" }}>
            {lote.remates?.nombre || "Próximo remate"}
            {lote.remates?.fecha ? ` · ${new Date(lote.remates.fecha).toLocaleDateString("es-CL",{day:"2-digit",month:"short"})}` : ""}
          </span>
        </div>

        {/* Prices */}
        <div style={{ marginTop: "auto", paddingTop: ".5rem", borderTop: "1px solid #21262d", display: "flex", flexDirection: "column", gap: ".3rem" }}>
          {precio && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: ".65rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Base</span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#06B6D4" }}>{precio}</span>
            </div>
          )}
          {precioMin && precioMin !== precio && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: ".65rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Mínimo</span>
              <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#14B8A6" }}>{precioMin}</span>
            </div>
          )}
          {!precio && (
            <div style={{ fontSize: ".75rem", color: "#4b5563", fontStyle: "italic" }}>Precio a consultar</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [remateFiltro, setRemateFiltro] = useState("");
  const [sort, setSort] = useState("reciente");
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("lotes")
      .select("*, remates(nombre, fecha)")
      .eq("estado", "publicado")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setLotes(data || []); setLoading(false); });
  }, []);

  const categorias = useMemo(() => [...new Set(lotes.map(l => l.categoria).filter(Boolean))].sort(), [lotes]);
  const remates    = useMemo(() => [...new Set(lotes.map(l => l.remates?.nombre).filter(Boolean))].sort(), [lotes]);

  const filtrados = useMemo(() => {
    let r = lotes.filter(l => {
      const q = busqueda.toLowerCase();
      const matchQ = !q || l.nombre?.toLowerCase().includes(q) || l.codigo?.toLowerCase().includes(q) || l.categoria?.toLowerCase().includes(q);
      const matchC = !catFiltro    || l.categoria === catFiltro;
      const matchR = !remateFiltro || l.remates?.nombre === remateFiltro;
      return matchQ && matchC && matchR;
    });
    if (sort === "precio-asc") r = [...r].sort((a,b) => (a.base||0)-(b.base||0));
    if (sort === "precio-desc") r = [...r].sort((a,b) => (b.base||0)-(a.base||0));
    if (sort === "nombre") r = [...r].sort((a,b) => (a.nombre||"").localeCompare(b.nombre||"","es"));
    return r;
  }, [lotes, busqueda, catFiltro, remateFiltro, sort]);

  const totalPages = Math.ceil(filtrados.length / PER_PAGE);
  const slice = filtrados.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const reset = () => { setBusqueda(""); setCatFiltro(""); setRemateFiltro(""); setSort("reciente"); setPage(1); };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0c10; color: #e6edf3; font-family: 'Inter',-apple-system,sans-serif; min-height: 100vh; }

        /* Header */
        .cat-header { background: linear-gradient(180deg,#0d1117 0%,#0a0c10 100%); border-bottom: 1px solid #21262d; padding: 0 1.5rem; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); }
        .cat-header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; height: 60px; }
        .cat-logo { font-size: 1.1rem; font-weight: 900; letter-spacing: -.03em; color: #fff; text-decoration: none; display: flex; align-items: center; gap: .4rem; }
        .cat-logo span { color: #06B6D4; }
        .cat-search { flex: 1; max-width: 400px; position: relative; }
        .cat-search input { width: 100%; background: #161b22; border: 1px solid #30363d; color: #e6edf3; border-radius: 9px; padding: .5rem 1rem .5rem 2.4rem; font-size: .82rem; outline: none; transition: border-color .15s; font-family: inherit; }
        .cat-search input:focus { border-color: #06B6D4; }
        .cat-search svg { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .cat-badge { background: rgba(6,182,212,.12); border: 1px solid rgba(6,182,212,.3); color: #06B6D4; font-size: .7rem; font-weight: 700; padding: .2rem .6rem; border-radius: 20px; }

        /* Hero */
        .cat-hero { background: linear-gradient(135deg,#0d1117 0%,#0e2233 50%,#0d1117 100%); border-bottom: 1px solid #21262d; padding: 3rem 1.5rem; text-align: center; position: relative; overflow: hidden; }
        .cat-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 50% 0%,rgba(6,182,212,.12) 0%,transparent 70%); pointer-events: none; }
        .cat-hero-title { font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 900; letter-spacing: -.03em; margin-bottom: .5rem; }
        .cat-hero-title span { color: #06B6D4; }
        .cat-hero-sub { color: #8b949e; font-size: .875rem; max-width: 440px; margin: 0 auto; }

        /* Layout */
        .cat-body { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem 4rem; display: grid; grid-template-columns: 220px 1fr; gap: 2rem; }

        /* Sidebar */
        .cat-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
        .cat-filter-box { background: #0d1117; border: 1px solid #21262d; border-radius: 12px; padding: 1rem; }
        .cat-filter-title { font-size: .65rem; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; margin-bottom: .75rem; }
        .cat-filter-item { display: flex; align-items: center; gap: .5rem; padding: .4rem .5rem; border-radius: 7px; cursor: pointer; transition: background .12s; font-size: .78rem; color: #8b949e; }
        .cat-filter-item:hover { background: #161b22; color: #e6edf3; }
        .cat-filter-item.active { background: rgba(6,182,212,.08); color: #06B6D4; border: 1px solid rgba(6,182,212,.2); }
        .cat-filter-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .cat-btn-reset { width: 100%; background: transparent; border: 1px solid #30363d; color: #8b949e; border-radius: 8px; padding: .5rem; font-size: .72rem; font-weight: 600; cursor: pointer; transition: all .15s; }
        .cat-btn-reset:hover { border-color: #06B6D4; color: #06B6D4; }

        /* Grid area */
        .cat-main { min-width: 0; }
        .cat-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; gap: .75rem; flex-wrap: wrap; }
        .cat-count { font-size: .78rem; color: #8b949e; }
        .cat-sort { background: #0d1117; border: 1px solid #30363d; color: #e6edf3; border-radius: 8px; padding: .4rem .75rem; font-size: .75rem; cursor: pointer; font-family: inherit; outline: none; }
        .cat-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 1rem; }

        /* Pagination */
        .cat-pagination { display: flex; gap: .4rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap; }
        .cat-page-btn { background: #0d1117; border: 1px solid #30363d; color: #8b949e; border-radius: 7px; padding: .4rem .8rem; font-size: .78rem; cursor: pointer; transition: all .15s; font-family: inherit; }
        .cat-page-btn:hover { border-color: #06B6D4; color: #06B6D4; }
        .cat-page-btn.active { background: #06B6D4; border-color: #06B6D4; color: #fff; font-weight: 700; }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { width: 32px; height: 32px; border: 3px solid #21262d; border-top-color: #06B6D4; border-radius: 50%; animation: spin .8s linear infinite; margin: 4rem auto; }

        /* Empty */
        .cat-empty { text-align: center; padding: 5rem 1rem; color: #4b5563; }
        .cat-empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: .4; }

        /* Responsive */
        @media (max-width: 768px) {
          .cat-body { grid-template-columns: 1fr; }
          .cat-sidebar { flex-direction: row; overflow-x: auto; gap: .75rem; }
          .cat-filter-box { min-width: 180px; flex-shrink: 0; }
          .cat-hero { padding: 2rem 1rem; }
          .cat-header-inner { gap: .6rem; }
          .cat-grid { grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap: .75rem; }
        }
      `}</style>

      {/* Header */}
      <header className="cat-header">
        <div className="cat-header-inner">
          <a className="cat-logo" href="https://rematesahumada.cl">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="5" fill="#06B6D4"/><path d="M6 16l4-10 4 10M7.5 12h7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            Remates<span>Ahumada</span>
          </a>
          <div className="cat-search">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6b7280" strokeWidth="1.5">
              <circle cx="6" cy="6" r="4.5"/><path d="M10 10l3 3"/>
            </svg>
            <input placeholder="Buscar lotes..." value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPage(1);}}/>
          </div>
          <span className="cat-badge">{filtrados.length} lotes</span>
        </div>
      </header>

      {/* Hero */}
      <div className="cat-hero">
        <div className="cat-hero-title">Catálogo de Remates <span>Ahumada</span></div>
        <div className="cat-hero-sub">Lotes disponibles para el próximo remate. Todos los precios en pesos chilenos.</div>
      </div>

      <div className="cat-body">
        {/* Sidebar filters */}
        <aside className="cat-sidebar">
          {/* Categories */}
          <div className="cat-filter-box">
            <div className="cat-filter-title">Categoría</div>
            {["", ...categorias].map(c => (
              <div key={c} className={`cat-filter-item${catFiltro===c?" active":""}`} onClick={()=>{setCatFiltro(c);setPage(1);}}>
                <div className="cat-filter-dot"/>
                {c || "Todas"}
                {c && <span style={{marginLeft:"auto",fontSize:".65rem",color:"#4b5563"}}>{lotes.filter(l=>l.categoria===c).length}</span>}
              </div>
            ))}
          </div>

          {/* Remates */}
          {remates.length > 0 && (
            <div className="cat-filter-box">
              <div className="cat-filter-title">Remate</div>
              {["", ...remates].map(r => (
                <div key={r} className={`cat-filter-item${remateFiltro===r?" active":""}`} onClick={()=>{setRemateFiltro(r);setPage(1);}}>
                  <div className="cat-filter-dot"/>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r || "Todos"}</span>
                </div>
              ))}
            </div>
          )}

          <button className="cat-btn-reset" onClick={reset}>↺ Limpiar filtros</button>
        </aside>

        {/* Main grid */}
        <main className="cat-main">
          <div className="cat-toolbar">
            <div className="cat-count">
              {loading ? "Cargando..." : `${filtrados.length} lote${filtrados.length!==1?"s":""}`}
            </div>
            <select className="cat-sort" value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}>
              <option value="reciente">Más recientes</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>

          {loading ? (
            <div className="spin"/>
          ) : slice.length === 0 ? (
            <div className="cat-empty">
              <div className="cat-empty-icon">📦</div>
              <div style={{fontWeight:700,fontSize:"1rem",marginBottom:".4rem",color:"#6b7280"}}>
                {busqueda||catFiltro||remateFiltro ? "Sin resultados" : "No hay lotes disponibles"}
              </div>
              <div style={{fontSize:".82rem"}}>{busqueda||catFiltro||remateFiltro ? "Prueba otros filtros." : "Vuelve pronto."}</div>
            </div>
          ) : (
            <>
              <div className="cat-grid">
                {slice.map(lote => <LoteCard key={lote.id} lote={lote}/>)}
              </div>
              {totalPages > 1 && (
                <div className="cat-pagination">
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                    <button key={p} className={`cat-page-btn${p===page?" active":""}`} onClick={()=>{setPage(p);window.scrollTo({top:0,behavior:"smooth"});}}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
