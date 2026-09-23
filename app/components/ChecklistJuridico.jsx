'use client'
import React, { useState } from "react";

/* ── Definición de pasos ────────────────────────────────────────── */
const PASOS_CONCURSAL = [
  {
    id:"C01", label:"Ingreso y Designación",
    items:[
      { id:"causa_identificada",   label:"Causa concursal identificada" },
      { id:"rol_registrado",       label:"ROL registrado" },
      { id:"tribunal_registrado",  label:"Tribunal registrado" },
      { id:"deudor_identificado",  label:"Deudor identificado" },
      { id:"rut_registrado",       label:"RUT registrado" },
      { id:"tipo_proc",            label:"Tipo de procedimiento identificado (ordinaria/simplificada)" },
      { id:"liquidador_id",        label:"Liquidador identificado" },
      { id:"martillero_designado", label:"Martillero concursal designado" },
      { id:"doc_designacion",      label:"Documento/antecedente de designación incorporado" },
      { id:"fecha_designacion",    label:"Fecha de designación registrada" },
    ]
  },
  {
    id:"C02", label:"Recepción de Antecedentes",
    items:[
      { id:"res_liquidacion",  label:"Resolución de liquidación disponible" },
      { id:"inventario_disp",  label:"Inventario de bienes disponible" },
      { id:"antec_bienes",     label:"Antecedentes de los bienes recibidos" },
      { id:"ubicacion_bienes", label:"Información sobre ubicación de bienes" },
      { id:"contacto_liq",     label:"Información de contacto del liquidador" },
    ]
  },
  {
    id:"C03", label:"Acta de Entrega / Recepción",
    items:[
      { id:"acta_preparada",    label:"Acta de entrega preparada" },
      { id:"acta_enviada",      label:"Acta enviada/firmada según corresponda" },
      { id:"acta_incorporada",  label:"Acta incorporada al sistema" },
      { id:"fecha_recep_reg",   label:"Fecha de recepción registrada" },
      { id:"responsable_reg",   label:"Responsable registrado" },
    ]
  },
  {
    id:"C04", label:"Recepción Física de Bienes",
    items:[
      { id:"bienes_recibidos",  label:"Bienes recibidos físicamente" },
      { id:"cantidades_verif",  label:"Cantidades verificadas" },
      { id:"bienes_conciliados",label:"Bienes conciliados con inventario" },
      { id:"estado_reg",        label:"Estado general registrado" },
      { id:"fotos_recep",       label:"Fotografías/registro de recepción incorporado" },
    ]
  },
  {
    id:"C05", label:"Conciliación de Inventario",
    items:[
      { id:"inventario_rev",  label:"Inventario revisado" },
      { id:"bienes_id",       label:"Todos los bienes identificados" },
      { id:"difs_resueltas",  label:"Diferencias resueltas o documentadas" },
      { id:"inv_validado",    label:"Inventario final validado" },
    ]
  },
  {
    id:"C06", label:"Bases / Condiciones de Remate",
    items:[
      { id:"bases_disponibles",   label:"Bases definitivas disponibles" },
      { id:"minimo_reg",          label:"Mínimo registrado" },
      { id:"forma_pago",          label:"Forma de pago registrada" },
      { id:"comision_reg",        label:"Comisión registrada" },
      { id:"pub_boletin_bases",   label:"Bases publicadas en Boletín Concursal" },
    ]
  },
  {
    id:"C07", label:"Solicitud / Fijación de Fecha",
    items:[
      { id:"fecha_propuesta",   label:"Fecha propuesta registrada" },
      { id:"solicitud_incorp",  label:"Solicitud/presentación incorporada" },
      { id:"resolucion_rec",    label:"Resolución/confirmación recibida" },
      { id:"fecha_definitiva",  label:"Fecha definitiva registrada" },
      { id:"hora_definitiva",   label:"Hora definitiva registrada" },
      { id:"lugar_definitivo",  label:"Lugar/modalidad definitiva registrada" },
    ]
  },
  {
    id:"C08", label:"Publicaciones Legales",
    items:[
      { id:"pub_boletin",     label:"Publicación Boletín Concursal realizada" },
      { id:"pub_adicionales", label:"Publicaciones adicionales realizadas (si corresponde)" },
      { id:"plazos_cumplidos",label:"Fechas de publicación cumplen anticipación requerida" },
      { id:"comprobantes",    label:"Copias/comprobantes archivados" },
    ]
  },
  {
    id:"C09", label:"Validación Final — Pre-Remate", esUltimo:true,
    items:[
      { id:"fecha_conf",       label:"Fecha confirmada" },
      { id:"hora_conf",        label:"Hora confirmada" },
      { id:"lugar_conf",       label:"Lugar/modalidad confirmada" },
      { id:"bases_vigentes",   label:"Bases vigentes" },
      { id:"pubs_cumplidas",   label:"Publicaciones cumplidas" },
      { id:"inv_conciliado",   label:"Inventario conciliado" },
      { id:"bienes_disp",      label:"Bienes disponibles" },
      { id:"sin_suspension",   label:"No existe suspensión conocida" },
      { id:"doc_critica_ok",   label:"Documentación crítica completa" },
      { id:"obs_resueltas",    label:"Observaciones críticas resueltas" },
    ]
  },
];

