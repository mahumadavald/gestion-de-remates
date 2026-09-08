'use client'
import React, { useState } from "react";

export default function PageBodegas({ session, supabase, dbBodegas, setDbBodegas, dbLotes, usuarios, notify }) {
  const [bodegaForm, setBodegaForm] = useState({ id: null, nombre: "", ciudad: "", activa: true });
  const [bodegaModal, setBodegaModal] = useState(false);

  const cerrarModal = () => {
    setBodegaModal(false);
    setBodegaForm({ id: null, nombre: "", ciudad: "", activa: true });
  };

  const guardarBodega = async () => {
    if (!bodegaForm.nombre.trim()) { notify("Ingresa el nombre de la bodega.", "inf"); return; }
    if (bodegaForm.id) {
      const { error } = await supabase.from("bodegas").update({
        nombre: bodegaForm.nombre.trim(),
        ciudad: bodegaForm.ciudad.trim() || null,
        activa: bodegaForm.activa,
      }).eq("id", bodegaForm.id);
      if (error) { notify("Error: " + error.message, "inf"); return; }
      setDbBodegas(prev => prev.map(b => b.id === bodegaForm.id
        ? { ...b, nombre: bodegaForm.nombre.trim(), ciudad: bodegaForm.ciudad.trim() || null, activa: bodegaForm.activa }
        : b));
      notify("Bodega actualizada.", "sold");
    } else {
      const { data, error } = await supabase.from("bodegas").insert({
        nombre:  bodegaForm.nombre.trim(),
        ciudad:  bodegaForm.ciudad.trim() || null,
        activa:  true,
        casa_id: session?.casaId || null,
      }).select().single();
      if (error) { notify("Error: " + error.message, "inf"); return; }
      setDbBodegas(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      notify("Bodega creada.", "sold");
    }
    cerrarModal();
  };

  const toggleActiva = async (b) => {
    const { error } = await supabase.from("bodegas").update({ activa: !b.activa }).eq("id", b.id);
    if (!error) setDbBodegas(prev => prev.map(x => x.id === b.id ? { ...x, activa: !b.activa } : x));
    else notify("Error: " + error.message, "inf");
  };

  const seedBodegas = async () => {
    const seeds = [
      { nombre: "MALLOA",     ciudad: "Malloa, VI Región" },
      { nombre: "QUILPUÉ",    ciudad: "Quilpué, V Región" },
      { nombre: "SANTIAGO",   ciudad: "Santiago, RM" },
      { nombre: "CONCEPCIÓN", ciudad: "Concepción, VIII Región" },
    ];
    const rows = seeds.map(s => ({ ...s, activa: true, casa_id: session.casaId }));
    const { data, error } = await supabase.from("bodegas").insert(rows).select();
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbBodegas(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    notify("4 bodegas creadas.", "sold");
  };

  return (
    <div className="page">
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">Bodegas ({dbBodegas.length})</div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            {dbBodegas.length === 0 && session?.casa === "rematesahumada" && (
              <button className="btn-sec" style={{ fontSize: ".76rem" }} onClick={seedBodegas}>⚡ Cargar mis bodegas</button>
            )}
            <button className="btn-primary" onClick={() => { setBodegaForm({ id: null, nombre: "", ciudad: "", activa: true }); setBodegaModal(true); }}>+ Nueva bodega</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>Ciudad</th>
                <th style={{ textAlign: "center" }}>Estado</th>
                <th style={{ textAlign: "center" }}>Usuarios</th>
                <th style={{ textAlign: "center" }}>Lotes</th>
                <th style={{ textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {dbBodegas.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--mu)", padding: "2rem", fontSize: ".8rem" }}>
                  No hay bodegas. Crea la primera con el botón de arriba.
                </td></tr>
              ) : dbBodegas.map(b => {
                const usuariosB = usuarios.filter(u => u.bodegaId === b.id);
                const lotesB    = dbLotes.filter(l => l.bodega_id === b.id);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: "var(--wh2)" }}>{b.nombre}</td>
                    <td style={{ color: "var(--mu2)" }}>{b.ciudad || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        background: b.activa ? "rgba(20,184,166,.12)" : "rgba(100,100,100,.1)",
                        color: b.activa ? "var(--gr)" : "var(--mu)",
                        border: `1px solid ${b.activa ? "rgba(20,184,166,.3)" : "rgba(100,100,100,.2)"}` }}>
                        {b.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--ac)", fontFamily: "Inter,sans-serif" }}>{usuariosB.length}</span>
                      {usuariosB.length > 0 && (
                        <div style={{ fontSize: ".65rem", color: "var(--mu)", marginTop: 2 }}>
                          {usuariosB.slice(0, 2).map(u => u.nombre).join(", ")}{usuariosB.length > 2 ? ` +${usuariosB.length - 2}` : ""}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "var(--ac)", fontFamily: "Inter,sans-serif" }}>{lotesB.length}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn-sec" style={{ fontSize: ".68rem", padding: ".2rem .65rem" }}
                        onClick={() => { setBodegaForm({ id: b.id, nombre: b.nombre, ciudad: b.ciudad || "", activa: b.activa }); setBodegaModal(true); }}>Editar</button>
                      <button className="btn-sec" style={{ fontSize: ".68rem", padding: ".2rem .65rem", marginTop: 3,
                        background: b.activa ? "rgba(224,82,82,.06)" : "rgba(20,184,166,.06)",
                        color: b.activa ? "var(--rd)" : "var(--gr)",
                        borderColor: b.activa ? "rgba(224,82,82,.25)" : "rgba(20,184,166,.25)" }}
                        onClick={() => toggleActiva(b)}>{b.activa ? "Desactivar" : "Activar"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {bodegaModal && (
        <div className="ov" onClick={cerrarModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-title">{bodegaForm.id ? "Editar bodega" : "Nueva bodega"}</div>
            <div className="form-grid">
              <div className="fg full">
                <label className="fl">Nombre *</label>
                <input className="fi" placeholder="MALLOA" value={bodegaForm.nombre}
                  onChange={e => setBodegaForm(f => ({ ...f, nombre: e.target.value.toUpperCase() }))}
                  style={{ textTransform: "uppercase", fontWeight: 700 }} />
              </div>
              <div className="fg full">
                <label className="fl">Ciudad</label>
                <input className="fi" placeholder="Malloa, VI Región" value={bodegaForm.ciudad}
                  onChange={e => setBodegaForm(f => ({ ...f, ciudad: e.target.value }))} />
              </div>
              {bodegaForm.id && (
                <div className="fg full" style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <label className="fl" style={{ margin: 0 }}>Activa</label>
                  <div onClick={() => setBodegaForm(f => ({ ...f, activa: !f.activa }))}
                    style={{ width: 40, height: 22, borderRadius: 11, background: bodegaForm.activa ? "var(--gr)" : "var(--b2)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: bodegaForm.activa ? 20 : 4, transition: "left .2s" }} />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-sec" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-confirm" onClick={guardarBodega}>{bodegaForm.id ? "Guardar cambios" : "Crear bodega"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
