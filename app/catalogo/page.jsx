'use client'
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const fmtClp = n => n && n > 0 ? `$${Number(n).toLocaleString("es-CL")}` : "—";

export default function CatalogoInternoPage() {
  const [remates,  setRemates]  = useState([]);
  const [lotes,    setLotes]    = useState([]);
  const [rId,      setRId]      = useState("");
  const [loading,  setLoading]  = useState(true);
  const [genPDF,   setGenPDF]   = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    Promise.all([
      supabase.from("remates").select("id,nombre,fecha,codigo").order("fecha", { ascending: false }),
      supabase.from("lotes").select("*,remates(nombre,fecha)").order("orden"),
    ]).then(([{ data: rData }, { data: lData }]) => {
      setRemates(rData || []);
      setLotes(lData || []);
      if (rData?.length) setRId(rData[0].id);
      setLoading(false);
    });
  }, []);

  const lotesFiltrados = useMemo(() =>
    lotes
      .filter(l => rId ? l.remate_id === rId : false)
      .sort((a, b) => (a.orden || 999) - (b.orden || 999)),
    [lotes, rId]
  );

  const remateActual = remates.find(r => r.id === rId);

  const generarPDF = async () => {
    if (!lotesFiltrados.length) return alert("No hay lotes para este remate.");
    setGenPDF(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const nombre = remateActual?.nombre || "Remate";
      const fecha  = remateActual?.fecha
        ? new Date(remateActual.fecha).toLocaleDateString("es-CL", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })
        : "";

      // ── Portada ──
      doc.setFillColor(10, 12, 16);
      doc.rect(0, 0, W, H, "F");

      // Borde lateral cyan
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 0, 4, H, "F");

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("REMATES AHUMADA", 14, 36);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(nombre, W - 28);
      doc.text(lines, 14, 52);

      if (fecha) {
        doc.setTextColor(139, 148, 158);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(fecha, 14, 52 + lines.length * 9 + 6);
      }

      // Separador
      doc.setDrawColor(30, 38, 45);
      doc.setLineWidth(0.5);
      doc.line(14, H / 2 - 10, W - 14, H / 2 - 10);

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("CATÁLOGO", 14, H / 2 + 5);

      doc.setTextColor(139, 148, 158);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${lotesFiltrados.length} lote${lotesFiltrados.length !== 1 ? "s" : ""} · Generado ${new Date().toLocaleDateString("es-CL")}`, 14, H - 20);
      doc.text("TAKKA — Sistema de Gestión de Remates", 14, H - 13);

      // ── Páginas de lotes ──
      for (let i = 0; i < lotesFiltrados.length; i++) {
        const l = lotesFiltrados[i];
        doc.addPage();

        // Header de página
        doc.setFillColor(10, 12, 16);
        doc.rect(0, 0, W, 18, "F");
        doc.setFillColor(6, 182, 212);
        doc.rect(0, 0, W, 1.5, "F");
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("REMATES AHUMADA", 14, 8);
        doc.setTextColor(139, 148, 158);
        doc.text(nombre.toUpperCase(), 14, 13);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`Lote ${l.orden || i + 1} / ${lotesFiltrados.length}`, W - 14, 10, { align: "right" });

        // Número de lote grande
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`LOTE ${String(l.orden || i + 1).padStart(2, "0")}`, 14, 30);

        // Nombre del lote
        doc.setTextColor(20, 20, 20);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 33, W - 28, 18, 2, 2, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(10, 12, 16);
        const nameLines = doc.splitTextToSize(l.nombre || "Sin nombre", W - 36);
        doc.text(nameLines.slice(0, 2), 20, 42);

        // Imagen (si existe)
        let yAfterImg = 58;
        const imgs = Array.isArray(l.imagenes) ? l.imagenes : l.imagenes ? [l.imagenes] : [];
        if (imgs[0]) {
          try {
            const imgData = await loadImageAsBase64(imgs[0]);
            if (imgData) {
              doc.addImage(imgData, "JPEG", 14, 58, 80, 60, "", "FAST");
              yAfterImg = 58;
            }
          } catch { /* sin imagen */ }
        }

        // Datos del lote (columna derecha si hay imagen, o completo si no)
        const dataX = imgs[0] ? 100 : 14;
        const dataW = imgs[0] ? W - 114 : W - 28;

        const campos = [
          ["Código",      l.codigo || "—"],
          ["Categoría",   l.categoria || "—"],
          ["Base",        fmtClp(l.base)],
          ["Mínimo",      fmtClp(l.minimo)],
          ["Cantidad",    String(l.cantidad || 1)],
          ["Tipo IVA",    l.tipo_iva === "AF" ? "Afecto" : "Exento"],
        ].filter(([, v]) => v && v !== "—" || true);

        let dy = imgs[0] ? 62 : 62;
        doc.setFontSize(8);
        campos.forEach(([label, val]) => {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 110, 120);
          doc.text(label.toUpperCase(), dataX, dy);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(10, 12, 16);
          doc.text(String(val), dataX + dataW * 0.45, dy);
          dy += 8;
        });

        // Descripción
        if (l.descripcion) {
          const descY = Math.max(yAfterImg + 64, dy + 6);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 110, 120);
          doc.text("DESCRIPCIÓN", 14, descY);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          const descLines = doc.splitTextToSize(l.descripcion, W - 28);
          doc.text(descLines.slice(0, 5), 14, descY + 5);
        }

        // Footer
        doc.setDrawColor(230, 233, 237);
        doc.setLineWidth(0.3);
        doc.line(14, H - 14, W - 14, H - 14);
        doc.setTextColor(180, 185, 190);
        doc.setFontSize(7);
        doc.text("Remates Ahumada · Generado con TAKKA", 14, H - 8);
        doc.text(`Pág. ${i + 2}`, W - 14, H - 8, { align: "right" });
      }

      // ── Tabla resumen final ──
      doc.addPage();
      doc.setFillColor(10, 12, 16);
      doc.rect(0, 0, W, 18, "F");
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 0, W, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN COMPLETO DE LOTES", 14, 12);

      autoTable(doc, {
        startY: 22,
        head: [["#", "Código", "Descripción", "Categoría", "Base", "Mínimo"]],
        body: lotesFiltrados.map((l, i) => [
          String(l.orden || i + 1).padStart(2, "0"),
          l.codigo || "—",
          (l.nombre || "").slice(0, 45),
          l.categoria || "—",
          fmtClp(l.base),
          fmtClp(l.minimo),
        ]),
        styles: { fontSize: 7.5, cellPadding: 3 },
        headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { halign: "center", cellWidth: 10 }, 4: { halign: "right" }, 5: { halign: "right" } },
      });

      const slug = nombre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      doc.save(`catalogo-${slug}.pdf`);
    } catch (e) {
      alert("Error generando PDF: " + e.message);
    } finally {
      setGenPDF(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: var(--bg, #f4f6f9); color: var(--wh, #111827); font-family: 'Inter',-apple-system,sans-serif; min-height: 100vh; }
        @media (prefers-color-scheme: dark) { html,body { --bg:#0d1117; --wh:#e6edf3; --s2:#161b22; --b1:#21262d; --mu:#8b949e; } }
        .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .header { margin-bottom: 1.5rem; }
        .header h1 { font-size: 1.3rem; font-weight: 900; letter-spacing: -.02em; }
        .header p { font-size: .78rem; color: var(--mu, #6b7280); margin-top: .25rem; }
        .controls { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 1rem 1.25rem; background: var(--s2, #fff); border: 1px solid var(--b1, #e5e7eb); border-radius: 12px; }
        .fsel { background: var(--s2,#fff); border: 1px solid var(--b1,#e5e7eb); color: var(--wh,#111); border-radius: 8px; padding: .45rem .75rem; font-size: .82rem; font-family: inherit; outline: none; flex: 1; min-width: 200px; }
        .btn-pdf { background: #06B6D4; color: #fff; border: none; border-radius: 8px; padding: .5rem 1.25rem; font-size: .82rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: .4rem; transition: opacity .15s; white-space: nowrap; }
        .btn-pdf:hover { opacity: .88; }
        .btn-pdf:disabled { opacity: .5; cursor: not-allowed; }
        .stat-row { display: flex; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .stat { background: var(--s2,#fff); border: 1px solid var(--b1,#e5e7eb); border-radius: 10px; padding: .75rem 1.1rem; flex: 1; min-width: 120px; }
        .stat-label { font-size: .6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--mu,#6b7280); margin-bottom: .2rem; }
        .stat-value { font-size: 1.1rem; font-weight: 800; color: #06B6D4; }
        table { width: 100%; border-collapse: collapse; font-size: .82rem; background: var(--s2,#fff); border: 1px solid var(--b1,#e5e7eb); border-radius: 12px; overflow: hidden; }
        thead { background: #06B6D4; }
        thead th { color: #fff; font-weight: 700; padding: .65rem .9rem; text-align: left; font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }
        tbody tr { border-bottom: 1px solid var(--b1,#e5e7eb); transition: background .1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(6,182,212,.04); }
        td { padding: .6rem .9rem; color: var(--wh,#111); vertical-align: middle; }
        .lote-num { font-weight: 800; color: #06B6D4; font-size: .9rem; text-align: center; }
        .lote-cod { font-size: .7rem; color: var(--mu,#6b7280); }
        .lote-nombre { font-weight: 600; max-width: 260px; }
        .lote-cat { font-size: .68rem; background: rgba(6,182,212,.08); color: #06B6D4; border: 1px solid rgba(6,182,212,.2); border-radius: 4px; padding: .1rem .4rem; display: inline-block; }
        .lote-precio { font-weight: 700; text-align: right; color: #06B6D4; }
        .lote-min { font-size: .75rem; color: var(--mu,#6b7280); text-align: right; }
        .empty { text-align: center; padding: 4rem 1rem; color: var(--mu,#6b7280); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { width: 28px; height: 28px; border: 3px solid var(--b1,#e5e7eb); border-top-color: #06B6D4; border-radius: 50%; animation: spin .8s linear infinite; margin: 3rem auto; }
      `}</style>

      <div className="page">
        <div className="header">
          <h1>Catálogo de Remate</h1>
          <p>Lista de lotes en orden de subasta · Genera el PDF descargable para el sitio web</p>
        </div>

        <div className="controls">
          <select className="fsel" value={rId} onChange={e => setRId(e.target.value)}>
            <option value="">— Selecciona un remate —</option>
            {remates.map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre}{r.fecha ? ` · ${new Date(r.fecha).toLocaleDateString("es-CL")}` : ""}
              </option>
            ))}
          </select>
          <button className="btn-pdf" disabled={!rId || !lotesFiltrados.length || genPDF} onClick={generarPDF}>
            {genPDF
              ? <><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/> Generando...</>
              : <>⬇ Descargar PDF Catálogo</>}
          </button>
        </div>

        {loading ? (
          <div className="spin"/>
        ) : !rId ? (
          <div className="empty">Selecciona un remate para ver los lotes</div>
        ) : lotesFiltrados.length === 0 ? (
          <div className="empty">No hay lotes asignados a este remate</div>
        ) : (
          <>
            <div className="stat-row">
              <div className="stat"><div className="stat-label">Total lotes</div><div className="stat-value">{lotesFiltrados.length}</div></div>
              <div className="stat"><div className="stat-label">Base total</div><div className="stat-value">{fmtClp(lotesFiltrados.reduce((s,l)=>s+(l.base||0),0))}</div></div>
              <div className="stat"><div className="stat-label">Con imagen</div><div className="stat-value">{lotesFiltrados.filter(l=>l.imagenes&&(Array.isArray(l.imagenes)?l.imagenes.length>0:true)).length}</div></div>
              <div className="stat"><div className="stat-label">Remate</div><div className="stat-value" style={{fontSize:".78rem"}}>{remateActual?.nombre}</div></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{width:50}}>Orden</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th style={{textAlign:"right"}}>Base</th>
                  <th style={{textAlign:"right"}}>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.map((l, i) => (
                  <tr key={l.id}>
                    <td className="lote-num">{String(l.orden || i+1).padStart(2,"0")}</td>
                    <td>
                      <div className="lote-nombre">{l.nombre}</div>
                      {l.codigo && <div className="lote-cod">#{l.codigo}</div>}
                    </td>
                    <td>{l.categoria && <span className="lote-cat">{l.categoria}</span>}</td>
                    <td className="lote-precio">{fmtClp(l.base)}</td>
                    <td className="lote-min">{fmtClp(l.minimo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}

async function loadImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}
