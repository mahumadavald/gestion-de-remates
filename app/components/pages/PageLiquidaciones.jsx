'use client'
import { useDashboard } from "../../lib/DashboardContext";
import { calcLiquidacion } from "../../lib/liquidacion";

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);

export default function PageLiquidaciones() {
  const {
    session, supabase, authFetch, notify,
    REMATES_MERGED, POSTORES_MERGED, liquidaciones,
    selectedRemate, setSelectedRemate,
    page, setPage,
    dbLicencias,
    liqReview, setLiqReview,
    liqExpanded, setLiqExpanded,
    GASTO_ADMIN_MOTORIZADO,
  } = useDashboard();

  const generarPDFLiquidacion = async (c, fechaRemate) => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const p   = c.postorData;
    const l   = c.liq;
    const num = String(c.key).padStart(2,"0");

    const casaData   = dbLicencias.find(x => x.slug === session?.casa) || {};
    const casaNombre = casaData.nombre    || session?.casaNombre || "Casa de Remates";
    const logoUrl    = casaData.logo_url  || null;
    const martillero = casaData.martillero|| "";
    const rutMart    = casaData.rut_martillero       || "";
    const telMart    = casaData.telefono_martillero  || casaData.telefono  || "";
    const remNombre  = liqReview?.remateNombre || "Remate";

    const TEAL   = [20,  184, 166];
    const NAVY   = [13, 148, 136];
    const CYAN   = [6,   182, 212];
    const GRAY   = [100, 116, 139];
    const LTGRAY = [248, 250, 252];
    const BORDER = [226, 232, 240];
    const GREEN  = [22,  163, 74 ];
    const WHITE  = [255, 255, 255];

    const fmtCLP = v => "$ " + Math.round(v).toLocaleString("es-CL");

    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 0;

    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, 3.5, "F");
    y = 10;

    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise(res => { img.onload = res; img.onerror = res; img.src = logoUrl; });
        if (img.naturalWidth > 0) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const lw = Math.min(36, 24 * ratio);
          doc.addImage(img, "PNG", 14, y, lw, 24, undefined, "FAST");
        }
      } catch {}
    }

    try {
      const grCanvas = document.createElement("canvas");
      grCanvas.width = 72; grCanvas.height = 72;
      const ctx2 = grCanvas.getContext("2d");
      ctx2.fillStyle = "#EBF8FF"; ctx2.beginPath();
      ctx2.roundRect(0,0,72,72,14); ctx2.fill();
      ctx2.strokeStyle = "#38B2F6"; ctx2.lineWidth = 7;
      ctx2.lineCap = "round"; ctx2.lineJoin = "round";
      ctx2.beginPath(); ctx2.moveTo(16,24); ctx2.quadraticCurveTo(16,14,28,14);
      ctx2.lineTo(44,14); ctx2.quadraticCurveTo(60,14,60,28);
      ctx2.quadraticCurveTo(60,38,48,40); ctx2.lineTo(60,56); ctx2.stroke();
      ctx2.strokeStyle = "#1E3A5F";
      ctx2.beginPath(); ctx2.moveTo(8,24); ctx2.quadraticCurveTo(8,10,24,10);
      ctx2.lineTo(40,10); ctx2.stroke();
      doc.addImage(grCanvas.toDataURL("image/png"), "PNG", W - 14 - 16, y + 1, 16, 16, undefined, "FAST");
      doc.setFont("helvetica","normal"); doc.setFontSize(5.5); doc.setTextColor(...GRAY);
      doc.text("TAKKA", W - 14 - 8, y + 20, { align:"center" });
    } catch {}

    doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(...TEAL);
    doc.text("LIQUIDACIÓN", W / 2, y + 9, { align:"center" });
    doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text("COMPRADOR", W / 2, y + 16, { align:"center" });
    doc.setFontSize(22); doc.setTextColor(...CYAN);
    doc.text(`N° ${num}`, W / 2, y + 26, { align:"center" });

    y = 42;
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 2;

    doc.setFillColor(...NAVY);
    doc.rect(14, y, W - 28, martillero ? 14 : 8, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text(casaNombre.toUpperCase(), W / 2, y + 6, { align:"center" });
    if (martillero) {
      const infoLine = [martillero, rutMart && `RUT: ${rutMart}`, telMart && `Tel: ${telMart}`].filter(Boolean).join("  ·  ");
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(180, 220, 240);
      doc.text(infoLine, W / 2, y + 11.5, { align:"center" });
    }
    y += (martillero ? 14 : 8) + 5;

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.3);
    doc.roundedRect(14, y, W - 28, 9, 2, 2, "FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
    doc.text(remNombre, 19, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(...GRAY);
    doc.text(`Fecha: ${fechaRemate}`, W - 18, y + 6, { align:"right" });
    y += 14;

    const datos = [
      ["SEÑOR(ES)", p?.razonSocial || p?.nombre || "—"],
      ["R.U.T.",    p?.rut         || "—"],
      ["GIRO",      p?.giro        || "—"],
      ["DIRECCIÓN", p?.direccion   || "—"],
      ["TELÉFONO",  p?.tel         || "—"],
      ["MAIL",      p?.email       || "—"],
      ["COMUNA",    p?.comuna      || "—"],
    ];
    const datosH = datos.length * 6 + 8;
    doc.setFillColor(...LTGRAY); doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W - 28, datosH, 2, 2, "FD");
    let dy = y + 7;
    datos.forEach(([k, v]) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
      doc.text(k, 18, dy);
      doc.setFont("helvetica","normal"); doc.setTextColor(30, 30, 30);
      doc.text(String(v || "—"), 56, dy);
      dy += 6;
    });
    y = dy + 5;

    const rows = [];
    l.lineas.forEach((ln, li) => {
      const label = `LOTE ${li + 1}`;
      rows.push([label, "1", ln.lote.toUpperCase(), "EX", fmtCLP(ln.monto), fmtCLP(ln.monto)]);
      rows.push([label, "1", `Comisión ${ln.comPct}%`, "AF", fmtCLP(ln.com), fmtCLP(ln.com)]);
      if (ln.motorizado) rows.push(["G-ADM", "1", `Gastos Adm. Vehículo (${label})`, "AF", fmtCLP(ln.gastosAdm), fmtCLP(ln.gastosAdm)]);
    });

    autoTable(doc, {
      startY: y,
      head: [["LOTE","CANT.","DESCRIPCIÓN","ND","UNITARIO","TOTAL"]],
      body: rows,
      styles: { fontSize:8, cellPadding:2.8, textColor:[30,30,30], font:"helvetica" },
      headStyles: { fillColor:NAVY, textColor:WHITE, fontStyle:"bold", fontSize:7.5, halign:"center" },
      columnStyles: {
        0: { cellWidth:18, halign:"center", textColor:GRAY, fontSize:7.5 },
        1: { cellWidth:12, halign:"center" },
        2: { cellWidth:"auto" },
        3: { cellWidth:13, halign:"center" },
        4: { cellWidth:26, halign:"right" },
        5: { cellWidth:26, halign:"right", fontStyle:"bold" },
      },
      alternateRowStyles: { fillColor:LTGRAY },
      tableLineColor:BORDER, tableLineWidth:0.2,
      didDrawCell: (data) => {
        if (data.section==="body" && data.column.index===3) {
          const txt = data.cell.raw;
          const x=data.cell.x+1.5, cy=data.cell.y+1.8, w=data.cell.width-3, h=data.cell.height-3.5;
          if (txt==="EX") { doc.setFillColor(220,252,231); doc.setDrawColor(134,239,172); }
          else            { doc.setFillColor(204,251,241); doc.setDrawColor(94,234,212); }
          doc.roundedRect(x,cy,w,h,1,1,"FD");
          doc.setFontSize(6.5); doc.setFont("helvetica","bold");
          doc.setTextColor(txt==="EX"?22:15, txt==="EX"?163:118, txt==="EX"?74:110);
          doc.text(txt, x+w/2, cy+h-1.2, {align:"center"});
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;
    if (y + 70 > H - 20) { doc.addPage(); y = 20; }

    const colW = (W - 28) / 2 - 4;
    const totalesY = y;
    const ivaBase = l.totalCom + l.totalAf;
    const totItems = [
      ["PRECIO MARTILLO (EX)",   l.totalEx,  false],
      ["COMISIONES MARTILLERO (AF)", l.totalCom, false],
      ...(l.totalAf > 0 ? [["GASTOS ADM. (AF)", l.totalAf, false]] : []),
      ["BASE AFECTA IVA",        ivaBase,    true],
      ["IVA 19%",                l.iva,      false],
    ];
    let ty = totalesY;
    totItems.forEach(([k, v, bold]) => {
      doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(8.5);
      doc.setTextColor(...(bold ? NAVY : GRAY));
      doc.text(k, 14, ty);
      doc.setFont("helvetica","bold"); doc.setTextColor(30, 30, 30);
      doc.text(fmtCLP(v), 14 + colW, ty, { align:"right" });
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
      doc.line(14, ty + 2, 14 + colW, ty + 2);
      ty += 6.5;
    });
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.6);
    doc.line(14, ty, 14 + colW, ty);
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...NAVY);
    doc.text("TOTAL:", 14, ty + 7);
    doc.setFontSize(11); doc.setTextColor(...TEAL);
    doc.text(fmtCLP(l.total), 14 + colW, ty + 7, { align:"right" });

    const bx = W / 2 + 6, bw = W / 2 - 20, bh = 34;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.6);
    doc.roundedRect(bx, totalesY, bw, bh, 3, 3, "FD");
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
    doc.text("GARANTÍA:", bx + 5, totalesY + 10);
    doc.setFont("helvetica","bold"); doc.setTextColor(...GREEN);
    doc.text(fmtCLP(l.garantia), bx + bw - 5, totalesY + 10, { align:"right" });
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.line(bx + 5, totalesY + 14, bx + bw - 5, totalesY + 14);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text("TOTAL A PAGAR:", bx + 5, totalesY + 24);
    doc.setFontSize(14); doc.setTextColor(...TEAL);
    doc.text(fmtCLP(l.totalAPagar), bx + bw - 5, totalesY + 25, { align:"right" });

    const fy = H - 12;
    doc.setFillColor(...TEAL);
    doc.rect(0, H - 5, W, 5, "F");
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.line(14, fy - 3, W - 14, fy - 3);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text(`${casaNombre} · Powered by TAKKA · takka.cl`, 14, fy + 1);
    doc.text(`Remate ${fechaRemate} · Comprador N° ${num}`, W - 14, fy + 1, { align:"right" });

    doc.save(`liquidacion-comprador-${num}-${fechaRemate.replace(/\//g,"-")}.pdf`);
  };

  const cerrados = REMATES_MERGED.filter(r => r.estado === "cerrado");

  return (
    <div className="page">
      {/* Banner selector de remate */}
      {cerrados.length === 0 ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:"1rem",color:"var(--mu)"}}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 40V16l16-8 16 8v24"/><path d="M20 40v-8h8v8"/><path d="M16 24h4M28 24h4M16 32h4M28 32h4"/></svg>
          <div style={{fontSize:".95rem",fontWeight:600,color:"var(--wh2)"}}>No hay remates cerrados aún</div>
          <div style={{fontSize:".78rem",textAlign:"center",maxWidth:320}}>Las liquidaciones se generan automáticamente al cerrar un remate desde la Sala en vivo.</div>
          <button className="btn-primary" style={{marginTop:".5rem"}} onClick={()=>setPage("sala")}>Ir a Sala en vivo</button>
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1rem",padding:".75rem 1rem",background:"rgba(56,178,246,.06)",border:"1px solid rgba(56,178,246,.18)",borderRadius:9}}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5h6M5 11h3"/></svg>
          <span style={{fontSize:".78rem",fontWeight:700,color:"var(--wh2)",whiteSpace:"nowrap"}}>Remate:</span>
          <select
            value={selectedRemate||""}
            onChange={e => {
              const rid = e.target.value||null;
              setSelectedRemate(rid);
              if(rid) {
                const r = REMATES_MERGED.find(x=>x.id===rid);
                if(r) {
                  const remateLiqs = liquidaciones.filter(l => l.remateId === rid);
                  const byComprador = {};
                  remateLiqs.forEach(l=>{
                    const postorClean = (l.postor||"").replace(/ \((Online|Presencial)\)$/,"");
                    const pd = POSTORES_MERGED.find(p=>p.name===postorClean||p.razonSocial===postorClean)||null;
                    const key = pd?.nComprador??postorClean||l.postor;
                    if(!byComprador[key]) byComprador[key]={postorData:pd,lotes:[],key};
                    byComprador[key].lotes.push(l);
                  });
                  const compradores = Object.values(byComprador).map(c=>({
                    ...c,
                    liq: calcLiquidacion(c.lotes, c.postorData, GASTO_ADMIN_MOTORIZADO),
                    enviado:   c.lotes.some(l => l.enviado),
                    pagado:    c.lotes.some(l => l.estado === "pagado"),
                    facturado: c.lotes.some(l => l.facturado),
                  }));
                  setLiqReview({compradores,fecha:r.fecha,remateNombre:r.name,remateId:r.id});
                }
              } else {
                setLiqReview(null);
              }
            }}
            style={{flex:1,maxWidth:340,padding:".4rem .7rem",background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:7,color:"var(--wh2)",fontSize:".8rem",fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
            <option value="">— Selecciona un remate —</option>
            {cerrados.map(r => (
              <option key={r.id} value={r.id}>{r.name} · {r.fecha} · {r.casa}</option>
            ))}
          </select>
          {selectedRemate && (
            <button onClick={()=>{setSelectedRemate(null);setLiqReview(null);}}
              style={{background:"transparent",border:"1px solid var(--b2)",borderRadius:6,color:"var(--mu2)",fontSize:".7rem",padding:".3rem .6rem",cursor:"pointer",whiteSpace:"nowrap"}}>
              Limpiar
            </button>
          )}
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.2rem",padding:".85rem 1rem",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.2)",borderRadius:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:".82rem",fontWeight:700,color:"var(--wh2)",marginBottom:".2rem"}}>
            {liqReview
              ? <span>Liquidaciones — <span style={{color:"var(--ac)"}}>{liqReview.remateNombre||"Remate"}</span> &nbsp;·&nbsp; <span style={{fontFamily:"Inter,sans-serif",color:"var(--mu2)"}}>{liqReview.fecha}</span> &nbsp;·&nbsp; {liqReview.compradores.length} compradores</span>
              : "Liquidaciones por comprador"
            }
          </div>
          <div style={{fontSize:".73rem",color:"var(--mu2)"}}>
            Revisa cada liquidacion antes de enviar. Una vez confirmadas se envia el correo con PDF a cada adjudicatario.
          </div>
        </div>
        {liqReview && (
          <button className="btn-primary" onClick={async ()=>{
            const pendientes = liqReview.compradores.filter(c=>!c.enviado);
            if (!pendientes.length) { notify("Todos ya enviados.", "inf"); return; }
            let ok = 0, err = 0;
            for (const comp of pendientes) {
              const email = comp.postorData?.email || "";
              if (!email) { err++; continue; }
              try {
                const res = await authFetch("/api/liquidaciones/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: email,
                    postorNombre: comp.postorData?.name || "Comprador",
                    rut: comp.postorData?.rut || "",
                    liq: comp.liq,
                    remateNombre: liqReview.remateNombre,
                    fecha: liqReview.fecha,
                  }),
                });
                if (res.ok) { ok++; setLiqReview(r=>({...r,compradores:r.compradores.map(c=>c===comp?{...c,enviado:true}:c)})); }
                else err++;
              } catch { err++; }
            }
            notify(`${ok} enviados${err ? ` · ${err} sin email o con error` : ""}.`, ok?"ok":"inf");
          }}>
            Enviar a todos ({liqReview?.compradores?.filter(c=>!c.enviado).length} pendientes)
          </button>
        )}
      </div>

      {!liqReview && (
        <div style={{padding:"4rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"2rem",opacity:.2,marginBottom:"1rem"}}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--mu)" strokeWidth="1.5"><rect x="8" y="4" width="32" height="40" rx="3"/><path d="M16 16h16M16 24h16M16 32h8"/></svg>
          </div>
          <div style={{fontSize:".88rem",fontWeight:700,color:"var(--wh2)",marginBottom:".4rem"}}>Sin liquidaciones aun</div>
          <div style={{fontSize:".76rem",color:"var(--mu)",lineHeight:1.6}}>
            Las liquidaciones se generan al cerrar el remate desde la Sala en vivo.<br/>
            Presiona <strong style={{color:"var(--wh2)"}}>Cerrar remate</strong> para agruparlas por comprador y revisarlas antes de enviar.
          </div>
        </div>
      )}

      {liqReview && (
        <div className="table-card" style={{marginBottom:"1.2rem"}}>
          <div className="table-head">
            <div className="table-title">Resumen compradores — {liqReview.fecha}</div>
            <div style={{fontSize:".72rem",color:"var(--mu)"}}>
              {liqReview.compradores.length} compradores · Total bruto{" "}
              <strong style={{color:"var(--ac)"}}>
                {fmt(liqReview.compradores.reduce((s,c)=>s+c.liq.total,0))}
              </strong>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>N° Part.</th>
                <th>Nombre cliente</th>
                <th>Lotes</th>
                <th style={{textAlign:"right"}}>Garantía</th>
                <th style={{textAlign:"right"}}>Total bruto</th>
                <th style={{textAlign:"right"}}>Total a pagar</th>
                <th style={{textAlign:"center"}}>Estado</th>
                <th style={{textAlign:"center"}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {liqReview.compradores.map((c,ci)=>{
                const p = c.postorData;
                const l = c.liq;
                return (
                  <tr key={ci} style={{cursor:"pointer"}} onClick={()=>setLiqExpanded(liqExpanded===ci?null:ci)}>
                    <td>
                      <div style={{width:30,height:30,borderRadius:6,background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:".78rem",fontWeight:800,color:"var(--ac)"}}>
                        {String(c.key).padStart(2,"0")}
                      </div>
                    </td>
                    <td style={{fontWeight:600,color:"var(--wh2)",textTransform:"uppercase"}}>
                      {p?.razonSocial||c.lotes[0]?.postor||"—"}
                    </td>
                    <td style={{fontFamily:"Inter,sans-serif",fontSize:".78rem",color:"var(--mu2)",textAlign:"center"}}>
                      {c.lotes.length}
                    </td>
                    <td style={{fontFamily:"Inter,sans-serif",fontSize:".78rem",textAlign:"right",color:l.garantia>0?"var(--yl)":"var(--mu)"}}>
                      {fmt(l.garantia)}
                    </td>
                    <td style={{fontFamily:"Inter,sans-serif",fontWeight:700,textAlign:"right",color:"var(--wh2)"}}>
                      {fmt(l.total)}
                    </td>
                    <td style={{fontFamily:"Inter,sans-serif",fontWeight:800,textAlign:"right",color:"var(--ac)",fontSize:".9rem"}}>
                      {fmt(l.totalAPagar)}
                    </td>
                    <td style={{textAlign:"center"}}>
                      {c.enviado
                        ? <span className="sent-badge">Enviado</span>
                        : <span className="pill p-saldo">Pendiente</span>}
                    </td>
                    <td style={{textAlign:"center"}}>
                      <button
                        className="btn-primary"
                        style={{fontSize:".68rem",padding:".28rem .7rem"}}
                        onClick={e=>{e.stopPropagation();setLiqExpanded(ci);setTimeout(()=>document.getElementById(`liq-card-${ci}`)?.scrollIntoView({behavior:"smooth",block:"start"}),50);}}
                      >
                        Ver liquidación
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:"2px solid var(--b2)",background:"rgba(255,255,255,.02)"}}>
                <td colSpan={4} style={{padding:".6rem .75rem",textAlign:"right",fontSize:".7rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase"}}>Totales</td>
                <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--wh2)",fontSize:".82rem"}}>
                  {fmt(liqReview.compradores.reduce((s,c)=>s+c.liq.total,0))}
                </td>
                <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:900,color:"var(--ac)",fontSize:".85rem"}}>
                  {fmt(liqReview.compradores.reduce((s,c)=>s+c.liq.totalAPagar,0))}
                </td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {liqReview?.compradores.map((c,ci) => {
        const p = c.postorData;
        const l = c.liq;
        const isOpen = liqExpanded === ci;
        return (
          <div key={ci} id={`liq-card-${ci}`} className="liq-card" style={{marginBottom:".8rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: isOpen?".9rem":"0",cursor:"pointer"}} onClick={()=>setLiqExpanded(isOpen?null:ci)}>
              <div style={{display:"flex",alignItems:"center",gap:".85rem"}}>
                <div style={{width:38,height:38,borderRadius:8,background:"rgba(56,178,246,.12)",border:"1px solid rgba(56,178,246,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:".8rem",fontWeight:700,color:"var(--ac)",flexShrink:0}}>
                  {String(c.key).padStart(2,"0")}
                </div>
                <div>
                  <div style={{fontSize:".88rem",fontWeight:700,color:"var(--wh)"}}>{p?.razonSocial||c.lotes[0]?.postor||"—"}</div>
                  <div style={{fontSize:".72rem",color:"var(--mu2)"}}>{p?.rut||"—"} · {p?.giro||"—"} · {c.lotes.length} lote{c.lotes.length>1?"s":""}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:700,color:"var(--ac)"}}>{fmt(l.totalAPagar)}</div>
                  <div style={{fontSize:".65rem",color:"var(--mu)"}}>total a pagar</div>
                </div>
                {c.enviado
                  ? <span className="sent-badge">Enviado</span>
                  : <span className="pill p-saldo">Pendiente</span>}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--mu)" strokeWidth="1.8" strokeLinecap="round" style={{transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M2 5l5 5 5-5"/></svg>
              </div>
            </div>

            {isOpen && (
              <div style={{borderTop:"1px solid var(--b1)",paddingTop:".9rem"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".35rem .9rem",marginBottom:"1rem",padding:".7rem .85rem",background:"rgba(255,255,255,.025)",borderRadius:7,fontSize:".74rem"}}>
                  {[
                    ["Comprador N°", String(c.key).padStart(2,"0")],
                    ["Fecha", liqReview.fecha],
                    ["R.U.T", p?.rut||"—"],
                    ["Señor(es)", p?.razonSocial||"—"],
                    ["Giro", p?.giro||"—"],
                    ["Direccion", p?.direccion||"—"],
                    ["Telefono", p?.tel||"—"],
                    ["Mail", p?.email||"—"],
                    ["Comuna", p?.comuna||"—"],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:"flex",gap:".5rem"}}>
                      <span style={{color:"var(--mu)",minWidth:90,flexShrink:0}}>{k}</span>
                      <span style={{color:"var(--wh2)",fontWeight:600}}>{v}</span>
                    </div>
                  ))}
                </div>

                <table style={{width:"100%",borderCollapse:"collapse",fontSize:".76rem",marginBottom:"1rem"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid var(--b1)"}}>
                      {["Lote","Cant.","Descripcion","ND","Unitario","Total"].map(h=>(
                        <th key={h} style={{padding:".4rem .5rem",textAlign:h==="Unitario"||h==="Total"?"right":"left",color:"var(--mu)",fontWeight:600,fontSize:".65rem",textTransform:"uppercase",letterSpacing:".04em"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {l.lineas.map((ln,li)=>(
                      <>
                        <tr key={`a-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                          <td style={{padding:".45rem .5rem",fontFamily:"Inter,sans-serif",fontSize:".7rem",color:"var(--mu2)"}}>{ln.exp||`Lote ${li+1}`}</td>
                          <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                          <td style={{padding:".45rem .5rem",fontWeight:600,color:"var(--wh2)"}}>{ln.lote}</td>
                          <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(255,255,255,.05)",borderRadius:3,color:"var(--mu)"}}>EX</span></td>
                          <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--wh2)"}}>{fmt(ln.monto)}</td>
                          <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--wh2)"}}>{fmt(ln.monto)}</td>
                        </tr>
                        <tr key={`b-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                          <td style={{padding:".45rem .5rem",fontFamily:"Inter,sans-serif",fontSize:".7rem",color:"var(--mu2)"}}>{ln.exp||`Lote ${li+1}`}</td>
                          <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                          <td style={{padding:".45rem .5rem",color:"var(--mu2)"}}>Comision {ln.comPct}%</td>
                          <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(56,178,246,.08)",borderRadius:3,color:"var(--ac)"}}>AF</span></td>
                          <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--mu2)"}}>{fmt(ln.com)}</td>
                          <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--mu2)"}}>{fmt(ln.com)}</td>
                        </tr>
                        {ln.motorizado && (
                          <tr key={`c-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                            <td style={{padding:".45rem .5rem",fontFamily:"Inter,sans-serif",fontSize:".7rem",color:"var(--mu2)"}}>G-ADMIN</td>
                            <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                            <td style={{padding:".45rem .5rem",color:"var(--yl)",fontSize:".73rem"}}>Gastos Administrativos — Vehiculo Motorizado ({ln.exp||`Lote ${li+1}`})</td>
                            <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(56,178,246,.08)",borderRadius:3,color:"var(--ac)"}}>AF</span></td>
                            <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--yl)"}}>{fmt(ln.gastosAdm)}</td>
                            <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--yl)"}}>{fmt(ln.gastosAdm)}</td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",alignItems:"start"}}>
                  <div style={{fontSize:".74rem",color:"var(--mu2)",lineHeight:2}}>
                    {[
                      ["Total Compras Exentas:", fmt(l.totalEx)],
                      ["Total Compras Afectas:", fmt(l.totalAf)],
                      ["Total Comision:", fmt(l.totalCom)],
                      ["19% IVA:", fmt(l.iva)],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.03)",padding:".12rem 0"}}>
                        <span>{k}</span><span style={{fontFamily:"Inter,sans-serif",color:"var(--wh2)"}}>{v}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",padding:".25rem 0",borderTop:"1px solid var(--b2)",marginTop:".1rem",fontWeight:700,fontSize:".8rem"}}>
                      <span style={{color:"var(--wh2)"}}>Total:</span><span style={{fontFamily:"Inter,sans-serif",color:"var(--ac)"}}>{fmt(l.total)}</span>
                    </div>
                  </div>
                  <div style={{background:"rgba(56,178,246,.06)",border:"1px solid rgba(56,178,246,.2)",borderRadius:8,padding:".8rem 1rem",fontSize:".78rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:".4rem",color:"var(--mu2)"}}>
                      <span>Garantia:</span><span style={{fontFamily:"Inter,sans-serif",color:"var(--gr)"}}>{fmt(l.garantia)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",paddingTop:".4rem",borderTop:"1px solid rgba(56,178,246,.2)"}}>
                      <span style={{fontWeight:700,color:"var(--wh2)",fontSize:".85rem"}}>Total a Pagar:</span>
                      <span style={{fontFamily:"Inter,sans-serif",fontWeight:800,fontSize:"1rem",color:"var(--ac)"}}>{fmt(l.totalAPagar)}</span>
                    </div>
                  </div>
                </div>

                <div className="liq-actions" style={{marginTop:"1rem",paddingTop:".8rem",borderTop:"1px solid var(--b1)",display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                  <button className="btn-sec" style={{fontSize:".73rem"}} onClick={()=>generarPDFLiquidacion(c, liqReview.fecha)}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><path d="M2 13h10M7 1v8M4 6l3 3 3-3"/></svg>
                    Descargar PDF
                  </button>

                  <button
                    className="btn-primary"
                    style={{fontSize:".73rem", background: c.enviado?"rgba(20,184,166,.12)":"var(--ac)", color: c.enviado?"var(--gr)":"#fff", border: c.enviado?"1px solid rgba(20,184,166,.3)":"none"}}
                    onClick={async ()=>{
                      const email = p?.email || c.postorData?.email || "";
                      if (!email) { notify("Sin email — descarga el PDF manualmente.", "inf"); generarPDFLiquidacion(c, liqReview.fecha); return; }
                      try {
                        const res = await authFetch("/api/liquidaciones/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            to: email,
                            postorNombre: p?.name || c.postorData?.name || "Comprador",
                            rut: p?.rut || c.postorData?.rut || "",
                            liq: c.liq,
                            remateNombre: liqReview.remateNombre,
                            fecha: liqReview.fecha,
                          }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setLiqReview(r=>({...r,compradores:r.compradores.map((x,xi)=>xi===ci?{...x,enviado:true}:x)}));
                          notify(`Liquidación enviada a ${email}`, "ok");
                          const ids = c.lotes?.map(l=>l.id).filter(Boolean)||[];
                          if (ids.length && supabase) supabase.from("liquidaciones").update({enviado:true}).in("id",ids).then(({error})=>{ if(error) console.error("[liq] enviado:",error.message); });
                        } else {
                          notify(`Error al enviar: ${data.error||"intenta de nuevo"}`, "inf");
                          generarPDFLiquidacion(c, liqReview.fecha);
                        }
                      } catch { notify("Error de red — PDF descargado.", "inf"); generarPDFLiquidacion(c, liqReview.fecha); }
                    }}>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><path d="M1 1l12 6-12 6V9l8-2-8-2V1z"/></svg>
                    {c.enviado ? "Reenviar correo" : "Enviar liquidación"}
                  </button>

                  {!c.pagado
                    ? <button
                        className="btn-sec"
                        style={{fontSize:".73rem", borderColor:"rgba(20,184,166,.4)", color:"#34d399"}}
                        onClick={()=>{
                          setLiqReview(r=>({...r,compradores:r.compradores.map((x,xi)=>xi===ci?{...x,pagado:true}:x)}));
                          notify(`Pago registrado para ${p?.name||c.postorData?.name||"comprador"}.`,"ok");
                          const ids = c.lotes?.map(l=>l.id).filter(Boolean)||[];
                          if (ids.length && supabase) supabase.from("liquidaciones").update({estado:"pagado"}).in("id",ids).then(({error})=>{ if(error) console.error("[liq] pagado:",error.message); });
                        }}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><path d="M2 7l4 4 6-7"/></svg>
                        Marcar como pagado
                      </button>
                    : <div style={{display:"flex",alignItems:"center",gap:".35rem",fontSize:".72rem",color:"var(--gr)",padding:".35rem .7rem",background:"rgba(20,184,166,.07)",border:"1px solid rgba(20,184,166,.2)",borderRadius:6}}>
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-7"/></svg>
                        Pagado
                      </div>
                  }

                  {!c.facturado
                    ? <button
                        className="btn-sec"
                        style={{fontSize:".73rem", borderColor:"rgba(246,173,85,.4)", color:"#f6ad55"}}
                        onClick={()=>{
                          setLiqReview(r=>({...r,compradores:r.compradores.map((x,xi)=>xi===ci?{...x,facturado:true}:x)}));
                          notify(`Factura marcada para ${p?.name||c.postorData?.name||"comprador"}.`,"sold");
                          const ids = c.lotes?.map(l=>l.id).filter(Boolean)||[];
                          if (ids.length && supabase) supabase.from("liquidaciones").update({facturado:true}).in("id",ids).then(({error})=>{ if(error) console.error("[liq] facturado:",error.message); });
                        }}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><rect x="2" y="1" width="10" height="12" rx="1"/><path d="M5 5h4M5 8h4M5 11h2"/></svg>
                        Marcar como facturado
                      </button>
                    : <div style={{display:"flex",alignItems:"center",gap:".35rem",fontSize:".72rem",color:"var(--gr)",padding:".35rem .7rem",background:"rgba(20,184,166,.07)",border:"1px solid rgba(20,184,166,.2)",borderRadius:6}}>
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-7"/></svg>
                        Facturado
                      </div>
                  }
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
