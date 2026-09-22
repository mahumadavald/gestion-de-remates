'use client'
import React, { useState, useRef } from "react";

/* ── Estado machine ───────────────────────────────────────────── */
const ESTADOS = [
  { id: "notificada",           label: "Notificada",       short: "Notificada",  color: "#6b7280", bg: "#f3f4f6" },
  { id: "aceptada",             label: "Aceptada",         short: "Aceptada",    color: "#3b82f6", bg: "#eff6ff" },
  { id: "acta_recibida",        label: "Acta recibida",    short: "Acta",        color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "bienes_recepcionados", label: "Bienes en bodega", short: "Bienes",      color: "#f59e0b", bg: "#fffbeb" },
  { id: "fecha_solicitada",     label: "Fecha solicitada", short: "Fecha sol.",  color: "#06b6d4", bg: "#ecfeff" },
  { id: "fecha_aprobada",       label: "Fecha aprobada",   short: "Fecha OK",    color: "#10b981", bg: "#ecfdf5" },
  { id: "en_remate",            label: "En remate",        short: "En remate",   color: "#f97316", bg: "#fff7ed" },
  { id: "completada",           label: "Completada",       short: "Completada",  color: "#22c55e", bg: "#f0fdf4" },
  { id: "suspendida",           label: "Suspendida",       short: "Suspendida",  color: "#ef4444", bg: "#fef2f2" },
];
const ESTADO_MAP = Object.fromEntries(ESTADOS.map(e => [e.id, e]));
const FLUJO = ["notificada","aceptada","acta_recibida","bienes_recepcionados","fecha_solicitada","fecha_aprobada","en_remate","completada"];
const ACTIVAS = ["notificada","aceptada","acta_recibida","bienes_recepcionados","fecha_solicitada","fecha_aprobada","en_remate"];

/* ── Acciones Victor (qué hace en cada estado) ───────────────── */
const VICTOR_ACCION = {
  notificada:           { label: "Aceptar esta causa",         desc: "Confirmá que aceptás llevar adelante este remate.",     next: "aceptada",             fecha: "fecha_aceptacion",        needsActa: false },
  aceptada:             { label: "Subir acta de entrega",      desc: "Adjuntá el acta firmada (PDF o Word) para continuar.", next: "acta_recibida",        fecha: "fecha_recepcion_acta",    needsActa: true  },
  acta_recibida:        { label: "Confirmar bienes en bodega", desc: "Los bienes ya llegaron y están físicamente en bodega.", next: "bienes_recepcionados", fecha: "fecha_recepcion_bienes",  needsActa: false },
  bienes_recepcionados: { label: "Enviar solicitud de fecha",  desc: "Mandaste al tribunal la solicitud de fecha de remate.", next: "fecha_solicitada",     fecha: "fecha_solicitud_remate",  needsActa: false },
  fecha_solicitada:     { label: "Tribunal aprobó la fecha",   desc: "El tribunal confirmó y aprobó la fecha del remate.",   next: "fecha_aprobada",       fecha: "fecha_aprobacion_remate", needsActa: false },
};

/* ── Helpers ──────────────────────────────────────────────────── */
const lbl        = { fontSize:".68rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:".3rem" };
const secTitle   = { fontSize:".67rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:".65rem" };
const btnSec     = { background:"none", border:"1px solid var(--b1)", borderRadius:8, padding:".4rem .85rem", cursor:"pointer", fontSize:".76rem", color:"var(--fgs)", fontWeight:600 };

function Badge({ estado }) {
  const e = ESTADO_MAP[estado] || { label: estado, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:".3rem", background:e.bg, color:e.color,
      border:`1px solid ${e.color}33`, borderRadius:20, padding:".15rem .65rem", fontSize:".68rem", fontWeight:700, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:e.color, flexShrink:0 }}/>
      {e.label}
    </span>
  );
}

function fmt(d) {
  if (!d) return null;
  const [y,m,day] = d.slice(0,10).split("-").map(Number);
  return new Date(y,m-1,day).toLocaleDateString("es-CL",{day:"numeric",month:"short",year:"numeric"});
}

