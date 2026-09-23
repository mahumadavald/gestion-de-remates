'use client'
import React, { useRef, useState, useEffect, useCallback } from "react";

// onFirma: modo auto-save — fires dataURL on every stopDraw (no "Confirmar" button needed)
// height: canvas height in px (default 110)
export default function FirmaCanvas({ label, firmaUrl, onConfirm, onBorrar, disabled, onFirma, height = 110 }) {
  const canvasRef   = useRef(null);
  const lastPos     = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasLines,  setHasLines]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  // Init canvas con DPI correcto
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || firmaUrl) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, [firmaUrl]);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const startDraw = useCallback((e) => {
    if (firmaUrl || disabled) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  }, [firmaUrl, disabled]);

  const draw = useCallback((e) => {
    if (!isDrawing || firmaUrl || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasLines(true);
  }, [isDrawing, firmaUrl, disabled]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
    if (onFirma && canvasRef.current) {
      onFirma(canvasRef.current.toDataURL("image/png"));
    }
  }, [onFirma]);

  // Touch events necesitan passive:false para poder llamar preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove",  draw,      { passive: false });
    canvas.addEventListener("touchend",   stopDraw);
    return () => {
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove",  draw);
      canvas.removeEventListener("touchend",   stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const ctx  = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width / dpr * dpr, rect.height / dpr * dpr);
    ctx.strokeStyle = "#111";
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    setHasLines(false);
    if (onFirma) onFirma(null);
  };

  const confirmar = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasLines) return;
    setSaving(true);
    try {
      const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
      await onConfirm(blob);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {label && (
        <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: ".5rem" }}>
          {label}
        </div>
      )}

      {firmaUrl ? (
        // Estado firmado
        <div style={{ border: "1px solid #10b981", borderRadius: 9, overflow: "hidden" }}>
          <div style={{ background: "#fff", padding: ".3rem" }}>
            <img src={firmaUrl} alt="Firma" style={{ display: "block", width: "100%", height: 90, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: ".35rem .7rem", background: "#d1fae5" }}>
            <span style={{ fontSize: ".68rem", color: "#059669", fontWeight: 700 }}>Firmado</span>
            {!disabled && (
              <button onClick={onBorrar}
                style={{ fontSize: ".65rem", color: "#ef4444", background: "none", border: "none",
                  cursor: "pointer", fontFamily: "Inter,sans-serif", padding: 0 }}>
                Re-firmar
              </button>
            )}
          </div>
        </div>
      ) : (
        // Canvas para firmar
        <div>
          <div style={{ position: "relative", border: "1.5px dashed var(--b2)", borderRadius: 9,
            overflow: "hidden", background: "#fff", cursor: disabled ? "default" : "crosshair" }}>
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: height, touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
            {!hasLines && !disabled && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontSize: ".72rem", color: "#bbb", fontStyle: "italic" }}>Firmar aqui</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: ".4rem", marginTop: ".4rem" }}>
            <button onClick={limpiar} disabled={!hasLines}
              style={{ flex: 1, fontSize: ".72rem", padding: ".32rem", background: "none",
                border: "1px solid var(--b2)", borderRadius: 6, color: "var(--mu2)", cursor: hasLines ? "pointer" : "default",
                fontFamily: "Inter,sans-serif", opacity: hasLines ? 1 : .4 }}>
              Borrar
            </button>
            {!onFirma && (
              <button onClick={confirmar} disabled={!hasLines || saving}
                style={{ flex: 2, fontSize: ".72rem", padding: ".32rem", background: "#10b981",
                  border: "none", borderRadius: 6, color: "#fff", fontWeight: 700,
                  cursor: hasLines && !saving ? "pointer" : "default", fontFamily: "Inter,sans-serif",
                  opacity: hasLines && !saving ? 1 : .5 }}>
                {saving ? "Guardando..." : "Confirmar firma"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
