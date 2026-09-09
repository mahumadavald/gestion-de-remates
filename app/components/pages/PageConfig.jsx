'use client'
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PageConfig({ session, notify }) {
  const [gastoMotorizado, setGastoMotorizado] = useState(
    session?.gastoAdminMotorizado != null ? String(session.gastoAdminMotorizado) : "72000"
  );

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
            <input className="fi" defaultValue={session?.name || ""} placeholder="Tu nombre" />
          </div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Correo electrónico</label>
            <input className="fi" defaultValue={session?.email || ""} placeholder="correo@ejemplo.cl" type="email" />
          </div>
          <div className="fg" style={{ marginBottom: "1rem" }}>
            <label className="fl">Rol</label>
            <input className="fi" value={session?.role === "admin" ? "Administrador" : "Martillero"} readOnly style={{ opacity: .7, cursor: "default" }} />
          </div>
          <button className="btn-primary" style={{ fontSize: ".78rem" }} onClick={() => notify("Perfil actualizado.")}>Guardar cambios</button>
        </div>
        <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.1rem 1.2rem" }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "1rem" }}>Cambiar contraseña</div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Contraseña actual</label>
            <input className="fi" type="password" placeholder="••••••••" />
          </div>
          <div className="fg" style={{ marginBottom: ".7rem" }}>
            <label className="fl">Nueva contraseña</label>
            <input className="fi" type="password" placeholder="••••••••" />
          </div>
          <div className="fg" style={{ marginBottom: "1rem" }}>
            <label className="fl">Confirmar nueva contraseña</label>
            <input className="fi" type="password" placeholder="••••••••" />
          </div>
          <button className="btn-primary" style={{ fontSize: ".78rem" }} onClick={() => notify("Contraseña actualizada.")}>Actualizar contraseña</button>
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