/* ── Detectar columnas Excel automáticamente ─────────────────── */
function detectCol(headers, keywords) {
  const idx = headers.findIndex(h => keywords.some(k => String(h).toLowerCase().includes(k)));
  return idx >= 0 ? idx : null;
}
function parseExcelRows(raw) {
  if (!raw || raw.length < 2) return [];
  const headers = raw[0].map(h => String(h||"").toLowerCase().trim());
  const iRol      = detectCol(headers,["rol","causa","expediente"]) ?? 0;
  const iTribunal = detectCol(headers,["tribunal","juzgado"]) ?? 1;
  const iEmpresa  = detectCol(headers,["empresa","deudora","razon","razón"]) ?? 2;
  const iLiquid   = detectCol(headers,["liquidador","mandante","acreedor"]) ?? 3;
  const iBienes   = detectCol(headers,["bienes","descripcion","descripción","detalle","bien"]) ?? 4;
  const iBase     = detectCol(headers,["base","precio","valor"]) ?? 5;
  const iTipo     = detectCol(headers,["tipo","clase"]) ?? null;
  const iNota     = detectCol(headers,["nota","observacion","observación","comentario"]) ?? null;
  return raw.slice(1)
    .filter(r => r.some(c => String(c||"").trim() !== ""))
    .map((r,i) => {
      const rol  = String(r[iRol]||"").trim().toUpperCase();
      const tipo = iTipo !== null ? (String(r[iTipo]||"").toLowerCase().includes("judicial") ? "judicial" : "concursal") : "concursal";
      const base = parseInt(String(r[iBase]||"0").replace(/\D/g,"")) || 0;
      return {
        _row: i+2, rol,
        tribunal:          String(r[iTribunal]||"").trim()||null,
        empresa_deudora:   String(r[iEmpresa]||"").trim()||null,
        liquidador:        String(r[iLiquid]||"").trim()||null,
        bienes_descripcion:String(r[iBienes]||"").trim()||null,
        precio_base:       base||null, tipo,
        notas: iNota !== null ? String(r[iNota]||"").trim()||null : null,
        error: !rol ? "ROL vacío" : null,
      };
    });
}

