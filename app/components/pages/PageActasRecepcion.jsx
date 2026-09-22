'use client'
import React, { useState, useMemo } from "react";

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS = {
  borrador:    { label: "Borrador",      color: "#f59e0b", bg: "#fef3c7" },
  enviada:     { label: "Enviada",       color: "#8b5cf6", bg: "#ede9fe" },
  lote_creado: { label: "Lote creado",   color: "#10b981", bg: "#d1fae5" },
};

const DOCS = [
  { key: "permiso_circulacion", label: "Permiso de Circulación" },
  { key: "seguro_obligatorio",  label: "Seguro Obligatorio" },
  { key: "revision_tecnica",    label: "Revisión Técnica" },
  { key: "cert_inscripcion",    label: "Cert. de Inscripción" },
];

// Accesorios en 3 columnas (igual que el Word)
const ACCESORIOS_COLS = [
  [
    { key: "parachoques_del",  label: "Parachoques delantero" },
    { key: "espejo_lat_der",   label: "Espejo lateral derecho" },
    { key: "espejo_lat_izq",   label: "Espejo lateral izquierdo" },
    { key: "parachoques_tras", label: "Parachoques trasero" },
    { key: "faroles_del",      label: "Faroles delanteros" },
    { key: "limpiaparabrisas", label: "Limpiaparabrisas" },
    { key: "capot",            label: "Capot" },
    { key: "neblineros",       label: "Neblineros" },
    { key: "llantas",          label: "Llantas" },
    { key: "cinturones",       label: "Cinturones de seguridad" },
    { key: "antena",           label: "Antena" },
    { key: "sensor_retroceso", label: "Sensor de retroceso" },
  ],
  [
    { key: "bateria",          label: "Batería" },
    { key: "parabrisas",       label: "Parabrisas" },
    { key: "parlantes",        label: "Parlantes" },
    { key: "encendedor",       label: "Encendedor" },
    { key: "parasoles",        label: "Parasoles" },
    { key: "funda_asientos",   label: "Funda asientos" },
    { key: "pisos_goma",       label: "Pisos de goma" },
    { key: "extintor",         label: "Extintor" },
    { key: "gata",             label: "Gata" },
    { key: "rueda_repuesto",   label: "Rueda de repuesto" },
    { key: "llave_ruedas",     label: "Llave de ruedas" },
    { key: "tapa_bencina",     label: "Tapa bencina" },
    { key: "otras_herramientas",label: "Otras herramientas" },
  ],
  [
    { key: "cierre_central",   label: "Cierre centralizado" },
    { key: "aire_acond",       label: "Aire acondicionado" },
    { key: "sunroof",          label: "Sunroof" },
    { key: "tercera_luz",      label: "Tercera luz de freno" },
    { key: "reflectantes",     label: "Reflectantes de emergencia" },
    { key: "espejo_retrovisor",label: "Espejo retrovisor" },
    { key: "camara_retroceso", label: "Cámara de retroceso" },
    { key: "cenicero",         label: "Cenicero" },
    { key: "alarma",           label: "Alarma" },
    { key: "radio",            label: "Radio" },
    { key: "parrilla",         label: "Parrilla" },
    { key: "faroles_tras",     label: "Faroles traseros" },
  ],
];

const NIVELES_COMB = ["Vacío", "1/4", "1/2", "3/4", "Lleno"];
const TRANSMISIONES = ["Manual", "Automático"];
const COMBUSTIBLES  = ["Bencina", "Diésel", "Eléctrico", "Gas", "Híbrido"];

