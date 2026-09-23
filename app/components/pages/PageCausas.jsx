'use client'
import React, { useState, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════
   CRONOGRAMA REMATES — columnas del xlsx mapeadas al sistema:
   A=N°  B=Tipo  C=Comisión  D=Liquidador  E=Deudor  F=ROL
   G=Juzgado  H=Especies  I=Mínimo
   J=Designación Martillero (OK)   K=Aviso Entrega (OK)
   L=Acta Recepción (OK)           M=Bases/Hora/Fecha (notas color)
   N=Aviso Diario (OK)             O=Boletín Concursal (OK)
   P=Fecha de Remate
══════════════════════════════════════════════════════════════════ */

/* ── Estado machine ──────────────────────────────────────────── */
const ESTADOS = [
  { id:"notificada",           label:"Notificada",          short:"Notif.",      color:"#6b7280", bg:"#f3f4f6" },
  { id:"aceptada",             label:"Aceptada",            short:"Aceptada",    color:"#3b82f6", bg:"#eff6ff" },
  { id:"acta_recibida",        label:"Acta recibida",       short:"Acta",        color:"#8b5cf6", bg:"#f5f3ff" },
  { id:"bienes_recepcionados", label:"Bienes en bodega",    short:"Bienes",      color:"#f59e0b", bg:"#fffbeb" },
  { id:"bases_enviadas",       label:"Bases enviadas",      short:"Bases",       color:"#06b6d4", bg:"#ecfeff" },
  { id:"publicaciones_ok",     label:"Publicado",           short:"Publicado",   color:"#a855f7", bg:"#faf5ff" },
  { id:"fecha_aprobada",       label:"Fecha aprobada",      short:"Fecha OK",    color:"#10b981", bg:"#ecfdf5" },
  { id:"en_remate",            label:"En remate",           short:"En remate",   color:"#f97316", bg:"#fff7ed" },
  { id:"completada",           label:"Completada",          short:"Completada",  color:"#22c55e", bg:"#f0fdf4" },
  { id:"suspendida",           label:"Suspendida",          short:"Suspendida",  color:"#ef4444", bg:"#fef2f2" },
  // compatibilidad con estado viejo
  { id:"fecha_solicitada",     label:"Bases enviadas",      short:"Bases",       color:"#06b6d4", bg:"#ecfeff" },
];
const ESTADO_MAP = Object.fromEntries(ESTADOS.map(e=>[e.id,e]));
const FLUJO = ["aceptada","acta_recibida","bienes_recepcionados","bases_enviadas","publicaciones_ok","fecha_aprobada","en_remate","completada"];
const ACTIVAS = FLUJO.slice(0,-1);

/* ── Acciones Victor por estado ─────────────────────────────── */
const VICTOR_ACCION = {
  notificada:           { label:"Subir acta de recepción",     desc:"Adjuntá el acta firmada (PDF o Word) para continuar.",       next:"acta_recibida",        fecha:"fecha_recepcion_acta",    needsActa:true  },
  aceptada:             { label:"Subir acta de recepción",     desc:"Adjuntá el acta firmada (PDF o Word) para continuar.",       next:"acta_recibida",        fecha:"fecha_recepcion_acta",    needsActa:true  },
  acta_recibida:        { label:"Confirmar bienes en bodega",  desc:"Los bienes llegaron físicamente a la bodega.",               next:"bienes_recepcionados", fecha:"fecha_recepcion_bienes",  needsActa:false },
  bienes_recepcionados: { label:"Enviar bases y propuestas",   desc:"Se enviaron las bases al tribunal con la fecha propuesta.",   next:"bases_enviadas",       fecha:"fecha_solicitud_remate",  needsActa:false },
  bases_enviadas:       { label:"Publicaciones listas",        desc:"Se publicó en el diario y en el boletín concursal.",         next:"publicaciones_ok",     fecha:null,                      needsActa:false },
  publicaciones_ok:     { label:"Tribunal aprobó la fecha",   desc:"El tribunal confirmó y aprobó la fecha del remate.",          next:"fecha_aprobada",       fecha:"fecha_aprobacion_remate", needsActa:false },
  // compatibilidad
  fecha_solicitada:     { label:"Publicaciones listas",        desc:"Se publicó en el diario y en el boletín concursal.",         next:"publicaciones_ok",     fecha:null,                      needsActa:false },
};

/* ── Helpers ─────────────────────────────────────────────────── */
const lbl    = { fontSize:".67rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:".28rem" };
const secTit = { fontSize:".66rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:".6rem" };
const btnSec = { background:"none", border:"1px solid var(--b1)", borderRadius:7, padding:".35rem .75rem", cursor:"pointer", fontSize:".74rem", color:"var(--fgs)", fontWeight:600 };

function Badge({ estado }) {
  const e = ESTADO_MAP[estado]||{ label:estado, color:"#6b7280", bg:"#f3f4f6" };
  return <span style={{ display:"inline-flex", alignItems:"center", gap:".28rem", background:e.bg, color:e.color, border:`1px solid ${e.color}33`, borderRadius:20, padding:".14rem .6rem", fontSize:".67rem", fontWeight:700, whiteSpace:"nowrap" }}>
    <span style={{ width:5, height:5, borderRadius:"50%", background:e.color, flexShrink:0 }}/>
    {e.label}
  </span>;
}
function fmt(d) {
  if (!d) return null;
  const [y,m,day] = d.slice(0,10).split("-").map(Number);
  return new Date(y,m-1,day).toLocaleDateString("es-CL",{day:"numeric",month:"short",year:"numeric"});
}
function CheckItem({ label, checked, onChange, sublabel }) {
  return <div onClick={onChange} style={{ display:"flex", alignItems:"center", gap:".6rem", padding:".5rem .7rem", borderRadius:8, cursor:"pointer", background: checked ? "#f0fdf4" : "var(--s2)", border:`1px solid ${checked?"#a7f3d0":"var(--b1)"}`, marginBottom:".35rem", userSelect:"none" }}>
    <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${checked?"#10b981":"#d1d5db"}`, background: checked?"#10b981":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {checked && <span style={{ color:"#fff", fontSize:".7rem", fontWeight:900 }}>✓</span>}
    </div>
    <div>
      <div style={{ fontSize:".78rem", fontWeight:700, color: checked?"#065f46":"var(--fgp)" }}>{label}</div>
      {sublabel && <div style={{ fontSize:".66rem", color:"var(--mu)" }}>{sublabel}</div>}
    </div>
  </div>;
}

/* ── Parsear fecha de Excel (serial number o string) ─────────── */
function parseExcelDate(val) {
  if (!val && val !== 0) return null;
  // Número serial de Excel (ej: 46000)
  if (typeof val === "number" || (typeof val === "string" && /^\d{4,6}$/.test(val.trim()) && Number(val) > 1000)) {
    const n = Number(val);
    if (n > 59) { // corrección por bug de 1900-02-29 en Excel
      const d = new Date(Math.round((n - 25569) * 86400 * 1000));
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
    }
    return null;
  }
  const s = String(val).trim();
  if (!s) return null;
  // DD.MM.YYYY o DD/MM/YYYY o DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,"0")}-${m1[1].padStart(2,"0")}`;
  // YYYY-MM-DD ya correcto
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2,"0")}-${m2[3].padStart(2,"0")}`;
  // MM/DD/YYYY (formato EEUU)
  const m3 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m3) {
    const [,a,b,y] = m3;
    // si primer número > 12 es DD/MM
    if (Number(a) > 12) return `${y}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`;
    return `${y}-${a.padStart(2,"0")}-${b.padStart(2,"0")}`;
  }
  // intentar Date.parse como fallback
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

/* ── Detectar columnas Excel automáticamente ─────────────────── */
function detectCol(headers, keywords) {
  return headers.findIndex(h=>keywords.some(k=>String(h).toLowerCase().includes(k)));
}
function parseExcelRows(raw) {
  if (!raw||raw.length<2) return [];
  const hdr = raw[0].map(h=>String(h||"").toLowerCase().trim());
  const iRol  = ~detectCol(hdr,["rol","causa","expediente"]) ? detectCol(hdr,["rol","causa","expediente"]) : 5;
  const iTrib = ~detectCol(hdr,["juzgado","tribunal"]) ? detectCol(hdr,["juzgado","tribunal"]) : 6;
  const iEmp  = ~detectCol(hdr,["deudor","empresa","razon"]) ? detectCol(hdr,["deudor","empresa","razon"]) : 4;
  const iLiq  = ~detectCol(hdr,["liquidador","mandante"]) ? detectCol(hdr,["liquidador","mandante"]) : 3;
  const iBien = ~detectCol(hdr,["especie","bien","descripcion"]) ? detectCol(hdr,["especie","bien","descripcion"]) : 7;
  const iMin  = ~detectCol(hdr,["minimo","mínimo","base","precio"]) ? detectCol(hdr,["minimo","mínimo","base","precio"]) : 8;
  const iCom  = ~detectCol(hdr,["comision","comisión"]) ? detectCol(hdr,["comision","comisión"]) : 2;
  const iTipo = ~detectCol(hdr,["tipo","clase"]) ? detectCol(hdr,["tipo","clase"]) : 1;
  const iFecha= ~detectCol(hdr,["fecha remate","fecha_remate","remate"]) ? detectCol(hdr,["fecha remate","fecha_remate","remate"]) : -1;
  const iNota = ~detectCol(hdr,["nota","observac","bases"]) ? detectCol(hdr,["nota","observac","bases"]) : -1;
  return raw.slice(1).filter(r=>r.some(c=>String(c||"").trim()!=="")).map((r,i)=>{
    const rol  = String(r[iRol]||"").trim().toUpperCase();
    const tipo = String(r[iTipo]||"").toLowerCase().includes("judicial")?"judicial":"concursal";
    const minRaw = String(r[iMin]||"").trim();
    const minimo = minRaw.toLowerCase().includes("mejor") ? "M/P" : minRaw || null;
    const com  = parseFloat(String(r[iCom]||"7").replace(/[^\d.]/g,"")) || 7;
    return {
      _row:i+2, rol, tipo,
      tribunal:          String(r[iTrib]||"").trim()||null,
      empresa_deudora:   String(r[iEmp]||"").trim()||null,
      liquidador:        String(r[iLiq]||"").trim()||null,
      bienes_descripcion:String(r[iBien]||"").trim()||null,
      minimo, comision_pct: com,
      bases_notas:       iNota>=0 ? String(r[iNota]||"").trim()||null : null,
      fecha_remate:      parseExcelDate(iFecha>=0 ? r[iFecha] : null),
      error: !rol ? "ROL vacío" : null,
    };
  });
}

const EMPTY = { tipo:"concursal", rol:"", tribunal:"", empresa_deudora:"", liquidador:"", bienes_descripcion:"", minimo:"", comision_pct:"7", notas:"" };

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════════ */
export default function PageCausas({ session, supabase, dbCausas, setDbCausas, dbRemates, dbLotes, setDbLotes, notify }) {
  const [selected, setSelected]     = useState(null);
  const [view, setView]             = useState("lista");
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [uploadingActa, setUploadingActa] = useState(false);
  const [search, setSearch]         = useState("");
  const [filterEstado, setFilterEstado] = useState("activas");
  const [asignandoRemate, setAsignandoRemate] = useState(false);
  const [remateSelId, setRemateSelId]         = useState("");
  const [excelRows, setExcelRows]   = useState([]);
  const [excelSel, setExcelSel]     = useState(new Set());
  const [excelSaving, setExcelSaving] = useState(false);
  const [editingBasesNotas, setEditingBasesNotas] = useState(false);
  const [basesNotasVal, setBasesNotasVal] = useState("");
  const actaRef = useRef();
  const xlsxRef = useRef();

  const causas = dbCausas||[];
  const rematesFuturos = (dbRemates||[]).filter(r=>{
    const hoy = new Date().toISOString().slice(0,10);
    return r.fecha>=hoy && ["publicado","activo","en_vivo"].includes(r.estado);
  });

  const filtradas = causas.filter(c=>{
    if (filterEstado==="activas"    && !ACTIVAS.includes(c.estado)) return false;
    if (filterEstado==="completadas" && c.estado!=="completada")     return false;
    if (!["activas","completadas","todas"].includes(filterEstado) && c.estado!==filterEstado) return false;
    if (search) {
      const q=search.toLowerCase();
      return (c.rol||"").toLowerCase().includes(q)||(c.empresa_deudora||"").toLowerCase().includes(q)||(c.tribunal||"").toLowerCase().includes(q)||(c.liquidador||"").toLowerCase().includes(q);
    }
    return true;
  });

  const C = causelected => causas.find(c=>c.id===causelected)||null;
  const causelected = selected ? C(selected) : null;
  const accion = causelected ? VICTOR_ACCION[causelected.estado] : null;
  const idxActual = FLUJO.indexOf(causelected?.estado ?? "");

  /* ── helpers DB ── */
  const patchCausa = async (id, updates) => {
    const { data, error } = await supabase.from("causas").update({ ...updates, updated_at:new Date().toISOString() }).eq("id",id).select().single();
    if (error) { notify("Error: "+error.message,"inf"); return null; }
    setDbCausas(prev=>prev.map(c=>c.id===data.id?data:c));
    return data;
  };

  /* ── Toggle checkbox ── */
  const toggleCheck = async (causa, field, val) => {
    await patchCausa(causa.id, { [field]: val });
  };

  /* ── Guardar nueva causa ── */
  const handleGuardar = async () => {
    if (!form.rol.trim()) { notify("El ROL es obligatorio.","inf"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("causas").insert({
      casa_id: session?.casaId||null, tipo:form.tipo,
      rol: form.rol.trim().toUpperCase(),
      tribunal: form.tribunal.trim()||null, empresa_deudora:form.empresa_deudora.trim()||null,
      liquidador: form.liquidador.trim()||null, bienes_descripcion:form.bienes_descripcion.trim()||null,
      minimo: form.minimo.trim()||null,
      comision_pct: parseFloat(form.comision_pct)||7,
      notas: form.notas.trim()||null,
      estado:"aceptada", fecha_aceptacion:new Date().toISOString().slice(0,10),
    }).select().single();
    setSaving(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>[data,...prev]);
    setView("lista"); setForm(EMPTY); setSelected(data.id);
    notify("Causa registrada.","sold");
  };

  /* ── Avanzar estado Victor ── */
  const avanzarEstado = async (causa) => {
    const ac = VICTOR_ACCION[causa.estado]; if (!ac) return;
    setSaving(true);
    const upd = { estado:ac.next };
    if (ac.fecha) upd[ac.fecha] = new Date().toISOString().slice(0,10);
    const data = await patchCausa(causa.id, upd);
    setSaving(false);
    if (data) notify("Listo — "+ESTADO_MAP[data.estado]?.label,"sold");
  };

  /* ── Subir acta ── */
  const subirActa = async (causa, file, avanzar=false) => {
    if (!file) return;
    setUploadingActa(true);
    const ext  = file.name.split(".").pop();
    const path = `causas/${causa.id}_acta.${ext}`;
    const { error:upErr } = await supabase.storage.from("actas-entrega").upload(path,file,{upsert:true});
    if (upErr) { setUploadingActa(false); notify("Error: "+upErr.message,"inf"); return; }
    const { data:urlData } = supabase.storage.from("actas-entrega").getPublicUrl(path);
    const upd = { acta_url:urlData.publicUrl, acta_nombre:file.name };
    if (avanzar) { upd.estado="acta_recibida"; upd.fecha_recepcion_acta=new Date().toISOString().slice(0,10); upd.acta_recepcion_ok=true; }
    await patchCausa(causa.id, upd);
    setUploadingActa(false);
    notify(avanzar?"Acta subida y estado actualizado.":"Acta subida.","sold");
  };

  /* ── Suspender ── */
  const suspender = async (causa) => {
    if (!window.confirm("¿Marcar como suspendida?")) return;
    const data = await patchCausa(causa.id, { estado:"suspendida" });
    if (data) notify("Causa suspendida.","inf");
  };

  /* ── Crear lote ── */
  const crearLote = async (causa) => {
    if (causa.lote_id) { notify("Ya tiene lote.","inf"); return; }
    setSaving(true);
    const codigo = `L-${causa.rol.replace(/[^A-Z0-9]/g,"").slice(0,6)}-${Date.now().toString().slice(-3)}`;
    const { data:lote, error:loteErr } = await supabase.from("lotes").insert({
      casa_id:session?.casaId||null, causa_id:causa.id, codigo,
      nombre:causa.bienes_descripcion?.slice(0,80)||causa.rol,
      descripcion:causa.bienes_descripcion||null, expediente:causa.rol,
      mandante:causa.empresa_deudora||null,
      categoria:causa.tipo==="concursal"?"Concursal":"Judicial",
      base: causa.minimo && !isNaN(parseFloat(String(causa.minimo).replace(/\D/g,""))) ? parseFloat(String(causa.minimo).replace(/\D/g,"")) : 0,
      comision:causa.comision_pct||7, tipo_remate:causa.tipo,
      estado:"disponible", orden:(dbLotes?.length||0)+1,
    }).select().single();
    if (loteErr) { setSaving(false); notify("Error: "+loteErr.message,"inf"); return; }
    await patchCausa(causa.id,{lote_id:lote.id});
    setSaving(false);
    if (setDbLotes) setDbLotes(prev=>[...(prev||[]),lote]);
    notify(`Lote ${codigo} creado.`,"sold");
  };

  /* ── Asignar remate ── */
  const asignarRemate = async (causa) => {
    if (!remateSelId) { notify("Seleccioná un remate.","inf"); return; }
    setSaving(true);
    const remate = rematesFuturos.find(r=>r.id===remateSelId);
    await supabase.from("lotes").update({remate_id:remateSelId}).eq("id",causa.lote_id);
    const data = await patchCausa(causa.id,{ estado:"en_remate", remate_id:remateSelId });
    setSaving(false);
    if (data) { setAsignandoRemate(false); setRemateSelId(""); notify(`Asignado al remate "${remate?.nombre||""}"`, "sold"); }
  };

  /* ── Guardar bases notas ── */
  const guardarBasesNotas = async (causa) => {
    await patchCausa(causa.id, { bases_notas: basesNotasVal.trim()||null });
    setEditingBasesNotas(false);
    notify("Notas guardadas.","sold");
  };

  /* ── Guardar fecha remate ── */
  const guardarFechaRemate = async (causa, fecha) => {
    const upd = { fecha_remate: fecha||null };
    if (fecha && ["publicaciones_ok","bases_enviadas","fecha_solicitada"].includes(causa.estado)) {
      upd.estado = "fecha_aprobada";
      upd.fecha_aprobacion_remate = new Date().toISOString().slice(0,10);
    }
    await patchCausa(causa.id, upd);
    if (fecha) notify("Fecha de remate guardada.","sold");
  };

  /* ── Excel ── */
  const handleExcelFile = async (file) => {
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf);
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      const rows = parseExcelRows(raw);
      setExcelRows(rows);
      setExcelSel(new Set(rows.filter(r=>!r.error).map((_,i)=>i)));
      setView("excel");
    } catch(e) { notify("Error leyendo archivo: "+e.message,"inf"); }
    xlsxRef.current.value="";
  };
  const importarCausas = async () => {
    const toImport = excelRows.filter((_,i)=>excelSel.has(i)&&!excelRows[i].error);
    if (!toImport.length) { notify("No hay filas seleccionadas.","inf"); return; }
    setExcelSaving(true);
    const hoy = new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from("causas").insert(toImport.map(r=>({
      casa_id:session?.casaId||null, tipo:r.tipo, rol:r.rol,
      tribunal:r.tribunal, empresa_deudora:r.empresa_deudora, liquidador:r.liquidador,
      bienes_descripcion:r.bienes_descripcion, minimo:r.minimo,
      comision_pct:r.comision_pct||7, bases_notas:r.bases_notas,
      fecha_remate:r.fecha_remate||null,
      estado:"aceptada", fecha_aceptacion:hoy,
    }))).select();
    setExcelSaving(false);
    if (error) { notify("Error: "+error.message,"inf"); return; }
    setDbCausas(prev=>[...(data||[]),...prev]);
    setView("lista"); setExcelRows([]);
    notify(`${data.length} causas importadas.`,"sold");
  };

  /* ══ RENDER ════════════════════════════════════════════════════ */
  return (
    <div className="page" style={{ display:"flex", gap:0, height:"100%", overflow:"hidden" }}>

      {/* ── Lista ───────────────────────────────────────────────── */}
      <div style={{ flex: causelected&&view==="lista"?"0 0 420px":1, display:"flex", flexDirection:"column",
        borderRight: causelected&&view==="lista"?"1px solid var(--b1)":"none", overflow:"hidden", minWidth:0 }}>

        {/* Header */}
        <div style={{ padding:".9rem 1.1rem .75rem", borderBottom:"1px solid var(--b1)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:".55rem", marginBottom:".65rem", flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:".65rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em" }}>Seguimiento</div>
              <div style={{ fontSize:"1rem", fontWeight:800, color:"var(--fgp)" }}>Causas judiciales</div>
            </div>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }}
              onChange={e=>{ if(e.target.files[0]) handleExcelFile(e.target.files[0]); }}/>
            <button onClick={()=>xlsxRef.current?.click()} style={{ ...btnSec, fontSize:".7rem", whiteSpace:"nowrap" }}>📊 Importar Excel</button>
            <button className="btn-primary" style={{ fontSize:".7rem", padding:".35rem .8rem", whiteSpace:"nowrap" }}
              onClick={()=>{ setView("form"); setSelected(null); }}>+ Nueva causa</button>
          </div>
          <div style={{ display:"flex", gap:".45rem" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ROL, empresa, liquidador…"
              style={{ flex:1, minWidth:0, fontSize:".73rem", padding:".3rem .55rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}/>
            <select value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}
              style={{ fontSize:".71rem", padding:".3rem .5rem", border:"1px solid var(--b1)", borderRadius:7, background:"var(--s2)", color:"var(--fgp)" }}>
              <option value="activas">Activas</option>
              <option value="todas">Todas</option>
              <option value="completadas">Completadas</option>
              <option value="suspendida">Suspendidas</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding:".4rem .9rem", display:"flex", gap:".28rem", flexWrap:"wrap", borderBottom:"1px solid var(--b1)", flexShrink:0 }}>
          {["notificada","aceptada","acta_recibida","bienes_recepcionados","bases_enviadas","publicaciones_ok","fecha_aprobada","en_remate"].map(est=>{
            const n=causas.filter(c=>c.estado===est||(est==="bases_enviadas"&&c.estado==="fecha_solicitada")).length;
            if (!n) return null;
            const e=ESTADO_MAP[est];
            return <span key={est} style={{ fontSize:".61rem", fontWeight:700, color:e.color, background:e.bg, border:`1px solid ${e.color}33`, borderRadius:20, padding:".09rem .42rem" }}>{e.short} {n}</span>;
          })}
          {!causas.length && <span style={{ fontSize:".7rem", color:"var(--mu)" }}>Sin causas aún</span>}
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtradas.length===0 && (
            <div style={{ padding:"3rem 1.5rem", textAlign:"center", color:"var(--mu)", fontSize:".78rem" }}>
              {causas.length===0?<><div style={{ fontSize:"1.5rem",marginBottom:".4rem" }}>📋</div><div>Sin causas. Creá la primera o importá el Excel.</div></>:"Sin resultados."}
            </div>
          )}
          {filtradas.map(c=>{
            const e  = ESTADO_MAP[c.estado]||ESTADOS[0];
            const ac = VICTOR_ACCION[c.estado];
            const isSel = selected===c.id;
            // mini-checklist progreso
            const checks = [c.designacion_martillero,c.aviso_entrega,c.acta_recepcion_ok,c.bases_enviadas===true||(c.estado&&["bases_enviadas","publicaciones_ok","fecha_aprobada","en_remate","completada"].includes(c.estado)),c.aviso_diario,c.aviso_boletin_concursal].filter(Boolean).length;
            return (
              <div key={c.id} onClick={()=>{ setSelected(c.id); setView("lista"); setAsignandoRemate(false); setEditingBasesNotas(false); }}
                style={{ padding:".65rem 1rem", cursor:"pointer", borderBottom:"1px solid var(--b1)",
                  background: isSel?"var(--ac-bg,#ecfeff)":"transparent",
                  borderLeft: isSel?"3px solid var(--ac)":"3px solid transparent" }}>
                {/* Fila 1: ROL + badge + tipo */}
                <div style={{ display:"flex", alignItems:"center", gap:".45rem", marginBottom:".18rem" }}>
                  <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:".8rem", color:"var(--fgp)" }}>{c.rol}</span>
                  <Badge estado={c.estado}/>
                  <span style={{ marginLeft:"auto", fontSize:".6rem", color:"var(--mu)", background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:10, padding:".08rem .38rem" }}>{c.tipo}</span>
                </div>
                {/* Fila 2: empresa + liquidador */}
                <div style={{ fontSize:".71rem", color:"var(--fgs)", fontWeight:600, marginBottom:".12rem" }}>{c.empresa_deudora||"—"}</div>
                <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                  {c.liquidador && <span style={{ fontSize:".65rem", color:"var(--mu)" }}>{c.liquidador}</span>}
                  {c.minimo && <span style={{ marginLeft:"auto", fontSize:".65rem", fontFamily:"monospace", color:"var(--fgs)" }}>{c.minimo}</span>}
                </div>
                {/* Fila 3: mini checklist + próxima acción */}
                <div style={{ display:"flex", alignItems:"center", gap:".35rem", marginTop:".25rem" }}>
                  <div style={{ display:"flex", gap:".15rem" }}>
                    {["J","K","L","B","N","O"].map((col,i)=>{
                      const done = [c.designacion_martillero,c.aviso_entrega,c.acta_recepcion_ok,
                        c.bases_enviadas||["bases_enviadas","publicaciones_ok","fecha_aprobada","en_remate","completada"].includes(c.estado),
                        c.aviso_diario,c.aviso_boletin_concursal][i];
                      return <div key={col} title={["Designación","Aviso entrega","Acta recepción","Bases","Aviso diario","Boletín"][i]} style={{ width:12,height:12,borderRadius:2,background:done?"#10b981":"var(--b1)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        {done&&<span style={{ color:"#fff",fontSize:".45rem",fontWeight:900 }}>✓</span>}
                      </div>;
                    })}
                  </div>
                  {ac && <div style={{ fontSize:".64rem", color:e.color, fontWeight:700, marginLeft:"auto" }}>→ {ac.label}</div>}
                  {c.fecha_remate && <div style={{ fontSize:".64rem", color:"#10b981", fontWeight:700, marginLeft:"auto" }}>📅 {fmt(c.fecha_remate)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Form nueva causa ────────────────────────────────────── */}
      {view==="form" && (
        <div style={{ flex:1, overflowY:"auto", padding:"1.1rem 1.3rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".7rem", marginBottom:"1.1rem" }}>
            <button onClick={()=>setView("lista")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--mu)",fontSize:".78rem" }}>← Volver</button>
            <div style={{ fontSize:".95rem", fontWeight:800, color:"var(--fgp)" }}>Nueva causa</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".7rem", maxWidth:580 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>ROL *</label>
              <input className="fi" placeholder="C-380-2024" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))} style={{ width:"100%",fontFamily:"monospace",fontWeight:800 }}/>
            </div>
            <div>
              <label style={lbl}>Tipo</label>
              <select className="fi" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={{ width:"100%" }}>
                <option value="concursal">Concursal</option><option value="judicial">Judicial</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Comisión %</label>
              <input className="fi" type="number" value={form.comision_pct} onChange={e=>setForm(p=>({...p,comision_pct:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Deudor (empresa/persona)</label>
              <input className="fi" placeholder="Agrícola Dalcahue SPA" value={form.empresa_deudora} onChange={e=>setForm(p=>({...p,empresa_deudora:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Liquidador</label>
              <input className="fi" value={form.liquidador} onChange={e=>setForm(p=>({...p,liquidador:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Juzgado / Tribunal</label>
              <input className="fi" placeholder="2° Juzgado Civil de Rancagua" value={form.tribunal} onChange={e=>setForm(p=>({...p,tribunal:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Especies / Bienes</label>
              <textarea className="fi" rows={3} placeholder="Automóvil marca Peugeot, modelo 307…" value={form.bienes_descripcion} onChange={e=>setForm(p=>({...p,bienes_descripcion:e.target.value}))} style={{ width:"100%",resize:"vertical" }}/>
            </div>
            <div>
              <label style={lbl}>Mínimo</label>
              <input className="fi" placeholder="$1.500.000 / M/P / pendiente" value={form.minimo} onChange={e=>setForm(p=>({...p,minimo:e.target.value}))} style={{ width:"100%" }}/>
            </div>
            <div>
              <label style={lbl}>Notas</label>
              <input className="fi" value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} style={{ width:"100%" }}/>
            </div>
          </div>
          <div style={{ marginTop:"1.1rem", display:"flex", gap:".6rem" }}>
            <button className="btn-primary" onClick={handleGuardar} disabled={saving}>{saving?"Guardando…":"Registrar causa"}</button>
            <button onClick={()=>setView("lista")} style={btnSec}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Importar Excel ──────────────────────────────────────── */}
      {view==="excel" && (
        <div style={{ flex:1, overflowY:"auto", padding:"1.1rem 1.3rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".7rem", marginBottom:".9rem" }}>
            <button onClick={()=>setView("lista")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--mu)",fontSize:".78rem" }}>← Volver</button>
            <div style={{ fontSize:".95rem", fontWeight:800, color:"var(--fgp)" }}>Importar desde Excel</div>
          </div>
          <div style={{ fontSize:".76rem", color:"var(--mu)", marginBottom:".9rem" }}>
            {excelRows.length} filas detectadas. Seleccioná las que querés importar.
          </div>
          <div style={{ overflowX:"auto", border:"1px solid var(--b1)", borderRadius:10, marginBottom:".9rem" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".7rem" }}>
              <thead>
                <tr style={{ background:"var(--s2)" }}>
                  <th style={thSt}>
                    <input type="checkbox" checked={excelSel.size===excelRows.filter(r=>!r.error).length&&excelRows.filter(r=>!r.error).length>0}
                      onChange={e=>{ if(e.target.checked) setExcelSel(new Set(excelRows.filter(r=>!r.error).map((_,i)=>i))); else setExcelSel(new Set()); }}/>
                  </th>
                  {["ROL (F)","Tipo (B)","Liquidador (D)","Deudor (E)","Juzgado (G)","Especies (H)","Mínimo (I)","Fecha Remate (P)"].map(h=><th key={h} style={thSt}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {excelRows.map((r,i)=>(
                  <tr key={i} style={{ background:r.error?"#fef2f2":"transparent" }}>
                    <td style={tdSt}>
                      {r.error?<span style={{ fontSize:".62rem",color:"#ef4444" }}>✕ {r.error}</span>
                        :<input type="checkbox" checked={excelSel.has(i)} onChange={e=>{ const ns=new Set(excelSel); e.target.checked?ns.add(i):ns.delete(i); setExcelSel(ns); }}/>}
                    </td>
                    <td style={{ ...tdSt, fontFamily:"monospace",fontWeight:700 }}>{r.rol||"—"}</td>
                    <td style={tdSt}><span style={{ fontSize:".61rem",background:r.tipo==="judicial"?"#eff6ff":"#f5f3ff",color:r.tipo==="judicial"?"#3b82f6":"#8b5cf6",borderRadius:10,padding:".08rem .38rem",fontWeight:700 }}>{r.tipo}</span></td>
                    <td style={{ ...tdSt, maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.liquidador||"—"}</td>
                    <td style={{ ...tdSt, maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.empresa_deudora||"—"}</td>
                    <td style={{ ...tdSt, maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.tribunal||"—"}</td>
                    <td style={{ ...tdSt, maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.bienes_descripcion||"—"}</td>
                    <td style={{ ...tdSt, fontFamily:"monospace" }}>{r.minimo||"—"}</td>
                    <td style={tdSt}>{r.fecha_remate||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:"flex", gap:".6rem" }}>
            <button className="btn-primary" onClick={importarCausas} disabled={excelSaving||!excelSel.size}>
              {excelSaving?"Importando…":`Importar ${excelSel.size} causa${excelSel.size!==1?"s":""}`}
            </button>
            <button onClick={()=>setView("lista")} style={btnSec}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── DETALLE ─────────────────────────────────────────────── */}
      {causelected && view==="lista" && (
        <div style={{ flex:1, overflowY:"auto" }}>

          {/* Topbar */}
          <div style={{ padding:".85rem 1.2rem", borderBottom:"1px solid var(--b1)", display:"flex", alignItems:"flex-start", gap:".6rem" }}>
            <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--mu)",fontSize:".76rem",marginTop:2,flexShrink:0 }}>←</button>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" }}>
                <span style={{ fontFamily:"monospace",fontWeight:900,fontSize:"1.05rem",color:"var(--fgp)" }}>{causelected.rol}</span>
                <Badge estado={causelected.estado}/>
                <span style={{ fontSize:".64rem",color:"var(--mu)",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,padding:".08rem .38rem" }}>{causelected.tipo}</span>
              </div>
              <div style={{ fontSize:".76rem",color:"var(--fgs)",marginTop:".15rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {causelected.empresa_deudora||"Sin empresa"}{causelected.liquidador&&` — ${causelected.liquidador}`}
              </div>
            </div>
          </div>

          <div style={{ padding:".9rem 1.2rem", display:"flex", flexDirection:"column", gap:".8rem" }}>

            {/* ══ QUÉ HACER AHORA (Victor) ══════════════════════ */}
            {accion && !["suspendida","en_remate","completada"].includes(causelected.estado) && (
              <div style={{ background:"#f0fdf4", border:"2px solid #4ade80", borderRadius:13, padding:"1rem 1.2rem" }}>
                <div style={{ fontSize:".63rem",fontWeight:800,color:"#059669",textTransform:"uppercase",letterSpacing:".09em",marginBottom:".4rem" }}>
                  Paso {Math.max(1,FLUJO.indexOf(causelected.estado)+1)} de {FLUJO.length-1} — ¿Qué hago ahora?
                </div>
                <div style={{ fontSize:".92rem",fontWeight:800,color:"#064e3b",marginBottom:".3rem" }}>{accion.label}</div>
                <div style={{ fontSize:".74rem",color:"#065f46",marginBottom:".8rem",lineHeight:1.5 }}>{accion.desc}</div>
                {accion.needsActa
                  ? <ActaBlock causa={causelected} uploading={uploadingActa} saving={saving} onUpload={subirActa}/>
                  : <button onClick={()=>avanzarEstado(causelected)} disabled={saving}
                      style={{ display:"block",width:"100%",padding:".65rem",background:"#10b981",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:".86rem",cursor:saving?"not-allowed":"pointer",opacity:saving?.7:1 }}>
                      {saving?"Guardando…":`✓ Marcar como: ${ESTADO_MAP[accion.next]?.label}`}
                    </button>
                }
              </div>
            )}

            {/* suspendida / completada banner */}
            {causelected.estado==="suspendida" && (
              <div style={{ background:"#fef2f2",border:"2px solid #fca5a5",borderRadius:13,padding:".9rem 1.1rem" }}>
                <div style={{ fontSize:".88rem",fontWeight:800,color:"#b91c1c" }}>⚠ Causa suspendida</div>
              </div>
            )}
            {(causelected.estado==="en_remate"||causelected.estado==="completada") && (
              <div style={{ background:"#eff6ff",border:"2px solid #93c5fd",borderRadius:13,padding:".9rem 1.1rem" }}>
                <div style={{ fontSize:".88rem",fontWeight:800,color:"#1d4ed8" }}>{causelected.estado==="completada"?"✅ Completada":"🔨 En remate"}</div>
              </div>
            )}

            {/* ══ CHECKLIST (columnas J,K,L,M,N,O,P del xlsx) ═══ */}
            <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:".9rem 1.1rem" }}>
              <div style={secTit}>Trámites del cronograma</div>

              {/* J: Designación Martillero */}
              <CheckItem label="Designación martillero" sublabel="Columna J — el tribunal designa al martillero"
                checked={!!causelected.designacion_martillero}
                onChange={()=>toggleCheck(causelected,"designacion_martillero",!causelected.designacion_martillero)}/>

              {/* K: Aviso de Entrega */}
              <CheckItem label="Aviso de entrega" sublabel="Columna K — notificación al deudor sobre entrega"
                checked={!!causelected.aviso_entrega}
                onChange={()=>toggleCheck(causelected,"aviso_entrega",!causelected.aviso_entrega)}/>

              {/* L: Acta de Recepción */}
              <CheckItem label="Acta de recepción" sublabel="Columna L — acta firmada recibida (subir archivo abajo)"
                checked={!!causelected.acta_recepcion_ok}
                onChange={()=>toggleCheck(causelected,"acta_recepcion_ok",!causelected.acta_recepcion_ok)}/>

              {/* M: Bases y Propuestas / Hora y Fecha */}
              <div style={{ background: causelected.bases_notas?"#fefce8":causelected.bases_fecha?"#f0fdf4":"var(--s2)",
                border:`1px solid ${causelected.bases_notas?"#fde047":causelected.bases_fecha?"#a7f3d0":"var(--b1)"}`,
                borderRadius:8, padding:".55rem .7rem", marginBottom:".35rem" }}>
                <div style={{ fontSize:".76rem",fontWeight:700,color:"var(--fgp)",marginBottom:".4rem" }}>Bases y propuestas — Hora y Fecha <span style={{ fontSize:".6rem",color:"var(--mu)",fontWeight:400 }}>Columna M</span></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".5rem .6rem", marginBottom:".4rem" }}>
                  <div>
                    <label style={lbl}>Fecha propuesta</label>
                    <input type="date" value={causelected.bases_fecha||""} className="fi"
                      onChange={e=>toggleCheck(causelected,"bases_fecha",e.target.value||null)}
                      style={{ width:"100%",fontSize:".73rem",padding:".28rem .5rem" }}/>
                  </div>
                  <div>
                    <label style={lbl}>Hora propuesta</label>
                    <input type="time" value={causelected.bases_hora||""} className="fi"
                      onChange={e=>toggleCheck(causelected,"bases_hora",e.target.value||null)}
                      style={{ width:"100%",fontSize:".73rem",padding:".28rem .5rem" }}/>
                  </div>
                </div>
                {editingBasesNotas ? (
                  <div>
                    <textarea value={basesNotasVal} onChange={e=>setBasesNotasVal(e.target.value)} rows={3}
                      style={{ width:"100%",fontSize:".73rem",padding:".35rem .5rem",border:"1px solid var(--b1)",borderRadius:7,background:"var(--s2)",color:"var(--fgp)",resize:"vertical" }}
                      placeholder="Notas de estado (ej: Aún no se resuelve causa, en Corte de Apelaciones…)"/>
                    <div style={{ display:"flex",gap:".4rem",marginTop:".4rem" }}>
                      <button className="btn-primary" style={{ fontSize:".7rem" }} onClick={()=>guardarBasesNotas(causelected)}>Guardar</button>
                      <button style={{ ...btnSec,fontSize:".7rem" }} onClick={()=>setEditingBasesNotas(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={()=>{ setEditingBasesNotas(true); setBasesNotasVal(causelected.bases_notas||""); }}
                    style={{ fontSize:".73rem",color:causelected.bases_notas?"var(--fgp)":"var(--mu)",cursor:"pointer",padding:".3rem .4rem",borderRadius:6,border:"1px dashed var(--b1)",background:"rgba(255,255,255,.5)",minHeight:32 }}>
                    {causelected.bases_notas||<span style={{ fontStyle:"italic" }}>Clic para agregar notas de columna M…</span>}
                  </div>
                )}
              </div>

              {/* N: Aviso en el Diario */}
              <CheckItem label="Aviso en el diario" sublabel="Columna N — publicación en diario de circulación nacional"
                checked={!!causelected.aviso_diario}
                onChange={()=>toggleCheck(causelected,"aviso_diario",!causelected.aviso_diario)}/>

              {/* O: Boletín Concursal */}
              <CheckItem label="Aviso en boletín concursal" sublabel="Columna O — publicación en boletín concursal"
                checked={!!causelected.aviso_boletin_concursal}
                onChange={()=>toggleCheck(causelected,"aviso_boletin_concursal",!causelected.aviso_boletin_concursal)}/>

              {/* P: Fecha de Remate */}
              <div style={{ marginTop:".25rem", padding:".55rem .7rem", borderRadius:8, border:`1px solid ${causelected.fecha_remate?"#4ade80":"var(--b1)"}`, background:causelected.fecha_remate?"#f0fdf4":"var(--s2)" }}>
                <div style={{ fontSize:".74rem",fontWeight:700,color:"var(--fgp)",marginBottom:".35rem" }}>
                  📅 Fecha de remate <span style={{ fontSize:".6rem",color:"var(--mu)",fontWeight:400 }}>Columna P</span>
                  {causelected.fecha_remate&&<span style={{ marginLeft:".4rem",fontWeight:400,color:"#059669" }}>— {fmt(causelected.fecha_remate)}</span>}
                </div>
                <input type="date" value={causelected.fecha_remate||""} className="fi"
                  onChange={e=>guardarFechaRemate(causelected,e.target.value||null)}
                  style={{ width:"100%",fontSize:".73rem",padding:".3rem .5rem" }}/>
              </div>
            </div>

            {/* ══ Acta de recepción (archivo) ═══════════════════ */}
            <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:".9rem 1.1rem" }}>
              <div style={secTit}>Acta de entrega (archivo)</div>
              {causelected.acta_url?(
                <div style={{ display:"flex",alignItems:"center",gap:".65rem" }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:".72rem",fontWeight:700,color:"#10b981" }}>✓ Archivo adjunto</div>
                    <div style={{ fontSize:".65rem",color:"var(--mu)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{causelected.acta_nombre}</div>
                  </div>
                  <a href={causelected.acta_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:".69rem",color:"var(--ac)",textDecoration:"none",border:"1px solid var(--ac)",borderRadius:7,padding:".26rem .6rem",fontWeight:700,whiteSpace:"nowrap" }}>Ver acta</a>
                  <button onClick={()=>actaRef.current?.click()} style={{ ...btnSec,fontSize:".69rem",padding:".26rem .6rem",whiteSpace:"nowrap" }}>{uploadingActa?"Subiendo…":"Reemplazar"}</button>
                </div>
              ):(
                <button onClick={()=>actaRef.current?.click()}
                  style={{ display:"block",width:"100%",padding:".55rem",border:"1.5px dashed var(--b2)",borderRadius:8,background:"transparent",color:"var(--mu)",fontSize:".76rem",cursor:"pointer",fontWeight:600 }}>
                  {uploadingActa?"Subiendo…":"📎 Subir acta (PDF o Word)"}
                </button>
              )}
              <input ref={actaRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
                onChange={e=>{ if(e.target.files[0]) subirActa(causelected,e.target.files[0]); e.target.value=""; }}/>
            </div>

            {/* ══ Operaciones Maxi ══════════════════════════════ */}
            {(ACTIVAS.includes(causelected.estado)||causelected.lote_id) && (
              <div style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:".9rem 1.1rem" }}>
                <div style={secTit}>Operaciones — lotes y remates</div>
                {["bienes_recepcionados","bases_enviadas","publicaciones_ok","fecha_aprobada","fecha_solicitada"].includes(causelected.estado)&&!causelected.lote_id&&(
                  <button onClick={()=>crearLote(causelected)} disabled={saving}
                    style={{ display:"block",width:"100%",padding:".48rem",border:"1.5px solid #10b981",borderRadius:8,background:"#ecfdf5",color:"#059669",fontWeight:700,fontSize:".76rem",cursor:"pointer",textAlign:"center",marginBottom:".45rem" }}>
                    {saving?"Creando…":"📦 Crear lote desde esta causa"}
                  </button>
                )}
                {causelected.lote_id&&causelected.estado!=="fecha_aprobada"&&(
                  <div style={{ background:"#f0fdf4",border:"1px solid #a7f3d0",borderRadius:8,padding:".5rem .8rem",fontSize:".72rem",color:"#065f46",fontWeight:600,marginBottom:causelected.estado==="fecha_aprobada"?".45rem":0 }}>
                    ✓ Lote creado{causelected.estado==="en_remate"?" y asignado a remate":""}
                  </div>
                )}
                {causelected.estado==="fecha_aprobada"&&causelected.lote_id&&(
                  !asignandoRemate?(
                    <button onClick={()=>setAsignandoRemate(true)}
                      style={{ display:"block",width:"100%",padding:".48rem",border:"1.5px solid #0891b2",borderRadius:8,background:"#ecfeff",color:"#0891b2",fontWeight:700,fontSize:".76rem",cursor:"pointer",textAlign:"center" }}>
                      📋 Asignar lote a remate
                    </button>
                  ):(
                    <div style={{ display:"flex",gap:".45rem",flexWrap:"wrap" }}>
                      <select value={remateSelId} onChange={e=>setRemateSelId(e.target.value)}
                        style={{ flex:1,minWidth:130,fontSize:".73rem",padding:".35rem .5rem",border:"1px solid var(--b1)",borderRadius:7,background:"var(--s2)",color:"var(--fgp)" }}>
                        <option value="">— Seleccionar remate —</option>
                        {rematesFuturos.map(r=><option key={r.id} value={r.id}>{r.nombre} · {fmt(r.fecha)}</option>)}
                      </select>
                      <button className="btn-primary" onClick={()=>asignarRemate(causelected)} disabled={saving||!remateSelId}>{saving?"…":"Asignar"}</button>
                      <button onClick={()=>{ setAsignandoRemate(false); setRemateSelId(""); }} style={btnSec}>✕</button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* ══ Info básica (colapsable) ══════════════════════ */}
            <details style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12 }}>
              <summary style={{ padding:".85rem 1.1rem",cursor:"pointer",fontSize:".76rem",fontWeight:700,color:"var(--fgp)",userSelect:"none",listStyle:"none" }}>
                ▶ Datos de la causa
              </summary>
              <div style={{ padding:".4rem 1.1rem .9rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:".45rem .7rem" }}>
                {[
                  ["Juzgado",       causelected.tribunal],
                  ["Liquidador",    causelected.liquidador],
                  ["Mínimo",        causelected.minimo],
                  ["Comisión",      causelected.comision_pct?`${causelected.comision_pct}%`:null],
                  ["Notificado",    fmt(causelected.fecha_notificacion)],
                  ["Aceptado",      fmt(causelected.fecha_aceptacion)],
                  ["Acta recibida", fmt(causelected.fecha_recepcion_acta)],
                  ["Bienes llegaron",fmt(causelected.fecha_recepcion_bienes)],
                  ["Bases enviadas",fmt(causelected.fecha_solicitud_remate)],
                  ["Fecha aprobada",fmt(causelected.fecha_aprobacion_remate)],
                ].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k}>
                    <div style={{ fontSize:".61rem",color:"var(--mu)",fontWeight:700,textTransform:"uppercase" }}>{k}</div>
                    <div style={{ fontSize:".73rem",color:"var(--fgp)",fontWeight:600 }}>{v}</div>
                  </div>
                ))}
                {causelected.bienes_descripcion&&(
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ fontSize:".61rem",color:"var(--mu)",fontWeight:700,textTransform:"uppercase" }}>Bienes / Especies</div>
                    <div style={{ fontSize:".73rem",color:"var(--fgp)" }}>{causelected.bienes_descripcion}</div>
                  </div>
                )}
                {causelected.notas&&(
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ fontSize:".61rem",color:"var(--mu)",fontWeight:700,textTransform:"uppercase" }}>Notas</div>
                    <div style={{ fontSize:".71rem",color:"var(--fgs)",fontStyle:"italic" }}>{causelected.notas}</div>
                  </div>
                )}
              </div>
            </details>

            {/* Suspender */}
            {!["completada","suspendida","en_remate"].includes(causelected.estado)&&(
              <button onClick={()=>suspender(causelected)}
                style={{ background:"none",border:"1px solid #fca5a5",borderRadius:8,padding:".38rem",cursor:"pointer",fontSize:".71rem",color:"#b91c1c",fontWeight:600,textAlign:"center" }}>
                Marcar como suspendida
              </button>
            )}
          </div>
        </div>
      )}

      {/* Placeholder */}
      {!causelected&&view==="lista"&&filtradas.length>0&&(
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--mu)",fontSize:".78rem" }}>
          Seleccioná una causa para ver el detalle
        </div>
      )}
    </div>
  );
}

/* ── Sub-componente: subir acta y avanzar ─────────────────────── */
function ActaBlock({ causa, uploading, saving, onUpload }) {
  const [file, setFile] = useState(null);
  const ref = useRef();
  return (
    <div>
      {file?(
        <div style={{ marginBottom:".6rem",background:"#f0fdf4",border:"1px solid #a7f3d0",borderRadius:8,padding:".42rem .7rem",display:"flex",alignItems:"center",gap:".5rem" }}>
          <span style={{ flex:1,fontSize:".72rem",fontWeight:700,color:"#065f46",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>📎 {file.name}</span>
          <button onClick={()=>setFile(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:".75rem",flexShrink:0 }}>✕</button>
        </div>
      ):(
        <button onClick={()=>ref.current?.click()}
          style={{ display:"block",width:"100%",padding:".5rem",marginBottom:".6rem",border:"1.5px dashed #4ade80",borderRadius:8,background:"transparent",color:"#059669",fontWeight:700,fontSize:".78rem",cursor:"pointer" }}>
          📎 Seleccionar archivo (PDF o Word)
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
        onChange={e=>{ if(e.target.files[0]) setFile(e.target.files[0]); e.target.value=""; }}/>
      <button onClick={()=>onUpload(causa,file,true)} disabled={uploading||saving||!file}
        style={{ display:"block",width:"100%",padding:".65rem",background:file?"#10b981":"#d1fae5",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:".86rem",cursor:file&&!uploading&&!saving?"pointer":"not-allowed",opacity:!file?.5:1 }}>
        {uploading?"Subiendo acta…":"📎 Subir acta y continuar →"}
      </button>
      {causa?.acta_url&&<div style={{ marginTop:".4rem",fontSize:".66rem",color:"#059669",textAlign:"center" }}>✓ Ya hay un acta — esta la reemplaza</div>}
    </div>
  );
}

/* ── Estilos tabla ────────────────────────────────────────────── */
const thSt = { padding:".42rem .6rem", textAlign:"left", fontWeight:700, color:"var(--mu)", borderBottom:"1px solid var(--b1)", whiteSpace:"nowrap", fontSize:".68rem" };
const tdSt = { padding:".38rem .6rem", borderBottom:"1px solid var(--b1)" };