const EMPTY_FORM = { tipo:"concursal", rol:"", tribunal:"", empresa_deudora:"", liquidador:"", bienes_descripcion:"", precio_base:"", comision_pct:"7", notas:"" };

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════════ */
export default function PageCausas({ session, supabase, dbCausas, setDbCausas, dbRemates, dbLotes, setDbLotes, notify }) {
  const [selected, setSelected]           = useState(null);
  const [view, setView]                   = useState("lista");
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [uploadingActa, setUploadingActa] = useState(false);
  const [filterEstado, setFilterEstado]   = useState("activas");
  const [search, setSearch]               = useState("");
  const [asignandoRemate, setAsignandoRemate] = useState(false);
  const [remateSelId, setRemateSelId]         = useState("");
  const [excelRows, setExcelRows]         = useState([]);
  const [excelSel, setExcelSel]           = useState(new Set());
  const [excelSaving, setExcelSaving]     = useState(false);
  const actaInputRef = useRef();
  const xlsxRef      = useRef();

  const causas = dbCausas || [];
  const rematesFuturos = (dbRemates||[]).filter(r => {
    const hoy = new Date().toISOString().slice(0,10);
    return r.fecha >= hoy && ["publicado","activo","en_vivo"].includes(r.estado);
  });

  const filtradas = causas.filter(c => {
    if (filterEstado === "activas"    && !ACTIVAS.includes(c.estado)) return false;
    if (filterEstado === "completadas" && c.estado !== "completada")  return false;
    if (filterEstado !== "activas" && filterEstado !== "completadas" && filterEstado !== "todas" && c.estado !== filterEstado) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.rol||"").toLowerCase().includes(q) ||
             (c.empresa_deudora||"").toLowerCase().includes(q) ||
             (c.tribunal||"").toLowerCase().includes(q);
    }
    return true;
  });

  const causelected = selected ? causas.find(c => c.id === selected) : null;
  const accion      = causelected ? VICTOR_ACCION[causelected.estado] : null;

  /* ── Guardar nueva causa manual ── */
  const handleGuardar = async () => {
    if (!form.rol.trim()) { notify("El ROL es obligatorio.","inf"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("causas").insert({
      casa_id: session?.casaId||null, tipo: form.tipo,
      rol: form.rol.trim().toUpperCase(),
      tribunal: form.tribunal.trim()||null, empresa_deudora: form.empresa_deudora.trim()||null,
      liquidador: form.liquidador.trim()||null, bienes_descripcion: form.bienes_descripcion.trim()||null,
      precio_base: form.precio_base ? parseFloat(String(form.precio_base).replace(/\D/g,""))||null : null,
      comision_pct: parseFloat(form.comision_pct)||7, notas: form.notas.trim()||null,
      estado: "notificada", fecha_notificacion: new Date().toISOString().slice(0,10),
    }).select().single();
    setSaving(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>[data,...prev]);
    setView("lista"); setForm(EMPTY_FORM); setSelected(data.id);
    notify("Causa registrada.","sold");
  };

  /* ── Avanzar estado (Victor) ── */
  const avanzarEstado = async (causa) => {
    const ac = VICTOR_ACCION[causa.estado];
    if (!ac) return;
    setSaving(true);
    const upd = { estado: ac.next, updated_at: new Date().toISOString() };
    if (ac.fecha) upd[ac.fecha] = new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from("causas").update(upd).eq("id",causa.id).select().single();
    setSaving(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    notify("Listo — "+ESTADO_MAP[data.estado]?.label,"sold");
  };

  /* ── Subir acta (solo archivo) ── */
  const subirActa = async (causa, file) => {
    if (!file) return;
    setUploadingActa(true);
    const ext  = file.name.split(".").pop();
    const path = `causas/${causa.id}_acta.${ext}`;
    const { error: upErr } = await supabase.storage.from("actas-entrega").upload(path, file, { upsert:true });
    if (upErr) { setUploadingActa(false); notify("Error subiendo: "+upErr.message,"inf"); return; }
    const { data: urlData } = supabase.storage.from("actas-entrega").getPublicUrl(path);
    const { data, error } = await supabase.from("causas")
      .update({ acta_url: urlData.publicUrl, acta_nombre: file.name, updated_at: new Date().toISOString() })
      .eq("id",causa.id).select().single();
    setUploadingActa(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    notify("Acta subida.","sold");
  };

  /* ── Subir acta + avanzar estado (en un paso) ── */
  const subirYAvanzar = async (causa, file) => {
    if (!file) { notify("Seleccioná el archivo del acta primero.","inf"); return; }
    setUploadingActa(true);
    const ext  = file.name.split(".").pop();
    const path = `causas/${causa.id}_acta.${ext}`;
    const { error: upErr } = await supabase.storage.from("actas-entrega").upload(path, file, { upsert:true });
    if (upErr) { setUploadingActa(false); notify("Error subiendo: "+upErr.message,"inf"); return; }
    const { data: urlData } = supabase.storage.from("actas-entrega").getPublicUrl(path);
    const { data, error } = await supabase.from("causas").update({
      acta_url: urlData.publicUrl, acta_nombre: file.name,
      estado: "acta_recibida", fecha_recepcion_acta: new Date().toISOString().slice(0,10),
      updated_at: new Date().toISOString(),
    }).eq("id",causa.id).select().single();
    setUploadingActa(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    notify("Acta subida y estado actualizado.","sold");
  };

  /* ── Suspender ── */
  const suspender = async (causa) => {
    if (!window.confirm("¿Marcar esta causa como suspendida?")) return;
    const { data, error } = await supabase.from("causas")
      .update({ estado:"suspendida", updated_at:new Date().toISOString() })
      .eq("id",causa.id).select().single();
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    notify("Causa suspendida.","inf");
  };

  /* ── Crear lote desde causa ── */
  const crearLote = async (causa) => {
    if (causa.lote_id) { notify("Esta causa ya tiene un lote.","inf"); return; }
    setSaving(true);
    const codigo = `L-${causa.rol.replace(/[^A-Z0-9]/g,"").slice(0,6)}-${Date.now().toString().slice(-3)}`;
    const { data: lote, error: loteErr } = await supabase.from("lotes").insert({
      casa_id: session?.casaId||null, causa_id: causa.id, codigo,
      nombre: causa.bienes_descripcion?.slice(0,80)||causa.rol,
      descripcion: causa.bienes_descripcion||null, expediente: causa.rol,
      mandante: causa.empresa_deudora||null,
      categoria: causa.tipo==="concursal" ? "Concursal" : "Judicial",
      base: causa.precio_base||0, comision: causa.comision_pct||7,
      tipo_remate: causa.tipo, estado: "disponible",
      orden: (dbLotes?.length||0)+1,
    }).select().single();
    if (loteErr) { setSaving(false); notify("Error: "+loteErr.message,"inf"); return; }
    const { data, error } = await supabase.from("causas")
      .update({ lote_id: lote.id, updated_at:new Date().toISOString() })
      .eq("id",causa.id).select().single();
    setSaving(false);
    if (error) { notify("Lote creado, error vinculando: "+error.message,"inf"); return; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    if (setDbLotes) setDbLotes(prev=>[...(prev||[]),lote]);
    notify(`Lote ${codigo} creado.`,"sold");
  };

  /* ── Asignar lote a remate ── */
  const asignarRemate = async (causa) => {
    if (!remateSelId) { notify("Seleccioná un remate.","inf"); return; }
    setSaving(true);
    const remate = rematesFuturos.find(r=>r.id===remateSelId);
    await supabase.from("lotes").update({ remate_id: remateSelId }).eq("id",causa.lote_id);
    const { data, error } = await supabase.from("causas")
      .update({ estado:"en_remate", remate_id: remateSelId, updated_at:new Date().toISOString() })
      .eq("id",causa.id).select().single();
    setSaving(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    setAsignandoRemate(false); setRemateSelId("");
    notify(`Asignado al remate "${remate?.nombre||""}"`, "sold");
  };

  /* ── Leer Excel ── */
  const handleExcelFile = async (file) => {
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf);
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });
      const rows = parseExcelRows(raw);
      setExcelRows(rows);
      setExcelSel(new Set(rows.filter(r=>!r.error).map((_,i)=>i)));
      setView("excel");
    } catch(e) {
      notify("No se pudo leer el archivo: "+e.message,"inf");
    }
    xlsxRef.current.value="";
  };

  /* ── Importar causas desde Excel ── */
  const importarCausas = async () => {
    const toImport = excelRows.filter((_,i)=>excelSel.has(i) && !excelRows[i].error);
    if (!toImport.length) { notify("No hay filas seleccionadas.","inf"); return; }
    setExcelSaving(true);
    const hoy = new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from("causas").insert(toImport.map(r=>({
      casa_id: session?.casaId||null, tipo: r.tipo, rol: r.rol,
      tribunal: r.tribunal, empresa_deudora: r.empresa_deudora,
      liquidador: r.liquidador, bienes_descripcion: r.bienes_descripcion,
      precio_base: r.precio_base, comision_pct: 7, notas: r.notas,
      estado: "notificada", fecha_notificacion: hoy,
    }))).select();
    setExcelSaving(false);
    if (error) { notify("Error importando: "+error.message,"inf"); return; }
    setDbCausas(prev=>[...(data||[]),...prev]);
    setView("lista"); setExcelRows([]);
    notify(`${data.length} causas importadas.`,"sold");
  };

  /* ══ RENDER ══════════════════════════════════════════════════ */
  return (
    <div className="page" style={{ display:"flex", gap:0, height:"100%", overflow:"hidden" }}>

      {/* ── PANEL IZQUIERDO: lista ─────────────────────────────── */}
      <div style={{ flex: causelected&&view==="lista" ? "0 0 400px" : 1, display:"flex", flexDirection:"column",
        borderRight: causelected&&view==="lista" ? "1px solid var(--b1)" : "none", overflow:"hidden", minWidth:0 }}>

        {/* Header */}
        <div style={{ padding:"1rem 1.2rem .8rem", borderBottom:"1px solid var(--b1)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:".6rem", marginBottom:".7rem", flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:".67rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em" }}>Seguimiento</div>
              <div style={{ fontSize:"1.05rem", fontWeight:800, color:"var(--fgp)" }}>Causas judiciales</div>
            </div>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }}
              onChange={e=>{ if(e.target.files[0]) handleExcelFile(e.target.files[0]); }}/>
            <button onClick={()=>xlsxRef.current?.click()}
              style={{ ...btnSec, fontSize:".72rem", whiteSpace:"nowrap" }}>
              📊 Importar Excel
            </button>
            <button className="btn-primary" style={{ fontSize:".72rem", padding:".38rem .85rem", whiteSpace:"nowrap" }}
              onClick={()=>{ setView("form"); setSelected(null); }}>
              + Nueva causa
            </button>
          </div>
          <div style={{ display:"flex", gap:".5rem" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ROL, empresa…"
              style={{ flex:1, minWidth:0, fontSize:".74rem", padding:".32rem .6rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}/>
            <select value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}
              style={{ fontSize:".72rem", padding:".32rem .5rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}>
              <option value="activas">Activas</option>
              <option value="todas">Todas</option>
              <option value="completadas">Completadas</option>
              <option value="suspendida">Suspendidas</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding:".45rem 1rem", display:"flex", gap:".3rem", flexWrap:"wrap", borderBottom:"1px solid var(--b1)", flexShrink:0 }}>
          {ACTIVAS.slice(0,6).map(est=>{
            const n = causas.filter(c=>c.estado===est).length;
            if (!n) return null;
            const e = ESTADO_MAP[est];
            return <span key={est} style={{ fontSize:".63rem", fontWeight:700, color:e.color, background:e.bg, border:`1px solid ${e.color}33`, borderRadius:20, padding:".1rem .45rem" }}>{e.short} {n}</span>;
          })}
          {!causas.length && <span style={{ fontSize:".7rem", color:"var(--mu)" }}>Sin causas aún</span>}
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtradas.length === 0 && (
            <div style={{ padding:"3rem 1.5rem", textAlign:"center", color:"var(--mu)", fontSize:".8rem" }}>
              {causas.length === 0
                ? <><div style={{ fontSize:"1.5rem", marginBottom:".5rem" }}>📋</div><div>No hay causas registradas.<br/>Creá la primera o importá desde Excel.</div></>
                : "Sin resultados."}
            </div>
          )}
          {filtradas.map(c => {
            const e  = ESTADO_MAP[c.estado]||ESTADOS[0];
            const ac = VICTOR_ACCION[c.estado];
            const isSel = selected===c.id;
            return (
              <div key={c.id} onClick={()=>{ setSelected(c.id); setView("lista"); setAsignandoRemate(false); }}
                style={{ padding:".7rem 1rem", cursor:"pointer", borderBottom:"1px solid var(--b1)",
                  background: isSel ? "var(--ac-bg,#ecfeff)" : "transparent",
                  borderLeft: isSel ? "3px solid var(--ac)" : "3px solid transparent" }}>
                <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".2rem" }}>
                  <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:".8rem", color:"var(--fgp)" }}>{c.rol}</span>
                  <Badge estado={c.estado}/>
                  <span style={{ marginLeft:"auto", fontSize:".62rem", color:"var(--mu)", background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:10, padding:".1rem .4rem" }}>{c.tipo}</span>
                </div>
                <div style={{ fontSize:".73rem", color:"var(--fgs)", fontWeight:600 }}>{c.empresa_deudora||"—"}</div>
                {ac && <div style={{ fontSize:".67rem", color:e.color, fontWeight:700, marginTop:".18rem" }}>→ {ac.label}</div>}
                {c.lote_id && !ac && <div style={{ fontSize:".63rem", color:"#10b981", fontWeight:700, marginTop:".15rem" }}>✓ Lote creado</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO: nueva causa manual ─────────────────── */}
      {view==="form" && (
        <div style={{ flex:1, overflowY:"auto", padding:"1.2rem 1.4rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:"1.2rem" }}>
            <button onClick={()=>setView("lista")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mu)", fontSize:".8rem" }}>← Volver</button>
            <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--fgp)" }}>Nueva causa</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".8rem", maxWidth:580 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>ROL de la causa *</label>
              <input className="fi" placeholder="C-380-2024" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))} style={{ width:"100%", fontFamily:"monospace", fontWeight:800 }}/>
            </div>
            <div>
              <label style={lbl}>Tipo</label>
              <select className="fi" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={{ width:"100%" }}>
                <option value="concursal">Concursal</option>
                <option value="judicial">Judicial</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Comisión %</label>
              <input className="fi" type="number" value={form.comision_pct} onChange={e=>setForm(p=>({...p,comision_pct:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Empresa / persona deudora</label>
              <input className="fi" placeholder="Nombre empresa o persona" value={form.empresa_deudora} onChange={e=>setForm(p=>({...p,empresa_deudora:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Liquidador / Mandante</label>
              <input className="fi" placeholder="Nombre del liquidador" value={form.liquidador} onChange={e=>setForm(p=>({...p,liquidador:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Tribunal</label>
              <input className="fi" placeholder="1° Juzgado Civil de Santiago" value={form.tribunal} onChange={e=>setForm(p=>({...p,tribunal:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Descripción de bienes</label>
              <textarea className="fi" rows={3} placeholder="Vehículo Toyota, modelo Hilux, año 2020…" value={form.bienes_descripcion} onChange={e=>setForm(p=>({...p,bienes_descripcion:e.target.value}))} style={{ width:"100%", resize:"vertical" }}/>
            </div>
            <div>
              <label style={lbl}>Precio base ($)</label>
              <input className="fi" placeholder="1500000" value={form.precio_base} onChange={e=>setForm(p=>({...p,precio_base:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div>
              <label style={lbl}>Notas</label>
              <input className="fi" value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={{ width:"100%" }}/>
            </div>
          </div>
          <div style={{ marginTop:"1.2rem", display:"flex", gap:".7rem" }}>
            <button className="btn-primary" onClick={handleGuardar} disabled={saving}>{saving?"Guardando…":"Registrar causa"}</button>
            <button onClick={()=>setView("lista")} style={btnSec}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── PANEL DERECHO: importar Excel ─────────────────────── */}
      {view==="excel" && (
        <div style={{ flex:1, overflowY:"auto", padding:"1.2rem 1.4rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".8rem", marginBottom:"1rem" }}>
            <button onClick={()=>setView("lista")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mu)", fontSize:".8rem" }}>← Volver</button>
            <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--fgp)" }}>Importar desde Excel</div>
          </div>
          <div style={{ fontSize:".78rem", color:"var(--mu)", marginBottom:"1rem" }}>
            Se detectaron <strong>{excelRows.length}</strong> filas. Seleccioná las que querés importar (filas con error están marcadas en rojo).
          </div>
          <div style={{ overflowX:"auto", border:"1px solid var(--b1)", borderRadius:10, marginBottom:"1rem" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".72rem" }}>
              <thead>
                <tr style={{ background:"var(--s2)" }}>
                  <th style={{ padding:".45rem .7rem", textAlign:"left", fontWeight:700, color:"var(--mu)", borderBottom:"1px solid var(--b1)" }}>
                    <input type="checkbox"
                      checked={excelSel.size===excelRows.filter(r=>!r.error).length && excelRows.filter(r=>!r.error).length>0}
                      onChange={e=>{ if(e.target.checked) setExcelSel(new Set(excelRows.filter(r=>!r.error).map((_,i)=>i)));
                        else setExcelSel(new Set()); }}/>
                  </th>
                  {["ROL","Tipo","Empresa","Liquidador","Bienes","Base"].map(h=>(
                    <th key={h} style={{ padding:".45rem .7rem", textAlign:"left", fontWeight:700, color:"var(--mu)", borderBottom:"1px solid var(--b1)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelRows.map((r,i)=>(
                  <tr key={i} style={{ background: r.error?"#fef2f2":"transparent", opacity: r.error?.6:1 }}>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)" }}>
                      {r.error
                        ? <span style={{ fontSize:".63rem", color:"#ef4444" }}>✕ {r.error}</span>
                        : <input type="checkbox" checked={excelSel.has(i)} onChange={e=>{ const ns=new Set(excelSel); e.target.checked?ns.add(i):ns.delete(i); setExcelSel(ns); }}/>
                      }
                    </td>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)", fontFamily:"monospace", fontWeight:700 }}>{r.rol||"—"}</td>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)" }}>
                      <span style={{ fontSize:".63rem", background:r.tipo==="judicial"?"#eff6ff":"#f5f3ff", color:r.tipo==="judicial"?"#3b82f6":"#8b5cf6", borderRadius:10, padding:".1rem .4rem", fontWeight:700 }}>{r.tipo}</span>
                    </td>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)", maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.empresa_deudora||"—"}</td>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)", maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.liquidador||"—"}</td>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.bienes_descripcion||"—"}</td>
                    <td style={{ padding:".4rem .7rem", borderBottom:"1px solid var(--b1)", fontFamily:"monospace" }}>{r.precio_base?`$${Number(r.precio_base).toLocaleString("es-CL")}`:"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:"flex", gap:".7rem", alignItems:"center" }}>
            <button className="btn-primary" onClick={importarCausas} disabled={excelSaving||!excelSel.size}>
              {excelSaving?"Importando…":`Importar ${excelSel.size} causa${excelSel.size!==1?"s":""}`}
            </button>
            <button onClick={()=>setView("lista")} style={btnSec}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── PANEL DERECHO: detalle de causa ──────────────────── */}
      {causelected && view==="lista" && (
        <div style={{ flex:1, overflowY:"auto" }}>

          {/* Topbar */}
          <div style={{ padding:".9rem 1.3rem", borderBottom:"1px solid var(--b1)", display:"flex", alignItems:"flex-start", gap:".7rem" }}>
            <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--mu)", fontSize:".78rem", marginTop:2, flexShrink:0 }}>←</button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:".55rem", flexWrap:"wrap" }}>
                <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:"1.1rem", color:"var(--fgp)" }}>{causelected.rol}</span>
                <Badge estado={causelected.estado}/>
                <span style={{ fontSize:".66rem", color:"var(--mu)", background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:10, padding:".1rem .4rem" }}>{causelected.tipo}</span>
              </div>
              <div style={{ fontSize:".78rem", color:"var(--fgs)", marginTop:".18rem", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {causelected.empresa_deudora||"Sin empresa"}
              </div>
            </div>
          </div>

          <div style={{ padding:"1rem 1.3rem", display:"flex", flexDirection:"column", gap:".85rem" }}>

            {/* ══ CARD VICTOR: QUÉ HACER AHORA ══════════════════ */}
            {accion && causelected.estado !== "suspendida" && (
              <div style={{ background:"#f0fdf4", border:"2px solid #4ade80", borderRadius:14, padding:"1.1rem 1.3rem" }}>
                <div style={{ fontSize:".65rem", fontWeight:800, color:"#059669", textTransform:"uppercase", letterSpacing:".09em", marginBottom:".45rem" }}>
                  Paso {FLUJO.indexOf(causelected.estado)+1} de {FLUJO.length-1} — ¿Qué hago ahora?
                </div>
                <div style={{ fontSize:".95rem", fontWeight:800, color:"#064e3b", marginBottom:".35rem" }}>
                  {accion.label}
                </div>
                <div style={{ fontSize:".76rem", color:"#065f46", marginBottom:".9rem", lineHeight:1.5 }}>{accion.desc}</div>

                {accion.needsActa
                  ? <ActaUploadBlock causa={causelected} uploadingActa={uploadingActa} saving={saving} onSubirYAvanzar={subirYAvanzar}/>
                  : (
                    <button onClick={()=>avanzarEstado(causelected)} disabled={saving}
                      style={{ display:"block", width:"100%", padding:".72rem 1rem", background:"#10b981",
                        border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:".88rem",
                        cursor:saving?"not-allowed":"pointer", opacity:saving?.7:1 }}>
                      {saving ? "Guardando…" : `✓ Marcar como: ${ESTADO_MAP[accion.next]?.label}`}
                    </button>
                  )
                }
              </div>
            )}

            {/* suspendida */}
            {causelected.estado==="suspendida" && (
              <div style={{ background:"#fef2f2", border:"2px solid #fca5a5", borderRadius:14, padding:"1rem 1.3rem" }}>
                <div style={{ fontSize:".9rem", fontWeight:800, color:"#b91c1c" }}>⚠ Causa suspendida</div>
                <div style={{ fontSize:".74rem", color:"#991b1b", marginTop:".3rem" }}>Esta causa fue marcada como suspendida.</div>
              </div>
            )}

            {/* en_remate / completada */}
            {(causelected.estado==="en_remate"||causelected.estado==="completada") && !accion && (
              <div style={{ background:"#eff6ff", border:"2px solid #93c5fd", borderRadius:14, padding:"1rem 1.3rem" }}>
                <div style={{ fontSize:".9rem", fontWeight:800, color:"#1d4ed8" }}>
                  {causelected.estado==="completada" ? "✅ Causa completada" : "🔨 En remate"}
                </div>
              </div>
            )}

            {/* ── Progreso simple ── */}
            <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:"1rem 1.2rem" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:".65rem" }}>
                <div style={secTitle}>Progreso</div>
                {!["suspendida","completada"].includes(causelected.estado) && (
                  <div style={{ fontSize:".7rem", color:"var(--mu)", fontWeight:700 }}>
                    Paso {Math.max(1,FLUJO.indexOf(causelected.estado)+1)} de {FLUJO.length-1}
                  </div>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:0, overflowX:"auto", paddingBottom:4 }}>
                {FLUJO.slice(0,-1).map((est,i)=>{
                  const e   = ESTADO_MAP[est];
                  const idx = FLUJO.indexOf(causelected.estado);
                  const done = idx>i, curr = idx===i;
                  const susp = causelected.estado==="suspendida";
                  return (
                    <React.Fragment key={est}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:".22rem", flexShrink:0 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".6rem", fontWeight:800,
                          background: done?"#d1fae5": curr&&!susp?e.bg:"var(--b1)",
                          color: done?"#059669": curr&&!susp?e.color:"var(--mu)",
                          border: curr&&!susp?`2px solid ${e.color}`:"none",
                          boxShadow: curr&&!susp?`0 0 0 3px ${e.color}22`:"none" }}>
                          {done?"✓":i+1}
                        </div>
                        <div style={{ fontSize:".56rem", color:done?"#059669":curr&&!susp?e.color:"var(--mu)", fontWeight:curr?700:400, textAlign:"center", width:50, lineHeight:1.2 }}>
                          {e.short}
                        </div>
                      </div>
                      {i < FLUJO.length-2 && <div style={{ flex:1, height:2, background:done?"#4ade80":"var(--b1)", minWidth:10, margin:"0 1px", marginBottom:16 }}/>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ── Acta (si ya hay una subida, o si el estado ya pasó de notificada) ── */}
            {(causelected.acta_url || FLUJO.indexOf(causelected.estado) >= 1) && (
              <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:".9rem 1.2rem" }}>
                <div style={secTitle}>Acta de entrega</div>
                {causelected.acta_url ? (
                  <div style={{ display:"flex", alignItems:"center", gap:".7rem" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:".74rem", fontWeight:700, color:"#10b981" }}>✓ Acta adjunta</div>
                      <div style={{ fontSize:".67rem", color:"var(--mu)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{causelected.acta_nombre}</div>
                    </div>
                    <a href={causelected.acta_url} target="_blank" rel="noreferrer"
                      style={{ fontSize:".7rem", color:"var(--ac)", textDecoration:"none", border:"1px solid var(--ac)", borderRadius:7, padding:".28rem .65rem", fontWeight:700, whiteSpace:"nowrap" }}>
                      Ver acta
                    </a>
                    <button onClick={()=>actaInputRef.current?.click()} style={{ ...btnSec, fontSize:".7rem", padding:".28rem .65rem", whiteSpace:"nowrap" }}>
                      {uploadingActa?"Subiendo…":"Reemplazar"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:".7rem" }}>
                    <div style={{ flex:1, fontSize:".74rem", color:"var(--mu)" }}>Sin acta adjunta todavía</div>
                    <button onClick={()=>actaInputRef.current?.click()} style={{ ...btnSec, fontSize:".7rem", padding:".28rem .65rem", whiteSpace:"nowrap" }}>
                      {uploadingActa?"Subiendo…":"Subir acta"}
                    </button>
                  </div>
                )}
                <input ref={actaInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
                  onChange={e=>{ if(e.target.files[0]) subirActa(causelected,e.target.files[0]); e.target.value=""; }}/>
              </div>
            )}

            {/* ── Operaciones Maxi ── */}
            {(ACTIVAS.includes(causelected.estado)||causelected.lote_id) && (
              <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:".9rem 1.2rem" }}>
                <div style={secTitle}>Operaciones</div>
                <div style={{ display:"flex", flexDirection:"column", gap:".55rem" }}>
                  {["bienes_recepcionados","fecha_solicitada","fecha_aprobada"].includes(causelected.estado) && !causelected.lote_id && (
                    <button onClick={()=>crearLote(causelected)} disabled={saving}
                      style={{ padding:".5rem .8rem", border:"1.5px solid #10b981", borderRadius:8, background:"#ecfdf5", color:"#059669", fontWeight:700, fontSize:".77rem", cursor:"pointer", textAlign:"center" }}>
                      {saving?"Creando…":"📦 Crear lote desde esta causa"}
                    </button>
                  )}
                  {causelected.lote_id && causelected.estado!=="fecha_aprobada" && (
                    <div style={{ background:"#f0fdf4", border:"1px solid #a7f3d0", borderRadius:8, padding:".55rem .9rem", fontSize:".73rem", color:"#065f46", fontWeight:600 }}>
                      ✓ Lote creado{causelected.estado==="en_remate"?" y asignado a remate":""}
                    </div>
                  )}
                  {causelected.estado==="fecha_aprobada" && causelected.lote_id && (
                    !asignandoRemate ? (
                      <button onClick={()=>setAsignandoRemate(true)}
                        style={{ padding:".5rem .8rem", border:"1.5px solid #0891b2", borderRadius:8, background:"#ecfeff", color:"#0891b2", fontWeight:700, fontSize:".77rem", cursor:"pointer", textAlign:"center" }}>
                        📋 Asignar lote a remate
                      </button>
                    ) : (
                      <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                        <select value={remateSelId} onChange={e=>setRemateSelId(e.target.value)}
                          style={{ flex:1, minWidth:140, fontSize:".74rem", padding:".38rem .55rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}>
                          <option value="">— Seleccionar remate —</option>
                          {rematesFuturos.map(r=><option key={r.id} value={r.id}>{r.nombre} · {fmt(r.fecha)}</option>)}
                        </select>
                        <button className="btn-primary" onClick={()=>asignarRemate(causelected)} disabled={saving||!remateSelId}>{saving?"…":"Asignar"}</button>
                        <button onClick={()=>{ setAsignandoRemate(false); setRemateSelId(""); }} style={btnSec}>✕</button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ── Datos básicos (colapsable) ── */}
            <details style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12 }}>
              <summary style={{ padding:".9rem 1.2rem", cursor:"pointer", fontSize:".77rem", fontWeight:700, color:"var(--fgp)", userSelect:"none", listStyle:"none" }}>
                ▶ Datos de la causa
              </summary>
              <div style={{ padding:".5rem 1.2rem 1rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:".5rem .8rem" }}>
                {[
                  ["Tribunal",          causelected.tribunal],
                  ["Liquidador",        causelected.liquidador],
                  ["Precio base",       causelected.precio_base ? `$${Number(causelected.precio_base).toLocaleString("es-CL")}` : null],
                  ["Comisión",          causelected.comision_pct ? `${causelected.comision_pct}%` : null],
                  ["Notificado",        fmt(causelected.fecha_notificacion)],
                  ["Acta recibida",     fmt(causelected.fecha_recepcion_acta)],
                  ["Bienes llegaron",   fmt(causelected.fecha_recepcion_bienes)],
                  ["Solicitud enviada", fmt(causelected.fecha_solicitud_remate)],
                  ["Fecha aprobada",    fmt(causelected.fecha_aprobacion_remate)],
                ].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k}>
                    <div style={{ fontSize:".63rem", color:"var(--mu)", fontWeight:700, textTransform:"uppercase" }}>{k}</div>
                    <div style={{ fontSize:".75rem", color:"var(--fgp)", fontWeight:600 }}>{v}</div>
                  </div>
                ))}
                {causelected.bienes_descripcion && (
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ fontSize:".63rem", color:"var(--mu)", fontWeight:700, textTransform:"uppercase" }}>Bienes</div>
                    <div style={{ fontSize:".75rem", color:"var(--fgp)" }}>{causelected.bienes_descripcion}</div>
                  </div>
                )}
                {causelected.notas && (
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ fontSize:".63rem", color:"var(--mu)", fontWeight:700, textTransform:"uppercase" }}>Notas</div>
                    <div style={{ fontSize:".73rem", color:"var(--fgs)", fontStyle:"italic" }}>{causelected.notas}</div>
                  </div>
                )}
              </div>
            </details>

            {/* Suspender */}
            {!["completada","suspendida","en_remate"].includes(causelected.estado) && (
              <button onClick={()=>suspender(causelected)}
                style={{ background:"none", border:"1px solid #fca5a5", borderRadius:8, padding:".4rem", cursor:"pointer", fontSize:".72rem", color:"#b91c1c", fontWeight:600, textAlign:"center" }}>
                Marcar como suspendida
              </button>
            )}
          </div>
        </div>
      )}

      {/* Placeholder central */}
      {!causelected && view==="lista" && filtradas.length > 0 && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--mu)", fontSize:".8rem" }}>
          Seleccioná una causa para ver el detalle
        </div>
      )}
    </div>
  );
}

/* ── Sub-componente upload acta + avanzar en un paso ─────────── */
function ActaUploadBlock({ causa, uploadingActa, saving, onSubirYAvanzar }) {
  const [file, setFile] = useState(null);
  const ref = useRef();
  return (
    <div>
      {file ? (
        <div style={{ marginBottom:".65rem", background:"#f0fdf4", border:"1px solid #a7f3d0", borderRadius:8, padding:".45rem .8rem", display:"flex", alignItems:"center", gap:".6rem" }}>
          <span style={{ flex:1, fontSize:".73rem", fontWeight:700, color:"#065f46", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📎 {file.name}</span>
          <button onClick={()=>setFile(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#6b7280", fontSize:".78rem", flexShrink:0 }}>✕ Cambiar</button>
        </div>
      ) : (
        <button onClick={()=>ref.current?.click()}
          style={{ display:"block", width:"100%", padding:".55rem", marginBottom:".65rem", border:"1.5px dashed #4ade80", borderRadius:9, background:"transparent", color:"#059669", fontWeight:700, fontSize:".8rem", cursor:"pointer" }}>
          📎 Seleccionar archivo (PDF o Word)
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
        onChange={e=>{ if(e.target.files[0]) setFile(e.target.files[0]); e.target.value=""; }}/>
      <button onClick={()=>onSubirYAvanzar(causa, file)} disabled={uploadingActa||saving||!file}
        style={{ display:"block", width:"100%", padding:".72rem 1rem",
          background: file?"#10b981":"#d1fae5",
          border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:".88rem",
          cursor: file&&!uploadingActa&&!saving?"pointer":"not-allowed",
          opacity: !file?.5:1 }}>
        {uploadingActa?"Subiendo acta…":"📎 Subir acta y continuar →"}
      </button>
      {causa?.acta_url && (
        <div style={{ marginTop:".45rem", fontSize:".68rem", color:"#059669", textAlign:"center" }}>
          ✓ Ya hay un acta subida — esta la va a reemplazar
        </div>
      )}
    </div>
  );
}
