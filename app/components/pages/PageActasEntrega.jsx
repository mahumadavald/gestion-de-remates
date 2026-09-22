'use client'
import React, { useState, useMemo } from "react";

const ESTADOS = {
  pendiente:       { label: "Por Llegar",       color: "#f59e0b", bg: "#fef3c7" },
  por_recepcionar: { label: "Por Recepcionar",  color: "#3b82f6", bg: "#dbeafe" },
  recepcionada:    { label: "Recepcionada",      color: "#10b981", bg: "#d1fae5" },
  enviada_victor:  { label: "Enviada a Víctor",  color: "#8b5cf6", bg: "#ede9fe" },
};

const FLUJO = ["pendiente","por_recepcionar","recepcionada","enviada_victor"];

const TIPOS_BIEN = ["Bien Mueble","Bien Inmueble","Vehículo","Efectivo","Documento","Otro"];

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

const BIEN_VACIO = { tipo:"Bien Mueble", cantidad:1, descripcion:"", estado:"Bueno" };

const FORM_VACIO = {
  rol_causa:"", juzgado:"", fecha_resolucion:"", fecha_entrega_esperada:"",
  deudor_nombre:"", deudor_rut:"", deudor_telefono:"", deudor_email:"",
  deudor_profesion:"", deudor_empleador:"", deudor_remuneracion:"",
  liquidador_nombre:"", liquidador_email:"",
  bienes: [{ ...BIEN_VACIO }],
  doc_cedula:false, doc_afp:false, doc_boleta_honorarios:false,
  doc_anotaciones_vigentes:false, doc_liquidaciones_sueldo:false,
  doc_contrato_trabajo:false, doc_carpeta_tributaria:false, doc_otros:"",
  bodega_id:"", notas:"", direccion_entrega:"",
};