const FORM_VACIO = {
  rol: "", caratulado: "", tribunal: "",
  tipo_vehiculo: "", anio_fabricacion: "", ppu: "", marca: "", chasis: "",
  color: "", modelo: "", fecha_llegada: "", combustible_tipo: "", motor_numero: "",
  kilometraje: "", transmision: "",
  documentacion: {},
  accesorios: {},
  estado_neumaticos: "", estado_pintura: "",
  marca_bateria: "", marca_neumaticos: "", nivel_combustible: "",
  observaciones: "", diagrama_daños: "",
  entrega_nombre: "", entrega_rut: "",
  recibe_nombre: "", recibe_rut: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Chip({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.borrador;
  return (
    <span style={{ fontSize: ".68rem", fontWeight: 700, color: e.color,
      background: e.bg, border: `1px solid ${e.color}40`,
      borderRadius: 5, padding: ".18rem .55rem", whiteSpace: "nowrap" }}>
      {e.label}
    </span>
  );
}

function SecTitle({ children }) {
  return (
    <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--mu)",
      textTransform: "uppercase", letterSpacing: ".07em",
      marginBottom: ".8rem", paddingBottom: ".4rem",
      borderBottom: "1px solid var(--b1)" }}>
      {children}
    </div>
  );
}

function Field({ label, children, half }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".25rem",
      gridColumn: half ? "span 1" : "span 2" }}>
      <label style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)" }}>{label}</label>
      {children}
    </div>
  );
}

