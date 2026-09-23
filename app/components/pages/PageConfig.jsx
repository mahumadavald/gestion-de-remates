'use client'
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import FirmaCanvas from "../FirmaCanvas";

export default function PageConfig({ session, notify }) {
  const [nombre, setNombre] = useState(session?.name || "");
  const [email, setEmail]   = useState(session?.email || "");
  const [firmaMartilleroUrl, setFirmaMartilleroUrl] = useState("");
  const [timbreUrl, setTimbreUrl] = useState("");
  const [timbreFile, setTimbreFile] = useState(null);
  const [savingFirma, setSavingFirma] = useState(false);

  useEffect(() => {
    if (!session?.casaId) return;
    supabase.from("casas").select("firma_martillero_url, timbre_url").eq("id", session.casaId).single()
      .then(({ data }) => {
        if (data?.firma_martillero_url) setFirmaMartilleroUrl(data.firma_martillero_url);
        if (data?.timbre_url) setTimbreUrl(data.timbre_url);
      });
  }, [session?.casaId]);
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

  const guardarFirmaTimbre = async (firmaBlobArg) => {
    if (!session?.casaId) return;
    setSavingFirma(true);
    try {
      const updates = {};

      // Subir firma si hay blob nuevo
      if (firmaBlobArg) {
        const path = `config/${session.casaId}_firma_martillero.png`;
        const { error } = await supabase.storage.from("firmas").upload(path, firmaBlobArg, { upsert: true, contentType: "image/png" });
        if (error) { notify("Error subiendo firma: " + error.message, "inf"); return; }
        const { data: pd } = supabase.storage.from("firmas").getPublicUrl(path);
        updates.firma_martillero_url = pd.publicUrl;
        setFirmaMartilleroUrl(pd.publicUrl);
      }

      // Subir timbre si se seleccionó archivo
      if (timbreFile) {
        const ext  = timbreFile.name.split(".").pop();
        const path = `config/${session.casaId}_timbre.${ext}`;
        const { error } = await supabase.storage.from("firmas").upload(path, timbreFile, { upsert: true });
        if (error) { notify("Error subiendo timbre: " + error.message, "inf"); return; }
        const { data: pd } = supabase.storage.from("firmas").getPublicUrl(path);
        updates.timbre_url = pd.publicUrl;
        setTimbreUrl(pd.publicUrl);
        setTimbreFile(null);
      }

      if (!Object.keys(updates).length) return;
      const { error } = await supabase.from("casas").update(updates).eq("id", session.casaId);
      if (error) { notify("Error guardando: " + error.message, "inf"); return; }
      notify("Firma y timbre guardados.", "sold");
    } finally {
      setSavingFirma(false);
    }
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
        {session?.casaId && (
          <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1.1rem 1.2rem" }}>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".3rem" }}>Firma y timbre del martillero</div>
            <div style={{ fontSize: ".72rem", color: "var(--mu)", marginBottom: "1rem" }}>
              Se precarga automáticamente en cada acta de recepción como "quien recibe".
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
              <div>
                <FirmaCanvas
                  label="Firma del martillero"
                  firmaUrl={firmaMartilleroUrl || null}
                  onConfirm={blob => guardarFirmaTimbre(blob)}
                  onBorrar={() => { setFirmaMartilleroUrl(""); supabase.from("casas").update({ firma_martillero_url: null }).eq("id", session.casaId); }}
                  disabled={savingFirma}
                />
              </div>
              <div>
                <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".5rem" }}>Timbre</div>
                {timbreUrl && (
                  <div style={{ border: "1px solid #10b981", borderRadius: 9, overflow: "hidden", marginBottom: ".5rem" }}>
                    <div style={{ background: "#fff", padding: ".4rem", display: "flex", justifyContent: "center" }}>
                      <img src={timbreUrl} alt="Timbre" style={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".3rem .7rem", background: "#d1fae5" }}>
                      <span style={{ fontSize: ".68rem", color: "#059669", fontWeight: 700 }}>Timbre cargado</span>
                      <button onClick={() => { setTimbreUrl(""); supabase.from("casas").update({ timbre_url: null }).eq("id", session.casaId); }}
                        style={{ fontSize: ".65rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        Quitar
                      </button>
                    </div>
                  </div>
                )}
                {!timbreUrl && (
                  <div style={{ border: "1.5px dashed var(--b2)", borderRadius: 9, padding: "1.2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: ".4rem" }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="22" height="14" rx="2"/><path d="M9 7V5a2 2 0 014 0v2M15 7V5a2 2 0 014 0v2M7 14h14"/></svg>
                    <span style={{ fontSize: ".72rem", color: "var(--mu)" }}>Sube una imagen del timbre</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={e => setTimbreFile(e.target.files[0] || null)}
                  style={{ fontSize: ".74rem", color: "var(--fgp)", marginTop: ".5rem" }} />
                {timbreFile && (
                  <button className="btn-primary" style={{ fontSize: ".74rem", marginTop: ".5rem" }} onClick={() => guardarFirmaTimbre(null)} disabled={savingFirma}>
                    {savingFirma ? "Subiendo..." : "Guardar timbre"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
