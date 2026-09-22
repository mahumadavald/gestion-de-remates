'use client'
import React, { useState, useRef } from "react";

const ESTADOS = [
  { id: "notificada",           label: "Notificada",            color: "#6b7280", bg: "#f3f4f6" },
  { id: "aceptada",             label: "Aceptada",              color: "#3b82f6", bg: "#eff6ff" },
  { id: "acta_recibida",        label: "Acta recibida",         color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "bienes_recepcionados", label: "Bienes en bodega",      color: "#f59e0b", bg: "#fffbeb" },
  { id: "fecha_solicitada",     label: "Fecha solicitada",      color: "#06b6d4", bg: "#ecfeff" },
  { id: "fecha_aprobada",       label: "Fecha aprobada",        color: "#10b981", bg: "#ecfdf5" },
  { id: "en_remate",            label: "En remate",             color: "#f97316", bg: "#fff7ed" },
  { id: "completada",           label: "Completada",            color: "#22c55e", bg: "#f0fdf4" },
  { id: "suspendida",           label: "Suspendida",            color: "#ef4444", bg: "#fef2f2" },
];

const ESTADO_MAP = Object.fromEntries(ESTADOS.map(e => [e.id, e]));
const FLUJO_LINEAL = ["notificada","aceptada","acta_recibida","bienes_recepcionados","fecha_solicitada","fecha_aprobada","en_remate","completada"];

const VICTOR_NEXT = {
  notificada:           { next: "aceptada",             label: "Aceptar causa",               fecha: "fecha_aceptacion" },
  aceptada:             { next: "acta_recibida",         label: "Marcar acta recibida",         fecha: "fecha_recepcion_acta" },
  acta_recibida:        { next: "bienes_recepcionados",  label: "Confirmar bienes en bodega",   fecha: "fecha_recepcion_bienes" },
  bienes_recepcionados: { next: "fecha_solicitada",      label: "Enviar solicitud de fecha",    fecha: "fecha_solicitud_remate" },
  fecha_solicitada:     { next: "fecha_aprobada",        label: "Tribunal aprobó fecha",        fecha: "fecha_aprobacion_remate" },
};

function Badge({ estado }) {
  const e = ESTADO_MAP[estado] || { label: estado, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:".3rem", background: e.bg, color: e.color,
      border:`1px solid ${e.color}33`, borderRadius:20, padding:".18rem .65rem", fontSize:".7rem", fontWeight:700, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background: e.color, flexShrink:0 }}/>
      {e.label}
    </span>
  );
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  const [y,m,d] = dateStr.slice(0,10).split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("es-CL",{day:"numeric",month:"short",year:"numeric"});
}

const EMPTY_FORM = { tipo:"concursal", rol:"", tribunal:"", empresa_deudora:"", liquidador:"", bienes_descripcion:"", precio_base:"", comision_pct:"7", notas:"" };

