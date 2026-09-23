'use client'
import { useState } from "react";
import { useDashboard } from "../../lib/DashboardContext";
import { calcLiquidacion } from "../../lib/liquidacion";

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);

export default function PageDevoluciones() {
  const {
    session, supabase, authFetch, notify,
    dbPostores, setDbPostores,
    liquidaciones,
    selectedRemate, salaRemateId,
    REMATES_MERGED, POSTORES_MERGED,
    GASTO_ADMIN_MOTORIZADO,
  } = useDashboard();

  const [notifNcLoading, setNotifNcLoading] = useState(false);

  const ADJUDICACIONES = [];

  const postoresDev = dbPostores.filter(p =>
    (!selectedRemate || p.remate_id === selectedRemate) &&
    (p.estado === "verificado" || p.estado === "aprobada" || p.estado === "aprobado")
  );

  const nombresCompradores = new Set([
    ...dbPostores.filter(l => l.postor && (!selectedRemate || l.remate_id === selectedRemate)).map(l => l.postor),
    ...liquidaciones.filter(l => !selectedRemate || l.remateId === selectedRemate).map(l => l.postor),
  ]);

  const enriquecer = (p) => {
    const nombre = p.nombre || p.razon_social || "";
    const montoGar = p.garantia || 0;
    const esComprador = nombresCompradores.has(nombre) || nombresCompradores.has(p.razon_social);
    let totalDeuda = 0;
    if (esComprador) {
      const lotesP = [
        ...liquidaciones.filter(l => l.postor===nombre || l.postor===p.razon_social),
        ...dbPostores.filter(l => (l.postor===nombre || l.postor===p.razon_social) && (!selectedRemate||l.remate_id===selectedRemate)),
      ].filter((l,i,arr)=>arr.findIndex(x=>x.lote===l.lote)===i);
      if (lotesP.length) totalDeuda = calcLiquidacion(lotesP, null, GASTO_ADMIN_MOTORIZADO).total;
    }
    const montoDevolver = Math.max(0, montoGar - totalDeuda);
    return {...p, montoGar, totalDeuda, montoDevolver, esComprador};
  };

  const todos = postoresDev.map(enriquecer);
  const conDevolucion = todos.filter(p => p.montoGar > 0 && p.montoDevolver > 0);
  const garantiaConsumida = todos.filter(p => p.montoGar > 0 && p.montoDevolver === 0 && p.esComprador);

  const totalADevolver = conDevolucion.reduce((s,p)=>s+p.montoDevolver,0);
  const totalDevueltos = conDevolucion.filter(p=>p.devolucion_enviada).length;

  const marcarDevuelto = async (postorId) => {
    await supabase.from("postores").update({ devolucion_enviada: true }).eq("id", postorId);
    const { data } = await supabase.from("postores").select("*").order("numero");
    if (data) setDbPostores(data);
    notify("Devolución marcada como enviada ✓", "sold");
  };

  const fmtM = n => n?.toLocaleString("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}) || "—";

  const TarjetaDev = ({p, i}) => {
    const tieneCuenta = p.banco && p.numero_cuenta;
    const copiarDatos = () => {
      const txt = [
        `Transferir: ${fmtM(p.montoDevolver)}`,
        `Titular: ${p.nombre||p.razon_social||"—"}`,
        `RUT: ${p.rut||"—"}`,
        `Banco: ${p.banco||"—"}`,
        `Tipo: ${p.tipo_cuenta||"—"}`,
        `N° cuenta: ${p.numero_cuenta||"—"}`,
        `Email: ${p.email||"—"}`,
      ].join("\n");
      navigator.clipboard.writeText(txt).then(()=>notify("Datos copiados ✓","sold")).catch(()=>notify("No se pudo copiar","inf"));
    };
    const etiqueta = p.esComprador
      ? `Comprador — garantía ${fmtM(p.montoGar)} − deuda ${fmtM(p.totalDeuda)} = exceso`
      : `No comprador — devolver garantía completa`;
    return (
      <div style={{background:"var(--s2)",border:`1px solid ${p.devolucion_enviada?"rgba(34,197,94,.3)":"var(--b1)"}`,borderRadius:12,padding:"1rem 1.2rem",opacity:p.devolucion_enviada?0.75:1}}>
        <div style={{display:"flex",alignItems:"center",gap:".75rem",flexWrap:"wrap",marginBottom:".75rem"}}>
          <span style={{fontWeight:700,color:"#f59e0b",fontSize:".8rem"}}>#{String(p.numero||i+1).padStart(2,"0")}</span>
          <span style={{fontWeight:700,fontSize:".92rem",color:"var(--wh2)"}}>{p.nombre||p.razon_social||"—"}</span>
          <span style={{fontSize:".72rem",color:"var(--mu2)",fontFamily:"monospace"}}>{p.rut||"—"}</span>
          <span style={{fontSize:".62rem",fontWeight:600,color:"var(--mu2)",background:"var(--s1)",padding:".1rem .45rem",borderRadius:10}}>{etiqueta}</span>
          <div style={{flex:1}}/>
          <div style={{background:"rgba(20,184,166,.12)",border:"1px solid rgba(20,184,166,.3)",borderRadius:8,padding:".3rem .9rem",textAlign:"right"}}>
            <div style={{fontSize:".58rem",fontWeight:600,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em"}}>Devolver</div>
            <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.05rem",fontWeight:800,color:"#34d399"}}>{fmtM(p.montoDevolver)}</div>
          </div>
          {p.devolucion_enviada
            ? <span style={{fontSize:".72rem",fontWeight:700,color:"#22c55e",background:"rgba(34,197,94,.1)",padding:".25rem .7rem",borderRadius:20}}>✓ Devuelta</span>
            : <button className="btn-primary" style={{fontSize:".72rem",padding:".3rem .75rem"}} onClick={()=>marcarDevuelto(p.id)}>✓ Marcar devuelta</button>
          }
        </div>
        {tieneCuenta ? (
          <div style={{background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:8,padding:".7rem 1rem",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap",flex:1}}>
              {[["Banco",p.banco],["Tipo",p.tipo_cuenta||"—"],["N° de cuenta",p.numero_cuenta],["Email",p.email||"—"]].map(([lbl,val])=>(
                <div key={lbl}>
                  <div style={{fontSize:".58rem",fontWeight:600,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".15rem"}}>{lbl}</div>
                  <div style={{fontSize:lbl==="N° de cuenta"?".95rem":".82rem",fontWeight:lbl==="N° de cuenta"?800:700,color:lbl==="N° de cuenta"?"var(--ac)":"var(--wh2)",fontFamily:lbl==="N° de cuenta"?"monospace":"inherit"}}>{val}</div>
                </div>
              ))}
            </div>
            <button onClick={copiarDatos} style={{background:"rgba(56,178,246,.12)",border:"1px solid rgba(56,178,246,.25)",color:"var(--ac)",borderRadius:8,padding:".45rem .9rem",fontSize:".75rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              Copiar datos
            </button>
          </div>
        ) : (
          <div style={{background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8,padding:".6rem 1rem",fontSize:".78rem",color:"#f59e0b",fontWeight:600}}>
            ⚠ Sin datos bancarios — notificar al postor para que los complete
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.5rem"}}>
        {[
          {label:"Con devolución pendiente", val:conDevolucion.filter(p=>!p.devolucion_enviada).length, color:"#f59e0b"},
          {label:"Total a devolver",          val:fmtM(totalADevolver),                                 color:"#34d399"},
          {label:"Ya devueltas",              val:totalDevueltos,                                        color:"#22c55e"},
          {label:"Garantía consumida (compradores)", val:garantiaConsumida.length,                      color:"var(--mu2)"},
        ].map(s=>(
          <div key={s.label} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1rem 1.2rem"}}>
            <div style={{fontSize:s.label==="Total a devolver"?"1.1rem":"1.6rem",fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:".72rem",color:"var(--mu)",marginTop:".2rem"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {postoresDev.length === 0 && (
        <div style={{padding:"3rem",textAlign:"center",color:"var(--mu)",fontSize:".85rem",background:"var(--s2)",borderRadius:12,border:"1px solid var(--b1)"}}>
          No hay postores verificados en este remate aún.
        </div>
      )}

      {conDevolucion.length > 0 && (
        <div style={{marginBottom:"2rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:".85rem"}}>
            <div style={{width:4,height:20,borderRadius:4,background:"#34d399"}}/>
            <div style={{fontSize:".9rem",fontWeight:700,color:"var(--wh2)"}}>Devoluciones a realizar</div>
            <span style={{fontSize:".72rem",fontWeight:700,color:"#34d399",background:"rgba(52,211,153,.1)",padding:".15rem .55rem",borderRadius:20}}>{conDevolucion.length} postores</span>
            <span style={{fontSize:".72rem",fontWeight:700,color:"var(--mu2)"}}> · Total: <span style={{color:"#34d399"}}>{fmtM(totalADevolver)}</span></span>
            <div style={{flex:1}}/>
            <button className="btn-primary" disabled={notifNcLoading} style={{fontSize:".75rem"}} onClick={async () => {
              setNotifNcLoading(true);
              try {
                const targetRemateId = selectedRemate || salaRemateId;
                const remateInfo = REMATES_MERGED.find(r=>(r.supabaseId||r.id)===targetRemateId);
                const sinNotificar = conDevolucion.filter(p => !p.devolucion_enviada && p.email);
                if (!sinNotificar.length) { notify("No hay pendientes con email.","inf"); return; }
                let enviados = 0;
                for (const p of sinNotificar) {
                  const devUrl = `https://gestionderemates.cl/devoluciones?p=${p.id}`;
                  await authFetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({tipo:"no_comprador",email_cliente:p.email,nombre:p.nombre||"Postor",
                      numero:p.numero||"—",remate:remateInfo?.name||"Remate",
                      casa:session?.casaNombre||"Casa de Remates",logo_url:null,devolucion_url:devUrl})});
                  enviados++;
                }
                notify(`${enviados} correos enviados.`,"sold");
              } catch { notify("Error al enviar.","inf"); }
              finally { setNotifNcLoading(false); }
            }}>
              {notifNcLoading ? "Enviando..." : "Notificar pendientes"}
            </button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:".75rem"}}>
            {conDevolucion.map((p,i) => <TarjetaDev key={p.id} p={p} i={i}/>)}
          </div>
        </div>
      )}

      {garantiaConsumida.length > 0 && (
        <div style={{marginBottom:"2rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:".85rem"}}>
            <div style={{width:4,height:20,borderRadius:4,background:"var(--mu2)"}}/>
            <div style={{fontSize:".9rem",fontWeight:700,color:"var(--wh2)"}}>Compradores — garantía ya consumida</div>
            <span style={{fontSize:".72rem",fontWeight:700,color:"var(--mu2)",background:"var(--s2)",padding:".15rem .55rem",borderRadius:20}}>{garantiaConsumida.length}</span>
          </div>
          <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"var(--s1)"}}>
                  {["N°","Nombre","RUT","Garantía","Total deuda","Sin devolución"].map(h=>(
                    <th key={h} style={{padding:".5rem .75rem",textAlign:"left",fontSize:".7rem",fontWeight:700,color:"var(--mu)",letterSpacing:".04em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {garantiaConsumida.map((p,i)=>(
                  <tr key={p.id} style={{borderBottom:"1px solid var(--b1)",background:i%2===0?"var(--s2)":"var(--s1)"}}>
                    <td style={{padding:".5rem .75rem",fontWeight:700,color:"var(--mu2)",fontSize:".8rem"}}>#{String(p.numero||i+1).padStart(2,"0")}</td>
                    <td style={{padding:".5rem .75rem",fontWeight:600,fontSize:".82rem"}}>{p.nombre||p.razon_social||"—"}</td>
                    <td style={{padding:".5rem .75rem",fontSize:".75rem",color:"var(--mu2)",fontFamily:"monospace"}}>{p.rut||"—"}</td>
                    <td style={{padding:".5rem .75rem",fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--gr)"}}>{fmtM(p.montoGar)}</td>
                    <td style={{padding:".5rem .75rem",fontFamily:"Inter,sans-serif",fontWeight:700,color:"#f87171"}}>{fmtM(p.totalDeuda)}</td>
                    <td style={{padding:".5rem .75rem"}}><span style={{fontSize:".68rem",fontWeight:700,color:"var(--mu)",background:"var(--s1)",padding:".15rem .5rem",borderRadius:10}}>Sin devolución</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
