'use client'
import React from "react";
import { supabase } from "../../lib/supabase";

export default function PageRemates({
  session, filterTab, setFilterTab, REMATES_MERGED,
  remateActivo, setRemateActivo,
  confirmDelRemate, setConfirmDelRemate,
  setSalaRemateId, setLots, setBids, setIdx, setAState, setBidTimer,
  setSelectedRemate, setAiRemateModal, setAiRemateResult,
  notify, setPage, setDbRemates, updateRemateEstado,
}) {
  return (
    <div className="page">
      {session?.role==="admin"
        ? <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".7rem 1rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:8,fontSize:".74rem",color:"var(--mu2)"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--yl)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.01"/></svg>
            <span>Vista admin — ves todos los remates de todos los clientes. Lo ideal es que <strong style={{color:"var(--wh2)"}}>cada casa de remates cree y gestione los suyos</strong> desde su propio acceso.</span>
          </div>
        : <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".7rem 1rem",background:"rgba(6,182,212,.05)",border:"1px solid rgba(6,182,212,.15)",borderRadius:8,fontSize:".74rem",color:"var(--mu2)"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.01"/></svg>
            <span>Solo ves los remates de <strong style={{color:"var(--wh2)"}}>{session?.casaNombre}</strong>. Crea y gestiona tus propios remates desde aquí.</span>
          </div>
      }
      <div className="filter-row" style={{marginBottom:"1rem"}}>
        {["todos","borrador","publicado","en_vivo","finalizado"].map(f => (
          <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>
            {f==="todos"?"Todos":f==="borrador"?"Borrador":f==="publicado"?"Publicado":f==="en_vivo"?"En vivo":"Finalizado"}
          </button>
        ))}
      </div>
      <div className="table-card">
        <div className="table-head"><div className="table-title">{REMATES_MERGED.filter(r=>filterTab==="todos"||r.estado===filterTab).length} remates</div></div>
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Fecha y hora</th><th>Modalidad</th><th>Estado</th>{session?.role==="admin"&&<th>Casa</th>}<th></th></tr></thead>
          <tbody>
            {REMATES_MERGED.filter(r=>filterTab==="todos"||r.estado===filterTab).map(r => {
              const ESTADO_LABELS = {borrador:"Borrador",publicado:"Publicado",en_vivo:"● En vivo",finalizado:"Finalizado",activo:"Publicado",cerrado:"Finalizado"};
              const nextEstado = {borrador:"publicado",publicado:"en_vivo",en_vivo:"finalizado"};
              const nextLabel  = {borrador:"→ Publicar",publicado:"→ Activar",en_vivo:"→ Finalizar"};
              return (
                <tr key={r.id}>
                  <td className="mono" style={{fontSize:".7rem"}}>{r.id}</td>
                  <td style={{fontWeight:600}}>{r.name}</td>
                  <td className="mono" style={{fontSize:".75rem"}}>{r.fecha}{r.hora&&<span style={{color:"var(--mu)",marginLeft:".4rem"}}>{r.hora}</span>}</td>
                  <td className="mono">{r.modal}</td>
                  <td><span className={`pill p-${r.estado}`}>{ESTADO_LABELS[r.estado]||r.estado}</span></td>
                  {session?.role==="admin" && (
                    <td><span style={{fontSize:".68rem",fontWeight:600,color:"var(--mu2)",background:"var(--s3)",border:"1px solid var(--b1)",borderRadius:5,padding:".1rem .45rem",whiteSpace:"nowrap"}}>{r.casa||"Remates Ahumada"}</span></td>
                  )}
                  <td>
                    <div style={{display:"flex",gap:".35rem",flexWrap:"nowrap",alignItems:"center"}}>
                      {(remateActivo?.supabaseId||remateActivo?.id)===(r.supabaseId||r.id) ? (
                        <span style={{fontSize:".66rem",fontWeight:700,color:"#34d399",display:"flex",alignItems:"center",gap:".25rem",padding:".2rem .5rem",background:"rgba(52,211,153,.1)",border:"1px solid rgba(52,211,153,.3)",borderRadius:5}}>
                          <div className="ldot" style={{background:"#34d399",width:6,height:6}}/> Activo
                        </span>
                      ) : (
                        <button className="btn-sec" style={{fontSize:".66rem",whiteSpace:"nowrap",color:"var(--ac)",border:"1px solid rgba(6,182,212,.3)"}}
                          onClick={()=>{ setRemateActivo(r); notify(`Trabajando en: ${r.name}`,"sold"); }}>
                          ↳ Trabajar aquí
                        </button>
                      )}
                      {nextEstado[r.estado] && r.supabaseId && (
                        <button className="btn-sec" style={{fontSize:".66rem",whiteSpace:"nowrap",color:r.estado==="publicado"?"var(--gr)":r.estado==="en_vivo"?"var(--mu)":"var(--ac)"}}
                          onClick={async()=>{
                            await updateRemateEstado(r.supabaseId, nextEstado[r.estado]);
                            notify(`Remate ${nextLabel[r.estado].replace("→ ","").toLowerCase()}.`,"sold");
                          }}>
                          {nextLabel[r.estado]}
                        </button>
                      )}
                      {(r.estado==="publicado"||r.estado==="en_vivo"||r.estado==="activo") && (
                        <button className="btn-primary" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async()=>{
                          setSalaRemateId(r.supabaseId||r.id);
                          let mapped = [];
                          if(r.supabaseId){
                            const {data:lotesRemate} = await supabase.from("lotes").select("*").eq("remate_id",r.supabaseId).order("orden");
                            if(lotesRemate&&lotesRemate.length>0){
                              mapped = lotesRemate.map(l=>({id:l.id,supabaseId:l.id,remateId:l.remate_id,name:l.nombre,cat:l.categoria||"Muebles",base:l.base||0,imgs:Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[]),desc:l.descripcion||"",inc:l.incremento||Math.round((l.base||0)*0.05)||100000}));
                            } else {
                              const {data:lotesAll} = await supabase.from("lotes").select("*").eq("estado","disponible").order("orden");
                              if(lotesAll&&lotesAll.length>0){
                                mapped = lotesAll.map(l=>({id:l.id,supabaseId:l.id,remateId:r.supabaseId,name:l.nombre,cat:l.categoria||"Muebles",base:l.base||0,imgs:Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[]),desc:l.descripcion||"",inc:l.incremento||Math.round((l.base||0)*0.05)||100000}));
                                notify("Cargados todos los lotes disponibles (sin asignación de remate).","inf");
                              } else {
                                notify("No hay lotes disponibles. Agrega lotes primero.","inf");
                              }
                            }
                          }
                          if(mapped.length>0){
                            setLots(mapped); setBids(mapped.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null})));
                            setIdx(0); setAState("waiting"); setBidTimer(null);
                            setRemateActivo(r); setPage("sala"); notify("Sala abierta.","sold");
                          } else {
                            setIdx(0); setAState("waiting"); setBidTimer(null);
                            setRemateActivo(r); setPage("sala");
                          }
                        }}>Abrir sala</button>
                      )}
                      {(r.estado==="finalizado"||r.estado==="cerrado") && (<>
                        <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap",color:"var(--gr)",border:"1px solid rgba(20,184,166,.25)"}}
                          onClick={()=>{ setSelectedRemate(r.id||r.supabaseId); setPage("liquidac"); }}>
                          Ver liquidaciones
                        </button>
                        <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap",background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(20,184,166,.12))",border:"1px solid rgba(6,182,212,.3)",color:"var(--ac)",fontWeight:700}}
                          onClick={()=>{ setAiRemateResult(null); setAiRemateModal(r); }}>
                          Resumen IA
                        </button>
                      </>)}
                      {r.supabaseId && (session?.role === "admin" || (session?.role === "martillero" && r.casaId === session?.casaId)) && (
                        confirmDelRemate === r.supabaseId
                          ? <><button className="btn-sec" style={{fontSize:".66rem",whiteSpace:"nowrap",color:"var(--rd)",border:"1px solid rgba(239,68,68,.5)",padding:".2rem .5rem",fontWeight:700}}
                                onClick={async()=>{
                                  setConfirmDelRemate(null);
                                  await supabase.from("pujas").delete().eq("remate_id", r.supabaseId);
                                  await supabase.from("postores").delete().eq("remate_id", r.supabaseId);
                                  await supabase.from("lotes").delete().eq("remate_id", r.supabaseId);
                                  const {error} = await supabase.from("remates").delete().eq("id", r.supabaseId);
                                  if(error){ notify("Error al eliminar el remate.","inf"); console.error(error); return; }
                                  setDbRemates(prev => prev.filter(x => x.id !== r.supabaseId));
                                  notify(`Remate "${r.name}" eliminado.`, "inf");
                                }}>¿Seguro? Sí</button>
                              <button className="btn-sec" style={{fontSize:".66rem",padding:".2rem .5rem"}} onClick={()=>setConfirmDelRemate(null)}>No</button></>
                          : <button className="btn-sec" style={{fontSize:".66rem",whiteSpace:"nowrap",color:"var(--rd)",border:"1px solid rgba(239,68,68,.25)",padding:".2rem .5rem"}}
                              onClick={()=>setConfirmDelRemate(r.supabaseId)}>
                              Eliminar
                            </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