function fi(extra) {
  return { className: "fi", style: { fontSize: ".82rem", ...extra } };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PageActasRecepcion({ session, supabase, dbActasRecepcion, setDbActasRecepcion, dbLotes, setDbLotes, notify }) {

  const [vista,    setVista]    = useState("lista");   // lista | form
  const [editando, setEditando] = useState(null);      // null = nueva acta
  const [form,     setForm]     = useState(FORM_VACIO);
  const [saving,   setSaving]   = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // ── Navegar a form ──
  const abrirNueva = () => { setForm(FORM_VACIO); setEditando(null); setVista("form"); };
  const abrirEditar = (acta) => { setForm({ ...FORM_VACIO, ...acta }); setEditando(acta); setVista("form"); };
  const volver = () => { setVista("lista"); setEditando(null); };

  // ── Helpers de form ──
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setDoc  = (k, campo, v) => setForm(f => ({ ...f, documentacion: { ...f.documentacion, [k]: { ...(f.documentacion[k]||{}), [campo]: v } } }));
  const setAcc  = (k, v) => setForm(f => ({ ...f, accesorios: { ...f.accesorios, [k]: v } }));

  // ── Guardar acta ──
  const guardar = async () => {
    if (!form.ppu && !form.rol) { notify("Ingresa al menos el ROL o la patente.", "inf"); return; }
    setSaving(true);
    try {
      const payload = {
        casa_id:          session?.casaId || null,
        rol:              form.rol || null,
        caratulado:       form.caratulado || null,
        tribunal:         form.tribunal || null,
        tipo_vehiculo:    form.tipo_vehiculo || null,
        anio_fabricacion: form.anio_fabricacion || null,
        ppu:              form.ppu ? form.ppu.toUpperCase() : null,
        marca:            form.marca || null,
        chasis:           form.chasis || null,
        color:            form.color || null,
        modelo:           form.modelo || null,
        fecha_llegada:    form.fecha_llegada || null,
        combustible_tipo: form.combustible_tipo || null,
        motor_numero:     form.motor_numero || null,
        kilometraje:      form.kilometraje ? parseInt(form.kilometraje) : null,
        transmision:      form.transmision || null,
        documentacion:    form.documentacion,
        accesorios:       form.accesorios,
        estado_neumaticos: form.estado_neumaticos || null,
        estado_pintura:   form.estado_pintura || null,
        marca_bateria:    form.marca_bateria || null,
        marca_neumaticos: form.marca_neumaticos || null,
        nivel_combustible: form.nivel_combustible || null,
        observaciones:    form.observaciones || null,
        diagrama_daños:   form.diagrama_daños || null,
        entrega_nombre:   form.entrega_nombre || null,
        entrega_rut:      form.entrega_rut || null,
        recibe_nombre:    form.recibe_nombre || null,
        recibe_rut:       form.recibe_rut || null,
        estado:           editando?.estado || "borrador",
      };

      let data, error;
      if (editando?.id) {
        ({ data, error } = await supabase.from("actas_recepcion_vehiculos").update(payload).eq("id", editando.id).select().single());
      } else {
        ({ data, error } = await supabase.from("actas_recepcion_vehiculos").insert(payload).select().single());
      }
      if (error) throw error;

      setDbActasRecepcion(prev => {
        if (editando?.id) return prev.map(a => a.id === data.id ? data : a);
        return [data, ...prev];
      });
      setEditando(data);
      notify("Acta guardada.", "sold");
    } catch (e) {
      console.error(e);
      notify("Error al guardar: " + e.message, "inf");
    } finally {
      setSaving(false);
    }
  };

  // ── Enviar a Víctor ──
  const enviarAVictor = async () => {
    if (!editando?.id) { notify("Guarda el acta primero.", "inf"); return; }
    const { data, error } = await supabase
      .from("actas_recepcion_vehiculos")
      .update({ estado: "enviada" })
      .eq("id", editando.id)
      .select().single();
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbActasRecepcion(prev => prev.map(a => a.id === data.id ? data : a));
    setEditando(data);
    notify("Acta marcada como enviada.", "sold");
  };

  // ── Crear lote desde acta ──
  const crearLote = async () => {
    if (!editando?.id) { notify("Guarda el acta primero.", "inf"); return; }
    const { data: remateData } = await supabase
      .from("remates")
      .select("id")
      .eq("casa_id", session?.casaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nombre = [form.marca, form.modelo, form.anio_fabricacion, form.ppu ? `(${form.ppu.toUpperCase()})` : ""].filter(Boolean).join(" ");
    const lotePay = {
      casa_id:   session?.casaId || null,
      nombre:    nombre || "Vehículo sin identificar",
      categoria: "Vehículo",
      expediente: form.rol || null,
      mandante:  form.caratulado || form.tribunal || null,
      anio:      form.anio_fabricacion || null,
      patente:   form.ppu ? form.ppu.toUpperCase() : null,
      estado:    "pendiente_revision",
      descripcion: [
        form.marca && `Marca: ${form.marca}`,
        form.modelo && `Modelo: ${form.modelo}`,
        form.color && `Color: ${form.color}`,
        form.chasis && `Chasis: ${form.chasis}`,
        form.motor_numero && `Motor: ${form.motor_numero}`,
        form.kilometraje && `Km: ${Number(form.kilometraje).toLocaleString("es-CL")}`,
        form.transmision && `Transmisión: ${form.transmision}`,
        form.combustible_tipo && `Combustible: ${form.combustible_tipo}`,
      ].filter(Boolean).join(" · ") || null,
    };

    const { data: lote, error } = await supabase.from("lotes").insert(lotePay).select().single();
    if (error) { notify("Error al crear lote: " + error.message, "inf"); return; }

    // Actualizar el acta con el lote_id y estado
    const { data: actaUpd } = await supabase
      .from("actas_recepcion_vehiculos")
      .update({ lote_id: lote.id, estado: "lote_creado" })
      .eq("id", editando.id)
      .select().single();

    if (actaUpd) {
      setDbActasRecepcion(prev => prev.map(a => a.id === actaUpd.id ? actaUpd : a));
      setEditando(actaUpd);
    }
    if (setDbLotes) setDbLotes(prev => [lote, ...prev]);
    notify(`Lote creado: ${lote.nombre}`, "sold");
  };

  // ── Filtro lista ──
  const actasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    if (!q) return dbActasRecepcion;
    return dbActasRecepcion.filter(a =>
      (a.ppu||"").toLowerCase().includes(q) ||
      (a.rol||"").toLowerCase().includes(q) ||
      (a.marca||"").toLowerCase().includes(q) ||
      (a.modelo||"").toLowerCase().includes(q) ||
      (a.caratulado||"").toLowerCase().includes(q)
    );
  }, [dbActasRecepcion, busqueda]);

  // ── VISTA LISTA ──────────────────────────────────────────────────────────────
  if (vista === "lista") {
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", flexWrap: "wrap", gap: ".6rem" }}>
          <div style={{ fontSize: ".72rem", color: "var(--mu)" }}>
            {dbActasRecepcion.length} acta{dbActasRecepcion.length !== 1 ? "s" : ""} de recepción
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <input className="fi" placeholder="Buscar por patente, ROL, marca..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ fontSize: ".78rem", width: 240 }} />
            <button className="btn-primary" onClick={abrirNueva}>+ Nueva acta</button>
          </div>
        </div>

        {actasFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--mu)" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--mu)" strokeWidth="1.4" style={{ marginBottom: "1rem", opacity: .5 }}>
              <rect x="8" y="4" width="32" height="40" rx="3"/>
              <path d="M16 16h16M16 24h10"/>
            </svg>
            <div style={{ fontSize: ".9rem" }}>No hay actas de recepción</div>
            <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={abrirNueva}>Crear primera acta</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {actasFiltradas.map(acta => (
              <div key={acta.id}
                onClick={() => abrirEditar(acta)}
                style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12,
                  padding: "1rem 1.2rem", cursor: "pointer", transition: "border-color .15s",
                  display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(6,182,212,.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--b1)"}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".25rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--wh2)" }}>
                      {[acta.marca, acta.modelo, acta.anio_fabricacion].filter(Boolean).join(" ") || "Vehículo"}
                    </span>
                    {acta.ppu && (
                      <span style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--ac)",
                        background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.25)",
                        borderRadius: 5, padding: ".15rem .5rem" }}>
                        {acta.ppu.toUpperCase()}
                      </span>
                    )}
                    <Chip estado={acta.estado} />
                  </div>
                  <div style={{ fontSize: ".73rem", color: "var(--mu)" }}>
                    {[acta.rol && `ROL: ${acta.rol}`, acta.caratulado, acta.tribunal].filter(Boolean).join(" · ")}
                  </div>
                  {acta.fecha_llegada && (
                    <div style={{ fontSize: ".69rem", color: "var(--mu)", marginTop: ".15rem" }}>
                      Llegada: {new Date(acta.fecha_llegada + "T12:00:00").toLocaleDateString("es-CL")}
                    </div>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--mu)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M5 3l4 4-4 4"/>
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── VISTA FORMULARIO ─────────────────────────────────────────────────────────
  const docVal = (k, campo) => form.documentacion?.[k]?.[campo] ?? false;
  const accVal = (k) => form.accesorios?.[k] ?? false;
  const estadoActual = editando?.estado || "borrador";

  return (
    <div className="page" style={{ maxWidth: 900 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: ".6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <button onClick={volver} style={{ background: "none", border: "1px solid var(--b1)", borderRadius: 7, padding: ".3rem .7rem", cursor: "pointer", fontSize: ".75rem", color: "var(--mu2)", fontFamily: "Inter,sans-serif" }}>
            ← Volver
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--wh2)" }}>
              {editando ? `${editando.marca || ""} ${editando.modelo || ""} ${editando.ppu ? `· ${editando.ppu.toUpperCase()}` : ""}`.trim() || "Acta de Recepción" : "Nueva Acta de Recepción"}
            </div>
            <div style={{ fontSize: ".7rem", color: "var(--mu)", marginTop: ".1rem" }}>Vehículo motorizado — causa judicial</div>
          </div>
          {editando && <Chip estado={estadoActual} />}
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          {editando?.id && estadoActual === "borrador" && (
            <button className="btn-sec" style={{ fontSize: ".75rem" }} onClick={enviarAVictor}>
              Enviar a Víctor
            </button>
          )}
          {editando?.id && estadoActual !== "lote_creado" && (
            <button className="btn-sec" style={{ fontSize: ".75rem" }} onClick={crearLote}>
              Ingresar lote
            </button>
          )}
          {editando?.id && estadoActual === "lote_creado" && (
            <span style={{ fontSize: ".72rem", color: "#10b981", fontWeight: 600 }}>Lote creado</span>
          )}
          <button className="btn-primary" style={{ fontSize: ".78rem" }} onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar acta"}
          </button>
        </div>
      </div>

      {/* ── Sección 1: Identificación ── */}
      <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.2rem 1.3rem", marginBottom: "1rem" }}>
        <SecTitle>Identificación de la causa</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
          <Field label="ROL" half>
            <input {...fi()} value={form.rol} onChange={e => set("rol", e.target.value)} placeholder="C-1340-2026" />
          </Field>
          <Field label="Tribunal" half>
            <input {...fi()} value={form.tribunal} onChange={e => set("tribunal", e.target.value)} placeholder="Juzgado Civil de..." />
          </Field>
          <Field label="Caratulado">
            <input {...fi()} value={form.caratulado} onChange={e => set("caratulado", e.target.value)} placeholder="Nombre de la causa" />
          </Field>
        </div>
      </div>

      {/* ── Sección 2: Datos del vehículo ── */}
      <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.2rem 1.3rem", marginBottom: "1rem" }}>
        <SecTitle>Datos del vehículo</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
          <Field label="Tipo de vehículo" half>
            <input {...fi()} value={form.tipo_vehiculo} onChange={e => set("tipo_vehiculo", e.target.value)} placeholder="Automóvil, camioneta, moto..." />
          </Field>
          <Field label="Inscripción (P.P.U.)" half>
            <input {...fi()} value={form.ppu} onChange={e => set("ppu", e.target.value.toUpperCase())} placeholder="ABCD12" style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }} />
          </Field>
          <Field label="Marca" half>
            <input {...fi()} value={form.marca} onChange={e => set("marca", e.target.value)} placeholder="Toyota, Chevrolet..." />
          </Field>
          <Field label="Modelo" half>
            <input {...fi()} value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Corolla, Spark..." />
          </Field>
          <Field label="Año fabricación" half>
            <input {...fi()} value={form.anio_fabricacion} onChange={e => set("anio_fabricacion", e.target.value)} placeholder="2018" type="number" />
          </Field>
          <Field label="Color" half>
            <input {...fi()} value={form.color} onChange={e => set("color", e.target.value)} placeholder="Blanco, negro..." />
          </Field>
          <Field label="Chasis N°" half>
            <input {...fi()} value={form.chasis} onChange={e => set("chasis", e.target.value)} placeholder="9BWZZZ..." />
          </Field>
          <Field label="Motor N°" half>
            <input {...fi()} value={form.motor_numero} onChange={e => set("motor_numero", e.target.value)} placeholder="N.° de motor" />
          </Field>
          <Field label="Fecha de llegada" half>
            <input {...fi()} type="date" value={form.fecha_llegada} onChange={e => set("fecha_llegada", e.target.value)} />
          </Field>
          <Field label="Kilometraje de llegada" half>
            <input {...fi()} value={form.kilometraje} onChange={e => set("kilometraje", e.target.value)} placeholder="0" type="number" />
          </Field>
          <Field label="Combustible" half>
            <select {...fi()} value={form.combustible_tipo} onChange={e => set("combustible_tipo", e.target.value)}>
              <option value="">— Seleccionar —</option>
              {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Transmisión" half>
            <select {...fi()} value={form.transmision} onChange={e => set("transmision", e.target.value)}>
              <option value="">— Seleccionar —</option>
              {TRANSMISIONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Sección 3: Estado de la documentación ── */}
      <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.2rem 1.3rem", marginBottom: "1rem" }}>
        <SecTitle>Estado de la documentación</SecTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".8rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--b1)" }}>
                <th style={{ textAlign: "left", padding: ".5rem .6rem", color: "var(--mu)", fontWeight: 700, fontSize: ".68rem", textTransform: "uppercase" }}>Documento</th>
                <th style={{ textAlign: "center", padding: ".5rem .6rem", color: "var(--mu)", fontWeight: 700, fontSize: ".68rem", textTransform: "uppercase", width: 60 }}>Si</th>
                <th style={{ textAlign: "center", padding: ".5rem .6rem", color: "var(--mu)", fontWeight: 700, fontSize: ".68rem", textTransform: "uppercase", width: 60 }}>No</th>
                <th style={{ textAlign: "center", padding: ".5rem .6rem", color: "var(--mu)", fontWeight: 700, fontSize: ".68rem", textTransform: "uppercase", width: 120 }}>Al día / Vencido</th>
              </tr>
            </thead>
            <tbody>
              {DOCS.map((d, i) => (
                <tr key={d.key} style={{ borderBottom: "1px solid var(--b1)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                  <td style={{ padding: ".55rem .6rem", color: "var(--wh2)", fontWeight: 500 }}>{d.label}</td>
                  <td style={{ textAlign: "center", padding: ".55rem .6rem" }}>
                    <input type="checkbox" checked={docVal(d.key, "tiene") === true} onChange={e => setDoc(d.key, "tiene", e.target.checked ? true : null)} />
                  </td>
                  <td style={{ textAlign: "center", padding: ".55rem .6rem" }}>
                    <input type="checkbox" checked={docVal(d.key, "tiene") === false} onChange={e => setDoc(d.key, "tiene", e.target.checked ? false : null)} />
                  </td>
                  <td style={{ textAlign: "center", padding: ".55rem .6rem" }}>
                    {docVal(d.key, "tiene") === true && (
                      <div style={{ display: "flex", gap: ".4rem", justifyContent: "center" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: ".25rem", fontSize: ".72rem", color: "var(--mu2)", cursor: "pointer" }}>
                          <input type="radio" name={`vig_${d.key}`} checked={docVal(d.key, "vigente") === true} onChange={() => setDoc(d.key, "vigente", true)} /> Al día
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: ".25rem", fontSize: ".72rem", color: "var(--mu2)", cursor: "pointer" }}>
                          <input type="radio" name={`vig_${d.key}`} checked={docVal(d.key, "vigente") === false} onChange={() => setDoc(d.key, "vigente", false)} /> Vencido
                        </label>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sección 4: Accesorios y herramientas ── */}
      <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.2rem 1.3rem", marginBottom: "1rem" }}>
        <SecTitle>Accesorios y herramientas</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 1.2rem", overflowX: "auto" }}>
          {ACCESORIOS_COLS.map((col, ci) => (
            <div key={ci}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 .5rem", alignItems: "center", marginBottom: ".2rem" }}>
                <div style={{ fontSize: ".62rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em" }}>Item</div>
                <div style={{ fontSize: ".62rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", width: 22, textAlign: "center" }}>Si</div>
                <div style={{ fontSize: ".62rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", width: 22, textAlign: "center" }}>No</div>
              </div>
              {col.map(acc => (
                <div key={acc.key} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 .5rem", alignItems: "center", padding: ".28rem 0", borderBottom: "1px solid var(--b1)" }}>
                  <span style={{ fontSize: ".75rem", color: "var(--wh2)" }}>{acc.label}</span>
                  <div style={{ width: 22, textAlign: "center" }}>
                    <input type="checkbox" checked={accVal(acc.key) === true} onChange={e => setAcc(acc.key, e.target.checked ? true : accVal(acc.key) === true ? null : null)} onClick={() => setAcc(acc.key, accVal(acc.key) === true ? null : true)} style={{ cursor: "pointer" }} />
                  </div>
                  <div style={{ width: 22, textAlign: "center" }}>
                    <input type="checkbox" checked={accVal(acc.key) === false} onClick={() => setAcc(acc.key, accVal(acc.key) === false ? null : false)} style={{ cursor: "pointer" }} onChange={() => {}} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Sección 5: Estado general ── */}
      <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.2rem 1.3rem", marginBottom: "1rem" }}>
        <SecTitle>Estado general y nivel de combustible</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>

          {/* Estado neumáticos */}
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", marginBottom: ".4rem" }}>Estado neumáticos</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {["Bueno", "Regular", "Malo"].map(v => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".8rem", color: "var(--wh2)", cursor: "pointer" }}>
                  <input type="radio" name="est_neum" checked={form.estado_neumaticos === v} onChange={() => set("estado_neumaticos", v)} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Estado pintura */}
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", marginBottom: ".4rem" }}>Estado pintura</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {["Bueno", "Regular", "Malo"].map(v => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".8rem", color: "var(--wh2)", cursor: "pointer" }}>
                  <input type="radio" name="est_pint" checked={form.estado_pintura === v} onChange={() => set("estado_pintura", v)} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          <Field label="Marca batería" half>
            <input {...fi()} value={form.marca_bateria} onChange={e => set("marca_bateria", e.target.value)} placeholder="Bosch, Willard..." />
          </Field>
          <Field label="Marca neumáticos" half>
            <input {...fi()} value={form.marca_neumaticos} onChange={e => set("marca_neumaticos", e.target.value)} placeholder="Michelin, Bridgestone..." />
          </Field>

          {/* Nivel combustible */}
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", marginBottom: ".4rem" }}>Nivel de combustible</div>
            <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
              {NIVELES_COMB.map(v => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".8rem", color: "var(--wh2)", cursor: "pointer" }}>
                  <input type="radio" name="niv_comb" checked={form.nivel_combustible === v} onChange={() => set("nivel_combustible", v)} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          <Field label="Observaciones">
            <textarea className="fi" value={form.observaciones} onChange={e => set("observaciones", e.target.value)}
              placeholder="Daños, faltantes u observaciones generales..."
              rows={3} style={{ resize: "vertical", fontSize: ".82rem" }} />
          </Field>

          <Field label="Detalle — diagrama de daños">
            <textarea className="fi" value={form.diagrama_daños} onChange={e => set("diagrama_daños", e.target.value)}
              placeholder="Describe la ubicación de cada daño: rayón capot lado conductor, abolladura paragolpe trasero derecho..."
              rows={3} style={{ resize: "vertical", fontSize: ".82rem" }} />
          </Field>
        </div>
      </div>

      {/* ── Sección 6: Firmas ── */}
      <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.2rem 1.3rem", marginBottom: "1.5rem" }}>
        <SecTitle>Firmas</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
          <div>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--ac)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".6rem" }}>Quien entrega</div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              <div>
                <label style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", display: "block", marginBottom: ".25rem" }}>Nombre</label>
                <input {...fi()} value={form.entrega_nombre} onChange={e => set("entrega_nombre", e.target.value)} placeholder="Nombre completo" />
              </div>
              <div>
                <label style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", display: "block", marginBottom: ".25rem" }}>RUT</label>
                <input {...fi()} value={form.entrega_rut} onChange={e => set("entrega_rut", e.target.value)} placeholder="12.345.678-9" />
              </div>
              <div style={{ marginTop: ".5rem", height: 48, borderBottom: "2px solid var(--b2)", display: "flex", alignItems: "flex-end", paddingBottom: ".25rem" }}>
                <span style={{ fontSize: ".65rem", color: "var(--mu)" }}>Firma</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--gr)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".6rem" }}>Quien recibe</div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              <div>
                <label style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", display: "block", marginBottom: ".25rem" }}>Nombre</label>
                <input {...fi()} value={form.recibe_nombre} onChange={e => set("recibe_nombre", e.target.value)} placeholder="Nombre completo" />
              </div>
              <div>
                <label style={{ fontSize: ".69rem", fontWeight: 600, color: "var(--mu2)", display: "block", marginBottom: ".25rem" }}>RUT</label>
                <input {...fi()} value={form.recibe_rut} onChange={e => set("recibe_rut", e.target.value)} placeholder="12.345.678-9" />
              </div>
              <div style={{ marginTop: ".5rem", height: 48, borderBottom: "2px solid var(--b2)", display: "flex", alignItems: "flex-end", paddingBottom: ".25rem" }}>
                <span style={{ fontSize: ".65rem", color: "var(--mu)" }}>Firma</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones finales */}
      <div style={{ display: "flex", gap: ".6rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
        {editando?.id && estadoActual === "borrador" && (
          <button className="btn-sec" onClick={enviarAVictor}>Enviar a Víctor</button>
        )}
        {editando?.id && estadoActual !== "lote_creado" && (
          <button className="btn-sec" onClick={crearLote}>Ingresar lote</button>
        )}
        <button className="btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar acta"}
        </button>
      </div>
    </div>
  );
}
