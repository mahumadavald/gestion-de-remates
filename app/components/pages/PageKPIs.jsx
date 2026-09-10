'use client'
import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid, Legend, RadialBarChart, RadialBar,
} from "recharts";

/* ── helpers ─────────────────────────────────────────────────────────── */
const fmtCLP  = n => n != null && n > 0 ? "$" + Math.round(n).toLocaleString("es-CL") : "$0";
const fmtMill = n => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(Math.round(n));
};
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const PALETTE = ["#06B6D4","#14B8A6","#8b5cf6","#f59e0b","#ef4444","#3b82f6"];

/* ── CSS inline styles ───────────────────────────────────────────────── */
const CARD = {
  background: "var(--s2)",
  border: "1px solid var(--b1)",
  borderRadius: 14,
  padding: "1.1rem 1.25rem",
  position: "relative",
  overflow: "hidden",
};

/* ── Custom Tooltip ──────────────────────────────────────────────────── */
function CTip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div style={{ background: "var(--s3,#1e2533)", border: "1px solid var(--b2)", borderRadius: 8, padding: ".5rem .8rem", fontSize: ".72rem", color: "var(--wh)" }}>
      <div style={{ fontWeight: 700, marginBottom: ".2rem", color: "var(--mu)" }}>{label}</div>
      <div style={{ fontWeight: 800, color: "var(--ac)" }}>{currency !== false ? fmtCLP(v) : v}</div>
    </div>
  );
}

/* ── KPI Hero Card ───────────────────────────────────────────────────── */
function HCard({ label, value, sub, icon, accent = "#06B6D4", prevValue, big }) {
  const hasDelta = prevValue != null && prevValue > 0;
  const diff     = hasDelta ? value - prevValue : 0;
  const pctDiff  = hasDelta ? Math.round((diff / prevValue) * 100) : 0;
  const up       = diff >= 0;
  return (
    <div style={{
      ...CARD,
      borderTop: `3px solid ${accent}`,
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,.18), 0 0 0 1px ${accent}33`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Accent glow */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: accent, opacity: .06, transform: "translate(25px,-25px)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</div>
        {icon && <span style={{ fontSize: "1.1rem", opacity: .5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: big ? "1.65rem" : "1.25rem", fontWeight: 900, color: "var(--wh)", lineHeight: 1.1, margin: ".35rem 0 .25rem", letterSpacing: "-.02em" }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
        {sub && <span style={{ fontSize: ".62rem", color: "var(--mu)" }}>{sub}</span>}
        {hasDelta && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: ".15rem",
            fontSize: ".6rem", fontWeight: 700, padding: ".08rem .35rem", borderRadius: 5,
            background: up ? "rgba(20,184,166,.12)" : "rgba(239,68,68,.1)",
            color: up ? "#14B8A6" : "#ef4444",
          }}>
            {up ? "▲" : "▼"} {Math.abs(pctDiff)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Mini Rank Row (Top compradores / categorías) ─────────────────────── */
function RankRow({ rank, label, value, maxValue, accent }) {
  const w = Math.min(100, Math.round((value / (maxValue || 1)) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".55rem" }}>
      <span style={{ fontSize: ".58rem", fontWeight: 800, color: accent, minWidth: 14, textAlign: "right" }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".18rem" }}>
          <span style={{ fontSize: ".7rem", color: "var(--wh2,var(--wh))", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{label}</span>
          <span style={{ fontSize: ".7rem", fontWeight: 800, color: accent }}>{fmtMill(value)}</span>
        </div>
        <div style={{ height: 4, background: "var(--b1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${w}%`, background: accent, borderRadius: 2, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Radial (gauge) ──────────────────────────────────────────────────── */
function GaugeCard({ label, value, max = 100, accent = "#06B6D4", suffix = "%" }) {
  const data = [{ value, fill: accent }, { value: max - value, fill: "transparent" }];
  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".5rem" }}>{label}</div>
      <div style={{ position: "relative", width: 100, height: 60, overflow: "hidden" }}>
        <PieChart width={100} height={100} style={{ position: "absolute", top: 0, left: 0 }}>
          <Pie data={data} cx={50} cy={50} startAngle={180} endAngle={0} innerRadius={32} outerRadius={45} dataKey="value" strokeWidth={0}>
            {data.map((entry, i) => <Cell key={i} fill={i === 0 ? accent : "var(--b1)"} />)}
          </Pie>
        </PieChart>
        <div style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 900, color: accent }}>{value}{suffix}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB: POR REMATE
