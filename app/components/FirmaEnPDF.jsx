'use client'
import React, { useRef, useState, useEffect, useCallback } from "react";

const WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export default function FirmaEnPDF({ pdfFile, firmaUrl, onConfirm, onCancel }) {
  const canvasRef  = useRef();
  const wrapRef    = useRef();
  const [loading, setLoading]   = useState(true);
  const [firmaPos, setFirmaPos] = useState({ x: 0.55, y: 0.78, w: 0.25, h: 0.07 }); // fracción del tamaño del canvas
  const [dragging, setDragging] = useState(false);
  const [dragOff,  setDragOff]  = useState({ x: 0, y: 0 });
  const [pdfSize,  setPdfSize]  = useState({ w: 1, h: 1 }); // puntos PDF reales
  const [applying, setApplying] = useState(false);
  const firmaImgRef = useRef(null);

  /* ── Renderizar primera página del PDF ─────────────────────────── */
  useEffect(() => {
    if (!pdfFile) return;
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf  = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const vp   = page.getViewport({ scale: 1.5 });

        if (cancelled) return;
        const canvas  = canvasRef.current;
        if (!canvas) return;
        canvas.width  = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        // Guardar tamaño real del PDF (para incrustar luego)
        const vpReal = page.getViewport({ scale: 1 });
        setPdfSize({ w: vpReal.width, h: vpReal.height });
        setLoading(false);
      } catch (e) {
        console.error("FirmaEnPDF render:", e);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfFile]);

  /* ── Precargar imagen de firma ──────────────────────────────────── */
  useEffect(() => {
    if (!firmaUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { firmaImgRef.current = img; };
    img.src = firmaUrl;
  }, [firmaUrl]);

  /* ── Drag handlers ──────────────────────────────────────────────── */
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect() || { left:0, top:0, width:1, height:1 };

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const r = getCanvasRect();
    const fx = firmaPos.x * r.width;
    const fy = firmaPos.y * r.height;
    setDragOff({ x: e.clientX - r.left - fx, y: e.clientY - r.top - fy });
    setDragging(true);
  }, [firmaPos]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    const r = getCanvasRect();
    const nx = (e.clientX - r.left - dragOff.x) / r.width;
    const ny = (e.clientY - r.top  - dragOff.y) / r.height;
    setFirmaPos(p => ({
      ...p,
      x: Math.max(0, Math.min(1 - p.w, nx)),
      y: Math.max(0, Math.min(1 - p.h, ny)),
    }));
  }, [dragging, dragOff]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  // Touch
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    const r = getCanvasRect();
    const fx = firmaPos.x * r.width;
    const fy = firmaPos.y * r.height;
    setDragOff({ x: t.clientX - r.left - fx, y: t.clientY - r.top - fy });
    setDragging(true);
    e.preventDefault();
  }, [firmaPos]);

  const onTouchMove = useCallback((e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const r = getCanvasRect();
    const nx = (t.clientX - r.left - dragOff.x) / r.width;
    const ny = (t.clientY - r.top  - dragOff.y) / r.height;
    setFirmaPos(p => ({
      ...p,
      x: Math.max(0, Math.min(1 - p.w, nx)),
      y: Math.max(0, Math.min(1 - p.h, ny)),
    }));
    e.preventDefault();
  }, [dragging, dragOff]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  /* ── Confirmar: incrustar firma con pdf-lib ─────────────────────── */
  const confirmar = async () => {
    setApplying(true);
    try {
      const { PDFDocument } = await import("pdf-lib");

      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc   = await PDFDocument.load(pdfBytes);
      const pages    = pdfDoc.getPages();
      const page     = pages[0];

      // Convertir posición (fracción del canvas renderizado) a puntos PDF
      const { width: pw, height: ph } = page.getSize();
      const x = firmaPos.x * pw;
      const y = ph - (firmaPos.y + firmaPos.h) * ph; // pdf-lib: origen abajo-izquierda
      const w = firmaPos.w * pw;
      const h = firmaPos.h * ph;

      // Incrustar imagen de firma
      let imgBytes;
      const resp = await fetch(firmaUrl);
      imgBytes = await resp.arrayBuffer();

      let embeddedImg;
      if (firmaUrl.toLowerCase().includes(".png") || firmaUrl.includes("png")) {
        embeddedImg = await pdfDoc.embedPng(imgBytes);
      } else {
        embeddedImg = await pdfDoc.embedJpg(imgBytes);
      }

      page.drawImage(embeddedImg, { x, y, width: w, height: h });

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes], { type: "application/pdf" });
      const file = new File([blob], pdfFile.name.replace(/\.pdf$/i, "_firmado.pdf"), { type: "application/pdf" });
      onConfirm(file);
    } catch (e) {
      console.error("FirmaEnPDF confirmar:", e);
      alert("Error al incrustar la firma: " + e.message);
    } finally {
      setApplying(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  const canvasRect = canvasRef.current?.getBoundingClientRect() || { width: 0, height: 0 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 760,
        maxHeight: "95vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,.35)",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: ".95rem" }}>Colocar firma en el acta</div>
            <div style={{ fontSize: ".75rem", color: "#6b7280", marginTop: 2 }}>Arrastrá la firma al lugar correcto en el documento</div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af", lineHeight: 1 }}>✕</button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* PDF canvas + overlay firma */}
          <div style={{ flex: 1, position: "relative", minWidth: 0 }} ref={wrapRef}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, background: "#f9fafb", borderRadius: 8, color: "#9ca3af" }}>
                Cargando PDF…
              </div>
            )}
            <div style={{ position: "relative", display: loading ? "none" : "inline-block", width: "100%", userSelect: "none" }}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }} />

              {/* Overlay arrastrable de la firma */}
              {!loading && firmaUrl && (
                <div
                  onMouseDown={onMouseDown}
                  onTouchStart={onTouchStart}
                  style={{
                    position: "absolute",
                    left:   `${firmaPos.x * 100}%`,
                    top:    `${firmaPos.y * 100}%`,
                    width:  `${firmaPos.w * 100}%`,
                    height: `${firmaPos.h * 100}%`,
                    cursor: dragging ? "grabbing" : "grab",
                    border: "2px solid #2563eb",
                    borderRadius: 4,
                    background: "rgba(37,99,235,.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={firmaUrl} alt="firma" style={{ maxWidth: "95%", maxHeight: "95%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }} crossOrigin="anonymous" />
                  <span style={{ position: "absolute", top: 2, left: 4, fontSize: ".45rem", background: "rgba(255,255,255,.9)", color: "#2563eb", padding: "0 3px", borderRadius: 2, fontFamily: "sans-serif", fontWeight: 700 }}>
                    ↕ arrastrá
                  </span>
                </div>
              )}

              {!firmaUrl && !loading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.7)", borderRadius: 6 }}>
                  <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 8, padding: "12px 16px", fontSize: ".8rem", color: "#92400e", textAlign: "center" }}>
                    No hay firma precargada.<br/>Subila en Configuración primero.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral */}
          <div style={{ width: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 12px", fontSize: ".75rem", color: "#0369a1", lineHeight: 1.5 }}>
              <strong>¿Cómo usar?</strong><br/>
              Arrastrá el recuadro azul al lugar donde va la firma del martillero en el documento.
            </div>

            {firmaUrl && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: ".7rem", color: "#6b7280", marginBottom: 6 }}>Firma a incrustar:</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={firmaUrl} alt="firma precargada" style={{ width: "100%", height: 50, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 4 }} crossOrigin="anonymous" />
              </div>
            )}

            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: ".7rem", color: "#6b7280" }}>
              <strong style={{ color: "#374151" }}>Tamaño</strong>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <div style={{ marginBottom: 2 }}>Ancho: {Math.round(firmaPos.w * 100)}%</div>
                  <input type="range" min="5" max="60" value={Math.round(firmaPos.w * 100)}
                    onChange={e => setFirmaPos(p => ({ ...p, w: Number(e.target.value) / 100 }))}
                    style={{ width: "100%" }} />
                </div>
                <div>
                  <div style={{ marginBottom: 2 }}>Alto: {Math.round(firmaPos.h * 100)}%</div>
                  <input type="range" min="2" max="20" value={Math.round(firmaPos.h * 100)}
                    onChange={e => setFirmaPos(p => ({ ...p, h: Number(e.target.value) / 100 }))}
                    style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} disabled={applying}
            style={{ padding: ".5rem 1.2rem", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: ".82rem", color: "#374151" }}>
            Cancelar
          </button>
          <button onClick={confirmar} disabled={applying || loading || !firmaUrl}
            style={{ padding: ".5rem 1.4rem", borderRadius: 7, border: "none", background: applying ? "#93c5fd" : "#2563eb", color: "#fff", cursor: applying || loading || !firmaUrl ? "not-allowed" : "pointer", fontSize: ".82rem", fontWeight: 700 }}>
            {applying ? "Incrustando firma…" : "✓ Confirmar y subir"}
          </button>
        </div>
      </div>
    </div>
  );
}
