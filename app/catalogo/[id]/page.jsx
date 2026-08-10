'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

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

function formatPrecio(num) {
  if (!num || num <= 0) return null;
  return "$" + Number(num).toLocaleString("es-CL");
}

function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function CatalogoPage({ params }) {
  const id = params?.id || "";

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [remate, setRemate] = useState(null);
  const [casa, setCasa] = useState(null);
  const [lotes, setLotes] = useState([]);

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      // Fetch remate
      const { data: remateData, error: remateErr } = await supabase
        .from("remates")
        .select("nombre, fecha, hora, modalidad, casa_id")
        .eq("id", id)
        .single();

      if (remateErr || !remateData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRemate(remateData);

      // Fetch casa
      if (remateData.casa_id) {
        const { data: casaData } = await supabase
          .from("casas")
          .select("nombre, logo_url")
          .eq("id", remateData.casa_id)
          .single();
        if (casaData) setCasa(casaData);
      }

      // Fetch lotes
      const { data: lotesData } = await supabase
        .from("lotes")
        .select("id, orden, nombre, cantidad, descripcion, minimo, imagenes")
        .eq("remate_id", id)
        .order("orden");

      setLotes(lotesData || []);
      setLoading(false);
    };

    load();
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <style>{baseCSS}</style>
        <div style={styles.spinner} />
        <span style={{ color: "#6b7280", fontSize: ".9rem" }}>Cargando catálogo...</span>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────
  if (notFound || !remate) {
    return (
      <div style={styles.page}>
        <style>{baseCSS}</style>
        <div style={styles.inner}>
          <div style={{ ...styles.card, textAlign: "center", padding: "3rem 2rem" }}>
            <div style={styles.errorIcon}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="14" cy="14" r="11" />
                <path d="M14 8v6M14 18v1" />
              </svg>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginBottom: ".5rem", fontFamily: "'Poppins', sans-serif" }}>
              Catálogo no encontrado
            </div>
            <div style={{ fontSize: ".9rem", color: "#6b7280", lineHeight: 1.7 }}>
              No encontramos un remate con este identificador. Verifica que el enlace sea correcto.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <style>{baseCSS}</style>
      <div style={styles.inner}>

        {/* Header */}
        <div style={{ ...styles.card, ...styles.headerCard }}>
          {/* Casa logo */}
          {casa?.logo_url && (
            <img
              src={casa.logo_url}
              alt={casa?.nombre}
              style={{ height: 60, maxWidth: 220, objectFit: "contain", marginBottom: "1rem" }}
            />
          )}
          {!casa?.logo_url && casa?.nombre && (
            <div style={styles.casaName}>{casa.nombre}</div>
          )}

          {/* Remate name */}
          <div style={styles.remateTitle}>{remate.nombre}</div>

          {/* Meta */}
          <div style={styles.remateMeta}>
            {remate.fecha && formatFecha(remate.fecha)}
            {remate.hora && ` · ${remate.hora}`}
            {remate.modalidad && ` · ${remate.modalidad}`}
          </div>

          {/* Tag */}
          <div style={styles.catalogTag}>CATÁLOGO DE LOTES</div>
        </div>

        {/* Lots */}
        {lotes.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", padding: "3rem 2rem", color: "#6b7280", fontSize: ".95rem" }}>
            El catálogo está siendo cargado. Vuelve pronto.
          </div>
        ) : (
          <div style={styles.lotesGrid} className="lotes-grid">
            {lotes.map((lote) => {
              const primeraImagen = Array.isArray(lote.imagenes) && lote.imagenes.length > 0
                ? lote.imagenes[0]
                : typeof lote.imagenes === "string" && lote.imagenes
                ? lote.imagenes
                : null;

              const precio = formatPrecio(lote.minimo);
              const lotNumStr = String(lote.orden || lote.numero || "").padStart(2, "0");

              return (
                <div key={lote.id} style={styles.loteCard}>
                  {/* Lot number */}
                  <div style={styles.loteNumWrap}>
                    <div style={styles.loteNumCircle}>{lotNumStr}</div>
                    {lote.cantidad && lote.cantidad > 0 && (
                      <div style={styles.cantidadBadge}>Cant: {lote.cantidad}</div>
                    )}
                  </div>

                  {/* Photo */}
                  {primeraImagen ? (
                    <div style={styles.photoWrap}>
                      <img
                        src={primeraImagen}
                        alt={lote.nombre}
                        style={styles.photo}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div style={styles.photoPlaceholder}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="6" width="26" height="20" rx="3" />
                        <circle cx="11" cy="13" r="2.5" />
                        <path d="M3 22l7-5 5 4 4-3 10 7" />
                      </svg>
                    </div>
                  )}

                  {/* Info */}
                  <div style={styles.loteInfo}>
                    <div style={styles.loteNombre}>{lote.nombre}</div>
                    {lote.descripcion && (
                      <div style={styles.loteDesc}>{lote.descripcion}</div>
                    )}

                    {precio && (
                      <div style={styles.precioRow}>
                        <span style={styles.precioLabel}>Precio base</span>
                        <span style={styles.precioVal}>{precio}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          Powered by{" "}
          <a
            href="https://takka.cl"
            style={{ color: "#0e7490", fontWeight: 700, textDecoration: "none" }}
          >
            Pecker
          </a>
          {" · takka.cl"}
        </div>
      </div>
    </div>
  );
}

// ── Inline styles ────────────────────────────────────────────────────────────

const baseCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .lotes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 600px) {
    .lotes-grid {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    body { background: white !important; }
    .lotes-grid { grid-template-columns: 1fr 1fr; }
  }
`;

const styles = {
  page: {
    background: "#ffffff",
    minHeight: "100vh",
    padding: "2.5rem 1.5rem 4rem",
    fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box",
  },
  inner: {
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    animation: "fadeUp .35s ease both",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: ".75rem",
    background: "#ffffff",
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
    padding: "1.75rem",
    boxShadow: "0 2px 16px rgba(0,0,0,.05)",
  },
  headerCard: {
    textAlign: "center",
    padding: "2.5rem 2rem",
    borderBottom: "3px solid #06B6D4",
  },
  casaName: {
    fontSize: ".8rem",
    fontWeight: 700,
    color: "#0e7490",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    marginBottom: ".6rem",
  },
  remateTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-.03em",
    lineHeight: 1.15,
    marginBottom: ".6rem",
  },
  remateMeta: {
    fontSize: ".9rem",
    color: "#6b7280",
    marginBottom: "1rem",
    lineHeight: 1.6,
    textTransform: "capitalize",
  },
  catalogTag: {
    display: "inline-block",
    background: "linear-gradient(135deg, #06B6D4, #14B8A6)",
    color: "#ffffff",
    fontSize: ".7rem",
    fontWeight: 700,
    letterSpacing: ".12em",
    padding: ".3rem .9rem",
    borderRadius: 20,
    textTransform: "uppercase",
  },
  lotesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  loteCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 1px 8px rgba(0,0,0,.04)",
    display: "flex",
    flexDirection: "column",
    transition: "box-shadow .15s",
  },
  loteNumWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ".75rem 1rem .5rem",
  },
  loteNumCircle: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #06B6D4, #14B8A6)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: ".9rem",
    flexShrink: 0,
  },
  cantidadBadge: {
    fontSize: ".7rem",
    fontWeight: 600,
    color: "#6b7280",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: ".2rem .55rem",
  },
  photoWrap: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    background: "#f9fafb",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderTop: "1px solid #f3f4f6",
    borderBottom: "1px solid #f3f4f6",
  },
  loteInfo: {
    padding: ".9rem 1rem 1rem",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: ".35rem",
  },
  loteNombre: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: ".95rem",
    color: "#111827",
    lineHeight: 1.35,
  },
  loteDesc: {
    fontSize: ".78rem",
    color: "#6b7280",
    lineHeight: 1.55,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  precioRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: ".6rem",
    borderTop: "1px solid #f3f4f6",
  },
  precioLabel: {
    fontSize: ".72rem",
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: ".05em",
  },
  precioVal: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: ".95rem",
    color: "#0e7490",
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
  footer: {
    textAlign: "center",
    fontSize: ".75rem",
    color: "#9ca3af",
    paddingTop: ".5rem",
    paddingBottom: "1rem",
  },
};
