'use client'
import React from "react";
import { supabase } from "../../lib/supabase";

export default function PageLotes({
  session, filterTab, setFilterTab, lotesFiltroRemate,
  dbLotes, setDbLotes, REMATES_MERGED,
  dbActas, dbBodegas, dbCausas,
  desdeActaModal, setDesdeActaModal, desdeActaSel, setDesdeActaSel,
  desdeActaBienes, setDesdeActaBienes, desdeActaSaving, setDesdeActaSaving,
  desdeCausaModal, setDesdeCausaModal, desdeCausaSel, setDesdeCausaSel,
  desdeCausaLotes, setDesdeCausaLotes, desdeCausaSaving, setDesdeCausaSaving,
  selectedLoteIds, setSelectedLoteIds,
  setEditLoteData, setModal, setAsignarLoteId, setAsignarRemateId,
  notify,
}) {
  const lotesOrdenados = (lotesFiltroRemate
    ? dbLotes.filter(l => l.remate_id === lotesFiltroRemate)
    : dbLotes
  ).slice().sort((a,b)=>(a.orden||0)-(b.orden||0));

  const lotesMostrar = filterTab==="todos"
    ? lotesOrdenados
    : filterTab==="sin-asignar"
      ? lotesOrdenados.filter(l=>!l.remate_id)
      : lotesOrdenados.filter(l=>l.estado===filterTab);

  const fmtClp = n => n ? Number(n).toLocaleString("es-CL") : "—";

  const remateName = lotesFiltroRemate
    ? REMATES_MERGED.find(r=>(r.supabaseId||r.id)===lotesFiltroRemate)?.name||""
    : "";

  const actasDisponibles = dbActas.filter(a => {
    if (a.estado !== "recepcionada") return false;
    const totalBienes = (a.bienes||[]).filter(b=>b.descripcion?.trim()).length;
    if (!totalBienes) return false;
    const lotesCreados = dbLotes.filter(l => l.acta_id === a.id).length;
    return lotesCreados < totalBienes;
  });

  const ESTADOS_CON_BIENES = ["bienes_recepcionados","bases_enviadas","publicaciones_ok","fecha_aprobada","remate_aprobado","en_remate"];
  const causasConBienes = dbCausas.filter(c => ESTADOS_CON_BIENES.includes(c.estado));

  const moverLote = async (loteId, dir) => {
    const arr = lotesOrdenados;
    const idx = arr.findIndex(l => l.id === loteId);
    const ti  = idx + dir;
    if(idx < 0 || ti < 0 || ti >= arr.length) return;
    const a = arr[idx], b = arr[ti];
    const oA = a.orden ?? idx+1, oB = b.orden ?? ti+1;
    setDbLotes(prev => prev.map(l => {
      if(l.id === a.id) return {...l, orden: oB};
      if(l.id === b.id) return {...l, orden: oA};
      return l;
    }));
    Promise.all([
      supabase.from("lotes").update({orden: oB}).eq("id", a.id),
      supabase.from("lotes").update({orden: oA}).eq("id", b.id),
    ]).catch(e => console.warn("reorder:", e));
  };

  const abrirDesdeActa = (acta) => {
    setDesdeActaSel(acta);
    setDesdeActaBienes((acta.bienes||[]).filter(b=>b.descripcion?.trim()).map(b=>({...b,checked:true,base:""})));
  };

  const crearLotesDesdeActa = async () => {
    const seleccionados = desdeActaBienes.filter(b=>b.checked && b.descripcion?.trim());
    if (!seleccionados.length) { notify("Selecciona al menos un bien.","inf"); return; }
    setDesdeActaSaving(true);
    let ok = 0;
    for (let i=0; i<seleccionados.length; i++) {
      const b = seleccionados[i];
      const base = parseFloat(String(b.base||"0").replace(/\D/g,""))||0;
      const catMap = {"Vehículo":"Vehículo","Bien Inmueble":"Inmueble"};
      const { error } = await supabase.from("lotes").insert({
        casa_id:     session?.casaId||null,
        bodega_id:   desdeActaSel.bodega_id||session?.bodegaId||null,
        acta_id:     desdeActaSel.id,
        codigo:      `L-${String(Date.now()+i).slice(-5)}`,
        nombre:      b.descripcion.trim(),
        descripcion: [b.tipo!=="Bien Mueble"?b.tipo:null, b.cantidad>1?`Cantidad: ${b.cantidad}`:null, `Rol: ${desdeActaSel.rol_causa}`, `Mandante: ${desdeActaSel.deudor_nombre}`].filter(Boolean).join(" | "),
        mandante:    desdeActaSel.deudor_nombre||null,
        expediente:  desdeActaSel.rol_causa||null,
        categoria:   catMap[b.tipo]||"Muebles",
        base, minimo:base||null,
        incremento:  base?Math.max(Math.round(base*0.05),5000):10000,
        comision:    7, tipo_iva:"EX", afecto_iva:false,
        cantidad:    parseInt(b.cantidad)||1,
        estado:      "pendiente_revision",
        orden:       dbLotes.length+ok+1,
      });
      if (!error) ok++;
    }
    const {data:lotData} = await supabase.from("lotes").select("*").order("orden");
    if (lotData) setDbLotes(lotData);
    setDesdeActaSaving(false);
    setDesdeActaModal(false);
    setDesdeActaSel(null);
    notify(`${ok} lote${ok!==1?"s":""} creado${ok!==1?"s":""} — aparecen en Revisión de Lotes.`,"sold");
  };

  const crearLotesDesdeCausa = async () => {
    const validos = desdeCausaLotes.filter(l => l.nombre?.trim());
    if (!validos.length) { notify("Agregá al menos un lote con nombre.","inf"); return; }
    setDesdeCausaSaving(true);
    let ok = 0;
    let firstLoteId = null;
    for (let i=0; i<validos.length; i++) {
      const l = validos[i];
      const base = parseFloat(String(l.base||"0").replace(/\D/g,""))||0;
      const { data:newLote, error } = await supabase.from("lotes").insert({
        casa_id:    session?.casaId||null,
        bodega_id:  session?.bodegaId||null,
        causa_id:   desdeCausaSel.id,
        codigo:     `L-${String(Date.now()+i).slice(-5)}`,
        nombre:     l.nombre.trim(),
        expediente: desdeCausaSel.rol||null,
        mandante:   desdeCausaSel.empresa_deudora||null,
        categoria:  desdeCausaSel.tipo==="concursal"?"Concursal":"Judicial",
        base, minimo:base||null,
        incremento: base?Math.max(Math.round(base*0.05),5000):10000,
        comision:   desdeCausaSel.comision_pct||7,
        tipo_iva:"EX", afecto_iva:false,
        cantidad:   parseInt(l.cantidad)||1,
        estado:     "pendiente_revision",
        orden:      dbLotes.length+ok+1,
      }).select("id").single();
      if (!error) {
        ok++;
        if (i === 0 && newLote) firstLoteId = newLote.id;
      }
    }
    if (firstLoteId) await supabase.from("causas").update({lote_id: firstLoteId}).eq("id", desdeCausaSel.id);
    const {data:lotData} = await supabase.from("lotes").select("*").order("orden");
    if (lotData) setDbLotes(lotData);
    setDesdeCausaSaving(false);
    setDesdeCausaModal(false);
    setDesdeCausaSel(null);
    setDesdeCausaLotes([]);
    notify(`${ok} lote${ok!==1?"s":""} creado${ok!==1?"s":""} desde causa.`,"sold");
  };

  return (
    <div className="page">
      {desdeActaModal && (
        <div className="modal-overlay" onClick={()=>{setDesdeActaModal(false);setDesdeActaSel(null);}}>
          <div className="modal" style={{maxWidth:600,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Crear lotes desde acta</span>
              <button className="modal-close" onClick={()=>{setDesdeActaModal(false);setDesdeActaSel(null);}}>✕</button>
            </div>
            <div style={{padding:"0 1.2rem 1.2rem",display:"flex",flexDirection:"column",gap:12}}>
              {!desdeActaSel ? (
                <>
                  <div style={{fontSize:".8rem",color:"var(--mu)"}}>Selecciona un acta recepcionada para importar sus bienes como lotes.</div>
                  {actasDisponibles.length === 0 ? (
                    <div style={{textAlign:"center",padding:"2rem",color:"var(--mu)",fontSize:".85rem"}}>No hay actas recepcionadas con bienes disponibles.</div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {actasDisponibles.map(a => {
                        const yaCreados = dbLotes.filter(l=>l.acta_id===a.id).length;
                        return (
                          <div key={a.id}
                            onClick={()=>abrirDesdeActa(a)}
                            style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontWeight:700,fontSize:".85rem",color:"var(--fgp)"}}>{a.deudor_nombre}</div>
                              <div style={{fontSize:".75rem",color:"var(--mu)",marginTop:2}}>Rol: {a.rol_causa} · {(a.bienes||[]).filter(b=>b.descripcion?.trim()).length} bienes · {dbBodegas.find(b=>b.id===a.bodega_id)?.nombre||"Sin bodega"}</div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                              {yaCreados>0 && <span style={{fontSize:".72rem",color:"#8b5cf6"}}>{yaCreados} lote{yaCreados!==1?"s":""} ya creado{yaCreados!==1?"s":""}</span>}
                              <span style={{fontSize:".75rem",color:"var(--ac)",fontWeight:600}}>Seleccionar →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:8,padding:"10px 14px",fontSize:".8rem",color:"var(--mu)"}}>
                    <b style={{color:"var(--fgp)"}}>{desdeActaSel.deudor_nombre}</b> — Rol {desdeActaSel.rol_causa}
                    <button onClick={()=>setDesdeActaSel(null)} style={{marginLeft:12,fontSize:".72rem",color:"var(--ac)",background:"none",border:"none",cursor:"pointer"}}>← Cambiar acta</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {desdeActaBienes.map((b,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:8,padding:"10px 12px"}}>
                        <input type="checkbox" checked={b.checked}
                          onChange={e=>setDesdeActaBienes(p=>p.map((x,j)=>j===i?{...x,checked:e.target.checked}:x))}
                          style={{width:16,height:16,accentColor:"var(--ac)",cursor:"pointer",flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:".82rem",color:"var(--fgp)"}}>{b.descripcion}</div>
                          <div style={{fontSize:".72rem",color:"var(--mu)"}}>{b.tipo} · {b.cantidad} unid. · {b.estado}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                          <label style={{fontSize:".68rem",color:"var(--mu)"}}>Precio base</label>
                          <input className="fi" value={b.base} onChange={e=>setDesdeActaBienes(p=>p.map((x,j)=>j===i?{...x,base:e.target.value}:x))}
                            placeholder="$ 0" style={{width:110,textAlign:"right",fontSize:".8rem"}} disabled={!b.checked}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn-primary" onClick={crearLotesDesdeActa} disabled={desdeActaSaving} style={{fontSize:".8rem"}}>
                      {desdeActaSaving?"Creando...": `Crear ${desdeActaBienes.filter(b=>b.checked).length} lote${desdeActaBienes.filter(b=>b.checked).length!==1?"s":""}`}
                    </button>
                    <button className="btn-secondary" onClick={()=>{setDesdeActaModal(false);setDesdeActaSel(null);}} style={{fontSize:".8rem"}}>Cancelar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {desdeCausaModal && (
        <div className="modal-overlay" onClick={()=>{setDesdeCausaModal(false);setDesdeCausaSel(null);setDesdeCausaLotes([]);}}>
          <div className="modal" style={{maxWidth:680,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Crear lotes desde causa</span>
              <button className="modal-close" onClick={()=>{setDesdeCausaModal(false);setDesdeCausaSel(null);setDesdeCausaLotes([]);}}>✕</button>
            </div>
            <div style={{padding:"0 1.2rem 1.2rem",display:"flex",flexDirection:"column",gap:12}}>
              {!desdeCausaSel ? (
                <>
                  <div style={{fontSize:".8rem",color:"var(--mu)"}}>Seleccioná una causa para crear sus lotes. Podés agregar cuantos lotes necesites.</div>
                  {causasConBienes.length === 0 ? (
                    <div style={{textAlign:"center",padding:"2rem",color:"var(--mu)",fontSize:".85rem"}}>No hay causas con bienes recepcionados disponibles.</div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {causasConBienes.map(c => {
                        const lotesExistentes = dbLotes.filter(l=>l.causa_id===c.id).length;
                        return (
                          <div key={c.id}
                            onClick={()=>{
                              setDesdeCausaSel(c);
                              setDesdeCausaLotes([{nombre:c.bienes_descripcion?.slice(0,80)||"",base:"",cantidad:1}]);
                            }}
                            style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontWeight:700,fontSize:".85rem",color:"var(--fgp)"}}>{c.empresa_deudora||c.deudor_nombre||c.rol}</div>
                              <div style={{fontSize:".75rem",color:"var(--mu)",marginTop:2}}>
                                Rol: {c.rol} · {c.tipo==="concursal"?"Concursal":"Judicial"} · {c.estado?.replace(/_/g," ")}
                              </div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                              {lotesExistentes>0 && <span style={{fontSize:".72rem",color:"#8b5cf6"}}>{lotesExistentes} lote{lotesExistentes!==1?"s":""} ya creado{lotesExistentes!==1?"s":""}</span>}
                              <span style={{fontSize:".75rem",color:"var(--ac)",fontWeight:600}}>Seleccionar →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:8,padding:"10px 14px",fontSize:".8rem",color:"var(--mu)"}}>
                    <b style={{color:"var(--fgp)"}}>{desdeCausaSel.empresa_deudora||desdeCausaSel.rol}</b> — Rol {desdeCausaSel.rol} · {desdeCausaSel.tipo==="concursal"?"Concursal":"Judicial"}
                    <button onClick={()=>{setDesdeCausaSel(null);setDesdeCausaLotes([]);}} style={{marginLeft:12,fontSize:".72rem",color:"var(--ac)",background:"none",border:"none",cursor:"pointer"}}>← Cambiar causa</button>
                  </div>
                  <div style={{display:"flex",gap:6,fontSize:".72rem",color:"var(--mu)",fontWeight:600,padding:"0 2px"}}>
                    <span style={{flex:2}}>Nombre del lote</span>
                    <span style={{flex:1,textAlign:"right"}}>Precio base</span>
                    <span style={{width:64,textAlign:"center"}}>Cant.</span>
                    {desdeCausaLotes.length>1 && <span style={{width:24}}/>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {desdeCausaLotes.map((l,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{flex:2}}>
                          <input className="fi" value={l.nombre}
                            onChange={e=>setDesdeCausaLotes(p=>p.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}
                            placeholder="Nombre del lote" style={{width:"100%",fontSize:".82rem"}}/>
                        </div>
                        <div style={{flex:1}}>
                          <input className="fi" value={l.base}
                            onChange={e=>setDesdeCausaLotes(p=>p.map((x,j)=>j===i?{...x,base:e.target.value}:x))}
                            placeholder="$ 0" style={{width:"100%",textAlign:"right",fontSize:".8rem"}}/>
                        </div>
                        <div style={{width:64}}>
                          <input className="fi" type="number" min={1} value={l.cantidad}
                            onChange={e=>setDesdeCausaLotes(p=>p.map((x,j)=>j===i?{...x,cantidad:e.target.value}:x))}
                            style={{width:"100%",textAlign:"center",fontSize:".8rem"}}/>
                        </div>
                        {desdeCausaLotes.length > 1 && (
                          <button onClick={()=>setDesdeCausaLotes(p=>p.filter((_,j)=>j!==i))}
                            style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:"1rem",flexShrink:0,padding:"0 4px",lineHeight:1}}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setDesdeCausaLotes(p=>[...p,{nombre:"",base:"",cantidad:1}])}
                    style={{alignSelf:"flex-start",padding:"5px 14px",borderRadius:8,border:"1px dashed var(--b1)",background:"transparent",color:"var(--mu)",fontSize:".78rem",cursor:"pointer"}}>
                    + Agregar lote
                  </button>
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <button className="btn-primary" onClick={crearLotesDesdeCausa} disabled={desdeCausaSaving} style={{fontSize:".8rem"}}>
                      {desdeCausaSaving ? "Creando…" : `Crear ${desdeCausaLotes.filter(l=>l.nombre?.trim()).length} lote${desdeCausaLotes.filter(l=>l.nombre?.trim()).length!==1?"s":""}`}
                    </button>
                    <button className="btn-secondary" onClick={()=>{setDesdeCausaModal(false);setDesdeCausaSel(null);setDesdeCausaLotes([]);}} style={{fontSize:".8rem"}}>Cancelar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="filter-row" style={{marginBottom:"1rem"}}>
        {[["todos","Todos"],["sin-asignar","Sin remate"],["publicado","Publicado"],["vendido","Vendido"],["sin vender","Sin vender"]].map(([val,label]) => (
          <button key={val} className={`filter-btn${filterTab===val?" on":""}`} onClick={()=>{setFilterTab(val);setSelectedLoteIds(new Set());}}>{label}</button>
        ))}
      </div>
      <div className="table-card">
        <div className="table-head">
          <div className="table-title">{lotesMostrar.length} lotes{remateName ? ` — ${remateName}` : ""}</div>
          <div style={{display:"flex",gap:8}}>
            {causasConBienes.length > 0 && (
              <button onClick={()=>{setDesdeCausaModal(true);setDesdeCausaSel(null);setDesdeCausaLotes([]);}}
                style={{padding:"5px 14px",borderRadius:8,border:"1px solid #059669",background:"transparent",color:"#059669",fontSize:".78rem",fontWeight:600,cursor:"pointer"}}>
                Desde Causa
              </button>
            )}
            {actasDisponibles.length > 0 && (
              <button onClick={()=>{setDesdeActaModal(true);setDesdeActaSel(null);}}
                style={{padding:"5px 14px",borderRadius:8,border:"1px solid #8b5cf6",background:"transparent",color:"#8b5cf6",fontSize:".78rem",fontWeight:600,cursor:"pointer"}}>
                Desde Acta
              </button>
            )}
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead>
              <tr>
                <th style={{width:36,textAlign:"center"}}>
                  <input type="checkbox"
                    checked={lotesMostrar.length>0 && lotesMostrar.every(l=>selectedLoteIds.has(l.id))}
                    onChange={e=>{
                      if(e.target.checked) setSelectedLoteIds(new Set(lotesMostrar.map(l=>l.id)));
                      else setSelectedLoteIds(new Set());
                    }}/>
                </th>
                <th style={{textAlign:"center",width:56}}>Lote</th>
                <th style={{textAlign:"center",width:52}}>Cant.</th>
                <th>Descripción</th>
                <th>Propietario</th>
                {dbBodegas.length > 0 && <th style={{textAlign:"center"}}>Bodega</th>}
                <th style={{textAlign:"right"}}>Mínimo</th>
                <th style={{textAlign:"center"}}>Com.</th>
                <th style={{textAlign:"center"}}>Estado</th>
                <th style={{textAlign:"center"}}>Acción</th>
                <th style={{textAlign:"center",width:56}}>Orden</th>
              </tr>
            </thead>
            <tbody>
              {lotesMostrar.length === 0 ? (
                <tr><td colSpan={dbBodegas.length>0?11:10} style={{textAlign:"center",color:"var(--mu)",padding:"2rem",fontSize:".8rem"}}>
                  {lotesFiltroRemate ? "Este remate no tiene lotes aún. Usa + Agregar lote." : "No hay lotes registrados."}
                </td></tr>
              ) : lotesMostrar.map((l,i) => {
                const idxTotal = lotesOrdenados.findIndex(x=>x.id===l.id);
                const puedeSubir = idxTotal > 0;
                const puedeBajar = idxTotal < lotesOrdenados.length-1;
                return (
                  <tr key={l.id}>
                    <td style={{textAlign:"center"}}>
                      <input type="checkbox" checked={selectedLoteIds.has(l.id)}
                        onChange={e=>{setSelectedLoteIds(prev=>{const n=new Set(prev);e.target.checked?n.add(l.id):n.delete(l.id);return n;});}}/>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <span style={{fontWeight:900,fontSize:".88rem",color:"var(--ac)",fontFamily:"Inter,sans-serif"}}>{l.orden??idxTotal+1}</span>
                    </td>
                    <td style={{textAlign:"center"}}>{l.cantidad||1}</td>
                    <td style={{fontWeight:600}}>{l.nombre||"—"}</td>
                    <td className="mono">{l.propietario||"—"}</td>
                    {dbBodegas.length > 0 && (
                      <td style={{textAlign:"center"}}>
                        {l.bodega_id ? (
                          <span style={{fontSize:".65rem",fontWeight:700,padding:"2px 7px",borderRadius:20,background:"rgba(6,182,212,.1)",color:"var(--ac)",border:"1px solid rgba(6,182,212,.25)",whiteSpace:"nowrap"}}>
                            {dbBodegas.find(b=>b.id===l.bodega_id)?.nombre||"—"}
                          </span>
                        ) : <span style={{color:"var(--mu)",fontSize:".7rem"}}>—</span>}
                      </td>
                    )}
                    <td style={{textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:600}}>${fmtClp(l.base)}</td>
                    <td style={{textAlign:"center"}}>
                      <span style={{color:"var(--ac)",fontWeight:700,fontFamily:"Inter,sans-serif",fontSize:".76rem"}}>{l.comision||3}%</span>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <span className={`pill p-${(l.estado||"publicado").replace(" ","-")}`}>{l.estado||"publicado"}</span>
                        {l.afecto_iva && <span style={{fontSize:".6rem",fontWeight:700,color:"var(--yl)",background:"rgba(234,179,8,.1)",border:"1px solid rgba(234,179,8,.28)",borderRadius:4,padding:"1px 5px"}}>IVA</span>}
                      </div>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <button className="btn-sec" style={{fontSize:".68rem",padding:".2rem .65rem"}}
                        onClick={()=>{
                          setEditLoteData({
                            id:          l.id,
                            nombre:      l.nombre||"",
                            propietario: l.propietario||"",
                            categoria:   l.categoria||"",
                            base:        l.base||"",
                            minimo:      l.minimo||"",
                            comision:    l.comision||"",
                            estado:      l.estado||"disponible",
                            orden:       l.orden||idxTotal+1,
                            cantidad:    l.cantidad||1,
                            ppu:         l.precio_por_unidad||false,
                            afectoIva:   l.afecto_iva||false,
                          });
                          setModal("editar-lote");
                        }}>Editar</button>
                      <button className="btn-sec" style={{fontSize:".68rem",padding:".2rem .65rem",marginTop:3,background:"rgba(6,182,212,.08)",color:"var(--ac)",borderColor:"rgba(6,182,212,.3)"}}
                        onClick={()=>{setAsignarLoteId(l.id);setAsignarRemateId(l.remate_id||"");setModal("asignar-remate");}}>
                        {l.remate_id?"Reasignar":"Asignar"}
                      </button>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <button onClick={()=>moverLote(l.id,-1)} disabled={!puedeSubir} title="Subir"
                          style={{width:24,height:20,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--b1)",borderRadius:4,background:"transparent",cursor:puedeSubir?"pointer":"default",opacity:puedeSubir?1:.18,padding:0}}>
                          <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6l4-4 4 4"/></svg>
                        </button>
                        <button onClick={()=>moverLote(l.id,1)} disabled={!puedeBajar} title="Bajar"
                          style={{width:24,height:20,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--b1)",borderRadius:4,background:"transparent",cursor:puedeBajar?"pointer":"default",opacity:puedeBajar?1:.18,padding:0}}>
                          <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 2l4 4 4-4"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedLoteIds.size > 0 && (
        <div style={{position:"fixed",bottom:"1.5rem",left:"50%",transform:"translateX(-50%)",
          background:"#1f2937",color:"#fff",borderRadius:12,padding:".75rem 1.25rem",
          display:"flex",alignItems:"center",gap:"1rem",boxShadow:"0 8px 30px rgba(0,0,0,.3)",
          zIndex:200,fontSize:".82rem",fontWeight:600,whiteSpace:"nowrap"}}>
          <span style={{color:"rgba(255,255,255,.75)"}}>{selectedLoteIds.size} lote{selectedLoteIds.size!==1?"s":""} seleccionado{selectedLoteIds.size!==1?"s":""}</span>
          <button onClick={()=>{setAsignarLoteId(null);setAsignarRemateId("");setModal("asignar-remate");}}
            style={{background:"var(--ac)",color:"#fff",border:"none",borderRadius:8,padding:".4rem .9rem",fontWeight:700,cursor:"pointer",fontSize:".78rem"}}>
            Asignar a remate
          </button>
          <button onClick={()=>setSelectedLoteIds(new Set())}
            style={{background:"transparent",color:"rgba(255,255,255,.55)",border:"1px solid rgba(255,255,255,.18)",borderRadius:8,padding:".4rem .75rem",cursor:"pointer",fontSize:".75rem"}}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
