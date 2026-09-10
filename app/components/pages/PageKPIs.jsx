'use client'
import React, { useState, useMemo } from "react";

const fmtCLP = n => n != null && n > 0 ? "$" + Math.round(n).toLocaleString("es-CL") : "$0";
const pct    = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function KCard({ label, value, sub, color = "var(--ac)", big = false }) {
  return (
    <div style={{
      background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12,
      padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: ".25rem",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</div>
      <div style={{ fontSize: big ? "1.45rem" : "1.1rem", fontWeight: 800, color: "var(--wh)", fontFamily: "'Inter', monospace", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: ".68rem", color: "var(--mu2)" }}>{sub}</div>}
    </div>
  );
}

function PctBar({ label, value, max = 100, color = "var(--ac)" }) {
  const w = Math.min(100, Math.round((value / (max || 1)) * 100));
  return (
    <div style={{ marginBottom: ".6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".2rem" }}>
        <span style={{ fontSize: ".72rem", color: "var(--mu2)" }}>{label}</span>
        <span style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--wh2)" }}>{fmtCLP(value)}</span>
      </div>
      <div style={{ height: 6, background: "var(--b1)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
      </div>
    </div>
  );
}

function DeltaBadge({ current, prev }) {
  if (!prev || prev === 0) return null;
  const diff = current - prev;
  const pctDiff = Math.round((diff / prev) * 100);
  const up = diff >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: ".2rem",
      fontSize: ".65rem", fontWeight: 700, padding: ".1rem .4rem", borderRadius: 5,
      background: up ? "rgba(20,184,166,.12)" : "rgba(239,68,68,.1)",
      color: up ? "var(--gr)" : "var(--rd)",
    }}>
      {up ? "▲" : "▼"} {Math.abs(pctDiff)}%
    </span>
  );
}

// ── Tab: Por Remate ───────────────────────────────────────────────────────────
function TabRemate({ liquidaciones, dbLotes, dbPostores, dbRemates }) {
  const remates = useMemo(() =>
    dbRemates.filter(r => r.estado === "cerrado").sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
    [dbRemates]
  );

  const [selId, setSelId] = useState(remates[0]?.id || "");

  const kpis = useMemo(() => {
    if (!selId) return null;

    const liqs  = liquidaciones.filter(l => (l.remateId || l.remate_id) === selId);
    const lotes  = dbLotes.filter(l => l.remate_id === selId);
    const post   = dbPostores.filter(p => p.remate_id === selId);

    if (liqs.length === 0 && lotes.length === 0) return null;

    const totalMartillo  = liqs.reduce((s, l) => s + (l.monto || 0), 0);
    const totalCom       = liqs.reduce((s, l) => s + (l.com || l.comision || 0), 0);
    const totalGAdm      = liqs.reduce((s, l) => s + (l.gastosAdm || l.gastos_adm || 0), 0);
    const totalIva       = liqs.reduce((s, l) => s + (l.ivaAdm || l.iva || 0), 0);
    const ingresoNeto    = totalCom + totalGAdm; // lo que la casa cobra antes de IVA
    const totalComprador = liqs.reduce((s, l) => s + (l.totalAPagar || l.total_a_pagar || 0), 0);

    const lotesVendidos  = liqs.length;
    const lotesTotales   = lotes.length || lotesVendidos;
    const lotesSinVender = Math.max(0, lotesTotales - lotesVendidos);
    const tasaAdj        = pct(lotesVendidos, lotesTotales);

    const montos         = liqs.map(l => l.monto || 0).filter(m => m > 0).sort((a, b) => b - a);
    const precioPromedio = lotesVendidos > 0 ? Math.round(totalMartillo / lotesVendidos) : 0;
    const precioMax      = montos[0] || 0;
    const precioMin      = montos[montos.length - 1] || 0;

    const loteMax        = liqs.find(l => l.monto === precioMax);
    const loteMin        = liqs.find(l => l.monto === precioMin);

    const postoresUnicos = new Set(liqs.map(l => (l.postor || "").toLowerCase().trim())).size;

    const retirados      = liqs.filter(l => l.retiro).length;
    const pctRetiro      = pct(retirados, lotesVendidos);

    const pagados        = post.filter(p => p.pagado).length;
    const pctPago        = post.length > 0 ? pct(pagados, post.length) : null;

    // Top compradores por monto
    const byPostor = {};
    liqs.forEach(l => {
      const k = (l.postor || "Desconocido").trim();
      if (!byPostor[k]) byPostor[k] = { postor: k, monto: 0, lotes: 0 };
      byPostor[k].monto += l.monto || 0;
      byPostor[k].lotes += 1;
    });
    const topCompradores = Object.values(byPostor).sort((a, b) => b.monto - a.monto).slice(0, 5);

    // Categorías
    const byCat = {};
    liqs.forEach(l => {
      const lote = dbLotes.find(lot => lot.nombre === l.lote || lot.id === l.lote_id);
      const cat  = lote?.categoria || "Sin categoría";
      if (!byCat[cat]) byCat[cat] = { cat, monto: 0, lotes: 0 };
      byCat[cat].monto += l.monto || 0;
      byCat[cat].lotes += 1;
    });
    const topCats = Object.values(byCat).sort((a, b) => b.monto - a.monto).slice(0, 5);

    return {
      totalMartillo, totalCom, totalGAdm, totalIva, ingresoNeto, totalComprador,
      lotesVendidos, lotesTotales, lotesSinVender, tasaAdj,
      precioPromedio, precioMax, precioMin, loteMax, loteMin,
      postoresUnicos, retirados, pctRetiro, pagados, pctPago,
      topCompradores, topCats,
    };
  }, [selId, liquidaciones, dbLotes, dbPostores]);

  const remate = dbRemates.find(r => r.id === selId);

  return (
    <div>
      {/* Selector de remate */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: ".35rem" }}>
          Seleccionar remate cerrado
        </label>
        <select
          className="fsel"
          style={{ fontSize: ".82rem", maxWidth: 380 }}
          value={selId}
          onChange={e => setSelId(e.target.value)}
        >
          {remates.length === 0
            ? <option value="">Sin remates cerrados</option>
            : remates.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.fecha ? new Date(r.fecha).toLocaleDateString("es-CL") : "Sin fecha"}
                </option>
              ))
          }
        </select>
      </div>

      {!kpis && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--mu)", fontSize: ".88rem" }}>
          {remates.length === 0
            ? "No hay remates cerrados aún."
            : "Sin datos de liquidaciones para este remate."}
        </div>
      )}

      {kpis && (
        <>
          {/* ── Sección 1: Financiero ── */}
          <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".6rem" }}>
            Resultado financiero
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: ".75rem", marginBottom: "1.5rem" }}>
            <KCard label="Total martillo (base)" value={fmtCLP(kpis.totalMartillo)} color="var(--ac)" big />
            <KCard label="Comisión casa" value={fmtCLP(kpis.totalCom)} sub={`+ $${Math.round(kpis.totalGAdm).toLocaleString("es-CL")} adm`} color="var(--gr)" />
            <KCard label="Ingreso bruto casa" value={fmtCLP(kpis.ingresoNeto)} sub="Com. + Gastos adm." color="#06B6D4" />
            <KCard label="IVA liquidado" value={fmtCLP(kpis.totalIva)} color="#f59e0b" />
            <KCard label="Total a pagar compradores" value={fmtCLP(kpis.totalComprador)} color="#8b5cf6" />
          </div>

          {/* ── Sección 2: Lotes ── */}
          <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".6rem" }}>
            Lotes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: ".75rem", marginBottom: "1.5rem" }}>
            <KCard label="Tasa de adjudicación" value={`${kpis.tasaAdj}%`} sub={`${kpis.lotesVendidos} de ${kpis.lotesTotales} lotes`} color={kpis.tasaAdj >= 80 ? "var(--gr)" : kpis.tasaAdj >= 50 ? "#f59e0b" : "var(--rd)"} big />
            <KCard label="Lotes vendidos" value={kpis.lotesVendidos} color="var(--gr)" />
            <KCard label="Sin vender" value={kpis.lotesSinVender} color={kpis.lotesSinVender > 0 ? "var(--rd)" : "var(--b2)"} />
            <KCard label="Precio promedio" value={fmtCLP(kpis.precioPromedio)} color="var(--ac)" />
            <KCard label="Lote más caro" value={fmtCLP(kpis.precioMax)} sub={kpis.loteMax?.lote || ""} color="#06B6D4" />
            <KCard label="Lote más económico" value={fmtCLP(kpis.precioMin)} sub={kpis.loteMin?.lote || ""} color="var(--mu2)" />
          </div>

          {/* ── Sección 3: Compradores ── */}
          <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".6rem" }}>
            Compradores
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: ".75rem", marginBottom: "1.5rem" }}>
            <KCard label="Compradores únicos" value={kpis.postoresUnicos} color="var(--ac)" />
            <KCard label="Lotes por comprador" value={(kpis.lotesVendidos / (kpis.postoresUnicos || 1)).toFixed(1)} color="#8b5cf6" />
            {kpis.pctPago !== null && <KCard label="% Pagado" value={`${kpis.pctPago}%`} sub={`${kpis.pagados} compradores`} color={kpis.pctPago === 100 ? "var(--gr)" : "#f59e0b"} />}
            <KCard label="% Retirado" value={`${kpis.pctRetiro}%`} sub={`${kpis.retirados} de ${kpis.lotesVendidos}`} color={kpis.pctRetiro === 100 ? "var(--gr)" : "var(--ac)"} />
          </div>

          {/* ── Top compradores + categorías ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: ".5rem" }}>
            {/* Top compradores */}
            <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1rem 1.1rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".85rem" }}>
                Top compradores
              </div>
              {kpis.topCompradores.length === 0
                ? <div style={{ fontSize: ".78rem", color: "var(--mu)" }}>Sin datos</div>
                : kpis.topCompradores.map((c, i) => (
                    <PctBar
                      key={c.postor}
                      label={`${i + 1}. ${c.postor} (${c.lotes} lote${c.lotes !== 1 ? "s" : ""})`}
                      value={c.monto}
                      max={kpis.topCompradores[0].monto}
                      color={["var(--ac)","var(--gr)","#8b5cf6","#f59e0b","var(--mu2)"][i]}
                    />
                  ))
              }
            </div>

            {/* Top categorías */}
            <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1rem 1.1rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".85rem" }}>
                Categorías más vendidas
              </div>
              {kpis.topCats.length === 0
                ? <div style={{ fontSize: ".78rem", color: "var(--mu)" }}>Sin datos</div>
                : kpis.topCats.map((c, i) => (
                    <PctBar
                      key={c.cat}
                      label={`${c.cat} (${c.lotes} lote${c.lotes !== 1 ? "s" : ""})`}
                      value={c.monto}
                      max={kpis.topCats[0].monto}
                      color={["var(--ac)","var(--gr)","#8b5cf6","#f59e0b","var(--mu2)"][i]}
                    />
                  ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Mensual ─────────────────────────────────────────────────────────────
function TabMensual({ liquidaciones, dbLotes, dbRemates }) {
  const now = new Date();
  const [mes,  setMes]  = useState(now.getMonth());
  const [anio, setAnio] = useState(now.getFullYear());

  function parseFecha(l) {
    if (l.fechaISO || l.fecha_iso) return new Date(l.fechaISO || l.fecha_iso);
    if (l.fecha) {
      const p = l.fecha.split(/[\/\-\.]/);
      if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    }
    return new Date();
  }

  function getKPIs(m, a) {
    const liqs = liquidaciones.filter(l => {
      const d = parseFecha(l);
      return d.getMonth() === m && d.getFullYear() === a;
    });

    const rematesDelMes = dbRemates.filter(r => {
      if (!r.fecha) return false;
      const d = new Date(r.fecha);
      return d.getMonth() === m && d.getFullYear() === a;
    });

    const totalMartillo = liqs.reduce((s, l) => s + (l.monto || 0), 0);
    const totalCom      = liqs.reduce((s, l) => s + (l.com || l.comision || 0), 0);
    const totalGAdm     = liqs.reduce((s, l) => s + (l.gastosAdm || l.gastos_adm || 0), 0);
    const ingresoNeto   = totalCom + totalGAdm;
    const nLotes        = liqs.length;
    const nRemates      = rematesDelMes.length;
    const postoresSet   = new Set(liqs.map(l => (l.postor || "").toLowerCase().trim()));
    const nCompradores  = postoresSet.size;
    const precioPromedio = nLotes > 0 ? Math.round(totalMartillo / nLotes) : 0;

    // Lotes totales en remates del mes
    const lotesMesIds = new Set(rematesDelMes.map(r => r.id));
    const lotesTotales = dbLotes.filter(l => lotesMesIds.has(l.remate_id)).length;
    const tasaAdj = pct(nLotes, lotesTotales);

    // Top compradores del mes
    const byPostor = {};
    liqs.forEach(l => {
      const k = (l.postor || "Desconocido").trim();
      if (!byPostor[k]) byPostor[k] = { postor: k, monto: 0, lotes: 0 };
      byPostor[k].monto += l.monto || 0;
      byPostor[k].lotes += 1;
    });
    const topCompradores = Object.values(byPostor).sort((a, b) => b.monto - a.monto).slice(0, 5);

    // Mejor remate del mes
    const rematesConRecaudado = rematesDelMes.map(r => {
      const rec = liquidaciones.filter(l => (l.remateId || l.remate_id) === r.id).reduce((s, l) => s + (l.monto || 0), 0);
      return { ...r, recaudado: rec };
    }).sort((a, b) => b.recaudado - a.recaudado);
    const mejorRemate = rematesConRecaudado[0] || null;

    return { totalMartillo, totalCom, totalGAdm, ingresoNeto, nLotes, nRemates, nCompradores, precioPromedio, lotesTotales, tasaAdj, topCompradores, mejorRemate };
  }

  const kpis    = useMemo(() => getKPIs(mes, anio),    [mes, anio, liquidaciones, dbLotes, dbRemates]);
  const kpisPrev = useMemo(() => {
    const pm = mes === 0 ? 11 : mes - 1;
    const pa = mes === 0 ? anio - 1 : anio;
    return getKPIs(pm, pa);
  }, [mes, anio, liquidaciones, dbLotes, dbRemates]);

  return (
    <div>
      {/* Selector mes/año */}
      <div style={{ display: "flex", gap: ".6rem", marginBottom: "1.25rem", alignItems: "center" }}>
        <select className="fsel" style={{ fontSize: ".82rem", width: "auto" }} value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select className="fsel" style={{ fontSize: ".82rem", width: "auto" }} value={anio} onChange={e => setAnio(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize: ".7rem", color: "var(--mu)", marginLeft: ".25rem" }}>
          vs. {MESES[mes === 0 ? 11 : mes - 1]} {mes === 0 ? anio - 1 : anio}
        </span>
      </div>

      {kpis.nLotes === 0 && kpis.nRemates === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--mu)", fontSize: ".88rem" }}>
          Sin datos para {MESES[mes]} {anio}.
        </div>
      ) : (
        <>
          {/* ── KPIs financieros ── */}
          <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".6rem" }}>
            Resultado del mes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: ".75rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1rem 1.1rem", borderTop: "3px solid var(--ac)" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>Total martillo</div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--wh)", lineHeight: 1.1, margin: ".25rem 0 .15rem" }}>{fmtCLP(kpis.totalMartillo)}</div>
              <DeltaBadge current={kpis.totalMartillo} prev={kpisPrev.totalMartillo} />
            </div>
            <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1rem 1.1rem", borderTop: "3px solid var(--gr)" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>Ingreso casa</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--wh)", lineHeight: 1.1, margin: ".25rem 0 .15rem" }}>{fmtCLP(kpis.ingresoNeto)}</div>
              <DeltaBadge current={kpis.ingresoNeto} prev={kpisPrev.ingresoNeto} />
            </div>
            <KCard label="Remates realizados" value={kpis.nRemates} sub={kpis.nRemates === 0 ? "Sin remates" : `${kpis.nLotes} lotes adjudicados`} color="var(--ac)" />
            <KCard label="Tasa adjudicación" value={`${kpis.tasaAdj}%`} sub={`${kpis.nLotes}/${kpis.lotesTotales} lotes`} color={kpis.tasaAdj >= 80 ? "var(--gr)" : "#f59e0b"} />
            <KCard label="Compradores únicos" value={kpis.nCompradores} color="#8b5cf6" />
            <KCard label="Precio promedio lote" value={fmtCLP(kpis.precioPromedio)} color="var(--ac)" />
          </div>

          {/* ── Mejor remate + Top compradores ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Mejor remate */}
            <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1rem 1.1rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".85rem" }}>
                Remates del mes
              </div>
              {kpis.nRemates === 0 ? (
                <div style={{ fontSize: ".78rem", color: "var(--mu)" }}>Sin remates este mes</div>
              ) : (
                dbRemates
                  .filter(r => { if (!r.fecha) return false; const d = new Date(r.fecha); return d.getMonth() === mes && d.getFullYear() === anio; })
                  .map(r => {
                    const rec = liquidaciones.filter(l => (l.remateId || l.remate_id) === r.id).reduce((s, l) => s + (l.monto || 0), 0);
                    const nlotes = liquidaciones.filter(l => (l.remateId || l.remate_id) === r.id).length;
                    return (
                      <div key={r.id} style={{ marginBottom: ".6rem", paddingBottom: ".6rem", borderBottom: "1px solid var(--b1)" }}>
                        <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--wh)", marginBottom: ".1rem" }}>{r.nombre}</div>
                        <div style={{ fontSize: ".68rem", color: "var(--mu2)" }}>
                          {fmtCLP(rec)} martillo · {nlotes} lotes · {new Date(r.fecha).toLocaleDateString("es-CL")}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Top compradores del mes */}
            <div style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 12, padding: "1rem 1.1rem" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".85rem" }}>
                Top compradores del mes
              </div>
              {kpis.topCompradores.length === 0 ? (
                <div style={{ fontSize: ".78rem", color: "var(--mu)" }}>Sin compradores</div>
              ) : (
                kpis.topCompradores.map((c, i) => (
                  <PctBar
                    key={c.postor}
                    label={`${i + 1}. ${c.postor} (${c.lotes} lote${c.lotes !== 1 ? "s" : ""})`}
                    value={c.monto}
                    max={kpis.topCompradores[0].monto}
                    color={["var(--ac)","var(--gr)","#8b5cf6","#f59e0b","var(--mu2)"][i]}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PageKPIs({ session, liquidaciones = [], dbLotes = [], dbPostores = [], dbRemates = [] }) {
  const [tab, setTab] = useState("remate");

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.25rem", padding: ".8rem 1.1rem",
        background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 10,
      }}>
        <div>
          <div style={{ fontSize: ".6rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".2rem" }}>KPIs</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--wh)" }}>Indicadores de rendimiento</div>
        </div>
        <div style={{ display: "flex", border: "1px solid var(--b1)", borderRadius: 7, overflow: "hidden" }}>
          {[["remate", "Por remate"], ["mensual", "Mensual"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: ".35rem .9rem", fontSize: ".73rem", fontWeight: 600, border: "none", cursor: "pointer",
              background: tab === v ? "var(--ac)" : "transparent",
              color: tab === v ? "#fff" : "var(--mu)",
              transition: "all .15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "remate" && (
        <TabRemate
          liquidaciones={liquidaciones}
          dbLotes={dbLotes}
          dbPostores={dbPostores}
          dbRemates={dbRemates}
        />
      )}
      {tab === "mensual" && (
        <TabMensual
          liquidaciones={liquidaciones}
          dbLotes={dbLotes}
          dbRemates={dbRemates}
        />
      )}
    </div>
  );
}