export default function PageCausas({ session, supabase, dbCausas, setDbCausas, dbRemates, dbLotes, setDbLotes, notify }) {
  const [selected, setSelected]     = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [uploadingActa, setUploadingActa] = useState(false);
  const [filterEstado, setFilterEstado]   = useState("todos");
  const [filterTipo, setFilterTipo]       = useState("todos");
  const [search, setSearch]               = useState("");
  const [asignandoRemate, setAsignandoRemate] = useState(false);
  const [remateSelId, setRemateSelId]         = useState("");
  const actaRef = useRef();

  const causas = dbCausas || [];

  const rematesFuturos = (dbRemates || []).filter(r => {
    const hoy = new Date().toISOString().slice(0,10);
    return r.fecha >= hoy && ["publicado","activo","en_vivo"].includes(r.estado);
  });

  const filtradas = causas.filter(c => {
    if (filterEstado !== "todos" && c.estado !== filterEstado) return false;
    if (filterTipo   !== "todos" && c.tipo   !== filterTipo)   return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.rol||"").toLowerCase().includes(q) ||
             (c.empresa_deudora||"").toLowerCase().includes(q) ||
             (c.tribunal||"").toLowerCase().includes(q) ||
             (c.liquidador||"").toLowerCase().includes(q);
    }
    return true;
  });

  const causelected = selected ? causas.find(c => c.id === selected) : null;

  // ── Guardar nueva causa ──────────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.rol.trim()) { notify("El ROL de la causa es obligatorio.", "inf"); return; }
    setSaving(true);
    const payload = {
      casa_id:           session?.casaId || null,
      tipo:              form.tipo,
      rol:               form.rol.trim().toUpperCase(),
      tribunal:          form.tribunal.trim() || null,
      empresa_deudora:   form.empresa_deudora.trim() || null,
      liquidador:        form.liquidador.trim() || null,
      bienes_descripcion:form.bienes_descripcion.trim() || null,
      precio_base:       form.precio_base ? parseFloat(String(form.precio_base).replace(/\D/g,"")) : null,
      comision_pct:      parseFloat(form.comision_pct) || 7,
      notas:             form.notas.trim() || null,
      estado:            "notificada",
      fecha_notificacion: new Date().toISOString().slice(0,10),
    };
    const { data, error } = await supabase.from("causas").insert(payload).select().single();
    setSaving(false);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbCausas(prev => [data, ...prev]);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSelected(data.id);
    notify("Causa registrada.", "sold");
  };

  // ── Avanzar estado (Victor) ──────────────────────────────────────
  const avanzarEstado = async (causa) => {
    const accion = VICTOR_NEXT[causa.estado];
    if (!accion) return;
    setSaving(true);
    const updates = { estado: accion.next, updated_at: new Date().toISOString() };
    if (accion.fecha) updates[accion.fecha] = new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from("causas").update(updates).eq("id", causa.id).select().single();
    setSaving(false);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbCausas(prev => prev.map(c => c.id === data.id ? data : c));
    notify(`Estado actualizado: ${ESTADO_MAP[data.estado]?.label}`, "sold");
  };

  // ── Suspender causa ──────────────────────────────────────────────
  const suspender = async (causa) => {
    if (!window.confirm("¿Marcar esta causa como suspendida?")) return;
    const { data, error } = await supabase.from("causas").update({ estado:"suspendida", updated_at: new Date().toISOString() }).eq("id", causa.id).select().single();
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbCausas(prev => prev.map(c => c.id === data.id ? data : c));
    notify("Causa suspendida.", "inf");
  };

  // ── Subir acta ───────────────────────────────────────────────────
  const subirActa = async (causa, file) => {
    if (!file) return;
    setUploadingActa(true);
    const ext  = file.name.split(".").pop();
    const path = `causas/${causa.id}_acta.${ext}`;
    const { error: upErr } = await supabase.storage.from("actas-entrega").upload(path, file, { upsert: true });
    if (upErr) { setUploadingActa(false); notify("Error subiendo acta: " + upErr.message, "inf"); return; }
    const { data: urlData } = supabase.storage.from("actas-entrega").getPublicUrl(path);
    const { data, error } = await supabase.from("causas")
      .update({ acta_url: urlData.publicUrl, acta_nombre: file.name, updated_at: new Date().toISOString() })
      .eq("id", causa.id).select().single();
    setUploadingActa(false);
    if (error) { notify("Error guardando acta: " + error.message, "inf"); return; }
    setDbCausas(prev => prev.map(c => c.id === data.id ? data : c));
    notify("Acta subida correctamente.", "sold");
  };

  // ── Crear lote desde causa ───────────────────────────────────────
  const crearLote = async (causa) => {
    if (causa.lote_id) { notify("Esta causa ya tiene un lote creado.", "inf"); return; }
    setSaving(true);
    const codigo = `L-${causa.rol.replace(/[^A-Z0-9]/g,"").slice(0,6)}-${Date.now().toString().slice(-3)}`;
    const { data: lote, error: loteErr } = await supabase.from("lotes").insert({
      casa_id:      session?.casaId || null,
      causa_id:     causa.id,
      codigo,
      nombre:       causa.bienes_descripcion?.slice(0,80) || causa.rol,
      descripcion:  causa.bienes_descripcion || null,
      expediente:   causa.rol,
      mandante:     causa.empresa_deudora || null,
      categoria:    causa.tipo === "concursal" ? "Concursal" : "Judicial",
      base:         causa.precio_base || 0,
      comision:     causa.comision_pct || 7,
      tipo_remate:  causa.tipo,
      estado:       "disponible",
      orden:        (dbLotes?.length || 0) + 1,
    }).select().single();
    if (loteErr) { setSaving(false); notify("Error creando lote: " + loteErr.message, "inf"); return; }
    // Vincular lote a la causa
    const { data: causaUpd, error: cauErr } = await supabase.from("causas")
      .update({ lote_id: lote.id, updated_at: new Date().toISOString() })
      .eq("id", causa.id).select().single();
    setSaving(false);
    if (cauErr) { notify("Lote creado pero error vinculando: " + cauErr.message, "inf"); return; }
    setDbCausas(prev => prev.map(c => c.id === causaUpd.id ? causaUpd : c));
    if (setDbLotes) setDbLotes(prev => [...(prev||[]), lote]);
    notify(`Lote ${codigo} creado y vinculado a la causa.`, "sold");
  };

  // ── Asignar lote a remate ────────────────────────────────────────
  const asignarRemate = async (causa) => {
    if (!remateSelId) { notify("Selecciona un remate.", "inf"); return; }
    if (!causa.lote_id) { notify("Primero crea el lote.", "inf"); return; }
    setSaving(true);
    const remate = rematesFuturos.find(r => r.id === remateSelId);
    // Actualizar lote con remate_id
    await supabase.from("lotes").update({ remate_id: remateSelId }).eq("id", causa.lote_id);
    // Avanzar causa a en_remate
    const { data, error } = await supabase.from("causas")
      .update({ estado:"en_remate", remate_id: remateSelId, updated_at: new Date().toISOString() })
      .eq("id", causa.id).select().single();
    setSaving(false);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbCausas(prev => prev.map(c => c.id === data.id ? data : c));
    setAsignandoRemate(false);
    setRemateSelId("");
    notify(`Lote asignado al remate ${remate?.nombre || "seleccionado"}.`, "sold");
  };

  const idxActual = FLUJO_LINEAL.indexOf(causelected?.estado);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="page" style={{ display:"flex", gap:0, height:"100%", overflow:"hidden" }}>

      {/* ── Panel izquierdo: lista ── */}
      <div style={{ flex: causelected ? "0 0 420px" : 1, display:"flex", flexDirection:"column", borderRight: causelected ? "1px solid var(--b1)" : "none", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"1rem 1.2rem .8rem", borderBottom:"1px solid var(--b1)", display:"flex", alignItems:"center", gap:".8rem", flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:".72rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em" }}>Seguimiento</div>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:"var(--fgp)" }}>Causas</div>
          </div>
          <button className="btn-primary" style={{ fontSize:".75rem", padding:".4rem .9rem" }} onClick={() => { setShowForm(true); setSelected(null); }}>
            + Nueva causa
          </button>
        </div>

        {/* Filtros */}
        <div style={{ padding:".7rem 1rem", borderBottom:"1px solid var(--b1)", display:"flex", gap:".5rem", flexWrap:"wrap", flexShrink:0 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ROL, empresa, tribunal…"
            style={{ flex:1, minWidth:140, fontSize:".76rem", padding:".35rem .7rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}/>
          <select value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}
            style={{ fontSize:".74rem", padding:".35rem .6rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}>
            <option value="todos">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <select value={filterTipo} onChange={e=>setFilterTipo(e.target.value)}
            style={{ fontSize:".74rem", padding:".35rem .6rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}>
            <option value="todos">Todos</option>
            <option value="concursal">Concursal</option>
            <option value="judicial">Judicial</option>
          </select>
        </div>

        {/* Stats pills */}
        <div style={{ padding:".5rem 1rem", display:"flex", gap:".4rem", flexWrap:"wrap", borderBottom:"1px solid var(--b1)", flexShrink:0 }}>
          {["notificada","aceptada","acta_recibida","bienes_recepcionados","fecha_solicitada","fecha_aprobada","en_remate"].map(est => {
            const n = causas.filter(c => c.estado === est).length;
            if (!n) return null;
            const e = ESTADO_MAP[est];
            return <span key={est} style={{ fontSize:".67rem", fontWeight:700, color: e.color, background: e.bg, border:`1px solid ${e.color}33`, borderRadius:20, padding:".12rem .55rem" }}>{e.label} {n}</span>;
          })}
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtradas.length === 0 && (
            <div style={{ padding:"2.5rem 1.5rem", textAlign:"center", color:"var(--mu)", fontSize:".82rem" }}>
              {causas.length === 0 ? "No hay causas registradas. Crea la primera." : "Sin resultados para los filtros aplicados."}
            </div>
          )}
          {filtradas.map(c => {
            const e = ESTADO_MAP[c.estado] || ESTADOS[0];
            const isSelected = selected === c.id;
            return (
              <div key={c.id} onClick={() => { setSelected(c.id); setShowForm(false); setAsignandoRemate(false); }}
                style={{ padding:".75rem 1.1rem", cursor:"pointer", borderBottom:"1px solid var(--b1)",
                  background: isSelected ? "var(--ac-bg, #ecfeff)" : "transparent",
                  borderLeft: isSelected ? `3px solid var(--ac)` : "3px solid transparent" }}>
                <div style={{ display:"flex", alignItems:"center", gap:".6rem", marginBottom:".25rem" }}>
                  <span style={{ fontSize:".8rem", fontWeight:800, color:"var(--fgp)", fontFamily:"monospace" }}>{c.rol}</span>
                  <Badge estado={c.estado}/>
                  <span style={{ marginLeft:"auto", fontSize:".68rem", color:"var(--mu)", background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:10, padding:".1rem .45rem" }}>{c.tipo}</span>
                </div>
                <div style={{ fontSize:".75rem", color:"var(--fgs)", fontWeight:600, marginBottom:".15rem" }}>{c.empresa_deudora || "—"}</div>
                <div style={{ fontSize:".7rem", color:"var(--mu)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.bienes_descripcion || "Sin descripción de bienes"}</div>
                {c.lote_id && (
                  <div style={{ marginTop:".25rem", fontSize:".67rem", color:"#10b981", fontWeight:700 }}>● Lote creado</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel derecho: formulario nueva causa ── */}
      {showForm && (
        <div style={{ flex:1, overflowY:"auto", padding:"1.2rem 1.4rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:"1.2rem" }}>
            <button onClick={() => setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mu)", fontSize:".8rem" }}>← Volver</button>
            <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--fgp)" }}>Nueva causa</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".8rem", maxWidth:640 }}>
            {/* ROL */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>ROL de la causa *</label>
              <input className="fi" placeholder="C-380-2024" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}
                style={{ width:"100%", fontFamily:"monospace", fontWeight:700 }}/>
            </div>
            {/* Tipo */}
            <div>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Tipo</label>
              <select className="fi" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={{ width:"100%" }}>
                <option value="concursal">Concursal</option>
                <option value="judicial">Judicial</option>
              </select>
            </div>
            {/* Comisión */}
            <div>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Comisión %</label>
              <input className="fi" type="number" value={form.comision_pct} onChange={e=>setForm(p=>({...p,comision_pct:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            {/* Empresa */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Empresa deudora</label>
              <input className="fi" placeholder="Nombre empresa o persona" value={form.empresa_deudora} onChange={e=>setForm(p=>({...p,empresa_deudora:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            {/* Liquidador */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Liquidador / Mandante</label>
              <input className="fi" placeholder="Nombre del liquidador" value={form.liquidador} onChange={e=>setForm(p=>({...p,liquidador:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            {/* Tribunal */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Tribunal</label>
              <input className="fi" placeholder="1° Juzgado Civil de Santiago" value={form.tribunal} onChange={e=>setForm(p=>({...p,tribunal:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            {/* Bienes */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Descripción de bienes</label>
              <textarea className="fi" rows={3} placeholder="Vehículo marca Toyota, modelo…" value={form.bienes_descripcion} onChange={e=>setForm(p=>({...p,bienes_descripcion:e.target.value}))} style={{ width:"100%", resize:"vertical" }}/>
            </div>
            {/* Base */}
            <div>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Precio base</label>
              <input className="fi" placeholder="1500000" value={form.precio_base} onChange={e=>setForm(p=>({...p,precio_base:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            {/* Notas */}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", display:"block", marginBottom:".3rem" }}>Notas</label>
              <textarea className="fi" rows={2} placeholder="Observaciones adicionales…" value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={{ width:"100%", resize:"vertical" }}/>
            </div>
          </div>

          <div style={{ marginTop:"1.2rem", display:"flex", gap:".7rem" }}>
            <button className="btn-primary" onClick={handleGuardar} disabled={saving}>
              {saving ? "Guardando…" : "Registrar causa"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background:"none", border:"1px solid var(--b1)", borderRadius:8, padding:".45rem 1rem", cursor:"pointer", fontSize:".78rem", color:"var(--fgs)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Panel derecho: detalle de causa ── */}
      {causelected && !showForm && (
        <div style={{ flex:1, overflowY:"auto", padding:"1.2rem 1.4rem" }}>

          {/* Header detalle */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:".8rem", marginBottom:"1.2rem" }}>
            <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mu)", fontSize:".8rem", flexShrink:0, marginTop:2 }}>←</button>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:".7rem", flexWrap:"wrap" }}>
                <span style={{ fontSize:"1.1rem", fontWeight:800, color:"var(--fgp)", fontFamily:"monospace" }}>{causelected.rol}</span>
                <Badge estado={causelected.estado}/>
                <span style={{ fontSize:".7rem", color:"var(--mu)", background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:10, padding:".1rem .45rem" }}>{causelected.tipo}</span>
              </div>
              <div style={{ fontSize:".8rem", color:"var(--fgs)", marginTop:".2rem" }}>{causelected.empresa_deudora || "Sin empresa"}</div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:"1rem 1.2rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:".8rem" }}>Progreso</div>
            <div style={{ display:"flex", alignItems:"center", gap:0, overflowX:"auto" }}>
              {FLUJO_LINEAL.map((est, i) => {
                const e = ESTADO_MAP[est];
                const done = idxActual >= i;
                const current = idxActual === i;
                const suspended = causelected.estado === "suspendida";
                return (
                  <React.Fragment key={est}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:".3rem", flexShrink:0 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:800,
                        background: suspended ? "#fee2e2" : done ? e.color : "var(--b1)",
                        color: suspended ? "#ef4444" : done ? "#fff" : "var(--mu)",
                        border: current && !suspended ? `2px solid ${e.color}` : "none",
                        boxShadow: current && !suspended ? `0 0 0 3px ${e.color}33` : "none" }}>
                        {suspended ? "!" : done ? "✓" : i+1}
                      </div>
                      <div style={{ fontSize:".6rem", color: done && !suspended ? e.color : "var(--mu)", fontWeight: current ? 700 : 400, textAlign:"center", maxWidth:64, lineHeight:1.3 }}>
                        {e.label}
                      </div>
                    </div>
                    {i < FLUJO_LINEAL.length - 1 && (
                      <div style={{ flex:1, height:2, background: done && idxActual > i ? ESTADO_MAP[FLUJO_LINEAL[i+1]]?.color || "#e5e7eb" : "var(--b1)", minWidth:12, margin:"0 2px", marginBottom:20 }}/>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {causelected.estado === "suspendida" && (
              <div style={{ marginTop:".8rem", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:".6rem .9rem", fontSize:".75rem", color:"#b91c1c", fontWeight:600 }}>
                ⚠ Esta causa está suspendida
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:"1rem 1.2rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:".8rem" }}>Datos de la causa</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".5rem .8rem" }}>
              {[
                ["Tribunal", causelected.tribunal],
                ["Liquidador", causelected.liquidador],
                ["Empresa deudora", causelected.empresa_deudora],
                ["Precio base", causelected.precio_base ? `$${Number(causelected.precio_base).toLocaleString("es-CL")}` : null],
                ["Comisión", causelected.comision_pct ? `${causelected.comision_pct}%` : null],
                ["Notificado", fmt(causelected.fecha_notificacion)],
                ["Acta recibida", fmt(causelected.fecha_recepcion_acta)],
                ["Bienes recepcionados", fmt(causelected.fecha_recepcion_bienes)],
                ["Solicitud enviada", fmt(causelected.fecha_solicitud_remate)],
                ["Fecha aprobada", fmt(causelected.fecha_aprobacion_remate)],
              ].filter(([,v]) => v && v !== "—").map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:".66rem", color:"var(--mu)", fontWeight:700, textTransform:"uppercase", marginBottom:".1rem" }}>{label}</div>
                  <div style={{ fontSize:".78rem", color:"var(--fgp)", fontWeight:600 }}>{val}</div>
                </div>
              ))}
              {causelected.bienes_descripcion && (
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:".66rem", color:"var(--mu)", fontWeight:700, textTransform:"uppercase", marginBottom:".1rem" }}>Bienes</div>
                  <div style={{ fontSize:".78rem", color:"var(--fgp)" }}>{causelected.bienes_descripcion}</div>
                </div>
              )}
              {causelected.notas && (
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:".66rem", color:"var(--mu)", fontWeight:700, textTransform:"uppercase", marginBottom:".1rem" }}>Notas</div>
                  <div style={{ fontSize:".76rem", color:"var(--fgs)", fontStyle:"italic" }}>{causelected.notas}</div>
                </div>
              )}
            </div>
          </div>

          {/* Acta */}
          <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:"1rem 1.2rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:".7rem" }}>Acta de entrega</div>
            {causelected.acta_url ? (
              <div style={{ display:"flex", alignItems:"center", gap:".8rem" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:".75rem", fontWeight:700, color:"#10b981" }}>✓ Acta cargada</div>
                  <div style={{ fontSize:".7rem", color:"var(--mu)" }}>{causelected.acta_nombre}</div>
                </div>
                <a href={causelected.acta_url} target="_blank" rel="noreferrer"
                  style={{ fontSize:".73rem", color:"var(--ac)", textDecoration:"none", border:"1px solid var(--ac)", borderRadius:7, padding:".3rem .7rem", fontWeight:700 }}>
                  Ver acta
                </a>
                <button onClick={() => actaRef.current?.click()} style={{ fontSize:".73rem", background:"none", border:"1px solid var(--b1)", borderRadius:7, padding:".3rem .7rem", cursor:"pointer", color:"var(--fgs)" }}>
                  {uploadingActa ? "Subiendo…" : "Reemplazar"}
                </button>
              </div>
            ) : (
              <div style={{ border:"1.5px dashed var(--b2)", borderRadius:9, padding:"1rem", textAlign:"center" }}>
                <div style={{ fontSize:".78rem", color:"var(--mu)", marginBottom:".5rem" }}>Sin acta adjunta</div>
                <button onClick={() => actaRef.current?.click()} className="btn-primary" style={{ fontSize:".73rem" }}>
                  {uploadingActa ? "Subiendo…" : "Subir acta (PDF/Word)"}
                </button>
              </div>
            )}
            <input ref={actaRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
              onChange={e => { if (e.target.files[0]) subirActa(causelected, e.target.files[0]); e.target.value=""; }}/>
          </div>

          {/* Acciones */}
          <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:"1rem 1.2rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:".8rem" }}>Acciones</div>
            <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>

              {/* Victor: avanzar estado */}
              {VICTOR_NEXT[causelected.estado] && (
                <div>
                  <div style={{ fontSize:".68rem", color:"var(--mu)", marginBottom:".3rem" }}>Victor — Legal</div>
                  <button className="btn-primary" onClick={() => avanzarEstado(causelected)} disabled={saving} style={{ width:"100%", textAlign:"center" }}>
                    {saving ? "Guardando…" : VICTOR_NEXT[causelected.estado]?.label}
                  </button>
                </div>
              )}

              {/* Maxi: crear lote */}
              {(causelected.estado === "bienes_recepcionados" || causelected.estado === "fecha_solicitada" || causelected.estado === "fecha_aprobada") && !causelected.lote_id && (
                <div>
                  <div style={{ fontSize:".68rem", color:"var(--mu)", marginBottom:".3rem" }}>Operaciones — Crear lote</div>
                  <button onClick={() => crearLote(causelected)} disabled={saving}
                    style={{ width:"100%", textAlign:"center", padding:".5rem", border:"1.5px solid #10b981", borderRadius:8, background:"#ecfdf5", color:"#059669", fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>
                    {saving ? "Creando…" : "Crear lote desde esta causa"}
                  </button>
                </div>
              )}

              {/* Maxi: asignar a remate */}
              {causelected.estado === "fecha_aprobada" && causelected.lote_id && (
                <div>
                  <div style={{ fontSize:".68rem", color:"var(--mu)", marginBottom:".3rem" }}>Operaciones — Asignar a remate</div>
                  {!asignandoRemate ? (
                    <button onClick={() => setAsignandoRemate(true)}
                      style={{ width:"100%", textAlign:"center", padding:".5rem", border:"1.5px solid #0891b2", borderRadius:8, background:"#ecfeff", color:"#0891b2", fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>
                      Asignar lote a remate →
                    </button>
                  ) : (
                    <div style={{ display:"flex", gap:".5rem" }}>
                      <select value={remateSelId} onChange={e=>setRemateSelId(e.target.value)}
                        style={{ flex:1, fontSize:".76rem", padding:".4rem .6rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}>
                        <option value="">— Seleccionar remate —</option>
                        {rematesFuturos.map(r => (
                          <option key={r.id} value={r.id}>{r.nombre} · {fmt(r.fecha)}</option>
                        ))}
                      </select>
                      <button className="btn-primary" onClick={() => asignarRemate(causelected)} disabled={saving || !remateSelId}>
                        {saving ? "…" : "Asignar"}
                      </button>
                      <button onClick={() => { setAsignandoRemate(false); setRemateSelId(""); }}
                        style={{ background:"none", border:"1px solid var(--b1)", borderRadius:7, padding:".4rem .7rem", cursor:"pointer", fontSize:".75rem", color:"var(--fgs)" }}>✕</button>
                    </div>
                  )}
                </div>
              )}

              {/* Lote creado info */}
              {causelected.lote_id && causelected.estado !== "fecha_aprobada" && (
                <div style={{ background:"#f0fdf4", border:"1px solid #a7f3d0", borderRadius:8, padding:".6rem .9rem", fontSize:".74rem", color:"#065f46", fontWeight:600 }}>
                  ✓ Lote creado y vinculado a esta causa
                  {causelected.estado === "en_remate" && <div style={{ fontWeight:400, marginTop:".2rem", color:"#059669" }}>Asignado a remate ✓</div>}
                </div>
              )}

              {/* Suspender */}
              {!["completada","suspendida","en_remate"].includes(causelected.estado) && (
                <button onClick={() => suspender(causelected)}
                  style={{ background:"none", border:"1px solid #fca5a5", borderRadius:8, padding:".4rem .8rem", cursor:"pointer", fontSize:".73rem", color:"#b91c1c", fontWeight:600, textAlign:"center" }}>
                  Marcar como suspendida
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Placeholder cuando nada seleccionado y no hay form */}
      {!causelected && !showForm && filtradas.length > 0 && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--mu)", fontSize:".82rem" }}>
          Selecciona una causa para ver el detalle
        </div>
      )}
    </div>
  );
}