const PASOS_JUDICIAL = [
  {
    id:"J01", label:"Ingreso de Causa",
    items:[
      { id:"rol_registrado",      label:"ROL registrado" },
      { id:"tribunal_registrado", label:"Tribunal registrado" },
      { id:"caratulado_reg",      label:"Caratulado registrado" },
      { id:"ejecutante_reg",      label:"Ejecutante/acreedor registrado" },
      { id:"ejecutado_reg",       label:"Ejecutado registrado" },
      { id:"rut_reg",             label:"RUT ejecutado registrado" },
      { id:"tipo_juicio",         label:"Tipo de juicio registrado" },
      { id:"res_incorporada",     label:"Resolución relevante incorporada" },
      { id:"martillero_id",       label:"Martillero identificado/designado" },
    ]
  },
  {
    id:"J02", label:"Resolución que Ordena Remate",
    items:[
      { id:"resolucion_incorp",   label:"Resolución que ordena remate incorporada" },
      { id:"bienes_id",           label:"Bienes a rematar identificados" },
      { id:"condiciones_id",      label:"Condiciones del remate identificadas" },
      { id:"minimo_reg",          label:"Mínimo registrado (si corresponde)" },
      { id:"garantia_reg",        label:"Garantía registrada (si corresponde)" },
    ]
  },
  {
    id:"J03", label:"Designación del Martillero",
    items:[
      { id:"designacion_rec",  label:"Designación judicial recibida" },
      { id:"martillero_ok",    label:"Martillero correcto" },
      { id:"doc_designacion",  label:"Documento de designación incorporado" },
      { id:"fecha_desig",      label:"Fecha de designación registrada" },
    ]
  },
  {
    id:"J04", label:"Recepción de Especies (Art. 450 CPC)",
    items:[
      { id:"fecha_recep",        label:"Fecha de recepción registrada" },
      { id:"ministro_fe",        label:"Ministro de fe identificado" },
      { id:"acta_generada",      label:"Acta de recepción generada/recibida" },
      { id:"acta_martillero",    label:"Acta firmada por martillero" },
      { id:"acta_fe",            label:"Acta firmada por ministro de fe" },
      { id:"especies_id",        label:"Especies identificadas" },
      { id:"cantidades_verif",   label:"Cantidades verificadas" },
      { id:"estado_reg",         label:"Estado de las especies registrado" },
      { id:"fotos_incorporadas", label:"Fotografías incorporadas" },
    ]
  },
  {
    id:"J05", label:"Conciliación de Especies",
    items:[
      { id:"coincide_acta",     label:"Bienes recibidos coinciden con acta" },
      { id:"coincide_res",      label:"Bienes coinciden con resolución/embargo" },
      { id:"difs_informadas",   label:"Diferencias informadas (si aplica)" },
    ]
  },
  {
    id:"J06", label:"Condiciones del Remate",
    items:[
      { id:"condiciones_verif", label:"Condiciones verificadas contra resolución" },
      { id:"minimo_reg",        label:"Mínimo registrado" },
      { id:"garantia_reg",      label:"Garantía registrada" },
      { id:"forma_pago",        label:"Forma de pago registrada" },
    ]
  },
  {
    id:"J07", label:"Solicitud / Fijación de Fecha",
    items:[
      { id:"fecha_prop",       label:"Fecha propuesta" },
      { id:"presentacion",     label:"Presentación realizada" },
      { id:"resolucion_rec",   label:"Resolución recibida" },
      { id:"fecha_aprobada",   label:"Fecha aprobada/fijada" },
      { id:"hora_conf",        label:"Hora confirmada" },
      { id:"resolucion_arch",  label:"Resolución archivada" },
    ]
  },
  {
    id:"J08", label:"Publicaciones",
    items:[
      { id:"pub_1",            label:"Publicación requerida 1" },
      { id:"pub_2",            label:"Publicación requerida 2" },
      { id:"plazos_cumplidos", label:"Plazos de anticipación cumplidos" },
      { id:"comprobantes",     label:"Comprobantes archivados" },
    ]
  },
  {
    id:"J09", label:"Revisión de Causa Antes de Aprobar",
    items:[
      { id:"res_vigente",     label:"Resolución vigente" },
      { id:"sin_suspension",  label:"No existe resolución de suspensión" },
      { id:"sin_cambio_fecha",label:"No existe resolución que cambie la fecha" },
      { id:"sin_retiro",      label:"No existe resolución que retire bienes" },
      { id:"bienes_disp",     label:"Bienes disponibles" },
      { id:"pubs_cumplidas",  label:"Publicaciones cumplidas" },
      { id:"acta_completa",   label:"Acta de recepción completa" },
      { id:"condiciones_ok",  label:"Condiciones correctas" },
      { id:"doc_completa",    label:"Documentación completa" },
    ]
  },
  {
    id:"J10", label:"Remate Aprobado — Validación Final", esUltimo:true,
    items:[
      { id:"fecha_registrada", label:"Fecha registrada" },
      { id:"hora_registrada",  label:"Hora registrada" },
      { id:"lugar_registrado", label:"Lugar/modalidad registrada" },
      { id:"res_archivada",    label:"Resolución archivada" },
    ]
  },
];

