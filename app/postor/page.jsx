'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f4f4f2; --s2: #ffffff; --b1: #e5e7eb; --b2: #d1d5db;
    --ac: #06B6D4; --wh: #1a1a1a; --wh2: #374151; --mu: #6b7280; --mu2: #9ca3af;
    --gr: #14B8A6; --rd: #ef4444; --yl: #f59e0b;
    --font: 'Inter', sans-serif; --mono: 'Inter', sans-serif; --head: 'Poppins', sans-serif;
  }
  html, body { background: var(--bg); color: var(--wh); font-family: var(--font); min-height: 100vh; }
  .topbar { background: var(--s2); border-bottom: 1px solid var(--b1); padding: 0 2rem; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  .topbar-brand { display: flex; align-items: center; gap: .75rem; }
  .topbar-name  { font-size: .82rem; color: var(--mu); }
  .topbar-user  { display: flex; align-items: center; gap: .75rem; }
  .logout-btn   { background: none; border: 1px solid var(--b2); border-radius: 8px; padding: .4rem .9rem; font-family: var(--font); font-size: .82rem; color: var(--mu); cursor: pointer; transition: all .15s; }
  .logout-btn:hover { border-color: var(--rd); color: var(--rd); }
  .main { max-width: 900px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  .greeting { font-family: var(--head); font-size: 1.6rem; font-weight: 800; color: var(--wh); letter-spacing: -.02em; margin-bottom: .4rem; }
  .greeting-sub { font-size: .9rem; color: var(--mu); }
  .section-title { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--mu); margin: 2.5rem 0 1rem; display: flex; align-items: center; gap: .6rem; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--b1); }
  .remate-card { background: var(--s2); border: 1px solid var(--b1); border-radius: 14px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1.25rem; margin-bottom: .75rem; transition: box-shadow .15s; }
  .remate-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
  .remate-info { flex: 1; min-width: 0; }
  .remate-name { font-weight: 700; font-size: 1rem; color: var(--wh); margin-bottom: .25rem; }
  .remate-meta { font-size: .8rem; color: var(--mu); display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
  .badge { font-size: .65rem; font-weight: 700; padding: .2rem .55rem; border-radius: 5px; white-space: nowrap; }
  .badge-live     { background: rgba(20,184,166,.12); color: var(--gr); }
  .badge-prox     { background: rgba(6,182,212,.1); color: var(--ac); }
  .badge-pendiente{ background: rgba(245,158,11,.1); color: var(--yl); }
  .badge-verif    { background: rgba(20,184,166,.1); color: var(--gr); }
  .ir-btn { padding: .55rem 1.1rem; border-radius: 9px; font-family: var(--font); font-size: .85rem; font-weight: 700; cursor: pointer; border: none; transition: all .15s; white-space: nowrap; }
  .ir-btn-primary { background: linear-gradient(135deg,#06B6D4,#14B8A6); color: #fff; }
  .ir-btn-primary:hover { opacity: .9; transform: translateY(-1px); }
  .ir-btn-outline { background: none; border: 1.5px solid var(--b2); color: var(--mu); }
  .ir-btn-outline:hover { border-color: var(--ac); color: var(--ac); }
  .inscripcion-card { background: var(--s2); border: 1px solid var(--b1); border-radius: 12px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; margin-bottom: .6rem; }
  .inscripcion-num  { font-family: var(--mono); font-size: 1.4rem; font-weight: 700; color: var(--ac); min-width: 52px; text-align: center; }
  .inscripcion-info { flex: 1; min-width: 0; }
  .inscripcion-remate { font-weight: 700; font-size: .9rem; color: var(--wh); }
  .inscripcion-sub    { font-size: .78rem; color: var(--mu); margin-top: .15rem; }
  .msg-box { background: rgba(6,182,212,.05); border: 1px solid rgba(6,182,212,.15); border-radius: 10px; padding: .9rem 1.1rem; font-size: .82rem; color: var(--wh2); line-height: 1.6; margin-top: .4rem; }
  .msg-box-warn { background: rgba(245,158,11,.05); border-color: rgba(245,158,11,.2); }
  .empty { text-align: center; padding: 2.5rem 1rem; color: var(--mu); font-size: .88rem; }
  .cuenta-card { background: var(--s2); border: 1px solid var(--b1); border-radius: 12px; padding: .85rem 1.1rem; display: flex; align-items: center; gap: 1rem; margin-bottom: .55rem; }
  .cuenta-info { flex: 1; min-width: 0; }
  .cuenta-titular { font-weight: 700; font-size: .88rem; color: var(--wh); }
  .cuenta-detalle { font-size: .76rem; color: var(--mu); margin-top: .18rem; }
  .cuenta-badge { font-size: .62rem; font-weight: 700; padding: .18rem .5rem; border-radius: 5px; background: rgba(6,182,212,.1); color: var(--ac); white-space: nowrap; }
  .del-btn { background: none; border: 1px solid var(--b2); border-radius: 7px; padding: .28rem .6rem; color: var(--mu); font-size: .72rem; cursor: pointer; transition: all .15s; }
  .del-btn:hover { border-color: var(--rd); color: var(--rd); }
  .add-form { background: var(--s2); border: 1.5px dashed var(--b2); border-radius: 12px; padding: 1.1rem 1.25rem; margin-top: .5rem; }
  .add-form .frow { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-bottom: .65rem; }
  .add-form .frow.full { grid-template-columns: 1fr; }
  .add-form label { font-size: .72rem; font-weight: 600; color: var(--mu); display: block; margin-bottom: .22rem; }
  .add-form input, .add-form select { width: 100%; padding: .5rem .7rem; border: 1px solid var(--b2); border-radius: 8px; font-family: var(--font); font-size: .84rem; color: var(--wh); background: var(--bg); outline: none; }
  .add-form input:focus, .add-form select:focus { border-color: var(--ac); }
  .add-form-btns { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .5rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--b1); border-top-color: var(--ac); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  .fade-up { animation: fadeUp .35s ease both; }
`;

function fmt(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL", { weekday:"short", day:"numeric", month:"long", year:"numeric" });
}

const BANCOS_LIST = ["BANCO DE CHILE","BANCO DEL ESTADO DE CHILE","SCOTIABANK","BCI","BCI MACH","BANCO BICE","HSBC BANK","BANCO SANTANDER","ITAU CHILE","BANCO SECURITY","BANCO FALABELLA","BANCO RIPLEY","BANCO CONSORCIO","COOPEUCH","TENPO PREPAGO S.A","MERCADO PAGO"];
const TIPOS_CUENTA = ["CUENTA CORRIENTE","CUENTA VISTA","CUENTA RUT","CUENTA DE AHORRO","CHEQUERA ELECTRÓNICA"];

const cuentaVacia = () => ({ id: Date.now(), titular:"", rut:"", tipoCuenta:"CUENTA CORRIENTE", banco:"", nCuenta:"" });

export default function PostorPage() {
  const [authUser,     setAuthUser]     = useState(null);
  const [postor,       setPostor]       = useState(null); // row in postores
  const [remates,      setRemates]      = useState([]);   // all available
  const [inscripciones,setInscripciones]= useState([]);   // user's own
  const [loading,      setLoading]      = useState(true);
  const [expandedMsg,  setExpandedMsg]  = useState({});   // remate_id → bool
  const [cuentas,      setCuentas]      = useState([]);   // multicuentas banco
  const [addCuenta,    setAddCuenta]    = useState(false);
  const [nuevaCuenta,  setNuevaCuenta]  = useState(cuentaVacia());
  const [savingCuenta, setSavingCuenta] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/dashboard"; return; }
      setAuthUser(session.user);

      // Buscar perfil postor por user_id (puede tener varias inscripciones)
      const { data: postorRows } = await supabase
        .from("postores")
        .select("*, casas(nombre, slug, logo_url)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!postorRows || postorRows.length === 0) {
        // No es postor, puede ser martillero que llegó aquí por error
        window.location.href = "/dashboard";
        return;
      }
      setPostor(postorRows[0]);
      setInscripciones(postorRows);
      setCuentas(postorRows[0]?.cuentas_banco || []);

      // Cargar todos los remates disponibles (todas las casas)
      const { data: rematesData } = await supabase
        .from("remates")
        .select("*, casas(nombre, slug, logo_url, email, telefono)")
        .in("estado", ["publicado","en_vivo","activo"])
        .order("fecha");

      setRemates(rematesData || []);
      setLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/dashboard";
  };

  const getInscripcion = (remateId) =>
    inscripciones.find(i => i.remate_id === remateId);

  const guardarCuenta = async () => {
    if (!nuevaCuenta.titular.trim()) return alert("Ingresa el nombre del titular.");
    if (!nuevaCuenta.banco)         return alert("Selecciona el banco.");
    if (!nuevaCuenta.nCuenta.trim()) return alert("Ingresa el número de cuenta.");
    setSavingCuenta(true);
    const updated = [...cuentas, { ...nuevaCuenta, id: Date.now() }];
    const { error } = await supabase
      .from("postores")
      .update({ cuentas_banco: updated })
      .eq("id", postor.id);
    if (!error) {
      setCuentas(updated);
      setNuevaCuenta(cuentaVacia());
      setAddCuenta(false);
    } else {
      alert("Error al guardar la cuenta. Intenta nuevamente.");
    }
    setSavingCuenta(false);
  };

  const eliminarCuenta = async (id) => {
    const updated = cuentas.filter(c => c.id !== id);
    await supabase.from("postores").update({ cuentas_banco: updated }).eq("id", postor.id);
    setCuentas(updated);
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:".75rem",color:"#6b7280",fontSize:".9rem",background:"#f4f4f2"}}>
      <style>{CSS}</style>
      <div className="spinner"/>
      Cargando...
    </div>
  );

  return (
    <div>
      <style>{CSS}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-brand">
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M4 12 Q4 5 12 5 L20 5" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{fontWeight:700,fontSize:".95rem",color:"var(--wh)"}}>GR Auction Software</span>
        </div>
        <div className="topbar-user">
          <span className="topbar-name">{postor?.nombre || authUser?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="fade-up">
          <div className="greeting">Bienvenido, {postor?.nombre?.split(" ")[0] || "Postor"}</div>
          <div className="greeting-sub">{new Date().toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>

        {/* Remates disponibles */}
        <div className="section-title fade-up">Remates disponibles</div>

        {remates.length === 0 ? (
          <div className="empty fade-up">No hay remates disponibles en este momento.</div>
        ) : remates.map((r, i) => {
          const insc = getInscripcion(r.id);
          const esLive = r.estado === "en_vivo" || r.estado === "activo";
          const casaSlug = r.casas?.slug || "";

          return (
            <div key={r.id} className="remate-card fade-up" style={{animationDelay:`${i*0.04}s`}}>
              {r.casas?.logo_url
                ? <img src={r.casas.logo_url} alt={r.casas.nombre} style={{width:44,height:44,objectFit:"contain",borderRadius:8,flexShrink:0,background:"var(--bg)",padding:4}}/>
                : <div style={{width:44,height:44,borderRadius:8,background:"var(--bg)",border:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:".65rem",fontWeight:700,color:"var(--mu)",textAlign:"center",lineHeight:1.2,padding:4}}>{r.casas?.nombre?.slice(0,8)}</div>
              }
              <div className="remate-info">
                <div className="remate-name">{r.nombre}</div>
                <div className="remate-meta">
                  <span>{r.casas?.nombre}</span>
                  <span>·</span>
                  <span>{fmt(r.fecha)}{r.hora ? ` · ${r.hora}` : ""}</span>
                  <span>·</span>
                  <span>{r.modalidad || "—"}</span>
                  {esLive && <span className="badge badge-live">● En vivo</span>}
                  {!esLive && <span className="badge badge-prox">Próximo</span>}
                </div>

                {/* Estado inscripción */}
                {insc && (
                  <div style={{marginTop:".5rem",display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap"}}>
                    <span style={{fontSize:".78rem",color:"var(--mu)"}}>Tu inscripción:</span>
                    <span className={`badge ${insc.estado==="verificado"?"badge-verif":"badge-pendiente"}`}>
                      {insc.estado === "verificado" ? "Verificado" : "Pendiente de aprobación"} · #{String(insc.numero).padStart(3,"0")}
                    </span>
                  </div>
                )}

                {/* Mensaje expandido */}
                {expandedMsg[r.id] && (
                  <div className={`msg-box${insc&&insc.estado!=="verificado"?" msg-box-warn":""}`} style={{marginTop:".6rem"}}>
                    {!insc && `Aún no estás inscrito en este remate. Haz click en "Inscribirme" para participar en ${r.casas?.nombre}.`}
                    {insc && insc.estado !== "verificado" && `Tu garantía está pendiente de verificación por ${r.casas?.nombre}. Una vez aprobada, podrás acceder al remate. ¿Dudas? Contacta a ${r.casas?.email || r.casas?.nombre}.`}
                    {insc && insc.estado === "verificado" && r.modalidad?.toLowerCase().includes("online") && `Ingresa con tu número de postor #${String(insc.numero).padStart(3,"0")} a la sala en vivo. Tendrás una clave de acceso de un solo uso el día del remate.`}
                  </div>
                )}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:".5rem",alignItems:"flex-end"}}>
                {!insc && (
                  <a href={`/participar?casa=${casaSlug}`} className="ir-btn ir-btn-primary" style={{textDecoration:"none",display:"inline-block"}}>
                    Inscribirme →
                  </a>
                )}
                {insc && insc.estado === "verificado" && esLive && (
                  <a href={`/display/${casaSlug}`} className="ir-btn ir-btn-primary" target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"inline-block"}}>
                    Entrar al remate →
                  </a>
                )}
                {insc && insc.estado === "verificado" && !esLive && (
                  <span style={{fontSize:".78rem",color:"var(--gr)",fontWeight:600}}>Inscrito</span>
                )}
                {insc && insc.estado !== "verificado" && (
                  <span style={{fontSize:".78rem",color:"var(--yl)",fontWeight:600}}>Pendiente</span>
                )}
                <button className="ir-btn ir-btn-outline" onClick={()=>setExpandedMsg(p=>({...p,[r.id]:!p[r.id]}))}>
                  {expandedMsg[r.id] ? "Cerrar" : "Info"}
                </button>
              </div>
            </div>
          );
        })}

        {/* Mis inscripciones */}
        <div className="section-title fade-up">Mis inscripciones</div>

        {inscripciones.length === 0 ? (
          <div className="empty fade-up">Aún no tienes inscripciones registradas.</div>
        ) : inscripciones.map((insc, i) => (
          <div key={insc.id} className="inscripcion-card fade-up" style={{animationDelay:`${i*0.04}s`}}>
            <div className="inscripcion-num">#{String(insc.numero).padStart(3,"0")}</div>
            <div className="inscripcion-info">
              <div className="inscripcion-remate">{insc.remate_id}</div>
              <div className="inscripcion-sub">
                {insc.casas?.nombre} · {insc.modalidad}
              </div>
            </div>
            <span className={`badge ${insc.estado==="verificado"?"badge-verif":"badge-pendiente"}`}>
              {insc.estado === "verificado" ? "Verificado" : "Pendiente"}
            </span>
          </div>
        ))}

        {/* ── Mis Cuentas Bancarias ── */}
        <div className="section-title fade-up">Mis cuentas bancarias</div>
        <p style={{fontSize:".82rem",color:"var(--mu)",marginBottom:"1rem",lineHeight:1.6}}>
          Guarda tus cuentas para que al inscribirte en un remate puedas elegir dónde quieres recibir la devolución de tu garantía.
        </p>

        {cuentas.map(c => (
          <div key={c.id} className="cuenta-card fade-up">
            <div style={{width:38,height:38,borderRadius:9,background:"rgba(6,182,212,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
            </div>
            <div className="cuenta-info">
              <div className="cuenta-titular">{c.titular}</div>
              <div className="cuenta-detalle">{c.banco} · {c.tipoCuenta} · N° {c.nCuenta}{c.rut ? ` · RUT ${c.rut}` : ""}</div>
            </div>
            <span className="cuenta-badge">{c.tipoCuenta === "CUENTA RUT" ? "Cta. RUT" : c.tipoCuenta.split(" ")[1] || c.tipoCuenta}</span>
            <button className="del-btn" onClick={() => eliminarCuenta(c.id)}>Eliminar</button>
          </div>
        ))}

        {cuentas.length === 0 && !addCuenta && (
          <div className="empty fade-up" style={{padding:"1.5rem",border:"1px dashed var(--b2)",borderRadius:12,marginBottom:".75rem"}}>
            No tienes cuentas bancarias guardadas aún.
          </div>
        )}

        {!addCuenta && (
          <button className="ir-btn ir-btn-outline fade-up" style={{width:"100%",marginBottom:"1rem"}} onClick={() => setAddCuenta(true)}>
            + Agregar cuenta bancaria
          </button>
        )}

        {addCuenta && (
          <div className="add-form fade-up">
            <div style={{fontWeight:700,fontSize:".88rem",color:"var(--wh)",marginBottom:".75rem"}}>Nueva cuenta bancaria</div>
            <div className="frow">
              <div>
                <label>Titular de la cuenta *</label>
                <input placeholder="Nombre completo" value={nuevaCuenta.titular} onChange={e=>setNuevaCuenta(p=>({...p,titular:e.target.value}))}/>
              </div>
              <div>
                <label>RUT del titular</label>
                <input placeholder="12.345.678-9" value={nuevaCuenta.rut} onChange={e=>setNuevaCuenta(p=>({...p,rut:e.target.value}))}/>
              </div>
            </div>
            <div className="frow">
              <div>
                <label>Banco *</label>
                <select value={nuevaCuenta.banco} onChange={e=>setNuevaCuenta(p=>({...p,banco:e.target.value}))}>
                  <option value="">— Selecciona banco —</option>
                  {BANCOS_LIST.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label>Tipo de cuenta</label>
                <select value={nuevaCuenta.tipoCuenta} onChange={e=>setNuevaCuenta(p=>({...p,tipoCuenta:e.target.value}))}>
                  {TIPOS_CUENTA.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="frow full">
              <div>
                <label>Número de cuenta *</label>
                <input placeholder="00000000" value={nuevaCuenta.nCuenta} onChange={e=>setNuevaCuenta(p=>({...p,nCuenta:e.target.value}))}/>
              </div>
            </div>
            <div className="add-form-btns">
              <button className="ir-btn ir-btn-outline" onClick={() => { setAddCuenta(false); setNuevaCuenta(cuentaVacia()); }}>Cancelar</button>
              <button className="ir-btn ir-btn-primary" onClick={guardarCuenta} disabled={savingCuenta}>
                {savingCuenta ? "Guardando..." : "Guardar cuenta →"}
              </button>
            </div>
          </div>
        )}

        <div style={{marginTop:"3rem",paddingTop:"1.5rem",borderTop:"1px solid var(--b1)",display:"flex",alignItems:"center",gap:".6rem",justifyContent:"center"}}>
          <svg width="16" height="16" viewBox="0 0 36 36" fill="none">
            <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{fontSize:".72rem",color:"var(--mu2)"}}>GR Auction Software · <a href="https://gestionderemates.cl" style={{color:"var(--mu2)",textDecoration:"none"}}>gestionderemates.cl</a></span>
        </div>
      </div>
    </div>
  );
}