export default function PageActasEntrega({ session, supabase, dbActas, setDbActas, dbBodegas, notify }) {
  const [tab, setTab]         = useState("pendiente");
  const [filtBodega, setFiltBodega] = useState("all");
  const [modal, setModal]     = useState(null);   // null | "nueva" | {acta}
  const [form, setForm]       = useState({ ...FORM_VACIO });
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");
  const [confirm, setConfirm] = useState(null);   // { acta, action }

  const isBodegaAdmin = session?.roles?.includes("administrador bodega");
  const bodegasFiltradas = isBodegaAdmin
    ? dbBodegas.filter(b => b.id === session?.bodegaId)
    : dbBodegas;

  // ── Filtros ────────────────────────────────────────────────────────
  const actasFiltradas = useMemo(() => {
    let lista = dbActas;
    if (isBodegaAdmin && session?.bodegaId)
      lista = lista.filter(a => a.bodega_id === session.bodegaId);
    if (filtBodega !== "all")
      lista = lista.filter(a => a.bodega_id === filtBodega);
    if (search.trim())
      lista = lista.filter(a =>
        a.rol_causa?.toLowerCase().includes(search.toLowerCase()) ||
        a.deudor_nombre?.toLowerCase().includes(search.toLowerCase()) ||
        a.liquidador_nombre?.toLowerCase().includes(search.toLowerCase())
      );
    if (tab !== "todas")
      lista = lista.filter(a => a.estado === tab);
    return lista.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }, [dbActas, tab, filtBodega, search, isBodegaAdmin, session]);

  // ── Contadores de badge ─────────────────────────────────────────
  const counts = useMemo(() => {
    let base = isBodegaAdmin && session?.bodegaId
      ? dbActas.filter(a => a.bodega_id === session.bodegaId)
      : dbActas;
    return {
      pendiente:       base.filter(a=>a.estado==="pendiente").length,
      por_recepcionar: base.filter(a=>a.estado==="por_recepcionar").length,
      recepcionada:    base.filter(a=>a.estado==="recepcionada").length,
      enviada_victor:  base.filter(a=>a.estado==="enviada_victor").length,
      todas:           base.length,
    };
  }, [dbActas, isBodegaAdmin, session]);

  // ── Helpers form ────────────────────────────────────────────────
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setBien = (i, k, v) => setForm(p => {
    const bienes = [...p.bienes];
    bienes[i] = { ...bienes[i], [k]: v };
    return { ...p, bienes };
  });
  const addBien  = () => setForm(p => ({ ...p, bienes: [...p.bienes, { ...BIEN_VACIO }] }));
  const removeBien = i => setForm(p => ({ ...p, bienes: p.bienes.filter((_,j)=>j!==i) }));

  const abrirNueva = () => {
    setForm({ ...FORM_VACIO, bodega_id: isBodegaAdmin && session?.bodegaId ? session.bodegaId : "" });
    setModal("nueva");
  };

  const abrirDetalle = (acta) => {
    setForm({
      ...FORM_VACIO,
      ...acta,
      bienes: acta.bienes?.length ? acta.bienes : [{ ...BIEN_VACIO }],
      fecha_resolucion:      acta.fecha_resolucion || "",
      fecha_entrega_esperada: acta.fecha_entrega_esperada || "",
      deudor_remuneracion:   acta.deudor_remuneracion ? String(acta.deudor_remuneracion) : "",
    });
    setModal(acta);
  };

  // ── Guardar / Crear ─────────────────────────────────────────────
  const guardar = async () => {
    if (!form.rol_causa?.trim())     { notify("Ingresa el Rol Causa.", "inf"); return; }
    if (!form.deudor_nombre?.trim()) { notify("Ingresa el nombre del deudor.", "inf"); return; }
    if (!form.bodega_id)             { notify("Asigna una bodega.", "inf"); return; }
    setSaving(true);
    const payload = {
      casa_id:                session?.casaId || null,
      bodega_id:              form.bodega_id,
      rol_causa:              form.rol_causa.trim().toUpperCase(),
      juzgado:                form.juzgado?.trim() || null,
      fecha_resolucion:       form.fecha_resolucion || null,
      fecha_entrega_esperada: form.fecha_entrega_esperada || null,
      deudor_nombre:          form.deudor_nombre.trim().toUpperCase(),
      deudor_rut:             form.deudor_rut?.trim() || null,
      deudor_telefono:        form.deudor_telefono?.trim() || null,
      deudor_email:           form.deudor_email?.trim() || null,
      deudor_profesion:       form.deudor_profesion?.trim() || null,
      deudor_empleador:       form.deudor_empleador?.trim() || null,
      deudor_remuneracion:    form.deudor_remuneracion ? parseInt(String(form.deudor_remuneracion).replace(/\D/g,"")) : null,
      liquidador_nombre:      form.liquidador_nombre?.trim() || null,
      liquidador_email:       form.liquidador_email?.trim() || null,
      bienes:                 form.bienes.filter(b=>b.descripcion?.trim()),
      doc_cedula:             form.doc_cedula || false,
      doc_afp:                form.doc_afp || false,
      doc_boleta_honorarios:  form.doc_boleta_honorarios || false,
      doc_anotaciones_vigentes: form.doc_anotaciones_vigentes || false,
      doc_liquidaciones_sueldo: form.doc_liquidaciones_sueldo || false,
      doc_contrato_trabajo:   form.doc_contrato_trabajo || false,
      doc_carpeta_tributaria: form.doc_carpeta_tributaria || false,
      doc_otros:              form.doc_otros?.trim() || null,
      direccion_entrega:      form.direccion_entrega?.trim() || null,
      notas:                  form.notas?.trim() || null,
    };

    if (modal === "nueva") {
      const { data, error } = await supabase.from("actas_entrega").insert({ ...payload, estado:"pendiente" }).select().single();
      if (error) { notify("Error: " + error.message, "inf"); setSaving(false); return; }
      setDbActas(p => [data, ...p]);
      notify("Acta creada.", "sold");
    } else {
      const { error } = await supabase.from("actas_entrega").update(payload).eq("id", modal.id);
      if (error) { notify("Error: " + error.message, "inf"); setSaving(false); return; }
      setDbActas(p => p.map(a => a.id === modal.id ? { ...a, ...payload } : a));
      notify("Acta actualizada.", "sold");
    }
    setSaving(false);
    setModal(null);
  };

  // ── Avanzar estado ────────────────────────────────────────────────
  const avanzarEstado = async (acta, nuevoEstado) => {
    const ahora = new Date().toISOString();
    const update = { estado: nuevoEstado };
    if (nuevoEstado === "recepcionada") {
      update.fecha_recepcion    = ahora;
      update.recepcionado_por   = session?.name || session?.usuario || "—";
    }
    if (nuevoEstado === "enviada_victor") {
      update.fecha_enviada_victor = ahora;
    }
    const { error } = await supabase.from("actas_entrega").update(update).eq("id", acta.id);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbActas(p => p.map(a => a.id === acta.id ? { ...a, ...update } : a));
    notify(`Acta marcada como "${ESTADOS[nuevoEstado].label}".`, "sold");
    setConfirm(null);
  };

  const retrocederEstado = async (acta) => {
    const idx = FLUJO.indexOf(acta.estado);
    if (idx <= 0) return;
    const prev = FLUJO[idx - 1];
    const update = { estado: prev };
    if (prev !== "recepcionada") update.fecha_recepcion    = null;
    if (prev !== "enviada_victor") update.fecha_enviada_victor = null;
    const { error } = await supabase.from("actas_entrega").update(update).eq("id", acta.id);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbActas(p => p.map(a => a.id === acta.id ? { ...a, ...update } : a));
    notify("Estado revertido.", "sold");
  };

  const eliminar = async (acta) => {
    const { error } = await supabase.from("actas_entrega").delete().eq("id", acta.id);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbActas(p => p.filter(a => a.id !== acta.id));
    notify("Acta eliminada.", "inf");
    setConfirm(null);
    if (modal && modal.id === acta.id) setModal(null);
  };

  const bodegaNombre = (id) => dbBodegas.find(b=>b.id===id)?.nombre || "Sin asignar";

  // ── Siguiente acción del flujo ────────────────────────────────────
  const nextAction = (acta) => {
    const actions = {
      pendiente:       { label:"Marcar 'Por Recepcionar'", estado:"por_recepcionar", color:"#3b82f6" },
      por_recepcionar: { label:"Recepcionar Bienes",       estado:"recepcionada",    color:"#10b981" },
      recepcionada:    { label:"Enviar a Víctor",          estado:"enviada_victor",  color:"#8b5cf6" },
      enviada_victor:  null,
    };
    return actions[acta.estado];
  };

  // ── Render badge tab ──────────────────────────────────────────────
  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding:"6px 14px", borderRadius:20, fontSize:".78rem", fontWeight:600, cursor:"pointer",
        border: tab===id ? "none" : "1px solid var(--b1)",
        background: tab===id ? (ESTADOS[id]?.bg || "var(--ac)") : "transparent",
        color: tab===id ? (ESTADOS[id]?.color || "var(--fgp)") : "var(--mu2)",
        display:"flex", alignItems:"center", gap:6,
      }}
    >
      {label}
      {counts[id] > 0 && (
        <span style={{
          background: tab===id ? (ESTADOS[id]?.color||"var(--ac)") : "var(--mu)",
          color:"#fff", borderRadius:10, padding:"0 6px", fontSize:".7rem", fontWeight:700,
        }}>{counts[id]}</span>
      )}
    </button>
  );

  // ── Card acta ─────────────────────────────────────────────────────
  const ActaCard = ({ acta }) => {
    const st = ESTADOS[acta.estado];
    const next = nextAction(acta);
    const totalBienes = acta.bienes?.reduce((s,b)=>s+(parseInt(b.cantidad)||0),0)||0;
    return (
      <div
        style={{
          background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12,
          padding:"1rem 1.1rem", display:"flex", flexDirection:"column", gap:8, cursor:"pointer",
        }}
        onClick={() => abrirDetalle(acta)}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:".9rem", color:"var(--fgp)" }}>{acta.deudor_nombre}</div>
            <div style={{ fontSize:".78rem", color:"var(--mu)", marginTop:2 }}>Rol: <b style={{color:"var(--fgp)"}}>{acta.rol_causa}</b></div>
          </div>
          <span style={{
            background: st.bg, color: st.color, borderRadius:20,
            padding:"3px 10px", fontSize:".72rem", fontWeight:700, whiteSpace:"nowrap",
          }}>{st.label}</span>
        </div>

        {/* Info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:".76rem", color:"var(--mu)" }}>
          <span>🏛 {acta.juzgado || "—"}</span>
          <span>📦 {totalBienes} bien{totalBienes!==1?"es":""}</span>
          <span>👤 {acta.liquidador_nombre || "—"}</span>
          <span>🏗 {bodegaNombre(acta.bodega_id)}</span>
          {acta.fecha_entrega_esperada && (
            <span style={{color:"#f59e0b", fontWeight:600}}>📅 Esperado: {fmtDate(acta.fecha_entrega_esperada)}</span>
          )}
          {acta.fecha_recepcion && (
            <span style={{color:"#10b981"}}>✅ Recibido: {fmtDateTime(acta.fecha_recepcion)}</span>
          )}
        </div>

        {/* Acción */}
        {next && (
          <button
            onClick={e => { e.stopPropagation(); setConfirm({ acta, action: next }); }}
            style={{
              alignSelf:"flex-start", padding:"5px 14px", borderRadius:8, border:"none",
              background: next.color, color:"#fff", fontSize:".76rem", fontWeight:600, cursor:"pointer",
            }}
          >
            {next.label}
          </button>
        )}
        {acta.estado === "enviada_victor" && (
          <div style={{ fontSize:".72rem", color:"#8b5cf6", fontWeight:600 }}>
            ✔ Enviada {fmtDateTime(acta.fecha_enviada_victor)}
          </div>
        )}
      </div>
    );
  };

  // ── Modal formulario ──────────────────────────────────────────────
  const ModalForm = () => {
    const isEditing = modal && modal !== "nueva";
    return (
      <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal" style={{ maxWidth:680, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{isEditing ? `Acta — ${modal.rol_causa}` : "Nueva Acta de Entrega"}</span>
            <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
          </div>

          {/* Si es detalle, mostrar badges de estado + acciones */}
          {isEditing && (
            <div style={{ padding:"0 1.2rem .6rem", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              {FLUJO.map((e,i) => (
                <React.Fragment key={e}>
                  <span style={{
                    padding:"3px 10px", borderRadius:20, fontSize:".72rem", fontWeight:700,
                    background: ESTADOS[e].bg, color: ESTADOS[e].color,
                    border: modal.estado===e ? `2px solid ${ESTADOS[e].color}` : "1px solid transparent",
                  }}>{ESTADOS[e].label}</span>
                  {i < FLUJO.length-1 && <span style={{color:"var(--mu)"}}>→</span>}
                </React.Fragment>
              ))}
            </div>
          )}

          <div style={{ padding:"0 1.2rem 1.2rem", display:"flex", flexDirection:"column", gap:".9rem" }}>

            {/* Sección: Identificación */}
            <Section title="Identificación del Caso">
              <Row2>
                <Field label="Rol Causa *">
                  <input className="fi" value={form.rol_causa} onChange={e=>setF("rol_causa",e.target.value)} placeholder="C-1340-2026"/>
                </Field>
                <Field label="Bodega *">
                  <select className="fi" value={form.bodega_id} onChange={e=>setF("bodega_id",e.target.value)} disabled={isBodegaAdmin}>
                    <option value="">Seleccionar...</option>
                    {bodegasFiltradas.map(b=><option key={b.id} value={b.id}>{b.nombre}{b.ciudad?` (${b.ciudad})`:""}</option>)}
                  </select>
                </Field>
              </Row2>
              <Row2>
                <Field label="Juzgado">
                  <input className="fi" value={form.juzgado} onChange={e=>setF("juzgado",e.target.value)} placeholder="2º Juzgado Civil de Valparaíso"/>
                </Field>
                <Field label="Fecha Resolución">
                  <input className="fi" type="date" value={form.fecha_resolucion} onChange={e=>setF("fecha_resolucion",e.target.value)}/>
                </Field>
              </Row2>
              <Row2>
                <Field label="Fecha Entrega Esperada">
                  <input className="fi" type="date" value={form.fecha_entrega_esperada} onChange={e=>setF("fecha_entrega_esperada",e.target.value)}/>
                </Field>
                <Field label="Dirección de Entrega">
                  <input className="fi" value={form.direccion_entrega} onChange={e=>setF("direccion_entrega",e.target.value)} placeholder="Av. 7 Norte N°645, Of. 508"/>
                </Field>
              </Row2>
            </Section>

            {/* Sección: Deudor */}
            <Section title="Datos del Deudor">
              <Row2>
                <Field label="Nombre Completo *">
                  <input className="fi" value={form.deudor_nombre} onChange={e=>setF("deudor_nombre",e.target.value)} placeholder="PEDRO WILFRIDO BOMBAL SEREY"/>
                </Field>
                <Field label="RUT">
                  <input className="fi" value={form.deudor_rut} onChange={e=>setF("deudor_rut",e.target.value)} placeholder="7.644.109-K"/>
                </Field>
              </Row2>
              <Row2>
                <Field label="Teléfono">
                  <input className="fi" value={form.deudor_telefono} onChange={e=>setF("deudor_telefono",e.target.value)} placeholder="+56 9 XXXX XXXX"/>
                </Field>
                <Field label="Email">
                  <input className="fi" type="email" value={form.deudor_email} onChange={e=>setF("deudor_email",e.target.value)} placeholder="correo@ejemplo.cl"/>
                </Field>
              </Row2>
              <Row2>
                <Field label="Profesión u Oficio">
                  <input className="fi" value={form.deudor_profesion} onChange={e=>setF("deudor_profesion",e.target.value)} placeholder="Pensionado"/>
                </Field>
                <Field label="Empleador">
                  <input className="fi" value={form.deudor_empleador} onChange={e=>setF("deudor_empleador",e.target.value)} placeholder="—"/>
                </Field>
              </Row2>
            </Section>

            {/* Sección: Liquidador */}
            <Section title="Liquidador Concursal">
              <Row2>
                <Field label="Nombre Liquidador">
                  <input className="fi" value={form.liquidador_nombre} onChange={e=>setF("liquidador_nombre",e.target.value)} placeholder="MARIA FERNANDA CROSS LUCERO"/>
                </Field>
                <Field label="Email Liquidador">
                  <input className="fi" type="email" value={form.liquidador_email} onChange={e=>setF("liquidador_email",e.target.value)} placeholder="liquidador@ejemplo.cl"/>
                </Field>
              </Row2>
            </Section>

            {/* Sección: Inventario de Bienes */}
            <Section title="Inventario de Bienes">
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {form.bienes.map((b,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 60px 2fr 90px auto", gap:6, alignItems:"center" }}>
                    <select className="fi" value={b.tipo} onChange={e=>setBien(i,"tipo",e.target.value)} style={{fontSize:".76rem"}}>
                      {TIPOS_BIEN.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <input className="fi" type="number" min={1} value={b.cantidad} onChange={e=>setBien(i,"cantidad",e.target.value)} style={{textAlign:"center"}}/>
                    <input className="fi" value={b.descripcion} onChange={e=>setBien(i,"descripcion",e.target.value)} placeholder="Descripción"/>
                    <select className="fi" value={b.estado} onChange={e=>setBien(i,"estado",e.target.value)} style={{fontSize:".76rem"}}>
                      {["Bueno","Regular","Malo","Sin estado"].map(s=><option key={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={()=>removeBien(i)}
                      style={{ background:"transparent", border:"none", color:"var(--mu)", cursor:"pointer", fontSize:"1rem", padding:"0 4px" }}
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={addBien}
                  style={{ alignSelf:"flex-start", padding:"4px 12px", borderRadius:6, border:"1px dashed var(--b1)", background:"transparent", color:"var(--mu2)", fontSize:".76rem", cursor:"pointer" }}
                >+ Agregar bien</button>
              </div>
            </Section>

            {/* Sección: Documentos */}
            <Section title="Documentos Entregados">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                {[
                  ["doc_cedula","Cédula de Identidad"],
                  ["doc_afp","Certificado AFP"],
                  ["doc_boleta_honorarios","Boleta de Honorarios"],
                  ["doc_anotaciones_vigentes","Certificado de Anotaciones Vigentes"],
                  ["doc_liquidaciones_sueldo","Liquidaciones de Sueldo"],
                  ["doc_contrato_trabajo","Contrato de Trabajo"],
                  ["doc_carpeta_tributaria","Carpeta Tributaria"],
                ].map(([k,label]) => (
                  <label key={k} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:".8rem", color:"var(--fgp)" }}>
                    <input type="checkbox" checked={form[k]||false} onChange={e=>setF(k,e.target.checked)}
                      style={{ width:15, height:15, accentColor:"var(--ac)", cursor:"pointer" }}/>
                    {label}
                  </label>
                ))}
              </div>
              <Field label="Otros documentos">
                <input className="fi" value={form.doc_otros||""} onChange={e=>setF("doc_otros",e.target.value)} placeholder="Ej: poder notarial, testamento..."/>
              </Field>
            </Section>

            {/* Notas */}
            <Section title="Notas Internas">
              <textarea className="fi" value={form.notas||""} onChange={e=>setF("notas",e.target.value)}
                placeholder="Observaciones del equipo..." rows={3} style={{resize:"vertical"}}/>
            </Section>

            {/* Historial si es edición */}
            {isEditing && (
              <div style={{ background:"var(--s1)", border:"1px solid var(--b1)", borderRadius:8, padding:"10px 14px", fontSize:".76rem", color:"var(--mu)" }}>
                <b style={{color:"var(--fgp)"}}>Historial</b>
                <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
                  <span>📋 Creada: {fmtDateTime(modal.created_at)}</span>
                  {modal.fecha_recepcion && <span>✅ Recepcionada: {fmtDateTime(modal.fecha_recepcion)} por <b>{modal.recepcionado_por}</b></span>}
                  {modal.fecha_enviada_victor && <span>📨 Enviada a Víctor: {fmtDateTime(modal.fecha_enviada_victor)}</span>}
                </div>
              </div>
            )}

            {/* Botones */}
            <div style={{ display:"flex", gap:8, justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-primary" onClick={guardar} disabled={saving} style={{ fontSize:".8rem" }}>
                  {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear Acta"}
                </button>
                <button className="btn-secondary" onClick={()=>setModal(null)} style={{ fontSize:".8rem" }}>Cancelar</button>
              </div>
              {isEditing && (
                <div style={{ display:"flex", gap:8 }}>
                  {FLUJO.indexOf(modal.estado) > 0 && (
                    <button onClick={()=>retrocederEstado(modal)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--b1)", background:"transparent", color:"var(--mu)", fontSize:".76rem", cursor:"pointer" }}>
                      ← Revertir estado
                    </button>
                  )}
                  {!isBodegaAdmin && (
                    <button onClick={()=>setConfirm({acta:modal,action:"eliminar"})} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--rd)", background:"transparent", color:"var(--rd)", fontSize:".76rem", cursor:"pointer" }}>
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render principal ───────────────────────────────────────────────
  return (
    <div className="page">
      {/* Confirm dialog */}
      {confirm && (
        <div className="modal-overlay" onClick={()=>setConfirm(null)}>
          <div className="modal" style={{ maxWidth:400, padding:"1.4rem" }} onClick={e=>e.stopPropagation()}>
            {confirm.action === "eliminar" ? (
              <>
                <div style={{ fontWeight:700, fontSize:".92rem", marginBottom:8 }}>¿Eliminar acta?</div>
                <div style={{ fontSize:".82rem", color:"var(--mu)", marginBottom:16 }}>
                  Se eliminará el acta de <b>{confirm.acta.deudor_nombre}</b> (Rol {confirm.acta.rol_causa}). Esta acción no se puede deshacer.
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-primary" style={{ background:"var(--rd)", fontSize:".8rem" }} onClick={()=>eliminar(confirm.acta)}>Eliminar</button>
                  <button className="btn-secondary" style={{ fontSize:".8rem" }} onClick={()=>setConfirm(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight:700, fontSize:".92rem", marginBottom:8 }}>Confirmar: {confirm.action.label}</div>
                <div style={{ fontSize:".82rem", color:"var(--mu)", marginBottom:8 }}>
                  <b>{confirm.acta.deudor_nombre}</b> — Rol {confirm.acta.rol_causa}
                </div>
                {confirm.action.estado === "recepcionada" && (
                  <div style={{ background:"#d1fae5", border:"1px solid #6ee7b7", borderRadius:8, padding:"10px 12px", fontSize:".8rem", color:"#065f46", marginBottom:12 }}>
                    Al confirmar, se registrará la recepción con fecha y hora actuales y el nombre del responsable ({session?.name || "—"}).
                  </div>
                )}
                {confirm.action.estado === "enviada_victor" && (
                  <div style={{ background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:8, padding:"10px 12px", fontSize:".8rem", color:"#4c1d95", marginBottom:12 }}>
                    Se marcará el acta como enviada a Víctor para coordinar la fecha del remate. Registra la hora actual.
                  </div>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-primary" style={{ background: confirm.action.color, fontSize:".8rem" }}
                    onClick={()=>avanzarEstado(confirm.acta, confirm.action.estado)}>
                    {confirm.action.label}
                  </button>
                  <button className="btn-secondary" style={{ fontSize:".8rem" }} onClick={()=>setConfirm(null)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal form */}
      {modal && <ModalForm/>}

      {/* Header y controles */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:"1rem" }}>
        <input
          className="fi" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar por Rol, Deudor o Liquidador..."
          style={{ maxWidth:280, fontSize:".82rem" }}
        />
        {!isBodegaAdmin && (
          <select className="fi" value={filtBodega} onChange={e=>setFiltBodega(e.target.value)} style={{ maxWidth:180, fontSize:".82rem" }}>
            <option value="all">Todas las bodegas</option>
            {dbBodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        )}
        <div style={{ marginLeft:"auto" }}>
          <button className="btn-primary" onClick={abrirNueva} style={{ fontSize:".8rem" }}>
            + Nueva Acta
          </button>
        </div>
      </div>

      {/* Tabs de estado */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.2rem" }}>
        <TabBtn id="pendiente"       label="Por Llegar"/>
        <TabBtn id="por_recepcionar" label="Por Recepcionar"/>
        <TabBtn id="recepcionada"    label="Recepcionadas"/>
        <TabBtn id="enviada_victor"  label="Enviadas a Víctor"/>
        <TabBtn id="todas"           label="Todas"/>
      </div>

      {/* Grid de actas */}
      {actasFiltradas.length === 0 ? (
        <div style={{ textAlign:"center", color:"var(--mu)", padding:"3rem 0", fontSize:".88rem" }}>
          {tab === "todas" ? "No hay actas registradas." : `No hay actas en estado "${ESTADOS[tab]?.label || tab}".`}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
          {actasFiltradas.map(a => <ActaCard key={a.id} acta={a}/>)}
        </div>
      )}
    </div>
  );
}

// ── Helpers de layout ────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background:"var(--s1)", border:"1px solid var(--b1)", borderRadius:10, padding:"10px 12px" }}>
      <div style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>{children}</div>
    </div>
  );
}
function Row2({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize:".72rem", fontWeight:600, color:"var(--mu)", display:"block", marginBottom:3 }}>{label}</label>
      {children}
    </div>
  );
}