═══════════════════════════════════════════════════════════════════════ */
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
    const ingresoNeto    = totalCom + totalGAdm;
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

    const byPostor = {};
    liqs.forEach(l => {
      const k = (l.postor || "Desconocido").trim();
      if (!byPostor[k]) byPostor[k] = { postor: k, monto: 0, lotes: 0 };
      byPostor[k].monto += l.monto || 0;
      byPostor[k].lotes += 1;
    });
    const topCompradores = Object.values(byPostor).sort((a, b) => b.monto - a.monto).slice(0, 5);

    const byCat = {};
    liqs.forEach(l => {
      const lote = dbLotes.find(lot => lot.nombre === l.lote || lot.id === l.lote_id);
      const cat  = lote?.categoria || "Sin categoría";
      if (!byCat[cat]) byCat[cat] = { cat, monto: 0, lotes: 0 };
      byCat[cat].monto += l.monto || 0;
      byCat[cat].lotes += 1;
    });
    const topCats = Object.values(byCat).sort((a, b) => b.monto - a.monto).slice(0, 6);

    // Chart data categorías
    const catsChartData = topCats.map((c, i) => ({ name: c.cat.length > 12 ? c.cat.slice(0, 12) + "…" : c.cat, v: c.monto, fill: PALETTE[i % PALETTE.length] }));

    // Donut data adjudicación
    const donutData = [
      { name: "Vendidos", value: lotesVendidos, fill: "#14B8A6" },
      { name: "Sin vender", value: Math.max(0, lotesSinVender), fill: "var(--b1)" },
    ];

    // Financiero desglose para bar
    const desglose = [
      { name: "Martillo", v: totalMartillo },
      { name: "Comisión", v: totalCom },
      { name: "G.Adm.", v: totalGAdm },
      { name: "IVA", v: totalIva },
      { name: "Tot.Comp.", v: totalComprador },
    ];

    return {
      totalMartillo, totalCom, totalGAdm, totalIva, ingresoNeto, totalComprador,
      lotesVendidos, lotesTotales, lotesSinVender, tasaAdj,
      precioPromedio, precioMax, precioMin, loteMax, loteMin,
      postoresUnicos, retirados, pctRetiro, pagados, pctPago,
      topCompradores, topCats, catsChartData, donutData, desglose,
    };
  }, [selId, liquidaciones, dbLotes, dbPostores]);

  const remate = dbRemates.find(r => r.id === selId);

  return (
    <div>
      {/* ── Remate selector ── */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: ".3rem" }}>
            Remate cerrado
          </label>
          <select className="fsel" style={{ fontSize: ".83rem", maxWidth: 420 }} value={selId} onChange={e => setSelId(e.target.value)}>
            {remates.length === 0
              ? <option value="">Sin remates cerrados</option>
              : remates.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre || r.name} — {r.fecha ? new Date(r.fecha).toLocaleDateString("es-CL") : "Sin fecha"}
                  </option>
                ))
            }
          </select>
        </div>
        {remate && (
          <div style={{ display: "flex", gap: ".5rem" }}>
            <span style={{ fontSize: ".65rem", padding: ".3rem .7rem", borderRadius: 20, background: "rgba(20,184,166,.12)", color: "#14B8A6", fontWeight: 700, border: "1px solid rgba(20,184,166,.25)" }}>
              Cerrado
            </span>
            {remate.fecha && (
              <span style={{ fontSize: ".65rem", padding: ".3rem .7rem", borderRadius: 20, background: "var(--b1)", color: "var(--mu)", fontWeight: 600 }}>
                {new Date(remate.fecha).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        )}
      </div>

      {!kpis && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--mu)", fontSize: ".9rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: .3 }}>📊</div>
          {remates.length === 0 ? "No hay remates cerrados aún." : "Sin datos de liquidaciones para este remate."}
        </div>
      )}

      {kpis && (<>
        {/* ═══ Row 1: 4 hero KPIs ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: ".85rem", marginBottom: "1rem" }}>
          <HCard label="Total martillo" value={fmtCLP(kpis.totalMartillo)} sub="precio hammer" icon="🔨" accent="#06B6D4" big />
          <HCard label="Ingreso bruto casa" value={fmtCLP(kpis.ingresoNeto)} sub="Com. + G. adm." icon="🏛️" accent="#14B8A6" />
          <HCard label="Total a pagar compradores" value={fmtCLP(kpis.totalComprador)} sub="inc. comisiones" icon="💳" accent="#8b5cf6" />
          <HCard label="IVA liquidado" value={fmtCLP(kpis.totalIva)} sub="sobre comisiones" icon="📋" accent="#f59e0b" />
        </div>

        {/* ═══ Row 2: Charts ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: ".85rem", marginBottom: "1rem" }}>
          {/* Bar chart: Categorías */}
          <div style={{ ...CARD }}>
            <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))", marginBottom: ".1rem" }}>Ventas por categoría</div>
            <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".8rem" }}>Monto total martillo por tipo de lote</div>
            {kpis.catsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={kpis.catsChartData} barSize={20} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--mu,#6b7280)", fontFamily: "Inter,sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CTip />} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                    {kpis.catsChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mu)", fontSize: ".75rem" }}>Sin categorías</div>
            )}
          </div>

          {/* Donut: Adjudicación */}
          <div style={{ ...CARD, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: ".4rem" }}>
            <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>Adjudicación</div>
            <div style={{ position: "relative" }}>
              <PieChart width={120} height={120}>
                <Pie data={kpis.donutData} cx={60} cy={60} innerRadius={38} outerRadius={55} dataKey="value" strokeWidth={2} stroke="var(--s2)">
                  {kpis.donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
              </PieChart>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: kpis.tasaAdj >= 80 ? "#14B8A6" : kpis.tasaAdj >= 50 ? "#f59e0b" : "#ef4444" }}>{kpis.tasaAdj}%</div>
                <div style={{ fontSize: ".55rem", color: "var(--mu)", fontWeight: 600 }}>adjudicados</div>
              </div>
            </div>
            <div style={{ fontSize: ".65rem", color: "var(--mu)" }}>
              <span style={{ color: "#14B8A6", fontWeight: 700 }}>{kpis.lotesVendidos}</span> vendidos · <span style={{ color: "#ef4444" }}>{kpis.lotesSinVender}</span> sin vender
            </div>
          </div>

          {/* Stats: compradores */}
          <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: ".6rem", justifyContent: "center" }}>
            <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".2rem" }}>Compradores</div>
            {[
              { label: "Únicos", val: kpis.postoresUnicos, accent: "#06B6D4" },
              { label: "Lotes/comprador", val: (kpis.lotesVendidos / (kpis.postoresUnicos || 1)).toFixed(1), accent: "#8b5cf6" },
              { label: "% Retiro", val: `${kpis.pctRetiro}%`, accent: kpis.pctRetiro === 100 ? "#14B8A6" : "#f59e0b" },
              ...(kpis.pctPago !== null ? [{ label: "% Pagado", val: `${kpis.pctPago}%`, accent: kpis.pctPago === 100 ? "#14B8A6" : "#f59e0b" }] : []),
            ].map(({ label, val, accent }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".68rem", color: "var(--mu)" }}>{label}</span>
                <span style={{ fontSize: ".9rem", fontWeight: 800, color: accent }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Row 3: Precios + Comisiones desglose ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: ".85rem", marginBottom: "1rem" }}>
          <HCard label="Precio promedio lote" value={fmtCLP(kpis.precioPromedio)} accent="#06B6D4" />
          <HCard label="Lote más caro" value={fmtCLP(kpis.precioMax)} sub={kpis.loteMax?.lote || ""} accent="#14B8A6" />
          <HCard label="Lote más económico" value={fmtCLP(kpis.precioMin)} sub={kpis.loteMin?.lote || ""} accent="#6b7280" />
          {/* Desglose financiero en mini-bar */}
          <div style={{ ...CARD }}>
            <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))", marginBottom: ".1rem" }}>Desglose financiero</div>
            <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".7rem" }}>Comparación de montos del remate</div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={kpis.desglose} barSize={22} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: "var(--mu,#6b7280)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CTip />} />
                <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                  {kpis.desglose.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══ Row 4: Top compradores + Categorías ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".85rem" }}>
          <div style={{ ...CARD }}>
            <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))", marginBottom: ".05rem" }}>Top compradores</div>
            <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".9rem" }}>Por monto total comprado</div>
            {kpis.topCompradores.length === 0
              ? <div style={{ fontSize: ".75rem", color: "var(--mu)", fontStyle: "italic" }}>Sin datos</div>
              : kpis.topCompradores.map((c, i) => (
                  <RankRow key={c.postor} rank={i + 1} label={`${c.postor} (${c.lotes} lote${c.lotes !== 1 ? "s" : ""})`} value={c.monto} maxValue={kpis.topCompradores[0].monto} accent={PALETTE[i % PALETTE.length]} />
                ))
            }
          </div>
          <div style={{ ...CARD }}>
            <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))", marginBottom: ".05rem" }}>Categorías más vendidas</div>
            <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".9rem" }}>Por monto total en esta categoría</div>
            {kpis.topCats.length === 0
              ? <div style={{ fontSize: ".75rem", color: "var(--mu)", fontStyle: "italic" }}>Sin datos</div>
              : kpis.topCats.map((c, i) => (
                  <RankRow key={c.cat} rank={i + 1} label={`${c.cat} (${c.lotes} lote${c.lotes !== 1 ? "s" : ""})`} value={c.monto} maxValue={kpis.topCats[0].monto} accent={PALETTE[i % PALETTE.length]} />
                ))
            }
          </div>
        </div>
      </>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB: MENSUAL
