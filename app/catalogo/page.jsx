'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const fmtClp = n => n && n > 0 ? `$${Number(n).toLocaleString("es-CL")}` : null;

export default function CatalogoGeneralPage() {
  const [lotes,   setLotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("lotes")
      .select("*, bodegas(nombre), remates(nombre, fecha)")
      .eq("estado", "publicado")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setLotes(data || []); setLoading(false); });
  }, []);

  const filtrados = lotes.filter(l =>
    !busqueda ||
    l.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f4f6f9; --s2: #ffffff; --b1: #e5e7eb; --b2: #d1d5db;
          --ac: #06B6D4; --gr: #14B8A6; --wh: #111827; --mu: #6b7280;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0d1117; --s2: #161b22; --b1: #21262d; --b2: #30363d;
            --wh: #e6edf3; --mu: #8b949e;
          }
        }
        html, body { background: var(--bg); color: var(--wh); font-family: 'Inter',-apple-system,sans-serif; min-height: 100vh; }
        .header { background: linear-gradient(135deg,#0e7490,#06B6D4,#14B8A6); padding: 2.5rem 1.5rem 2rem; text-align: center; }
        .header-title { font-size: 1.8rem; font-weight: 900; color: #fff; letter-spacing: -.03em; margin-bottom: .4rem; }
        .header-sub { font-size: .9rem; color: rgba(255,255,255,.8); }
        .body { max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
        .search-bar { width: 100%; padding: .75rem 1rem; border: 1.5px solid var(--b2); border-radius: 12px;
          font-family: inherit; font-size: .9rem; color: var(--wh); background: var(--s2); outline: none;
          transition: border-color .15s; margin-bottom: 1.5rem; }
        .search-bar:focus { border-color: var(--ac); }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .card { background: var(--s2); border: 1px solid var(--b1); border-radius: 14px; overflow: hidden;
          transition: box-shadow .15s, transform .15s; }
        .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
        .card-img { width: 100%; height: 180px; object-fit: cover; background: linear-gradient(135deg,rgba(6,182,212,.08),rgba(20,184,166,.08));
          display: flex; align-items: center; justify-content: center; }
        .card-img-placeholder { font-size: 3rem; opacity: .25; }
        .card-body { padding: 1rem; }
        .card-nombre { font-size: .95rem; font-weight: 700; color: var(--wh); margin-bottom: .35rem;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .card-meta { font-size: .72rem; color: var(--mu); display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .5rem; }
        .card-precio { font-size: 1rem; font-weight: 800; color: var(--ac); }
        .tag { background: rgba(6,182,212,.08); color: var(--ac); border: 1px solid rgba(6,182,212,.2);
          border-radius: 5px; padding: .1rem .4rem; font-size: .65rem; font-weight: 700; }
        .empty { text-align: center; padding: 4rem 1rem; color: var(--mu); }
        @media (max-width: 600px) {
          .header-title { font-size: 1.4rem; }
          .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { width: 28px; height: 28px; border: 3px solid var(--b1); border-top-color: var(--ac);
          border-radius: 50%; animation: spin .8s linear infinite; margin: 3rem auto; }
      `}</style>

      <div className="header">
        <div className="header-title">Catálogo de lotes disponibles</div>
        <div className="header-sub">Lotes ingresados y aprobados, próximos a subastar</div>
      </div>

      <div className="body">
        <input className="search-bar" placeholder="Buscar por nombre, código o categoría..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}/>

        {loading ? (
          <div className="spin"/>
        ) : filtrados.length === 0 ? (
          <div className="empty">
            <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>📦</div>
            <div style={{fontWeight:700,fontSize:"1rem",marginBottom:".4rem"}}>
              {busqueda ? "Sin resultados para tu búsqueda" : "No hay lotes disponibles por ahora"}
            </div>
            <div style={{fontSize:".85rem"}}>{busqueda ? "Intenta con otras palabras." : "Vuelve pronto — se van agregando a medida que llegan."}</div>
          </div>
        ) : (
          <>
            <div style={{fontSize:".78rem",color:"var(--mu)",marginBottom:"1rem"}}>{filtrados.length} lote{filtrados.length!==1?"s":""} disponible{filtrados.length!==1?"s":""}</div>
            <div className="grid">
              {filtrados.map(lote => (
                <div key={lote.id} className="card">
                  {lote.imagenes ? (
                    <img className="card-img" src={Array.isArray(lote.imagenes)?lote.imagenes[0]:lote.imagenes} alt={lote.nombre} style={{width:"100%",height:180,objectFit:"cover"}}/>
                  ) : (
                    <div className="card-img"><span className="card-img-placeholder">📦</span></div>
                  )}
                  <div className="card-body">
                    <div className="card-nombre">{lote.nombre}</div>
                    <div className="card-meta">
                      {lote.codigo && <span>#{lote.codigo}</span>}
                      {lote.categoria && <span className="tag">{lote.categoria}</span>}
                      {lote.bodegas?.nombre && <span>📍 {lote.bodegas.nombre}</span>}
                    </div>
                    {fmtClp(lote.base) && (
                      <div className="card-precio">Base: {fmtClp(lote.base)}</div>
                    )}
                    <div style={{fontSize:".65rem",color:"var(--mu)",marginTop:".5rem"}}>
                      {lote.remates?.nombre
                        ? `Próximo remate: ${lote.remates.nombre}`
                        : "Remate por definir"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
