'use client'
import React from "react";

const PLANES = {
  trial:       { label: "Trial",       color: "#f6ad55", bg: "rgba(246,173,85,.1)",  precio: "Gratis" },
  basico:      { label: "Básico",      color: "#38B2F6", bg: "rgba(56,178,246,.1)",  precio: "$29.990/mes" },
  profesional: { label: "Profesional", color: "#14B8A6", bg: "rgba(20,184,166,.1)",  precio: "$59.990/mes" },
  enterprise:  { label: "Enterprise",  color: "#a78bfa", bg: "rgba(167,139,250,.1)", precio: "A convenir" },
};
const ESTADOS = {
  activo:     { label: "Activo",     color: "var(--gr)", bg: "rgba(20,184,166,.1)" },
  suspendido: { label: "Suspendido", color: "var(--yl)", bg: "rgba(246,173,85,.1)" },
  bloqueado:  { label: "Bloqueado",  color: "var(--rd)", bg: "rgba(224,82,82,.1)" },
};
const diasRestantes = (fecha) => {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
};

export default function PageLicencias({ dbLicencias, actualizarLicencia, renovarLicencia, cambiarPlan, guardarNota }) {
  return (
    <div className="page">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {dbLicencias.map(casa => {
          const plan    = PLANES[casa.licencia_plan]    || PLANES.trial;
          const estado  = ESTADOS[casa.licencia_estado] || ESTADOS.activo;
          const dias    = diasRestantes(casa.licencia_vence);
          const vencida    = dias !== null && dias < 0;
          const porVencer  = dias !== null && dias >= 0 && dias <= 7;
          return (
            <div key={casa.id} style={{ background: "var(--s2)", border: `1px solid ${vencida ? "rgba(224,82,82,.3)" : porVencer ? "rgba(246,173,85,.3)" : "var(--b1)"}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.2rem", borderBottom: "1px solid var(--b1)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: plan.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={plan.color} strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="4" width="14" height="11" rx="2"/><path d="M6 4V3a3 3 0 016 0v1"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: ".9rem", color: "var(--wh2)" }}>{casa.nombre}</div>
                  <div style={{ fontSize: ".7rem", color: "var(--mu2)", marginTop: ".1rem" }}>{casa.email || "sin email"}</div>
                </div>
                <span style={{ fontSize: ".68rem", fontWeight: 700, padding: ".25rem .65rem", borderRadius: 20, background: estado.bg, color: estado.color }}>{estado.label}</span>
                <span style={{ fontSize: ".68rem", fontWeight: 700, padding: ".25rem .65rem", borderRadius: 20, background: plan.bg, color: plan.color }}>{plan.label}</span>
              </div>
              <div style={{ padding: "1rem 1.2rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "1rem", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: ".65rem", color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".25rem" }}>Vence</div>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, color: vencida ? "var(--rd)" : porVencer ? "var(--yl)" : "var(--wh2)" }}>
                    {casa.licencia_vence ? new Date(casa.licencia_vence).toLocaleDateString("es-CL") : "—"}
                  </div>
                  <div style={{ fontSize: ".65rem", color: vencida ? "var(--rd)" : porVencer ? "var(--yl)" : "var(--mu)" }}>
                    {dias === null ? "—" : vencida ? `Venció hace ${Math.abs(dias)} días` : dias === 0 ? "Vence hoy" : `${dias} días restantes`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: ".65rem", color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".25rem" }}>Plan</div>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--wh2)" }}>{plan.precio}</div>
                  <div style={{ fontSize: ".65rem", color: "var(--mu)" }}>{plan.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: ".65rem", color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".25rem" }}>Límites</div>
                  <div style={{ fontSize: ".75rem", color: "var(--wh2)" }}>{casa.max_usuarios || 3} usuarios · {casa.max_remates || 5} remates</div>
                  <div style={{ fontSize: ".65rem", color: "var(--mu)" }}>activos simultáneos</div>
                </div>
                <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {casa.licencia_estado !== "activo" && (
                    <button className="btn-confirm" style={{ fontSize: ".68rem", padding: ".3rem .7rem", background: "rgba(20,184,166,.12)", color: "var(--gr)", border: "1px solid rgba(20,184,166,.3)" }}
                      onClick={() => actualizarLicencia(casa.id, "activo")}>✓ Activar</button>
                  )}
                  {casa.licencia_estado === "activo" && (
                    <button className="btn-sec" style={{ fontSize: ".68rem", padding: ".3rem .7rem", color: "var(--yl)", border: "1px solid rgba(246,173,85,.3)" }}
                      onClick={() => actualizarLicencia(casa.id, "suspendido")}>⏸ Suspender</button>
                  )}
                  {casa.licencia_estado !== "bloqueado" && (
                    <button style={{ fontSize: ".68rem", padding: ".3rem .7rem", background: "rgba(224,82,82,.08)", border: "1px solid rgba(224,82,82,.25)", borderRadius: 6, color: "var(--rd)", cursor: "pointer" }}
                      onClick={() => { if (window.confirm(`¿Bloquear acceso a ${casa.nombre}?`)) actualizarLicencia(casa.id, "bloqueado"); }}>
                      🔒 Bloquear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding: ".75rem 1.2rem", background: "rgba(255,255,255,.01)", borderTop: "1px solid var(--b1)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: ".7rem", color: "var(--mu)" }}>Renovar hasta:</span>
                <input type="date" defaultValue={casa.licencia_vence || ""}
                  style={{ padding: ".3rem .6rem", background: "var(--s3)", border: "1px solid var(--b2)", borderRadius: 6, color: "var(--wh2)", fontSize: ".73rem", fontFamily: "Inter,sans-serif" }}
                  onChange={e => renovarLicencia(casa.id, e.target.value)} />
                <span style={{ fontSize: ".7rem", color: "var(--mu)" }}>Plan:</span>
                <select defaultValue={casa.licencia_plan || "trial"}
                  style={{ padding: ".3rem .6rem", background: "var(--s3)", border: "1px solid var(--b2)", borderRadius: 6, color: "var(--wh2)", fontSize: ".73rem", fontFamily: "Inter,sans-serif", cursor: "pointer" }}
                  onChange={e => cambiarPlan(casa.id, e.target.value)}>
                  {Object.entries(PLANES).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.precio}</option>)}
                </select>
                {casa.notas_admin !== undefined && (
                  <input placeholder="Notas internas..." defaultValue={casa.notas_admin || ""}
                    style={{ flex: 1, minWidth: 160, padding: ".3rem .6rem", background: "var(--s3)", border: "1px solid var(--b2)", borderRadius: 6, color: "var(--wh2)", fontSize: ".73rem", fontFamily: "Inter,sans-serif" }}
                    onBlur={e => guardarNota(casa.id, e.target.value)} />
                )}
              </div>
            </div>
          );
        })}
        {dbLicencias.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--mu)", fontSize: ".8rem" }}>
            No hay casas de remates registradas aún.
          </div>
        )}
      </div>
    </div>
  );
}