/* ── Estado visual del paso ─────────────────────────────────────── */
function calcEstadoPaso(stepDef, stepData) {
  if (!stepData || !stepData.items) return "pendiente";
  if (stepData.estado) return stepData.estado;
  const vals = stepDef.items.map(i => stepData.items?.[i.id]);
  if (vals.every(v => v === true || v === "na")) return "completado";
  if (vals.some(v => v === true)) return "en_proceso";
  return "pendiente";
}

const ESTADO_PASO = {
  pendiente:   { icon:"○", color:"#9ca3af", bg:"#f9fafb", label:"Pendiente" },
  en_proceso:  { icon:"◐", color:"#f59e0b", bg:"#fffbeb", label:"En proceso" },
  completado:  { icon:"●", color:"#10b981", bg:"#ecfdf5", label:"Completado" },
  observado:   { icon:"!", color:"#ef4444", bg:"#fef2f2", label:"Observado" },
  no_aplica:   { icon:"—", color:"#d1d5db", bg:"#f3f4f6", label:"No aplica" },
};

/* ── Componente principal ────────────────────────────────────────── */
export default function ChecklistJuridico({ causa, session, onPatch, onAprobar }) {
  const [open, setOpen]     = useState(null); // id del paso abierto
  const [saving, setSaving] = useState(false);

  const pasos = causa.tipo === "judicial" ? PASOS_JUDICIAL : PASOS_CONCURSAL;
  const data  = causa.checklist_data || {};

  /* ── Progreso global ── */
  const totalPasos     = pasos.length;
  const pasosCompletos = pasos.filter(p => ["completado","no_aplica"].includes(calcEstadoPaso(p, data[p.id]))).length;
  const pct            = totalPasos ? Math.round(pasosCompletos / totalPasos * 100) : 0;

  /* ── Toggle item: false → true → "na" → false ── */
  const toggleItem = async (stepId, itemId) => {
    const cur = data[stepId]?.items?.[itemId] ?? false;
    const nxt = cur === false ? true : cur === true ? "na" : false;
    const newData = {
      ...data,
      [stepId]: {
        ...data[stepId],
        items: { ...(data[stepId]?.items || {}), [itemId]: nxt },
      }
    };
    setSaving(true);
    await onPatch({ checklist_data: newData });
    setSaving(false);
  };

  /* ── Marcar paso como completado ── */
  const marcarPaso = async (stepId, nuevoEstado, notas) => {
    const now = new Date().toISOString();
    const newData = {
      ...data,
      [stepId]: {
        ...data[stepId],
        estado:         nuevoEstado,
        notas:          notas ?? data[stepId]?.notas ?? "",
        completado_at:  nuevoEstado === "completado" ? now : data[stepId]?.completado_at ?? null,
        completado_por: nuevoEstado === "completado" ? (session?.user?.email || session?.nombre || "—") : data[stepId]?.completado_por ?? null,
      }
    };
    setSaving(true);
    await onPatch({ checklist_data: newData });
    setSaving(false);
  };

  /* ── Ultimo paso: verificar si puede aprobar ── */
  const ultimoPaso   = pasos[pasos.length - 1];
  const dataUltimo   = data[ultimoPaso.id] || {};
  const puedeAprobar = ultimoPaso.items.every(i => {
    const v = dataUltimo.items?.[i.id];
    return v === true || v === "na";
  });

  /* ── Render ── */
  return (
    <div>
      {/* Barra de progreso */}
      <div style={{ marginBottom:".9rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".35rem" }}>
          <span style={{ fontSize:".7rem", fontWeight:700, color:"var(--mu)", textTransform:"uppercase", letterSpacing:".06em" }}>Progreso del checklist</span>
          <span style={{ fontSize:".72rem", fontWeight:700, color: pct===100?"#10b981":"var(--fgs)" }}>{pasosCompletos}/{totalPasos} pasos — {pct}%</span>
        </div>
        <div style={{ height:7, background:"var(--b1)", borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background: pct===100?"#10b981":"#3b82f6", borderRadius:99, transition:"width .4s" }}/>
        </div>
      </div>

      {/* Lista de pasos */}
      {pasos.map(paso => {
        const stepData = data[paso.id] || {};
        const estado   = calcEstadoPaso(paso, stepData);
        const ep       = ESTADO_PASO[estado] || ESTADO_PASO.pendiente;
        const isOpen   = open === paso.id;
        const itemVals = paso.items.map(i => stepData.items?.[i.id] ?? false);
        const itemsDone = itemVals.filter(v => v === true || v === "na").length;

        return (
          <div key={paso.id} style={{ border:`1px solid ${isOpen ? "#3b82f6" : ep.color+"44"}`, borderRadius:9, marginBottom:".4rem", background: isOpen ? "#eff6ff" : ep.bg, overflow:"hidden" }}>
            {/* Header del paso */}
            <div onClick={() => setOpen(isOpen ? null : paso.id)}
              style={{ padding:".55rem .8rem", display:"flex", alignItems:"center", gap:".55rem", cursor:"pointer", userSelect:"none" }}>
              <span style={{ fontSize:".88rem", lineHeight:1, color:ep.color, flexShrink:0 }}>{ep.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".77rem", fontWeight:700, color:"var(--fgp)" }}>
                  <span style={{ fontFamily:"monospace", fontSize:".65rem", color:ep.color, marginRight:".35rem" }}>{paso.id}</span>
                  {paso.label}
                </div>
              </div>
              <span style={{ fontSize:".63rem", color:"var(--mu)", whiteSpace:"nowrap" }}>{itemsDone}/{paso.items.length}</span>
              <span style={{ fontSize:".63rem", background:ep.color+"22", color:ep.color, borderRadius:10, padding:".06rem .4rem", fontWeight:700, whiteSpace:"nowrap" }}>{ep.label}</span>
              <span style={{ fontSize:".65rem", color:"var(--mu)", transform: isOpen?"rotate(90deg)":"none", transition:"transform .2s" }}>▶</span>
            </div>

            {/* Contenido expandido */}
            {isOpen && (
              <div style={{ padding:".55rem .9rem .8rem", borderTop:"1px solid #bfdbfe" }}>
                {/* Items */}
                <div style={{ marginBottom:".6rem" }}>
                  {paso.items.map(item => {
                    const val = stepData.items?.[item.id] ?? false;
                    return (
                      <div key={item.id} onClick={() => toggleItem(paso.id, item.id)}
                        style={{ display:"flex", alignItems:"center", gap:".55rem", padding:".32rem .5rem", borderRadius:7, marginBottom:".22rem",
                          cursor:"pointer", userSelect:"none",
                          background: val===true?"#f0fdf4": val==="na"?"#f8fafc":"transparent",
                          border:`1px solid ${val===true?"#a7f3d0": val==="na"?"#e5e7eb":"transparent"}` }}>
                        {/* Icono de estado */}
                        <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                          background: val===true?"#10b981": val==="na"?"#e5e7eb":"#fff",
                          border:`2px solid ${val===true?"#10b981": val==="na"?"#d1d5db":"#d1d5db"}` }}>
                          {val===true && <span style={{ color:"#fff", fontSize:".6rem", fontWeight:900 }}>✓</span>}
                          {val==="na" && <span style={{ color:"#9ca3af", fontSize:".6rem", fontWeight:900 }}>—</span>}
                        </div>
                        <span style={{ fontSize:".74rem", color: val==="na"?"#9ca3af":val===true?"#065f46":"var(--fgp)", flex:1 }}>{item.label}</span>
                        <span style={{ fontSize:".57rem", color:"#9ca3af", flexShrink:0 }}>
                          {val===false?"→ OK":val===true?"→ N/A":"→ deselec."}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Notas del paso */}
                <NotasStep paso={paso} stepData={stepData} onSave={notas => marcarPaso(paso.id, estado, notas)} />

                {/* Botones de estado del paso */}
                <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap", marginTop:".55rem" }}>
                  {["pendiente","en_proceso","completado","observado","no_aplica"].map(est => (
                    <button key={est} onClick={() => marcarPaso(paso.id, est, stepData.notas)}
                      disabled={saving}
                      style={{ padding:".28rem .65rem", borderRadius:7, fontSize:".65rem", fontWeight:700, cursor:"pointer",
                        background: estado===est ? ESTADO_PASO[est].color : "transparent",
                        color: estado===est ? "#fff" : ESTADO_PASO[est].color,
                        border:`1px solid ${ESTADO_PASO[est].color}` }}>
                      {ESTADO_PASO[est].icon} {ESTADO_PASO[est].label}
                    </button>
                  ))}
                </div>

                {/* Trazabilidad */}
                {stepData.completado_at && (
                  <div style={{ marginTop:".5rem", fontSize:".63rem", color:"var(--mu)", fontStyle:"italic" }}>
                    Completado por {stepData.completado_por || "—"} el {new Date(stepData.completado_at).toLocaleString("es-CL")}
                  </div>
                )}

                {/* Botón APROBAR REMATE en el último paso */}
                {paso.esUltimo && (
                  <div style={{ marginTop:".75rem", padding:".7rem", borderRadius:9,
                    background: puedeAprobar ? "#f0fdf4" : "#fef2f2",
                    border:`1px solid ${puedeAprobar?"#4ade80":"#fca5a5"}` }}>
                    {puedeAprobar ? (
                      <button onClick={onAprobar} disabled={saving}
                        style={{ display:"block", width:"100%", padding:".6rem", background:"#10b981", border:"none",
                          borderRadius:8, color:"#fff", fontWeight:800, fontSize:".86rem", cursor:"pointer" }}>
                        ✅ Aprobar remate y crear Pre-Remate
                      </button>
                    ) : (
                      <div style={{ fontSize:".72rem", color:"#b91c1c" }}>
                        <div style={{ fontWeight:700, marginBottom:".25rem" }}>⚠ No se puede aprobar aún</div>
                        <div>Completá todos los ítems del paso de validación final (o marcá los que no aplican).</div>
                        <div style={{ marginTop:".25rem", color:"#9ca3af" }}>
                          Pendientes: {ultimoPaso.items.filter(i => {
                            const v = dataUltimo.items?.[i.id];
                            return v !== true && v !== "na";
                          }).map(i => i.label).join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Sub-componente: notas inline ───────────────────────────────── */
function NotasStep({ paso, stepData, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(stepData.notas || "");

  if (editing) return (
    <div>
      <textarea value={val} onChange={e=>setVal(e.target.value)} rows={2}
        placeholder="Observaciones, documentos, referencias…"
        style={{ width:"100%", fontSize:".72rem", padding:".35rem .5rem", border:"1px solid var(--b1)", borderRadius:7, background:"#fff", color:"var(--fgp)", resize:"vertical" }}/>
      <div style={{ display:"flex", gap:".35rem", marginTop:".3rem" }}>
        <button onClick={() => { onSave(val); setEditing(false); }}
          style={{ fontSize:".67rem", padding:".24rem .65rem", background:"#3b82f6", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontWeight:700 }}>
          Guardar
        </button>
        <button onClick={() => { setVal(stepData.notas||""); setEditing(false); }}
          style={{ fontSize:".67rem", padding:".24rem .65rem", background:"transparent", color:"var(--mu)", border:"1px solid var(--b1)", borderRadius:6, cursor:"pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div onClick={() => { setVal(stepData.notas||""); setEditing(true); }}
      style={{ fontSize:".71rem", color: stepData.notas ? "var(--fgp)" : "var(--mu)", cursor:"pointer",
        padding:".28rem .45rem", borderRadius:6, border:"1px dashed var(--b1)", background:"rgba(255,255,255,.6)", minHeight:28 }}>
      {stepData.notas || <span style={{ fontStyle:"italic" }}>+ Agregar observaciones/notas al paso…</span>}
    </div>
  );
}
