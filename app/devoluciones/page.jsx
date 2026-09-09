'use client'
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

const BANCOS = [
  "Banco de Chile",
  "BancoEstado",
  "Santander",
  "BCI",
  "Itaú",
  "Scotiabank",
  "BICE",
  "Security",
  "Consorcio",
  "Ripley",
  "Falabella",
  "COOPEUCH",
  "Los Héroes",
  "Tenpo",
  "MACH",
];

const TIPOS_CUENTA = [
  "Cuenta Corriente",
  "Cuenta Vista",
  "Cuenta de Ahorro",
  "Cuenta RUT",
];

function formatFecha(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DevolucionesContent() {
  const searchParams = useSearchParams();
  const pParam = searchParams.get("p") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postor, setPostor] = useState(null);
  const [remate, setRemate] = useState(null);
  const [casa, setCasa] = useState(null);

  const [banco, setBanco] = useState("");
  const [tipoCta, setTipoCta] = useState("");
  const [numCta, setNumCta] = useState("");
  const [titular, setTitular] = useState("");

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!pParam) {
      setError("enlace_invalido");
      setLoading(false);
      return;
    }
    const load = async () => {
      const res = await fetch(`/api/devoluciones?p=${encodeURIComponent(pParam)}`);
      if (res.status === 400) { setError("enlace_invalido"); setLoading(false); return; }
      if (res.status === 404) { setError("no_encontrado");   setLoading(false); return; }
      if (!res.ok)            { setError("no_encontrado");   setLoading(false); return; }

      const { postor: postorData, remate: remateData, casa: casaData } = await res.json();

      setPostor(postorData);
      if (postorData.banco)         setBanco(postorData.banco);
      if (postorData.tipo_cuenta)   setTipoCta(postorData.tipo_cuenta);
      if (postorData.numero_cuenta) setNumCta(postorData.numero_cuenta);
      if (remateData) setRemate(remateData);
      if (casaData)   setCasa(casaData);

      setLoading(false);
    };
    load();
  }, [pParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");

    if (!banco) { setSaveError("Selecciona el banco."); return; }
    if (!tipoCta) { setSaveError("Selecciona el tipo de cuenta."); return; }
    if (!numCta.trim()) { setSaveError("Ingresa el número de cuenta."); return; }
    if (!titular.trim()) { setSaveError("Ingresa el nombre del titular."); return; }

    setSaving(true);

    try {
      const res = await fetch("/api/devoluciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postorId:     postor.id,
          banco,
          tipoCuenta:   tipoCta,
          numeroCuenta: numCta.trim(),
          titular:      titular.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Error al guardar");
      }
      setDone(true);
    } catch (err) {
      setSaveError("Error al guardar: " + err.message);
    }

    setSaving(false);
  };

  // ── Spinner ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={{ color: "#6b7280", fontSize: ".9rem" }}>Cargando...</span>
        <style>{spinnerCSS}</style>
      </div>
    );
  }

  // ── Error states ─────────────────────────────────────────────────
  if (error === "enlace_invalido" || error === "no_encontrado") {
    return (
      <div style={styles.page}>
        <style>{spinnerCSS}</style>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem 2rem" }}>
          <div style={styles.errorIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="14" cy="14" r="11" />
              <path d="M14 8v6M14 18v1" />
            </svg>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a1a1a", marginBottom: ".5rem", fontFamily: "'Poppins', sans-serif" }}>
            Enlace inválido
          </div>
          <div style={{ fontSize: ".9rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>
            {error === "enlace_invalido"
              ? "Este enlace no contiene un identificador de postor válido. Verifica que la URL sea correcta."
              : "No encontramos un postor con este identificador. Es posible que el enlace haya expirado o sea incorrecto."}
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────
  if (done) {
    return (
      <div style={styles.page}>
        <style>{spinnerCSS}</style>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem 2rem" }}>
          <div style={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 16l8 8 12-14" />
            </svg>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a1a1a", marginBottom: ".6rem", fontFamily: "'Poppins', sans-serif" }}>
            ¡Cuenta registrada!
          </div>
          <div style={{ fontSize: ".95rem", color: "#4b5563", lineHeight: 1.75, maxWidth: 360, margin: "0 auto" }}>
            Tu garantía será devuelta a{" "}
            <strong style={{ color: "#0e7490" }}>{banco}</strong>
            {" · "}
            <strong style={{ color: "#0e7490" }}>{tipoCta}</strong>
            {" N° "}
            <strong style={{ color: "#0e7490" }}>{numCta}</strong>
            {titular && (
              <>
                {" "}a nombre de{" "}
                <strong style={{ color: "#0e7490" }}>{titular}</strong>
              </>
            )}
            .
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <style>{spinnerCSS}</style>
      <div style={styles.inner}>

        {/* Header card */}
        <div style={{ ...styles.card, ...styles.headerCard }}>
          {casa?.logo_url && (
            <img
              src={casa.logo_url}
              alt={casa?.nombre}
              style={{ maxHeight: 60, maxWidth: 200, objectFit: "contain", marginBottom: ".75rem" }}
            />
          )}
          {!casa?.logo_url && casa?.nombre && (
            <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#0e7490", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: ".4rem" }}>
              {casa.nombre}
            </div>
          )}
          <div style={styles.mainTitle}>Devolución de Garantía</div>
          <div style={styles.subtitle}>Registra tu cuenta para recibir la devolución</div>
        </div>

        {/* Info card */}
        <div style={styles.infoCard}>
          <div style={styles.postorNumero}>
            N° Postor:{" "}
            <span style={{ color: "#0e7490", fontWeight: 800 }}>
              {String(postor.numero).padStart(3, "0")}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Nombre</span>
            <span style={styles.infoValue}>{postor.nombre}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>RUT</span>
            <span style={styles.infoValue}>{postor.rut}</span>
          </div>
          {remate && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Remate</span>
              <span style={styles.infoValue}>
                {remate.nombre}
                {remate.fecha && (
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>
                    {" · "}
                    {formatFecha(remate.fecha)}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Form card */}
        <div style={styles.card}>
          <div style={styles.formSectionLabel}>Cuenta para devolución</div>

          <form onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              {/* Banco */}
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Banco *</label>
                <select
                  style={styles.select}
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  required
                >
                  <option value="">— Selecciona banco —</option>
                  {BANCOS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de cuenta */}
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Tipo de cuenta *</label>
                <select
                  style={styles.select}
                  value={tipoCta}
                  onChange={(e) => setTipoCta(e.target.value)}
                  required
                >
                  <option value="">— Selecciona tipo —</option>
                  {TIPOS_CUENTA.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Número de cuenta */}
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Número de cuenta *</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="123456789"
                  value={numCta}
                  onChange={(e) => setNumCta(e.target.value)}
                  required
                />
              </div>

              {/* Titular */}
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Titular de la cuenta *</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  required
                />
              </div>
            </div>

            {saveError && (
              <div style={styles.errorMsg}>{saveError}</div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.submitBtn,
                opacity: saving ? 0.55 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando..." : "Registrar cuenta →"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          Powered by{" "}
          <a href="https://takka.cl" style={{ color: "#0e7490", fontWeight: 700, textDecoration: "none" }}>
            Pecker
          </a>
          {" · takka.cl"}
        </div>
      </div>
    </div>
  );
}

// ── Inline styles ────────────────────────────────────────────────────────────

const spinnerCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
`;

const styles = {
  page: {
    background: "#f4f4f2",
    minHeight: "100vh",
    padding: "3rem 1.5rem",
    fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box",
  },
  inner: {
    maxWidth: 560,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    animation: "fadeUp .4s ease both",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: ".75rem",
    background: "#f4f4f2",
    fontFamily: "'Poppins', sans-serif",
  },
  spinner: {
    width: 22,
    height: 22,
    border: "2.5px solid #e5e7eb",
    borderTopColor: "#06B6D4",
    borderRadius: "50%",
    animation: "spin .8s linear infinite",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "1.75rem 1.75rem",
    boxShadow: "0 2px 16px rgba(0,0,0,.06)",
  },
  headerCard: {
    textAlign: "center",
    paddingTop: "2rem",
    paddingBottom: "2rem",
  },
  mainTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-.03em",
    marginBottom: ".35rem",
  },
  subtitle: {
    fontSize: ".92rem",
    color: "#6b7280",
    lineHeight: 1.6,
  },
  infoCard: {
    background: "#f0fdfe",
    border: "1px solid #a5f3fc",
    borderRadius: 14,
    padding: "1.4rem 1.75rem",
  },
  postorNumero: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: ".85rem",
    fontFamily: "'Poppins', sans-serif",
  },
  infoRow: {
    display: "flex",
    alignItems: "baseline",
    gap: ".6rem",
    marginBottom: ".45rem",
  },
  infoLabel: {
    fontSize: ".75rem",
    fontWeight: 700,
    color: "#0891b2",
    textTransform: "uppercase",
    letterSpacing: ".06em",
    minWidth: 60,
  },
  infoValue: {
    fontSize: ".92rem",
    fontWeight: 600,
    color: "#1a1a1a",
  },
  formSectionLabel: {
    fontSize: ".72rem",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: ".1em",
    marginBottom: "1.1rem",
    paddingBottom: ".65rem",
    borderBottom: "1px solid #f3f4f6",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: ".35rem",
  },
  fieldLabel: {
    fontSize: ".76rem",
    fontWeight: 600,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: ".06em",
  },
  input: {
    width: "100%",
    padding: ".78rem 1rem",
    background: "#fafafa",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    color: "#111827",
    fontFamily: "'Poppins', sans-serif",
    fontSize: ".92rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border .15s",
  },
  select: {
    width: "100%",
    padding: ".78rem 1rem",
    background: "#fafafa",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    color: "#111827",
    fontFamily: "'Poppins', sans-serif",
    fontSize: ".92rem",
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "1.5rem",
    width: "100%",
    padding: "1rem",
    background: "linear-gradient(135deg, #06B6D4, #14B8A6)",
    border: "none",
    borderRadius: 11,
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: ".02em",
    cursor: "pointer",
    transition: "all .2s",
  },
  errorMsg: {
    marginTop: "1rem",
    background: "rgba(239,68,68,.06)",
    border: "1px solid rgba(239,68,68,.2)",
    borderRadius: 9,
    padding: ".8rem 1rem",
    fontSize: ".84rem",
    color: "#ef4444",
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "rgba(239,68,68,.08)",
    border: "1.5px solid rgba(239,68,68,.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.25rem",
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(20,184,166,.1)",
    border: "2px solid rgba(20,184,166,.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
  },
  footer: {
    textAlign: "center",
    fontSize: ".75rem",
    color: "#9ca3af",
    paddingTop: ".5rem",
    paddingBottom: "1rem",
  },
};

export default function DevolucionesPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <span style={{ color: "#6b7280", fontSize: ".9rem" }}>Cargando...</span>
          <style>{spinnerCSS}</style>
        </div>
      }
    >
      <DevolucionesContent />
    </Suspense>
  );
}
