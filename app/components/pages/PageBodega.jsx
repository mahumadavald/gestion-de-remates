'use client'
import React, { useState, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════════
   PageBodega — vista tablet para recepción de bienes
   Rol: "bodega" — solo ve causas en estado "acta_recibida"
   Flujo: seleccionar causa → info bienes → firma deudor → confirmar
══════════════════════════════════════════════════════════════════ */

function fmt(d) {
  if (!d) return "—";
  const [y,m,day] = d.slice(0,10).split("-").map(Number);
  return new Date(y,m-1,day).toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
}
function fmtDT(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-CL",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

/* ── Canvas firma ─────────────────────────────────────────────── */
function FirmaCanvas({ onFirma, firmaData }) {
  const canvasRef = useRef();
  const drawing   = useRef(false);
  const lastPos   = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      const t = e.touches[0];
      return { x:(t.clientX-rect.left)*scaleX, y:(t.clientY-rect.top)*scaleY };
    }
    return { x:(e.clientX-rect.left)*scaleX, y:(e.clientY-rect.top)*scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI*2); ctx.fillStyle="#1a1a1a"; ctx.fill();
  };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = (e) => {
    e?.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    onFirma(canvasRef.current.toDataURL("image/png"));
  };

  const limpiar = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onFirma(null);
  };

  return (
    <div style={{ width:"100%" }}>
      <div style={{ border:"2px solid #e5e7eb", borderRadius:12, background:"#fff", overflow:"hidden", touchAction:"none", position:"relative" }}>
        <canvas ref={canvasRef} width={700} height={220}
          style={{ display:"block", width:"100%", height:"auto", cursor:"crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        {!firmaData && (
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", color:"#d1d5db", fontSize:"1rem", pointerEvents:"none", whiteSpace:"nowrap" }}>
            Firmar aquí
          </div>
        )}
      </div>
      <button onClick={limpiar}
        style={{ marginTop:".5rem", background:"none", border:"1px solid #e5e7eb", borderRadius:7, padding:".3rem .8rem", fontSize:".75rem", color:"#6b7280", cursor:"pointer" }}>
        Borrar firma
      </button>
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════════ */
export default function PageBodega({ session, supabase, onLogout }) {
  const [causasPendientes, setCausasPendientes] = useState([]);
  const [causasEnBodega,   setCausasEnBodega]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("pendientes"); // pendientes | en_bodega
  const [selected, setSelected]     = useState(null);
  const [step, setStep]             = useState("lista"); // lista | recepcion | confirmado
  const [nombreDeudor, setNombreDeudor] = useState("");
  const [rutDeudor, setRutDeudor]   = useState("");
  const [firma, setFirma]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const bodegaId = session?.bodegaId || null;

  const loadCausas = async () => {
    setLoading(true);
    // Pendientes: acta_recibida o aceptada (sin bodega aún asignada o de esta bodega)
    const qPend = supabase.from("causas").select("*").in("estado",["acta_recibida","aceptada"]).order("created_at",{ascending:true});
    if (session?.casaId) qPend.eq("casa_id", session.casaId);
    // En bodega: bienes recepcionados en ESTA bodega
    const qBodega = supabase.from("causas").select("*")
      .in("estado",["bienes_recepcionados","bases_enviadas","publicaciones_ok","fecha_aprobada","en_remate","completada"])
      .order("firma_deudor_fecha",{ascending:false});
    if (bodegaId) qBodega.eq("bodega_id", bodegaId);
    else if (session?.casaId) qBodega.eq("casa_id", session.casaId);
    const [{ data: pend }, { data: enBodega }] = await Promise.all([qPend, qBodega]);
    setCausasPendientes(pend||[]);
    setCausasEnBodega(enBodega||[]);
    setLoading(false);
  };

  useEffect(() => { loadCausas(); }, []);

  const causa = selected ? causasPendientes.find(c=>c.id===selected) : null;

  const confirmarRecepcion = async () => {
    if (!causa) return;
    if (!nombreDeudor.trim()) { alert("Por favor ingresá el nombre del deudor."); return; }
    if (!firma) { alert("El deudor debe firmar antes de confirmar."); return; }
    setSaving(true);

    // Subir firma a Storage
    let firmaUrl = null;
    try {
      const blob    = await fetch(firma).then(r=>r.blob());
      const path    = `causas/${causa.id}_firma_${Date.now()}.png`;
      const { error:upErr } = await supabase.storage.from("firmas").upload(path, blob, { contentType:"image/png", upsert:true });
      if (!upErr) {
        const { data:urlData } = supabase.storage.from("firmas").getPublicUrl(path);
        firmaUrl = urlData.publicUrl;
      }
    } catch(e) { console.warn("Error subiendo firma:", e.message); }

    // Actualizar causa — incluye bodega_id del usuario bodeguero
    const fechaHora = new Date().toISOString();
    const { data:updated, error } = await supabase.from("causas")
      .update({
        estado:               "bienes_recepcionados",
        acta_recepcion_ok:    true,
        fecha_recepcion_bienes: fechaHora.slice(0,10),
        firma_deudor_url:     firmaUrl,
        firma_deudor_nombre:  nombreDeudor.trim(),
        firma_deudor_rut:     rutDeudor.trim()||null,
        firma_deudor_fecha:   fechaHora,
        bodega_id:            bodegaId || null,
        updated_at:           fechaHora,
      })
      .eq("id", causa.id)
      .select().single();

    if (error) { setSaving(false); alert("Error: "+error.message); return; }

    // Email a todos los martilleros de la casa
    try {
      const { data:martilleros } = await supabase.from("usuarios")
        .select("email,roles")
        .eq("casa_id", session?.casaId)
        .eq("activo", true);
      const emails = (martilleros||[])
        .filter(u=>Array.isArray(u.roles)&&u.roles.includes("martillero"))
        .map(u=>u.email)
        .filter(Boolean);
      await Promise.all(emails.map(email=>
        fetch("/api/send-email", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            tipo:             "recepcion_causa",
            email_victor:     email,
            rol:              causa.rol,
            empresa_deudora:  causa.empresa_deudora,
            bienes:           causa.bienes_descripcion,
            nombre_deudor:    nombreDeudor.trim(),
            rut_deudor:       rutDeudor.trim()||null,
            fecha_hora:       fechaHora,
            bodega_nombre:    session?.bodegaNombre || session?.bodega || null,
          }),
        })
      ));
    } catch(e) { console.warn("Email no enviado:", e.message); }

    setCausasPendientes(prev=>prev.filter(c=>c.id!==causa.id));
    if (updated) setCausasEnBodega(prev=>[updated,...prev]);
    setSaving(false);
    setStep("confirmado");
    setTab("en_bodega"); // mostrar tab de bienes en bodega al terminar
  };

  const bodegaNombre = session?.bodegaNombre || session?.bodega || "esta bodega";

  /* ── LISTA ────────────────────────────────────────────────────── */
  if (step==="lista" || step==="confirmado") return (
    <div style={{ minHeight:"100dvh", background:"#f0f4f8", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f4c5c,#0891b2)", padding:"1.2rem 1.5rem", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", opacity:.75 }}>Bodega — Recepción de bienes</div>
            <div style={{ fontSize:"1.2rem", fontWeight:800, marginTop:".1rem" }}>{bodegaNombre}</div>
          </div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:8, padding:".4rem .9rem", color:"#fff", fontSize:".73rem", cursor:"pointer", fontWeight:700 }}>
            Salir
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:".4rem", marginTop:".8rem" }}>
          {[["pendientes",`Por recibir (${causasPendientes.length})`],["en_bodega",`En bodega (${causasEnBodega.length})`]].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{ padding:".35rem .85rem", borderRadius:20, border:"none", cursor:"pointer", fontSize:".73rem", fontWeight:700,
                background: tab===t?"rgba(255,255,255,.25)":"rgba(255,255,255,.1)", color:"#fff" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmado banner */}
      {step==="confirmado" && (
        <div style={{ background:"#f0fdf4", borderBottom:"1px solid #a7f3d0", padding:"1rem 1.5rem", display:"flex", alignItems:"center", gap:".6rem" }}>
          <span style={{ fontSize:"1.3rem" }}>✅</span>
          <div>
            <div style={{ fontWeight:800, color:"#065f46", fontSize:".9rem" }}>Recepción registrada</div>
            <div style={{ fontSize:".74rem", color:"#047857" }}>Se notificó al martillero. Podés recibir la próxima causa.</div>
          </div>
          <button onClick={()=>setStep("lista")} style={{ marginLeft:"auto", background:"#10b981", border:"none", borderRadius:7, padding:".35rem .8rem", color:"#fff", fontWeight:700, fontSize:".74rem", cursor:"pointer" }}>
            OK
          </button>
        </div>
      )}

      {/* Lista */}
      <div style={{ flex:1, padding:"1rem", display:"flex", flexDirection:"column", gap:".75rem" }}>
        {loading && <div style={{ textAlign:"center", color:"#6b7280", padding:"3rem", fontSize:".85rem" }}>Cargando…</div>}
        {!loading && causas.length===0 && (
          <div style={{ textAlign:"center", padding:"4rem 2rem", color:"#6b7280" }}>
            <div style={{ fontSize:"3rem", marginBottom:".5rem" }}>🏭</div>
            <div style={{ fontSize:"1rem", fontWeight:700, marginBottom:".3rem" }}>Sin causas pendientes</div>
            <div style={{ fontSize:".78rem" }}>No hay bienes por recepcionar en este momento.</div>
          </div>
        )}
        {/* Tab: Por recibir */}
        {tab==="pendientes" && causasPendientes.map(c=>(
          <div key={c.id} onClick={()=>{ setSelected(c.id); setNombreDeudor(""); setRutDeudor(""); setFirma(null); setStep("recepcion"); }}
            style={{ background:"#fff", borderRadius:14, padding:"1.1rem 1.3rem", boxShadow:"0 2px 8px rgba(0,0,0,.08)", cursor:"pointer", border:"1.5px solid #e5e7eb" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:".6rem", marginBottom:".4rem" }}>
              <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:"1rem", color:"#1a1a1a" }}>{c.rol}</span>
              <span style={{ marginLeft:"auto", fontSize:".65rem", background:"#f5f3ff", color:"#7c3aed", border:"1px solid #ddd6fe", borderRadius:10, padding:".1rem .5rem", fontWeight:700 }}>{c.tipo}</span>
            </div>
            <div style={{ fontSize:".85rem", fontWeight:700, color:"#374151", marginBottom:".25rem" }}>{c.empresa_deudora||"Sin empresa"}</div>
            {c.liquidador && <div style={{ fontSize:".73rem", color:"#6b7280", marginBottom:".25rem" }}>Liquidador: {c.liquidador}</div>}
            {c.bienes_descripcion && (
              <div style={{ fontSize:".72rem", color:"#6b7280", background:"#f9fafb", borderRadius:7, padding:".4rem .6rem", marginTop:".35rem", lineHeight:1.5 }}>
                {c.bienes_descripcion.slice(0,120)}{c.bienes_descripcion.length>120?"…":""}
              </div>
            )}
            <div style={{ marginTop:".6rem", display:"flex", justifyContent:"flex-end" }}>
              <span style={{ fontSize:".75rem", fontWeight:700, color:"#0891b2" }}>Iniciar recepción →</span>
            </div>
          </div>
        ))}

        {/* Tab: En bodega */}
        {tab==="en_bodega" && causasEnBodega.length===0 && (
          <div style={{ textAlign:"center", padding:"4rem 2rem", color:"#6b7280" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:".5rem" }}>📦</div>
            <div style={{ fontSize:"1rem", fontWeight:700 }}>Sin bienes registrados aún</div>
          </div>
        )}
        {tab==="en_bodega" && causasEnBodega.map(c=>(
          <div key={c.id} style={{ background:"#fff", borderRadius:14, padding:"1.1rem 1.3rem", boxShadow:"0 2px 8px rgba(0,0,0,.07)", border:"1.5px solid #a7f3d0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".55rem", marginBottom:".35rem" }}>
              <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:".95rem", color:"#1a1a1a" }}>{c.rol}</span>
              <span style={{ fontSize:".63rem", background:"#f0fdf4", color:"#059669", border:"1px solid #a7f3d0", borderRadius:10, padding:".1rem .5rem", fontWeight:700 }}>✓ Recepcionado</span>
              <span style={{ marginLeft:"auto", fontSize:".63rem", color:"#6b7280" }}>{fmtDT(c.firma_deudor_fecha)}</span>
            </div>
            <div style={{ fontSize:".82rem", fontWeight:700, color:"#374151", marginBottom:".2rem" }}>{c.empresa_deudora||"—"}</div>
            {c.bienes_descripcion && (
              <div style={{ fontSize:".71rem", color:"#6b7280", background:"#f9fafb", borderRadius:7, padding:".35rem .6rem", marginTop:".3rem", lineHeight:1.5 }}>
                {c.bienes_descripcion.slice(0,100)}{c.bienes_descripcion.length>100?"…":""}
              </div>
            )}
            {c.firma_deudor_nombre && (
              <div style={{ marginTop:".35rem", fontSize:".68rem", color:"#6b7280" }}>
                Entregado por: <strong>{c.firma_deudor_nombre}</strong>{c.firma_deudor_rut&&` (${c.firma_deudor_rut})`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* ── PANTALLA RECEPCIÓN (firma) ───────────────────────────────── */
  if (step==="recepcion" && causa) return (
    <div style={{ minHeight:"100dvh", background:"#f0f4f8", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f4c5c,#0891b2)", padding:"1.1rem 1.4rem", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".7rem" }}>
          <button onClick={()=>setStep("lista")} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:8, padding:".4rem .75rem", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:".8rem" }}>
            ← Volver
          </button>
          <div>
            <div style={{ fontSize:".62rem", opacity:.75, textTransform:"uppercase", letterSpacing:".08em" }}>Recepción de bienes</div>
            <div style={{ fontSize:"1rem", fontWeight:800 }}>{causa.rol}</div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, padding:"1rem", display:"flex", flexDirection:"column", gap:"1rem", maxWidth:700, margin:"0 auto", width:"100%" }}>

        {/* Info bienes */}
        <div style={{ background:"#fff", borderRadius:14, padding:"1.2rem 1.3rem", boxShadow:"0 2px 8px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:".62rem", fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em", marginBottom:".6rem" }}>Bienes a recepcionar</div>
          <div style={{ fontSize:".95rem", fontWeight:800, color:"#1a1a1a", marginBottom:".3rem" }}>{causa.empresa_deudora||"—"}</div>
          {causa.liquidador && <div style={{ fontSize:".76rem", color:"#6b7280", marginBottom:".3rem" }}>Liquidador: {causa.liquidador}</div>}
          {causa.bienes_descripcion && (
            <div style={{ fontSize:".8rem", color:"#374151", background:"#f9fafb", borderRadius:8, padding:".65rem .8rem", lineHeight:1.6, marginTop:".4rem" }}>
              {causa.bienes_descripcion}
            </div>
          )}
          {causa.minimo && (
            <div style={{ marginTop:".5rem", fontSize:".74rem", color:"#6b7280" }}>Mínimo: <strong style={{ fontFamily:"monospace" }}>{causa.minimo}</strong></div>
          )}
        </div>

        {/* Datos del deudor */}
        <div style={{ background:"#fff", borderRadius:14, padding:"1.2rem 1.3rem", boxShadow:"0 2px 8px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:".62rem", fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em", marginBottom:".75rem" }}>Datos de quien entrega</div>
          <div style={{ marginBottom:".7rem" }}>
            <label style={{ display:"block", fontSize:".72rem", fontWeight:700, color:"#374151", marginBottom:".3rem" }}>Nombre completo *</label>
            <input value={nombreDeudor} onChange={e=>setNombreDeudor(e.target.value)}
              placeholder="Nombre de quien entrega los bienes"
              style={{ width:"100%", fontSize:".9rem", padding:".6rem .75rem", border:"1.5px solid #e5e7eb", borderRadius:9, color:"#1a1a1a", background:"#fff", boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ display:"block", fontSize:".72rem", fontWeight:700, color:"#374151", marginBottom:".3rem" }}>RUT (opcional)</label>
            <input value={rutDeudor} onChange={e=>setRutDeudor(e.target.value)}
              placeholder="12.345.678-9"
              style={{ width:"100%", fontSize:".9rem", padding:".6rem .75rem", border:"1.5px solid #e5e7eb", borderRadius:9, color:"#1a1a1a", background:"#fff", boxSizing:"border-box" }}/>
          </div>
        </div>

        {/* Firma */}
        <div style={{ background:"#fff", borderRadius:14, padding:"1.2rem 1.3rem", boxShadow:"0 2px 8px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:".62rem", fontWeight:800, color:"#6b7280", textTransform:"uppercase", letterSpacing:".08em", marginBottom:".75rem" }}>
            Firma del deudor *
          </div>
          <div style={{ fontSize:".76rem", color:"#6b7280", marginBottom:".8rem" }}>
            El deudor debe firmar en el recuadro de abajo para confirmar la entrega de los bienes.
          </div>
          <FirmaCanvas onFirma={setFirma} firmaData={firma}/>
          {firma && (
            <div style={{ marginTop:".5rem", display:"flex", alignItems:"center", gap:".4rem" }}>
              <span style={{ fontSize:".72rem", color:"#10b981", fontWeight:700 }}>✓ Firma registrada</span>
            </div>
          )}
        </div>

        {/* Fecha/hora auto */}
        <div style={{ background:"#f0fdf4", border:"1px solid #a7f3d0", borderRadius:12, padding:".85rem 1.1rem", display:"flex", alignItems:"center", gap:".6rem" }}>
          <span style={{ fontSize:"1.1rem" }}>📅</span>
          <div>
            <div style={{ fontSize:".71rem", fontWeight:700, color:"#065f46" }}>Fecha y hora de recepción</div>
            <div style={{ fontSize:".8rem", color:"#047857", fontWeight:600 }}>{fmtDT(new Date().toISOString())}</div>
          </div>
          <div style={{ marginLeft:"auto", fontSize:".64rem", color:"#047857" }}>Se registra automáticamente</div>
        </div>

        {/* Botón confirmar */}
        <button onClick={confirmarRecepcion} disabled={saving||!nombreDeudor.trim()||!firma}
          style={{ width:"100%", padding:"1.1rem", background: (!nombreDeudor.trim()||!firma||saving)?"#d1fae5":"#10b981",
            border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:"1.05rem", cursor: (!nombreDeudor.trim()||!firma||saving)?"not-allowed":"pointer",
            boxShadow:"0 4px 12px rgba(16,185,129,.3)", transition:"background .2s" }}>
          {saving ? "Registrando…" : "✓ Confirmar recepción"}
        </button>

        <div style={{ height:"1rem" }}/>
      </div>
    </div>
  );

  return null;
}