═══════════════════════════════════════════════════════════════════════ */
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
    const liqs = liquidaciones.filter(l => { const d = parseFecha(l); return d.getMonth() === m && d.getFullYear() === a; });
    const rematesDelMes = dbRemates.filter(r => {
      if (!r.fecha) return false;
      const d = new Date(r.fecha);
      return d.getMonth() === m && d.getFullYear() === a;
    });
    const totalMartillo  = liqs.reduce((s, l) => s + (l.monto || 0), 0);
    const totalCom       = liqs.reduce((s, l) => s + (l.com || l.comision || 0), 0);
    const totalGAdm      = liqs.reduce((s, l) => s + (l.gastosAdm || l.gastos_adm || 0), 0);
    const ingresoNeto    = totalCom + totalGAdm;
    const nLotes         = liqs.length;
    const nRemates       = rematesDelMes.length;
    const nCompradores   = new Set(liqs.map(l => (l.postor || "").toLowerCase().trim())).size;
    const precioPromedio = nLotes > 0 ? Math.round(totalMartillo / nLotes) : 0;
    const lotesMesIds    = new Set(rematesDelMes.map(r => r.id));
    const lotesTotales   = dbLotes.filter(l => lotesMesIds.has(l.remate_id)).length;
    const tasaAdj        = pct(nLotes, lotesTotales);
    const byPostor       = {};
    liqs.forEach(l => {
      const k = (l.postor || "Desconocido").trim();
      if (!byPostor[k]) byPostor[k] = { postor: k, monto: 0, lotes: 0 };
      byPostor[k].monto += l.monto || 0;
      byPostor[k].lotes += 1;
    });
    const topCompradores = Object.values(byPostor).sort((a, b) => b.monto - a.monto).slice(0, 5);
    return { totalMartillo, totalCom, totalGAdm, ingresoNeto, nLotes, nRemates, nCompradores, precioPromedio, lotesTotales, tasaAdj, topCompradores };
  }

  const kpis     = useMemo(() => getKPIs(mes, anio), [mes, anio, liquidaciones, dbLotes, dbRemates]);
  const kpisPrev = useMemo(() => {
    const pm = mes === 0 ? 11 : mes - 1;
    const pa = mes === 0 ? anio - 1 : anio;
    return getKPIs(pm, pa);
  }, [mes, anio, liquidaciones, dbLotes, dbRemates]);

  // Chart: 12 meses del año seleccionado
  const chartData = useMemo(() => MESES_S.map((m, i) => {
    const liqs = liquidaciones.filter(l => { const d = parseFecha(l); return d.getFullYear() === anio && d.getMonth() === i; });
    return { mes: m, v: liqs.reduce((s, l) => s + (l.monto || 0), 0), highlight: i === mes };
  }), [anio, mes, liquidaciones]);

  // Remates del mes
  const rematesMes = useMemo(() =>
    dbRemates.filter(r => { if (!r.fecha) return false; const d = new Date(r.fecha); return d.getMonth() === mes && d.getFullYear() === anio; })
      .map(r => {
        const rec = liquidaciones.filter(l => (l.remateId || l.remate_id) === r.id).reduce((s, l) => s + (l.monto || 0), 0);
        const nl  = liquidaciones.filter(l => (l.remateId || l.remate_id) === r.id).length;
        return { ...r, recaudado: rec, nLotes: nl };
      })
      .sort((a, b) => b.recaudado - a.recaudado),
    [mes, anio, dbRemates, liquidaciones]
  );

  const prevLabel = `${MESES[mes === 0 ? 11 : mes - 1]} ${mes === 0 ? anio - 1 : anio}`;

  return (
    <div>
      {/* ── Selector ── */}
      <div style={{ display: "flex", gap: ".6rem", marginBottom: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
        <select className="fsel" style={{ fontSize: ".82rem", width: "auto" }} value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select className="fsel" style={{ fontSize: ".82rem", width: "auto" }} value={anio} onChange={e => setAnio(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize: ".65rem", color: "var(--mu)", padding: ".25rem .65rem", background: "var(--b1)", borderRadius: 20, fontWeight: 600 }}>
          vs. {prevLabel}
        </span>
      </div>

      {kpis.nLotes === 0 && kpis.nRemates === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--mu)", fontSize: ".88rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: .3 }}>📅</div>
          Sin datos para {MESES[mes]} {anio}.
        </div>
      ) : (<>
        {/* ═══ Row 1: KPIs con delta ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: ".85rem", marginBottom: "1rem" }}>
          <HCard label="Total martillo" value={fmtCLP(kpis.totalMartillo)} prevValue={kpisPrev.totalMartillo} sub={prevLabel} accent="#06B6D4" big icon="🔨" />
          <HCard label="Ingreso casa" value={fmtCLP(kpis.ingresoNeto)} prevValue={kpisPrev.ingresoNeto} sub="Com. + G. adm." accent="#14B8A6" icon="🏛️" />
          <HCard label="Remates realizados" value={kpis.nRemates} sub={`${kpis.nLotes} lotes adjudicados`} accent="#06B6D4" icon="📦" />
          <HCard label="Tasa adjudicación" value={`${kpis.tasaAdj}%`} sub={`${kpis.nLotes}/${kpis.lotesTotales} lotes`} accent={kpis.tasaAdj >= 80 ? "#14B8A6" : "#f59e0b"} />
          <HCard label="Compradores únicos" value={kpis.nCompradores} prevValue={kpisPrev.nCompradores} accent="#8b5cf6" icon="👥" />
          <HCard label="Precio promedio lote" value={fmtCLP(kpis.precioPromedio)} prevValue={kpisPrev.precioPromedio} accent="#06B6D4" />
        </div>

        {/* ═══ Row 2: Trend chart + Remates ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: ".85rem", marginBottom: "1rem" }}>
          {/* Trend chart anual */}
          <div style={{ ...CARD }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".15rem" }}>
              <div>
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))" }}>Tendencia anual {anio}</div>
                <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".8rem" }}>Volumen de ventas por mes — mes seleccionado destacado</div>
              </div>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#06B6D4" }}>{fmtCLP(kpis.totalMartillo)}</div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={22} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "var(--mu,#6b7280)", fontFamily: "Inter,sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CTip />} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.highlight ? "#06B6D4" : "rgba(6,182,212,.25)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Remates del mes */}
          <div style={{ ...CARD }}>
            <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))", marginBottom: ".05rem" }}>Remates del mes</div>
            <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".9rem" }}>Por volumen recaudado</div>
            {rematesMes.length === 0 ? (
              <div style={{ fontSize: ".75rem", color: "var(--mu)", fontStyle: "italic", textAlign: "center", padding: "1.5rem" }}>Sin remates este mes</div>
            ) : (
              rematesMes.map((r, i) => (
                <div key={r.id} style={{ marginBottom: ".65rem", paddingBottom: ".65rem", borderBottom: i < rematesMes.length - 1 ? "1px solid var(--b1)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--wh)", marginBottom: ".12rem", maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.nombre || r.name}
                    </div>
                    <span style={{ fontSize: ".72rem", fontWeight: 800, color: "#06B6D4" }}>{fmtMill(r.recaudado)}</span>
                  </div>
                  <div style={{ fontSize: ".62rem", color: "var(--mu)" }}>
                    {r.nLotes} lotes · {new Date(r.fecha).toLocaleDateString("es-CL")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══ Row 3: Top compradores ═══ */}
        <div style={{ ...CARD }}>
          <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--wh2,var(--wh))", marginBottom: ".05rem" }}>Top compradores del mes</div>
          <div style={{ fontSize: ".6rem", color: "var(--mu)", marginBottom: ".9rem" }}>Por monto total comprado en {MESES[mes]} {anio}</div>
          {kpis.topCompradores.length === 0 ? (
            <div style={{ fontSize: ".75rem", color: "var(--mu)", fontStyle: "italic" }}>Sin compradores este mes</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "0 2rem" }}>
              {kpis.topCompradores.map((c, i) => (
                <RankRow key={c.postor} rank={i + 1} label={`${c.postor} (${c.lotes} lote${c.lotes !== 1 ? "s" : ""})`} value={c.monto} maxValue={kpis.topCompradores[0].monto} accent={PALETTE[i % PALETTE.length]} />
              ))}
            </div>
          )}
        </div>
      </>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════════ */
export default function PageKPIs({ session, liquidaciones = [], dbLotes = [], dbPostores = [], dbRemates = [] }) {
  const [tab, setTab] = useState("remate");

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.25rem",
        background: "linear-gradient(135deg,var(--s2) 0%,var(--s2) 100%)",
        border: "1px solid var(--b1)", borderRadius: 14,
        padding: "1rem 1.4rem",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background accent */}
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontSize: ".58rem", fontWeight: 700, color: "#06B6D4", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".2rem" }}>
            ● TAKKA
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--wh)", letterSpacing: "-.01em" }}>
            TAKKA Board
          </div>
          <div style={{ fontSize: ".65rem", color: "var(--mu)", marginTop: ".15rem" }}>
            Resumen interactivo de remates, ingresos y rendimiento
          </div>
        </div>
        {/* Tab switcher */}
        <div style={{ display: "flex", background: "var(--bg,var(--s1))", border: "1px solid var(--b1)", borderRadius: 9, padding: 3, gap: 2 }}>
          {[["remate", "Por Remate"], ["mensual", "Visión Mensual"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: ".4rem 1.1rem", fontSize: ".73rem", fontWeight: 700, border: "none",
              borderRadius: 7, cursor: "pointer",
              background: tab === v ? "#06B6D4" : "transparent",
              color: tab === v ? "#fff" : "var(--mu)",
              transition: "all .18s", boxShadow: tab === v ? "0 2px 8px rgba(6,182,212,.35)" : "none",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "remate" && (
        <TabRemate liquidaciones={liquidaciones} dbLotes={dbLotes} dbPostores={dbPostores} dbRemates={dbRemates} />
      )}
      {tab === "mensual" && (
        <TabMensual liquidaciones={liquidaciones} dbLotes={dbLotes} dbRemates={dbRemates} />
      )}
    </div>
  );
}
