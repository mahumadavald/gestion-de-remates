'use client'
import React, { useState, useMemo } from "react";
import FirmaCanvas from "../FirmaCanvas";

const ESTADOS = {
  pendiente:       { label: "Por Llegar",       color: "#f59e0b", bg: "#fef3c7" },
  por_recepcionar: { label: "Por Recepcionar",  color: "#3b82f6", bg: "#dbeafe" },
  recepcionada:    { label: "Recepcionada",      color: "#10b981", bg: "#d1fae5" },
  enviada_victor:  { label: "Enviada",  color: "#8b5cf6", bg: "#ede9fe" },
};

const FLUJO = ["pendiente","por_recepcionar","recepcionada","enviada_victor"];

const TIPOS_BIEN = ["Bien Mueble","Bien Inmueble","Vehículo","Efectivo","Documento","Otro"];

const CATEGORIA_MAP = {
  "Vehículo": "Vehículo",
  "Bien Inmueble": "Inmueble",
};
const tipoBienToCategoria = (tipo) => CATEGORIA_MAP[tipo] || "Muebles";

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
  firma_url:"",
};

export default function PageActasEntrega({ session, supabase, dbActas, setDbActas, dbBodegas, dbLotes, setDbLotes, notify }) {
  const [tab, setTab]             = useState("pendiente");
  const [filtBodega, setFiltBodega] = useState("all");
  const [modal, setModal]         = useState(null);   // null | "nueva" | {acta}
  const [form, setForm]           = useState({ ...FORM_VACIO });
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [confirm, setConfirm]     = useState(null);   // { acta, action }
  const [uploadFile, setUploadFile]       = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadFirmaBlob, setUploadFirmaBlob] = useState(null);

  // ── Modal crear lotes desde acta ───────────────────────────────────
  const [modalLotes, setModalLotes] = useState(null);   // {acta}
  const [lotesBienes, setLotesBienes] = useState([]);   // [{...bien, checked, base, remate_id}]
  const [creandoLotes, setCreandoLotes] = useState(false);

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
  const addBien    = () => setForm(p => ({ ...p, bienes: [...p.bienes, { ...BIEN_VACIO }] }));
  const removeBien = i  => setForm(p => ({ ...p, bienes: p.bienes.filter((_,j)=>j!==i) }));

  const abrirNueva = () => {
    setForm({ ...FORM_VACIO, bodega_id: isBodegaAdmin && session?.bodegaId ? session.bodegaId : "" });
    setUploadFile(null);
    setUploadFirmaBlob(null);
    setModal("nueva");
  };

  const abrirDetalle = (acta) => {
    setForm({
      ...FORM_VACIO, ...acta,
      bienes: acta.bienes?.length ? acta.bienes : [{ ...BIEN_VACIO }],
      fecha_resolucion:       acta.fecha_resolucion || "",
      fecha_entrega_esperada: acta.fecha_entrega_esperada || "",
      deudor_remuneracion:    acta.deudor_remuneracion ? String(acta.deudor_remuneracion) : "",
      firma_url:              acta.firma_url || "",
    });
    setUploadFile(null);
    setUploadFirmaBlob(null);
    setModal(acta);
  };

  // ── Upload archivo ────────────────────────────────────────────────
  const uploadActaFile = async (actaId) => {
    if (!uploadFile) return null;
    setUploading(true);
    const ext  = uploadFile.name.split(".").pop();
    const path = `actas/${actaId}.${ext}`;
    const { error } = await supabase.storage.from("actas-entrega").upload(path, uploadFile, { upsert: true });
    setUploading(false);
    if (error) { notify("Error subiendo archivo: " + error.message, "inf"); return null; }
    const { data } = supabase.storage.from("actas-entrega").getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Firma deudor ──────────────────────────────────────────────────
  const firmaConfirmEntrega = async (blob) => {
    const actaId = modal !== "nueva" ? modal?.id : null;
    const campo = "firma_url";
    if (!actaId) {
      // Acta nueva: guardar URL temporal en form, se sube junto con el acta
      setF(campo, URL.createObjectURL(blob));
      // Guardar blob en ref para subirlo al guardar
      setUploadFirmaBlob(blob);
      notify("Firma registrada — guarda el acta para persistirla.", "inf");
      return;
    }
    const path = `entrega/${actaId}_${Date.now()}.png`;
    const { error } = await supabase.storage.from("firmas").upload(path, blob, { upsert: true, contentType: "image/png" });
    if (error) { notify("Error subiendo firma: " + error.message, "inf"); return; }
    const { data: pd } = supabase.storage.from("firmas").getPublicUrl(path);
    const url = pd.publicUrl;
    const { error: e2 } = await supabase.from("actas_entrega").update({ firma_url: url }).eq("id", actaId);
    if (e2) { notify("Error guardando firma.", "inf"); return; }
    setDbActas(p => p.map(a => a.id === actaId ? { ...a, firma_url: url } : a));
    setF(campo, url);
    notify("Firma del deudor guardada.", "sold");
  };

  const firmaBorrarEntrega = async () => {
    const actaId = modal !== "nueva" ? modal?.id : null;
    setF("firma_url", "");
    setUploadFirmaBlob(null);
    if (!actaId) return;
    await supabase.from("actas_entrega").update({ firma_url: null }).eq("id", actaId);
    setDbActas(p => p.map(a => a.id === actaId ? { ...a, firma_url: null } : a));
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
      const updates = {};
      const archivoUrl = await uploadActaFile(data.id);
      if (archivoUrl) updates.acta_url = archivoUrl;
      // Subir firma si el usuario la dibujó antes de guardar
      if (uploadFirmaBlob) {
        const path = `entrega/${data.id}_${Date.now()}.png`;
        const { error: fe } = await supabase.storage.from("firmas").upload(path, uploadFirmaBlob, { upsert: true, contentType: "image/png" });
        if (!fe) { const { data: pd } = supabase.storage.from("firmas").getPublicUrl(path); updates.firma_url = pd.publicUrl; }
      }
      let actaFinal = data;
      if (Object.keys(updates).length) {
        await supabase.from("actas_entrega").update(updates).eq("id", data.id);
        actaFinal = { ...data, ...updates };
      }
      setDbActas(p => [actaFinal, ...p]);
      setUploadFirmaBlob(null);
      notify("Acta creada.", "sold");
    } else {
      const archivoUrl = await uploadActaFile(modal.id);
      const finalPayload = archivoUrl ? { ...payload, acta_url: archivoUrl } : payload;
      const { error } = await supabase.from("actas_entrega").update(finalPayload).eq("id", modal.id);
      if (error) { notify("Error: " + error.message, "inf"); setSaving(false); return; }
      setDbActas(p => p.map(a => a.id === modal.id ? { ...a, ...finalPayload } : a));
      notify("Acta actualizada.", "sold");
    }
    setSaving(false);
    setModal(null);
  };

  // ── Avanzar estado ─────────────────────────────────────────────────
  const avanzarEstado = async (acta, nuevoEstado) => {
    const ahora = new Date().toISOString();
    const update = { estado: nuevoEstado };
    if (nuevoEstado === "recepcionada") {
      update.fecha_recepcion  = ahora;
      update.recepcionado_por = session?.name || session?.usuario || "—";
    }
    if (nuevoEstado === "enviada_victor") {
      update.fecha_enviada_victor = ahora;
    }
    const { error } = await supabase.from("actas_entrega").update(update).eq("id", acta.id);
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbActas(p => p.map(a => a.id === acta.id ? { ...a, ...update } : a));
    notify(`Acta marcada como "${ESTADOS[nuevoEstado].label}".`, "sold");
    setConfirm(null);
    // Si recién se recepcionó y tiene bienes, ofrecer crear lotes
    if (nuevoEstado === "recepcionada" && acta.bienes?.some(b=>b.descripcion?.trim())) {
      setTimeout(() => abrirCrearLotes({ ...acta, ...update }), 200);
    }
  };

  const retrocederEstado = async (acta) => {
    const idx = FLUJO.indexOf(acta.estado);
    if (idx <= 0) return;
    const prev = FLUJO[idx - 1];
    const update = { estado: prev, ...(prev !== "recepcionada" ? { fecha_recepcion: null } : {}), ...(prev !== "enviada_victor" ? { fecha_enviada_victor: null } : {}) };
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

  // ── Crear lotes desde acta ─────────────────────────────────────────
  const abrirCrearLotes = (acta) => {
    const bienes = (acta.bienes || []).filter(b => b.descripcion?.trim());
    if (!bienes.length) { notify("Esta acta no tiene bienes en el inventario.", "inf"); return; }
    setLotesBienes(bienes.map(b => ({
      ...b,
      checked: true,
      base: "",
      nombre: b.descripcion,
    })));
    setModalLotes(acta);
  };

  const crearLotes = async () => {
    const seleccionados = lotesBienes.filter(b => b.checked && b.nombre?.trim());
    if (!seleccionados.length) { notify("Selecciona al menos un bien.", "inf"); return; }
    setCreandoLotes(true);
    let ok = 0;
    const lotesActuales = dbLotes || [];
    for (let i = 0; i < seleccionados.length; i++) {
      const b = seleccionados[i];
      const base = parseFloat(String(b.base).replace(/\D/g,"")) || 0;
      const codigo = `L-${String(Date.now() + i).slice(-5)}`;
      const { data: nuevo, error } = await supabase.from("lotes").insert({
        casa_id:     session?.casaId || null,
        bodega_id:   modalLotes.bodega_id || session?.bodegaId || null,
        acta_id:     modalLotes.id,
        codigo,
        nombre:      b.nombre.trim(),
        descripcion: [
          b.tipo !== "Bien Mueble" ? b.tipo : null,
          b.cantidad > 1 ? `Cantidad: ${b.cantidad}` : null,
          `Rol: ${modalLotes.rol_causa}`,
          `Mandante: ${modalLotes.deudor_nombre}`,
        ].filter(Boolean).join(" | "),
        mandante:    modalLotes.deudor_nombre || null,
        expediente:  modalLotes.rol_causa || null,
        categoria:   tipoBienToCategoria(b.tipo),
        base,
        minimo:      base || null,
        incremento:  base ? Math.max(Math.round(base * 0.05), 5000) : 10000,
        comision:    7,
        tipo_iva:    "EX",
        afecto_iva:  false,
        cantidad:    parseInt(b.cantidad) || 1,
        estado:      "pendiente_revision",
        orden:       lotesActuales.length + ok + 1,
      }).select().single();
      if (!error && nuevo) { ok++; }
    }
    // Recargar lotes
    const { data: lotData } = await supabase.from("lotes").select("*").order("orden");
    if (lotData && setDbLotes) setDbLotes(lotData);
    setCreandoLotes(false);
    setModalLotes(null);
    notify(`${ok} lote${ok!==1?"s":""} creado${ok!==1?"s":""} — aparecen en "Revisión de Lotes".`, "sold");
  };

  const bodegaNombre = (id) => dbBodegas.find(b=>b.id===id)?.nombre || "Sin asignar";

  const nextAction = (acta) => {
    const actions = {
      pendiente:       { label:"Marcar 'Por Recepcionar'", estado:"por_recepcionar", color:"#3b82f6" },
      por_recepcionar: { label:"Recepcionar Bienes",       estado:"recepcionada",    color:"#10b981" },
      recepcionada:    { label:"Enviar",          estado:"enviada_victor",  color:"#8b5cf6" },
      enviada_victor:  null,
    };
    return actions[acta.estado];
  };

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding:"6px 14px", borderRadius:20, fontSize:".78rem", fontWeight:600, cursor:"pointer",
        border: tab===id ? "none" : "1px solid var(--b1)",
        background: tab===id ? (ESTADOS[id]?.bg || "var(--s2)") : "transparent",
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

  const ActaCard = ({ acta }) => {
    const st = ESTADOS[acta.estado];
    const next = nextAction(acta);
    const totalBienes = acta.bienes?.reduce((s,b)=>s+(parseInt(b.cantidad)||0),0)||0;
    const lotesDeEstaActa = (dbLotes||[]).filter(l=>l.acta_id===acta.id);
    return (
      <div
        style={{ background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:12, padding:"1rem 1.1rem", display:"flex", flexDirection:"column", gap:8, cursor:"pointer" }}
        onClick={() => abrirDetalle(acta)}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:".9rem", color:"var(--fgp)" }}>{acta.deudor_nombre}</div>
            <div style={{ fontSize:".78rem", color:"var(--mu)", marginTop:2 }}>Rol: <b style={{color:"var(--fgp)"}}>{acta.rol_causa}</b></div>
          </div>
          <span style={{ background:st.bg, color:st.color, borderRadius:20, padding:"3px 10px", fontSize:".72rem", fontWeight:700, whiteSpace:"nowrap" }}>{st.label}</span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:".76rem", color:"var(--mu)" }}>
          <span>{acta.juzgado || "—"}</span>
          <span>{totalBienes} bien{totalBienes!==1?"es":""}</span>
          <span>{acta.liquidador_nombre || "—"}</span>
          <span>{bodegaNombre(acta.bodega_id)}</span>
          {acta.fecha_entrega_esperada && <span style={{color:"#f59e0b",fontWeight:600}}>Esperado: {fmtDate(acta.fecha_entrega_esperada)}</span>}
          {acta.fecha_recepcion && <span style={{color:"#10b981"}}>Recibido: {fmtDateTime(acta.fecha_recepcion)}</span>}
          {acta.acta_url && <span style={{color:"var(--ac)"}}>Archivo adjunto</span>}
          {acta.firma_url && <span style={{color:"#10b981", fontWeight:600}}>Firmado por deudor</span>}
          {lotesDeEstaActa.length > 0 && <span style={{color:"#8b5cf6"}}>{lotesDeEstaActa.length} lote{lotesDeEstaActa.length!==1?"s":""} creado{lotesDeEstaActa.length!==1?"s":""}</span>}
        </div>

        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }} onClick={e=>e.stopPropagation()}>
          {next && (
            <button onClick={() => setConfirm({ acta, action: next })}
              style={{ padding:"5px 14px", borderRadius:8, border:"none", background:next.color, color:"#fff", fontSize:".76rem", fontWeight:600, cursor:"pointer" }}>
              {next.label}
            </button>
          )}
          {acta.estado === "recepcionada" && acta.bienes?.some(b=>b.descripcion?.trim()) && !lotesDeEstaActa.length && (
            <button onClick={() => abrirCrearLotes(acta)}
              style={{ padding:"5px 14px", borderRadius:8, border:"1px solid #8b5cf6", background:"transparent", color:"#8b5cf6", fontSize:".76rem", fontWeight:600, cursor:"pointer" }}>
              + Crear Lotes
            </button>
          )}
          {acta.estado === "enviada_victor" && (
            <div style={{ fontSize:".72rem", color:"#8b5cf6", fontWeight:600, padding:"5px 0" }}>Enviada {fmtDateTime(acta.fecha_enviada_victor)}</div>
          )}
        </div>
      </div>
    );
  };

  // ── Modal crear lotes ─────────────────────────────────────────────
  const ModalCrearLotes = () => (
    <div className="modal-overlay" onClick={() => setModalLotes(null)}>
      <div className="modal" style={{ maxWidth:620, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Crear lotes desde acta</span>
          <button className="modal-close" onClick={()=>setModalLotes(null)}>✕</button>
        </div>
        <div style={{ padding:"0 1.2rem 1.2rem", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"var(--s1)", border:"1px solid var(--b1)", borderRadius:8, padding:"10px 14px", fontSize:".8rem", color:"var(--mu)" }}>
            <b style={{color:"var(--fgp)"}}>{modalLotes?.deudor_nombre}</b> — Rol {modalLotes?.rol_causa}<br/>
            Los lotes se crearán en estado <b>"Pendiente Revisión"</b> y aparecerán en la sección Revisión de Lotes. Agrega el precio base si lo tienes, puede completarse después.
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {lotesBienes.map((b, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--s2)", border:"1px solid var(--b1)", borderRadius:8, padding:"10px 12px" }}>
                <input type="checkbox" checked={b.checked}
                  onChange={e => setLotesBienes(p=>p.map((x,j)=>j===i?{...x,checked:e.target.checked}:x))}
                  style={{ width:16, height:16, accentColor:"var(--ac)", cursor:"pointer", flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:".82rem", color:"var(--fgp)" }}>{b.descripcion}</div>
                  <div style={{ fontSize:".72rem", color:"var(--mu)" }}>{b.tipo} · {b.cantidad} unid. · {b.estado}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                  <label style={{ fontSize:".68rem", color:"var(--mu)" }}>Precio base</label>
                  <input
                    className="fi"
                    value={b.base}
                    onChange={e => setLotesBienes(p=>p.map((x,j)=>j===i?{...x,base:e.target.value}:x))}
                    placeholder="$ 0"
                    style={{ width:110, textAlign:"right", fontSize:".8rem" }}
                    disabled={!b.checked}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-primary" onClick={crearLotes} disabled={creandoLotes} style={{ fontSize:".8rem" }}>
              {creandoLotes ? "Creando lotes..." : `Crear ${lotesBienes.filter(b=>b.checked).length} lote${lotesBienes.filter(b=>b.checked).length!==1?"s":""}`}
            </button>
            <button className="btn-secondary" onClick={()=>setModalLotes(null)} style={{ fontSize:".8rem" }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Modal formulario acta ─────────────────────────────────────────
  const ModalForm = () => {
    const isEditing = modal && modal !== "nueva";
    const lotesDeEstaActa = isEditing ? (dbLotes||[]).filter(l=>l.acta_id===modal.id) : [];
    return (
      <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal" style={{ maxWidth:680, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{isEditing ? `Acta — ${modal.rol_causa}` : "Nueva Acta de Entrega"}</span>
            <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
          </div>

          {isEditing && (
            <div style={{ padding:"0 1.2rem .6rem", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              {FLUJO.map((e,i) => (
                <React.Fragment key={e}>
                  <span style={{ padding:"3px 10px", borderRadius:20, fontSize:".72rem", fontWeight:700, background:ESTADOS[e].bg, color:ESTADOS[e].color, border:modal.estado===e?`2px solid ${ESTADOS[e].color}`:"1px solid transparent" }}>
                    {ESTADOS[e].label}
                  </span>
                  {i < FLUJO.length-1 && <span style={{color:"var(--mu)"}}>→</span>}
                </React.Fragment>
              ))}
            </div>
          )}

          <div style={{ padding:"0 1.2rem 1.2rem", display:"flex", flexDirection:"column", gap:".9rem" }}>

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
                  <input className="fi" value={form.juzgado} onChange={e=>setF("juzgado",e.target.value)} placeholder="2º Juzgado Civil de Viña del Mar"/>
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

            {/* Archivo adjunto */}
            <Section title="Acta Original (archivo)">
              <div style={{ fontSize:".76rem", color:"var(--mu)", marginBottom:4 }}>
                Sube el PDF o Word que envió el liquidador. Funciona con cualquier formato.
              </div>
              {isEditing && modal.acta_url && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:".78rem", color:"var(--ac)" }}>Archivo actual:</span>
                  <a href={modal.acta_url} target="_blank" rel="noreferrer"
                    style={{ fontSize:".78rem", color:"var(--ac)", textDecoration:"underline" }}>
                    Ver acta
                  </a>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setUploadFile(e.target.files[0] || null)}
                style={{ fontSize:".78rem", color:"var(--fgp)" }}
              />
              {uploadFile && <div style={{ fontSize:".74rem", color:"#10b981" }}>✓ {uploadFile.name}</div>}
            </Section>

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

            <Section title="Inventario de Bienes">
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 2fr 90px auto", gap:6 }}>
                  <span style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", padding:"0 4px" }}>TIPO</span>
                  <span style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", textAlign:"center" }}>CANT.</span>
                  <span style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", padding:"0 4px" }}>DESCRIPCIÓN</span>
                  <span style={{ fontSize:".68rem", fontWeight:700, color:"var(--mu)", textAlign:"center" }}>ESTADO</span>
                  <span/>
                </div>
                {form.bienes.map((b,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 60px 2fr 90px auto", gap:6, alignItems:"center" }}>
                    <select className="fi" value={b.tipo} onChange={e=>setBien(i,"tipo",e.target.value)} style={{fontSize:".76rem"}}>
                      {TIPOS_BIEN.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <input className="fi" type="number" min={1} value={b.cantidad} onChange={e=>setBien(i,"cantidad",e.target.value)} style={{textAlign:"center"}}/>
                    <input className="fi" value={b.descripcion} onChange={e=>setBien(i,"descripcion",e.target.value)} placeholder="Descripción del bien"/>
                    <select className="fi" value={b.estado} onChange={e=>setBien(i,"estado",e.target.value)} style={{fontSize:".76rem"}}>
                      {["Bueno","Regular","Malo","Sin estado"].map(s=><option key={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>removeBien(i)} style={{ background:"transparent", border:"none", color:"var(--mu)", cursor:"pointer", fontSize:"1rem", padding:"0 4px" }}>✕</button>
                  </div>
                ))}
                <button onClick={addBien} style={{ alignSelf:"flex-start", padding:"4px 12px", borderRadius:6, border:"1px dashed var(--b1)", background:"transparent", color:"var(--mu2)", fontSize:".76rem", cursor:"pointer" }}>
                  + Agregar bien
                </button>
              </div>
            </Section>

            <Section title="Documentos Entregados">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                {[
                  ["doc_cedula","Cédula de Identidad"],
                  ["doc_afp","Certificado AFP"],
                  ["doc_boleta_honorarios","Boleta de Honorarios"],
                  ["doc_anotaciones_vigentes","Cert. Anotaciones Vigentes"],
                  ["doc_liquidaciones_sueldo","Liquidaciones de Sueldo"],
                  ["doc_contrato_trabajo","Contrato de Trabajo"],
                  ["doc_carpeta_tributaria","Carpeta Tributaria"],
                ].map(([k,label]) => (
                  <label key={k} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:".8rem", color:"var(--fgp)" }}>
                    <input type="checkbox" checked={form[k]||false} onChange={e=>setF(k,e.target.checked)} style={{ width:15, height:15, accentColor:"var(--ac)", cursor:"pointer" }}/>
                    {label}
                  </label>
                ))}
              </div>
              <Field label="Otros documentos">
                <input className="fi" value={form.doc_otros||""} onChange={e=>setF("doc_otros",e.target.value)} placeholder="Ej: poder notarial..."/>
              </Field>
            </Section>

            <Section title="Notas Internas">
              <textarea className="fi" value={form.notas||""} onChange={e=>setF("notas",e.target.value)} placeholder="Observaciones del equipo..." rows={3} style={{resize:"vertical"}}/>
            </Section>

            <Section title="Firma del Deudor">
              <div style={{ fontSize:".76rem", color:"var(--mu)", marginBottom:4 }}>
                El deudor firma en pantalla al momento de la entrega.
              </div>
              <FirmaCanvas
                firmaUrl={form.firma_url || null}
                onConfirm={firmaConfirmEntrega}
                onBorrar={firmaBorrarEntrega}
              />
            </Section>

            {isEditing && (
              <div style={{ background:"var(--s1)", border:"1px solid var(--b1)", borderRadius:8, padding:"10px 14px", fontSize:".76rem", color:"var(--mu)" }}>
                <b style={{color:"var(--fgp)"}}>Historial</b>
                <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
                  <span>Creada: {fmtDateTime(modal.created_at)}</span>
                  {modal.fecha_recepcion && <span>Recepcionada: {fmtDateTime(modal.fecha_recepcion)} por <b>{modal.recepcionado_por}</b></span>}
                  {modal.fecha_enviada_victor && <span>Enviada: {fmtDateTime(modal.fecha_enviada_victor)}</span>}
                  {lotesDeEstaActa.length > 0 && (
                    <span>Lotes creados: <b>{lotesDeEstaActa.map(l=>l.codigo||l.nombre).join(", ")}</b></span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:8, justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-primary" onClick={guardar} disabled={saving||uploading} style={{ fontSize:".8rem" }}>
                  {saving||uploading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear Acta"}
                </button>
                <button className="btn-secondary" onClick={()=>setModal(null)} style={{ fontSize:".8rem" }}>Cancelar</button>
              </div>
              {isEditing && (
                <div style={{ display:"flex", gap:8 }}>
                  {isEditing && modal.estado==="recepcionada" && modal.bienes?.some(b=>b.descripcion?.trim()) && (
                    <button onClick={()=>{ setModal(null); abrirCrearLotes(modal); }}
                      style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #8b5cf6", background:"transparent", color:"#8b5cf6", fontSize:".76rem", cursor:"pointer" }}>
                      + Crear Lotes
                    </button>
                  )}
                  {FLUJO.indexOf(modal.estado) > 0 && (
                    <button onClick={()=>retrocederEstado(modal)} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--b1)", background:"transparent", color:"var(--mu)", fontSize:".76rem", cursor:"pointer" }}>
                      ← Revertir
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

  return (
    <div className="page">
      {/* Confirm */}
      {confirm && (
        <div className="modal-overlay" onClick={()=>setConfirm(null)}>
          <div className="modal" style={{ maxWidth:400, padding:"1.4rem" }} onClick={e=>e.stopPropagation()}>
            {confirm.action === "eliminar" ? (
              <>
                <div style={{ fontWeight:700, fontSize:".92rem", marginBottom:8 }}>¿Eliminar acta?</div>
                <div style={{ fontSize:".82rem", color:"var(--mu)", marginBottom:16 }}>
                  Se eliminará el acta de <b>{confirm.acta.deudor_nombre}</b> (Rol {confirm.acta.rol_causa}). No se puede deshacer.
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
                    Se registrará la recepción ahora. Después podrás crear los lotes directamente desde esta acta.
                  </div>
                )}
                {confirm.action.estado === "enviada_victor" && (
                  <div style={{ background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:8, padding:"10px 12px", fontSize:".8rem", color:"#4c1d95", marginBottom:12 }}>
                    Se marcará como enviada para coordinar la fecha del remate.
                  </div>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-primary" style={{ background:confirm.action.color, fontSize:".8rem" }} onClick={()=>avanzarEstado(confirm.acta, confirm.action.estado)}>
                    {confirm.action.label}
                  </button>
                  <button className="btn-secondary" style={{ fontSize:".8rem" }} onClick={()=>setConfirm(null)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalLotes && <ModalCrearLotes/>}
      {modal && <ModalForm/>}

      {/* Header */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:"1rem" }}>
        <input className="fi" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar Rol, Deudor o Liquidador..."
          style={{ maxWidth:280, fontSize:".82rem" }}/>
        {!isBodegaAdmin && (
          <select className="fi" value={filtBodega} onChange={e=>setFiltBodega(e.target.value)} style={{ maxWidth:180, fontSize:".82rem" }}>
            <option value="all">Todas las bodegas</option>
            {dbBodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        )}
        <div style={{ marginLeft:"auto" }}>
          <button className="btn-primary" onClick={abrirNueva} style={{ fontSize:".8rem" }}>+ Nueva Acta</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.2rem" }}>
        <TabBtn id="pendiente"       label="Por Llegar"/>
        <TabBtn id="por_recepcionar" label="Por Recepcionar"/>
        <TabBtn id="recepcionada"    label="Recepcionadas"/>
        <TabBtn id="enviada_victor"  label="Enviadas"/>
        <TabBtn id="todas"           label="Todas"/>
      </div>

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
