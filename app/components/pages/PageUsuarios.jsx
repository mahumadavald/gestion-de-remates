'use client'
import React, { useState } from "react";

const ROLES_DISPONIBLES = ["admin", "martillero", "spotter", "postremate", "garantias", "solo lectura"];

const ROLE_COLOR = {
  "admin":        { bg: "rgba(224,82,82,.12)",  color: "#e05252", border: "rgba(224,82,82,.25)" },
  "martillero":   { bg: "rgba(56,178,246,.12)", color: "#38B2F6", border: "rgba(56,178,246,.25)" },
  "postremate":   { bg: "rgba(20,184,166,.1)",  color: "#14B8A6", border: "rgba(20,184,166,.25)" },
  "garantias":    { bg: "rgba(246,173,85,.12)", color: "#f6ad55", border: "rgba(246,173,85,.25)" },
  "solo lectura": { bg: "rgba(255,255,255,.06)", color: "#5a7fa8", border: "rgba(255,255,255,.1)" },
};

const FORM_INICIAL = { id: null, nombre: "", usuario: "", email: "", pass: "", roles: [], casa: "Remates Ahumada", bodegaId: null, activo: true };

export default function PageUsuarios({ session, supabase, dbBodegas, dbLicencias, usuarios, setUsuarios, notify }) {
  const [usuarioForm, setUsuarioForm] = useState(FORM_INICIAL);
  const [usuarioModal, setUsuarioModal] = useState(false);

  const CASAS_LISTA_REAL = [{ id: null, nombre: "TAKKA (Admin global)" }, ...dbLicencias];
  const resetUsuarioForm = () => setUsuarioForm(FORM_INICIAL);
  const toggleRol = (rol) => setUsuarioForm(f => ({ ...f, roles: f.roles.includes(rol) ? f.roles.filter(r => r !== rol) : [...f.roles, rol] }));

  const guardarUsuario = async () => {
    if (!usuarioForm.nombre || !usuarioForm.email) { notify("Completa nombre y email.", "inf"); return; }
    if (usuarioModal === "crear") {
      if (!usuarioForm.pass || usuarioForm.pass.length < 6) { notify("La contraseña debe tener al menos 6 caracteres.", "inf"); return; }
      const { data: casaData } = await supabase.from("casas").select("id").eq("nombre", usuarioForm.casa).single();
      const res = await fetch("/api/admin/create-user", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: usuarioForm.email, password: usuarioForm.pass, nombre: usuarioForm.nombre, casa_id: casaData?.id || null, bodega_id: usuarioForm.bodegaId || null, roles: usuarioForm.roles, activo: usuarioForm.activo }),
      });
      const result = await res.json();
      if (!res.ok) { notify("Error: " + result.error, "inf"); return; }
      const { data: uList } = await supabase.from("usuarios").select("*, casas(nombre)").order("nombre");
      if (uList) setUsuarios(uList.map(u => ({ id: u.id, nombre: u.nombre, usuario: u.email?.split("@")[0] || "", email: u.email, roles: u.roles || [], casa: u.casas?.nombre || "", activo: u.activo, bodegaId: u.bodega_id || null })));
      notify(`✓ Usuario ${usuarioForm.email} creado correctamente.`, "sold");
    } else {
      const { data: casaData } = await supabase.from("casas").select("id").eq("nombre", usuarioForm.casa).single();
      const { error: uErr } = await supabase.from("usuarios").update({ nombre: usuarioForm.nombre, casa_id: casaData?.id || null, roles: usuarioForm.roles, activo: usuarioForm.activo, bodega_id: usuarioForm.bodegaId || null }).eq("id", usuarioForm.id);
      if (uErr) { notify("Error al actualizar: " + uErr.message, "inf"); return; }
      if (usuarioForm.pass && usuarioForm.pass.length >= 6) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(usuarioForm.email, { redirectTo: `${window.location.origin}/dashboard` });
        if (resetErr) notify("Datos guardados. Error al enviar email de reset: " + resetErr.message, "inf");
        else notify(`Datos guardados. Email enviado a ${usuarioForm.email}.`, "sold");
      } else {
        notify("Usuario actualizado.", "sold");
      }
      setUsuarios(u => u.map(x => x.id === usuarioForm.id ? { ...usuarioForm } : x));
    }
    setUsuarioModal(false); resetUsuarioForm();
  };

  const editarUsuario = (u) => { setUsuarioForm({ ...u, pass: "", bodegaId: u.bodegaId || null }); setUsuarioModal("editar"); };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Eliminar este usuario? No podrá iniciar sesión.")) return;
    const res = await fetch("/api/admin/delete-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const result = await res.json();
    if (!res.ok) { notify("Error al eliminar: " + result.error, "inf"); return; }
    setUsuarios(u => u.filter(x => x.id !== id));
    notify("Usuario eliminado.", "inf");
  };

  const toggleActivo = async (id) => {
    const usr = usuarios.find(u => u.id === id);
    if (!usr) return;
    await supabase.from("usuarios").update({ activo: !usr.activo }).eq("id", id);
    setUsuarios(u => u.map(x => x.id === id ? { ...x, activo: !usr.activo } : x));
  };

  return (
    <div className="page">
      {dbLicencias.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: ".65rem", marginBottom: "1.2rem" }}>
          {usuarios.filter(u => !u.casa).length > 0 && (
            <div style={{ padding: ".75rem 1rem", background: "rgba(224,82,82,.06)", border: "1px solid rgba(224,82,82,.15)", borderRadius: 10 }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--rd)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".4rem" }}>Admin</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--wh2)" }}>{usuarios.filter(u => !u.casa).length}</div>
              <div style={{ fontSize: ".68rem", color: "var(--mu)", marginTop: ".1rem" }}>Sin casa asignada</div>
            </div>
          )}
          {dbLicencias.map(casa => {
            const usrsCasa = usuarios.filter(u => u.casa === casa.nombre);
            return (
              <div key={casa.id} style={{ padding: ".75rem 1rem", background: "rgba(56,178,246,.05)", border: "1px solid rgba(56,178,246,.15)", borderRadius: 10, cursor: "pointer", transition: "border .15s" }}
                onClick={() => { resetUsuarioForm(); setUsuarioForm(f => ({ ...f, casa: casa.nombre })); setUsuarioModal("crear"); }}
                title="Click para crear usuario en esta casa"
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(56,178,246,.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(56,178,246,.15)"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem" }}>
                  <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--ac)", textTransform: "uppercase", letterSpacing: ".05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{casa.nombre}</div>
                  <span style={{ fontSize: ".6rem", padding: ".1rem .35rem", borderRadius: 4, background: "rgba(56,178,246,.12)", color: "var(--ac)", fontWeight: 700 }}>+ Agregar</span>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--wh2)" }}>{usrsCasa.length}</div>
                <div style={{ fontSize: ".68rem", color: "var(--mu)", marginTop: ".1rem" }}>
                  {usrsCasa.length === 0 ? "Sin usuarios aún" : usrsCasa.map(u => u.roles[0] || "—").join(", ")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="table-card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.02)" }}>
              {["Usuario / Email", "Casa asignada", "Roles", "Estado", "Acciones"].map(h => (
                <th key={h} style={{ padding: ".55rem .9rem", textAlign: "left", fontSize: ".65rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid var(--b1)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--mu)", fontSize: ".82rem" }}>
                No hay usuarios. Haz click en una casa de remates arriba para crear uno.
              </td></tr>
            )}
            {usuarios.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.03)", opacity: u.activo ? 1 : .5, transition: "opacity .2s" }}>
                <td style={{ padding: ".65rem .9rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#38B2F6,#14B8A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".68rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {u.nombre?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--wh2)" }}>{u.nombre}</div>
                      <div style={{ fontSize: ".68rem", color: "var(--mu2)", fontFamily: "Inter,sans-serif" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: ".65rem .9rem" }}>
                  {u.casa
                    ? <div style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".2rem .6rem", background: "rgba(56,178,246,.08)", border: "1px solid rgba(56,178,246,.2)", borderRadius: 6 }}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><path d="M2 12V6l5-4 5 4v6"/><path d="M5 12V9h4v3"/></svg>
                        <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--ac)" }}>{u.casa}</span>
                      </div>
                    : <span style={{ fontSize: ".7rem", color: "var(--mu)", fontStyle: "italic" }}>Admin global</span>
                  }
                </td>
                <td style={{ padding: ".65rem .9rem" }}>
                  <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                    {u.roles.map(r => <span key={r} style={{ fontSize: ".6rem", fontWeight: 700, padding: ".1rem .4rem", borderRadius: 4, background: ROLE_COLOR[r]?.bg, color: ROLE_COLOR[r]?.color, border: `1px solid ${ROLE_COLOR[r]?.border}` }}>{r}</span>)}
                    {u.roles.length === 0 && <span style={{ fontSize: ".65rem", color: "var(--mu)" }}>Sin roles</span>}
                  </div>
                </td>
                <td style={{ padding: ".65rem .9rem" }}>
                  <div onClick={() => toggleActivo(u.id)} style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", cursor: "pointer", padding: ".22rem .55rem", borderRadius: 5, background: u.activo ? "rgba(20,184,166,.08)" : "rgba(255,255,255,.04)", border: `1px solid ${u.activo ? "rgba(20,184,166,.2)" : "var(--b2)"}`, transition: "all .15s" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: u.activo ? "var(--gr)" : "var(--mu)" }}/>
                    <span style={{ fontSize: ".65rem", fontWeight: 700, color: u.activo ? "var(--gr)" : "var(--mu)" }}>{u.activo ? "Activo" : "Inactivo"}</span>
                  </div>
                </td>
                <td style={{ padding: ".65rem .9rem" }}>
                  <div style={{ display: "flex", gap: ".4rem" }}>
                    <button className="btn-sec" style={{ fontSize: ".68rem", padding: ".25rem .6rem" }} onClick={() => editarUsuario(u)}>✎ Editar</button>
                    {u.id !== session?.id && (
                      <button style={{ fontSize: ".68rem", padding: ".25rem .6rem", background: "rgba(224,82,82,.08)", border: "1px solid rgba(224,82,82,.2)", borderRadius: 6, color: "var(--rd)", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(224,82,82,.18)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(224,82,82,.08)"}
                        onClick={() => eliminarUsuario(u.id)}>🗑 Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem", padding: ".75rem 1rem", background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 9 }}>
        <div style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".5rem" }}>Permisos por rol</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: ".5rem" }}>
          {[
            { rol: "admin",       desc: "Acceso total al sistema y gestión de usuarios" },
            { rol: "martillero",  desc: "Sala en vivo, lotes, remates y postores" },
            { rol: "postremate",  desc: "Adjudicaciones, liquidaciones y devoluciones" },
            { rol: "garantias",   desc: "Solo módulo de garantías" },
            { rol: "solo lectura",desc: "Ve todo pero no puede modificar nada" },
          ].map(({ rol, desc }) => (
            <div key={rol} style={{ padding: ".5rem .65rem", background: "rgba(255,255,255,.02)", border: `1px solid ${ROLE_COLOR[rol]?.border}`, borderRadius: 7 }}>
              <div style={{ fontSize: ".65rem", fontWeight: 700, color: ROLE_COLOR[rol]?.color, marginBottom: ".2rem" }}>{rol}</div>
              <div style={{ fontSize: ".6rem", color: "var(--mu)", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {usuarioModal && (
        <div className="ov" onClick={() => { setUsuarioModal(false); resetUsuarioForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-title">{usuarioModal === "crear" ? "Nuevo usuario" : "Editar usuario"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginBottom: ".75rem" }}>
              <div style={{ gridColumn: "1/-1" }}><label className="fl">Nombre completo</label><input className="fi" placeholder="Juan Pérez" value={usuarioForm.nombre} onChange={e => setUsuarioForm(f => ({ ...f, nombre: e.target.value }))}/></div>
              <div><label className="fl">Usuario</label><input className="fi" placeholder="jperez" value={usuarioForm.usuario} onChange={e => setUsuarioForm(f => ({ ...f, usuario: e.target.value.toLowerCase().replace(/\s/g, "") }))}/></div>
              <div><label className="fl">Email</label><input className="fi" type="email" placeholder="correo@casa.cl" value={usuarioForm.email} onChange={e => setUsuarioForm(f => ({ ...f, email: e.target.value }))}/></div>
              <div>
                <label className="fl">{usuarioModal === "editar" ? "Enviar reset de contraseña al email" : "Contraseña *"}</label>
                <input className="fi" type="password" placeholder={usuarioModal === "editar" ? "Escribe algo para enviar email de reset" : "Mínimo 6 caracteres"} value={usuarioForm.pass} onChange={e => setUsuarioForm(f => ({ ...f, pass: e.target.value }))}/>
                {usuarioModal === "editar" && usuarioForm.pass && (
                  <div style={{ fontSize: ".68rem", color: "var(--yl)", marginTop: ".3rem" }}>
                    Al guardar se enviará un email de cambio de contraseña a {usuarioForm.email}
                  </div>
                )}
              </div>
              <div>
                <label className="fl">Casa de remates</label>
                <select className="fsel" value={usuarioForm.casa} onChange={e => setUsuarioForm(f => ({ ...f, casa: e.target.value }))}>
                  {CASAS_LISTA_REAL.map(c => <option key={c.id || "admin"} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>
              {dbBodegas.length > 0 && (
                <div>
                  <label className="fl">Bodega asignada</label>
                  <select className="fsel" value={usuarioForm.bodegaId || ""} onChange={e => setUsuarioForm(f => ({ ...f, bodegaId: e.target.value || null }))}>
                    <option value="">— Sin bodega (ve todo) —</option>
                    {dbBodegas.filter(b => b.activa).map(b => <option key={b.id} value={b.id}>{b.nombre}{b.ciudad ? ` — ${b.ciudad}` : ""}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="fl" style={{ marginBottom: ".5rem", display: "block" }}>Roles y accesos</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".4rem" }}>
                {ROLES_DISPONIBLES.map(rol => {
                  const activo = usuarioForm.roles.includes(rol);
                  const c = ROLE_COLOR[rol];
                  return (
                    <div key={rol} onClick={() => toggleRol(rol)}
                      style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".5rem .75rem", borderRadius: 7, cursor: "pointer", background: activo ? c.bg : "rgba(255,255,255,.02)", border: `1px solid ${activo ? c.border : "var(--b2)"}`, transition: "all .15s" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${activo ? c.color : "var(--mu)"}`, background: activo ? c.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {activo && <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M1.5 5l3 3 4-4.5"/></svg>}
                      </div>
                      <span style={{ fontSize: ".75rem", fontWeight: activo ? 700 : 500, color: activo ? c.color : "var(--mu2)" }}>{rol}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-sec" onClick={() => { setUsuarioModal(false); resetUsuarioForm(); }}>Cancelar</button>
              <button className="btn-confirm" onClick={guardarUsuario}>{usuarioModal === "crear" ? "Crear usuario" : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
