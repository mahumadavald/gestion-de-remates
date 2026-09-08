'use client'
import React, { useState } from "react";

const BASE_URL = "https://takka.cl";

const toSlug = (nombre) => nombre.toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

const FORM_INICIAL = {
  nombre: "", email: "", telefono: "", direccion: "",
  logoFile: null, logoUrl: null,
  martillero: "", rutMartillero: "", telefonoMartillero: "", emailMartillero: "", direccionMartillero: "",
};

export default function PageCasas({ session, supabase, dbLicencias, setDbLicencias, notify, subirLogoCasa, casaModal, setCasaModal }) {
  const [casaForm, setCasaForm]     = useState(FORM_INICIAL);
  const [logoUploading, setLogoUploading] = useState(null);

  const resetCasaForm = () => setCasaForm(FORM_INICIAL);

  const crearCasa = async () => {
    if (!casaForm.nombre.trim()) { notify("Ingresa el nombre de la casa.", "inf"); return; }
    const slug = toSlug(casaForm.nombre);
    let logoUrl = null;
    if (casaForm.logoFile) {
      try {
        const ext  = casaForm.logoFile.name.split(".").pop();
        const path = `logos/${slug}.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage.from("logos").upload(path, casaForm.logoFile, { upsert: true });
        if (!upErr && upData) {
          const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
          logoUrl = urlData?.publicUrl || null;
        }
      } catch {}
    }
    const { data, error } = await supabase.from("casas").insert({
      nombre:              casaForm.nombre.trim(),
      slug,
      email:               casaForm.email.trim()    || null,
      telefono:            casaForm.telefono.trim() || null,
      direccion:           casaForm.direccion.trim() || null,
      logo_url:            logoUrl,
      martillero:          casaForm.martillero.trim()           || null,
      rut_martillero:      casaForm.rutMartillero.trim()        || null,
      telefono_martillero: casaForm.telefonoMartillero.trim()   || null,
      email_martillero:    casaForm.emailMartillero.trim()      || null,
      direccion_martillero:casaForm.direccionMartillero.trim()  || null,
      licencia_estado: "trial",
      licencia_plan:   "trial",
      licencia_vence:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }).select().single();
    if (error) { notify("Error: " + error.message, "inf"); return; }
    setDbLicencias(prev => [...prev, data]);
    setCasaModal(false); resetCasaForm();
    notify(`Casa "${casaForm.nombre}" creada. Slug: ${slug}`, "sold");
  };

  const copiar = (txt) => { navigator.clipboard.writeText(txt); notify("Link copiado.", "sold"); };

  const handleSubirLogo = async (casaId, slug, file) => {
    setLogoUploading(casaId);
    await subirLogoCasa(casaId, slug, file);
    setLogoUploading(null);
  };

  return (
    <div className="page">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {dbLicencias.map((casa, idx) => (
          <div key={casa.id} style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.2rem", borderBottom: "1px solid var(--b1)" }}>
              <label style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(56,178,246,.08)", border: "1px solid rgba(56,178,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer", position: "relative" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(56,178,246,.5)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(56,178,246,.15)"}>
                {logoUploading === casa.id
                  ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}><path d="M9 2a7 7 0 110 14A7 7 0 019 2z" strokeOpacity=".25"/><path d="M9 2a7 7 0 017 7"/></svg>
                  : casa.logo_url
                    ? <img src={casa.logo_url} alt={casa.nombre} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}/>
                    : <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinecap="round"><path d="M2 16V8l7-6 7 6v8"/><path d="M7 16v-5h4v5"/></svg>
                }
                <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (f) handleSubirLogo(casa.id, casa.slug, f); e.target.value = ""; }}/>
              </label>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <span style={{ fontSize: ".62rem", fontWeight: 700, fontFamily: "Inter,sans-serif", color: "var(--ac)", background: "rgba(56,178,246,.1)", border: "1px solid rgba(56,178,246,.2)", borderRadius: 5, padding: ".1rem .4rem" }}>#{String(idx + 1).padStart(3, "0")}</span>
                  <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--wh2)" }}>{casa.nombre}</div>
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--mu2)", marginTop: ".25rem", fontFamily: "Inter,sans-serif" }}>slug: {casa.slug}</div>
              </div>
              <span style={{ fontSize: ".65rem", fontWeight: 700, padding: ".2rem .55rem", borderRadius: 20,
                background: casa.licencia_estado === "activo" ? "rgba(20,184,166,.1)" : casa.licencia_estado === "suspendido" ? "rgba(246,173,85,.1)" : "rgba(255,255,255,.04)",
                color: casa.licencia_estado === "activo" ? "var(--gr)" : casa.licencia_estado === "suspendido" ? "var(--yl)" : "var(--mu)" }}>
                {casa.licencia_estado || "trial"}
              </span>
            </div>
            <div style={{ padding: "1rem 1.2rem", display: "flex", flexDirection: "column", gap: ".65rem" }}>
              {[
                { label: "Página de inscripción pública", url: `${BASE_URL}/participar?id=${casa.id}`, color: "var(--ac)", bg: "rgba(56,178,246,.05)", border: "rgba(56,178,246,.15)" },
                { label: "Pantalla sala / display",       url: `${BASE_URL}/display/${casa.slug}`,     color: "var(--gr)", bg: "rgba(20,184,166,.04)", border: "rgba(20,184,166,.15)" },
              ].map(link => (
                <div key={link.label} style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".65rem .9rem", background: link.bg, border: `1px solid ${link.border}`, borderRadius: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".62rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".15rem" }}>{link.label}</div>
                    <code style={{ fontSize: ".73rem", color: link.color, fontFamily: "Inter,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{link.url}</code>
                  </div>
                  <button className="btn-sec" style={{ fontSize: ".65rem", whiteSpace: "nowrap" }} onClick={() => copiar(link.url)}>Copiar</button>
                  <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: ".65rem", color: "var(--mu2)", textDecoration: "none", whiteSpace: "nowrap", padding: ".28rem .55rem", border: "1px solid var(--b2)", borderRadius: 6 }}>Abrir →</a>
                </div>
              ))}
              {(casa.email || casa.telefono || casa.direccion) && (
                <div style={{ display: "flex", gap: "1.5rem", fontSize: ".72rem", color: "var(--mu2)", paddingTop: ".3rem" }}>
                  {casa.email    && <span>✉ {casa.email}</span>}
                  {casa.telefono && <span>☎ {casa.telefono}</span>}
                  {casa.direccion && <span>📍 {casa.direccion}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {dbLicencias.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--mu)", fontSize: ".82rem", background: "var(--s2)", borderRadius: 12, border: "1px dashed var(--b2)" }}>
            No hay casas registradas. Crea la primera con el botón de arriba.
          </div>
        )}
      </div>

      {casaModal && (
        <div className="ov" onClick={() => { setCasaModal(false); resetCasaForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-title">Nueva casa de remates</div>
            <div className="form-grid">
              <div className="fg full">
                <label className="fl">Logo de la casa</label>
                <label style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".75rem 1rem", background: "rgba(255,255,255,.03)", border: `2px dashed ${casaForm.logoFile ? "rgba(20,184,166,.4)" : "var(--b2)"}`, borderRadius: 9, cursor: "pointer" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(56,178,246,.08)", border: "1px solid rgba(56,178,246,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {casaForm.logoUrl
                      ? <img src={casaForm.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}/>
                      : <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--mu)" strokeWidth="1.4"><rect x="2" y="4" width="18" height="14" rx="2"/><circle cx="11" cy="11" r="3"/><path d="M7 4V3a1 1 0 011-1h6a1 1 0 011 1v1"/></svg>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: ".82rem", fontWeight: 600, color: casaForm.logoFile ? "var(--gr)" : "var(--wh2)" }}>
                      {casaForm.logoFile ? `✓ ${casaForm.logoFile.name}` : "Subir logo"}
                    </div>
                    <div style={{ fontSize: ".7rem", color: "var(--mu)", marginTop: ".15rem" }}>PNG, JPG o SVG — fondo transparente recomendado</div>
                  </div>
                  <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{ display: "none" }}
                    onChange={e => { const file = e.target.files[0]; if (file) setCasaForm(f => ({ ...f, logoFile: file, logoUrl: URL.createObjectURL(file) })); }}/>
                </label>
              </div>
              <div className="fg full">
                <label className="fl">Nombre de la casa *</label>
                <input className="fi" placeholder="Remates García Ltda." value={casaForm.nombre} onChange={e => setCasaForm(f => ({ ...f, nombre: e.target.value }))}/>
                {casaForm.nombre && (
                  <div style={{ marginTop: ".4rem", fontSize: ".7rem", color: "var(--mu2)", fontFamily: "Inter,sans-serif" }}>
                    Slug: <span style={{ color: "var(--ac)" }}>{toSlug(casaForm.nombre)}</span>
                    <span style={{ color: "var(--mu)", marginLeft: ".5rem" }}>→ takka.cl/participar/{toSlug(casaForm.nombre)}</span>
                  </div>
                )}
              </div>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" placeholder="contacto@casa.cl" value={casaForm.email} onChange={e => setCasaForm(f => ({ ...f, email: e.target.value }))}/></div>
              <div className="fg"><label className="fl">Teléfono</label><input className="fi" placeholder="+56 9 1234 5678" value={casaForm.telefono} onChange={e => setCasaForm(f => ({ ...f, telefono: e.target.value }))}/></div>
              <div className="fg full"><label className="fl">Dirección</label><input className="fi" placeholder="Av. Principal 123" value={casaForm.direccion} onChange={e => setCasaForm(f => ({ ...f, direccion: e.target.value }))}/></div>
            </div>
            <div style={{ margin: "1.2rem 0 .6rem", fontSize: ".72rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>Datos del Martillero Público</div>
            <div className="form-grid">
              <div className="fg full"><label className="fl">Nombre completo *</label><input className="fi" placeholder="Juan Manuel Ahumada Baeza" value={casaForm.martillero} onChange={e => setCasaForm(f => ({ ...f, martillero: e.target.value }))}/></div>
              <div className="fg"><label className="fl">RUT</label><input className="fi" placeholder="12.345.678-9" value={casaForm.rutMartillero} onChange={e => setCasaForm(f => ({ ...f, rutMartillero: e.target.value }))}/></div>
              <div className="fg"><label className="fl">Teléfono</label><input className="fi" placeholder="+56 9 9145 3680" value={casaForm.telefonoMartillero} onChange={e => setCasaForm(f => ({ ...f, telefonoMartillero: e.target.value }))}/></div>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" placeholder="martillero@casa.cl" value={casaForm.emailMartillero} onChange={e => setCasaForm(f => ({ ...f, emailMartillero: e.target.value }))}/></div>
              <div className="fg"><label className="fl">Dirección</label><input className="fi" placeholder="Hermanos Carrera 1320, Malloa" value={casaForm.direccionMartillero} onChange={e => setCasaForm(f => ({ ...f, direccionMartillero: e.target.value }))}/></div>
            </div>
            <div style={{ marginTop: "1rem", padding: ".75rem 1rem", background: "rgba(56,178,246,.05)", border: "1px solid rgba(56,178,246,.15)", borderRadius: 9, fontSize: ".73rem", color: "var(--mu2)", lineHeight: 1.6 }}>
              Al crear la casa se generan automáticamente los links de <strong style={{ color: "var(--wh2)" }}>inscripción pública</strong> y <strong style={{ color: "var(--wh2)" }}>pantalla de sala</strong>. La licencia parte en modo <strong style={{ color: "var(--yl)" }}>Trial (30 días)</strong>.
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setCasaModal(false); resetCasaForm(); }}>Cancelar</button>
              <button className="btn-confirm" onClick={crearCasa}>Crear casa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
