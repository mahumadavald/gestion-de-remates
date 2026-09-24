'use client'
import { useDashboard } from "../../lib/DashboardContext";

export default function PagePlanilla() {
  const { lotesFiltroRemate, dbLotes, liquidaciones, remateActivo } = useDashboard();

  const lotesFiltrados = (lotesFiltroRemate
    ? dbLotes.filter(l=>l.remate_id===lotesFiltroRemate)
    : dbLotes
  ).slice().sort((a,b)=>(a.orden||0)-(b.orden||0));

  const fmtClp = n => n ? Number(n).toLocaleString("es-CL") : "—";

  return (
    <div className="page">
      {lotesFiltrados.length===0 ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"40vh",gap:".75rem",color:"var(--mu)"}}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="32" height="32" rx="4"/><path d="M12 13h16M12 20h16M12 27h8"/></svg>
          <div style={{fontSize:".88rem",fontWeight:600,color:"var(--wh2)"}}>Sin lotes — {remateActivo?"este remate no tiene lotes aún":"selecciona un remate"}</div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-head">
            <div className="table-title">{lotesFiltrados.length} lotes</div>
            <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>window.print()}>Imprimir</button>
          </div>
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Lote</th><th>Cant.</th><th>Descripción</th><th>Propietario</th><th style={{textAlign:"right"}}>Mínimo</th><th>Comprador</th><th style={{textAlign:"right"}}>Valor</th></tr></thead>
              <tbody>
                {lotesFiltrados.map((l,i)=>(
                  <tr key={l.id||i}>
                    <td style={{fontWeight:700,color:"var(--ac)"}}>{l.orden??i+1}</td>
                    <td style={{textAlign:"center"}}>{l.cantidad||1}</td>
                    <td>{l.nombre||"—"}</td>
                    <td style={{fontSize:".75rem",color:"var(--mu2)"}}>{l.propietario||"—"}</td>
                    <td style={{textAlign:"right",fontWeight:600}}>${fmtClp(l.base)}</td>
                    {(()=>{
                      const adjLote = liquidaciones.find(liq =>
                        (!lotesFiltroRemate || liq.remateId === lotesFiltroRemate) &&
                        (liq.loteId ? liq.loteId === l.id : liq.lote === l.nombre)
                      );
                      return (<>
                        <td style={{fontSize:".75rem",color:"var(--wh2)",fontWeight:adjLote?600:400}}>{adjLote?adjLote.postor.replace(" (Online)","").replace(" (Presencial)",""):"—"}</td>
                        <td style={{textAlign:"right",fontWeight:adjLote?700:400,color:adjLote?"var(--gr)":"var(--mu)"}}>{adjLote?`$${fmtClp(adjLote.monto)}`:"—"}</td>
                      </>);
                    })()}
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
