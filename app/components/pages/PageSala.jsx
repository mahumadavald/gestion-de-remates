'use client'
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { fmt, fmtS } from "../../lib/format";

const LOTES_SALA   = [];
const INC_OPTIONS  = [10000,20000,50000,100000,200000,500000,1000000,2000000,5000000];
const BID_TIMER_D  = 15;

const BidRing = ({ seconds, total, nextAmount, increment }) => {
  const r = 20, circ = 2 * Math.PI * r, offset = circ * (1 - seconds / total);
  const color = seconds > 8 ? "#14B8A6" : seconds > 4 ? "#f6ad55" : "#f56565";
  const urgent = seconds <= 5;
  const adjudicando = seconds <= 1;
  return (
    <div className="bid-ring-wrap" style={{
      background: urgent ? `rgba(${adjudicando?"239,68,68":"245,158,11"},.1)` : "rgba(6,182,212,.06)",
      border: `1px solid rgba(${adjudicando?"239,68,68":"245,158,11"},.${urgent?".3":"18"})`,
      animation: urgent ? "losepulse 0.6s infinite" : "none",
    }}>
      <div className="bid-ring-outer">
        <svg className="bid-ring-svg" width="52" height="52" viewBox="0 0 52 52">
          <circle className="bid-ring-bg" cx="26" cy="26" r={r}/>
          <circle className="bid-ring-fill" cx="26" cy="26" r={r} stroke={color} strokeDasharray={circ} strokeDashoffset={offset}/>
        </svg>
        <div className="bid-ring-num" style={{color, fontSize: seconds <= 9 ? "1.4rem" : "1.2rem"}}>{seconds}</div>
      </div>
      <div style={{flex:1}}>
        {adjudicando
          ? <div style={{fontWeight:900,fontSize:"1rem",color:"#f56565",letterSpacing:".03em"}}>¡ADJUDICANDO!</div>
          : urgent
            ? <><div className="bid-ring-label" style={{color:"#f6ad55"}}>Última oportunidad</div>
                <div className="bid-ring-next">{fmt(nextAmount)}</div>
                <div className="bid-ring-inc">Incremento: +{fmtS(increment)}</div></>
            : <><div className="bid-ring-label">Próxima puja en</div>
                <div className="bid-ring-next">{fmt(nextAmount)}</div>
                <div className="bid-ring-inc">Incremento: +{fmtS(increment)}</div></>
        }
      </div>
    </div>
  );
};

/* ── Estilos para los tabs del panel izquierdo ── */
const tabBase = {
  flex: 1, padding: ".65rem 1rem",
  fontSize: ".76rem", fontWeight: 600,
  background: "none", border: "none", cursor: "pointer",
  textAlign: "center",
  borderBottom: "2px solid transparent",
  transition: "color .2s, border-color .2s",
};
const tabOn  = { ...tabBase, color: "var(--ac)", borderBottomColor: "var(--ac)" };
const tabOff = { ...tabBase, color: "var(--mu)" };

