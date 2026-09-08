'use client'
import React from "react";

export default function PageConfig({ session, notify }) {
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
      </div>
    </div>
  );
}
