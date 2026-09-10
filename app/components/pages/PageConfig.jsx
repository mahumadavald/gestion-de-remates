'use client'
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PageConfig({ session, notify }) {
  const [nombre, setNombre] = useState(session?.name || "");
  const [email, setEmail]   = useState(session?.email || "");
  const [passActual,    setPassActual]    = useState("");
  const [passNueva,     setPassNueva]     = useState("");
  const [passConfirmar, setPassConfirmar] = useState("");
  const [gastoMotorizado, setGastoMotorizado] = useState(
    session?.gastoAdminMotorizado != null ? String(session.gastoAdminMotorizado) : "72000"
  );

  const guardarPerfil = async () => {
    if (!nombre.trim()) { notify("El nombre no puede estar vacío.", "inf"); return; }
    const updates = { nombre: nombre.trim() };
    if (email.trim() && email !== session?.email) updates.email = email.trim();
    const { error } = await supabase.from("usuarios").update(updates).eq("id", session?.id);
    if (error) { notify("Error al guardar: " + error.message, "inf"); return; }
    notify("Perfil actualizado.", "sold");
  };

  const cambiarPassword = async () => {
    if (!passNueva) { notify("Ingresa la nueva contraseña.", "inf"); return; }
    if (passNueva !== passConfirmar) { notify("Las contraseñas no coinciden.", "inf"); return; }
    if (passNueva.length < 6) { notify("La contraseña debe tener al menos 6 caracteres.", "inf"); return; }
    const { error } = await supabase.auth.updateUser({ password: passNueva });
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setPassActual(""); setPassNueva(""); setPassConfirmar("");
    notify("Contraseña actualizada.", "sold");
  };

  const guardarGastoMotorizado = async () => {
    const val = parseInt(gastoMotorizado.replace(/\D/g, ""), 10);
    if (isNaN(val) || val < 0) { notify("Ingresa un monto válido.", "inf"); return; }
    const { error } = await supabase
      .from("casas")
      .update({ gasto_admin_motorizado: val })
      .eq("id", session?.casaId);
    if (error) { notify("Error al guardar: " + error.message, "inf"); return; }
    notify(`Gasto admin motorizado actualizado a $${val.toLocaleString("es-CL")}.`, "sold");
  };

  return (
    <div className="page">
      <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.1rem 1.2rem" }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "1rem" }}>Mi perfil</div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Nombre</label>
            <input className="fi" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Correo electrónico</label>
            <input className="fi" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.cl" type="email" />
          </div>
          <div className="fg" style={{ marginBottom: "1rem" }}>
            <label className="fl">Rol</label>
            <input className="fi" value={session?.role === "admin" ? "Administrador" : "Martillero"} readOnly style={{ opacity: .7, cursor: "default" }} />
          </div>
          <button className="btn-primary" style={{ fontSize: ".78rem" }} onClick={guardarPerfil}>Guardar cambios</button>
        </div>
        <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.1rem 1.2rem" }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "1rem" }}>Cambiar contraseña</div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Contraseña actual</label>
            <input className="fi" type="password" value={passActual} onChange={e => setPassActual(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Nueva contraseña</label>
            <input className="fi" type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="fg" style={{ marginBottom: "1rem" }}>
            <label className="fl">Confirmar nueva contraseña</label>
            <input className="fi" type="password" value={passConfirmar} onChange={e => setPassConfirmar(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn-primary" style={{ fontSize: ".78rem" }} onClick={cambiarPassword}>Actualizar contraseña</button>
        </div>

        {session?.casaId && (
          <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.1rem 1.2rem" }}>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".3rem" }}>Configuración de remates</div>
            <div style={{ fontSize: ".72rem", color: "var(--mu)", marginBottom: "1rem" }}>
              Valores aplicados automáticamente al generar liquidaciones.
            </div>
            <div className="fg" style={{ marginBottom: "1rem" }}>
              <label className="fl">Gastos administrativos — vehículo motorizado (CLP)</label>
              <input
                className="fi"
                value={gastoMotorizado}
                onChange={e => setGastoMotorizado(e.target.value)}
                placeholder="72000"
                type="text"
                inputMode="numeric"
              />
              <div style={{ fontSize: ".68rem", color: "var(--mu)", marginTop: ".3rem" }}>
                Se cobra por cada vehículo motorizado adjudicado. Varía según acuerdo con la casa de remates.
              </div>
            </div>
            <button className="btn-primary" style={{ fontSize: ".78rem" }} onClick={guardarGastoMotorizado}>
              Guardar configuración
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