export default function PageSala({
  session, salaRemateId, setSalaRemateId, REMATES_MERGED,
  lots, setLots, bids, setBids,
  idx, setIdx, aState, setAState, bidTimer, setBidTimer,
  photoIdx, setPhotoIdx, ctrlTab, setCtrlTab,
  modalidad, setModalidad, flash,
  curInc, setCurInc, customMonto, setCustomMonto,
  presPaleta, setPresPaleta, presMonto, setPresMonto,
  adjSinPujas, setAdjSinPujas, adjCountdown, lastBidder,
  camActiva, grabando, feedRef, videoRef, photoIntervalRef,
  BID_TIMER,
  notify, setPage,
  startAuction, pauseAuction, repetirLote, pasarLote, resetAuction,
  registrarPresencial, adjudicar, avanzarSiguienteLote, revertirAdjudicacion,
  cerrarRemateCompleto, handlePhoto, removePhoto, startCarousel,
  activarCamara, detenerCamara, placeBid,
}) {
  const [leftTab, setLeftTab] = useState("lote");

  const item = lots[idx];
  const bid  = bids[idx] || {};
  const sColor = {live:"var(--gr)",sold:"var(--ac)",paused:"var(--yl)",waiting:"var(--mu)"}[aState];
  const sLabel = {live:"En vivo",sold:"Adjudicado",paused:"Pausado",waiting:"En espera"}[aState];
  const iAmWinning = lastBidder === "me";
  const bidTimerVal = BID_TIMER ?? BID_TIMER_D;

  const timerColor   = (bidTimer??0) > 8 ? "var(--gr)" : (bidTimer??0) > 4 ? "var(--yl)" : "var(--rd)";
  const timerPct     = ((bidTimer??0) / bidTimerVal) * 100;
  const vendidos     = bids.filter(b => b.status === "sold").length;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>

      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-left">
          <button className="btn-sec" onClick={()=>setPage("remates")}>← Volver</button>
          <div className="topbar-title">Sala en vivo</div>
          <select className="fsel" style={{maxWidth:200,fontSize:".75rem",flexShrink:1,minWidth:0}}
            value={salaRemateId||""}
            onChange={async e=>{
              const rid = e.target.value;
              setSalaRemateId(rid);
              if(rid){
                const {data:lr} = await supabase.from("lotes").select("*").eq("remate_id",rid).order("orden");
                if(lr&&lr.length>0){
                  const mapped = lr.map(l=>({id:l.id,supabaseId:l.id,remateId:l.remate_id,name:l.nombre,cat:l.categoria||"Muebles",base:l.base||0,imgs:Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[]),desc:l.descripcion||"",inc:Math.round((l.base||0)*0.05)||100000}));
                  setLots(mapped); setBids(mapped.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null})));
                } else {
                  setLots(LOTES_SALA); setBids(LOTES_SALA.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null})));
                  notify("Este remate no tiene lotes aún.","inf");
                }
                setIdx(0); setAState("waiting"); setBidTimer(null);
              }
            }}>
            <option value="">— Seleccionar remate —</option>
            {REMATES_MERGED.map(r=>(
              <option key={r.supabaseId||r.id} value={r.supabaseId||r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="topbar-right">
          <div className="mod-tabs">
            {[["presencial","Presencial"],["hibrido","Hibrido"],["online","Online"]].map(([k,l])=>(
              <button key={k} className={`mod-tab${modalidad===k?" on":""}`} onClick={()=>setModalidad(k)}>{l}</button>
            ))}
          </div>
          {aState==="live" && <div className="tb-live"><div className="ldot"/>Transmitiendo</div>}
          <button className="btn-sec" style={{fontSize:".7rem"}} title="Abrir pantalla para proyección en sala"
            onClick={()=>{
              const rem = REMATES_MERGED.find(r=>(r.supabaseId||r.id)===salaRemateId);
              const slug = session?.casa || rem?.casaSlug || "";
              if (!slug) { notify("Selecciona un remate primero para abrir la pantalla de sala.","inf"); return; }
              window.open(`/display/${slug}`,"_blank","width=1280,height=720");
            }}>
            Pantalla sala
          </button>
          {bids.every(b=>b.status==="sold"||bids[idx]?.count>0) && (
            <button className="btn-primary" style={{fontSize:".7rem"}} onClick={cerrarRemateCompleto}>Cerrar remate</button>
          )}
        </div>
      </div>

      <div className="sala-wrap-new">
        {/* ── Estado vacío ── */}
        {!item && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:"1.2rem",color:"var(--wh2)",textAlign:"center",padding:"3rem 2rem"}}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{opacity:.3}}>
              <rect x="6" y="10" width="44" height="36" rx="4"/><circle cx="28" cy="28" r="8"/><path d="M22 10l3-5h6l3 5"/>
            </svg>
            <div style={{fontSize:"1.1rem",fontWeight:700}}>Selecciona un remate con lotes</div>
            <div style={{fontSize:".85rem",color:"var(--mu)",maxWidth:340,lineHeight:1.6}}>
              Elige un remate en el selector de arriba, o ve a <strong style={{color:"var(--ac)",cursor:"pointer"}} onClick={()=>setPage("remates")}>Remates</strong> y haz clic en <strong>Abrir sala</strong>.
            </div>
            <button className="btn-primary" onClick={()=>setPage("remates")}>Ir a Remates →</button>
          </div>
        )}

        {item && <div className="sala-body">

          {/* ══ PANEL IZQUIERDO ══ */}
          <div className="sala-left-card">

            {/* Tabs */}
            <div style={{display:"flex",borderBottom:"1px solid var(--b1)",flexShrink:0,background:"var(--s1)",borderRadius:"14px 14px 0 0"}}>
              <button style={leftTab==="lote"?tabOn:tabOff} onClick={()=>setLeftTab("lote")}>
                Lote Actual
              </button>
              <button style={leftTab==="todos"?tabOn:tabOff} onClick={()=>setLeftTab("todos")}>
                Todos los lotes ({lots.length})
                {vendidos > 0 && <span style={{marginLeft:".4rem",fontSize:".6rem",color:"var(--gr)",fontWeight:700}}>{vendidos} adj.</span>}
              </button>
            </div>

            {leftTab === "lote" ? (<>

              {/* Badge + meta */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:".75rem 1.1rem .3rem",flexShrink:0,gap:".5rem"}}>
                <div className="sala-live-badge" style={{margin:0}}>
                  <span style={{fontSize:".65rem"}}>●</span>
                  {aState==="live" ? "Live Now" : aState==="sold" ? "Adjudicado" : "En espera"}
                </div>
                <div style={{fontSize:".68rem",color:"var(--mu)",fontVariantNumeric:"tabular-nums"}}>
                  Lote {String(idx+1).padStart(2,"0")} de {lots.length}
                </div>
              </div>

              {/* Título */}
              <div className="sala-lot-title" style={{padding:".2rem 1.1rem .45rem"}}>
                {item.name}
              </div>

              {/* Foto + cámara */}
              <div className="sala-photo-wrap">
                <div className="sala-photo-main">
                  {(item.imgs||[]).length > 0 ? (
                    <>
                      <img
                        src={item.imgs[photoIdx % item.imgs.length]}
                        alt={item.name}
                        style={{width:"100%",height:"100%",objectFit:"cover",display:"block",transition:"opacity .3s"}}
                      />
                      {item.imgs.length > 1 && (
                        <>
                          <button onClick={()=>{ if(photoIntervalRef.current) clearInterval(photoIntervalRef.current); setPhotoIdx(p=>(p-1+item.imgs.length)%item.imgs.length); startCarousel(item.imgs); }}
                            style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 2L4 6l4 4"/></svg>
                          </button>
                          <button onClick={()=>{ if(photoIntervalRef.current) clearInterval(photoIntervalRef.current); setPhotoIdx(p=>(p+1)%item.imgs.length); startCarousel(item.imgs); }}
                            style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 2l4 4-4 4"/></svg>
                          </button>
                          <div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4}}>
                            {item.imgs.map((_,i)=>(
                              <div key={i} onClick={()=>setPhotoIdx(i)}
                                style={{width:i===photoIdx%item.imgs.length?14:6,height:6,borderRadius:3,background:i===photoIdx%item.imgs.length?"var(--ac)":"rgba(255,255,255,.4)",cursor:"pointer",transition:"all .2s"}}/>
                            ))}
                          </div>
                        </>
                      )}
                      {ctrlTab==="control" && <>
                        <button onClick={()=>removePhoto(idx, photoIdx%item.imgs.length)}
                          style={{position:"absolute",top:6,left:6,background:"rgba(224,82,82,.7)",border:"none",borderRadius:4,padding:".12rem .35rem",fontSize:".62rem",color:"#fff",cursor:"pointer"}}>
                          Quitar
                        </button>
                        <label htmlFor={`phadd${idx}`}
                          style={{position:"absolute",top:6,right:6,background:"rgba(6,182,212,.85)",borderRadius:5,padding:".15rem .45rem",fontSize:".62rem",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:".2rem"}}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                          Foto
                          <input id={`phadd${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                        </label>
                      </>}
                    </>
                  ) : (
                    <label htmlFor={`ph${idx}`} className="sala-photo-placeholder" style={{cursor:"pointer"}}>
                      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="var(--mu)" strokeWidth="1.5"><rect x="3" y="6" width="26" height="20" rx="3"/><circle cx="16" cy="16" r="5"/><path d="M12 6l2-3h4l2 3"/></svg>
                      <div style={{fontSize:".72rem",color:"var(--mu2)"}}>Agregar fotos del lote</div>
                      <input id={`ph${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                    </label>
                  )}
                  {ctrlTab==="control" && (
                    <button
                      onClick={camActiva ? detenerCamara : activarCamara}
                      style={{position:"absolute",bottom:6,left:6,display:"flex",alignItems:"center",gap:".3rem",padding:".22rem .55rem",background:camActiva?"rgba(224,82,82,.82)":"rgba(0,0,0,.58)",border:"none",borderRadius:5,color:"#fff",fontSize:".62rem",fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)"}}
                      title="Cámara martillero (solo preview)"
                    >
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 3h8l3 3v5H1V3z"/><circle cx="5" cy="8" r="1.5"/></svg>
                      {camActiva ? "Apagar cam" : "Cámara"}
                    </button>
                  )}
                  {grabando && (
                    <div style={{position:"absolute",bottom:6,right:6,display:"flex",alignItems:"center",gap:".3rem",padding:".22rem .55rem",background:"rgba(224,82,82,.85)",borderRadius:5,color:"#fff",fontSize:".62rem",fontWeight:800,backdropFilter:"blur(4px)"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:"#fff",animation:"pulse .8s infinite"}}/>
                      REC
                    </div>
                  )}
                </div>
                {camActiva && (
                  <div className="sala-cam-side">
                    <video ref={videoRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    <div className="sala-cam-side-label">CAM</div>
                  </div>
                )}
              </div>

              {/* Timer — barra horizontal nueva */}
              <div style={{display:"flex",alignItems:"center",gap:".65rem",padding:".6rem 1.1rem .75rem",flexShrink:0,borderTop:"1px solid var(--b1)",background:"var(--s3)"}}>
                <span style={{fontSize:".65rem",fontWeight:600,color:"var(--mu2)",whiteSpace:"nowrap"}}>Tiempo</span>
                <div style={{flex:1,height:5,background:"var(--b1)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:3,transition:"width 1s linear, background .5s",width:`${aState==="live"&&bidTimer!==null&&bidTimer>0?timerPct:0}%`,background:timerColor}}/>
                </div>
                <div style={{fontFamily:"Inter,monospace",fontSize:"1.2rem",fontWeight:800,letterSpacing:".02em",minWidth:"3.5ch",textAlign:"right",fontVariantNumeric:"tabular-nums",color:aState==="live"&&bidTimer!==null&&bidTimer>0?timerColor:"var(--mu)"}}>
                  {aState==="live"&&bidTimer!==null&&bidTimer>0?bidTimer+"s":"—"}
                </div>
              </div>

            </>) : (

              /* ── Tab "Todos los lotes" ── */
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:".35rem",padding:".65rem .85rem .85rem"}}>
                {lots.map((l,i)=>{
                  const b = bids[i]||{};
                  const esCurrent = i===idx;
                  const esAdj = b.status==="sold";
                  return (
                    <div key={i}
                      onClick={()=>{ if(!esCurrent){ setIdx(i); setAState("waiting"); setBidTimer(null); } }}
                      style={{display:"flex",alignItems:"center",gap:".7rem",padding:".5rem .65rem",borderRadius:10,background:esCurrent?"rgba(6,182,212,.07)":"rgba(255,255,255,.025)",border:`1px solid ${esCurrent?"rgba(6,182,212,.25)":"var(--b1)"}`,cursor:esCurrent?"default":"pointer",opacity:esAdj?.65:1,transition:"border-color .2s"}}>
                      {l.imgs?.[0]
                        ? <img src={l.imgs[0]} alt="" style={{width:42,height:42,borderRadius:7,objectFit:"cover",flexShrink:0}}/>
                        : <div style={{width:42,height:42,borderRadius:7,background:"var(--s3)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(90,127,168,.4)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                          </div>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:".78rem",fontWeight:600,color:"var(--wh)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}</div>
                        <div style={{fontSize:".63rem",color:"var(--mu)",marginTop:".15rem"}}>Lote #{i+1}{l.cat?` · ${l.cat}`:""}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:".78rem",fontWeight:700,color:"var(--wh)",fontVariantNumeric:"tabular-nums"}}>{fmt(esAdj?(b.current||l.base):l.base)}</div>
                        <div style={{fontSize:".62rem",fontWeight:700,marginTop:".15rem",color:esAdj?"var(--gr)":esCurrent?"var(--ac)":"var(--mu)"}}>
                          {esAdj?"✓ Adjudicado":esCurrent?"● En subasta":"Pendiente"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══ PANEL DERECHO ══ */}
          <div className="sala-right-col">
            <div className="sala-bid-card">

              {/* Oferta grande */}
              <div className="sala-bid-header">
                <div style={{flex:1}}>
                  <div className="sala-bid-label">Oferta actual:</div>
                  <div className={`sala-bid-amount${flash?" flash":""}`}>{fmt(bid.current)}</div>
                  {bid.winner && (
                    <div style={{fontSize:".8rem",color:"var(--mu2)",marginTop:".3rem",display:"flex",alignItems:"center",gap:".35rem"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:"var(--gr)",animation:"blink 1.2s infinite"}}/>
                      {bid.winner}
                    </div>
                  )}
                  <div style={{fontSize:".7rem",color:"var(--mu)",marginTop:".35rem",display:"flex",alignItems:"center",gap:".5rem"}}>
                    <span>Base {fmt(item.base||0)}</span>
                    {bid.count>0&&<span style={{display:"inline-flex",alignItems:"center",gap:".3rem",background:"rgba(6,182,212,.1)",border:"1px solid rgba(6,182,212,.18)",borderRadius:5,padding:".15rem .45rem",fontSize:".65rem",fontWeight:700,color:"var(--ac)"}}>
                      {bid.count} {bid.count===1?"puja":"pujas"}
                    </span>}
                    <span style={{display:"flex",alignItems:"center",gap:".28rem",marginLeft:"auto"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:sColor,flexShrink:0}}/>
                      <span style={{fontSize:".65rem",fontWeight:700,color:sColor}}>{sLabel}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de pujas */}
              <div className="sala-last-bids-title" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>Últimas pujas</span>
                {bid.history?.length>0&&<span style={{fontSize:".6rem",color:"var(--mu)",fontWeight:400}}>{bid.history.length} total</span>}
              </div>
              <div className="sala-last-bids" ref={feedRef}>
                {bid.history?.length===0
                  ? <div className="sala-no-bids">Sin pujas aún</div>
                  : [...(bid.history||[])].reverse().slice(0,8).map((b,i) => {
                    const initials = (b.bidder||"?").split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
                    const avatarColors = ["var(--ac)","#a78bfa","var(--yl)","var(--gr)"];
                    return (
                      <div key={i} className="sala-bid-row" style={i===0?{background:"rgba(6,182,212,.07)",border:"1px solid rgba(6,182,212,.2)"}:{}}>
                        <div style={{fontSize:".62rem",fontWeight:700,color:i===0?"var(--ac)":"var(--mu)",minWidth:16,textAlign:"center"}}>{i+1}</div>
                        <div className="sala-bid-avatar" style={{background:avatarColors[i%avatarColors.length]}}>
                          {b.mine?"Yo":initials}
                        </div>
                        <div className="sala-bid-name">
                          {b.mine?"Tu (P-0245)":b.bidder}
                          {b.online && <span className="sala-bid-tag web" style={{marginLeft:4}}>WEB</span>}
                          {b.presencial && <span className="sala-bid-tag pres" style={{marginLeft:4}}>PRES</span>}
                        </div>
                        <div>
                          <div className="sala-bid-amount-sm" style={i===0?{color:"var(--ac)"}:{}}>{fmt(b.amount)}</div>
                          <div className="sala-bid-time">{b.time}</div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Ctrl tabs */}
              <div className="ctrl-tabs" style={{marginBottom:".75rem"}}>
                {[["control","Control Martillero"],["postor","Vista Postor"]].map(([k,l]) => (
                  <button key={k} className={`ctrl-tab${ctrlTab===k?" on":""}`} onClick={()=>setCtrlTab(k)}>{l}</button>
                ))}
              </div>

              {/* ── Control Martillero ── */}
              {ctrlTab==="control" && (
                <div style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
                  <div>
                    <div style={{fontSize:".6rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".28rem"}}>Lote activo</div>
                    <select className="asel" style={{marginBottom:0}} value={idx} onChange={e=>{setIdx(Number(e.target.value));resetAuction();setCurInc(lots[Number(e.target.value)]?.inc||500000);}}>
                      {lots.map((it,i) => <option key={i} value={i}>Lote {String(i+1).padStart(2,"0")} — {it.name}</option>)}
                    </select>
                  </div>
                  <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:10,padding:".6rem .7rem"}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:".5rem",marginBottom:".4rem"}}>
                      <span style={{fontSize:".6rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em"}}>Incremento</span>
                      <span style={{fontSize:"1.15rem",fontWeight:800,color:"var(--ac)"}}>{fmtS(curInc)}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".2rem",marginBottom:".35rem"}}>
                      {INC_OPTIONS.map(v => (
                        <button key={v} className={`inc-btn${curInc===v?" on":""}`} onClick={()=>setCurInc(v)}>{fmtS(v)}</button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:".3rem"}}>
                      <input
                        placeholder="Personalizado..."
                        value={customMonto}
                        onChange={e=>setCustomMonto(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter"&&customMonto){ const n=parseInt(customMonto.replace(/\D/g,"")); if(n>0){setCurInc(n);setCustomMonto("");} } }}
                        style={{flex:1,padding:".28rem .5rem",background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".7rem",fontFamily:"Inter,sans-serif"}}
                      />
                      <button onClick={()=>{ const n=parseInt((customMonto||"").replace(/\D/g,"")); if(n>0){setCurInc(n);setCustomMonto("");} }}
                        style={{padding:".28rem .6rem",background:"var(--ac)",border:"none",borderRadius:6,color:"#fff",fontSize:".67rem",fontWeight:700,cursor:"pointer"}}>
                        Usar
                      </button>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:".25rem"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".25rem"}}>
                      <button className="ab g" onClick={startAuction} disabled={aState==="live"}>▶ Iniciar</button>
                      <button className="ab y" onClick={pauseAuction} disabled={aState!=="live"}>⏸ Pausar</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:".25rem"}}>
                      <button className="ab" style={{background:"rgba(167,139,250,.08)",color:"#a78bfa",border:"1px solid rgba(167,139,250,.2)",fontSize:".68rem"}} onClick={repetirLote}>↺ Repetir</button>
                      <button className="ab" style={{background:"transparent",color:"var(--mu2)",border:"1px solid var(--b2)",fontSize:".68rem"}} onClick={pasarLote} disabled={idx>=lots.length-1}>→ Pasar</button>
                      <button className="ab r" style={{fontSize:".68rem"}} onClick={resetAuction}>⟳ Reset</button>
                    </div>
                  </div>
                  <div style={{padding:".5rem .65rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:8}}>
                    <div style={{fontSize:".6rem",fontWeight:700,color:"var(--yl)",marginBottom:".3rem",display:"flex",alignItems:"center",gap:".3rem"}}>
                      <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v4M7 10v.5"/></svg>
                      Postura presencial
                    </div>
                    <div style={{display:"flex",gap:".3rem"}}>
                      <input placeholder="Paleta" value={presPaleta} onChange={e=>setPresPaleta(e.target.value)}
                        style={{width:58,padding:".28rem .4rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}/>
                      <input placeholder="Monto" value={presMonto} onChange={e=>setPresMonto(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&registrarPresencial()}
                        style={{flex:1,padding:".28rem .4rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}/>
                      <button onClick={registrarPresencial}
                        style={{padding:".28rem .55rem",background:"rgba(246,173,85,.2)",border:"1px solid rgba(246,173,85,.4)",borderRadius:6,color:"var(--yl)",fontSize:".75rem",fontWeight:700,cursor:"pointer"}}>
                        ✓
                      </button>
                    </div>
                  </div>
                  {aState!=="live" && (
                    <button className="sala-place-bid-btn" onClick={startAuction} disabled={aState==="sold"}>
                      {aState==="sold" ? "✓ Lote adjudicado" : "▶ Iniciar subasta"}
                    </button>
                  )}
                  {aState==="live" && (
                    adjSinPujas && bids[idx]?.count===0
                      ? <div style={{display:"flex",gap:".4rem",alignItems:"center",flexWrap:"wrap"}}>
                          <span style={{fontSize:".65rem",color:"var(--yl)",flex:1}}>Sin pujas. ¿Adjudicar igual?</span>
                          <button onClick={()=>adjudicar()} style={{padding:".3rem .65rem",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",borderRadius:6,color:"var(--yl)",fontSize:".68rem",cursor:"pointer",fontWeight:700}}>Sí</button>
                          <button onClick={()=>setAdjSinPujas(false)} style={{padding:".3rem .65rem",background:"transparent",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,color:"var(--mu)",fontSize:".68rem",cursor:"pointer"}}>No</button>
                        </div>
                      : <button onClick={()=>adjudicar()}
                          style={{width:"100%",padding:".4rem",background:"transparent",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"var(--mu)",fontSize:".68rem",cursor:"pointer",letterSpacing:".03em"}}>
                          Adjudicar manualmente
                        </button>
                  )}
                  {bidTimer!==null&&bidTimer>0&&aState==="live" && (
                    <div className={`bid-ticker${bidTimer<=5?" urgent":""}${bidTimer<=2?" critical":""}`}>
                      <div className="bt-num" style={{color:bidTimer>8?"var(--gr)":bidTimer>4?"var(--yl)":"var(--rd)",fontSize:bidTimer<=3?"1.7rem":"1.35rem"}}>{bidTimer}</div>
                      <div>
                        <div className="bt-info">{bidTimer<=2?"¡ADJUDICANDO AHORA!":bidTimer<=5?"Última oportunidad":"Adjudica en"}</div>
                        <div className="bt-leader">{lastBidder||"—"} lidera · {fmt((bids[idx]?.current||0))}</div>
                      </div>
                    </div>
                  )}
                  {adjCountdown && (
                    <div style={{background:"rgba(20,184,166,.07)",border:"1px solid rgba(20,184,166,.35)",borderRadius:10,padding:".7rem .85rem",display:"flex",flexDirection:"column",gap:".45rem"}}>
                      <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="var(--gr)" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="var(--gr)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div style={{fontSize:".73rem",fontWeight:700,color:"var(--gr)"}}>Lote adjudicado correctamente</div>
                      </div>
                      <div style={{display:"flex",gap:".4rem"}}>
                        <button onClick={avanzarSiguienteLote} disabled={idx>=lots.length-1}
                          style={{flex:1,padding:".48rem",background:"var(--gr)",border:"none",borderRadius:7,color:"#fff",fontSize:".76rem",fontWeight:700,cursor:"pointer",opacity:idx>=lots.length-1?.4:1}}>
                          Siguiente lote →
                        </button>
                        <button onClick={revertirAdjudicacion}
                          style={{padding:".48rem .7rem",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"#f87171",fontSize:".73rem",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                          ↩ Revertir
                        </button>
                      </div>
                      {idx>=lots.length-1 && <div style={{fontSize:".63rem",color:"var(--mu)",textAlign:"center"}}>Último lote — remate finalizado</div>}
                    </div>
                  )}
                </div>
              )}

              {/* ── Vista Postor ── */}
              {ctrlTab==="postor" && (
                <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                  <div style={{textAlign:"center",padding:"1rem .5rem .5rem"}}>
                    <div style={{fontSize:".6rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:".4rem"}}>Oferta actual</div>
                    <div className={`bap${flash?" flash":""}`} style={{fontSize:"2.8rem",lineHeight:1}}>{fmt(bid.current)}</div>
                    {aState==="live" && (
                      <div style={{fontSize:".75rem",color:"var(--mu)",marginTop:".4rem"}}>
                        Siguiente: <strong style={{color:"var(--wh)"}}>{fmt(bid.current+curInc)}</strong>
                      </div>
                    )}
                  </div>
                  {aState==="live"&&bidTimer!==null&&bidTimer>0 &&
                    <BidRing seconds={bidTimer} total={bidTimerVal} nextAmount={bid.current+curInc} increment={curInc}/>
                  }
                  {aState==="live" && iAmWinning && (
                    <button className="sala-place-bid-btn" disabled
                      style={{background:"rgba(20,184,166,.15)",color:"var(--gr)",border:"1px solid rgba(20,184,166,.35)",fontSize:"1rem",padding:"1rem",cursor:"default"}}>
                      ✓ Vas ganando
                    </button>
                  )}
                  {aState==="live" && lastBidder!==null && !iAmWinning && (<>
                    <div style={{textAlign:"center",fontSize:".72rem",color:"var(--rd)",fontWeight:600}}>
                      Te superaron — puja para recuperar el lote
                    </div>
                    <button className="sala-place-bid-btn" onClick={()=>placeBid()}
                      style={{fontSize:"1.05rem",padding:"1rem",letterSpacing:".01em"}}>
                      Pujar {fmt(bid.current+curInc)}
                    </button>
                  </>)}
                  {aState==="live" && lastBidder===null && (
                    <button className="sala-place-bid-btn" onClick={()=>placeBid()}
                      style={{fontSize:"1.05rem",padding:"1rem",letterSpacing:".01em"}}>
                      Pujar {fmt(bid.current+curInc)}
                    </button>
                  )}
                  {aState==="waiting" && <button className="sala-place-bid-btn" disabled style={{padding:"1rem",fontSize:".95rem"}}>Esperando inicio...</button>}
                  {aState==="paused"  && <button className="sala-place-bid-btn" disabled style={{padding:"1rem",fontSize:".95rem"}}>Pausado</button>}
                  {aState==="sold"    && <button className="sala-place-bid-btn adj" disabled style={{padding:"1rem",fontSize:".95rem"}}>✓ Adjudicado</button>}
                </div>
              )}

            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
