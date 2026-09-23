'use client'
import React, { useRef, useState, useEffect, useCallback } from "react";

// Versión debe coincidir exactamente con pdfjs-dist en package.json
const WORKER_SRC = `https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs`;

export default function FirmaEnPDF({ pdfFile, firmaUrl, timbreUrl, onConfirm, onCancel }) {
  const canvasRef = useRef();
  const wrapRef   = useRef();

  const [loading,   setLoading]   = useState(true);
  const [applying,  setApplying]  = useState(false);
  const [pdfError,  setPdfError]  = useState(null);

  // Posición firma (fracción 0-1 del canvas)
  const [firmaPos,  setFirmaPos]  = useState({ x: 0.55, y: 0.75, w: 0.28, h: 0.08 });
  // Posición timbre
  const [timbrePos, setTimbrePos] = useState({ x: 0.05, y: 0.75, w: 0.18, h: 0.18 });

  // Qué se está arrastrando: "firma" | "timbre" | null
  const [dragging,    setDragging]    = useState(null);
  const [dragOff,     setDragOff]     = useState({ x: 0, y: 0 });

  // Bytes pre-cargados (evita CORS al confirmar)
  const firmaBytes  = useRef(null);
  const timbreBytes = useRef(null);

  /* ── Pre-cargar bytes de firma y timbre ─────────────────────── */
  useEffect(() => {
    if (firmaUrl) {
      fetch(firmaUrl)
        .then(r => r.arrayBuffer())
        .then(b => { firmaBytes.current = b; })
        .catch(e => console.warn("No se pudo precargar firma:", e));
    }
  }, [firmaUrl]);

  useEffect(() => {
    if (timbreUrl) {
      fetch(timbreUrl)
        .then(r => r.arrayBuffer())
        .then(b => { timbreBytes.current = b; })
        .catch(e => console.warn("No se pudo precargar timbre:", e));
    }
  }, [timbreUrl]);

  /* ── Renderizar primera página del PDF ─────────────────────── */
  useEffect(() => {
    if (!pdfFile) return;
    let cancelled = false;
    setPdfError(null);
    setLoading(true);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf  = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const vp   = page.getViewport({ scale: 1.5 });

        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width  = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error("FirmaEnPDF render:", e);
        if (!cancelled) {
          setPdfError("Error al cargar el PDF: " + e.message);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [pdfFile]);

  /* ── Drag helpers ───────────────────────────────────────────── */
  const getRect = () => canvasRef.current?.getBoundingClientRect() || { left:0, top:0, width:1, height:1 };

  const startDrag = useCallback((target, clientX, clientY) => {
    const r   = getRect();
    const pos = target === "firma" ? firmaPos : timbrePos;
    setDragOff({ x: clientX - r.left - pos.x * r.width, y: clientY - r.top - pos.y * r.height });
    setDragging(target);
  }, [firmaPos, timbrePos]);

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragging) return;
    const r   = getRect();
    const pos = dragging === "firma" ? firmaPos : timbrePos;
    const setter = dragging === "firma" ? setFirmaPos : setTimbrePos;
    const nx = (clientX - r.left - dragOff.x) / r.width;
    const ny = (clientY - r.top  - dragOff.y) / r.height;
    setter(p => ({
      ...p,
      x: Math.max(0, Math.min(1 - p.w, nx)),
      y: Math.max(0, Math.min(1 - p.h, ny)),
    }));
  }, [dragging, dragOff, firmaPos, timbrePos]);

  const stopDrag = useCallback(() => setDragging(null), []);

  useEffect(() => {
    const mm = (e) => moveDrag(e.clientX, e.clientY);
    const tm = (e) => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup",   stopDrag);
    window.addEventListener("touchmove", tm, { passive: false });
    window.addEventListener("touchend",  stopDrag);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup",   stopDrag);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend",  stopDrag);
    };
  }, [moveDrag, stopDrag]);

  /* ── Confirmar: incrustar con pdf-lib ───────────────────────── */
  const confirmar = async () => {
    setApplying(true);
    try {
      const { PDFDocument } = await import("pdf-lib");

      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc   = await PDFDocument.load(pdfBytes);
      const page     = pdfDoc.getPages()[0];
      const { width: pw, height: ph } = page.getSize();

      // Incrustar firma
      if (firmaUrl && firmaBytes.current) {
        const isPNG = firmaUrl.toLowerCase().includes(".png") || firmaUrl.includes("image/png");
        const embFirma = isPNG
          ? await pdfDoc.embedPng(firmaBytes.current)
          : await pdfDoc.embedJpg(firmaBytes.current);
        page.drawImage(embFirma, {
          x:      firmaPos.x * pw,
          y:      ph - (firmaPos.y + firmaPos.h) * ph,
          width:  firmaPos.w * pw,
          height: firmaPos.h * ph,
        });
      }

      // Incrustar timbre
      if (timbreUrl && timbreBytes.current) {
        const isPNG = timbreUrl.toLowerCase().includes(".png") || timbreUrl.includes("image/png");
        const isPNGt = timbreUrl.toLowerCase().includes(".png") || timbreUrl.includes("image/png");
        const embTimbre = isPNGt
          ? await pdfDoc.embedPng(timbreBytes.current)
          : await pdfDoc.embedJpg(timbreBytes.current);
        page.drawImage(embTimbre, {
          x:      timbrePos.x * pw,
          y:      ph - (timbrePos.y + timbrePos.h) * ph,
          width:  timbrePos.w * pw,
          height: timbrePos.h * ph,
        });
      }

      const modified = await pdfDoc.save();
      const blob = new Blob([modified], { type: "application/pdf" });
      const file = new File([blob], pdfFile.name.replace(/\.pdf$/i, "_firmado.pdf"), { type: "application/pdf" });
      onConfirm(file);
    } catch (e) {
      console.error("FirmaEnPDF confirmar:", e);
      alert("Error al incrustar: " + e.message);
    } finally {
      setApplying(false);
    }
  };

  /* ── Overlay draggable genérico ─────────────────────────────── */
  const Overlay = ({ target, pos, imgSrc, label, color }) => (
    <div
      onMouseDown={e => { e.preventDefault(); startDrag(target, e.clientX, e.clientY); }}
      onTouchStart={e => { startDrag(target, e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }}
      style={{
        position: "absolute",
        left:   `${pos.x * 100}%`,
        top:    `${pos.y * 100}%`,
        width:  `${pos.w * 100}%`,
        height: `${pos.h * 100}%`,
        cursor: dragging === target ? "grabbing" : "grab",
        border: `2px solid ${color}`,
        borderRadius: 4,
        background: `${color}14`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxSizing: "border-box",
        zIndex: dragging === target ? 10 : 5,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={label} crossOrigin="anonymous"
        style={{ maxWidth:"95%", maxHeight:"95%", objectFit:"contain", pointerEvents:"none", userSelect:"none" }} />
      <span style={{ position:"absolute", top:2, left:4, fontSize:".42rem", background:"rgba(255,255,255,.9)", color, padding:"0 3px", borderRadius:2, fontWeight:700, fontFamily:"sans-serif" }}>
        ↕ {label}
      </span>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, width:"100%", maxWidth:800, maxHeight:"95vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,.35)" }}>

        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:".95rem" }}>Colocar firma y timbre en el acta</div>
            <div style={{ fontSize:".75rem", color:"#6b7280", marginTop:2 }}>Arrastrá cada recuadro al lugar correcto en el documento</div>
          </div>
          <button onClick={onCancel} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:"#9ca3af" }}>✕</button>
        </div>

        {/* Contenido */}
        <div style={{ flex:1, overflow:"auto", padding:16, display:"flex", gap:16, alignItems:"flex-start" }}>

          {/* PDF + overlays */}
          <div style={{ flex:1, position:"relative", minWidth:0 }} ref={wrapRef}>
            {loading && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400, background:"#f9fafb", borderRadius:8, color:"#9ca3af" }}>
                Cargando PDF…
              </div>
            )}
            {pdfError && (
              <div style={{ padding:16, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, color:"#991b1b", fontSize:".8rem" }}>
                {pdfError}
              </div>
            )}
            <div style={{ position:"relative", display: loading || pdfError ? "none" : "inline-block", width:"100%", userSelect:"none" }}>
              <canvas ref={canvasRef} style={{ width:"100%", height:"auto", display:"block", borderRadius:6, border:"1px solid #e5e7eb", boxShadow:"0 2px 8px rgba(0,0,0,.08)" }} />

              {firmaUrl && <Overlay target="firma"  pos={firmaPos}  imgSrc={firmaUrl}  label="firma"   color="#2563eb" />}
              {timbreUrl && <Overlay target="timbre" pos={timbrePos} imgSrc={timbreUrl} label="timbre"  color="#7c3aed" />}
            </div>
          </div>

          {/* Panel lateral */}
          <div style={{ width:190, flexShrink:0, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 12px", fontSize:".75rem", color:"#0369a1", lineHeight:1.5 }}>
              <strong>¿Cómo usar?</strong><br/>
              Arrastrá el recuadro <span style={{color:"#2563eb",fontWeight:700}}>azul (firma)</span> y el <span style={{color:"#7c3aed",fontWeight:700}}>violeta (timbre)</span> al lugar correcto.
            </div>

            {/* Vista previa firma */}
            {firmaUrl && (
              <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:".68rem", color:"#2563eb", fontWeight:700, marginBottom:4 }}>Firma del martillero</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={firmaUrl} alt="firma" crossOrigin="anonymous" style={{ width:"100%", height:40, objectFit:"contain", border:"1px solid #e5e7eb", borderRadius:4 }} />
                <div style={{ marginTop:6, fontSize:".68rem", color:"#6b7280" }}>
                  <div style={{marginBottom:2}}>Ancho: {Math.round(firmaPos.w*100)}%</div>
                  <input type="range" min="5" max="60" value={Math.round(firmaPos.w*100)}
                    onChange={e=>setFirmaPos(p=>({...p,w:Number(e.target.value)/100}))} style={{width:"100%"}}/>
                  <div style={{marginBottom:2}}>Alto: {Math.round(firmaPos.h*100)}%</div>
                  <input type="range" min="2" max="20" value={Math.round(firmaPos.h*100)}
                    onChange={e=>setFirmaPos(p=>({...p,h:Number(e.target.value)/100}))} style={{width:"100%"}}/>
                </div>
              </div>
            )}

            {/* Vista previa timbre */}
            {timbreUrl && (
              <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:".68rem", color:"#7c3aed", fontWeight:700, marginBottom:4 }}>Timbre</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={timbreUrl} alt="timbre" crossOrigin="anonymous" style={{ width:"100%", height:40, objectFit:"contain", border:"1px solid #e5e7eb", borderRadius:4 }} />
                <div style={{ marginTop:6, fontSize:".68rem", color:"#6b7280" }}>
                  <div style={{marginBottom:2}}>Ancho: {Math.round(timbrePos.w*100)}%</div>
                  <input type="range" min="5" max="40" value={Math.round(timbrePos.w*100)}
                    onChange={e=>setTimbrePos(p=>({...p,w:Number(e.target.value)/100}))} style={{width:"100%"}}/>
                  <div style={{marginBottom:2}}>Alto: {Math.round(timbrePos.h*100)}%</div>
                  <input type="range" min="5" max="30" value={Math.round(timbrePos.h*100)}
                    onChange={e=>setTimbrePos(p=>({...p,h:Number(e.target.value)/100}))} style={{width:"100%"}}/>
                </div>
              </div>
            )}

            {!firmaUrl && !timbreUrl && (
              <div style={{ background:"#fef3c7", border:"1px solid #fbbf24", borderRadius:8, padding:"12px 16px", fontSize:".78rem", color:"#92400e", textAlign:"center" }}>
                No hay firma ni timbre precargados.<br/>Subílos en Configuración primero.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 18px", borderTop:"1px solid #e5e7eb", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} disabled={applying}
            style={{ padding:".5rem 1.2rem", borderRadius:7, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:".82rem", color:"#374151" }}>
            Cancelar
          </button>
          <button onClick={confirmar} disabled={applying || loading || (!firmaUrl && !timbreUrl)}
            style={{ padding:".5rem 1.4rem", borderRadius:7, border:"none", background: applying?"#93c5fd":"#2563eb", color:"#fff", cursor: applying||loading?"not-allowed":"pointer", fontSize:".82rem", fontWeight:700 }}>
            {applying ? "Incrustando…" : "✓ Confirmar y subir"}
          </button>
        </div>
      </div>
    </div>
  );
}
