'use client'
import { useDashboard } from "../../lib/DashboardContext";

export default function PageGarantias() {
  const {
    session, supabase, notify,
    dbGarantias, setDbGarantias,
    dbLicencias,
    filterTab, setFilterTab,
  } = useDashboard();

  return (
    <div className="page">
      {/* Stats */}
      <div className="gar-steps">
        {[
          {n:"Total recibidas",v:dbGarantias.length,l:"inscripciones este remate",c:"var(--ac)"},
          {n:"Aprobadas",v:dbGarantias.filter(g=>g.estado==="aprobada").length,l:"paletas asignadas",c:"var(--gr)"},
          {n:"Pendientes",v:dbGarantias.filter(g=>g.estado==="pendiente").length,l:"sin comprobante o efectivo",c:"var(--yl)"},
        ].map((s,i)=>(
          <div className="gar-step" key={i} style={{"--sc":s.c}}>
            <div className="gar-step-n">{s.n}</div>
            <div className="gar-step-v">{s.v}</div>
            <div className="gar-step-l">{s.l}</div>
          </div>
        ))}
      </div>
      {/* Info box */}
      {(()=>{
        const licencia = dbLicencias?.find(c=>c.id===session?.casaId)||{};
        const infoTransf = licencia.banco_nombre
          ? `${licencia.banco_nombre} · ${licencia.tipo_cuenta||"Cta. Cte."} ${licencia.numero_cuenta||"—"} · ${session?.casaNombre||"Casa"} · ${licencia.rut_casa||"—"} · ${licencia.email_contacto||""}`
          : "Consulta con la administración para los datos de transferencia.";
        return (
          <div className="gar-info">
            <div className="gar-info-text">
              <strong>Cuenta para transferencias:</strong> {infoTransf}<br/>
              Monto garantía: <strong>$300.000</strong> — Devolución en 5 días hábiles post remate.
            </div>
          </div>
        );
      })()}
      {/* Filters */}
      <div className="filter-row" style={{marginBottom:".85rem"}}>
        {["todos","aprobada","pendiente","devuelta"].map(f=>(
          <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>{f}</button>
        ))}
      </div>
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">{dbGarantias.filter(g=>filterTab==="todos"||g.estado===filterTab).length} garantías</div>
        </div>
        {dbGarantias.length===0 ? (
          <div style={{padding:"3rem",textAlign:"center",color:"var(--mu)",fontSize:".82rem"}}>
            No hay garantías registradas. Usa <strong style={{color:"var(--wh2)"}}>+ Registrar garantía</strong> para agregar.
          </div>
        ) : (
        <table>
          <thead><tr><th>Postor</th><th>RUT</th><th>Remate</th><th>Método</th><th>Paleta</th><th>Comprobante</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {dbGarantias.filter(g=>filterTab==="todos"||g.estado===filterTab).map(g=>(
              <tr key={g.id}>
                <td style={{fontWeight:600}}>{g.postor}</td>
                <td className="mono" style={{fontSize:".73rem"}}>{g.rut}</td>
                <td style={{fontSize:".73rem",color:"var(--mu)"}}>{g.remate||"—"}</td>
                <td className="mono" style={{fontSize:".73rem"}}>{g.metodo}</td>
                <td style={{textAlign:"center"}}>
                  {g.paleta
                    ? <div className="paleta-badge">{g.paleta}</div>
                    : <div className="paleta-none">—</div>}
                </td>
                <td>
                  {g.comprobante
                    ? <a href={g.comprobante} target="_blank" rel="noreferrer" style={{color:"var(--gr)",fontSize:".72rem",fontWeight:600}}>Ver</a>
                    : <span style={{color:"var(--yl)",fontSize:".72rem",fontWeight:600}}>Pendiente</span>}
                </td>
                <td>
                  <span className={`pill p-${g.estado}`}>
                    {g.estado==="aprobada"?"Aprobada":g.estado==="pendiente"?"Pendiente":"Devuelta"}
                  </span>
                </td>
                <td>
                  <div style={{display:"flex",gap:".35rem"}}>
                    {g.estado==="pendiente" && (
                      <button className="btn-confirm" style={{fontSize:".68rem",padding:".25rem .6rem"}} onClick={async()=>{
                        const {error} = await supabase.from("garantias").update({estado:"aprobada"}).eq("id",g.id);
                        if (!error) { setDbGarantias(prev=>prev.map(x=>x.id===g.id?{...x,estado:"aprobada"}:x)); notify("Garantía aprobada.","sold"); }
                        else notify("Error: "+error.message,"inf");
                      }}>✓ Aprobar</button>
                    )}
                    {g.estado==="aprobada" && (
                      <button className="btn-sec" style={{fontSize:".68rem",padding:".25rem .6rem",color:"var(--yl)"}} onClick={async()=>{
                        const {error} = await supabase.from("garantias").update({estado:"devuelta",devolucion:new Date().toLocaleDateString("es-CL")}).eq("id",g.id);
                        if (!error) { setDbGarantias(prev=>prev.map(x=>x.id===g.id?{...x,estado:"devuelta",devolucion:new Date().toLocaleDateString("es-CL")}:x)); notify("Garantía marcada como devuelta.","sold"); }
                        else notify("Error: "+error.message,"inf");
                      }}>Devuelta</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
