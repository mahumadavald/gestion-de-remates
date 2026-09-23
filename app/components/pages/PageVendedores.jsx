'use client'
import { useState } from "react";
import { useDashboard } from "../../lib/DashboardContext";

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
const ADJUDICACIONES = [];

export default function PageVendedores() {
  const {
    session, supabase, notify,
    dbLotes, selectedRemate,
    dbLicencias, REMATES_MERGED, liquidaciones,
  } = useDashboard();

  const [vendedorSel,         setVendedorSel]         = useState("");
  const [vendedorForm,        setVendedorForm]        = useState({comVenta:5, comDefensa:2, publicidad:0});
  const [dbVendedores,        setDbVendedores]        = useState([]);
  const [vendedorLiqGenerada, setVendedorLiqGenerada] = useState(null);

  const lotesDelRemate = dbLotes.filter(l => !selectedRemate || l.remate_id === selectedRemate);
  const propietariosUnicos = [...new Set(
    lotesDelRemate.map(l => l.propietario).filter(p => p && p.trim())
  )].sort();
  const lotesVendedor = vendedorSel
    ? lotesDelRemate.filter(l => l.propietario === vendedorSel)
    : [];
  const adjVendedor = [...ADJUDICACIONES, ...liquidaciones].filter(a=>
    lotesVendedor.find(l=>l.nombre===a.lote||l.id===a.loteId)
  );
  const totalVentas    = adjVendedor.reduce((s,a)=>s+(a.monto||0),0);
  const lotesNoVendidos = lotesVendedor.filter(l=>!adjVendedor.find(a=>a.lote===l.nombre||a.loteId===l.id));
  const totalNoVendido  = lotesNoVendidos.reduce((s,l)=>s+(l.base||0),0);
  const comVentaMonto  = Math.round(totalVentas * (vendedorForm.comVenta/100));
  const comDefensaMonto= Math.round(totalNoVendido * (vendedorForm.comDefensa/100));
  const ivaBase        = comVentaMonto + comDefensaMonto + Number(vendedorForm.publicidad||0);
  const iva            = Math.round(ivaBase * 0.19);
  const totalDescuentos= comVentaMonto + comDefensaMonto + Number(vendedorForm.publicidad||0) + iva;
  const liquidoAPagar  = totalVentas - totalDescuentos;

  const generarPDFVendedor = async () => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const casaData   = dbLicencias.find(x => x.slug === session?.casa) || {};
    const casaNombre = casaData.nombre    || session?.casaNombre || "Casa de Remates";
    const logoUrl    = casaData.logo_url  || null;
    const martillero = casaData.martillero|| "";
    const rutMart    = casaData.rut_martillero       || "";
    const telMart    = casaData.telefono_martillero  || casaData.telefono  || "";
    const emailMart  = casaData.email_martillero     || casaData.email     || "";

    const TEAL   = [20,  184, 166];
    const NAVY   = [13, 148, 136];
    const GRAY   = [100, 116, 139];
    const LTGRAY = [248, 250, 252];
    const BORDER = [226, 232, 240];
    const RED    = [239, 68,  68 ];
    const WHITE  = [255, 255, 255];

    const fmtCLP = v => "$ " + Math.round(v).toLocaleString("es-CL");
    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"letter"});
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 0;

    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, 3.5, "F");
    y = 10;

    let logoEndX = 14;
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise(res => { img.onload = res; img.onerror = res; img.src = logoUrl; });
        if (img.naturalWidth > 0) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const lw = Math.min(38, 22 * ratio);
          doc.addImage(img, "PNG", 14, y, lw, 22, undefined, "FAST");
          logoEndX = 14 + lw + 5;
        }
      } catch {}
    } else {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 72; canvas.height = 72;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#EBF8FF"; ctx.beginPath();
        ctx.roundRect(0,0,72,72,14); ctx.fill();
        ctx.strokeStyle = "#38B2F6"; ctx.lineWidth = 7;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(16,24); ctx.quadraticCurveTo(16,14,28,14);
        ctx.lineTo(44,14); ctx.quadraticCurveTo(60,14,60,28);
        ctx.quadraticCurveTo(60,38,48,40); ctx.lineTo(60,56); ctx.stroke();
        ctx.strokeStyle = "#1E3A5F";
        ctx.beginPath(); ctx.moveTo(8,24); ctx.quadraticCurveTo(8,10,24,10);
        ctx.lineTo(40,10); ctx.stroke();
        doc.addImage(canvas.toDataURL("image/png"), "PNG", 14, y, 18, 18, undefined, "FAST");
        logoEndX = 37;
      } catch {}
    }

    doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...NAVY);
    doc.text(casaNombre.toUpperCase(), logoEndX, y + 7);
    if (martillero) {
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...TEAL);
      doc.text("MARTILLERO PÚBLICO", logoEndX, y + 13);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
      doc.text(martillero, logoEndX, y + 18);
      let iY = y + 23;
      const info = [rutMart && `RUT: ${rutMart}`, telMart && `Tel: ${telMart}`, emailMart && `Email: ${emailMart}`].filter(Boolean);
      info.forEach(line => { doc.text(line, logoEndX, iY); iY += 4; });
    }

    doc.setFont("helvetica","bold"); doc.setFontSize(19); doc.setTextColor(...TEAL);
    doc.text("LIQUIDACIÓN", W - 14, y + 9, {align:"right"});
    doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text("VENDEDOR", W - 14, y + 16, {align:"right"});
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
    doc.text("Powered by TAKKA", W - 14, y + 32, {align:"right"});

    y = 42;
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 5;

    const remateSelObj = REMATES_MERGED.find(r => r.id === selectedRemate);
    const remNombreV   = remateSelObj?.name || REMATES_MERGED[0]?.name || "Remate";
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.3);
    doc.roundedRect(14, y, W - 28, 9, 2, 2, "FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
    doc.text(remNombreV, 19, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(...GRAY);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, W - 18, y + 6, {align:"right"});
    y += 14;

    const datosV = [
      ["PROPIETARIO", vendedorSel || "—"],
      ["REMATE",      remNombreV],
    ];
    const datosH = datosV.length * 6 + 8;
    doc.setFillColor(...LTGRAY); doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W - 28, datosH, 2, 2, "FD");
    let dvy = y + 7;
    datosV.forEach(([k, val]) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
      doc.text(k, 18, dvy);
      doc.setFont("helvetica","normal"); doc.setTextColor(30, 30, 30);
      doc.text(String(val || "—"), 56, dvy);
      dvy += 6;
    });
    y = dvy + 5;

    if (adjVendedor.length > 0) {
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
      doc.text("Lotes vendidos", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Lote", "Cant.", "Descripción", "Mínimo", "Defensa", "Valor"]],
        body: adjVendedor.map(a => {
          const lote = lotesVendedor.find(l => l.nombre === a.lote || l.id === a.loteId);
          return [
            lote?.orden || a.lote || "—",
            lote?.cantidad || 1,
            lote?.nombre || a.lote || "—",
            fmtCLP(lote?.minimo || 0),
            fmtCLP(lote?.defensa || 0),
            fmtCLP(a.monto || 0),
          ];
        }),
        styles: { fontSize:8.5, cellPadding:2.8 },
        headStyles: { fillColor:NAVY, textColor:WHITE, fontStyle:"bold", fontSize:8 },
        columnStyles: { 0:{halign:"center"}, 1:{halign:"center"}, 3:{halign:"right"}, 4:{halign:"right"}, 5:{halign:"right",fontStyle:"bold"} },
        alternateRowStyles: { fillColor:LTGRAY },
        tableLineColor:BORDER, tableLineWidth:0.2,
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    if (lotesNoVendidos.length > 0) {
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
      doc.text("Lotes no vendidos (base comisión defensa)", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Lote","Cant.","Descripción","Base"]],
        body: lotesNoVendidos.map(l => [l.orden||"—", l.cantidad||1, l.nombre||"—", fmtCLP(l.base||0)]),
        styles: { fontSize:8.5, cellPadding:2.8 },
        headStyles: { fillColor:GRAY, textColor:WHITE, fontStyle:"bold", fontSize:8 },
        columnStyles: { 0:{halign:"center"}, 1:{halign:"center"}, 3:{halign:"right"} },
        alternateRowStyles: { fillColor:LTGRAY },
        tableLineColor:BORDER, tableLineWidth:0.2,
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    if (y + 80 > H - 20) { doc.addPage(); y = 20; }

    const ivaComVenta    = Math.round(comVentaMonto * 0.19);
    const ivaComDefensa  = Math.round(comDefensaMonto * 0.19);
    const items = [
      { k: "Total Ventas",                                      v: totalVentas,                          bold: true  },
      { k: `Comisión Ventas ${vendedorForm.comVenta}%`,         v: -comVentaMonto,                       bold: false },
      { k: "IVA Comisión Ventas",                               v: -ivaComVenta,                         bold: false },
      { k: `Comisión Defensas ${vendedorForm.comDefensa}%`,     v: -comDefensaMonto,                     bold: false },
      { k: "IVA Comisión Defensas",                             v: -ivaComDefensa,                       bold: false },
      { k: "Avisos Publicitarios",                               v: -Number(vendedorForm.publicidad||0),  bold: false },
    ];
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text("Liquidación financiera", 14, y); y += 7;
    items.forEach(({ k, v, bold }) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9); doc.setTextColor(...(v < 0 && !bold ? GRAY : [30,30,30]));
      doc.text(k, 14, y);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...(v < 0 ? RED : [30,30,30]));
      doc.text(fmtCLP(v), W - 14, y, {align:"right"});
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
      doc.line(14, y + 2, W - 14, y + 2);
      y += 8;
    });
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.8);
    doc.line(14, y - 2, W - 14, y - 2);
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text("Total a Pagar:", 14, y + 8);
    doc.setFontSize(14); doc.setTextColor(...TEAL);
    doc.text(fmtCLP(liquidoAPagar), W - 14, y + 8, {align:"right"});

    const fy = H - 12;
    doc.setFillColor(...TEAL);
    doc.rect(0, H - 5, W, 5, "F");
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.line(14, fy - 3, W - 14, fy - 3);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text(`${casaNombre} · Powered by TAKKA · takka.cl`, 14, fy + 1);
    doc.text(new Date().toLocaleDateString("es-CL"), W - 14, fy + 1, {align:"right"});
    doc.save(`liquidacion-vendedor-${(vendedorSel||"vendedor").replace(/\s+/g,"-").toLowerCase()}.pdf`);
  };

  const generarPDFLotesVendedor = async () => {
    if (!vendedorSel) { notify("Selecciona un vendedor primero.", "inf"); return; }
    if (!lotesVendedor.length) { notify("Este vendedor no tiene lotes.", "inf"); return; }
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const remateNombre = REMATES_MERGED.find(r => r.id === selectedRemate || r.supabaseId === selectedRemate)?.name || "Remate";
    const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"letter" });
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(26, 115, 232); doc.rect(0, 0, W, 10, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(255,255,255);
    doc.text(`LOTES — ${vendedorSel.toUpperCase()}`, 14, 7);
    doc.setFontSize(9);
    doc.text(remateNombre, W - 14, 7, { align:"right" });
    autoTable(doc, {
      startY: 16,
      head: [["N° Lote","Cant.","Descripción","Mínimo","Comprador","Valor"]],
      body: lotesVendedor.map((l, i) => [
        l.orden ?? i + 1,
        l.cantidad || 1,
        l.nombre || "—",
        l.base ? `$ ${Number(l.base).toLocaleString("es-CL")}` : "—",
        "",
        ""
      ]),
      headStyles: { fillColor:[26,115,232], fontStyle:"bold", fontSize:9 },
      bodyStyles: { fontSize:8.5 },
      columnStyles: { 0:{cellWidth:18,halign:"center"}, 1:{cellWidth:16,halign:"center"}, 3:{halign:"right",cellWidth:30}, 4:{cellWidth:35}, 5:{cellWidth:30} },
      alternateRowStyles: { fillColor:[245,248,255] },
    });
    doc.save(`lotes-${(vendedorSel||"vendedor").replace(/\s+/g,"-").toLowerCase()}.pdf`);
    notify("PDF generado.", "sold");
  };

  const exportExcelLotesVendedor = async () => {
    if (!vendedorSel) { notify("Selecciona un vendedor primero.", "inf"); return; }
    if (!lotesVendedor.length) { notify("Este vendedor no tiene lotes.", "inf"); return; }
    const XLSX = await import("xlsx");
    const remateNombre = REMATES_MERGED.find(r => r.id === selectedRemate || r.supabaseId === selectedRemate)?.name || "Remate";
    const rows = [
      [`LOTES — ${vendedorSel}  |  ${remateNombre}`],
      [],
      ["N° Lote","Cantidad","Descripción","Mínimo","Comprador","Valor"],
      ...lotesVendedor.map((l, i) => [
        l.orden ?? i + 1,
        l.cantidad || 1,
        l.nombre || "",
        l.base || 0,
        "",
        ""
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{wch:10},{wch:10},{wch:55},{wch:15},{wch:25},{wch:20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lotes");
    XLSX.writeFile(wb, `lotes-${(vendedorSel||"vendedor").replace(/\s+/g,"-").toLowerCase()}.xlsx`);
    notify("Excel exportado.", "sold");
  };

  return (
    <div className="page">
      <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:"1.2rem",alignItems:"start"}}>

        <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.2rem 1.3rem"}}>
          <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:"1rem"}}>Seleccionar vendedor / consignatario</div>

          <div style={{marginBottom:".85rem"}}>
            <label className="fl">Propietario / Vendedor</label>
            <select className="fsel" value={vendedorSel} onChange={e=>setVendedorSel(e.target.value)}>
              <option value="">Seleccione un vendedor</option>
              {propietariosUnicos.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            {propietariosUnicos.length === 0 && (
              <div style={{marginTop:".5rem",fontSize:".7rem",color:"var(--mu)",fontStyle:"italic",lineHeight:1.5}}>
                No hay vendedores registrados en los lotes de este remate. Aseg&uacute;rate de completar el campo Propietario al crear los lotes.
              </div>
            )}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:".7rem"}}>
            <div>
              <label className="fl">Comisión ventas (%)</label>
              <input className="fi" type="number" step="0.01" min="0" max="100"
                value={vendedorForm.comVenta}
                onChange={e=>setVendedorForm(f=>({...f,comVenta:parseFloat(e.target.value)||0}))}/>
            </div>
            <div>
              <label className="fl">Comisión defensa (%)</label>
              <input className="fi" type="number" step="0.01" min="0" max="100"
                value={vendedorForm.comDefensa}
                onChange={e=>setVendedorForm(f=>({...f,comDefensa:parseFloat(e.target.value)||0}))}/>
            </div>
          </div>
          <div style={{marginBottom:"1rem"}}>
            <label className="fl">Avisos publicitarios ($)</label>
            <input className="fi" type="number" min="0"
              value={vendedorForm.publicidad}
              onChange={e=>setVendedorForm(f=>({...f,publicidad:parseInt(e.target.value)||0}))}/>
          </div>

          <div style={{padding:".6rem .85rem",background:"rgba(255,255,255,.03)",border:"1px solid var(--b1)",borderRadius:7,fontSize:".69rem",color:"var(--mu)",lineHeight:1.6,marginBottom:"1rem"}}>
            <strong style={{color:"var(--mu2)"}}>Comisión defensa</strong> — se aplica sobre la base de los lotes <strong style={{color:"var(--wh2)"}}>no vendidos</strong> como penalización o retiro anticipado.
          </div>

          <button className="btn-primary" style={{width:"100%"}}
            onClick={()=>{ if(!vendedorSel){notify("Selecciona un vendedor primero.","inf");return;} setVendedorLiqGenerada({vendedorSel,lotesVendedor,adjVendedor,lotesNoVendidos,totalVentas,comVentaMonto,comDefensaMonto,publicidad:Number(vendedorForm.publicidad||0),iva,totalDescuentos,liquidoAPagar,comVenta:vendedorForm.comVenta,comDefensa:vendedorForm.comDefensa}); notify("Liquidación generada.","sold"); }}>
            Generar liquidación
          </button>
          <div style={{display:"flex",gap:".5rem",marginTop:".6rem"}}>
            <button className="btn-sec" style={{flex:1,fontSize:".75rem"}} onClick={generarPDFLotesVendedor}>
              PDF lotes
            </button>
            <button className="btn-sec" style={{flex:1,fontSize:".75rem"}} onClick={exportExcelLotesVendedor}>
              Excel lotes
            </button>
          </div>
        </div>

        <div>
          {!vendedorLiqGenerada && !vendedorSel && (
            <div style={{padding:"4rem 2rem",textAlign:"center",opacity:.5}}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--mu)" strokeWidth="1.5" style={{marginBottom:"1rem"}}><rect x="8" y="4" width="32" height="40" rx="3"/><path d="M16 16h16M16 24h16M16 32h8"/></svg>
              <div style={{fontSize:".85rem",color:"var(--mu)"}}>Selecciona un vendedor para comenzar</div>
            </div>
          )}

          {vendedorSel && (
            <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.2rem 1.3rem"}}>
              <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:"1rem"}}>
                Preview liquidación — {vendedorSel}
              </div>

              <div style={{fontSize:".71rem",fontWeight:700,color:"var(--mu2)",marginBottom:".4rem",textTransform:"uppercase"}}>Lotes vendidos ({adjVendedor.length})</div>
              <div style={{background:"var(--s3)",borderRadius:8,overflow:"hidden",marginBottom:".85rem"}}>
                {adjVendedor.length===0
                  ? <div style={{padding:".8rem",fontSize:".73rem",color:"var(--mu)",textAlign:"center",fontStyle:"italic"}}>Sin adjudicaciones para este vendedor aún</div>
                  : adjVendedor.map((a,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".5rem .85rem",borderBottom:"1px solid var(--b1)"}}>
                      <span style={{fontSize:".75rem",color:"var(--wh2)",fontWeight:600}}>{a.lote}</span>
                      <span style={{fontFamily:"Inter,sans-serif",fontSize:".76rem",color:"var(--gr)",fontWeight:700}}>{fmt(a.monto||0)}</span>
                    </div>
                  ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:".5rem .85rem",background:"rgba(20,184,166,.05)"}}>
                  <span style={{fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase"}}>Total ventas</span>
                  <span style={{fontFamily:"Inter,sans-serif",fontWeight:800,color:"var(--gr)"}}>{fmt(totalVentas)}</span>
                </div>
              </div>

              <div style={{fontSize:".71rem",fontWeight:700,color:"var(--mu2)",marginBottom:".4rem",textTransform:"uppercase"}}>Descuentos</div>
              <div style={{background:"var(--s3)",borderRadius:8,overflow:"hidden",marginBottom:".85rem"}}>
                {[
                  [`Comisión ventas ${vendedorForm.comVenta}%`, comVentaMonto],
                  [`Comisión defensa ${vendedorForm.comDefensa}%`, comDefensaMonto],
                  ["Avisos publicitarios", Number(vendedorForm.publicidad||0)],
                  ["IVA 19% s/comisiones", iva],
                ].map(([k,v],i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:".5rem .85rem",borderBottom:"1px solid var(--b1)"}}>
                    <span style={{fontSize:".73rem",color:"var(--mu2)"}}>{k}</span>
                    <span style={{fontFamily:"Inter,sans-serif",fontSize:".73rem",color:"var(--rd)",fontWeight:600}}>− {fmt(v)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:".5rem .85rem",background:"rgba(245,101,101,.05)"}}>
                  <span style={{fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase"}}>Total descuentos</span>
                  <span style={{fontFamily:"Inter,sans-serif",fontWeight:800,color:"var(--rd)"}}>− {fmt(totalDescuentos)}</span>
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1rem 1.1rem",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.2)",borderRadius:9}}>
                <div>
                  <div style={{fontSize:".65rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Líquido a pagar al vendedor</div>
                  <div style={{fontSize:".68rem",color:"var(--mu)"}}>Ventas − comisiones − IVA</div>
                </div>
                <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.4rem",fontWeight:900,color:liquidoAPagar>=0?"var(--ac)":"var(--rd)"}}>
                  {fmt(liquidoAPagar)}
                </div>
              </div>

              <div style={{display:"flex",gap:".6rem",marginTop:"1rem"}}>
                <button className="btn-sec" style={{flex:1,fontSize:".75rem"}} onClick={async ()=>{
                  const vend = dbVendedores.find(v=>v.nombre===vendedorSel);
                  if (!vend?.email) { notify("El vendedor no tiene email registrado.", "inf"); return; }
                  try {
                    const res = await fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ to:vend.email, subject:`Liquidación de ventas — ${session?.casaNombre||"TAKKA"}`, html:`<p>Estimado ${vendedorSel},</p><p>Su liquidación de ventas está disponible. Líquido a pagar: <strong>${fmt(liquidoAPagar)}</strong>.</p>` }) });
                    const d = await res.json();
                    if (d.ok) notify("Correo enviado al vendedor.", "sold");
                    else notify("Error al enviar: " + (d.error||"intenta de nuevo"), "inf");
                  } catch { notify("Error de red al enviar correo.", "inf"); }
                }}>
                  Enviar correo
                </button>
                <button className="btn-primary" style={{flex:1,fontSize:".75rem"}} onClick={generarPDFVendedor}>
                  Descargar PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
