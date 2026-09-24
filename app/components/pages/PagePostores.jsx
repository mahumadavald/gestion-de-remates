'use client'
import { useState } from "react";
import { useDashboard } from "../../lib/DashboardContext";

export default function PagePostores() {
  const {
    session, supabase, authFetch, notify, page,
    dbPostores, setDbPostores,
    dbLicencias,
    filterTab, setFilterTab,
    REMATES_MERGED, lotesFiltroRemate,
    POSTORES_MERGED,
  } = useDashboard();

  const [confirmDelPostor, setConfirmDelPostor] = useState(null);

  const generarBoleta = async (postor) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [148, 210] });
    const W = 148, H = 210;
    const TEAL = [20, 184, 166];
    const NAVY = [13, 148, 136];
    const GRAY = [100, 116, 139];
    const LTGRAY = [245, 247, 250];

    const casaData = dbLicencias.find(x => x.slug === session?.casa) || {};
    const logoUrl  = casaData.logo_url || null;
    const casaNombre = casaData.nombre || session?.casaNombre || "Casa de Remates";

    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, 5, "F");

    let y = 10;
    let logoLoaded = false;
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise(res => { img.onload = res; img.onerror = res; img.src = logoUrl; });
        if (img.naturalWidth > 0) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const lh = 22;
          const lw = Math.min(60, lh * ratio);
          doc.addImage(img, "PNG", (W - lw) / 2, y, lw, lh, undefined, "FAST");
          logoLoaded = true;
          y += lh + 4;
        }
      } catch {}
    }
    if (!logoLoaded) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...NAVY);
      doc.text(casaNombre.toUpperCase(), W / 2, y + 8, { align: "center" });
      y += 16;
    }

    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...TEAL);
    doc.text("NÚMERO DE POSTOR", W / 2, y, { align: "center" });
    y += 2;
    doc.setFont("helvetica", "bold"); doc.setFontSize(52); doc.setTextColor(...NAVY);
    doc.text(String(postor.nComprador || postor.numero || "—"), W / 2, y + 22, { align: "center" });
    y += 28;

    doc.setDrawColor(...TEAL); doc.setLineWidth(0.6);
    doc.line(10, y, W - 10, y);
    y += 7;

    const rows = [
      ["CLIENTE",      postor.name || postor.nombre || "—"],
      ["RUT",          postor.rut || "—"],
      ["MONTO",        postor.garantia ? `$ ${Number(postor.garantia).toLocaleString("es-CL")}` : "$ 0"],
      ["FECHA",        new Date().toLocaleDateString("es-CL")],
      ["TIPO DE PAGO", postor.modalidad || "TRANSFERENCIA"],
    ];
    rows.forEach(([k, v]) => {
      doc.setFillColor(...LTGRAY);
      doc.roundedRect(10, y - 4, W - 20, 8, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...TEAL);
      doc.text(k, 14, y + 0.5);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
      doc.text(String(v), W - 14, y + 0.5, { align: "right" });
      y += 10;
    });

    y += 3;
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.4);
    doc.line(10, y, W - 10, y);
    y += 7;

    const BASE = "https://takka.cl";
    const catUrl = `${BASE}/catalogo/${postor.remate_id || postor.remateId || ""}`;
    const devUrl = `${BASE}/devoluciones?p=${postor.supabaseId || postor.id}`;
    const qrApiBase = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=";

    const loadQR = (url) => new Promise(res => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = qrApiBase + encodeURIComponent(url);
    });
    const [qrCat, qrDev] = await Promise.all([loadQR(catUrl), loadQR(devUrl)]);

    const qrSize = 48;
    const leftX  = W / 2 - qrSize - 6;
    const rightX = W / 2 + 6;

    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...TEAL);
    doc.text("CATÁLOGO", leftX + qrSize / 2, y, { align: "center" });
    doc.text("DEVOLUCIÓN", rightX + qrSize / 2, y, { align: "center" });
    y += 4;

    if (qrCat) doc.addImage(qrCat, "PNG", leftX, y, qrSize, qrSize, undefined, "FAST");
    else { doc.setFillColor(230,230,230); doc.rect(leftX, y, qrSize, qrSize, "F"); }

    if (qrDev) doc.addImage(qrDev, "PNG", rightX, y, qrSize, qrSize, undefined, "FAST");
    else { doc.setFillColor(230,230,230); doc.rect(rightX, y, qrSize, qrSize, "F"); }

    y += qrSize + 6;

    doc.setFillColor(...TEAL);
    doc.rect(0, H - 5, W, 5, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(...GRAY);
    doc.text("Powered by TAKKA · takka.cl", W / 2, H - 7, { align: "center" });

    doc.save(`boleta-postor-${postor.nComprador || postor.numero || postor.supabaseId || postor.id}.pdf`);
  };

  const pendientes = POSTORES_MERGED.filter(p=>p.estado==="pendiente");

  return (
    <div className="page">
      {pendientes.length > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".7rem 1rem",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9}}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--yl)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="6.5"/><path d="M7.5 4v4M7.5 10.5v.5"/></svg>
          <span style={{fontSize:".76rem",color:"var(--mu2)"}}>
            <strong style={{color:"var(--yl)"}}>{pendientes.length} postores pendientes</strong> de verificación — revisa el comprobante y valídalos para que puedan participar.
          </span>
        </div>
      )}

      <div className="filter-row" style={{marginBottom:"1rem"}}>
        {["todos","verificado","pendiente"].map(f => (
          <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>
            {f==="todos"?"Todos":f==="verificado"?"Verificados":f==="pendiente"?`Pendientes ${pendientes.length>0?`(${pendientes.length})`:""}`  : f}
          </button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-head">
          <div className="table-title">
            {POSTORES_MERGED.filter(p=>(filterTab==="todos"||p.estado===filterTab)&&(page==="clientes"||!lotesFiltroRemate||(p.remateId===lotesFiltroRemate||p.remate_id===lotesFiltroRemate))).length} postores
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
        <table style={{minWidth:900}}>
          <thead>
            <tr><th>N°</th><th>Nombre</th><th>RUT</th><th>Email</th><th>Teléfono</th><th>Modalidad</th><th>Comprobante</th><th>Estado</th><th>Acción</th></tr>
          </thead>
          <tbody>
            {POSTORES_MERGED
              .filter(p=>(filterTab==="todos"||p.estado===filterTab)&&(page==="clientes"||!lotesFiltroRemate||(p.remateId===lotesFiltroRemate||p.remate_id===lotesFiltroRemate)))
              .map(p => (
              <tr key={p.id}>
                <td><span style={{fontFamily:"Inter,sans-serif",fontSize:".8rem",fontWeight:700,color:"var(--ac)"}}>#{String(p.nComprador).padStart(2,"0")}</span></td>
                <td style={{fontWeight:600}}>{p.name}</td>
                <td className="mono" style={{fontSize:".73rem"}}>{p.rut}</td>
                <td style={{fontSize:".73rem",color:"var(--mu2)"}}>{p.email}</td>
                <td style={{fontSize:".73rem",color:"var(--mu2)"}}>{p.tel}</td>
                <td>
                  <span style={{fontSize:".65rem",fontWeight:600,color:"var(--mu2)"}}>{p.modalidad||"PRESENCIAL"}</span>
                </td>
                <td>
                  {p.comprobante_url
                    ? <a href={p.comprobante_url} target="_blank" rel="noreferrer"
                        style={{fontSize:".68rem",color:"var(--ac)",fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:".3rem"}}>
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 2h6l3 3v7H4V2z"/><path d="M10 2v3h3"/></svg>
                        Ver archivo
                      </a>
                    : <span style={{fontSize:".65rem",color:"var(--mu)"}}>—</span>}
                </td>
                <td>
                  <span className={`pill p-${p.estado}`}>
                    {p.estado==="verificado"?"✓ Verificado":p.estado==="pendiente"?"⏳ Pendiente":p.estado}
                  </span>
                </td>
                <td>
                  <div style={{display:"flex",gap:".35rem"}}>
                    {p.estado==="pendiente" && p.supabaseId && (
                      <button className="btn-confirm" style={{fontSize:".65rem",padding:".22rem .55rem",background:"rgba(20,184,166,.1)",color:"var(--gr)",border:"1px solid rgba(20,184,166,.25)"}}
                        onClick={async()=>{
                          const {error} = await supabase.from("postores").update({estado:"verificado"}).eq("id",p.supabaseId);
                          if(!error){
                            const {data} = await supabase.from("postores").select("*").order("numero");
                            if(data) setDbPostores(data);
                            notify(`${p.name} verificado.`,"sold");

                            if(!p.email) return;
                            const {data:casaDB} = p.casa_id
                              ? await supabase.from("casas").select("*").eq("id",p.casa_id).single()
                              : {data:null};
                            const casaInfo = casaDB || {};
                            const casaNom = casaInfo.nombre || session?.casaNombre || "Casa de Remates";
                            const remateInfo = REMATES_MERGED.find(r=>(r.supabaseId||r.id)===p.remate_id);

                            let tempPass = null;
                            const {data:existing} = await supabase.from("usuarios").select("id").eq("email",p.email).maybeSingle();
                            if(!existing){
                              const chars="ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
                              const candidatePass = Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
                              try {
                                const res = await authFetch("/api/admin/create-user",{method:"POST",headers:{"Content-Type":"application/json"},
                                  body:JSON.stringify({email:p.email,password:candidatePass,nombre:p.name,casa_id:p.casa_id||null,roles:["postor"],activo:true})});
                                const created = await res.json();
                                if(created.id){
                                  tempPass = candidatePass;
                                  await supabase.from("postores").update({user_id:created.id}).eq("id",p.supabaseId);
                                } else {
                                  notify("Cuenta no creada: "+(created.error||"error"),"inf");
                                }
                              } catch(e){ notify("Error al crear cuenta","inf"); }
                            }

                            try {
                              await authFetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},
                                body:JSON.stringify({tipo:"verificado",nombre:p.name,
                                  numero:String(p.nComprador).padStart(3,"0"),
                                  remate:remateInfo?.name||"Remate",fecha:remateInfo?.fecha||null,
                                  casa:casaNom,logo_url:casaInfo.logo_url||null,
                                  email_cliente:p.email,email_casa:casaInfo.email||null,
                                  modalidad:p.modalidad||null,portal_url:"https://takka.cl/postor"})});
                            } catch(e){}

                            if(tempPass) try {
                              await authFetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},
                                body:JSON.stringify({tipo:"bienvenida_postor",nombre:p.name,email_cliente:p.email,
                                  casa:casaNom,logo_url:casaInfo.logo_url||null,email_casa:casaInfo.email||null,
                                  temp_password:tempPass,portal_url:"https://takka.cl/postor"})});
                            } catch(e){}
                          }
                        }}>✓ Verificar</button>
                    )}
                    {p.estado==="verificado" && p.supabaseId && (
                      <button className="btn-sec" style={{fontSize:".65rem",padding:".22rem .55rem"}}
                        onClick={async()=>{
                          const {error} = await supabase.from("postores").update({estado:"pendiente"}).eq("id",p.supabaseId);
                          if(!error){ const {data} = await supabase.from("postores").select("*").order("numero"); if(data) setDbPostores(data); notify("Postor marcado como pendiente.","inf"); }
                        }}>Deshacer</button>
                    )}
                    {session.role==="admin" && p.supabaseId && (
                      confirmDelPostor === p.supabaseId
                        ? <><button className="btn-sec" style={{fontSize:".65rem",padding:".22rem .55rem",color:"#f87171",borderColor:"rgba(248,113,113,.5)",fontWeight:700}}
                              onClick={async()=>{
                                setConfirmDelPostor(null);
                                const {error} = await supabase.from("postores").delete().eq("id",p.supabaseId);
                                if(!error){ const {data} = await supabase.from("postores").select("*").order("numero"); if(data) setDbPostores(data); notify(`${p.name} eliminado.`,"inf"); }
                                else notify("Error al eliminar postor.","inf");
                              }}>¿Seguro?</button>
                            <button className="btn-sec" style={{fontSize:".65rem",padding:".22rem .4rem"}} onClick={()=>setConfirmDelPostor(null)}>No</button></>
                        : <button className="btn-sec" style={{fontSize:".65rem",padding:".22rem .55rem",color:"#f87171",borderColor:"rgba(248,113,113,.3)"}}
                            onClick={()=>setConfirmDelPostor(p.supabaseId)}>Eliminar</button>
                    )}
                    {p.supabaseId && (
                      <button className="btn-sec" style={{fontSize:".65rem",padding:".22rem .55rem"}}
                        onClick={()=>generarBoleta(p)}
                        title="Imprimir boleta">Boleta</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div style={{marginTop:"1.2rem",padding:".85rem 1rem",background:"rgba(37,99,235,.05)",border:"1px solid rgba(37,99,235,.15)",borderRadius:10,display:"flex",alignItems:"center",gap:".75rem",flexWrap:"wrap"}}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M4 7h6M7 4l3 3-3 3"/></svg>
        <span style={{fontSize:".75rem",color:"var(--mu2)"}}>Link de inscripción pública:</span>
        <code style={{fontSize:".73rem",color:"var(--ac)",fontFamily:"Inter,sans-serif",flex:1}}>
          takka.cl/participar?id={session?.casaId||session?.casa||"—"}
        </code>
        <button className="btn-sec" style={{fontSize:".68rem"}} onClick={()=>{
          navigator.clipboard.writeText(`https://takka.cl/participar?id=${session?.casaId||session?.casa||""}`);
          notify("Link copiado al portapapeles.","sold");
        }}>Copiar link</button>
      </div>
    </div>
  );
}
