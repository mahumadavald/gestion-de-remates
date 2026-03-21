'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client ───────────────────────────────────────────────
const SUPA_URL = "https://xqkfcqibukghtyfjcwfb.supabase.co";
const SUPA_KEY = "sb_publishable_m2bABYE65JScB4oCJUBmFg_3eVzUuIR";
const supabase = createClient(SUPA_URL, SUPA_KEY);


// ── BRAND ─────────────────────────────────────────────────────────
const GRLogo = ({ collapsed = false }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 3C9.716 3 3 9.716 3 18s6.716 15 15 15 15-6.716 15-15S26.284 3 18 3z" fill="none"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    </svg>
    {!collapsed && (
      <div style={{ fontFamily:"Inter,sans-serif", fontWeight:500, fontSize:".78rem", color:"#7aaec8", letterSpacing:".04em" }}>
        Auction Software
      </div>
    )}
  </div>
);

// ── DATA ──────────────────────────────────────────────────────────
const VENTAS_MES = [];
const TOP_LOTES = [];
const PIE_DATA = [];
const PIE_COLORS = ["#38B2F6","#34d399","#f6ad55"];

const REMATES = [];
const LOTES = [];
const POSTORES = [];
const FACTURAS = [];
const GARANTIAS = [];

// Comisiones por tipo de remate
const COMISIONES = {
  judicial:  { label:"Judicial",   com: 10,  desc:"Remate judicial — comisión fija 10% por ley, se cobra al comprador." },
  concursal: { label:"Concursal",  com: 7,   desc:"Liquidación concursal — comisión fija 7% por ley." },
  privado:   { label:"Privado",    com: null, desc:"Remate privado — comisión personalizada según acuerdo." },
};
const GASTO_ADMIN_MOTORIZADO = 50000; // CLP — solo vehículos motorizados

const LOTES_REALES = [];
const ADJUDICACIONES = [];
const LOTES_SALA = [];

const INC_OPTIONS = [10000,20000,50000,100000,200000,500000,1000000,2000000,5000000];
const BID_TIMER   = 15;
const fmt  = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
const fmtS = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;

// ── Calcula liquidación completa por comprador (puede tener varios lotes) ──
// Separa EX (artículos) vs AF (comisión + gastos admin), aplica IVA 19% solo a AF
const calcLiquidacion = (lotes, postor) => {
  const IVA = 0.19;
  let totalEx = 0, totalAf = 0, totalCom = 0, totalGastosAdm = 0;
  const lineas = [];
  lotes.forEach(l => {
    const com       = Math.round(l.monto * (l.comPct ?? 3) / 100);
    const gastosAdm = l.motorizado ? GASTO_ADMIN_MOTORIZADO : 0;
    totalEx       += l.monto;
    totalCom      += com;
    totalGastosAdm+= gastosAdm;
    totalAf       += gastosAdm; // comisión va aparte en totalCom
    lineas.push({ lote:l.lote, exp:l.exp||"", monto:l.monto, com, gastosAdm, motorizado:l.motorizado, comPct:l.comPct??3 });
  });
  const ivaBase   = totalCom + totalAf; // comisión + gastos admin son AF
  const iva       = Math.round(ivaBase * IVA);
  const total     = totalEx + totalCom + totalAf + iva;
  const garantia  = postor ? (GARANTIAS.find(g=>g.postor===postor.name&&g.estado==="aprobada")?.monto||0) : 0;
  const totalAPagar = Math.max(0, total - garantia);
  return { lineas, totalEx, totalCom, totalAf, iva, total, garantia, totalAPagar };
};

const printLiquidacion = (c, liqFecha, remateNombre) => {
  const p = c.postorData;
  const l = c.liq;
  const fmt = n => "$\u00a0" + Math.round(n).toLocaleString("es-CL");
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Liquidacion — Comprador N° ${String(c.key).padStart(2,"0")}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;font-size:11pt;color:#111;background:#fff;padding:2cm;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:3px solid #38B2F6;}
  .logo-area{display:flex;align-items:center;gap:12px;}
  .logo-text{font-size:10pt;font-weight:400;color:#5a7fa8;letter-spacing:.1em;text-transform:uppercase;}
  .doc-title{text-align:right;}
  .doc-title h1{font-size:18pt;font-weight:800;color:#38B2F6;text-transform:uppercase;letter-spacing:-.02em;}
  .doc-title p{font-size:9pt;color:#666;margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}
  .remate-banner{background:#f0f7ff;border:1px solid #c0d8f8;border-radius:6px;padding:.5rem 1rem;margin-bottom:1.2rem;font-size:9.5pt;color:#1a8fd4;font-weight:600;}
  .datos-grid{display:grid;grid-template-columns:1fr 1fr;gap:.25rem .8rem;margin-bottom:1.2rem;padding:.8rem 1rem;background:#f8f9fa;border-radius:6px;border:1px solid #e5e7eb;font-size:9.5pt;}
  .dato{display:flex;gap:.4rem;}
  .dato-key{color:#666;min-width:90px;flex-shrink:0;}
  .dato-val{font-weight:600;color:#111;}
  table{width:100%;border-collapse:collapse;margin-bottom:1.2rem;font-size:9.5pt;}
  thead tr{background:#1e3a5f;color:#fff;}
  thead th{padding:.4rem .6rem;text-align:left;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.04em;}
  thead th.r{text-align:right;}
  tbody tr{border-bottom:1px solid #e5e7eb;}
  tbody tr:nth-child(even){background:#f8f9fa;}
  td{padding:.4rem .6rem;color:#333;}
  td.r{text-align:right;font-family:monospace;}
  td.ex{text-align:center;font-size:8pt;font-weight:700;color:#059669;background:#ecfdf5;border-radius:3px;padding:.1rem .3rem;}
  td.af{text-align:center;font-size:8pt;font-weight:700;color:#38B2F6;background:#eff6ff;border-radius:3px;padding:.1rem .3rem;}
  td.lote-name{font-weight:600;color:#111;}
  td.com{color:#666;font-style:italic;}
  td.gadm{color:#d97706;}
  .totales-row{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;align-items:start;}
  .totales-tabla{font-size:9.5pt;}
  .totales-tabla div{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #e5e7eb;}
  .totales-tabla .total-final{font-size:11pt;font-weight:800;border-top:2px solid #38B2F6;border-bottom:none;margin-top:.3rem;padding-top:.4rem;color:#111;}
  .totales-tabla .total-final span:last-child{color:#38B2F6;}
  .garantia-box{background:#eff6ff;border:1.5px solid #93c5fd;border-radius:8px;padding:.8rem 1rem;font-size:9.5pt;}
  .garantia-box .g-row{display:flex;justify-content:space-between;margin-bottom:.35rem;color:#444;}
  .garantia-box .total-pagar{display:flex;justify-content:space-between;padding-top:.4rem;border-top:1.5px solid #93c5fd;margin-top:.35rem;}
  .garantia-box .total-pagar span:first-child{font-weight:700;font-size:11pt;}
  .garantia-box .total-pagar span:last-child{font-weight:800;font-size:13pt;color:#38B2F6;font-family:monospace;}
  .footer{margin-top:2rem;padding-top:.8rem;border-top:1px solid #e5e7eb;font-size:8pt;color:#999;text-align:center;}
  @media print{body{padding:1cm;}@page{size:letter;margin:1cm;}}
</style>
</head>
<body>
<div class="header">
  <div class="logo-area">
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="#EBF4FF" stroke="#93C5FD" stroke-width="1"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="#1e3a5f" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    </svg>
    <span class="logo-text">Auction Software</span>
  </div>
  <div class="doc-title">
    <h1>Liquidación</h1>
    <p>Comprador N° ${String(c.key).padStart(2,"0")}</p>
  </div>
</div>

<div class="remate-banner">
  📋 ${remateNombre || "Remate"} &nbsp;·&nbsp; Fecha: ${liqFecha}
</div>

<div class="datos-grid">
  ${[
    ["Comprador N°", String(c.key).padStart(2,"0")],
    ["Fecha", liqFecha],
    ["Señor(es)", p?.razonSocial||"—"],
    ["R.U.T.", p?.rut||"—"],
    ["Giro", p?.giro||"—"],
    ["Teléfono", p?.tel||"—"],
    ["Dirección", p?.direccion||"—"],
    ["Email", p?.email||"—"],
    ["Comuna", p?.comuna||"—"],
  ].map(([k,v])=>`<div class="dato"><span class="dato-key">${k}</span><span class="dato-val">${v}</span></div>`).join("")}
</div>

<table>
  <thead>
    <tr>
      <th>Expediente</th>
      <th>Cant.</th>
      <th>Descripción</th>
      <th style="text-align:center">ND</th>
      <th class="r">Unitario</th>
      <th class="r">Total</th>
    </tr>
  </thead>
  <tbody>
    ${l.lineas.map((ln,i)=>`
      <tr>
        <td style="font-family:monospace;font-size:8.5pt;color:#666">${ln.exp||`Lote ${i+1}`}</td>
        <td style="text-align:center;color:#666">1</td>
        <td class="lote-name">${ln.lote}</td>
        <td><span class="ex">EX</span></td>
        <td class="r">${fmt(ln.monto)}</td>
        <td class="r">${fmt(ln.monto)}</td>
      </tr>
      <tr>
        <td style="font-family:monospace;font-size:8.5pt;color:#666">${ln.exp||`Lote ${i+1}`}</td>
        <td style="text-align:center;color:#666">1</td>
        <td class="com">Comisión ${ln.comPct}%</td>
        <td><span class="af">AF</span></td>
        <td class="r">${fmt(ln.com)}</td>
        <td class="r">${fmt(ln.com)}</td>
      </tr>
      ${ln.motorizado?`
      <tr>
        <td style="font-family:monospace;font-size:8.5pt;color:#666">G-ADMIN</td>
        <td style="text-align:center;color:#666">1</td>
        <td class="gadm">Gastos Administrativos — Vehículo Motorizado (${ln.exp||`Lote ${i+1}`})</td>
        <td><span class="af">AF</span></td>
        <td class="r" style="color:#d97706">${fmt(ln.gastosAdm)}</td>
        <td class="r" style="color:#d97706">${fmt(ln.gastosAdm)}</td>
      </tr>`:""}
    `).join("")}
  </tbody>
</table>

<div class="totales-row">
  <div class="totales-tabla">
    <div><span>Total Compras Exentas:</span><span style="font-family:monospace">${fmt(l.totalEx)}</span></div>
    <div><span>Total Compras Afectas:</span><span style="font-family:monospace">${fmt(l.totalAf)}</span></div>
    <div><span>Total Comisión:</span><span style="font-family:monospace">${fmt(l.totalCom)}</span></div>
    <div><span>19% IVA:</span><span style="font-family:monospace">${fmt(l.iva)}</span></div>
    <div class="total-final"><span>Total:</span><span>${fmt(l.total)}</span></div>
  </div>
  <div class="garantia-box">
    <div class="g-row"><span>Total:</span><span style="font-family:monospace">${fmt(l.total)}</span></div>
    <div class="g-row"><span>Garantía abonada:</span><span style="font-family:monospace;color:#059669">− ${fmt(l.garantia)}</span></div>
    <div class="total-pagar">
      <span>Total a Pagar:</span>
      <span>${fmt(l.totalAPagar)}</span>
    </div>
  </div>
</div>

<div class="footer">
  Documento generado por GR Auction Software · ${new Date().toLocaleDateString("es-CL")} · gestionderemates.cl
</div>

<script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`;
  const w = window.open("","_blank","width=900,height=700");
  w.document.write(html);
  w.document.close();
};
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f4f4f2;
  --s1:#f4f4f2;
  --s2:#ffffff;
  --s3:#f0f0ef;
  --b1:#e5e7eb;
  --b2:#d1d5db;
  --ac:#06B6D4;
  --acH:#22d3ee;
  --acD:#1a8fd4;
  --wh:#1a1a1a;
  --wh2:#1a1a1a;
  --mu:#6b7280;
  --mu2:#4b5563;
  --gr:#0d9488;
  --rd:#dc2626;
  --yl:#d97706;
  --sb:#0f4c5c;
  --sbB:#1d6a7a;
  --sbT:#cceef4;
  --sbM:#7ecfdc;
}
html,body{height:100%;background:#f4f4f2;color:#1a1a1a;font-family:'Inter',sans-serif;overflow:hidden;font-size:16px;}
button,input,select{font-family:'Inter',sans-serif;}

/* ── NUMERIC STYLE — SF Pro Rounded Bold ── */
.num,[class*="monto"],[class*="precio"],[class*="puja"],[class*="oferta"],[class*="total"],[class*="balance"],[class*="amount"],[class*="paleta"],[class*="postura"],[class*="bid-amt"],[class*="price"]{font-family:ui-rounded,'SF Pro Rounded',-apple-system,system-ui,sans-serif;font-weight:700;font-variant-numeric:tabular-nums;font-feature-settings:"tnum";letter-spacing:-.02em;}

/* ── APP SHELL ── */
.app{display:flex;height:100vh;overflow:hidden;}

/* ── SIDEBAR ── */
.sidebar{width:240px;background:#f0f2f5;border-right:1px solid var(--b1);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;}
.sb-logo{padding:1.2rem 1.3rem 1.1rem;border-bottom:1px solid var(--b1);display:flex;align-items:center;}
.sb-section{padding:.9rem 1.3rem .3rem;font-size:.62rem;font-weight:700;letter-spacing:.1em;color:var(--mu);text-transform:uppercase;}
.sb-item{display:flex;align-items:center;gap:.7rem;padding:.55rem 1rem;margin:.06rem .7rem;border-radius:9px;cursor:pointer;transition:all .18s cubic-bezier(.34,1.56,.64,1);color:var(--mu2);font-size:.82rem;font-weight:500;}
.sb-item:hover{background:#fff;color:var(--wh2);transform:scale(1.03);box-shadow:0 2px 8px rgba(0,0,0,.08);}
.sb-item.on{background:#fff;color:var(--ac);font-weight:600;box-shadow:0 2px 8px rgba(6,182,212,.15);}
.sb-item.on .sb-icon{color:var(--ac);opacity:1;}
.sb-icon{width:17px;text-align:center;flex-shrink:0;opacity:.6;color:var(--mu2);}
.sb-badge{margin-left:auto;background:var(--ac);color:#fff;font-size:.58rem;padding:.1rem .42rem;border-radius:10px;font-weight:700;}
.sb-footer{margin-top:auto;padding:.9rem 1rem;border-top:1px solid var(--b1);}
.sb-user{display:flex;align-items:center;gap:.65rem;}
.sb-ava{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--ac),#0e7490);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#fff;flex-shrink:0;}
.sb-uname{font-size:.78rem;font-weight:600;color:var(--wh2);line-height:1.25;}
.sb-urole{font-size:.65rem;color:var(--mu);}

/* ── MAIN ── */
.main-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 1.6rem;height:52px;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0;flex-wrap:nowrap;overflow:hidden;}
.topbar-left{display:flex;align-items:center;gap:.8rem;flex:1;min-width:0;overflow:hidden;}
.topbar-title{font-size:.95rem;font-weight:700;color:var(--wh);}
.topbar-right{display:flex;align-items:center;gap:.75rem;}
.tb-live{display:flex;align-items:center;gap:.4rem;padding:.25rem .7rem;border-radius:5px;background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.25);font-size:.7rem;font-weight:600;color:var(--gr);}
.ldot{width:6px;height:6px;border-radius:50%;background:var(--gr);box-shadow:0 0 6px var(--gr);animation:pu 1.8s infinite;}
@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* BUTTONS */
.btn-primary{padding:.45rem 1.1rem;background:var(--ac);border:none;border-radius:9px;font-size:.76rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;}
.btn-primary:hover{background:var(--acH);transform:translateY(-1px);}
.btn-sec{padding:.4rem 1rem;background:#fff;border:1px solid var(--b1);border-radius:9px;font-size:.74rem;font-weight:600;color:var(--mu2);cursor:pointer;transition:all .15s;box-shadow:0 1px 3px rgba(0,0,0,.06);}
.btn-sec:hover{border-color:var(--ac);color:var(--ac);}
.btn-cancel{padding:.5rem .9rem;border:1px solid var(--b1);background:transparent;color:var(--mu);border-radius:6px;font-size:.76rem;font-weight:500;cursor:pointer;transition:all .15s;}
.btn-cancel:hover{border-color:var(--rd);color:var(--rd);}
.btn-confirm{padding:.5rem 1.1rem;background:var(--ac);border:none;border-radius:6px;font-size:.76rem;font-weight:600;color:#fff;cursor:pointer;transition:background .15s;}
.btn-confirm:hover{background:var(--acH);}

/* PAGE */
.page{flex:1;overflow-y:auto;padding:2rem 2.2rem;}

/* NOTIF */
.notif{position:fixed;top:62px;right:1.4rem;z-index:999;padding:.55rem 1.2rem;border-radius:7px;font-size:.75rem;font-weight:600;animation:si .2s ease;}
.notif.ok  {background:rgba(20,184,166,.12);border:1px solid rgba(20,184,166,.35);color:var(--gr);}
.notif.sold{background:rgba(56,178,246,.14);border:1px solid rgba(56,178,246,.38);color:var(--ac);}
.notif.inf {background:rgba(56,178,246,.12);border:1px solid rgba(56,178,246,.3);color:var(--acH);}
@keyframes si{from{transform:translateX(10px);opacity:0}to{transform:none;opacity:1}}

/* STAT CARDS */
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem;margin-bottom:1.3rem;}
.stat-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.1rem 1.2rem;position:relative;overflow:hidden;transition:border-color .2s,transform .15s;}
.stat-card:hover{border-color:var(--b2);transform:translateY(-2px);}
.stat-card::after{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--sc,var(--ac));border-radius:10px 0 0 10px;}
.stat-label{font-size:.7rem;font-weight:500;color:var(--mu);margin-bottom:.45rem;letter-spacing:.01em;}
.stat-val{font-size:1.75rem;font-weight:800;color:var(--wh);line-height:1;margin-bottom:.3rem;letter-spacing:-.02em;}
.stat-delta{font-size:.68rem;font-weight:500;display:flex;align-items:center;gap:.28rem;}
.delta-up{color:var(--gr);}

/* CHARTS */
.charts-row{display:grid;grid-template-columns:1fr .82fr .6fr;gap:.85rem;margin-bottom:1.3rem;}
.chart-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.1rem 1.2rem;}
.chart-title{font-size:.78rem;font-weight:700;color:var(--wh2);margin-bottom:.15rem;}
.chart-sub{font-size:.68rem;color:var(--mu);margin-bottom:.9rem;}
.ctt{background:var(--s3)!important;border:1px solid var(--b2)!important;border-radius:7px;padding:.42rem .7rem;font-size:.68rem;color:var(--wh2);}

/* TABLE */
.table-card{background:#fff;border:1px solid var(--b1);border-radius:14px;overflow:hidden;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,.05);}
.table-head{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.4rem;border-bottom:1px solid var(--b1);}
.table-title{font-size:.88rem;font-weight:700;color:var(--wh2);}
.filter-row{display:flex;gap:.35rem;}
.filter-btn{padding:.3rem .8rem;background:#fff;border:1px solid var(--b1);border-radius:8px;font-size:.72rem;font-weight:600;color:var(--mu);cursor:pointer;transition:all .15s;text-transform:capitalize;box-shadow:0 1px 2px rgba(0,0,0,.04);}
.filter-btn.on{border-color:var(--ac);color:var(--ac);background:rgba(6,182,212,.08);}
.filter-btn:hover:not(.on){border-color:var(--b2);color:var(--wh2);}
table{width:100%;border-collapse:collapse;}
th{padding:.65rem 1.4rem;text-align:left;font-size:.66rem;font-weight:700;letter-spacing:.06em;color:var(--mu);text-transform:uppercase;border-bottom:1px solid var(--b1);background:var(--s1);}
td{padding:.8rem 1.4rem;font-size:.8rem;border-bottom:1px solid var(--b1);vertical-align:middle;color:var(--wh2);}
tbody tr:hover{background:var(--s1);}
tbody tr:last-child td{border-bottom:none;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:rgba(56,178,246,.04);}
.mono{font-family:'Inter', sans-serif;font-size:.72rem;color:var(--mu2);}
.gt{color:var(--ac);font-family:'Inter', sans-serif;font-size:.75rem;font-weight:500;}
.pill{display:inline-flex;align-items:center;gap:.22rem;padding:.12rem .52rem;border-radius:12px;font-size:.66rem;font-weight:600;white-space:nowrap;}
.p-activo      {background:rgba(56,178,246,.12);color:var(--ac);border:1px solid rgba(56,178,246,.28);}
.p-cerrado     {background:rgba(90,127,168,.1); color:var(--mu2);border:1px solid var(--b1);}
.p-borrador    {background:rgba(255,255,255,.04);color:var(--mu);border:1px solid var(--b2);}
.p-publicado   {background:rgba(56,178,246,.1); color:var(--ac);border:1px solid rgba(56,178,246,.25);}
.p-en_vivo     {background:rgba(20,184,166,.12);color:var(--gr);border:1px solid rgba(20,184,166,.3);}
.p-finalizado  {background:rgba(90,127,168,.1); color:var(--mu2);border:1px solid var(--b1);}
.p-disponible  {background:rgba(56,178,246,.1); color:var(--ac);border:1px solid rgba(56,178,246,.25);}
.p-en-subasta  {background:rgba(20,184,166,.12);color:var(--gr);border:1px solid rgba(20,184,166,.3);}
.p-vendido     {background:rgba(20,184,166,.1); color:var(--gr);border:1px solid rgba(20,184,166,.25);}
.p-sin-vender  {background:rgba(224,82,82,.08); color:var(--rd);border:1px solid rgba(224,82,82,.2);}
.p-retirado    {background:rgba(255,255,255,.04);color:var(--mu);border:1px solid var(--b2);}
.p-publicado{background:rgba(20,184,166,.1); color:var(--gr);border:1px solid rgba(20,184,166,.25);}
.p-vendido  {background:rgba(56,178,246,.12);color:var(--ac);border:1px solid rgba(56,178,246,.28);}
.p-sinvender{background:rgba(245,101,101,.1);color:var(--rd);border:1px solid rgba(245,101,101,.28);}
.p-pagado   {background:rgba(20,184,166,.1); color:var(--gr);border:1px solid rgba(20,184,166,.25);}
.p-pendiente{background:rgba(246,173,85,.1); color:var(--yl);border:1px solid rgba(246,173,85,.25);}
.p-vencido  {background:rgba(245,101,101,.1);color:var(--rd);border:1px solid rgba(245,101,101,.28);}
.p-verificado{background:rgba(20,184,166,.1);color:var(--gr);border:1px solid rgba(20,184,166,.25);}

/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem;}
.modal{background:var(--s2);border:1px solid var(--b2);border-radius:12px;padding:1.7rem;width:100%;max-width:460px;box-shadow:0 24px 60px rgba(0,0,0,.6);}
.modal.wide{max-width:720px;}
.modal-title{font-size:1.05rem;font-weight:800;color:var(--wh);margin-bottom:1.25rem;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;}
.fg{margin-bottom:.0;}
.fg.full{grid-column:1/-1;}
.fl{display:block;font-size:.68rem;font-weight:600;color:var(--mu2);margin-bottom:.26rem;letter-spacing:.01em;}
.fi{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:7px;color:var(--wh2);font-size:.82rem;padding:.55rem .78rem;transition:border-color .15s;}
.fi:focus{outline:none;border-color:var(--ac);background:rgba(56,178,246,.05);}
.fi::placeholder{color:var(--mu);}
.fsel{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:7px;color:var(--wh2);font-size:.82rem;padding:.55rem .78rem;cursor:pointer;}
.fsel:focus{outline:none;border-color:var(--ac);}
.modal-actions{display:flex;gap:.6rem;margin-top:1.2rem;}
/* Lote wizard steps */
.wiz-steps{display:flex;gap:0;margin-bottom:1.4rem;border-bottom:1px solid var(--b1);padding-bottom:1rem;}
.wiz-step{display:flex;align-items:center;gap:.45rem;font-size:.7rem;font-weight:600;color:var(--mu);padding:.25rem .5rem;border-radius:6px;cursor:default;transition:all .15s;flex:1;justify-content:center;}
.wiz-step.on{color:var(--ac);background:rgba(56,178,246,.08);}
.wiz-step.done{color:var(--gr);}
.wiz-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;background:var(--b1);color:var(--mu);flex-shrink:0;}
.wiz-step.on .wiz-num{background:var(--ac);color:#fff;}
.wiz-step.done .wiz-num{background:var(--gr);color:#1F2937;}
/* Tipo selector grande */
.tipo-sel{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1rem;}
.tipo-opt{padding:.75rem .5rem;border-radius:9px;border:1px solid var(--b1);background:transparent;cursor:pointer;text-align:center;transition:all .15s;color:var(--mu);font-size:.72rem;font-weight:600;}
.tipo-opt:hover{border-color:var(--b2);color:var(--mu2);}
.tipo-opt.on{border-color:var(--ac);background:rgba(56,178,246,.1);color:var(--ac);}
.tipo-opt-icon{font-size:1.3rem;margin-bottom:.3rem;display:block;}
/* Foto upload grid */
.foto-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:.8rem;}
.foto-slot{aspect-ratio:1;border-radius:9px;border:1px dashed var(--b2);background:rgba(255,255,255,.02);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;cursor:pointer;transition:all .15s;position:relative;overflow:hidden;font-size:.62rem;color:var(--mu);font-weight:600;text-align:center;}
.foto-slot:hover{border-color:var(--ac);background:rgba(56,178,246,.05);color:var(--ac);}
.foto-slot.filled{border-color:var(--ac);border-style:solid;}
.foto-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;}
.foto-label{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);font-size:.6rem;padding:.2rem;text-align:center;color:#fff;}
/* Items dinámicos */
.item-card{background:rgba(255,255,255,.025);border:1px solid var(--b1);border-radius:8px;padding:.7rem .85rem;display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem;}
.doc-card{background:rgba(246,173,85,.04);border:1px solid rgba(246,173,85,.15);border-radius:8px;padding:.6rem .85rem;display:flex;align-items:center;gap:.6rem;margin-bottom:.35rem;}
.add-btn-row{border:1px dashed var(--b2);border-radius:8px;padding:.5rem;display:flex;align-items:center;justify-content:center;gap:.4rem;cursor:pointer;color:var(--mu);font-size:.72rem;font-weight:600;transition:all .15s;margin-top:.3rem;}
.add-btn-row:hover{border-color:var(--ac);color:var(--ac);background:rgba(56,178,246,.04);}

/* REPORTES */
.rep-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem;margin-bottom:1.2rem;}
.rep-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.1rem 1.2rem;}
.rep-metric{font-size:1.7rem;font-weight:800;color:var(--wh);line-height:1;margin-bottom:.2rem;letter-spacing:-.02em;}
.rep-label{font-size:.68rem;font-weight:500;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;}
.rep-bar-row{display:flex;align-items:center;gap:.7rem;margin-top:.55rem;}
.rep-bar-bg{flex:1;height:3px;background:var(--b1);border-radius:2px;}
.rep-bar-fill{height:100%;border-radius:2px;background:var(--ac);}
.rep-bar-val{font-size:.67rem;color:var(--mu2);font-weight:600;min-width:28px;text-align:right;}

/* CONFIG */
.config-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.config-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.3rem;}
.config-title{font-size:.78rem;font-weight:700;color:var(--wh);margin-bottom:1rem;padding-bottom:.6rem;border-bottom:1px solid var(--b1);}

/* ── SALA EN VIVO — AuctionHub redesign ── */
/* Legacy wrap kept for backward compatibility */
.sala-wrap{display:grid;grid-template-columns:240px 1fr 260px;height:calc(100vh - 52px);overflow:hidden;}
.sala-sb{background:var(--s1);border-right:1px solid var(--b1);overflow-y:auto;display:flex;flex-direction:column;}
.sala-sbh{padding:.7rem 1rem;font-size:.68rem;font-weight:700;color:var(--wh2);border-bottom:1px solid var(--b1);letter-spacing:.02em;}
.lc{padding:.65rem .9rem;border-bottom:1px solid rgba(26,58,92,.4);cursor:pointer;transition:background .15s;}
.lc:hover{background:rgba(56,178,246,.06);}
.lc.on{background:rgba(56,178,246,.1);border-left:3px solid var(--ac);}
.lth{width:100%;height:74px;border-radius:6px;object-fit:cover;margin-bottom:.38rem;border:1px solid var(--b2);}
.lph{width:100%;height:74px;border-radius:6px;background:var(--s3);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;margin-bottom:.38rem;font-size:.7rem;font-weight:500;color:var(--mu);}
.ln{font-size:.62rem;font-weight:600;color:var(--mu);letter-spacing:.04em;text-transform:uppercase;margin-bottom:.12rem;}
.lnm{font-size:.78rem;font-weight:600;color:var(--wh2);line-height:1.3;margin-bottom:.25rem;}
.lpr{font-family:'Inter', sans-serif;font-size:.74rem;color:var(--ac);font-weight:500;}
.lbdg{display:inline-block;padding:.07rem .36rem;border-radius:4px;font-size:.6rem;font-weight:600;margin-top:.2rem;}
.blv{background:rgba(20,184,166,.1);color:var(--gr);}
.bsd{background:rgba(56,178,246,.12);color:var(--ac);}
.bwt{background:rgba(90,127,168,.07);color:var(--mu);}
.sala-main{padding:1.2rem 1.5rem;display:flex;flex-direction:column;gap:.95rem;overflow-y:auto;}

/* ── NEW AuctionHub layout ── */
.sala-wrap-new{display:flex;flex-direction:column;height:calc(100vh - 52px);overflow:hidden;background:var(--bg);}
.sala-header{display:flex;align-items:center;gap:1rem;padding:.65rem 1.25rem;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0;}
.sala-header h1{font-size:1rem;font-weight:800;color:var(--wh);margin:0;white-space:nowrap;}
.sala-body{display:grid;grid-template-columns:1fr 380px;gap:1.1rem;padding:1.1rem 1.25rem;flex:1;overflow:hidden;min-height:0;}

/* Left card */
.sala-left-card{background:var(--s2);border:1px solid var(--b1);border-radius:14px;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
.sala-live-badge{display:inline-flex;align-items:center;gap:.35rem;padding:.28rem .75rem;background:rgba(20,184,166,.15);color:var(--gr);border-radius:20px;font-size:.7rem;font-weight:700;letter-spacing:.04em;margin:.85rem auto 0;width:fit-content;}
.sala-lot-title{font-size:1.05rem;font-weight:800;color:var(--wh);text-align:center;padding:.5rem 1.1rem .3rem;line-height:1.25;}
.sala-photo-wrap{position:relative;background:var(--s3);margin:.4rem .85rem;border-radius:10px;overflow:hidden;height:220px;}
.sala-photo-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.sala-photo-placeholder{width:100%;height:100%;min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;}
.sala-timer{display:flex;align-items:center;justify-content:space-between;padding:.65rem 1.1rem .85rem;border-top:1px solid var(--b1);margin-top:.4rem;background:rgba(0,0,0,.04);flex-shrink:0;}
.sala-lotes-proximos{padding:.75rem .85rem .85rem;border-top:1px solid var(--b1);}
.sala-lotes-proximos-title{font-size:.72rem;font-weight:700;color:var(--wh2);margin-bottom:.55rem;letter-spacing:.01em;}
.sala-lotes-proximos-list{display:flex;flex-direction:column;gap:.35rem;max-height:220px;overflow-y:auto;}
.sala-lote-mini{display:flex;align-items:center;gap:.6rem;padding:.4rem .5rem;border-radius:8px;background:var(--s1);border:1px solid var(--b1);transition:all .15s;}
.sala-lote-mini.current{background:rgba(6,182,212,.07);border-color:rgba(6,182,212,.3);}
.sala-lote-mini.adj{opacity:.55;}
.sala-lote-mini-img{width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;}
.sala-lote-mini-noimg{width:36px;height:36px;border-radius:6px;background:var(--s3);display:flex;align-items:center;justify-content:center;color:var(--mu);flex-shrink:0;}
.sala-lote-mini-info{flex:1;min-width:0;}
.sala-lote-mini-num{font-size:.62rem;color:var(--mu);font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
.sala-lote-mini-name{font-size:.75rem;font-weight:600;color:var(--wh2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sala-lote-mini-status{flex-shrink:0;}
.sala-timer span:first-child{font-size:.72rem;font-weight:600;color:var(--mu2);}
.sala-timer-num{font-size:1.45rem;font-weight:800;letter-spacing:.04em;font-family:'Inter',monospace;}
.sala-timer-num.urgent{color:var(--yl);}
.sala-timer-num.critical{color:var(--rd);animation:losepulse .5s infinite;}
.sala-timer-num.safe{color:var(--gr);}

/* Right column */
.sala-right-col{display:flex;flex-direction:column;gap:.85rem;overflow-y:auto;min-height:0;}

/* Bid card */
.sala-bid-card{background:var(--s2);border:1px solid var(--b1);border-radius:14px;padding:1.1rem;flex-shrink:0;}
.sala-bid-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.85rem;}
.sala-bid-label{font-size:.65rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem;}
.sala-bid-amount{font-size:2.1rem;font-weight:800;color:var(--ac);line-height:1;letter-spacing:-.02em;transition:color .2s;}
.sala-bid-amount.flash{color:var(--acH);text-shadow:0 0 18px rgba(56,178,246,.45);}
.sala-livefeed-btn{display:flex;align-items:center;gap:.35rem;padding:.32rem .7rem;background:rgba(56,178,246,.1);border:1px solid rgba(56,178,246,.25);border-radius:7px;color:var(--ac);font-size:.68rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.sala-livefeed-btn:hover{background:rgba(56,178,246,.18);}
.sala-last-bids-title{font-size:.63rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;}
.sala-last-bids{display:flex;flex-direction:column;gap:.35rem;max-height:160px;overflow-y:auto;margin-bottom:.85rem;}
.sala-bid-row{display:flex;align-items:center;gap:.55rem;padding:.38rem .55rem;border-radius:7px;background:rgba(255,255,255,.025);border:1px solid var(--b1);}
.sala-bid-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;color:#fff;flex-shrink:0;background:var(--ac);}
.sala-bid-name{flex:1;font-size:.73rem;font-weight:600;color:var(--wh2);}
.sala-bid-tag{padding:.03rem .28rem;border-radius:3px;font-size:.55rem;font-weight:700;}
.sala-bid-tag.web{background:rgba(56,178,246,.15);color:var(--ac);}
.sala-bid-tag.pres{background:rgba(246,173,85,.15);color:var(--yl);}
.sala-bid-amount-sm{font-size:.8rem;font-weight:700;color:var(--ac);}
.sala-bid-time{font-size:.6rem;color:var(--mu);}
.sala-no-bids{padding:1rem;text-align:center;font-size:.72rem;color:var(--mu);}

/* Place bid / adjudicar button */
.sala-place-bid-btn{width:100%;padding:.8rem;background:var(--ac);border:none;border-radius:9px;font-size:.9rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;letter-spacing:.01em;}
.sala-place-bid-btn:hover:not(:disabled){background:var(--acH);transform:translateY(-1px);box-shadow:0 5px 18px rgba(56,178,246,.3);}
.sala-place-bid-btn:disabled{opacity:.3;cursor:not-allowed;}
.sala-place-bid-btn.adj{background:rgba(20,184,166,.15);color:var(--gr);border:1px solid rgba(20,184,166,.3);}
.sala-place-bid-btn.adj:hover:not(:disabled){background:rgba(20,184,166,.25);}

/* Quick bid row */
.sala-quick-bids{display:grid;grid-template-columns:repeat(4,1fr);gap:.55rem;flex-shrink:0;}
.sala-quick-card{border-radius:10px;padding:.7rem .6rem;display:flex;flex-direction:column;align-items:center;gap:.22rem;cursor:pointer;transition:all .15s;border:1px solid var(--b1);background:var(--s2);position:relative;overflow:hidden;}
.sala-quick-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;}
.sala-quick-card.c0::after{background:var(--ac);}
.sala-quick-card.c1::after{background:var(--yl);}
.sala-quick-card.c2::after{background:#a78bfa;}
.sala-quick-card.c3::after{background:var(--mu);}
.sala-quick-card:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,.25);}
.sala-quick-card:disabled{opacity:.3;cursor:not-allowed;transform:none;}
.sala-quick-label{font-size:.58rem;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;}
.sala-quick-amount{font-size:.88rem;font-weight:800;color:var(--wh2);}

/* Lots sidebar in new layout */
.sala-lots-sb{background:var(--s1);border-right:1px solid var(--b1);overflow-y:auto;display:flex;flex-direction:column;height:100%;}
.pz{position:relative;width:100%;height:215px;border-radius:10px;overflow:hidden;background:var(--s3);border:1px solid var(--b2);}
.pzimg{width:100%;height:100%;object-fit:cover;}
.pzph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;cursor:pointer;transition:background .2s;}
.pzph:hover{background:rgba(56,178,246,.05);}
.pzpt{font-size:.72rem;font-weight:500;color:var(--mu);}
.pzov{position:absolute;bottom:0;left:0;right:0;padding:.55rem .85rem;background:linear-gradient(transparent,rgba(0,0,0,.75));display:flex;justify-content:flex-end;}
.pzch{padding:.22rem .6rem;background:rgba(7,15,28,.8);border:1px solid var(--b2);border-radius:4px;font-size:.66rem;font-weight:600;color:var(--mu2);cursor:pointer;transition:border-color .15s;backdrop-filter:blur(4px);}
.pzch:hover{border-color:var(--ac);color:var(--ac);}
.hid{display:none;}
.ict{font-size:.68rem;font-weight:600;color:var(--ac);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.18rem;}
.itl{font-size:1.55rem;font-weight:800;color:var(--wh);line-height:1.1;margin-bottom:.22rem;letter-spacing:-.01em;}
.ids{font-size:.78rem;color:var(--mu2);line-height:1.55;}
.tm-card{background:var(--s2);border:1px solid var(--b2);border-radius:9px;padding:.85rem 1.15rem;}
.tmr{display:flex;align-items:center;justify-content:space-between;margin-bottom:.52rem;}
.tml{font-size:.65rem;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.1rem;}
.tmv{font-size:2rem;font-weight:800;letter-spacing:-.02em;line-height:1;transition:color .5s;}
.tmbg{height:3px;background:var(--b1);border-radius:2px;overflow:hidden;}
.tmfill{height:100%;border-radius:2px;transition:width 1s linear,background .5s;}
.tmst{font-size:.72rem;font-weight:600;margin-top:.15rem;}
.ba-card{background:var(--s2);border:1px solid var(--b2);border-radius:9px;padding:1.15rem;}
.bal{font-size:.65rem;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.18rem;}
.bap{font-size:2.5rem;font-weight:800;color:var(--wh);line-height:1;margin-bottom:.12rem;letter-spacing:-.02em;transition:color .2s;}
.bap.flash{color:var(--acH)!important;text-shadow:0 0 20px rgba(56,178,246,.5);}
.banl{font-size:.73rem;color:var(--mu);margin-bottom:.88rem;}
.banl span{color:var(--wh2);font-weight:600;}

/* BID RING */
.bid-ring-wrap{display:flex;align-items:center;gap:.85rem;margin-bottom:.88rem;padding:.75rem;background:rgba(56,178,246,.06);border:1px solid rgba(56,178,246,.18);border-radius:8px;}
.bid-ring-outer{position:relative;width:52px;height:52px;flex-shrink:0;}
.bid-ring-svg{transform:rotate(-90deg);}
.bid-ring-bg{fill:none;stroke:var(--b1);stroke-width:4;}
.bid-ring-fill{fill:none;stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset .9s linear,stroke .5s;}
.bid-ring-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;transition:color .5s;}
.bid-ring-label{font-size:.65rem;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.15rem;}
.bid-ring-next{font-size:1.2rem;font-weight:800;color:var(--wh);line-height:1;letter-spacing:-.01em;}
.bid-ring-inc{font-size:.66rem;color:var(--mu);margin-top:.1rem;}

/* BID BUTTONS */
.bb{width:100%;padding:.85rem;background:var(--ac);border:none;border-radius:8px;font-size:1rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;letter-spacing:.01em;}
.bb:hover:not(:disabled){background:var(--acH);transform:translateY(-2px);box-shadow:0 6px 20px rgba(56,178,246,.35);}
.bb:disabled{opacity:.22;cursor:not-allowed;}
.bb.sold{background:transparent;color:var(--ac);border:1px solid rgba(56,178,246,.3);}
.bb.view{background:rgba(90,127,168,.07);color:var(--mu);border:1px solid var(--b1);font-size:.76rem;cursor:default;}

.bb-winning{width:100%;padding:.9rem 1.1rem;background:linear-gradient(135deg,#14532d,#166534);border:1px solid rgba(34,197,94,.3);border-radius:9px;display:flex;align-items:center;gap:.7rem;animation:winpulse 2.5s infinite;}
@keyframes winpulse{0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,.15)}50%{box-shadow:0 0 0 5px rgba(34,197,94,.07)}}
.bw-icon{width:36px;height:36px;border-radius:50%;background:rgba(34,197,94,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.bw-check{width:18px;height:18px;border-radius:50%;background:var(--gr);display:flex;align-items:center;justify-content:center;}
.bw-text{flex:1;}
.bw-main{font-size:.95rem;font-weight:700;color:#fff;line-height:1;}
.bw-sub{font-size:.67rem;color:rgba(255,255,255,.65);margin-top:.15rem;}

.bb-losing{width:100%;padding:.82rem .95rem;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.3);border-radius:9px;display:flex;align-items:center;gap:.75rem;animation:losepulse 2s infinite;}
@keyframes losepulse{0%,100%{border-color:rgba(239,68,68,.3)}50%{border-color:rgba(239,68,68,.55)}}
.bl-alert{width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.95rem;}
.bl-text{flex:1;}
.bl-main{font-size:.85rem;font-weight:700;color:var(--rd);line-height:1;margin-bottom:.18rem;}
.bl-sub{font-size:.66rem;color:var(--mu);line-height:1.4;}
.bl-sub span{color:var(--wh2);font-weight:600;}
.bl-action{padding:.5rem .85rem;background:var(--ac);border:none;border-radius:7px;font-size:.8rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;flex-shrink:0;white-space:nowrap;}
.bl-action:hover{background:var(--acH);transform:translateY(-1px);}

.bst{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;margin-top:.65rem;}
.bsc{background:rgba(255,255,255,.03);border:1px solid var(--b1);border-radius:7px;padding:.52rem;text-align:center;}
.bsv{font-size:.88rem;font-weight:700;color:var(--wh);}
.bsl{font-size:.6rem;font-weight:500;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-top:.1rem;}

/* FEED */
.sala-feed{background:var(--s1);border-left:1px solid var(--b1);display:flex;flex-direction:column;}
.fdh{padding:.7rem 1rem;font-size:.7rem;font-weight:700;color:var(--wh2);border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:.42rem;letter-spacing:.01em;}
.fdl{flex:1;overflow-y:auto;padding:.25rem 0;}
.fdi{padding:.48rem .9rem;border-bottom:1px solid rgba(26,58,92,.4);animation:fdin .2s ease;}
@keyframes fdin{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.fdb{font-size:.73rem;font-weight:600;color:var(--wh2);margin-bottom:.07rem;}
.fdb.me{color:var(--gr);}
.fda{font-family:'Inter', sans-serif;font-size:.78rem;font-weight:500;color:var(--ac);}
.fdt{font-size:.62rem;color:var(--mu);}
.fde{padding:2rem;text-align:center;font-size:.7rem;color:var(--mu);}

/* CTRL */
.ctrl-tabs{display:flex;gap:.3rem;margin-bottom:.9rem;border-bottom:1px solid var(--b1);padding-bottom:0;}
.ctrl-tab{padding:.38rem .85rem;border:none;background:transparent;color:var(--mu);font-size:.74rem;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s;}
.ctrl-tab.on{color:var(--ac);border-bottom-color:var(--ac);}
.ctrl-tab:hover:not(.on){color:var(--mu2);}
.ctrl-grid{display:grid;grid-template-columns:1fr 1fr;gap:.9rem;}
.ctrl-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.15rem;}
.ctrl-card-title{font-size:.74rem;font-weight:700;color:var(--wh2);margin-bottom:.85rem;padding-bottom:.6rem;border-bottom:1px solid var(--b1);}
.asel{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:7px;color:var(--wh);font-size:.8rem;padding:.5rem .75rem;cursor:pointer;margin-bottom:.7rem;}
.asel:focus{outline:none;border-color:var(--ac);}
.inc-ctrl{background:rgba(56,178,246,.05);border:1px solid rgba(56,178,246,.15);border-radius:8px;padding:.85rem;margin-bottom:.7rem;}
.inc-title{font-size:.65rem;font-weight:700;color:var(--ac);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;}
.inc-cur-lbl{font-size:.64rem;font-weight:500;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.18rem;}
.inc-cur{font-size:1.4rem;font-weight:800;color:var(--wh);letter-spacing:-.01em;margin-bottom:.45rem;}
.inc-btns{display:flex;flex-wrap:wrap;gap:.28rem;}
.inc-btn{padding:.26rem .56rem;border-radius:5px;border:1px solid var(--b1);background:transparent;font-size:.66rem;font-weight:500;color:var(--mu);cursor:pointer;transition:all .15s;}
.inc-btn:hover{border-color:var(--ac);color:var(--ac);}
.inc-btn.on{background:rgba(56,178,246,.15);border-color:var(--ac);color:var(--ac);font-weight:700;}
.ab-list{display:flex;flex-direction:column;gap:.33rem;}
.ab{padding:.58rem .9rem;border-radius:7px;border:none;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s;}
.ab:disabled{opacity:.22;cursor:not-allowed;}
.ab.g{background:rgba(20,184,166,.1);color:var(--gr);border:1px solid rgba(20,184,166,.25);}
.ab.g:hover:not(:disabled){background:rgba(20,184,166,.18);}
.ab.y{background:rgba(246,173,85,.09);color:var(--yl);border:1px solid rgba(246,173,85,.25);}
.ab.y:hover:not(:disabled){background:rgba(246,173,85,.17);}
.ab.r{background:rgba(245,101,101,.09);color:var(--rd);border:1px solid rgba(245,101,101,.25);}
.ab.r:hover:not(:disabled){background:rgba(245,101,101,.17);}
.ab.bl{background:var(--ac);color:#fff;font-weight:700;}
.ab.bl:hover:not(:disabled){background:var(--acH);}
.st-row{display:flex;align-items:center;gap:.62rem;padding:.65rem;background:rgba(255,255,255,.025);border:1px solid var(--b1);border-radius:7px;margin-bottom:.6rem;}
.st-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.st-txt{font-size:.76rem;font-weight:600;}
.ls-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;}
.ls-card{background:rgba(255,255,255,.025);border:1px solid var(--b1);border-radius:7px;padding:.65rem;text-align:center;}
.ls-v{font-size:1rem;font-weight:800;color:var(--wh);line-height:1;}
.ls-l{font-size:.58rem;font-weight:500;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-top:.1rem;}
.bid-ticker{margin-top:.65rem;background:rgba(56,178,246,.06);border:1px solid rgba(56,178,246,.18);border-radius:7px;padding:.6rem;display:flex;align-items:center;gap:.55rem;transition:background .3s,border .3s;}
.bid-ticker.urgent{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);}
.bid-ticker.critical{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);animation:losepulse .5s infinite;}
.bt-num{font-size:1.35rem;font-weight:800;min-width:24px;text-align:center;transition:color .5s;}
.bt-info{font-size:.66rem;color:var(--mu);}
.bt-leader{font-size:.72rem;font-weight:600;color:var(--wh2);}

::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px;}

/* GARANTIAS */
.gar-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:.85rem;margin-bottom:1.3rem;}
.gar-step{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1rem 1.15rem;position:relative;overflow:hidden;}
.gar-step::after{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--sc,var(--ac));border-radius:10px 0 0 10px;}
.gar-step-n{font-size:.65rem;font-weight:700;color:var(--ac);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.22rem;}
.gar-step-v{font-size:1.55rem;font-weight:800;color:var(--wh);line-height:1;letter-spacing:-.01em;}
.gar-step-l{font-size:.68rem;color:var(--mu);margin-top:.12rem;}
.gar-info{background:rgba(56,178,246,.07);border:1px solid rgba(56,178,246,.2);border-radius:8px;padding:.75rem 1rem;margin-bottom:1.1rem;display:flex;align-items:flex-start;gap:.65rem;}
.gar-info-text{font-size:.76rem;color:var(--mu2);line-height:1.55;}
.gar-info-text strong{color:var(--wh2);}
.paleta-badge{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;background:var(--ac);color:#fff;font-size:.82rem;font-weight:800;flex-shrink:0;}
.paleta-none{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;background:var(--s3);color:var(--mu);font-size:.65rem;border:1px dashed var(--b2);flex-shrink:0;}
.p-aprobada{background:rgba(20,184,166,.1);color:var(--gr);border:1px solid rgba(20,184,166,.25);}
.p-devuelta{background:rgba(90,127,168,.1);color:var(--mu2);border:1px solid var(--b1);}

/* ADJUDICACIONES */
.adj-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.1rem 1.25rem;margin-bottom:.7rem;display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center;}
.adj-lote{font-size:.88rem;font-weight:700;color:var(--wh);margin-bottom:.2rem;}
.adj-postor{font-size:.73rem;color:var(--mu2);margin-bottom:.35rem;}
.adj-row{display:flex;gap:1.4rem;flex-wrap:wrap;}
.adj-item{display:flex;flex-direction:column;}
.adj-item-l{font-size:.6rem;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.1rem;}
.adj-item-v{font-size:.82rem;font-weight:700;color:var(--wh2);}
.adj-item-v.red{color:var(--rd);}
.adj-item-v.grn{color:var(--gr);}
.adj-actions{display:flex;flex-direction:column;gap:.4rem;align-items:flex-end;}
.p-saldo{background:rgba(246,173,85,.1);color:var(--yl);border:1px solid rgba(246,173,85,.25);}
.p-pagado{background:rgba(20,184,166,.1);color:var(--gr);border:1px solid rgba(20,184,166,.25);}
.exp-badge{display:inline-block;padding:.08rem .42rem;background:rgba(255,255,255,.04);border:1px solid var(--b1);border-radius:4px;font-family:'Inter', sans-serif;font-size:.62rem;color:var(--mu2);}
.role-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .6rem;border-radius:4px;font-size:.65rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
.role-badge.admin{background:rgba(246,173,85,.12);color:#f6ad55;border:1px solid rgba(246,173,85,.25);}
.role-badge.martillero{background:rgba(56,178,246,.12);color:#38B2F6;border:1px solid rgba(56,178,246,.25);}
.role-badge.comprador{background:rgba(20,184,166,.1);color:#14B8A6;border:1px solid rgba(20,184,166,.22);}

/* LIQUIDACIONES */
.liq-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1.1rem 1.25rem;margin-bottom:.7rem;}
.liq-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.75rem;}
.liq-lote{font-size:.9rem;font-weight:700;color:var(--wh);}
.liq-postor{font-size:.74rem;color:var(--mu2);margin-top:.08rem;}
.liq-body{display:grid;grid-template-columns:repeat(5,1fr);gap:.6rem;padding:.75rem;background:rgba(255,255,255,.025);border-radius:7px;border:1px solid var(--b1);margin-bottom:.75rem;}
.liq-item-l{font-size:.6rem;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.1rem;}
.liq-item-v{font-size:.82rem;font-weight:700;color:var(--wh2);}
.liq-item-v.ac{color:var(--ac);}
.liq-item-v.rd{color:var(--rd);}
.liq-item-v.gr{color:var(--gr);}
.liq-actions{display:flex;gap:.5rem;align-items:center;}
.sent-badge{display:inline-flex;align-items:center;gap:.28rem;padding:.18rem .55rem;border-radius:4px;font-size:.66rem;font-weight:600;background:rgba(20,184,166,.08);color:var(--gr);border:1px solid rgba(20,184,166,.22);}

/* DEVOLUCIONES */
.dev-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1rem 1.2rem;margin-bottom:.6rem;display:grid;grid-template-columns:1fr auto;gap:.9rem;align-items:center;}
.dev-name{font-size:.86rem;font-weight:700;color:var(--wh);margin-bottom:.1rem;}
.dev-sub{font-size:.72rem;color:var(--mu2);}
.dev-monto{font-family:'Inter', sans-serif;font-size:1rem;font-weight:700;color:var(--gr);margin-top:.15rem;}
.dev-actions{display:flex;gap:.4rem;flex-direction:column;align-items:flex-end;}

/* CHAT */
.chat-wrap{display:flex;flex-direction:column;height:100%;background:var(--s1);border-left:1px solid var(--b1);}
.chat-hdr{padding:.65rem .9rem;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.chat-hdr-t{font-size:.72rem;font-weight:700;color:var(--wh2);}
.chat-online{display:flex;align-items:center;gap:.3rem;font-size:.62rem;color:var(--gr);font-weight:600;}
.chat-body{flex:1;overflow-y:auto;padding:.4rem 0;}
.chat-msg{padding:.44rem .85rem;}
.chat-from{font-size:.62rem;font-weight:700;color:var(--mu2);margin-bottom:.07rem;}
.chat-from.m{color:var(--ac);}
.chat-from.s{color:var(--yl);}
.chat-text{font-size:.76rem;color:var(--wh2);line-height:1.4;}
.chat-text.sys{color:var(--yl);font-size:.7rem;font-style:italic;}
.chat-time{font-size:.58rem;color:var(--mu);margin-top:.04rem;}
.chat-input-row{padding:.55rem .7rem;border-top:1px solid var(--b1);display:flex;gap:.4rem;flex-shrink:0;}
.chat-inp{flex:1;background:rgba(255,255,255,.04);border:1px solid var(--b2);border-radius:6px;color:var(--wh2);font-size:.76rem;padding:.4rem .65rem;}
.chat-inp:focus{outline:none;border-color:var(--ac);}
.chat-inp::placeholder{color:var(--mu);}
.chat-send{padding:.38rem .72rem;background:var(--ac);border:none;border-radius:6px;color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;transition:background .15s;}
.chat-send:hover{background:var(--acH);}
.mod-tabs{display:flex;gap:.3rem;padding:.52rem .65rem;border-bottom:1px solid var(--b1);flex-shrink:0;}
.mod-tab{padding:.26rem .65rem;border-radius:5px;border:1px solid var(--b1);background:transparent;font-size:.65rem;font-weight:600;color:var(--mu);cursor:pointer;transition:all .15s;}
.mod-tab.on{background:rgba(56,178,246,.15);border-color:var(--ac);color:var(--ac);}
.mod-tab:hover:not(.on){border-color:var(--b2);color:var(--mu2);}

/* ── MOBILE RESPONSIVE ── */
.mob-hamburger{display:none;}
.mob-overlay{display:none;}

@media (max-width: 768px) {
  html,body{overflow:auto;height:auto;}
  .app{height:auto;min-height:100vh;overflow:visible;}

  /* Sidebar: hidden by default, shown as drawer */
  .sidebar{position:fixed;top:0;left:-280px;width:260px;height:100vh;z-index:500;transition:left .25s ease;box-shadow:4px 0 24px rgba(0,0,0,.35);}
  .sidebar.open{left:0;}

  /* Overlay behind drawer */
  .mob-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:499;opacity:0;pointer-events:none;transition:opacity .25s;}
  .mob-overlay.open{opacity:1;pointer-events:auto;}

  /* Hamburger button */
  .mob-hamburger{display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:transparent;border:1px solid var(--b2);border-radius:7px;cursor:pointer;flex-shrink:0;}

  /* Main wrap: full width */
  .main-wrap{width:100%;overflow:auto;height:auto;}
  .topbar{padding:0 .9rem;height:50px;}
  .topbar-title{font-size:.85rem;}
  .page{padding:.9rem .85rem;overflow:auto;height:auto;}

  /* Stat grid: 2 columns */
  .stat-grid{grid-template-columns:repeat(2,1fr);gap:.55rem;margin-bottom:.9rem;}
  .stat-val{font-size:1.3rem;}

  /* Charts: stack */
  .charts-row{grid-template-columns:1fr;gap:.55rem;}

  /* Tables: horizontal scroll */
  .table-card{overflow-x:auto;}
  table{min-width:500px;}
  th,td{padding:.45rem .7rem;font-size:.7rem;}

  /* Modal: full width */
  .ov{padding:.5rem;align-items:flex-end;}
  .modal{padding:1.2rem;border-radius:12px 12px 0 0;max-height:90vh;overflow-y:auto;}
  .modal.wide{max-width:100%;}
  .form-grid{grid-template-columns:1fr;}

  /* SALA EN VIVO */
  .sala-wrap{grid-template-columns:1fr;height:auto;overflow:visible;}
  /* Hide left lotes sidebar on mobile — too much space */
  .sala-sb{display:none;}
  .sala-main{padding:.75rem;gap:.6rem;overflow-y:visible;}

  /* Photo carousel: compact height */
  .sala-main > div[style*="grid-template-columns"] { grid-template-columns:1fr !important; gap:.5rem !important; }
  .sala-main > div[style*="grid-template-columns"] > div:last-child { display:none !important; }

  /* Lote info: tighter */
  .ict{font-size:.65rem;}
  .itl{font-size:1.2rem;}
  .ids{font-size:.72rem;}

  /* Tabs: full width */
  .ctrl-tabs{display:grid;grid-template-columns:1fr 1fr;gap:0;}
  .ctrl-tab{padding:.55rem .5rem;font-size:.76rem;text-align:center;border-radius:0;}
  .ctrl-tab:first-child{border-radius:7px 0 0 7px;border:1px solid var(--b1);}
  .ctrl-tab:last-child{border-radius:0 7px 7px 0;border:1px solid var(--b1);border-left:none;}
  .ctrl-tab.on{background:rgba(56,178,246,.12);}

  /* Control Martillero: single column */
  .ctrl-grid{grid-template-columns:1fr;gap:.6rem;}
  .ctrl-card{padding:.85rem;}

  /* Increment buttons: 3-column grid */
  .inc-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem;}
  .inc-btn{padding:.32rem .3rem;font-size:.68rem;text-align:center;}

  /* Postura presencial: stack inputs vertically */
  .sala-main .ctrl-card div[style*="display:\"flex\""][style*="gap:\".4rem\""],
  .sala-main .ctrl-card > div > div[style*="display:flex"][style*="gap:.4rem"] { flex-direction:column !important; }

  /* Action buttons */
  .ab-list{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;}
  .ab{font-size:.7rem;padding:.45rem .4rem;}
  .ab-list .ab.bl{grid-column:1/-1;}

  /* Live stats grid */
  .ls-grid{grid-template-columns:repeat(3,1fr);gap:.4rem;}

  /* Bid feed (right panel): hidden — feed is duplicated inside sala-main ctrl-card area */
  .sala-wrap > aside:last-child{display:none;}

  /* NEW AuctionHub layout — mobile */
  .sala-wrap-new{height:auto;overflow:visible;}
  .sala-body{grid-template-columns:1fr;overflow:visible;padding:.75rem;}
  .sala-left-card{min-height:280px;}
  .sala-photo-wrap{height:160px;}
  .sala-quick-bids{grid-template-columns:repeat(2,1fr);}
  .sala-right-col{overflow-y:visible;}
  .sala-bid-amount{font-size:1.6rem;}

  /* Vista Postor: centered big offer, full-width bid button */
  .ba-card{padding:.85rem;}
  .bap{font-size:2.4rem;text-align:center;}
  .bal{text-align:center;}
  .bb{padding:.82rem;font-size:.95rem;width:100%;}
  .banl{text-align:center;font-size:.7rem;}

  /* BidRing: smaller */
  .bid-ring-wrap{padding:.55rem;}
  .bid-ring-outer{width:44px;height:44px;}
  .bid-ring-svg{width:44px;height:44px;}
  .bid-ring-num{font-size:1rem;}
  .bid-ring-next{font-size:1rem;}

  /* Bid stats row */
  .bst{grid-template-columns:1fr 1fr;gap:.35rem;}
  .liq-body{grid-template-columns:repeat(2,1fr);}
  .btn-primary,.btn-sec,.btn-confirm{padding:.35rem .65rem;font-size:.72rem;}
  .notif{top:auto;bottom:1rem;right:.8rem;left:.8rem;text-align:center;}
}

@media (max-width: 480px) {
  .stat-grid{grid-template-columns:1fr 1fr;}
  .stat-val{font-size:1.15rem;}
  .bap{font-size:1.8rem;}
  /* Sala: very small screens */
  .itl{font-size:1.05rem;}
  .inc-btns{grid-template-columns:repeat(3,1fr);}
  .ab-list{grid-template-columns:1fr;}
  .ab-list .ab.bl{grid-column:auto;}
  .ctrl-tabs{grid-template-columns:1fr 1fr;}
  .bid-ring-wrap{flex-direction:column;align-items:flex-start;gap:.4rem;}
}
`;


// ── TOOLTIP ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="ctt"><div style={{color:"var(--mu)",marginBottom:".15rem",fontSize:".65rem"}}>{label}</div><div style={{color:"var(--ac)",fontWeight:700}}>{payload[0].value >= 10 ? `$${payload[0].value}M` : payload[0].value}</div></div>;
};

// ── BID RING ──────────────────────────────────────────────────────
const BidRing = ({ seconds, total, nextAmount, increment }) => {
  const r = 20, circ = 2 * Math.PI * r, offset = circ * (1 - seconds / total);
  const color = seconds > 8 ? "#14B8A6" : seconds > 4 ? "#f6ad55" : "#f56565";
  const urgent = seconds <= 5;
  const adjudicando = seconds <= 1;
  return (
    <div className="bid-ring-wrap" style={{
      background: urgent ? `rgba(${adjudicando?"239,68,68":"245,158,11"},.1)` : "rgba(56,178,246,.06)",
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
            ? <><div className="bid-ring-label" style={{color:"#f6ad55"}}>⚠ Última oportunidad</div>
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

// ── SVG ICONS ─────────────────────────────────────────────────────
const Icon = ({ name }) => {
  const icons = {
    dashboard: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
    remates:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 13L7 8M5 3l8 8-2 2-8-8z"/><path d="M11 1l4 4-1.5 1.5"/></svg>,
    lotes:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>,
    sala:      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
    postores:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2.2-5 5-5s5 2 5 5"/><circle cx="13" cy="5" r="2"/><path d="M13 8c1.5.5 2.5 2 2.5 4"/></svg>,
    factura:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>,
    vendedor:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/><path d="M11 8l2 2-2 2"/></svg>,
    reportes:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12l3-4 3 2 3-5 3 3"/><path d="M2 15h12"/></svg>,
    garantia:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 1L2 4v4c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V4z"/><path d="M5 8l2 2 4-4"/></svg>,
    adjudic:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8l2.5 2.5L11 5"/></svg>,
    liq:       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h4"/><path d="M9 11l2-2 2 2"/></svg>,
    dev:       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3v9M4 8l4 4 4-4"/><path d="M2 14h12"/></svg>,

  };
  return icons[name] || null;
};

// ─────────────────────────────────────────────────────────────────
// AUTH SYSTEM
// ─────────────────────────────────────────────────────────────────

// Mock credentials — replace with Supabase Auth in production
const USERS = [
  { id:"u1", email:"admin@grauction.cl",       password:"admin2026",      role:"admin",      name:"Max Ahumada",        casa:null,            casaNombre:"GR Auction Software" },
  { id:"u2", email:"martillero@rematesahumada.cl", password:"remates2026", role:"martillero", name:"Remates Ahumada",    casa:"remates-ahumada", casaNombre:"Remates Ahumada" },
  { id:"u3", email:"demo@casaderemates.cl",     password:"demo2026",       role:"martillero", name:"Casa Demo",          casa:"casa-demo",       casaNombre:"Casa Demo S.A." },
];

// Buyers enter with a paleta token — no password, just their code
// Format: CASA-PALETA, e.g. "RA-045"
const PALETAS_ACTIVAS = [
  { token:"RA-045", nombre:"Rodrigo Fuentes",    rut:"12.345.678-9", casa:"remates-ahumada", casaNombre:"Remates Ahumada" },
  { token:"RA-012", nombre:"Agricola Del Valle",  rut:"76.543.210-K", casa:"remates-ahumada", casaNombre:"Remates Ahumada" },
  { token:"RA-007", nombre:"Maria I. Torres",     rut:"9.876.543-2",  casa:"remates-ahumada", casaNombre:"Remates Ahumada" },
];

const AUTH_CSS = `

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh;
    background: #fff;
    display: flex;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Background grid */
  .auth-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(#e5e7eb 1px, transparent 1px),
      linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: .5;
    pointer-events: none;
  }

  /* Glow orb */
  .auth-root::after {
    content: '';
    position: absolute;
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(6,182,212,.08) 0%, transparent 70%);
    top: -200px; right: -100px;
    border-radius: 50%;
    pointer-events: none;
    animation: pulse 6s ease-in-out infinite alternate;
  }
  @keyframes pulse { from{opacity:.6; transform:scale(1)} to{opacity:1; transform:scale(1.12)} }

  /* Left branding panel */
  .auth-left {
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem 5rem;
    position: relative;
    z-index: 1;
  }
  .auth-left-tag {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    padding: .28rem .75rem;
    background: rgba(6,182,212,.1);
    border: 1px solid rgba(6,182,212,.25);
    border-radius: 4px;
    font-size: .68rem;
    font-weight: 600;
    color: #06B6D4;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-bottom: 2.5rem;
    width: fit-content;
  }
  .auth-left-tag-dot { width: 5px; height: 5px; background: #14B8A6; border-radius: 50%; animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  .auth-brand-title {
    font-family: 'Poppins', sans-serif;
    font-size: 3.6rem;
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1;
    letter-spacing: -.03em;
    margin-bottom: .6rem;
  }
  .auth-brand-title span { color: #06B6D4; }
  .auth-brand-sub {
    font-size: 1.05rem;
    color: #6b7280;
    font-weight: 400;
    margin-bottom: 3.5rem;
    line-height: 1.5;
  }

  .auth-features { display: flex; flex-direction: column; gap: .75rem; }
  .auth-feat {
    display: flex; align-items: center; gap: .75rem;
    padding: .65rem .9rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: .82rem; color: #6b7280;
    transition: all .2s;
  }
  .auth-feat:hover { background: rgba(6,182,212,.05); border-color: rgba(6,182,212,.3); color: #1a1a1a; }
  .auth-feat-icon { color: #06B6D4; flex-shrink: 0; }

  /* Right form panel */
  .auth-right {
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3rem;
    position: relative;
    z-index: 1;
    border-left: 1px solid #e5e7eb;
    background: #fff;
  }

  .auth-form-wrap {
    animation: slideUp .35s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

  .auth-form-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.65rem;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: .3rem;
  }
  .auth-form-sub { font-size: .8rem; color: #6b7280; margin-bottom: 2.2rem; line-height: 1.5; }

  /* Role selector */
  .role-tabs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .4rem;
    margin-bottom: 2rem;
    padding: .3rem;
    background: #f4f4f2;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }
  .role-tab {
    padding: .6rem .4rem;
    border: none;
    border-radius: 7px;
    background: transparent;
    cursor: pointer;
    transition: all .18s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .25rem;
  }
  .role-tab.active {
    background: #fff;
    box-shadow: 0 0 0 1px rgba(6,182,212,.35);
  }
  .role-tab-icon { display:flex; align-items:center; justify-content:center; color: #6b7280; transition: color .18s; }
  .role-tab.active .role-tab-icon { color: #06B6D4; }
  .role-tab-label { font-size: .62rem; font-weight: 600; color: #6b7280; letter-spacing: .03em; text-transform: uppercase; transition: color .18s; }
  .role-tab.active .role-tab-label { color: #06B6D4; }

  /* Form fields */
  .auth-field { margin-bottom: 1.1rem; }
  .auth-label { display: block; font-size: .7rem; font-weight: 600; color: #6b7280; letter-spacing: .05em; text-transform: uppercase; margin-bottom: .45rem; }
  .auth-input {
    width: 100%;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    color: #1a1a1a;
    font-size: .88rem;
    font-family: 'Inter', sans-serif;
    padding: .75rem 1rem;
    transition: all .18s;
    outline: none;
  }
  .auth-input:focus { border-color: #06B6D4; background: rgba(6,182,212,.04); box-shadow: 0 0 0 3px rgba(6,182,212,.1); }
  .auth-input::placeholder { color: #9ca3af; }
  .auth-input.mono { font-family: 'Inter', sans-serif; font-size: .95rem; letter-spacing: .12em; text-transform: uppercase; }
  .auth-input.error { border-color: #e05252; background: rgba(224,82,82,.05); }

  .auth-error {
    padding: .65rem .9rem;
    background: rgba(224,82,82,.08);
    border: 1px solid rgba(224,82,82,.25);
    border-radius: 7px;
    font-size: .77rem;
    color: #e05252;
    margin-bottom: 1.1rem;
    animation: shake .3s ease;
  }
  @keyframes shake { 0%,100%{transform:none} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

  .auth-submit {
    width: 100%;
    padding: .85rem;
    background: #06B6D4;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: .9rem;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all .18s;
    position: relative;
    overflow: hidden;
    margin-top: .4rem;
  }
  .auth-submit:hover { background: #0284C7; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6,182,212,.3); }
  .auth-submit:active { transform: none; }
  .auth-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  .auth-hint {
    margin-top: 1.5rem;
    padding: .75rem .9rem;
    background: rgba(6,182,212,.05);
    border: 1px solid rgba(6,182,212,.15);
    border-radius: 7px;
    font-size: .72rem;
    color: #6b7280;
    line-height: 1.55;
  }
  .auth-hint strong { color: #06B6D4; }

  /* Buyer token view */
  .buyer-info {
    padding: 1rem;
    background: rgba(20,184,166,.06);
    border: 1px solid rgba(20,184,166,.2);
    border-radius: 8px;
    margin-bottom: 1.2rem;
    font-size: .78rem;
    color: #4a9a7a;
    line-height: 1.6;
  }

  /* Role badge on logged in header */
  .role-badge {
    display: inline-flex; align-items: center; gap: .3rem;
    padding: .2rem .6rem; border-radius: 4px; font-size: .65rem; font-weight: 700;
    letter-spacing: .04em; text-transform: uppercase;
  }
  .role-badge.admin     { background: rgba(246,173,85,.12); color: #f6ad55; border: 1px solid rgba(246,173,85,.25); }
  .role-badge.martillero{ background: rgba(56,178,246,.12); color: #38B2F6; border: 1px solid rgba(56,178,246,.25); }
  .role-badge.comprador { background: rgba(20,184,166,.1);  color: #14B8A6; border: 1px solid rgba(20,184,166,.22); }

  @media (max-width: 900px) {
    .auth-root { overflow: auto; }
    .auth-left { display: none; }
    .auth-right { flex: 1; width: 100%; max-width: 100%; border-left: none; overflow-y: auto; height: auto; min-height: 100vh; padding: 2rem 1.5rem 3rem; }
  }
`;

function AuthScreen({ onLogin }) {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail,setForgotEmail]= useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { setError("Ingresa tu correo."); return; }
    setLoading(true); setError("");
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: "https://gestionderemates.cl/reset-password",
    });
    setForgotSent(true);
    setLoading(false);
  };

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authErr) { setError("Credenciales incorrectas."); setLoading(false); return; }
        // Buscar perfil — con fallback si no existe en tabla usuarios
        let sessionData = { id:data.user.id, email:data.user.email, name:"Admin", role:"admin", roles:["admin"], casa:null, casaNombre:"GR Auction Software", activo:true };
        try {
          const { data: perfil } = await supabase
            .from("usuarios")
            .select("*, casas(id, slug, nombre, licencia_estado, licencia_vence, licencia_plan)")
            .eq("id", data.user.id)
            .single();
          if (perfil) {
            const r = Array.isArray(perfil.roles) && perfil.roles.length > 0 ? perfil.roles[0] : "admin";
            if (!perfil.activo) { setError("Usuario inactivo. Contacta al administrador."); await supabase.auth.signOut(); setLoading(false); return; }
            // ── Verificar licencia (solo para no-admin GR) ──
            if (perfil.casas && r !== "admin") {
              const lic = perfil.casas.licencia_estado;
              const vence = perfil.casas.licencia_vence ? new Date(perfil.casas.licencia_vence) : null;
              const vencida = vence && vence < new Date();
              if (lic === "bloqueado") {
                setError("Acceso bloqueado. Contacta a GR Auction Software: contacto@gestionderemates.cl");
                await supabase.auth.signOut(); setLoading(false); return;
              }
              if (lic === "suspendido" || vencida) {
                setError("Tu licencia está suspendida o venció. Contacta a GR Auction Software para renovar.");
                await supabase.auth.signOut(); setLoading(false); return;
              }
            }
            sessionData = {
              id: data.user.id, email: data.user.email, name: perfil.nombre, role: r,
              roles: perfil.roles||[r], casa: perfil.casas?.slug||null,
              casaId: perfil.casas?.id||null,
              casaNombre: perfil.casas?.nombre||"GR Auction Software",
              licencia: perfil.casas?.licencia_estado||"activo",
              licenciaPlan: perfil.casas?.licencia_plan||"trial",
              licenciaVence: perfil.casas?.licencia_vence||null,
              activo: perfil.activo
            };
          }
        } catch(e) { /* usar fallback */ }
        // Si no tiene perfil en usuarios, verificar si es postor
        if (sessionData.name === "Admin" && sessionData.role === "admin") {
          try {
            const { data: postorRow } = await supabase
              .from("postores")
              .select("nombre, casas(nombre, slug)")
              .eq("user_id", data.user.id)
              .limit(1)
              .single();
            if (postorRow) {
              sessionData = {
                id: data.user.id, email: data.user.email,
                name: postorRow.nombre, role: "postor",
                roles: ["postor"],
                casa: postorRow.casas?.slug || null,
                casaNombre: postorRow.casas?.nombre || "",
                activo: true,
              };
            }
          } catch(e2) {}
        }
        onLogin(sessionData);
      }
    } catch(e) {
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{AUTH_CSS}</style>

      {/* Left branding */}
      <div className="auth-left">
        {/* GR Logo — full size version */}
        <div style={{display:"flex",alignItems:"center",gap:"18px",marginBottom:"1.5rem"}}>
          <svg width="64" height="64" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="rgba(56,178,246,.1)" stroke="rgba(56,178,246,.25)" strokeWidth="1"/>
            <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{fontFamily:"Inter,sans-serif",fontWeight:400,fontSize:".85rem",color:"#4a6a8a",letterSpacing:".12em",textTransform:"uppercase",marginTop:2}}>Auction Software</div>
        </div>

        <div className="auth-brand-sub" style={{whiteSpace:"nowrap"}}>La plataforma que moderniza los remates en Chile.</div>
        <div className="auth-features">
          {[
            ["Sala en vivo hibrida", "Presencial y online en un solo sistema"],
            ["Liquidaciones automaticas", "Se generan al instante al adjudicar"],
            ["Gestion de garantias", "Registro, aprobacion y devolucion"],
            ["Multi-empresa", "Cada casa de remates con su acceso"],
          ].map(([t,d]) => (
            <div className="auth-feat" key={t}>
              <svg className="auth-feat-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5l4 4 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span><strong style={{color:"#8ab4d4"}}>{t}</strong> — {d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {/* Logo */}
          <div style={{marginBottom:"2rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"18px",marginBottom:".6rem"}}>
              <svg width="64" height="64" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="8" fill="rgba(56,178,246,.1)" stroke="rgba(56,178,246,.25)" strokeWidth="1"/>
                <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              </svg>
              <div style={{fontFamily:"Inter,sans-serif",fontWeight:400,fontSize:".85rem",color:"#4a6a8a",letterSpacing:".12em",textTransform:"uppercase",marginTop:2}}>Auction Software</div>
            </div>
            <div style={{fontSize:"1.05rem",color:"#6b7280",lineHeight:1.5}}>Ingresa con tu correo y contraseña. El sistema te llevará a tu área según tu perfil.</div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label">Correo electronico</label>
            <input className={`auth-input${error?" error":""}`} type="email" placeholder="correo@empresa.cl"
              value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input className={`auth-input${error?" error":""}`} type="password" placeholder="••••••••"
              value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>

          <button className="auth-submit" onClick={handleLogin} disabled={loading}>
            {loading ? "Verificando..." : "Iniciar sesion"}
          </button>

          {/* Olvidé mi contraseña */}
          {!forgotMode && (
            <div style={{textAlign:"center",marginTop:"1rem"}}>
              <button style={{background:"none",border:"none",color:"#6b7280",fontSize:".82rem",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}
                onClick={()=>{setForgotMode(true);setError("");}}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {forgotMode && (
            <div style={{marginTop:"1.25rem",padding:"1.1rem",background:"rgba(6,182,212,.05)",border:"1px solid rgba(6,182,212,.15)",borderRadius:10}}>
              {forgotSent ? (
                <div style={{fontSize:".85rem",color:"#0891b2",textAlign:"center",lineHeight:1.6}}>
                  Revisa tu correo — te enviamos un link para recuperar tu contraseña.
                  <div style={{marginTop:".75rem"}}>
                    <button style={{background:"none",border:"none",color:"#6b7280",fontSize:".78rem",cursor:"pointer",textDecoration:"underline"}}
                      onClick={()=>{setForgotMode(false);setForgotSent(false);}}>Volver al inicio de sesión</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{fontSize:".78rem",fontWeight:600,color:"#374151",marginBottom:".6rem",textTransform:"uppercase",letterSpacing:".06em"}}>Recuperar contraseña</div>
                  <input
                    style={{width:"100%",padding:".7rem .9rem",border:"1.5px solid #d1d5db",borderRadius:8,fontFamily:"inherit",fontSize:".88rem",color:"#1a1a1a",outline:"none",marginBottom:".6rem"}}
                    type="email" placeholder="correo@empresa.cl"
                    value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&handleForgot()}
                  />
                  <div style={{display:"flex",gap:".5rem"}}>
                    <button style={{flex:1,padding:".65rem",background:"linear-gradient(135deg,#06B6D4,#14B8A6)",border:"none",borderRadius:8,color:"#fff",fontFamily:"inherit",fontSize:".85rem",fontWeight:700,cursor:"pointer"}}
                      onClick={handleForgot} disabled={loading}>
                      {loading ? "Enviando..." : "Enviar enlace"}
                    </button>
                    <button style={{padding:".65rem .9rem",background:"none",border:"1px solid #d1d5db",borderRadius:8,color:"#6b7280",fontFamily:"inherit",fontSize:".82rem",cursor:"pointer"}}
                      onClick={()=>{setForgotMode(false);setError("");}}>
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Buyer-facing view — sala pública simplificada para postores
function BuyerView({ user, onLogout }) {
  const [photoIdx,  setPhotoIdx]  = React.useState(0);
  const [watchlist, setWatchlist] = React.useState([]); // lote IDs favoritos
  const [tabView,   setTabView]   = React.useState("live"); // "live" | "catalogo"
  const [catFilter, setCatFilter] = React.useState("todos");
  const [searchQ,   setSearchQ]   = React.useState("");
  const intervalRef = React.useRef(null);

  // Estado en vivo sincronizado con Supabase Realtime
  const [loteActivo, setLoteActivo] = React.useState(null);
  const [historial,  setHistorial]  = React.useState([]);
  const [lotsCat,    setLotsCat]    = React.useState([]); // catálogo completo

  React.useEffect(() => {
    // Cargar catálogo de lotes
    supabase.from("lotes").select("*").eq("estado","disponible").order("orden")
      .then(({data}) => { if(data) setLotsCat(data); });

    // Suscribirse a la tabla de pujas en tiempo real
    const ch = supabase.channel("buyer-live")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"pujas"},(payload)=>{
        const p = payload.new;
        setHistorial(prev=>[{
          num: `P-${String(p.numero_postor).padStart(4,"0")}`,
          monto: p.monto,
          tiempo: new Date(p.hora||Date.now()).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),
        },...prev].slice(0,20));
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"lotes"},(payload)=>{
        const l = payload.new;
        if(l.estado==="en_subasta") setLoteActivo({...l, fotos: Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[])});
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  },[]);

  // Auto-avance carrusel
  const imgs = loteActivo?.fotos || [];
  React.useEffect(() => {
    if(imgs.length>1){
      intervalRef.current = setInterval(()=>setPhotoIdx(p=>(p+1)%imgs.length),4000);
    }
    return ()=>{ if(intervalRef.current) clearInterval(intervalRef.current); };
  },[imgs.length]);

  const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
  const toggleWatch = (id) => setWatchlist(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]);

  // Categorías del catálogo
  const categorias = ["todos",...new Set(lotsCat.map(l=>l.categoria).filter(Boolean))];
  const lotesFiltrados = lotsCat.filter(l=>{
    if(catFilter!=="todos"&&l.categoria!==catFilter) return false;
    if(searchQ&&!l.nombre.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const BUYER_CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d1117; }
    .bv-root { min-height: 100vh; background: #0d1117; font-family: 'Inter', sans-serif; color: #e0eaf4; }
    .bv-header { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.5rem; background: #1F2937; border-bottom: 1px solid rgba(255,255,255,.07); position: sticky; top: 0; z-index: 10; }
    .bv-casa { font-size: .82rem; font-weight: 700; color: #e0eaf4; }
    .bv-paleta { font-family: 'Inter', sans-serif; font-size: .75rem; background: rgba(56,178,246,.15); color: #38B2F6; border: 1px solid rgba(56,178,246,.3); padding: .18rem .55rem; border-radius: 4px; }
    .bv-logout { background: transparent; border: 1px solid rgba(255,255,255,.1); color: #4a6a8a; font-size: .72rem; padding: .3rem .7rem; border-radius: 5px; cursor: pointer; }
    .bv-tabs { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,.07); background: #1F2937; padding: 0 1.5rem; }
    .bv-tab { padding: .75rem 1.2rem; font-size: .78rem; font-weight: 600; color: #4a6a8a; cursor: pointer; border-bottom: 2px solid transparent; transition: all .15s; display: flex; align-items: center; gap: .4rem; }
    .bv-tab.on { color: #38B2F6; border-bottom-color: #38B2F6; }
    .bv-body { max-width: 820px; margin: 0 auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .bv-card { background: #1F2937; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; overflow: hidden; }
    .bv-card-header { padding: .7rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; justify-content: space-between; }
    .bv-card-title { font-size: .7rem; font-weight: 700; color: #38B2F6; letter-spacing: .06em; text-transform: uppercase; }
    .bv-card-body { padding: 1rem 1.1rem; }
    .bv-dot-live { width: 8px; height: 8px; border-radius: 50%; background: #14B8A6; animation: bv-pulse 1.5s infinite; display: inline-block; margin-right: .35rem; }
    @keyframes bv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    .bv-lote-nombre { font-size: 1.2rem; font-weight: 800; color: #e0eaf4; margin-bottom: .2rem; }
    .bv-lote-cat { font-size: .72rem; color: #4a6a8a; margin-bottom: .7rem; }
    .bv-lote-desc { font-size: .78rem; color: #5a7fa8; line-height: 1.6; }
    .bv-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .7rem; margin-top: .9rem; }
    .bv-stat { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; padding: .65rem .8rem; text-align: center; }
    .bv-stat-v { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700; color: #38B2F6; }
    .bv-stat-v.gr { color: #14B8A6; }
    .bv-stat-v.yl { color: #f6ad55; }
    .bv-stat-l { font-size: .62rem; color: #4a6a8a; margin-top: .15rem; text-transform: uppercase; letter-spacing: .04em; }
    .bv-hist-row { display: flex; align-items: center; justify-content: space-between; padding: .5rem 0; border-bottom: 1px solid rgba(255,255,255,.04); }
    .bv-hist-row:last-child { border-bottom: none; }
    .bv-hist-num { font-size: .75rem; font-weight: 600; color: #4a6a8a; font-family: 'Inter', sans-serif; }
    .bv-hist-monto { font-size: .8rem; font-weight: 700; color: #e0eaf4; font-family: 'Inter', sans-serif; }
    .bv-hist-time { font-size: .68rem; color: #364d70; font-family: 'Inter', sans-serif; }
    .bv-info { padding: .85rem 1.1rem; background: rgba(56,178,246,.05); border: 1px solid rgba(56,178,246,.12); border-radius: 10px; font-size: .76rem; color: #4a6a8a; line-height: 1.7; }
    /* Catálogo */
    .bv-search { width:100%; padding:.65rem .9rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:9px; color:#e0eaf4; font-family:'Inter',sans-serif; font-size:.85rem; outline:none; }
    .bv-search:focus { border-color:#38B2F6; }
    .bv-cat-pills { display:flex; gap:.5rem; flex-wrap:wrap; margin:.75rem 0; }
    .bv-cat-pill { padding:.3rem .75rem; border-radius:20px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.03); font-size:.72rem; font-weight:600; color:#4a6a8a; cursor:pointer; transition:all .15s; }
    .bv-cat-pill.on { background:rgba(56,178,246,.15); border-color:rgba(56,178,246,.4); color:#38B2F6; }
    .bv-lote-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.75rem; }
    @media(max-width:500px){ .bv-lote-grid{grid-template-columns:1fr;} }
    .bv-lote-card { background:#1F2937; border:1px solid rgba(255,255,255,.07); border-radius:11px; overflow:hidden; transition:border .15s; }
    .bv-lote-card:hover { border-color:rgba(56,178,246,.3); }
    .bv-lote-card.watched { border-color:rgba(246,173,85,.35); }
    .bv-lote-img { width:100%; height:140px; object-fit:cover; background:rgba(255,255,255,.03); display:flex; align-items:center; justify-content:center; }
    .bv-lote-info { padding:.75rem; }
    .bv-lote-card-name { font-size:.83rem; font-weight:700; color:#e0eaf4; margin-bottom:.3rem; line-height:1.3; }
    .bv-lote-card-base { font-size:.72rem; color:#4a6a8a; }
    .bv-lote-card-price { font-family:'Inter', sans-serif; font-size:.9rem; font-weight:700; color:#14B8A6; }
    .bv-watch-btn { background:transparent; border:none; cursor:pointer; padding:.2rem; color:#4a6a8a; transition:color .15s; }
    .bv-watch-btn.on { color:#f6ad55; }
    .bv-empty { text-align:center; padding:2rem; color:#4a6a8a; font-size:.82rem; }
    /* Esperando */
    .bv-waiting { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem 1.5rem; text-align:center; gap:1rem; }
    .bv-waiting-icon { width:64px; height:64px; border-radius:50%; background:rgba(56,178,246,.08); border:1px solid rgba(56,178,246,.2); display:flex; align-items:center; justify-content:center; }
  `;

  return (
    <div className="bv-root">
      <style>{BUYER_CSS}</style>

      {/* Header */}
      <div className="bv-header">
        <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
          <GRLogo/>
          <div style={{width:1,height:24,background:"rgba(255,255,255,.1)"}}/>
          <div className="bv-casa">{user.casaNombre}</div>
          <div className="bv-paleta">Paleta {user.token||user.numero||"—"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
          <span style={{fontSize:".72rem",color:"#14B8A6"}}><span className="bv-dot-live"/>En vivo</span>
          <button className="bv-logout" onClick={onLogout}>Salir</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bv-tabs">
        <div className={`bv-tab${tabView==="live"?" on":""}`} onClick={()=>setTabView("live")}>
          <span className="bv-dot-live" style={{width:6,height:6}}/>Subasta en vivo
        </div>
        <div className={`bv-tab${tabView==="catalogo"?" on":""}`} onClick={()=>setTabView("catalogo")}>
          Catálogo
          {watchlist.length>0&&<span style={{background:"rgba(246,173,85,.2)",color:"#f6ad55",fontSize:".6rem",fontWeight:700,padding:".05rem .35rem",borderRadius:10}}>★ {watchlist.length}</span>}
        </div>
      </div>

      <div className="bv-body">

        {/* ── TAB: EN VIVO ── */}
        {tabView==="live" && (<>
          <div className="bv-card">
            <div className="bv-card-header">
              <span className="bv-card-title">Lote en subasta</span>
              <span style={{fontSize:".68rem",color:"#4a6a8a",fontFamily:"Inter,sans-serif"}}>
                {loteActivo ? `Lote ${loteActivo.orden||"—"}` : "Esperando..."}
              </span>
            </div>
            {loteActivo ? (<>
              {/* Imagen */}
              <div style={{position:"relative",background:"#0d1117",height:260,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {imgs.length>0 ? (<>
                  <img src={imgs[photoIdx]} alt={loteActivo.nombre} style={{width:"100%",height:260,objectFit:"cover",display:"block"}}/>
                  {imgs.length>1&&(<>
                    <button onClick={()=>setPhotoIdx(p=>(p-1+imgs.length)%imgs.length)}
                      style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.6)",border:"none",borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 2L4 6l4 4"/></svg>
                    </button>
                    <button onClick={()=>setPhotoIdx(p=>(p+1)%imgs.length)}
                      style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.6)",border:"none",borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 2l4 4-4 4"/></svg>
                    </button>
                    <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
                      {imgs.map((_,i)=><div key={i} onClick={()=>setPhotoIdx(i)} style={{width:i===photoIdx?18:7,height:7,borderRadius:4,background:i===photoIdx?"#38B2F6":"rgba(255,255,255,.35)",cursor:"pointer",transition:"all .2s"}}/>)}
                    </div>
                  </>)}
                </>) : (
                  <div style={{textAlign:"center",color:"#364d70"}}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="4" y="8" width="32" height="24" rx="3"/><circle cx="20" cy="20" r="6"/><path d="M15 8l2.5-4h5L25 8"/></svg>
                    <div style={{fontSize:".75rem",marginTop:".5rem"}}>Sin fotos disponibles</div>
                  </div>
                )}
              </div>
              <div className="bv-card-body">
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                  <div style={{flex:1}}>
                    <div className="bv-lote-nombre">{loteActivo.nombre}</div>
                    <div className="bv-lote-cat">{loteActivo.categoria} {loteActivo.year?`· ${loteActivo.year}`:""}</div>
                    <div className="bv-lote-desc">{loteActivo.descripcion}</div>
                  </div>
                  <button className={`bv-watch-btn${watchlist.includes(loteActivo.id)?" on":""}`}
                    onClick={()=>toggleWatch(loteActivo.id)} title="Agregar a favoritos">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill={watchlist.includes(loteActivo.id)?"#f6ad55":"none"} stroke={watchlist.includes(loteActivo.id)?"#f6ad55":"#4a6a8a"} strokeWidth="1.8"><path d="M10 2l2.3 4.7L18 7.6l-4 3.9 1 5.5L10 14.5l-5 2.5 1-5.5-4-3.9 5.7-.9z"/></svg>
                  </button>
                </div>
                <div className="bv-stats">
                  <div className="bv-stat">
                    <div className="bv-stat-v gr">{fmt(historial[0]?.monto||loteActivo.base||0)}</div>
                    <div className="bv-stat-l">Puja actual</div>
                  </div>
                  <div className="bv-stat">
                    <div className="bv-stat-v yl">{historial.length}</div>
                    <div className="bv-stat-l">Pujas totales</div>
                  </div>
                  <div className="bv-stat">
                    <div className="bv-stat-v">{fmt(loteActivo.base||0)}</div>
                    <div className="bv-stat-l">Precio base</div>
                  </div>
                </div>
              </div>
            </>) : (
              <div className="bv-waiting">
                <div className="bv-waiting-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#38B2F6" strokeWidth="1.6" strokeLinecap="round"><circle cx="14" cy="14" r="11"/><path d="M14 8v6l4 3"/></svg>
                </div>
                <div style={{fontWeight:700,color:"#e0eaf4"}}>Esperando inicio del remate</div>
                <div style={{fontSize:".78rem",color:"#4a6a8a"}}>El martillero iniciará en breve. Puedes revisar el catálogo mientras tanto.</div>
                <button style={{padding:".5rem 1rem",background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.25)",borderRadius:8,color:"#38B2F6",fontSize:".78rem",fontWeight:600,cursor:"pointer"}}
                  onClick={()=>setTabView("catalogo")}>Ver catálogo →</button>
              </div>
            )}
          </div>

          {/* Historial de pujas */}
          {historial.length>0&&(
            <div className="bv-card">
              <div className="bv-card-header">
                <span className="bv-card-title">Historial de pujas</span>
                <span style={{fontSize:".68rem",color:"#14B8A6"}}>{historial.length} pujas</span>
              </div>
              <div className="bv-card-body">
                {historial.map((h,i)=>(
                  <div key={i} className="bv-hist-row">
                    <span className="bv-hist-num">{h.num}</span>
                    <span className="bv-hist-monto">{fmt(h.monto)}</span>
                    <span className="bv-hist-time">{h.tiempo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bv-info">
            Para pujar, levanta tu paleta en la sala presencial o comunícate con el martillero. Las liquidaciones serán enviadas a tu correo al finalizar el remate.
          </div>
        </>)}

        {/* ── TAB: CATÁLOGO ── */}
        {tabView==="catalogo" && (<>
          <input className="bv-search" placeholder="Buscar por nombre..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
          <div className="bv-cat-pills">
            {categorias.map(c=>(
              <div key={c} className={`bv-cat-pill${catFilter===c?" on":""}`} onClick={()=>setCatFilter(c)}>
                {c==="todos"?"Todos":c}
                {c!=="todos"&&watchlist.filter(id=>lotsCat.find(l=>l.id===id&&l.categoria===c)).length>0&&
                  <span style={{marginLeft:".3rem",color:"#f6ad55"}}>★</span>}
              </div>
            ))}
            {watchlist.length>0&&(
              <div className={`bv-cat-pill${catFilter==="favoritos"?" on":""}`} onClick={()=>setCatFilter(catFilter==="favoritos"?"todos":"favoritos")}
                style={{borderColor:"rgba(246,173,85,.3)",color:"#f6ad55"}}>
                ★ Mis favoritos ({watchlist.length})
              </div>
            )}
          </div>

          {lotesFiltrados.length===0&&catFilter==="favoritos"&&watchlist.length===0 ? (
            <div className="bv-empty">No tienes lotes marcados como favoritos.<br/>Haz click en ★ en cualquier lote para agregarlo.</div>
          ) : lotesFiltrados.length===0 ? (
            <div className="bv-empty">No hay lotes que coincidan con tu búsqueda.</div>
          ) : (
            <div className="bv-lote-grid">
              {(catFilter==="favoritos"?lotesFiltrados.filter(l=>watchlist.includes(l.id)):lotesFiltrados).map(lote=>(
                <div key={lote.id} className={`bv-lote-card${watchlist.includes(lote.id)?" watched":""}`}>
                  <div className="bv-lote-img">
                    {lote.fotos?.[0]
                      ? <img src={lote.fotos[0]} alt={lote.nombre} style={{width:"100%",height:140,objectFit:"cover"}}/>
                      : <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#364d70" strokeWidth="1.3"><rect x="3" y="6" width="26" height="20" rx="3"/><circle cx="16" cy="16" r="5"/></svg>}
                  </div>
                  <div className="bv-lote-info">
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:".5rem"}}>
                      <div className="bv-lote-card-name">{lote.nombre}</div>
                      <button className={`bv-watch-btn${watchlist.includes(lote.id)?" on":""}`} onClick={()=>toggleWatch(lote.id)}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill={watchlist.includes(lote.id)?"#f6ad55":"none"} stroke={watchlist.includes(lote.id)?"#f6ad55":"#4a6a8a"} strokeWidth="1.8"><path d="M10 2l2.3 4.7L18 7.6l-4 3.9 1 5.5L10 14.5l-5 2.5 1-5.5-4-3.9 5.7-.9z"/></svg>
                      </button>
                    </div>
                    <div className="bv-lote-card-base">{lote.categoria} {lote.year?`· ${lote.year}`:""}</div>
                    <div style={{marginTop:".5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:".6rem",color:"#4a6a8a",marginBottom:".1rem"}}>Base</div>
                        <div className="bv-lote-card-price">{fmt(lote.base||0)}</div>
                      </div>
                      <span style={{fontSize:".62rem",padding:".15rem .45rem",borderRadius:5,background:"rgba(56,178,246,.1)",color:"#38B2F6",fontWeight:700,border:"1px solid rgba(56,178,246,.2)"}}>
                        {lote.estado||"disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

      </div>
    </div>
  );
}

// ── Spotter View (digitador en sala) ─────────────────────────────
function SpotterView({ user, onLogout }) {
  const [loteIdx,  setLoteIdx]  = React.useState(0);
  const [lots,     setLots]     = React.useState([]);
  const [monto,    setMonto]    = React.useState("");
  const [paleta,   setPaleta]   = React.useState("");
  const [ultPujas, setUltPujas] = React.useState([]);
  const [notif,    setNotif]    = React.useState(null);
  const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
  const notify = (msg) => { setNotif(msg); setTimeout(()=>setNotif(null),3000); };

  React.useEffect(()=>{
    supabase.from("lotes").select("*").eq("estado","en_subasta").order("orden")
      .then(({data})=>{ if(data&&data.length) setLots(data); });
    // Realtime: nuevo lote en subasta
    const ch = supabase.channel("spotter")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"lotes"},(p)=>{
        if(p.new.estado==="en_subasta") setLots(prev=>{
          const ex = prev.find(l=>l.id===p.new.id);
          return ex?prev.map(l=>l.id===p.new.id?p.new:l):[...prev,p.new];
        });
      }).subscribe();
    return ()=>supabase.removeChannel(ch);
  },[]);

  const lote = lots[loteIdx];

  const registrarPuja = async () => {
    if(!monto||!paleta){ notify("Ingresa paleta y monto"); return; }
    const montoNum = parseInt(monto.replace(/\D/g,""));
    if(!montoNum){ notify("Monto inválido"); return; }
    await supabase.from("pujas").insert({
      lote_id: lote?.id||null,
      remate_id: lote?.remate_id||null,
      numero_postor: parseInt(paleta)||0,
      monto: montoNum,
      tipo: "presencial",
    });
    setUltPujas(p=>[{paleta,monto:fmt(montoNum),hora:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit",second:"2-digit"})},...p].slice(0,10));
    notify(`✓ Puja registrada — Paleta ${paleta} · ${fmt(montoNum)}`);
    setMonto(""); setPaleta("");
  };

  const SP_CSS = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:#0d1117;}
    .sp-root{min-height:100vh;background:#0d1117;font-family:'Inter',sans-serif;color:#e0eaf4;display:flex;flex-direction:column;}
    .sp-header{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.5rem;background:#1F2937;border-bottom:1px solid rgba(255,255,255,.07);}
    .sp-body{flex:1;max-width:600px;width:100%;margin:0 auto;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;}
    .sp-lote-sel{display:flex;flex-direction:column;gap:.4rem;}
    .sp-input{width:100%;padding:.85rem 1rem;background:#1F2937;border:2px solid rgba(255,255,255,.1);border-radius:10px;color:#e0eaf4;font-family:'Inter', sans-serif;font-size:1.1rem;font-weight:700;outline:none;text-align:center;letter-spacing:.05em;}
    .sp-input:focus{border-color:#38B2F6;}
    .sp-input.big{font-size:1.5rem;padding:1.1rem 1rem;}
    .sp-label{font-size:.68rem;font-weight:700;color:#4a6a8a;text-transform:uppercase;letter-spacing:.07em;text-align:center;}
    .sp-btn{width:100%;padding:1rem;background:#38B2F6;border:none;border-radius:11px;color:#fff;font-size:1rem;font-weight:800;cursor:pointer;transition:all .15s;letter-spacing:.02em;}
    .sp-btn:hover{background:#1d6fd8;transform:translateY(-1px);}
    .sp-btn:active{transform:none;}
    .sp-hist-row{display:flex;align-items:center;justify-content:space-between;padding:.55rem .75rem;background:rgba(255,255,255,.02);border-radius:7px;margin-bottom:.35rem;}
    .sp-notif{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#14B8A6;color:#1F2937;font-weight:700;padding:.65rem 1.3rem;border-radius:8px;font-size:.85rem;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,.3);}
  `;

  return (
    <div className="sp-root">
      <style>{SP_CSS}</style>
      {notif&&<div className="sp-notif">{notif}</div>}

      <div className="sp-header">
        <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
          <GRLogo/>
          <span style={{fontSize:".78rem",fontWeight:700,color:"#7a9ab8"}}>Digitador de sala</span>
        </div>
        <button style={{background:"transparent",border:"1px solid rgba(255,255,255,.1)",color:"#4a6a8a",fontSize:".72rem",padding:".3rem .7rem",borderRadius:5,cursor:"pointer"}} onClick={onLogout}>Salir</button>
      </div>

      <div className="sp-body">
        {/* Selector de lote */}
        <div style={{background:"#1F2937",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"1rem"}}>
          <div style={{fontSize:".65rem",fontWeight:700,color:"#4a6a8a",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".5rem"}}>Lote en subasta</div>
          {lots.length>0 ? (
            <select style={{width:"100%",padding:".65rem .9rem",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#e0eaf4",fontSize:".85rem",fontFamily:"'Inter',sans-serif"}}
              value={loteIdx} onChange={e=>setLoteIdx(Number(e.target.value))}>
              {lots.map((l,i)=><option key={l.id} value={i}>{l.codigo||`Lote ${i+1}`} — {l.nombre}</option>)}
            </select>
          ) : (
            <div style={{textAlign:"center",color:"#4a6a8a",fontSize:".82rem",padding:".5rem"}}>Esperando que el martillero inicie el remate...</div>
          )}
          {lote&&<div style={{marginTop:".6rem",fontSize:".75rem",color:"#38B2F6",fontFamily:"'Inter', sans-serif",textAlign:"center",fontWeight:700}}>Base: {fmt(lote.base||0)}</div>}
        </div>

        {/* Registro de puja */}
        <div style={{background:"#1F2937",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"1.2rem",display:"flex",flexDirection:"column",gap:".85rem"}}>
          <div className="sp-lote-sel">
            <label className="sp-label">N° Paleta</label>
            <input className="sp-input big" placeholder="045" value={paleta}
              onChange={e=>setPaleta(e.target.value.replace(/\D/g,""))}
              onKeyDown={e=>e.key==="Enter"&&document.getElementById("sp-monto")?.focus()}/>
          </div>
          <div className="sp-lote-sel">
            <label className="sp-label">Monto ofertado</label>
            <input id="sp-monto" className="sp-input big" placeholder="$0" value={monto}
              onChange={e=>setMonto(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&registrarPuja()}/>
          </div>
          <button className="sp-btn" onClick={registrarPuja} disabled={!lote}>
            ✓ Registrar puja
          </button>
        </div>

        {/* Últimas pujas registradas */}
        {ultPujas.length>0&&(
          <div style={{background:"#1F2937",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"1rem"}}>
            <div style={{fontSize:".65rem",fontWeight:700,color:"#4a6a8a",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".65rem"}}>Últimas pujas registradas</div>
            {ultPujas.map((p,i)=>(
              <div key={i} className="sp-hist-row">
                <span style={{fontFamily:"'Inter', sans-serif",fontWeight:700,color:"#38B2F6",fontSize:".8rem"}}>Paleta {p.paleta}</span>
                <span style={{fontFamily:"'Inter', sans-serif",fontWeight:700,color:"#e0eaf4",fontSize:".85rem"}}>{p.monto}</span>
                <span style={{fontSize:".68rem",color:"#4a6a8a"}}>{p.hora}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root entry point ──────────────────────────────────────────────
export default function Root() {
  const [session,  setSession]  = useState(null);
  const [loading,  setLoading]  = useState(true);  // espera chequeo de sesión

  // Siempre pedir login al cargar — cerrar cualquier sesión previa
  useEffect(() => {
    supabase.auth.signOut().then(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") setSession(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (uid) => {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("*, casas(slug, nombre)")
        .eq("id", uid)
        .single();
      if (!data) return { id:uid, name:"Admin", role:"admin", casa:null, casaNombre:"GR Auction Software", activo:true };
      const role = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles[0] : "martillero";
      return {
        id:         uid,
        name:       data.nombre,
        role:       role,
        roles:      data.roles || [],
        casa:       data.casas?.slug   || null,
        casaNombre: data.casas?.nombre || "GR Auction Software",
        activo:     data.activo,
      };
    } catch(e) {
      // Si falla Supabase, dar acceso igual con rol admin
      return { id:uid, name:"Admin", role:"admin", casa:null, casaNombre:"GR Auction Software", activo:true };
    }
  };

  const handleLogin  = (user) => setSession(user);
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  if (loading) return null;
  if (!session) return <AuthScreen onLogin={handleLogin}/>;
  if (session.role === "postor")    { if (typeof window !== "undefined") window.location.href = "/postor"; return null; }
  if (session.role === "comprador") return <BuyerView user={session} onLogout={handleLogout}/>;
  if (session.role === "spotter")   return <SpotterView user={session} onLogout={handleLogout}/>;
  return <Dashboard session={session} onLogout={handleLogout}/>;
}

// ─────────────────────────────────────────────────────────────────
function Dashboard({ session, onLogout }) {
  const [page,       setPage]       = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notif,      setNotif]      = useState(null);
  const [modal,      setModal]      = useState(null);
  const [filterTab,  setFilterTab]  = useState("todos");
  // Nuevo lote form state
  const [loteForm,   setLoteForm]   = useState({ tipoRemate:"judicial", motorizado:false, comCustom:"" });
  // Lote wizard multi-step state
  const [wizStep,    setWizStep]    = useState(1);
  const [wizTipo,    setWizTipo]    = useState(null);   // "MUEBLES"|"VEHICULOS"|"INMUEBLES"
  const [wizVehTipo, setWizVehTipo] = useState("");
  const [wizFotos,   setWizFotos]   = useState({frente:null,izq:null,der:null,trasera:null});
  const [wizItems,   setWizItems]   = useState([{id:1,nombre:"",foto:null}]);
  const [wizDocs,    setWizDocs]    = useState([]);
  const [wizDatos, setWizDatos] = useState({nombre:"",exp:"",mandante:"",propietario:"",patente:"",year:"",km:"",color:"",rolSII:"",superficie:"",base:"",minimo:"",incremento:"",descripcion:"",ubicacion:"",remateId:""});
  const resetWiz = () => { setWizStep(1); setWizTipo(null); setWizVehTipo(""); setWizFotos({frente:null,izq:null,der:null,trasera:null}); setWizItems([{id:1,nombre:"",foto:null}]); setWizDocs([]); setLoteForm({ tipoRemate:"judicial", motorizado:false, comCustom:"" }); setWizDatos({nombre:"",exp:"",mandante:"",propietario:"",patente:"",year:"",km:"",color:"",rolSII:"",superficie:"",base:"",minimo:"",incremento:"",descripcion:"",ubicacion:"",remateId:""}); };

  // ── Retiro de bienes ──
  const [dbRetiros, setDbRetiros] = useState([]);
  const [retiroFiltroRemate, setRetiroFiltroRemate] = useState(null);
  // Liquidaciones agrupadas por comprador para revisión post-remate
  const [liqReview,  setLiqReview]  = useState(null);  // null | { compradores: [...] }
  const [liqExpanded,setLiqExpanded]= useState(null);  // nComprador expandido
  const [selectedRemate, setSelectedRemate] = useState(null); // remate seleccionado en post-remate
  const [adminClienteSel, setAdminClienteSel] = useState(null); // cliente seleccionado en panel admin

  // ── Usuarios (solo admin GR) ──
  const ROLES_DISPONIBLES = ["admin","martillero","spotter","postremate","garantias","solo lectura"];
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioForm, setUsuarioForm] = useState({id:null,nombre:"",usuario:"",email:"",pass:"",roles:[],casa:"Remates Ahumada",activo:true});
  const [usuarioModal, setUsuarioModal] = useState(false); // false | "crear" | "editar"
  const resetUsuarioForm = () => setUsuarioForm({id:null,nombre:"",usuario:"",email:"",pass:"",roles:[],casa:"Remates Ahumada",activo:true});

  // ── Formulario nuevo remate ──
  const [remateForm, setRemateForm] = useState({nombre:"",fecha:"",hora:"10:00",modalidad:"Híbrido",tipo:"judicial",comCustom:"",estado:"activo"});
  const resetRemateForm = () => setRemateForm({nombre:"",fecha:"",hora:"10:00",modalidad:"Híbrido",tipo:"judicial",comCustom:"",estado:"activo"});

  // ── Remate activo en sala en vivo ──
  const [salaRemateId, setSalaRemateId] = useState(null);
  // ── Filtro de remate en módulo lotes ──
  const [lotesFiltroRemate, setLotesFiltroRemate] = useState(null);

  // ── Formulario nuevo postor (módulo Postores) ──
  const [postorForm, setPostorForm] = useState({nombre:"",rut:"",email:"",telefono:"",tipo:"natural",empresa:"",garantia:300000});
  const resetPostorForm = () => setPostorForm({nombre:"",rut:"",email:"",telefono:"",tipo:"natural",empresa:"",garantia:300000});
  const [postorModal, setPostorModal] = useState(false);

  // ── IA: Descripción de lote ──
  const [aiLoteModal,   setAiLoteModal]   = useState(false);
  const [aiLoteImg,     setAiLoteImg]     = useState(null);      // { base64, mediaType, preview }
  const [aiLoteName,    setAiLoteName]    = useState("");
  const [aiLoteCat,     setAiLoteCat]     = useState("");
  const [aiLoteResult,  setAiLoteResult]  = useState(null);      // { titulo, descripcion }
  const [aiLoteLoading, setAiLoteLoading] = useState(false);

  // ── IA: Resumen post-remate ──
  const [aiRemateModal,   setAiRemateModal]   = useState(null);  // null | remate object
  const [aiRemateResult,  setAiRemateResult]  = useState(null);  // { resumen, destacados, conclusion }
  const [aiRemateLoading, setAiRemateLoading] = useState(false);

  // ── Licencias (solo admin GR) ──
  const [dbLicencias, setDbLicencias] = useState([]);
  // ── Casas (solo admin GR) ──
  const [casaForm, setCasaForm] = useState({nombre:"",email:"",telefono:"",direccion:"",logoFile:null,logoUrl:null,martillero:"",rutMartillero:"",telefonoMartillero:"",emailMartillero:"",direccionMartillero:""});
  const [casaModal, setCasaModal] = useState(false);
  const [logoUploading, setLogoUploading] = useState(null); // casa.id mientras sube
  const resetCasaForm = () => setCasaForm({nombre:"",email:"",telefono:"",direccion:"",logoFile:null,logoUrl:null,martillero:"",rutMartillero:"",telefonoMartillero:"",emailMartillero:"",direccionMartillero:""});

  const subirLogoCasa = async (casaId, slug, file) => {
    if (!file) return;
    setLogoUploading(casaId);
    try {
      const ext  = file.name.split(".").pop();
      const path = `logos/${slug}.${ext}`;
      const { data: upData, error: upErr } = await supabase.storage
        .from("logos").upload(path, file, { upsert: true });
      if (upErr) { notify("Error subiendo logo: " + upErr.message, "inf"); return; }
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const logoUrl = urlData?.publicUrl || null;
      const { error: dbErr } = await supabase.from("casas").update({ logo_url: logoUrl }).eq("id", casaId);
      if (dbErr) { notify("Error guardando logo.", "inf"); return; }
      setDbLicencias(prev => prev.map(c => c.id === casaId ? { ...c, logo_url: logoUrl } : c));
      notify("✓ Logo actualizado.", "sold");
    } finally {
      setLogoUploading(null);
    }
  };

  useEffect(() => {
    if (session?.role !== "admin") return;
    supabase.from("casas").select("*").order("nombre").then(({data}) => {
      if (data) setDbLicencias(data);
    });
  }, [session]);

  const actualizarLicencia = async (casaId, estado) => {
    const {error} = await supabase.from("casas").update({licencia_estado: estado}).eq("id", casaId);
    if (!error) {
      setDbLicencias(prev => prev.map(c => c.id===casaId ? {...c, licencia_estado:estado} : c));
      notify(`Licencia ${estado === "activo" ? "activada" : estado === "suspendido" ? "suspendida" : "bloqueada"}.`, estado==="activo"?"sold":"inf");
    }
  };

  const renovarLicencia = async (casaId, fecha) => {
    if (!fecha) return;
    const {error} = await supabase.from("casas").update({licencia_vence: fecha}).eq("id", casaId);
    if (!error) {
      setDbLicencias(prev => prev.map(c => c.id===casaId ? {...c, licencia_vence:fecha} : c));
      notify("Fecha de vencimiento actualizada.","sold");
    }
  };

  const cambiarPlan = async (casaId, plan) => {
    const {error} = await supabase.from("casas").update({licencia_plan: plan}).eq("id", casaId);
    if (!error) setDbLicencias(prev => prev.map(c => c.id===casaId ? {...c, licencia_plan:plan} : c));
  };

  const guardarNota = async (casaId, nota) => {
    await supabase.from("casas").update({notas_admin: nota}).eq("id", casaId);
  };
  const [dbRemates,   setDbRemates]   = useState([]);
  const [dbLotes,     setDbLotes]     = useState([]);
  const [dbPostores,  setDbPostores]  = useState([]);
  const [dbLoading,   setDbLoading]   = useState(false);

  // Merge: usa datos de Supabase si hay, fallback a mock
  const REMATES_MERGED = dbRemates.length > 0 ? dbRemates.map(r => ({
    id:         r.codigo || r.id,
    name:       r.nombre,
    fecha:      new Date(r.fecha).toLocaleDateString("es-CL",{day:"2-digit",month:"short",year:"numeric"}),
    hora:       r.hora||"",
    lotes:      r.total_lotes || 0,
    modal:      r.modalidad,
    estado:     r.estado,
    recaudado:  r.total_recaudado || 0,
    casa:       r.casa_nombre || "",
    supabaseId: r.id,
  })) : REMATES;

  const LOTES_MERGED = dbLotes.length > 0 ? dbLotes.map(l => ({
    id:      l.codigo || l.id,
    name:    l.nombre,
    cat:     l.categoria,
    base:    l.base,
    min:     l.minimo,
    com:     l.comision,
    estado:  l.estado,
    supabaseId: l.id,
    remateId:   l.remate_id,
  })) : LOTES;

  const POSTORES_MERGED = dbPostores.length > 0 ? dbPostores.map(p => ({
    id:             `P-${String(p.numero).padStart(4,"0")}`,
    nComprador:     p.numero,
    name:           p.nombre,
    rut:            p.rut,
    email:          p.email,
    tel:            p.telefono,
    estado:         p.estado,
    modalidad:      p.modalidad,
    comprobante_url:p.comprobante_url,
    banco:          p.banco,
    suscrito:       p.suscrito,
    supabaseId:     p.id,
    remateId:       p.remate_id,
    remate_id:      p.remate_id,
    pujas:          0,
    remates:        1,
  })) : POSTORES;

  // ── Auction state ──────────────────────────────────────────────
  const [lots,        setLots]        = useState(LOTES_SALA);
  const [idx,         setIdx]         = useState(0);
  const [bids,        setBids]        = useState(LOTES_SALA.map(l => ({ current:l.base, count:0, history:[], status:"waiting", winner:null })));
  const [aState,      setAState]      = useState("waiting");
  const [timeLeft,    setTimeLeft]    = useState(120);
  const [bidTimer,    setBidTimer]    = useState(null);
  const [lastBidder,  setLastBidder]  = useState(null);
  const [curInc,      setCurInc]      = useState(100000);
  const [customMonto, setCustomMonto] = useState("");
  const [presPaleta,  setPresPaleta]  = useState("");
  const [presMonto,   setPresMonto]   = useState("");
  const [flash,       setFlash]       = useState(false);
  const [postorCustom,setPostorCustom]= useState("");
  const [ctrlTab,     setCtrlTab]     = useState("control");
  const [chatInput,   setChatInput]   = useState("");
  const [chatMsgs,    setChatMsgs]    = useState([
    {id:1,from:"P-0318 (Online)",text:"Listo para participar",time:"11:58"},
    {id:2,from:"P-0112 (Online)",text:"Buenos dias",time:"11:59"},
  ]);
  const [modalidad,   setModalidad]   = useState("hibrido"); // "presencial" | "online" | "hibrido"
  // Carrusel fotos
  const [photoIdx,    setPhotoIdx]    = useState(0);
  const photoIntervalRef = React.useRef(null);
  // Video martillero
  const videoRef           = React.useRef(null);
  const streamRef          = React.useRef(null);
  const mediaRecorderRef   = React.useRef(null);
  const recordedChunksRef  = React.useRef([]);
  const [camActiva,   setCamActiva]   = useState(false);
  const [camError,    setCamError]    = useState(null);
  const [grabando,    setGrabando]    = useState(false);
  // Post-remate: liquidaciones y devoluciones generadas automáticamente
  const [liquidaciones, setLiquidaciones] = useState([]);

  // ── Vendedores/Consignatarios ──
  const VENDEDORES_MOCK = [
    {id:"V-01", nombre:"JUZGADO CIVIL DE RANCAGUA",    rut:"61.002.000-2", giro:"Organismo Judicial",        direccion:"Av. España 585",      comuna:"Rancagua",   tel:"+56 72 234 5678", email:"civil@pjud.cl"},
    {id:"V-02", nombre:"AGRICOLA DEL VALLE LTDA.",      rut:"76.543.210-K", giro:"Agricultura y Ganadería",   direccion:"Fundo El Roble s/n",  comuna:"Rengo",      tel:"+56 9 8765 4321", email:"contacto@agrvalle.cl"},
    {id:"V-03", nombre:"BANCO ESTADO",                  rut:"97.030.000-7", giro:"Servicios Financieros",     direccion:"Av. Libertador 467",  comuna:"Rancagua",   tel:"+56 72 210 0000", email:"remates@bancoestado.cl"},
    {id:"V-04", nombre:"SUCESION PEREZ GONZALEZ",       rut:"55.123.456-8", giro:"Particular",                direccion:"Los Boldos 234",      comuna:"San Fernando",tel:"+56 9 7654 3210", email:"sucesion@gmail.com"},
  ];
  const [vendedorSel,   setVendedorSel]   = useState("");
  const [vendedorForm,  setVendedorForm]  = useState({comVenta:5, comDefensa:2, publicidad:0});
  const [vendedorLiqGenerada, setVendedorLiqGenerada] = useState(null);
  const [devoluciones,  setDevoluciones]  = useState([]);

  // Estado reactivo para devoluciones de garantía en panel post-remate
  const [noCompradoresState, setNoCompradoresState] = useState([
    {nPart:22, nombre:"MAXIMILIANO AHUMADA",                  garantia:0,      formaPago:"REMOTO",    devolucion:"N/A"},
    {nPart:23, nombre:"MACARENA OLGUIN",                      garantia:0,      formaPago:"REMOTO",    devolucion:"N/A"},
    {nPart:24, nombre:"VICENTE GERARDO RAMÍREZ URZÚA",        garantia:250000, formaPago:"PRESENCIAL",devolucion:"pendiente"},
    {nPart:25, nombre:"MAURICIO ALEJANDRO ALBORNOZ MORENO",   garantia:250000, formaPago:"PRESENCIAL",devolucion:"pendiente"},
    {nPart:27, nombre:"ISMAEL MORALES",                       garantia:250000, formaPago:"PRESENCIAL",devolucion:"pendiente"},
    {nPart:32, nombre:"MARCIAL ALEJANDRO OLMOS BECERRA",      garantia:250000, formaPago:"PRESENCIAL",devolucion:"pendiente"},
    {nPart:33, nombre:"ARNOLDO FLORES",                       garantia:250000, formaPago:"PRESENCIAL",devolucion:"cheque"},
    {nPart:34, nombre:"JUAN CARLOS CARO JORQUERA",            garantia:0,      formaPago:"PRESENCIAL",devolucion:"N/A"},
    {nPart:35, nombre:"LUIS ALARCON",                         garantia:250000, formaPago:"PRESENCIAL",devolucion:"efectivo"},
    {nPart:36, nombre:"FELIPE ALEJANDRO AQUEVEQUE MUÑOZ",     garantia:0,      formaPago:"REMOTO",    devolucion:"N/A"},
  ]);
  const marcarDevolucion = (nPart, metodo) => {
    setNoCompradoresState(prev => prev.map(c => c.nPart===nPart ? {...c, devolucion:metodo} : c));
  };
  const [remateTerminado, setRemateTerminado] = useState(false);

  const timerRef    = useRef(null);
  const bidTimerRef = useRef(null);
  const feedRef     = useRef(null);
  const chatRef     = useRef(null);

  const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),4000); };

  // bidTimer: 15s countdown después de cada puja — auto-adjudica si nadie supera
  useEffect(() => {
    if (bidTimer===null||aState!=="live") return;
    if (bidTimer<=0) { doAdjudicar(); return; }
    bidTimerRef.current = setTimeout(()=>setBidTimer(t=>t-1),1000);
    return () => clearTimeout(bidTimerRef.current);
  }, [bidTimer, aState]);

  // ── Supabase: carga inicial ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      setDbLoading(true);
      try {
        const timeout = new Promise((_,rej) => setTimeout(()=>rej(new Error("timeout")), 5000));
        const fetches = Promise.all([
          supabase.from("remates").select("*").order("created_at", {ascending:false}),
          supabase.from("lotes").select("*").order("orden"),
          supabase.from("postores").select("*").order("numero"),
          supabase.from("usuarios").select("*, casas(nombre)").order("nombre"),
        ]);
        const [remRes, lotRes, posRes, usrRes] = await Promise.race([fetches, timeout]);
        if (mounted) {
          if (remRes?.data) setDbRemates(remRes.data);
          if (lotRes?.data) setDbLotes(lotRes.data);
          if (posRes?.data) setDbPostores(posRes.data);
          if (usrRes?.data) setUsuarios(usrRes.data.map(u=>({
            id:      u.id,
            nombre:  u.nombre,
            usuario: u.email?.split("@")[0]||"",
            email:   u.email,
            roles:   u.roles||[],
            casa:    u.casas?.nombre||"",
            activo:  u.activo,
          })));
        }
      } catch(e) {
        console.warn("Supabase no disponible, usando mock:", e.message);
      }
      if (mounted) setDbLoading(false);
    };
    cargar();
    return () => { mounted = false; };
  }, [session]);

  // ── Supabase: realtime pujas ─────────────────────────────────────
  useEffect(() => {
    if (!lots[idx]?.supabaseId) return;
    const channel = supabase
      .channel("pujas-live")
      .on("postgres_changes", {
        event:"INSERT", schema:"public", table:"pujas",
        filter:`lote_id=eq.${lots[idx].supabaseId}`
      }, (payload) => {
        const puja = payload.new;
        setBids(prev => {
          const next = [...prev];
          const b = next[idx];
          if (puja.monto > b.current) {
            next[idx] = { ...b, current:puja.monto, count:b.count+1,
              history:[{postor:`Paleta ${puja.numero_postor}`,monto:puja.monto,
                time:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})
              },...b.history].slice(0,10) };
            setFlash(true); setTimeout(()=>setFlash(false),600);
            setLastBidder(`Paleta ${puja.numero_postor}`);
          }
          return next;
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [lots, idx]);

  // ── Supabase helpers ─────────────────────────────────────────────
  const savePuja = async (monto, numeroPaleta) => {
    const lote = lots[idx];
    if (!lote?.supabaseId) return;
    await supabase.from("pujas").insert({ lote_id:lote.supabaseId, remate_id:lote.remateId||null, numero_postor:numeroPaleta||0, monto });
  };
  const saveRemate = async (data) => {
    const { data:r, error } = await supabase.from("remates").insert(data).select().single();
    if (!error && r) setDbRemates(prev=>[r,...prev]);
    return { data:r, error };
  };
  const saveLote = async (data) => {
    const { data:l, error } = await supabase.from("lotes").insert(data).select().single();
    if (!error && l) setDbLotes(prev=>[...prev,l]);
    return { data:l, error };
  };
  const savePostor = async (data) => {
    const { data:p, error } = await supabase.from("postores").insert(data).select().single();
    if (!error && p) setDbPostores(prev=>[...prev,p]);
    return { data:p, error };
  };
  const updateRemateEstado = async (id, estado) => {
    const { error } = await supabase.from("remates").update({estado}).eq("id",id);
    if (!error) setDbRemates(prev=>prev.map(r=>r.id===id?{...r,estado}:r));
  };

  // Pujas simuladas eliminadas — solo pujas reales de postores

  const placeBid = () => {
    const amt = (bids[idx]?.current||0) + curInc;
    setBids(p=>{const n=[...p];const c=n[idx];n[idx]={...c,current:amt,count:c.count+1,history:[{bidder:"Tu (P-0245)",amount:amt,time:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),mine:true},...c.history.slice(0,19)],winner:"Tu (P-0245)"};return n;});
    setLastBidder("me"); setBidTimer(BID_TIMER); 
    setFlash(true); setTimeout(()=>setFlash(false),600); notify("Puja registrada.");
  };

  // ── ADJUDICACIÓN + generación automática de liquidaciones/devoluciones ──
  const doAdjudicar = (manual=false) => {
    const winner   = bids[idx]?.winner || null;
    const monto    = bids[idx]?.current || lots[idx]?.base;
    const loteNom  = lots[idx]?.name;
    // Look up matching lote real for tipo/motorizado — fallback to sala lot data
    const loteReal = LOTES_REALES.find(l => l.name === loteNom) || {};
    const tipoRemate  = loteReal.tipoRemate || "judicial";
    const motorizado  = loteReal.motorizado || lots[idx]?.cat==="Vehiculo" || false;
    const comPct      = loteReal.com ?? COMISIONES[tipoRemate]?.com ?? 10;
    const gastosAdm   = motorizado ? GASTO_ADMIN_MOTORIZADO : 0;

    setBids(p=>{const n=[...p];n[idx]={...n[idx],status:"sold"};return n;});
    setAState("sold"); setBidTimer(null);

    if (winner) {
      // Liquidación automática — comisión según tipo + gastos admin si motorizado
      const gar     = 300000;
      const com     = Math.round(monto * (comPct / 100));
      const saldo   = Math.max(0, monto - gar);
      const totalAPagar = saldo + com + gastosAdm;
      const newLiq  = {
        id: `LIQ-${Date.now()}`,
        lote: loteNom,
        exp: loteReal.exp || "",
        postor: winner,
        email: winner.includes("Online") ? "postor@email.cl" : "rfuentes@gmail.com",
        monto, gar, saldo, com, gastosAdm, totalAPagar,
        tipoRemate, motorizado, comPct,
        estado: saldo===0 ? "pagado" : "saldo pendiente",
        enviado: false,
        retiro: null,
        fecha: new Date().toLocaleDateString("es-CL"),
      };
      setLiquidaciones(p => [newLiq, ...p]);

      // Devolución automática para los NO adjudicados en este lote
      const adjPostors = new Set([...(bids[idx]?.history||[]).map(h=>h.bidder)]);
      const devs = GARANTIAS
        .filter(g => g.estado==="aprobada" && !g.devolucion)
        .filter(g => !adjPostors.has(g.postor) || g.postor !== winner.replace(" (Online)",""))
        .map(g => ({
          id: `DEV-${g.id}-${Date.now()}`,
          postor: g.postor,
          rut: g.rut,
          email: g.email,
          cuenta: "Por confirmar",
          monto: g.monto,
          estado: "pendiente",
          enviado: false,
          lote: loteNom,
          fecha: new Date().toLocaleDateString("es-CL"),
        }));
      setDevoluciones(p => {
        const ids = new Set(p.map(d=>d.postor));
        return [...p, ...devs.filter(d=>!ids.has(d.postor))];
      });

      notify(`Adjudicado — ${winner}. Liquidacion generada automaticamente.`, "sold");
    } else {
      notify("Lote sin adjudicatario.", "inf");
    }
  };

  // ── Carrusel auto-avance ──
  const startCarousel = (imgs) => {
    if (photoIntervalRef.current) clearInterval(photoIntervalRef.current);
    if (!imgs || imgs.length <= 1) return;
    photoIntervalRef.current = setInterval(() => {
      setPhotoIdx(p => (p + 1) % imgs.length);
    }, 3000);
  };
  React.useEffect(() => {
    const imgs = lots[idx]?.imgs || [];
    setPhotoIdx(0);
    startCarousel(imgs);
    return () => { if (photoIntervalRef.current) clearInterval(photoIntervalRef.current); };
  }, [idx, lots]);

  // ── Cámara en vivo martillero ──
  const guardarGrabacion = (nombreRemate) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.onstop = () => {
      if (recordedChunksRef.current.length === 0) return;
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const fecha = new Date().toISOString().slice(0,10);
      const nombre = (nombreRemate||"remate").replace(/\s+/g,"-").toLowerCase();
      a.href     = url;
      a.download = `grabacion-${nombre}-${fecha}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      recordedChunksRef.current = [];
    };
    mediaRecorderRef.current.stop();
    setGrabando(false);
  };

  const activarCamara = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamActiva(true);
      // Iniciar grabación automáticamente
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus" : "video/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setGrabando(true);
    } catch(e) {
      setCamError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
    }
  };
  const detenerCamara = () => {
    guardarGrabacion(lots[idx]?.name || "remate");
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamActiva(false);
  };

  // Cerrar remate completo → genera todas las liquidaciones/devoluciones pendientes
  const cerrarRemateCompleto = () => {
    // Guardar grabación si estaba activa
    if (grabando) guardarGrabacion(lots[idx]?.name || "remate");
    if (camActiva) detenerCamara();
    setRemateTerminado(true);
    // Agrupar todas las adjudicaciones (demo + generadas en vivo) por comprador
    const todasLiq = [...ADJUDICACIONES.map(a=>({
      lote:a.lote, exp:"", monto:a.monto, comPct:3, motorizado:false,
      postor:a.postor, rut:a.rut||"—", email:"",
    })), ...liquidaciones];

    // Buscar datos completos del postor en POSTORES
    const byComprador = {};
    todasLiq.forEach(l => {
      const postorData = POSTORES_MERGED.find(p=>p.name===l.postor||p.razonSocial===l.postor) || null;
      const key = postorData?.nComprador ?? l.postor;
      if (!byComprador[key]) byComprador[key] = { postorData, lotes:[], key };
      byComprador[key].lotes.push(l);
    });

    const compradores = Object.values(byComprador).map(c => ({
      ...c,
      liq: calcLiquidacion(c.lotes, c.postorData),
      enviado: false,
      facturado: false,
    }));

    setLiqReview({ compradores, fecha: new Date().toLocaleDateString("es-CL"), remateNombre: "Remate Industrial Marzo 2026", remateId:"R-044" });
    notify("Remate cerrado. Revisando liquidaciones antes de enviar.", "sold");
    setPage("liquidac");

    // Auto-borrar fotos de Supabase Storage para liberar espacio (los datos de adjudicación no llevan fotos)
    (async () => {
      try {
        const allImgs = lots.flatMap(l => l.imgs || []);
        if (!allImgs.length) return;
        // Extraer el path dentro del bucket (después de "/lotes/")
        const paths = allImgs
          .map(url => { const m = url.match(/\/lotes\/(.+)$/); return m ? m[1] : null; })
          .filter(Boolean);
        if (paths.length) {
          await supabase.storage.from("lotes").remove(paths);
          // Limpiar imagenes en DB
          const loteIds = lots.map(l => l.id).filter(Boolean);
          if (loteIds.length) await supabase.from("lotes").update({ imagenes: null }).in("id", loteIds);
        }
      } catch(e) { console.warn("Error borrando fotos:", e); }
    })();
  };

  const startAuction  = () => { setAState("live"); setBidTimer(null); setLastBidder(null); };
  const pauseAuction  = () => { setAState("paused"); setBidTimer(null); };
  const adjudicar     = () => doAdjudicar(true);
  const pasarLote     = () => {
    if(idx < lots.length-1){
      const next = idx+1;
      setIdx(next); setAState("waiting"); setBidTimer(null); setLastBidder(null);
      setCurInc(lots[next]?.inc||100000); setCustomMonto(""); setPhotoIdx(0);
      notify(`Lote ${next+1} — ${lots[next]?.name}`,"inf");
    } else { notify("Este es el último lote.","inf"); }
  };
  const repetirLote   = () => {
    setAState("waiting"); setBidTimer(null); setLastBidder(null);
    setBids(prev => { const n=[...prev]; n[idx]={current:lots[idx]?.base||0,count:0,history:[],status:"waiting",winner:null}; return n; });
    notify(`Lote repetido — ${lots[idx]?.name}`,"inf");
  };
  const resetAuction  = () => { setAState("waiting"); setBidTimer(null); setLastBidder(null); setBids(lots.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null}))); };

  const registrarPresencial = () => {
    const montoNum = parseInt((presMonto||"").replace(/\D/g,""));
    if (!presPaleta || !montoNum) { notify("Ingresa paleta y monto","inf"); return; }
    const time = new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const bidder = `Paleta ${presPaleta} (Presencial)`;
    setBids(p=>{const n=[...p];const c=n[idx];n[idx]={...c,current:montoNum,count:c.count+1,history:[{bidder,amount:montoNum,time,presencial:true},...c.history.slice(0,19)],winner:bidder};return n;});
    setLastBidder(bidder); setBidTimer(BID_TIMER); setFlash(true); setTimeout(()=>setFlash(false),600);
    if(feedRef.current) feedRef.current.scrollTop=0;
    savePuja(montoNum, parseInt(presPaleta)||0);
    setPresPaleta(""); setPresMonto("");
    notify(`✓ Postura presencial — Paleta ${presPaleta} · ${fmt(montoNum)}`,"sold");
  };
  const handlePhoto   = (i,e) => { const f=e.target.files[0]; if(!f) return; setLots(p=>{const n=[...p];const imgs=[...(n[i].imgs||[]),URL.createObjectURL(f)];n[i]={...n[i],imgs};return n;}); notify("Foto agregada.","inf"); };
  const removePhoto   = (loteI, photoI) => { setLots(p=>{const n=[...p];const imgs=n[loteI].imgs.filter((_,j)=>j!==photoI);n[loteI]={...n[loteI],imgs};return n;}); setPhotoIdx(0); };

  // Genera e imprime PDF de liquidación de un comprador
  const generarPDFLiquidacion = async (c, fechaRemate) => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const p   = c.postorData;
    const l   = c.liq;
    const num = String(c.key).padStart(2,"0");

    // Datos de la casa desde Supabase o session
    const casaData = dbLicencias.find(x => x.slug === session?.casa) || {};
    const casaNombre   = casaData.nombre    || session?.casaNombre || "Remates Ahumada";
    const logoUrl      = casaData.logo_url  || null;
    const martillero   = casaData.martillero|| "";
    const rutMart      = casaData.rut_martillero       || "";
    const dirMart      = casaData.direccion_martillero || casaData.direccion || "";
    const telMart      = casaData.telefono_martillero  || casaData.telefono  || "";
    const emailMart    = casaData.email_martillero     || casaData.email     || "";

    // Colores corporativos GR
    const C_AZUL   = [31, 41, 55];    // #1F2937 secundario
    const C_PRIMARY= [56, 178, 246];  // #38B2F6 primario
    const C_TEAL   = [20, 184, 166];  // #14B8A6 acento
    const C_GRAY   = [100, 116, 139];
    const C_LIGHT  = [248, 250, 252];
    const C_BORDER = [226, 232, 240];

    const fmtCLP = v => "$ " + Math.round(v).toLocaleString("es-CL");

    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 14;

    // ══════════════════════════════════════════
    // HEADER — logo + datos casa + título centrado
    // ══════════════════════════════════════════

    // Franja superior color primario
    doc.setFillColor(...C_PRIMARY);
    doc.rect(0, 0, W, 2, "F");

    // Bloque logo e info casa (izquierda)
    if(logoUrl) {
      try {
        // Intentar cargar imagen — si falla usa texto
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((res) => { img.onload = res; img.onerror = res; img.src = logoUrl; });
        if(img.naturalWidth > 0) {
          doc.addImage(img, "PNG", 14, y, 36, 18, undefined, "FAST");
          y += 2;
        }
      } catch(e) { /* logo failed, use text */ }
    }

    // Nombre casa en negrita
    doc.setFont("helvetica","bold");
    doc.setFontSize(12);
    doc.setTextColor(...C_AZUL);
    const logoOffset = logoUrl ? 56 : 14;
    doc.text(casaNombre.toUpperCase(), logoOffset, y + 5);

    // Datos martillero
    if(martillero) {
      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...C_PRIMARY);
      doc.text("MARTILLERO PÚBLICO", logoOffset, y + 11);
      doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRAY);
      doc.setFontSize(7.5);
      doc.text(martillero, logoOffset, y + 16);
      let rowY = y + 21;
      if(rutMart)   { doc.text(`RUT: ${rutMart}`, logoOffset, rowY); rowY += 5; }
      let infoLine = "";
      if(telMart)   infoLine += `Fono: ${telMart}   `;
      if(emailMart) infoLine += `Email: ${emailMart}`;
      if(infoLine)  { doc.text(infoLine, logoOffset, rowY); rowY += 5; }
      if(dirMart)   doc.text(`Dirección: ${dirMart}`, logoOffset, rowY);
    }

    y = 46;

    // Línea separadora
    doc.setDrawColor(...C_PRIMARY);
    doc.setLineWidth(0.6);
    doc.line(14, y, W-14, y);
    y += 6;

    // ── Título centrado ──
    doc.setFont("helvetica","bold");
    doc.setFontSize(15);
    doc.setTextColor(...C_AZUL);
    doc.text("LIQUIDACIÓN REMATE", W/2, y, {align:"center"});
    y += 7;
    doc.setFontSize(13);
    doc.setTextColor(...C_PRIMARY);
    doc.text(`COMPRADOR N° : ${num}`, W/2, y, {align:"center"});
    y += 9;

    // ══════════════════════════════════════════
    // DATOS DEL COMPRADOR — formato fiel al original
    // ══════════════════════════════════════════
    const datosComp = [
      ["FECHA",     fechaRemate],
      ["R.U.T",     p?.rut||"—"],
      ["SEÑOR(ES)", p?.razonSocial||p?.nombre||"—"],
      ["GIRO",      p?.giro||"—"],
      ["DIRECCIÓN", p?.direccion||"—"],
      ["TELÉFONO",  p?.tel||"—"],
      ["MAIL",      p?.email||"—"],
      ["COMUNA",    p?.comuna||"—"],
    ];

    datosComp.forEach(([k, v]) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...C_GRAY);
      doc.text(k, 14, y);
      doc.setFont("helvetica","normal"); doc.setTextColor(30,30,30);
      doc.text(String(v||"—"), 52, y);
      y += 6;
    });
    y += 3;

    // ══════════════════════════════════════════
    // TABLA LOTES — fiel al formato original
    // ══════════════════════════════════════════
    const rows = [];
    l.lineas.forEach((ln, li) => {
      const loteLabel = `LOTE ${li + 1}`;
      rows.push([loteLabel, "1", ln.lote.toUpperCase(), "EX", fmtCLP(ln.monto), fmtCLP(ln.monto)]);
      rows.push([loteLabel, "1", `COMISION ${ln.comPct}%`, "AF", fmtCLP(ln.com), fmtCLP(ln.com)]);
      if(ln.motorizado) rows.push(["G-ADMIN", "1",
        `GASTOS ADMINISTRATIVOS
VEHÍCULO MOTORIZADO (${loteLabel})`, "AF",
        fmtCLP(ln.gastosAdm), fmtCLP(ln.gastosAdm)]);
    });

    autoTable(doc, {
      startY: y,
      head: [["LOTE","CANTIDAD","DESCRIPCIÓN","ND","UNITARIO","TOTAL"]],
      body: rows,
      styles: { fontSize:8, cellPadding:2.8, textColor:[30,30,30], font:"helvetica" },
      headStyles: { fillColor:C_AZUL, textColor:[255,255,255], fontStyle:"bold", fontSize:7.5, halign:"center" },
      columnStyles: {
        0: { cellWidth:18, halign:"center", textColor:C_GRAY, fontSize:7.5 },
        1: { cellWidth:14, halign:"center" },
        2: { cellWidth:"auto" },
        3: { cellWidth:13, halign:"center" },
        4: { cellWidth:26, halign:"right", fontStyle:"normal" },
        5: { cellWidth:26, halign:"right", fontStyle:"bold" },
      },
      alternateRowStyles: { fillColor:[248,250,252] },
      tableLineColor: C_BORDER,
      tableLineWidth: 0.2,
      didDrawCell: (data) => {
        if(data.section==="body" && data.column.index===3) {
          const txt = data.cell.raw;
          const x=data.cell.x+1.5, cy=data.cell.y+1.8, w=data.cell.width-3, h=data.cell.height-3.5;
          if(txt==="EX") { doc.setFillColor(220,252,231); doc.setDrawColor(134,239,172); }
          else           { doc.setFillColor(219,234,254); doc.setDrawColor(147,197,253); }
          doc.roundedRect(x,cy,w,h,1,1,"FD");
          doc.setFontSize(6.5);
          doc.setTextColor(txt==="EX"?22:30, txt==="EX"?163:64, txt==="EX"?74:175);
          doc.setFont("helvetica","bold");
          doc.text(txt, x+w/2, cy+h-1.2, {align:"center"});
        }
      },
    });

    y = doc.lastAutoTable.finalY + 6;

    // ══════════════════════════════════════════
    // TOTALES — lado izquierdo
    // GARANTÍA + TOTAL A PAGAR — lado derecho
    // ══════════════════════════════════════════
    const totalesY = y;
    const colW = (W-28)/2 - 4;

    // Columna izquierda: totales
    const totales = [
      ["TOTAL COMPRAS EXENTAS:", l.totalEx],
      ["TOTAL COMPRAS AFECTAS:", l.totalAf],
      ["TOTAL COMISION:", l.totalCom],
      ["19% IVA:", l.iva],
    ];
    let ty = totalesY;
    totales.forEach(([k,v]) => {
      doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...C_GRAY);
      doc.text(k, 14, ty);
      doc.setFont("helvetica","bold"); doc.setTextColor(30,30,30);
      doc.text(fmtCLP(v), 14+colW, ty, {align:"right"});
      doc.setDrawColor(...C_BORDER); doc.setLineWidth(0.2);
      doc.line(14, ty+2, 14+colW, ty+2);
      ty += 6.5;
    });
    // Total final
    doc.setDrawColor(...C_PRIMARY); doc.setLineWidth(0.6);
    doc.line(14, ty, 14+colW, ty);
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...C_PRIMARY);
    doc.text("TOTAL:", 14, ty+6);
    doc.setFontSize(11);
    doc.text(fmtCLP(l.total), 14+colW, ty+6, {align:"right"});

    // Columna derecha: garantía + total a pagar
    const bx = W/2 + 6, bw = W/2 - 20, bh = 28;
    const by2 = totalesY;
    doc.setFillColor(239,246,255);
    doc.setDrawColor(...C_PRIMARY); doc.setLineWidth(0.6);
    doc.roundedRect(bx, by2, bw, bh, 3, 3, "FD");

    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...C_GRAY);
    doc.text("GARANTÍA:", bx+4, by2+8);
    doc.setFont("helvetica","bold"); doc.setTextColor(22,163,74);
    doc.text(fmtCLP(l.garantia), bx+bw-4, by2+8, {align:"right"});

    doc.setDrawColor(...C_BORDER); doc.setLineWidth(0.2);
    doc.line(bx+4, by2+12, bx+bw-4, by2+12);

    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...C_AZUL);
    doc.text("TOTAL A PAGAR:", bx+4, by2+20);
    doc.setFontSize(13); doc.setTextColor(...C_PRIMARY);
    doc.text(fmtCLP(l.totalAPagar), bx+bw-4, by2+21, {align:"right"});

    // ══════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════
    const fy = H - 12;
    doc.setFillColor(...C_PRIMARY);
    doc.rect(0, H-4, W, 4, "F");
    doc.setDrawColor(...C_BORDER); doc.setLineWidth(0.2);
    doc.line(14, fy-3, W-14, fy-3);
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...C_GRAY);
    doc.text(`${casaNombre} · Powered by GR Auction Software · gestionderemates.cl`, 14, fy+1);
    doc.text(`Remate ${fechaRemate} · Comprador N° ${num}`, W-14, fy+1, {align:"right"});

    doc.save(`liquidacion-comprador-${num}-${fechaRemate.replace(/\//g,"-")}.pdf`);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMsgs(p=>[...p,{id:Date.now(),from:"Martillero",text:chatInput,time:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}),martillero:true}]);
    setChatInput("");
    setTimeout(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },50);
  };

  const item   = lots[idx];
  const bid    = bids[idx];
  const tColor = timeLeft>60?"var(--gr)":timeLeft>30?"var(--yl)":"var(--rd)";
  const sColor = {live:"var(--gr)",sold:"var(--ac)",paused:"var(--yl)",waiting:"var(--mu)"}[aState];
  const sLabel = {live:"En vivo",sold:"Adjudicado",paused:"Pausado",waiting:"En espera"}[aState];
  const iAmWinning = lastBidder==="me";

  const NAV = [
    { id:"dashboard",    icon:"dashboard", label:"Dashboard" },
    { id:"remates",      icon:"remates",   label:"Remates",      badge:3 },
    { id:"lotes",        icon:"lotes",     label:"Lotes",        badge:LOTES_REALES.length },
    { id:"sala",         icon:"sala",      label:"Sala en vivo" },
    { id:"postores",     icon:"postores",  label:"Postores" },
    { id:"garantias",    icon:"garantia",  label:"Garantias",    badge: GARANTIAS.filter(g=>g.estado==="pendiente").length||undefined },
    { id:"adjudicac",    icon:"adjudic",   label:"Adjudicaciones" },
    { id:"liquidac",     icon:"liq",       label:"Liquidaciones", badge: liquidaciones.filter(l=>!l.enviado).length||undefined },
    { id:"devoluciones", icon:"dev",       label:"Devoluciones",  badge: devoluciones.filter(d=>d.estado==="pendiente").length||undefined },
    { id:"factura",      icon:"factura",   label:"Balance" },
    { id:"vendedores",   icon:"vendedor",  label:"Vendedores" },
    { id:"reportes",     icon:"reportes",  label:"Reportes" },
    { id:"config",       icon:"config",    label:"Configuracion" },
  ];

  const PAGE_TITLE = {dashboard:"Dashboard",remates:"Remates",lotes:"Lotes",sala:"Sala en vivo",postores:"Postores",garantias:"Garantias",adjudicac:"Adjudicaciones",liquidac:"Liquidaciones",devoluciones:"Devoluciones de Garantía",retiro:"Retiro de Bienes",factura:"Balance Económico",vendedores:"Liquidación de Vendedores",reportes:"Estadísticas",config:"Configuracion",usuarios:"Usuarios",licencias:"Licencias",casas:"Casas de Remates"};

  return (
    <div className="app">
      <style>{CSS}</style>
      {notif && <div className={`notif ${notif.type}`}>{notif.msg}</div>}

      {/* MODAL */}
      {modal && (
        <div className="ov" onClick={()=>setModal(null)}>
          <div className={`modal${modal==="nuevo-lote"?" wide":""}`} onClick={e=>e.stopPropagation()} style={{maxHeight:"90vh",overflowY:"auto"}}>
            {modal==="nuevo-remate" && <>
              <div className="modal-title">Crear nuevo remate</div>
              <div className="form-grid">
                <div className="fg full"><label className="fl">Nombre del remate</label>
                  <input className="fi" placeholder="Remate Industrial Abril 2026" value={remateForm.nombre} onChange={e=>setRemateForm(f=>({...f,nombre:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">Fecha</label>
                  <input className="fi" type="date" value={remateForm.fecha} onChange={e=>setRemateForm(f=>({...f,fecha:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">Hora de inicio</label>
                  <input className="fi" type="time" value={remateForm.hora} onChange={e=>setRemateForm(f=>({...f,hora:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">Modalidad</label>
                  <select className="fsel" value={remateForm.modalidad} onChange={e=>setRemateForm(f=>({...f,modalidad:e.target.value}))}>
                    <option>Presencial</option><option>Online</option><option>Híbrido</option>
                  </select>
                </div>
                <div className="fg"><label className="fl">Estado inicial</label>
                  <select className="fsel" value={remateForm.estado} onChange={e=>setRemateForm(f=>({...f,estado:e.target.value}))}>
                    <option value="activo">Activo — listo para operar</option>
                    <option value="publicado">Publicado — visible al público</option>
                    <option value="borrador">Borrador — no visible</option>
                  </select>
                </div>
                <div className="fg full"><label className="fl">Tipo de remate</label>
                  <select className="fsel" value={remateForm.tipo} onChange={e=>setRemateForm(f=>({...f,tipo:e.target.value}))}>
                    <option value="judicial">Judicial</option>
                    <option value="concursal">Concursal</option>
                    <option value="privado">Privado / Mixto</option>
                  </select>
                </div>
                {remateForm.tipo==="privado" && (
                  <div className="fg full">
                    <label className="fl">Comisión personalizada (%)</label>
                    <input className="fi" type="number" step="0.5" min="0" max="20" placeholder="Ej: 5" value={remateForm.comCustom} onChange={e=>setRemateForm(f=>({...f,comCustom:e.target.value}))}/>
                  </div>
                )}
                <div className="fg full" style={{padding:".65rem .85rem",background:`rgba(${remateForm.tipo==="judicial"?"47,128,237":remateForm.tipo==="concursal"?"246,173,85":"34,211,160"},.07)`,border:`1px solid rgba(${remateForm.tipo==="judicial"?"47,128,237":remateForm.tipo==="concursal"?"246,173,85":"34,211,160"},.2)`,borderRadius:7,fontSize:".75rem",color:"var(--mu2)"}}>
                  La comisión se define por cada lote individualmente, no por el remate. Un remate puede tener lotes judiciales (10%), concursales (7%) y privados mezclados.
                </div>
              </div>
            </>}
            {modal==="nuevo-lote" && <>
              {/* ── WIZARD HEADER ── */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
                <div className="modal-title" style={{margin:0}}>Agregar lote</div>
                <div style={{fontSize:".7rem",color:"var(--mu)"}}>Paso {wizStep} de 3</div>
              </div>
              {/* Steps bar — 3 pasos */}
              <div className="wiz-steps">
                {[["1","Tipo y datos"],["2","Fotos"],["3","Documentos"]].map(([n,l])=>(
                  <div key={n} className={`wiz-step${wizStep===+n?" on":wizStep>+n?" done":""}`}>
                    <div className="wiz-num">{wizStep>+n?"✓":n}</div>{l}
                  </div>
                ))}
              </div>
              {/* ── PASO 1: Tipo + Datos (fusionados) ── */}
              {wizStep===1 && (
                <div>
                  {/* Selector tipo inline */}
                  <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
                    {[{k:"MUEBLES",icon:null,label:"Muebles"},{k:"VEHICULOS",icon:null,label:"Vehículo"},{k:"INMUEBLES",icon:null,label:"Inmueble"}].map(o=>(
                      <div key={o.k} onClick={()=>{setWizTipo(o.k);setLoteForm(f=>({...f,motorizado:o.k==="VEHICULOS"}));}}
                        style={{flex:1,padding:".6rem .5rem",textAlign:"center",cursor:"pointer",borderRadius:8,border:`2px solid ${wizTipo===o.k?"var(--ac)":"var(--b2)"}`,background:wizTipo===o.k?"rgba(56,178,246,.1)":"var(--s2)",transition:"all .15s"}}>
                        
                        <div style={{fontSize:".72rem",fontWeight:wizTipo===o.k?700:500,color:wizTipo===o.k?"var(--ac)":"var(--mu2)"}}>{o.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="form-grid">
                    <div className="fg full">
                      <label className="fl">Remate al que pertenece</label>
                      <select className="fsel" value={wizDatos.remateId||""} onChange={e=>setWizDatos(f=>({...f,remateId:e.target.value}))}>
                        <option value="">— Sin asignar —</option>
                        {REMATES_MERGED.filter(r=>r.estado!=="cerrado").map(r=>(
                          <option key={r.supabaseId||r.id} value={r.supabaseId||r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="fg full"><label className="fl">Nombre del artículo</label>
                      <input className="fi" placeholder={wizTipo==="VEHICULOS"?"Toyota Hilux 2020 4x4":wizTipo==="INMUEBLES"?"Parcela 315 — Coinco VI Region":"Enseres varios — Hogar"} value={wizDatos.nombre} onChange={e=>setWizDatos(f=>({...f,nombre:e.target.value}))}/>
                    </div>
                    <div className="fg"><label className="fl">Expediente / N° causa</label>
                      <input className="fi" placeholder="E-61-2025" value={wizDatos.exp} onChange={e=>setWizDatos(f=>({...f,exp:e.target.value}))}/>
                    </div>
                    <div className="fg"><label className="fl">Mandante</label>
                      <input className="fi" placeholder="Tanner / Judicial / Particular" value={wizDatos.mandante} onChange={e=>setWizDatos(f=>({...f,mandante:e.target.value}))}/>
                    </div>
                    {wizTipo==="VEHICULOS" && <>
                      <div className="fg"><label className="fl">Patente</label>
                        <input className="fi" placeholder="ABCD-12" style={{fontFamily:"Inter,sans-serif",fontWeight:700}} value={wizDatos.patente} onChange={e=>setWizDatos(f=>({...f,patente:e.target.value}))}/>
                      </div>
                      <div className="fg"><label className="fl">Año</label>
                        <input className="fi" placeholder="2020" value={wizDatos.year} onChange={e=>setWizDatos(f=>({...f,year:e.target.value}))}/>
                      </div>
                    </>}
                    <div className="fg">
                      <label className="fl">Tipo de remate</label>
                      <select className="fsel" value={loteForm.tipoRemate} onChange={e=>setLoteForm(f=>({...f,tipoRemate:e.target.value}))}>
                        <option value="judicial">Judicial — 10% (fijo por ley)</option>
                        <option value="concursal">Concursal — 7% (fijo por ley)</option>
                        <option value="privado">Privado — personalizado</option>
                      </select>
                    </div>
                    <div className="fg">
                      <label className="fl">Comisión (%)</label>
                      <input className="fi" type="number" step="0.5" min="0" max="50"
                          placeholder={loteForm.tipoRemate==="judicial"?"10 (fijo por ley)":loteForm.tipoRemate==="concursal"?"7 (fijo por ley)":"Ej: 5"}
                          value={loteForm.comCustom}
                          readOnly={loteForm.tipoRemate==="judicial"||loteForm.tipoRemate==="concursal"}
                          style={{fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--ac)",opacity:loteForm.tipoRemate!=="privado"?.7:1,cursor:loteForm.tipoRemate!=="privado"?"not-allowed":"text"}}
                          onChange={e=>loteForm.tipoRemate==="privado"&&setLoteForm(f=>({...f,comCustom:e.target.value}))}/>
                        {loteForm.tipoRemate!=="privado" && (
                          <div style={{fontSize:".68rem",color:"var(--yl)",marginTop:".3rem",display:"flex",alignItems:"center",gap:".3rem"}}>
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3.5M7 9.5v.01"/></svg>
                            Comisión fija por ley — no editable
                          </div>
                        )}
                    </div>
                    {wizTipo==="VEHICULOS" && <div className="fg full" style={{padding:".5rem .75rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:7,fontSize:".72rem",color:"var(--yl)"}}>Vehículo motorizado — se agregarán $50.000 gastos administrativos en la liquidación.</div>}
                    <div className="fg"><label className="fl">Precio base</label>
                      <input className="fi" placeholder="$8.000.000" value={wizDatos.base} onChange={e=>setWizDatos(f=>({...f,base:e.target.value}))}/>
                    </div>
                    <div className="fg"><label className="fl">Precio mínimo</label>
                      <input className="fi" placeholder="$7.000.000" value={wizDatos.minimo} onChange={e=>setWizDatos(f=>({...f,minimo:e.target.value}))}/>
                    </div>
                    <div className="fg"><label className="fl">Incremento mínimo de puja</label>
                      <input className="fi" placeholder="$100.000" value={wizDatos.incremento} onChange={e=>setWizDatos(f=>({...f,incremento:e.target.value}))}/>
                    </div>
                    <div className="fg full"><label className="fl">Descripción <span style={{color:"var(--mu)",fontWeight:400}}>(opcional)</span></label>
                      <textarea className="fi" rows={2} placeholder="Estado general, observaciones..." style={{resize:"none"}} value={wizDatos.descripcion} onChange={e=>setWizDatos(f=>({...f,descripcion:e.target.value}))}/>
                    </div>
                  </div>
                </div>
              )}
              {/* ── PASO 2: Fotos OBLIGATORIAS ── */}
              {wizStep===2 && (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:"1rem",padding:".6rem .85rem",background:"rgba(224,82,82,.06)",border:"1px solid rgba(224,82,82,.2)",borderRadius:8}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#e05252" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3.5M7 9.5v.5"/></svg>
                    <span style={{fontSize:".73rem",color:"#e07272",fontWeight:600}}>Las fotos son obligatorias — se usan como evidencia del lote.</span>
                  </div>
                  {wizTipo==="VEHICULOS" ? (
                    <div className="foto-grid">
                      {[["frente","Frente"],["izq","Lado izquierdo"],["der","Lado derecho"],["trasera","Trasera"]].map(([k,lbl])=>(
                        <label key={k} className={`foto-slot${wizFotos[k]?" filled":""}`} style={{border:`2px ${wizFotos[k]?"solid rgba(20,184,166,.4)":"dashed rgba(224,82,82,.35)"}`}}>
                          {wizFotos[k]
                            ? <><img src={URL.createObjectURL(wizFotos[k])} alt={lbl}/><div className="foto-label">✓ {lbl}</div></>
                            : <><svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="var(--mu)" strokeWidth="1.4"><rect x="1" y="4" width="18" height="13" rx="2"/><circle cx="10" cy="10.5" r="3"/><path d="M6.5 4V3a1 1 0 011-1h5a1 1 0 011 1v1"/></svg><span style={{fontSize:".7rem",marginTop:".3rem"}}>{lbl}</span><span style={{fontSize:".6rem",color:"var(--rd)"}}>Requerida</span></>}
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizFotos(f=>({...f,[k]:e.target.files[0]}))}/>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div style={{fontSize:".73rem",color:"var(--mu2)",marginBottom:".75rem"}}>Agrega al menos una foto del artículo.</div>
                      {wizItems.map((it,i)=>(
                        <div key={it.id} className="item-card">
                          <label style={{width:56,height:56,borderRadius:8,border:`2px dashed ${it.foto?"rgba(20,184,166,.4)":"rgba(224,82,82,.35)"}`,background:"rgba(255,255,255,.02)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,overflow:"hidden"}}>
                            {it.foto?<img src={URL.createObjectURL(it.foto)} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:6}}/>
                              :<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--mu)" strokeWidth="1.4"><rect x="1" y="4" width="18" height="13" rx="2"/><circle cx="10" cy="10.5" r="3"/></svg>}
                            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizItems(items=>items.map((x,xi)=>xi===i?{...x,foto:e.target.files[0]}:x))}/>
                          </label>
                          <input className="fi" style={{flex:1}} placeholder="Descripción del ítem..." value={it.nombre} onChange={e=>setWizItems(items=>items.map((x,xi)=>xi===i?{...x,nombre:e.target.value}:x))}/>
                          {wizItems.length>1 && <button onClick={()=>setWizItems(items=>items.filter((_,xi)=>xi!==i))} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--mu)",padding:".2rem"}}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg></button>}
                        </div>
                      ))}
                      <div className="add-btn-row" onClick={()=>setWizItems(items=>[...items,{id:Date.now(),nombre:"",foto:null}])}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg> Agregar otra foto
                      </div>
                    </>
                  )}
                  {/* Contador de fotos */}
                  <div style={{marginTop:".85rem",fontSize:".72rem",color:"var(--mu2)",display:"flex",alignItems:"center",gap:".4rem"}}>
                    {wizTipo==="VEHICULOS"
                      ? <>{Object.values(wizFotos).filter(Boolean).length===4
                          ? <span style={{color:"var(--gr)",fontWeight:600}}>✓ 4/4 fotos cargadas — listo para guardar</span>
                          : <span style={{color:"var(--yl)"}}>⚠ {Object.values(wizFotos).filter(Boolean).length}/4 fotos — se requieren las 4</span>}</>
                      : <>{wizItems.some(x=>x.foto)
                          ? <span style={{color:"var(--gr)",fontWeight:600}}>✓ {wizItems.filter(x=>x.foto).length} foto{wizItems.filter(x=>x.foto).length!==1?"s":""} cargada{wizItems.filter(x=>x.foto).length!==1?"s":""}</span>
                          : <span style={{color:"var(--rd)"}}>⚠ Debes agregar al menos una foto</span>}</>}
                  </div>
                  {/* ── IA inline: solo aparece cuando hay al menos 1 foto ── */}
                  {(wizTipo==="VEHICULOS" ? Object.values(wizFotos).some(Boolean) : wizItems.some(x=>x.foto)) && (
                    <div style={{marginTop:"1rem",padding:".75rem 1rem",background:"linear-gradient(135deg,rgba(6,182,212,.06),rgba(20,184,166,.06))",border:"1px solid rgba(6,182,212,.2)",borderRadius:10}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
                        <div>
                          <div style={{fontSize:".75rem",fontWeight:700,color:"var(--ac)"}}>✨ Describir con IA <span style={{fontWeight:400,color:"var(--mu)",fontSize:".68rem"}}>(opcional)</span></div>
                          <div style={{fontSize:".67rem",color:"var(--mu)",marginTop:".15rem"}}>Genera un título y descripción profesional a partir de la foto.</div>
                        </div>
                        <button
                          disabled={aiLoteLoading}
                          style={{fontSize:".72rem",fontWeight:700,padding:".35rem .85rem",borderRadius:7,border:"1px solid rgba(6,182,212,.35)",background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(20,184,166,.12))",color:"var(--ac)",cursor:aiLoteLoading?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:aiLoteLoading?.6:1}}
                          onClick={async()=>{
                            setAiLoteLoading(true);
                            setAiLoteResult(null);
                            try {
                              // Tomar la primera foto disponible
                              let fotoFile = wizTipo==="VEHICULOS"
                                ? Object.values(wizFotos).find(Boolean)
                                : wizItems.find(x=>x.foto)?.foto;
                              let imageBase64=null, mediaType=null;
                              if(fotoFile){
                                const buf = await fotoFile.arrayBuffer();
                                imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                                mediaType = fotoFile.type||"image/jpeg";
                              }
                              const res = await fetch("/api/ai/describe-lot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageBase64,mediaType,name:wizDatos.nombre,category:wizTipo})});
                              const data = await res.json();
                              if(data.titulo||data.descripcion){
                                setAiLoteResult(data);
                              }
                            } catch(e){ notify("Error al conectar con IA","err"); }
                            setAiLoteLoading(false);
                          }}
                        >{aiLoteLoading?"Analizando...":"Generar descripción"}</button>
                      </div>
                      {aiLoteResult && (
                        <div style={{marginTop:".75rem",display:"flex",flexDirection:"column",gap:".5rem"}}>
                          {aiLoteResult.titulo && (
                            <div style={{display:"flex",alignItems:"flex-start",gap:".5rem"}}>
                              <span style={{fontSize:".67rem",color:"var(--mu)",whiteSpace:"nowrap",paddingTop:".1rem"}}>Título:</span>
                              <span style={{fontSize:".73rem",color:"var(--wh2)",fontWeight:600,flex:1}}>{aiLoteResult.titulo}</span>
                              <button onClick={()=>setWizDatos(f=>({...f,nombre:aiLoteResult.titulo}))} style={{fontSize:".65rem",padding:".2rem .5rem",borderRadius:5,border:"1px solid rgba(20,184,166,.3)",background:"rgba(20,184,166,.08)",color:"var(--gr)",cursor:"pointer",whiteSpace:"nowrap"}}>Usar</button>
                            </div>
                          )}
                          {aiLoteResult.descripcion && (
                            <div style={{display:"flex",alignItems:"flex-start",gap:".5rem"}}>
                              <span style={{fontSize:".67rem",color:"var(--mu)",whiteSpace:"nowrap",paddingTop:".1rem"}}>Desc.:</span>
                              <span style={{fontSize:".72rem",color:"var(--mu2)",flex:1,lineHeight:1.4}}>{aiLoteResult.descripcion}</span>
                              <button onClick={()=>setWizDatos(f=>({...f,descripcion:aiLoteResult.descripcion}))} style={{fontSize:".65rem",padding:".2rem .5rem",borderRadius:5,border:"1px solid rgba(20,184,166,.3)",background:"rgba(20,184,166,.08)",color:"var(--gr)",cursor:"pointer",whiteSpace:"nowrap"}}>Usar</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* ── PASO 3: Documentos ── */}
              {wizStep===3 && (
                <div>
                  <div style={{fontSize:".76rem",color:"var(--mu2)",marginBottom:".85rem"}}>
                    Adjunta los documentos del lote. <span style={{color:"var(--mu)"}}>Opcional pero recomendado.</span>
                  </div>
                  {wizTipo==="VEHICULOS" && (
                    <div style={{marginBottom:"1rem"}}>
                      <div style={{fontSize:".7rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".55rem"}}>Documentos del vehículo</div>
                      {[
                        {key:"anotaciones", label:"Certificado de Anotaciones Vigentes", desc:"Acredita que no tiene prendas ni prohibiciones"},
                        {key:"multas",      label:"Certificado de Multas",               desc:"Sin multas impagas ante SII o municipios"},
                        {key:"revision",    label:"Revisión Técnica vigente",            desc:"Certificado al día"},
                        {key:"permiso",     label:"Permiso de Circulación",              desc:"Comprobante vigente"},
                      ].map(doc=>{
                        const adj = wizDocs.find(d=>d.key===doc.key);
                        return (
                          <div key={doc.key} style={{display:"flex",alignItems:"center",gap:".75rem",padding:".6rem .85rem",background:adj?.archivo?"rgba(20,184,166,.04)":"rgba(255,255,255,.02)",border:`1px solid ${adj?.archivo?"rgba(20,184,166,.2)":"var(--b1)"}`,borderRadius:8,marginBottom:".4rem"}}>
                            <div style={{width:28,height:28,borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:adj?.archivo?"rgba(20,184,166,.1)":"var(--s3)"}}>
                              {adj?.archivo
                                ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--gr)" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-7"/></svg>
                                : <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 2h6l3 3v9H4V2z"/><path d="M10 2v3h3"/></svg>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:".76rem",fontWeight:600,color:"var(--wh2)"}}>{doc.label}</div>
                              <div style={{fontSize:".63rem",color:"var(--mu)"}}>{adj?.archivo?<span style={{color:"var(--gr)"}}>✓ {adj.archivo.name}</span>:doc.desc}</div>
                            </div>
                            <label style={{fontSize:".68rem",fontWeight:600,color:adj?.archivo?"var(--mu)":"var(--ac)",cursor:"pointer",whiteSpace:"nowrap",padding:".25rem .55rem",border:`1px solid ${adj?.archivo?"var(--b2)":"rgba(56,178,246,.3)"}`,borderRadius:6,background:adj?.archivo?"transparent":"rgba(56,178,246,.06)"}}>
                              {adj?.archivo?"Cambiar":"+ Adjuntar"}
                              <input type="file" accept=".pdf,.jpg,.png" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizDocs(docs=>{const ex=docs.find(d=>d.key===doc.key);return ex?docs.map(d=>d.key===doc.key?{...d,archivo:e.target.files[0]}:d):[...docs,{id:Date.now(),key:doc.key,nombre:doc.label,archivo:e.target.files[0]}];})}/>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{fontSize:".7rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".55rem"}}>
                    {wizTipo==="VEHICULOS"?"Otros documentos":"Documentos del lote"}
                  </div>
                  {wizDocs.filter(d=>!d.key).map((d)=>(
                    <div key={d.id} className="doc-card">
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--yl)" strokeWidth="1.5" strokeLinecap="round" style={{flexShrink:0}}><path d="M4 2h6l3 3v9H4V2z"/><path d="M10 2v3h3"/></svg>
                      <input className="fi" style={{flex:1,fontSize:".76rem"}} placeholder="Nombre del documento..." value={d.nombre} onChange={e=>setWizDocs(docs=>docs.map(x=>x.id===d.id?{...x,nombre:e.target.value}:x))}/>
                      <span style={{fontSize:".65rem",color:d.archivo?"var(--gr)":"var(--mu)"}}>{d.archivo?`✓ ${d.archivo.name}`:<label style={{cursor:"pointer",color:"var(--ac)"}}>+ Adjuntar<input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizDocs(docs=>docs.map(x=>x.id===d.id?{...x,archivo:e.target.files[0]}:x))}/></label>}</span>
                      <button onClick={()=>setWizDocs(docs=>docs.filter(x=>x.id!==d.id))} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--mu)",padding:".2rem"}}><svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
                    </div>
                  ))}
                  <div className="add-btn-row" onClick={()=>setWizDocs(docs=>[...docs,{id:Date.now(),key:null,nombre:"",archivo:null}])}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg> Agregar documento / acta
                  </div>
                  {/* Resumen final */}
                  <div style={{marginTop:"1rem",padding:".75rem 1rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:9,fontSize:".73rem",color:"var(--mu2)",lineHeight:1.7}}>
                    <div style={{fontWeight:700,color:"var(--wh2)",marginBottom:".3rem"}}>Resumen del lote</div>
                    <div><strong style={{color:"var(--wh2)"}}>{wizDatos.nombre||"—"}</strong> · {wizTipo||"—"} · Com. <strong style={{color:"var(--ac)"}}>{loteForm.tipoRemate==="judicial"?"10":loteForm.tipoRemate==="concursal"?"7":(loteForm.comCustom||"?")}%</strong> <span style={{fontSize:".65rem",color:"var(--mu)"}}>{loteForm.tipoRemate==="judicial"?"(judicial - fijo por ley)":loteForm.tipoRemate==="concursal"?"(concursal - fijo por ley)":"(privado)"}</span></div>
                    <div style={{color:"var(--mu2)",fontSize:".72rem"}}>{wizTipo==="VEHICULOS"?`${Object.values(wizFotos).filter(Boolean).length}/4 fotos`:`${wizItems.filter(x=>x.foto).length} foto(s)`} · {wizDocs.filter(d=>d.archivo).length} documento(s) adjunto(s)</div>
                  </div>
                </div>
              )}
            </>}
            {modal==="nuevo-postor" && <>
              <div className="modal-title">Registrar postor</div>
              <div style={{padding:".55rem .85rem",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.2)",borderRadius:7,fontSize:".74rem",color:"var(--mu2)",marginBottom:".9rem",lineHeight:1.55}}>
                Al registrarse se asignará un <strong style={{color:"var(--wh2)"}}>N° de comprador</strong> automáticamente.
              </div>
              <div className="form-grid">
                <div className="fg full"><label className="fl">Razón social o nombre completo</label>
                  <input className="fi" placeholder="Empresa Transporte José Luis Nova EIRL" value={postorForm.nombre} onChange={e=>setPostorForm(f=>({...f,nombre:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">RUT</label>
                  <input className="fi" placeholder="77.922.655-7" value={postorForm.rut} onChange={e=>setPostorForm(f=>({...f,rut:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">Teléfono</label>
                  <input className="fi" placeholder="+56 9 1234 5678" value={postorForm.telefono} onChange={e=>setPostorForm(f=>({...f,telefono:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">Email</label>
                  <input className="fi" placeholder="contacto@empresa.cl" value={postorForm.email} onChange={e=>setPostorForm(f=>({...f,email:e.target.value}))}/>
                </div>
                <div className="fg"><label className="fl">Tipo</label>
                  <select className="fsel" value={postorForm.tipo} onChange={e=>setPostorForm(f=>({...f,tipo:e.target.value}))}>
                    <option value="natural">Persona natural</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>
                <div className="fg full"><label className="fl">N° comprador asignado</label>
                  <div className="fi" style={{fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--ac)",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.25)",display:"flex",alignItems:"center"}}>
                    #{String((dbPostores.length||POSTORES_MERGED.length)+1).padStart(2,"0")} — asignado automáticamente
                  </div>
                </div>
              </div>
            </>}
            {modal==="nueva-garantia" && <>
              <div className="modal-title">Registrar garantia</div>
              <div className="gar-info" style={{marginBottom:".9rem"}}>
                <div className="gar-info-text">Monto de garantia: <strong>$300.000</strong> — Transferir a Banco Estado cta. cte. 123456789 a nombre de <strong>Remates Ahumada</strong> y adjuntar comprobante.</div>
              </div>
              <div className="form-grid">
                <div className="fg full"><label className="fl">Nombre completo</label><input className="fi" placeholder="Juan Perez Soto"/></div>
                <div className="fg"><label className="fl">RUT</label><input className="fi" placeholder="12.345.678-9"/></div>
                <div className="fg"><label className="fl">Email</label><input className="fi" placeholder="juan@email.cl"/></div>
                <div className="fg"><label className="fl">Telefono</label><input className="fi" placeholder="+56 9 1234 5678"/></div>
                <div className="fg"><label className="fl">Remate</label><select className="fsel"><option>Remate Industrial Marzo</option><option>Remate Agricola Febrero</option></select></div>
                <div className="fg"><label className="fl">Metodo de pago</label><select className="fsel"><option>Transferencia electronica</option><option>Efectivo (dia del remate)</option></select></div>
                <div className="fg full"><label className="fl">Comprobante de transferencia</label><input className="fi" type="file" accept=".pdf,.jpg,.png"/></div>
                <div className="fg full"><label className="fl">Numero de cuenta bancaria (para devolucion)</label><input className="fi" placeholder="Banco Estado N 123456789"/></div>
              </div>
            </>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>{setModal(null);resetWiz();}}>Cancelar</button>
              {modal==="nuevo-lote" ? (
                <>
                  {wizStep>1 && <button className="btn-sec" style={{marginRight:"auto"}} onClick={()=>setWizStep(s=>s-1)}>← Atrás</button>}
                  {wizStep===1 && <button className="btn-confirm" onClick={()=>{
                    if(!wizTipo){notify("Selecciona el tipo de bien.","inf");return;}
                    if(!wizDatos.nombre){notify("Ingresa el nombre del artículo.","inf");return;}
                    setWizStep(2);
                  }}>Siguiente → Fotos</button>}
                  {wizStep===2 && <button className="btn-confirm" onClick={()=>{
                    if(wizTipo==="VEHICULOS"){
                      const faltantes = ["frente","izq","der","trasera"].filter(k=>!wizFotos[k]);
                      if(faltantes.length>0){notify(`Faltan fotos: ${faltantes.join(", ")}. Las 4 fotos son obligatorias.`,"inf");return;}
                    } else {
                      if(!wizItems.some(x=>x.foto)){notify("Debes agregar al menos una foto del artículo.","inf");return;}
                    }
                    setWizStep(3);
                  }}>Siguiente → Documentos</button>}
                  {wizStep===3 && <button className="btn-confirm" onClick={async ()=>{
                        const baseNum = parseInt(wizDatos.base.replace(/\D/g,""))||0;
                        const minNum  = parseInt(wizDatos.minimo.replace(/\D/g,""))||0;
                        const incNum  = parseInt(wizDatos.incremento.replace(/\D/g,""))||Math.round(baseNum*0.05)||100000;
                        const {data:casaData} = await supabase.from("casas").select("id").eq("slug","rematesahumada").single();
                        const codigo = `L-${String(Date.now()).slice(-5)}`;
                        // Subir fotos a Supabase Storage
                        const fotoFiles = wizTipo==="VEHICULOS"
                          ? ["frente","izq","der","trasera"].map(k=>wizFotos[k]).filter(Boolean)
                          : wizItems.map(x=>x.foto).filter(Boolean);
                        const imagenes = [];
                        for(const file of fotoFiles){
                          const ext = file.name.split(".").pop()||"jpg";
                          const path = `${codigo}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                          const {error:upErr} = await supabase.storage.from("lotes").upload(path, file, {upsert:true});
                          if(upErr){ notify(`Error subiendo foto: ${upErr.message}`,"inf"); console.error(upErr); }
                          else{
                            const {data:urlData} = supabase.storage.from("lotes").getPublicUrl(path);
                            if(urlData?.publicUrl) imagenes.push(urlData.publicUrl);
                          }
                        }
                        if(fotoFiles.length>0 && imagenes.length===0){ notify("No se pudieron subir las fotos. Verifica que el bucket 'lotes' existe en Supabase Storage.","inf"); return; }
                        const {error} = await supabase.from("lotes").insert({
                          casa_id:     casaData?.id||null,
                          remate_id:   wizDatos.remateId||null,
                          codigo,
                          nombre:      wizDatos.nombre,
                          descripcion: [wizDatos.descripcion, wizDatos.exp&&`Exp: ${wizDatos.exp}`, wizDatos.mandante&&`Mandante: ${wizDatos.mandante}`, wizDatos.patente&&`Patente: ${wizDatos.patente}`, wizDatos.year&&`Año: ${wizDatos.year}`, wizDatos.km&&`Km: ${wizDatos.km}`].filter(Boolean).join(" | "),
                          categoria:   wizTipo==="VEHICULOS"?"Vehículo":wizTipo==="INMUEBLES"?"Inmueble":"Muebles",
                          base:        baseNum,
                          minimo:      minNum,
                          incremento:  incNum,
                          comision:    loteForm.tipoRemate==="judicial" ? 10 : loteForm.tipoRemate==="concursal" ? 7 : (parseFloat(loteForm.comCustom)||5),
                          tipo_iva:    "AF",
                          estado:      "disponible",
                          orden:       dbLotes.length+1,
                          imagenes:    imagenes.length>0 ? imagenes : null,
                        });
                        if(error){notify("Error al guardar lote: "+error.message,"inf");console.error(error);return;}
                        const {data:lotData} = await supabase.from("lotes").select("*").order("orden");
                        if(lotData) setDbLotes(lotData);
                        setModal(null); resetWiz(); notify("Lote guardado correctamente.","sold");
                      }}>Guardar lote</button>}
                </>
              ) : (
                <button className="btn-confirm" onClick={async ()=>{
                  if(modal==="nuevo-remate"){
                    if(!remateForm.nombre||!remateForm.fecha){notify("Completa nombre y fecha.","inf");return;}
                    const {data:casaData} = await supabase.from("casas").select("id").eq("slug","rematesahumada").single();
                    const codigo = `R-${String(Date.now()).slice(-4)}`;
                    const {error} = await supabase.from("remates").insert({
                      casa_id:   casaData?.id||null,
                      codigo,
                      nombre:    remateForm.nombre,
                      fecha:     remateForm.fecha,
                      hora:      remateForm.hora||"10:00",
                      modalidad: remateForm.modalidad,
                      tipo:      remateForm.tipo,
                      estado:    remateForm.estado||"activo",
                    });
                    if(error){notify("Error al guardar remate.","inf");console.error(error);return;}
                    const {data:remData} = await supabase.from("remates").select("*").order("created_at",{ascending:false});
                    if(remData) setDbRemates(remData);
                    setModal(null); resetRemateForm(); notify("Remate creado correctamente.","sold");
                  } else if(modal==="nuevo-postor"){
                    if(!postorForm.nombre){notify("Ingresa el nombre del postor.","inf");return;}
                    const {data:casaData} = await supabase.from("casas").select("id").eq("slug","rematesahumada").single();
                    const numero = (dbPostores.length||POSTORES_MERGED.length) + 1;
                    const {error} = await supabase.from("postores").insert({
                      casa_id:  casaData?.id||null,
                      numero,
                      nombre:   postorForm.nombre,
                      rut:      postorForm.rut,
                      email:    postorForm.email,
                      telefono: postorForm.telefono,
                      tipo:     postorForm.tipo,
                      garantia: postorForm.garantia,
                      estado:   "pendiente",
                    });
                    if(error){notify("Error al guardar postor.","inf");console.error(error);return;}
                    const {data:posData} = await supabase.from("postores").select("*").order("numero");
                    if(posData) setDbPostores(posData);
                    setModal(null); resetPostorForm(); notify(`Postor #${String(numero).padStart(2,"0")} registrado.`,"sold");
                  } else {
                    setModal(null); notify("Guardado correctamente.");
                  }
                }}>Guardar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      <div className={`mob-overlay${mobileMenu?" open":""}`} onClick={()=>setMobileMenu(false)}/>

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${mobileMenu?" open":""}`}>
        <div className="sb-logo"><GRLogo/></div>
        <div style={{height:".5rem"}}/>

        {/* GESTIÓN */}
        <div className="sb-section">Gestión</div>
        {[
          {id:"dashboard", icon:"dashboard", label:"Dashboard"},
          {id:"remates",   icon:"remates",   label:"Remates",  badge:3},
          {id:"lotes",     icon:"lotes",     label:"Lotes",    badge:LOTES_REALES.length},
          {id:"postores",  icon:"postores",  label:"Postores"},
          {id:"garantias", icon:"garantia",  label:"Garantías", badge:GARANTIAS.filter(g=>g.estado==="pendiente").length||undefined},
        ].map(n => (
          <div key={n.id} className={`sb-item${page===n.id?" on":""}`} onClick={()=>{setPage(n.id);setMobileMenu(false);}}>
            <span className="sb-icon"><Icon name={n.icon}/></span>{n.label}
            {n.badge ? <span className="sb-badge">{n.badge}</span> : null}
          </div>
        ))}

        {/* REMATE EN VIVO */}
        <div className="sb-section">Remate en vivo</div>
        <div className={`sb-item${page==="sala"?" on":""}`} onClick={()=>{setPage("sala");setMobileMenu(false);}}>
          <span className="sb-icon"><Icon name="sala"/></span>Sala en vivo
          {aState==="live" && <div className="ldot" style={{marginLeft:"auto"}}/>}
        </div>

        {/* POST-REMATE */}
        <div className="sb-section">Post-remate</div>
        {[
          {id:"adjudicac",    icon:"adjudic",  label:"Adjudicaciones"},
          {id:"liquidac",     icon:"liq",      label:"Liquidaciones", badge:liquidaciones.filter(l=>!l.enviado).length||undefined},
          {id:"devoluciones", icon:"dev",      label:"Devoluciones",  badge:devoluciones.filter(d=>d.estado==="pendiente").length||undefined},
          {id:"retiro",       icon:"vendedor", label:"Retiro de bienes", badge:dbRetiros.filter(r=>r.estado==="pendiente").length||undefined},
          {id:"vendedores",   icon:"vendedor", label:"Vendedores"},
        ].map(n => (
          <div key={n.id} className={`sb-item${page===n.id?" on":""}`} onClick={()=>setPage(n.id)}>
            <span className="sb-icon"><Icon name={n.icon}/></span>{n.label}
            {n.badge ? <span className="sb-badge" style={{background:"var(--yl)",color:"#1F2937"}}>{n.badge}</span> : null}
          </div>
        ))}

        {/* FINANZAS */}
        {session?.role==="admin" && <>
          <div className="sb-section">Finanzas</div>
          {[
            {id:"factura",  icon:"factura",  label:"Balance"},
            {id:"reportes", icon:"reportes", label:"Estadísticas"},
          ].map(n => (
            <div key={n.id} className={`sb-item${page===n.id?" on":""}`} onClick={()=>setPage(n.id)}>
              <span className="sb-icon"><Icon name={n.icon}/></span>{n.label}
            </div>
          ))}
        </>}

        {/* SISTEMA */}
        <div className="sb-section">Sistema</div>
        <div className={`sb-item${page==="config"?" on":""}`} onClick={()=>{setPage("config");setMobileMenu(false);}}>
          <span className="sb-icon"><Icon name="config"/></span>Configuración
        </div>
        {session?.role==="admin" && (
          <div className={`sb-item${page==="usuarios"?" on":""}`} onClick={()=>{setPage("usuarios");setMobileMenu(false);}}>
            <span className="sb-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2.2-5 5-5s5 2 5 5"/><path d="M13 7v4M11 9h4"/></svg>
            </span>Usuarios
          </div>
        )}
        {session?.role==="admin" && (
          <div className={`sb-item${page==="licencias"?" on":""}`} onClick={()=>{setPage("licencias");setMobileMenu(false);}}>
            <span className="sb-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="4" width="12" height="9" rx="2"/><path d="M5 4V3a3 3 0 016 0v1"/><circle cx="8" cy="9" r="1.2"/></svg>
            </span>Licencias
          </div>
        )}
        {session?.role==="admin" && (
          <div className={`sb-item${page==="casas"?" on":""}`} onClick={()=>{setPage("casas");setMobileMenu(false);}}>
            <span className="sb-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 14V7l6-5 6 5v7"/><path d="M6 14v-4h4v4"/></svg>
            </span>Casas de remates
          </div>
        )}
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-ava">{session?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"??"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sb-uname">{session?.name||"Usuario"}</div>
              <div className="sb-urole">{session?.casaNombre||"GR Auction Software"}</div>
            </div>
            <button title="Cerrar sesion" onClick={onLogout} style={{background:"transparent",border:"none",cursor:"pointer",color:"#364d70",padding:".2rem",borderRadius:4,flexShrink:0,transition:"color .15s"}}
              onMouseEnter={e=>e.target.style.color="#e05252"} onMouseLeave={e=>e.target.style.color="#364d70"}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 2H2v10h3M9 10l3-3-3-3M12 7H5"/></svg>
            </button>
          </div>
          {session?.role && (
            <div style={{marginTop:".5rem",paddingTop:".5rem",borderTop:"1px solid var(--b1)"}}>
              <span className={`role-badge ${session.role}`}>{session.role==="admin"?"Admin GR":session.role==="martillero"?"Martillero":"Postor"}</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-wrap">

        {/* TOP BAR */}
        {page !== "sala" && (
          <div className="topbar">
            <div className="topbar-left">
              <button className="mob-hamburger" onClick={()=>setMobileMenu(m=>!m)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--mu2)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 4h14M2 9h14M2 14h14"/>
                </svg>
              </button>
              <div className="topbar-title">{PAGE_TITLE[page]}</div>
            </div>
            <div className="topbar-right">
              {aState==="live" && <div className="tb-live"><div className="ldot"/>En vivo — Remate Industrial Marzo</div>}
              {page==="remates"   && <button className="btn-primary" onClick={()=>setModal("nuevo-remate")}>+ Nuevo remate</button>}
              {page==="lotes"     && <>
                <button className="btn-sec" style={{fontSize:".7rem"}} onClick={async()=>{
                  // Generar Bid Sheets PDF — hoja imprimible por lote
                  if(!LOTES_MERGED.length){ notify("No hay lotes cargados para generar el PDF.","inf"); return; }
                  try {
                  const {jsPDF} = await import("jspdf");
                  const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
                  const W = doc.internal.pageSize.getWidth();
                  const H = doc.internal.pageSize.getHeight();
                  const lotesParaSheet = LOTES_MERGED.slice(0,20);
                  // 4 lotes por hoja (2x2)
                  const perPage = 4;
                  lotesParaSheet.forEach((l,i)=>{
                    if(i>0&&i%perPage===0) doc.addPage();
                    const col = i%2; const row = Math.floor((i%perPage)/2);
                    const x = 10 + col*95; const y = 15 + row*130;
                    // Box
                    doc.setFillColor(7,15,28); doc.roundedRect(x,y,90,125,3,3,"F");
                    doc.setDrawColor(47,128,237); doc.setLineWidth(.3); doc.roundedRect(x,y,90,125,3,3,"S");
                    // Header
                    doc.setFillColor(11,31,56); doc.rect(x,y,90,18,"F");
                    doc.setTextColor(47,128,237); doc.setFontSize(7); doc.setFont("helvetica","bold");
                    doc.text(`LOTE ${i+1}`,x+4,y+7);
                    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold");
                    doc.text(l.name?.substring(0,28)||"—",x+4,y+14);
                    // Categoría
                    doc.setTextColor(90,127,168); doc.setFontSize(7); doc.setFont("helvetica","normal");
                    doc.text(l.cat||"",x+4,y+23);
                    // Precio base
                    doc.setTextColor(34,211,160); doc.setFontSize(11); doc.setFont("helvetica","bold");
                    doc.text(`Base: $${(l.base||0).toLocaleString("es-CL")}`,x+4,y+33);
                    // Líneas para pujas
                    doc.setTextColor(90,127,168); doc.setFontSize(6); doc.setFont("helvetica","normal");
                    doc.text("REGISTRO DE PUJAS",x+4,y+42);
                    doc.setDrawColor(47,128,237,0.3); doc.setLineWidth(.15);
                    for(let li=0;li<8;li++){
                      const ly = y+48+(li*8);
                      doc.text(`${li+1}.`,x+4,ly); doc.line(x+10,ly,x+86,ly);
                      doc.text("Paleta:",x+4,ly+4); doc.text("Monto: $",x+35,ly+4);
                    }
                    // Adjudicado box
                    doc.setDrawColor(34,211,160); doc.setLineWidth(.3);
                    doc.rect(x+4,y+114,82,8,"S");
                    doc.setTextColor(34,211,160); doc.setFontSize(7);
                    doc.text("ADJUDICADO — Paleta: _____ Monto: $___________",x+6,y+119);
                  });
                  doc.save("bid-sheets.pdf");
                  notify("Bid sheets generados.","sold");
                  } catch(e){ console.error(e); notify("Error al generar PDF: "+e.message,"inf"); }
                }}>🖨 Bid Sheets PDF</button>
                <label className="btn-sec" style={{fontSize:".7rem",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:".3rem"}}>
                  ↑ Importar Excel
                  <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={async e=>{
                    const file = e.target.files[0]; if(!file) return;
                    const text = await file.text();
                    const rows = text.split("\n").slice(1).filter(r=>r.trim());
                    let ok=0;
                    const {data:casaData} = await supabase.from("casas").select("id").eq("slug","rematesahumada").single();
                    for(const row of rows){
                      const cols = row.split(",").map(c=>c.replace(/"/g,"").trim());
                      if(!cols[0]) continue;
                      const {error} = await supabase.from("lotes").insert({
                        casa_id: casaData?.id||null,
                        codigo:  `L-${String(Date.now()+ok).slice(-5)}`,
                        nombre:  cols[0]||"Sin nombre",
                        descripcion: cols[1]||"",
                        base:    parseInt(cols[2])||0,
                        minimo:  parseInt(cols[3])||0,
                        incremento: parseInt(cols[4])||0,
                        comision: parseFloat(cols[5])||3,
                        estado:  "disponible",
                        orden:   dbLotes.length+ok+1,
                      });
                      if(!error) ok++;
                    }
                    const {data:lotData} = await supabase.from("lotes").select("*").order("orden");
                    if(lotData) setDbLotes(lotData);
                    notify(`${ok} lotes importados desde Excel.`,"sold");
                    e.target.value="";
                  }}/>
                </label>
                <button className="btn-primary" onClick={()=>setModal("nuevo-lote")}>+ Agregar lote</button>
              </>}
              {page==="postores"  && <button className="btn-primary" onClick={()=>setModal("nuevo-postor")}>+ Agregar postor</button>}
              {page==="garantias" && <button className="btn-primary" onClick={()=>setModal("nueva-garantia")}>+ Registrar garantia</button>}
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {page==="dashboard" && (
          <div className="page" style={{maxWidth:1100,margin:"0 auto"}}>

            {/* ── SALUDO ── */}
            <div style={{marginBottom:"2rem"}}>
              <div style={{fontSize:"1.6rem",fontWeight:800,color:"var(--wh2)",lineHeight:1.2}}>
                Bienvenido de vuelta, <span style={{color:"var(--ac)"}}>{session?.name||"Usuario"}.</span>
              </div>
              <div style={{fontSize:".9rem",color:"var(--mu)",marginTop:".4rem"}}>
                Hoy es {new Date().toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}.
              </div>
            </div>

            {/* ── LAYOUT 2 COLUMNAS ── */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:"1.5rem",alignItems:"start"}}>

              {/* COLUMNA IZQUIERDA */}
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

                {/* Cards de acción grandes */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  {/* Nuevo remate */}
                  <div onClick={()=>setModal("nuevo-remate")} style={{background:"linear-gradient(135deg,#0e7490,#06B6D4)",borderRadius:16,padding:"1.4rem",cursor:"pointer",position:"relative",overflow:"hidden",minHeight:140,display:"flex",flexDirection:"column",justifyContent:"space-between",transition:"transform .15s,box-shadow .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(6,182,212,.35)"}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                    <div style={{width:36,height:36,background:"rgba(255,255,255,.2)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="2" x2="9" y2="16"/><line x1="2" y1="9" x2="16" y2="9"/></svg>
                    </div>
                    <div>
                      <div style={{fontWeight:800,fontSize:"1rem",color:"#fff",marginBottom:".2rem"}}>Nuevo Remate</div>
                      <div style={{fontSize:".75rem",color:"rgba(255,255,255,.75)"}}>Crear un nuevo evento</div>
                    </div>
                    <div style={{position:"absolute",right:-20,top:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
                  </div>

                  {/* Agregar lote */}
                  <div onClick={()=>setModal("nuevo-lote")} style={{background:"linear-gradient(135deg,#92600a,#d97706)",borderRadius:16,padding:"1.4rem",cursor:"pointer",position:"relative",overflow:"hidden",minHeight:140,display:"flex",flexDirection:"column",justifyContent:"space-between",transition:"transform .15s,box-shadow .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(217,119,6,.35)"}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                    <div style={{width:36,height:36,background:"rgba(255,255,255,.2)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="3"/><path d="M6 9h6M9 6v6"/></svg>
                    </div>
                    <div>
                      <div style={{fontWeight:800,fontSize:"1rem",color:"#fff",marginBottom:".2rem"}}>Agregar Lote</div>
                      <div style={{fontSize:".75rem",color:"rgba(255,255,255,.75)"}}>Catalogar artículo</div>
                    </div>
                    <div style={{position:"absolute",right:-20,top:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
                  </div>
                </div>

                {/* Stats cards */}
                {[
                  {label:"Remates activos",   val:REMATES_MERGED.filter(r=>r.estado==="activo").length,  color:"#06B6D4",
                   icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M6 3v3M14 3v3M2 9h16"/></svg>},
                  {label:"Lotes publicados",  val:LOTES_MERGED.length,                                    color:"#7c3aed",
                   icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 7h6M7 11h6M7 15h3"/></svg>},
                  {label:"Postores inscritos",val:POSTORES_MERGED.length,                                 color:"#db2777",
                   icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="6" r="3"/><path d="M2 18c0-3.314 2.686-6 6-6M14 14v4M12 16h4"/></svg>},
                  {label:"Remates cerrados",  val:REMATES_MERGED.filter(r=>r.estado==="cerrado").length, color:"#6b7280",
                   icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M7 10l2 2 4-4"/></svg>},
                ].map((s,i)=>(
                  <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:14,padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`3px solid ${s.color}`}}>
                    <div>
                      <div style={{fontSize:".72rem",color:"var(--mu)",marginBottom:".3rem"}}>{s.label}</div>
                      <div style={{fontSize:"2rem",fontWeight:800,color:"var(--wh2)",lineHeight:1}}>{s.val}</div>
                    </div>
                    <div style={{width:40,height:40,background:`${s.color}15`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {s.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* COLUMNA DERECHA — Remates activos */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
                  <div style={{fontSize:"1rem",fontWeight:700,color:"var(--wh2)"}}>Remates Activos</div>
                  <button className="btn-sec" style={{fontSize:".72rem"}} onClick={()=>setPage("remates")}>Ver todos</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
                  {REMATES_MERGED.filter(r=>r.estado==="activo").length===0 ? (
                    <div style={{padding:"2rem",textAlign:"center",color:"var(--mu)",fontSize:".82rem",background:"var(--s2)",borderRadius:14,border:"1px solid var(--b1)"}}>
                      No hay remates activos.<br/>
                      <span style={{color:"var(--ac)",cursor:"pointer",fontWeight:600}} onClick={()=>setModal("nuevo-remate")}>Crear uno →</span>
                    </div>
                  ) : REMATES_MERGED.filter(r=>r.estado==="activo").map(r=>(
                    <div key={r.id} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:14,padding:"1.1rem 1.3rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",transition:"border-color .15s,box-shadow .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(6,182,212,.3)";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.06)"}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b1)";e.currentTarget.style.boxShadow="none"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:".92rem",color:"var(--wh2)",marginBottom:".5rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                        <div style={{display:"flex",gap:"1.5rem"}}>
                          <div>
                            <div style={{fontSize:".65rem",color:"var(--mu)",marginBottom:".15rem",textTransform:"uppercase",letterSpacing:".05em"}}>Estado</div>
                            <div style={{display:"flex",alignItems:"center",gap:".3rem",fontSize:".78rem",color:"var(--gr)",fontWeight:600}}>
                              <div style={{width:7,height:7,borderRadius:"50%",background:"var(--gr)"}}/>Activo
                            </div>
                          </div>
                          <div style={{width:1,background:"var(--b1)"}}/>
                          <div>
                            <div style={{fontSize:".65rem",color:"var(--mu)",marginBottom:".15rem",textTransform:"uppercase",letterSpacing:".05em"}}>Fecha</div>
                            <div style={{fontSize:".78rem",color:"var(--wh2)",fontWeight:500}}>{r.fecha||"—"}</div>
                          </div>
                          <div style={{width:1,background:"var(--b1)"}}/>
                          <div>
                            <div style={{fontSize:".65rem",color:"var(--mu)",marginBottom:".15rem",textTransform:"uppercase",letterSpacing:".05em"}}>Tipo</div>
                            <div style={{fontSize:".78rem",color:"var(--wh2)",fontWeight:500}}>{r.modal||"—"}</div>
                          </div>
                        </div>
                      </div>
                      <button style={{background:"var(--ac)",color:"#fff",border:"none",borderRadius:10,padding:".6rem 1.1rem",fontSize:".78rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--acD)"}
                        onMouseLeave={e=>e.currentTarget.style.background="var(--ac)"}
                        onClick={async(e)=>{
                          e.stopPropagation();
                          setSalaRemateId(r.supabaseId||r.id);
                          if(r.supabaseId){
                            const {data:lr} = await supabase.from("lotes").select("*").eq("remate_id",r.supabaseId).order("orden");
                            if(lr&&lr.length>0){
                              const mapped=lr.map(l=>({id:l.id,supabaseId:l.id,remateId:l.remate_id,name:l.nombre,cat:l.categoria||"Muebles",base:l.base||0,imgs:Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[]),desc:l.descripcion||"",inc:Math.round((l.base||0)*0.05)||100000}));
                              setLots(mapped); setBids(mapped.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null})));
                            }
                          }
                          setIdx(0); setAState("waiting"); setBidTimer(null);
                          setPage("sala");
                        }}>Ingresar a la Sala →</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ REMATES ══ */}
        {page==="remates" && (
          <div className="page">
            {/* Banner contextual según rol */}
            {session?.role==="admin"
              ? <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".7rem 1rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:8,fontSize:".74rem",color:"var(--mu2)"}}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--yl)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.01"/></svg>
                  <span>Vista admin — ves todos los remates de todos los clientes. Lo ideal es que <strong style={{color:"var(--wh2)"}}>cada casa de remates cree y gestione los suyos</strong> desde su propio acceso.</span>
                </div>
              : <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".7rem 1rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:8,fontSize:".74rem",color:"var(--mu2)"}}>
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
                          {/* Cambiar estado */}
                          {nextEstado[r.estado] && r.supabaseId && (
                            <button className="btn-sec" style={{fontSize:".66rem",whiteSpace:"nowrap",color:r.estado==="publicado"?"var(--gr)":r.estado==="en_vivo"?"var(--mu)":"var(--ac)"}}
                              onClick={async()=>{
                                await updateRemateEstado(r.supabaseId, nextEstado[r.estado]);
                                notify(`Remate ${nextLabel[r.estado].replace("→ ","").toLowerCase()}.`,"sold");
                              }}>
                              {nextLabel[r.estado]}
                            </button>
                          )}
                          {/* Abrir sala */}
                          {(r.estado==="publicado"||r.estado==="en_vivo"||r.estado==="activo") && (
                            <button className="btn-primary" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async()=>{
                              setSalaRemateId(r.supabaseId||r.id);
                              if(r.supabaseId){
                                const {data:lotesRemate} = await supabase.from("lotes").select("*").eq("remate_id",r.supabaseId).order("orden");
                                if(lotesRemate&&lotesRemate.length>0){
                                  const mapped = lotesRemate.map(l=>({id:l.id,supabaseId:l.id,remateId:l.remate_id,name:l.nombre,cat:l.categoria||"Muebles",base:l.base||0,imgs:Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[]),desc:l.descripcion||"",inc:l.incremento||Math.round((l.base||0)*0.05)||100000}));
                                  setLots(mapped); setBids(mapped.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null})));
                                } else { setLots(LOTES_SALA); setBids(LOTES_SALA.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null}))); notify("Sin lotes asignados aún.","inf"); }
                              }
                              setIdx(0); setAState("waiting"); setBidTimer(null);
                              setPage("sala"); notify("Sala abierta.","sold");
                            }}>Abrir sala</button>
                          )}
                          {(r.estado==="finalizado"||r.estado==="cerrado") && (<>
                            <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap",color:"var(--gr)",border:"1px solid rgba(20,184,166,.25)"}}
                              onClick={()=>{ setSelectedRemate(r.id||r.supabaseId); setPage("liquidac"); }}>
                              Ver liquidaciones
                            </button>
                            <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap",background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(20,184,166,.12))",border:"1px solid rgba(6,182,212,.3)",color:"var(--ac)",fontWeight:700}}
                              onClick={()=>{ setAiRemateResult(null); setAiRemateModal(r); }}>
                              ✨ Resumen IA
                            </button>
                          </>)}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ LOTES ══ */}
        {page==="lotes" && (()=>{
          const lotesDelRemate = lotesFiltroRemate
            ? LOTES_MERGED.filter(l => l.remateId === lotesFiltroRemate || l.remate_id === lotesFiltroRemate)
            : LOTES_MERGED;
          const lotesMostrar = filterTab==="todos" ? lotesDelRemate : lotesDelRemate.filter(l=>l.estado===filterTab);
          return (
          <div className="page">
            {/* Selector de remate */}
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".65rem 1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:9}}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinecap="round"><rect x="1" y="2" width="13" height="11" rx="2"/><path d="M1 6h13M5 2v4M10 2v4"/></svg>
              <span style={{fontSize:".75rem",fontWeight:600,color:"var(--mu2)",whiteSpace:"nowrap"}}>Filtrar por remate:</span>
              <select className="fsel" style={{flex:1,maxWidth:320}} value={lotesFiltroRemate||""} onChange={e=>setLotesFiltroRemate(e.target.value||null)}>
                <option value="">Todos los lotes</option>
                {REMATES_MERGED.map(r=>(
                  <option key={r.supabaseId||r.id} value={r.supabaseId||r.id}>{r.name} — {r.fecha}</option>
                ))}
              </select>
              {lotesFiltroRemate && <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>setLotesFiltroRemate(null)}>× Limpiar</button>}
            </div>
            <div className="filter-row" style={{marginBottom:"1rem"}}>
              {["todos","publicado","vendido","sin vender"].map(f => (
                <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>{f}</button>
              ))}
            </div>
            <div className="table-card">
              <div className="table-head">
                <div className="table-title">{lotesMostrar.length} lotes{lotesFiltroRemate ? ` — ${REMATES_MERGED.find(r=>(r.supabaseId||r.id)===lotesFiltroRemate)?.name||""}` : ""}</div>
                <div style={{display:"flex",gap:".5rem"}}>
                  <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>notify("Exportando listado...","inf")}>Exportar PDF</button>
                </div>
              </div>
              <table>
                <thead><tr><th>Código</th><th>Artículo</th><th>Categoría</th><th>Base</th><th>Com.</th><th>Estado</th></tr></thead>
                <tbody>
                  {lotesMostrar.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign:"center",color:"var(--mu)",padding:"2rem",fontSize:".8rem"}}>
                      {lotesFiltroRemate ? "Este remate no tiene lotes aún. Usa + Agregar lote." : "No hay lotes registrados."}
                    </td></tr>
                  ) : lotesMostrar.map(l => (
                    <tr key={l.id}>
                      <td><span className="exp-badge">{l.id}</span></td>
                      <td style={{fontWeight:600}}>{l.name}</td>
                      <td className="mono">{l.cat}</td>
                      <td className="gt">{fmt(l.base)}</td>
                      <td className="mono" style={{color:"var(--ac)",fontWeight:600}}>{l.com}%</td>
                      <td><span className={`pill p-${l.estado?.replace(" ","-")||"publicado"}`}>{l.estado||"publicado"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* ══ POSTORES ══ */}
        {page==="postores" && (()=>{
          const pendientes = POSTORES_MERGED.filter(p=>p.estado==="pendiente");
          return (
          <div className="page">
            {/* Selector de remate para filtrar */}
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".65rem 1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:9}}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinecap="round"><rect x="1" y="2" width="13" height="11" rx="2"/><path d="M1 6h13M5 2v4M10 2v4"/></svg>
              <span style={{fontSize:".75rem",fontWeight:600,color:"var(--mu2)",whiteSpace:"nowrap"}}>Remate:</span>
              <select className="fsel" style={{flex:1,maxWidth:320}} value={lotesFiltroRemate||""} onChange={e=>setLotesFiltroRemate(e.target.value||null)}>
                <option value="">Todos los remates</option>
                {REMATES_MERGED.map(r=><option key={r.supabaseId||r.id} value={r.supabaseId||r.id}>{r.name}</option>)}
              </select>
              {lotesFiltroRemate && <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>setLotesFiltroRemate(null)}>× Todos</button>}
            </div>

            {/* Alerta pendientes */}
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
                  {f==="todos"?"Todos":f==="verificado"?"Verificados":f==="pendiente"?`Pendientes ${pendientes.length>0?`(${pendientes.length})`:""}` : f}
                </button>
              ))}
            </div>

            <div className="table-card">
              <div className="table-head">
                <div className="table-title">
                  {POSTORES_MERGED.filter(p=>(filterTab==="todos"||p.estado===filterTab)&&(!lotesFiltroRemate||(p.remateId===lotesFiltroRemate||p.remate_id===lotesFiltroRemate))).length} postores
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>N°</th><th>Nombre</th><th>RUT</th><th>Email</th><th>Teléfono</th><th>Modalidad</th><th>Comprobante</th><th>Estado</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {POSTORES_MERGED
                    .filter(p=>(filterTab==="todos"||p.estado===filterTab)&&(!lotesFiltroRemate||(p.remateId===lotesFiltroRemate||p.remate_id===lotesFiltroRemate)))
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
                                  // Enviar email de confirmación al postor
                                  const casaInfo = dbLicencias.find(x => x.slug === session?.casa) || {};
                                  const remateInfo = REMATES_MERGED.find(r => (r.supabaseId||r.id) === p.remate_id);
                                  if(p.email){
                                    try {
                                      await fetch("/api/send-email", {
                                        method: "POST",
                                        headers: {"Content-Type":"application/json"},
                                        body: JSON.stringify({
                                          tipo:          "verificado",
                                          nombre:        p.name,
                                          numero:        String(p.nComprador).padStart(3,"0"),
                                          remate:        remateInfo?.name || "Remate",
                                          fecha:         remateInfo?.fecha || null,
                                          casa:          casaInfo.nombre || session?.casaNombre || "",
                                          logo_url:      casaInfo.logo_url || null,
                                          email_cliente: p.email,
                                          email_casa:    casaInfo.email || null,
                                          modalidad:     p.modalidad || null,
                                        }),
                                      });
                                    } catch(e) { /* no bloquea */ }
                                  }
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
                            <button className="btn-sec" style={{fontSize:".65rem",padding:".22rem .55rem",color:"#f87171",borderColor:"rgba(248,113,113,.3)"}}
                              onClick={async()=>{
                                if(!window.confirm(`¿Eliminar a ${p.name}? Esta acción no se puede deshacer.`)) return;
                                const {error} = await supabase.from("postores").delete().eq("id",p.supabaseId);
                                if(!error){ const {data} = await supabase.from("postores").select("*").order("numero"); if(data) setDbPostores(data); notify(`${p.name} eliminado.`,"inf"); }
                                else notify("Error al eliminar postor.","inf");
                              }}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Link de inscripción pública */}
            <div style={{marginTop:"1.2rem",padding:".85rem 1rem",background:"rgba(37,99,235,.05)",border:"1px solid rgba(37,99,235,.15)",borderRadius:10,display:"flex",alignItems:"center",gap:".75rem",flexWrap:"wrap"}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M4 7h6M7 4l3 3-3 3"/></svg>
              <span style={{fontSize:".75rem",color:"var(--mu2)"}}>Link de inscripción pública:</span>
              <code style={{fontSize:".73rem",color:"var(--ac)",fontFamily:"Inter,sans-serif",flex:1}}>
                gestionderemates.cl/participar?id={session?.casaId||session?.casa||"—"}
              </code>
              <button className="btn-sec" style={{fontSize:".68rem"}} onClick={()=>{
                navigator.clipboard.writeText(`https://gestionderemates.cl/participar?id=${session?.casaId||session?.casa||""}`);
                notify("Link copiado al portapapeles.","sold");
              }}>Copiar link</button>
            </div>
          </div>
          );
        })()}

        {/* ══ FACTURACION ══ */}
        {page==="factura" && (
          <div className="page">
            {/* ── Header con selector de remate ── */}
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"1.4rem",paddingBottom:"1rem",borderBottom:"2px solid var(--ac)"}}>
              <div>
                <div style={{fontSize:"1.5rem",fontWeight:900,color:"var(--ac)",letterSpacing:"-.03em",textTransform:"uppercase",fontStyle:"italic",lineHeight:1}}>Balance Económico</div>
                <div style={{fontSize:".76rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginTop:".3rem"}}>
                  <select className="fsel" style={{fontSize:".75rem",width:"auto",background:"transparent",border:"none",color:"var(--mu2)",fontWeight:700,padding:"0",cursor:"pointer"}}>
                    {REMATES_MERGED.map(r=><option key={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:".5rem"}}>
                <button className="btn-sec" style={{fontSize:".72rem"}} onClick={()=>setPage("reportes")}>← Estadísticas</button>
                <button className="btn-primary" style={{fontSize:".72rem"}} onClick={()=>notify("Imprimiendo balance...","inf")}>Imprimir</button>
              </div>
            </div>

            {/* ── 3 cards hero ── */}
            {(()=>{
              const adjAll = [...ADJUDICACIONES, ...liquidaciones];
              const ventaTotal   = adjAll.reduce((s,a)=>s+(a.monto||0),0);
              const totalCom     = adjAll.reduce((s,a)=>s+(a.com||Math.round((a.monto||0)*0.03)),0);
              const totalGAdm    = adjAll.reduce((s,a)=>s+(a.gastosAdm||0),0);
              const iva          = Math.round((totalCom+totalGAdm)*0.19);
              const ingresoBruto = totalCom + totalGAdm + iva;
              const motorizados  = adjAll.filter(a=>a.motorizado||LOTES_REALES.find(l=>l.name===a.lote)?.motorizado).length;
              return (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".85rem",marginBottom:"1.3rem"}}>
                  {[
                    {label:"Venta total martillo", val:fmt(ventaTotal),          accent:"var(--gr)",  sub:"monto adjudicado total"},
                    {label:"Ingreso bruto empresa",val:fmt(ingresoBruto),        accent:"var(--ac)",  sub:"com. + G.adm. + IVA"},
                    {label:"Motorizados",           val:`${motorizados} vehículos`,accent:"var(--yl)",sub:`${fmt(motorizados*GASTO_ADMIN_MOTORIZADO)} en G.adm.`},
                  ].map((c,i)=>(
                    <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.1rem 1.25rem",borderBottom:`3px solid ${c.accent}`,textAlign:"center"}}>
                      <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".4rem"}}>{c.label}</div>
                      <div style={{fontSize:"1.45rem",fontWeight:900,color:c.accent,lineHeight:1,marginBottom:".25rem"}}>{c.val}</div>
                      <div style={{fontSize:".65rem",color:"var(--mu)"}}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Dos columnas: tramos comisión + gastos e impuestos ── */}
            {(()=>{
              const adjAll = [...ADJUDICACIONES, ...liquidaciones];
              // Agrupar por tramo de comisión
              const tramos = {};
              adjAll.forEach(a=>{
                const pct = a.comPct ?? 3;
                if(!tramos[pct]) tramos[pct]={pct,lotes:[],subtotalMonto:0,subtotalCom:0};
                tramos[pct].lotes.push(a);
                tramos[pct].subtotalMonto += a.monto||0;
                tramos[pct].subtotalCom   += a.com||Math.round((a.monto||0)*pct/100);
              });
              const tramosArr = Object.values(tramos).sort((a,b)=>b.pct-a.pct);
              const totalComNeto = tramosArr.reduce((s,t)=>s+t.subtotalCom,0);
              const totalGAdm    = adjAll.reduce((s,a)=>s+(a.gastosAdm||0),0);
              const iva          = Math.round((totalComNeto+totalGAdm)*0.19);
              const sumaExtras   = totalGAdm + iva;

              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".85rem",marginBottom:"1.1rem"}}>

                  {/* Comisiones netas por tramo */}
                  <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,overflow:"hidden"}}>
                    <div style={{background:"var(--s3)",padding:".6rem 1rem",fontSize:".65rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".08em",textAlign:"center",borderBottom:"1px solid var(--b1)"}}>
                      Comisiones netas por tramo
                    </div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid var(--b1)"}}>
                          {["Tramo","Lotes","Venta neta","Comisión"].map(h=>(
                            <th key={h} style={{padding:".45rem .75rem",fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",textAlign:h==="Lotes"?"center":"right",letterSpacing:".04em"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tramosArr.length===0 && (
                          <tr><td colSpan={4} style={{padding:"1.5rem",textAlign:"center",color:"var(--mu)",fontSize:".75rem",fontStyle:"italic"}}>Sin comisiones registradas</td></tr>
                        )}
                        {tramosArr.map((t,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid var(--b1)"}}>
                            <td style={{padding:".55rem .75rem"}}>
                              <span style={{padding:".15rem .5rem",background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",borderRadius:5,fontFamily:"Inter,sans-serif",fontSize:".72rem",fontWeight:700,color:"var(--ac)"}}>{t.pct}%</span>
                            </td>
                            <td style={{padding:".55rem .75rem",textAlign:"center",fontFamily:"Inter,sans-serif",fontSize:".76rem",color:"var(--mu2)"}}>{t.lotes.length}</td>
                            <td style={{padding:".55rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".73rem",color:"var(--wh2)"}}>{fmt(t.subtotalMonto)}</td>
                            <td style={{padding:".55rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".76rem",fontWeight:700,color:"var(--gr)"}}>{fmt(t.subtotalCom)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid var(--b2)",background:"rgba(255,255,255,.02)"}}>
                          <td colSpan={3} style={{padding:".65rem .75rem",textAlign:"right",fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".04em"}}>Total neto comisiones</td>
                          <td style={{padding:".65rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".85rem",fontWeight:900,color:"var(--gr)"}}>{fmt(totalComNeto)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Gastos e impuestos */}
                  <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,overflow:"hidden"}}>
                    <div style={{background:"var(--s3)",padding:".6rem 1rem",fontSize:".65rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".08em",textAlign:"center",borderBottom:"1px solid var(--b1)"}}>
                      Gastos e impuestos
                    </div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <tbody>
                        {[
                          ["Comisiones netas (base AF)",    fmt(totalComNeto), "var(--gr)"],
                          ["Gastos adm. motorizados (neto)",fmt(totalGAdm),    "var(--yl)"],
                          ["Base afecta IVA",               fmt(totalComNeto+totalGAdm), "var(--mu2)"],
                          ["IVA 19% s/ingresos",            fmt(iva),          "var(--mu2)"],
                        ].map(([l,v,c],i)=>(
                          <tr key={i} style={{borderBottom:"1px solid var(--b1)"}}>
                            <td style={{padding:".65rem .9rem",fontSize:".76rem",fontStyle:"italic",color:"var(--mu2)"}}>{l}</td>
                            <td style={{padding:".65rem .9rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:c,fontSize:".8rem"}}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid rgba(246,173,85,.3)",background:"rgba(246,173,85,.04)"}}>
                          <td style={{padding:".7rem .9rem",textAlign:"right",fontSize:".72rem",fontWeight:700,color:"var(--yl)",textTransform:"uppercase",letterSpacing:".04em"}}>Suma extras + IVA</td>
                          <td style={{padding:".7rem .9rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".88rem",fontWeight:900,color:"var(--yl)"}}>{fmt(sumaExtras)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Ingreso neto empresa — resultado final */}
                    <div style={{margin:"1rem",padding:".85rem 1rem",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.2)",borderRadius:9}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Ingreso neto empresa</div>
                          <div style={{fontSize:".68rem",color:"var(--mu)",lineHeight:1.4}}>Com. netas + G.adm. − IVA</div>
                        </div>
                        <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.2rem",fontWeight:900,color:"var(--ac)"}}>
                          {fmt(totalComNeto + totalGAdm - iva)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Detalle lote a lote ── */}
            <div className="table-card">
              <div className="table-head"><div className="table-title">Detalle por lote adjudicado</div></div>
              <table>
                <thead><tr><th>Comprador</th><th>Lote</th><th>Tipo</th><th>Monto</th><th>Com %</th><th>Comisión</th><th>G.Adm.</th><th>Total empresa</th></tr></thead>
                <tbody>
                  {[...ADJUDICACIONES,...liquidaciones].map((a,i)=>{
                    const com     = a.com||Math.round((a.monto||0)*(a.comPct??3)/100);
                    const gadm    = a.gastosAdm||0;
                    const postorD = POSTORES_MERGED.find(p=>p.name===a.postor||p.razonSocial===a.postor);
                    const loteR   = LOTES_REALES.find(l=>l.name===a.lote);
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                            <div style={{width:22,height:22,borderRadius:5,background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:".6rem",fontWeight:800,color:"var(--ac)",flexShrink:0}}>
                              {String(postorD?.nComprador||"?").padStart(2,"0")}
                            </div>
                            <span style={{fontSize:".76rem",fontWeight:600}}>{a.postor}</span>
                          </div>
                        </td>
                        <td style={{fontSize:".73rem",color:"var(--mu2)"}}>{a.lote}</td>
                        <td>
                          {loteR?.tipoRemate && <span className="pill" style={{fontSize:".6rem",background:"rgba(56,178,246,.08)",color:"var(--ac)",border:"1px solid rgba(56,178,246,.2)"}}>{COMISIONES[loteR.tipoRemate]?.label||loteR.tipoRemate}</span>}
                        </td>
                        <td className="gt">{fmt(a.monto||0)}</td>
                        <td style={{fontFamily:"Inter,sans-serif",fontSize:".73rem",fontWeight:700,color:"var(--ac)",textAlign:"center"}}>{a.comPct??3}%</td>
                        <td style={{fontFamily:"Inter,sans-serif",fontSize:".73rem",fontWeight:700,color:"var(--gr)",textAlign:"right"}}>{fmt(com)}</td>
                        <td style={{fontFamily:"Inter,sans-serif",fontSize:".73rem",color: gadm?"var(--yl)":"var(--mu)",textAlign:"right"}}>{gadm?fmt(gadm):"—"}</td>
                        <td style={{fontFamily:"Inter,sans-serif",fontSize:".78rem",fontWeight:800,color:"var(--wh2)",textAlign:"right"}}>{fmt(com+gadm)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {(()=>{
                    const adjAll = [...ADJUDICACIONES,...liquidaciones];
                    const tCom  = adjAll.reduce((s,a)=>s+(a.com||Math.round((a.monto||0)*(a.comPct??3)/100)),0);
                    const tGadm = adjAll.reduce((s,a)=>s+(a.gastosAdm||0),0);
                    return (
                      <tr style={{borderTop:"2px solid var(--b2)",background:"rgba(255,255,255,.02)"}}>
                        <td colSpan={5} style={{padding:".6rem .75rem",textAlign:"right",fontSize:".7rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase"}}>Totales</td>
                        <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:900,color:"var(--gr)",fontSize:".82rem"}}>{fmt(tCom)}</td>
                        <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--yl)",fontSize:".82rem"}}>{fmt(tGadm)}</td>
                        <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:900,color:"var(--ac)",fontSize:".85rem"}}>{fmt(tCom+tGadm)}</td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ══ RETIRO DE BIENES ══ */}
        {page==="retiro" && (()=>{
          // Construir lista de retiros desde liquidaciones generadas
          const retirosCombinados = [
            ...liquidaciones.map(liq=>({
              id: liq.id,
              postor: liq.postor,
              rut: liq.rut||"—",
              lote: liq.lote,
              monto: liq.monto,
              estado: liq.retiro?"retirado":"pendiente",
              fechaRetiro: liq.retiro||null,
              pagado: liq.estado==="pagado",
              supabaseId: null,
            })),
            ...dbRetiros,
          ];

          const cerrados = REMATES_MERGED.filter(r=>r.estado==="finalizado"||r.estado==="cerrado");
          const pendientes = retirosCombinados.filter(r=>r.estado==="pendiente").length;
          const retirados  = retirosCombinados.filter(r=>r.estado==="retirado").length;

          return (
            <div className="page">
              {/* Selector de remate */}
              <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.2rem",padding:".7rem 1rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:9}}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinecap="round"><rect x="1" y="2" width="13" height="11" rx="2"/><path d="M1 6h13M5 2v4M10 2v4"/></svg>
                <span style={{fontSize:".75rem",fontWeight:600,color:"var(--mu2)",whiteSpace:"nowrap"}}>Remate:</span>
                <select className="fsel" style={{flex:1,maxWidth:340}} value={retiroFiltroRemate||""} onChange={e=>setRetiroFiltroRemate(e.target.value||null)}>
                  <option value="">— Seleccionar remate —</option>
                  {cerrados.map(r=><option key={r.supabaseId||r.id} value={r.supabaseId||r.id}>{r.name} · {r.fecha}</option>)}
                </select>
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".75rem",marginBottom:"1.3rem"}}>
                {[
                  {label:"Total adjudicados", val:retirosCombinados.length, color:"var(--ac)"},
                  {label:"Pendientes de retiro", val:pendientes, color:"var(--yl)"},
                  {label:"Ya retirados", val:retirados, color:"var(--gr)"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:".85rem 1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderTop:`3px solid ${s.color}`,borderRadius:10}}>
                    <div style={{fontSize:"1.5rem",fontWeight:800,color:"var(--wh2)",lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:".68rem",color:"var(--mu2)",marginTop:".3rem"}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {retirosCombinados.length === 0 ? (
                <div style={{textAlign:"center",padding:"3rem",color:"var(--mu)",fontSize:".8rem",background:"var(--s2)",borderRadius:10,border:"1px solid var(--b1)"}}>
                  No hay adjudicaciones registradas. Los retiros aparecen aquí al cerrar un remate.
                </div>
              ) : (
                <div className="table-card">
                  <div className="table-head">
                    <div className="table-title">Lista de retiros — {pendientes} pendientes</div>
                    <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>{
                      const csv = ["Postor,RUT,Lote,Monto,Estado,Fecha retiro",
                        ...retirosCombinados.map(r=>`${r.postor},${r.rut},"${r.lote}",${r.monto},${r.estado},${r.fechaRetiro||""}`)
                      ].join("\n");
                      const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
                      a.download = "retiros.csv"; a.click();
                    }}>Exportar CSV</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>N° Postor</th><th>Nombre</th><th>RUT</th><th>Lote adjudicado</th><th>Monto</th><th>Pago</th><th>Retiro</th><th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retirosCombinados.map((r,i)=>(
                        <tr key={r.id||i} style={{opacity:r.estado==="retirado"?.6:1}}>
                          <td className="mono" style={{fontWeight:700,color:"var(--ac)"}}>
                            {POSTORES_MERGED.find(p=>p.name===r.postor)?.nComprador ? `#${String(POSTORES_MERGED.find(p=>p.name===r.postor).nComprador).padStart(2,"0")}` : "—"}
                          </td>
                          <td style={{fontWeight:600}}>{r.postor}</td>
                          <td className="mono" style={{fontSize:".72rem"}}>{r.rut}</td>
                          <td style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.lote}</td>
                          <td className="gt">{fmt(r.monto||0)}</td>
                          <td>
                            <span style={{fontSize:".65rem",fontWeight:700,padding:".15rem .45rem",borderRadius:5,background:r.pagado?"rgba(20,184,166,.1)":"rgba(246,173,85,.1)",color:r.pagado?"var(--gr)":"var(--yl)"}}>
                              {r.pagado?"✓ Pagado":"Pendiente"}
                            </span>
                          </td>
                          <td>
                            {r.estado==="retirado"
                              ? <span style={{fontSize:".65rem",fontWeight:700,padding:".15rem .45rem",borderRadius:5,background:"rgba(20,184,166,.1)",color:"var(--gr)"}}>
                                  ✓ Retirado {r.fechaRetiro&&<span style={{color:"var(--mu)",fontWeight:400}}>· {r.fechaRetiro}</span>}
                                </span>
                              : <span style={{fontSize:".65rem",fontWeight:700,padding:".15rem .45rem",borderRadius:5,background:"rgba(246,173,85,.1)",color:"var(--yl)"}}>
                                  ⏳ Pendiente
                                </span>
                            }
                          </td>
                          <td>
                            {r.estado==="pendiente" ? (
                              <button className="btn-confirm" style={{fontSize:".68rem",padding:".28rem .65rem",background:"rgba(20,184,166,.12)",color:"var(--gr)",border:"1px solid rgba(20,184,166,.3)"}}
                                onClick={()=>{
                                  const fecha = new Date().toLocaleDateString("es-CL");
                                  setLiquidaciones(prev=>prev.map(l=>l.id===r.id?{...l,retiro:fecha}:l));
                                  setDbRetiros(prev=>prev.map(x=>x.id===r.id?{...x,estado:"retirado",fechaRetiro:fecha}:x));
                                  notify(`${r.postor} marcado como retirado.`,"sold");
                                }}>
                                ✓ Marcar retirado
                              </button>
                            ) : (
                              <button className="btn-sec" style={{fontSize:".68rem",padding:".28rem .65rem"}}
                                onClick={()=>{
                                  setLiquidaciones(prev=>prev.map(l=>l.id===r.id?{...l,retiro:null}:l));
                                  setDbRetiros(prev=>prev.map(x=>x.id===r.id?{...x,estado:"pendiente",fechaRetiro:null}:x));
                                  notify("Retiro desmarcado.","inf");
                                }}>
                                Deshacer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ VENDEDORES / CONSIGNATARIOS ══ */}
        {page==="vendedores" && (()=>{
          const vd = VENDEDORES_MOCK.find(v=>v.id===vendedorSel);
          // Banner selector remate (inline)
          const BannerRemate = () => {
            const cerrados = REMATES_MERGED.filter(r => r.estado === "cerrado");
            return (
              <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.2rem",padding:".75rem 1rem",background:"rgba(56,178,246,.06)",border:"1px solid rgba(56,178,246,.18)",borderRadius:9}}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5h6M5 11h3"/></svg>
                <span style={{fontSize:".78rem",fontWeight:700,color:"var(--wh2)",whiteSpace:"nowrap"}}>Remate:</span>
                <select value={selectedRemate||""} onChange={e=>setSelectedRemate(e.target.value||null)}
                  style={{flex:1,maxWidth:340,padding:".4rem .7rem",background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:7,color:"var(--wh2)",fontSize:".8rem",fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                  <option value="">— Todos los remates cerrados —</option>
                  {cerrados.map(r=><option key={r.id} value={r.id}>{r.name} · {r.fecha} · {r.casa}</option>)}
                </select>
                {selectedRemate && <button onClick={()=>setSelectedRemate(null)} style={{background:"transparent",border:"1px solid var(--b2)",borderRadius:6,color:"var(--mu2)",fontSize:".7rem",padding:".3rem .6rem",cursor:"pointer"}}>Ver todos</button>}
              </div>
            );
          };
          // Calcular lotes del vendedor seleccionado (mock: todos los lotes reales)
          const lotesVendedor = LOTES_REALES.filter((_,i)=>i<4); // mock: primeros 4 lotes
          const adjVendedor   = [...ADJUDICACIONES,...liquidaciones].filter(a=>
            lotesVendedor.find(l=>l.name===a.lote)
          );
          const totalVentas   = adjVendedor.reduce((s,a)=>s+(a.monto||0),0);
          const lotesNoVendidos = lotesVendedor.filter(l=>!adjVendedor.find(a=>a.lote===l.name));
          const totalNoVendido  = lotesNoVendidos.reduce((s,l)=>s+(l.base||0),0);
          const comVentaMonto  = Math.round(totalVentas * (vendedorForm.comVenta/100));
          const comDefensaMonto= Math.round(totalNoVendido * (vendedorForm.comDefensa/100));
          const ivaBase        = comVentaMonto + comDefensaMonto + Number(vendedorForm.publicidad||0);
          const iva            = Math.round(ivaBase * 0.19);
          const totalDescuentos= comVentaMonto + comDefensaMonto + Number(vendedorForm.publicidad||0) + iva;
          const liquidoAPagar  = totalVentas - totalDescuentos;

          const generarPDFVendedor = async () => {
            const { jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            const casaNombre = session?.casaNombre || "Remates Ahumada";
            const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"letter"});
            const W = doc.internal.pageSize.getWidth();
            let y = 18;
            const fmtCLP = v => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(v);

            // Cabecera
            doc.setFillColor(47,128,237);
            doc.rect(14,y-6,W-28,0.8,"F");
            doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(47,128,237);
            doc.text("LIQUIDACIÓN DE VENDEDOR",14,y+4);
            doc.setFontSize(9); doc.setTextColor(100,100,100);
            doc.text(casaNombre.toUpperCase(),14,y+10);
            doc.setFontSize(10); doc.setTextColor(50,50,50);
            doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`,W-14,y+4,{align:"right"});
            doc.setFontSize(9); doc.setTextColor(120,120,120);
            doc.text(`Remate: ${REMATES_MERGED[0]?.name||"—"}`,W-14,y+10,{align:"right"});
            y+=18;

            // Datos vendedor
            doc.setFillColor(247,249,252); doc.setDrawColor(221,227,240);
            doc.roundedRect(14,y,W-28,26,2,2,"FD");
            const datosV = [["Propietario/Vendedor:",vd?.nombre||"—"],["R.U.T:",vd?.rut||"—"],["Giro:",vd?.giro||"—"],["Dirección:",vd?.direccion||"—"],["Comuna:",vd?.comuna||"—"],["Email:",vd?.email||"—"]];
            let dy=y+6;
            datosV.slice(0,3).forEach(([k,v])=>{
              doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(140,140,140); doc.text(k,18,dy);
              doc.setFont("helvetica","normal"); doc.setTextColor(30,30,30); doc.text(v,52,dy); dy+=7;
            });
            dy=y+6;
            datosV.slice(3).forEach(([k,v])=>{
              doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(140,140,140); doc.text(k,W/2+4,dy);
              doc.setFont("helvetica","normal"); doc.setTextColor(30,30,30); doc.text(v,W/2+22,dy); dy+=7;
            });
            y+=31;

            // Tabla lotes vendidos
            doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(26,37,64);
            doc.text("Lotes vendidos",14,y); y+=4;
            autoTable(doc,{
              startY:y,
              head:[["Expediente","Descripción","Precio martillo"]],
              body: adjVendedor.map(a=>[lotesVendedor.find(l=>l.name===a.lote)?.exp||"—", a.lote, fmtCLP(a.monto||0)]),
              styles:{fontSize:9,cellPadding:2.5},
              headStyles:{fillColor:[26,37,64],textColor:255,fontStyle:"bold",fontSize:8},
              columnStyles:{2:{halign:"right",font:"courier",fontStyle:"bold"}},
              alternateRowStyles:{fillColor:[250,251,253]},
            });
            y=doc.lastAutoTable.finalY+6;

            // Tabla lotes no vendidos
            if(lotesNoVendidos.length>0){
              doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(26,37,64);
              doc.text("Lotes no vendidos (base para comisión defensa)",14,y); y+=4;
              autoTable(doc,{
                startY:y,
                head:[["Expediente","Descripción","Base"]],
                body:lotesNoVendidos.map(l=>[l.exp||"—",l.name,fmtCLP(l.base||0)]),
                styles:{fontSize:9,cellPadding:2.5},
                headStyles:{fillColor:[100,100,100],textColor:255,fontStyle:"bold",fontSize:8},
                columnStyles:{2:{halign:"right",font:"courier"}},
              });
              y=doc.lastAutoTable.finalY+6;
            }

            // Liquidación financiera
            const items = [
              ["Total ventas martillo:", totalVentas, false],
              [`Comisión ventas ${vendedorForm.comVenta}%:`, -comVentaMonto, true],
              [`Comisión defensa ${vendedorForm.comDefensa}%:`, -comDefensaMonto, true],
              ["Avisos publicitarios:", -Number(vendedorForm.publicidad||0), true],
              ["IVA 19% s/comisiones:", -iva, true],
            ];
            items.forEach(([k,v,desc])=>{
              doc.setFont("helvetica",desc?"normal":"bold"); doc.setFontSize(9.5);
              doc.setTextColor(desc?80:30,desc?80:30,desc?80:30);
              doc.text(k,14,y);
              doc.setFont("helvetica","bold"); doc.setTextColor(desc?200:47, desc?80:128, desc?80:237);
              doc.text(fmtCLP(v),W-14,y,{align:"right"});
              doc.setDrawColor(238,240,245); doc.line(14,y+2,W-14,y+2);
              y+=8;
            });
            // Línea total
            doc.setDrawColor(47,128,237); doc.setLineWidth(0.8); doc.line(14,y-2,W-14,y-2);
            doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(47,128,237);
            doc.text("Líquido a pagar al vendedor:",14,y+6);
            doc.setFontSize(15); doc.text(fmtCLP(liquidoAPagar),W-14,y+6,{align:"right"});

            // Footer
            const fy=doc.internal.pageSize.getHeight()-12;
            doc.setDrawColor(221,227,240); doc.setLineWidth(0.3); doc.line(14,fy-3,W-14,fy-3);
            doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(170,170,170);
            doc.text(`${casaNombre} — Liquidación generada por GR Auction Software`,14,fy+2);
            doc.text(new Date().toLocaleDateString("es-CL"),W-14,fy+2,{align:"right"});
            doc.save(`liquidacion-vendedor-${(vd?.nombre||"vendedor").replace(/\s+/g,"-").toLowerCase()}.pdf`);
          };

          return (
            <div className="page">
              <BannerRemate/>
              <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:"1.2rem",alignItems:"start"}}>

                {/* ── Formulario selección vendedor ── */}
                <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.2rem 1.3rem"}}>
                  <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:"1rem"}}>Seleccionar vendedor / consignatario</div>

                  <div style={{marginBottom:".85rem"}}>
                    <label className="fl">Propietario / Vendedor</label>
                    <select className="fsel" value={vendedorSel} onChange={e=>setVendedorSel(e.target.value)}>
                      <option value="">Seleccione un vendedor</option>
                      {VENDEDORES_MOCK.map(v=><option key={v.id} value={v.id}>{v.nombre}</option>)}
                    </select>
                  </div>

                  {vd && (
                    <div style={{padding:".65rem .85rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:8,marginBottom:".85rem",fontSize:".72rem",color:"var(--mu2)",lineHeight:1.8}}>
                      <div><strong style={{color:"var(--wh2)"}}>RUT:</strong> {vd.rut}</div>
                      <div><strong style={{color:"var(--wh2)"}}>Giro:</strong> {vd.giro}</div>
                      <div><strong style={{color:"var(--wh2)"}}>Dirección:</strong> {vd.direccion}, {vd.comuna}</div>
                      <div><strong style={{color:"var(--wh2)"}}>Email:</strong> {vd.email}</div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:".7rem"}}>
                    <div>
                      <label className="fl">Comisión ventas (%)</label>
                      <input className="fi" type="number" step="0.01" min="0" max="100"
                        value={vendedorForm.comVenta}
                        onChange={e=>setVendedorForm(f=>({...f,comVenta:parseFloat(e.target.value)||0}))}/>
                    </div>
                    <div>
                      <label className="fl">Comisión defensa (%)</label>
                      <input className="fi" type="number" step="0.01" min="0" max="100"
                        value={vendedorForm.comDefensa}
                        onChange={e=>setVendedorForm(f=>({...f,comDefensa:parseFloat(e.target.value)||0}))}/>
                    </div>
                  </div>
                  <div style={{marginBottom:"1rem"}}>
                    <label className="fl">Avisos publicitarios ($)</label>
                    <input className="fi" type="number" min="0"
                      value={vendedorForm.publicidad}
                      onChange={e=>setVendedorForm(f=>({...f,publicidad:parseInt(e.target.value)||0}))}/>
                  </div>

                  <div style={{padding:".6rem .85rem",background:"rgba(255,255,255,.03)",border:"1px solid var(--b1)",borderRadius:7,fontSize:".69rem",color:"var(--mu)",lineHeight:1.6,marginBottom:"1rem"}}>
                    <strong style={{color:"var(--mu2)"}}>Comisión defensa</strong> — se aplica sobre la base de los lotes <strong style={{color:"var(--wh2)"}}>no vendidos</strong> como penalización o retiro anticipado.
                  </div>

                  <button className="btn-primary" style={{width:"100%"}}
                    onClick={()=>{ if(!vendedorSel){notify("Selecciona un vendedor primero.","inf");return;} setVendedorLiqGenerada({vd,lotesVendedor,adjVendedor,lotesNoVendidos,totalVentas,comVentaMonto,comDefensaMonto,publicidad:Number(vendedorForm.publicidad||0),iva,totalDescuentos,liquidoAPagar,comVenta:vendedorForm.comVenta,comDefensa:vendedorForm.comDefensa}); notify("Liquidación generada.","sold"); }}>
                    Generar liquidación
                  </button>
                </div>

                {/* ── Preview liquidación ── */}
                <div>
                  {!vendedorLiqGenerada && !vendedorSel && (
                    <div style={{padding:"4rem 2rem",textAlign:"center",opacity:.5}}>
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--mu)" strokeWidth="1.5" style={{marginBottom:"1rem"}}><rect x="8" y="4" width="32" height="40" rx="3"/><path d="M16 16h16M16 24h16M16 32h8"/></svg>
                      <div style={{fontSize:".85rem",color:"var(--mu)"}}>Selecciona un vendedor para comenzar</div>
                    </div>
                  )}

                  {/* Preview en vivo mientras se llena el form */}
                  {vendedorSel && (
                    <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.2rem 1.3rem"}}>
                      <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:"1rem"}}>
                        Preview liquidación — {vd?.nombre}
                      </div>

                      {/* Lotes vendidos */}
                      <div style={{fontSize:".71rem",fontWeight:700,color:"var(--mu2)",marginBottom:".4rem",textTransform:"uppercase"}}>Lotes vendidos ({adjVendedor.length})</div>
                      <div style={{background:"var(--s3)",borderRadius:8,overflow:"hidden",marginBottom:".85rem"}}>
                        {adjVendedor.length===0
                          ? <div style={{padding:".8rem",fontSize:".73rem",color:"var(--mu)",textAlign:"center",fontStyle:"italic"}}>Sin adjudicaciones para este vendedor aún</div>
                          : adjVendedor.map((a,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".5rem .85rem",borderBottom:"1px solid var(--b1)"}}>
                              <span style={{fontSize:".75rem",color:"var(--wh2)",fontWeight:600}}>{a.lote}</span>
                              <span style={{fontFamily:"Inter,sans-serif",fontSize:".76rem",color:"var(--gr)",fontWeight:700}}>{fmt(a.monto||0)}</span>
                            </div>
                          ))}
                        <div style={{display:"flex",justifyContent:"space-between",padding:".5rem .85rem",background:"rgba(20,184,166,.05)"}}>
                          <span style={{fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase"}}>Total ventas</span>
                          <span style={{fontFamily:"Inter,sans-serif",fontWeight:800,color:"var(--gr)"}}>{fmt(totalVentas)}</span>
                        </div>
                      </div>

                      {/* Descuentos */}
                      <div style={{fontSize:".71rem",fontWeight:700,color:"var(--mu2)",marginBottom:".4rem",textTransform:"uppercase"}}>Descuentos</div>
                      <div style={{background:"var(--s3)",borderRadius:8,overflow:"hidden",marginBottom:".85rem"}}>
                        {[
                          [`Comisión ventas ${vendedorForm.comVenta}%`, comVentaMonto],
                          [`Comisión defensa ${vendedorForm.comDefensa}%`, comDefensaMonto],
                          ["Avisos publicitarios", Number(vendedorForm.publicidad||0)],
                          ["IVA 19% s/comisiones", iva],
                        ].map(([k,v],i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:".5rem .85rem",borderBottom:"1px solid var(--b1)"}}>
                            <span style={{fontSize:".73rem",color:"var(--mu2)"}}>{k}</span>
                            <span style={{fontFamily:"Inter,sans-serif",fontSize:".73rem",color:"var(--rd)",fontWeight:600}}>− {fmt(v)}</span>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",padding:".5rem .85rem",background:"rgba(245,101,101,.05)"}}>
                          <span style={{fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase"}}>Total descuentos</span>
                          <span style={{fontFamily:"Inter,sans-serif",fontWeight:800,color:"var(--rd)"}}>− {fmt(totalDescuentos)}</span>
                        </div>
                      </div>

                      {/* Líquido a pagar */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1rem 1.1rem",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.2)",borderRadius:9}}>
                        <div>
                          <div style={{fontSize:".65rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Líquido a pagar al vendedor</div>
                          <div style={{fontSize:".68rem",color:"var(--mu)"}}>Ventas − comisiones − IVA</div>
                        </div>
                        <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.4rem",fontWeight:900,color:liquidoAPagar>=0?"var(--ac)":"var(--rd)"}}>
                          {fmt(liquidoAPagar)}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{display:"flex",gap:".6rem",marginTop:"1rem"}}>
                        <button className="btn-sec" style={{flex:1,fontSize:".75rem"}} onClick={()=>notify("Correo enviado al vendedor.","sold")}>
                          Enviar correo
                        </button>
                        <button className="btn-primary" style={{flex:1,fontSize:".75rem"}} onClick={generarPDFVendedor}>
                          Descargar PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ REPORTES ══ */}
        {page==="reportes" && (
          <div className="page">
            {/* ── Selector de remate ── */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.4rem",padding:".8rem 1.1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10}}>
              <div>
                <div style={{fontSize:".65rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Estadísticas de remate</div>
                <div style={{fontSize:"1rem",fontWeight:800,color:"var(--wh)"}}>Remate Industrial Marzo 2026</div>
              </div>
              <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
                <select className="fsel" style={{fontSize:".76rem",width:"auto"}}>
                  {REMATES_MERGED.map(r=><option key={r.id}>{r.name}</option>)}
                </select>
                <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async ()=>{
                  // Exportar ventas CSV
                  const adjAll = [...ADJUDICACIONES, ...liquidaciones];
                  const csv = ["Postor,Lote,Monto,Comisión,IVA,Total,Estado",
                    ...adjAll.map(a=>{
                      const com = a.com||Math.round((a.monto||0)*0.03);
                      const iva = Math.round(com*0.19);
                      return `"${a.postor}","${a.lote||a.lote}",${a.monto||0},${com},${iva},${(a.monto||0)+com+iva},${a.estado||"adjudicado"}`;
                    })
                  ].join("\n");
                  const a = document.createElement("a");
                  a.href = "data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
                  a.download = "ventas-remate.csv"; a.click();
                  notify("CSV exportado.","sold");
                }}>↓ Exportar CSV</button>
                <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async ()=>{
                  // Catálogo PDF de lotes
                  if(!LOTES_MERGED.length){ notify("No hay lotes para generar el catálogo.","inf"); return; }
                  try {
                  const {jsPDF} = await import("jspdf");
                  const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
                  const W = doc.internal.pageSize.getWidth();
                  doc.setFillColor(7,15,28); doc.rect(0,0,W,30,"F");
                  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont("helvetica","bold");
                  doc.text("CATÁLOGO DE LOTES",W/2,14,{align:"center"});
                  doc.setFontSize(9); doc.setFont("helvetica","normal");
                  doc.text(`Generado: ${new Date().toLocaleDateString("es-CL")}`,W/2,22,{align:"center"});
                  let y = 38;
                  LOTES_MERGED.forEach((l,i)=>{
                    if(y>260){doc.addPage();y=20;}
                    doc.setFillColor(11,31,56); doc.roundedRect(10,y,W-20,22,2,2,"F");
                    doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont("helvetica","bold");
                    doc.text(`Lote ${i+1} — ${l.name}`,15,y+8);
                    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(90,127,168);
                    doc.text(`Base: ${fmt(l.base||0)}   Comisión: ${l.com||3}%   Estado: ${l.estado||"disponible"}`,15,y+16);
                    y+=26;
                  });
                  doc.save("catalogo-lotes.pdf");
                  notify("Catálogo PDF generado.","sold");
                  } catch(e){ console.error(e); notify("Error al generar PDF: "+e.message,"inf"); }
                }}>↓ Catálogo PDF</button>
              </div>
            </div>

            {/* ── 5 stat cards (combinando los 2 sistemas) ── */}
            {(()=>{
              const adjAll = [...ADJUDICACIONES, ...liquidaciones];
              const totalVentas   = adjAll.reduce((s,a)=>s+(a.monto||0),0);
              const totalCom      = adjAll.reduce((s,a)=>s+(a.com||Math.round((a.monto||0)*0.03)),0);
              const ivaTotal      = Math.round(totalCom * 0.19);
              const bruto         = totalVentas + totalCom + ivaTotal;
              const garCount      = GARANTIAS.filter(g=>g.estado==="aprobada").length;
              const garDev        = GARANTIAS.filter(g=>g.estado==="devuelta").length;
              const lotesSold     = adjAll.length;
              const lotesTotal    = LOTES_REALES.length;
              return (
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".7rem",marginBottom:"1.1rem"}}>
                  {[
                    {label:"Total ventas",   val:fmt(totalVentas),  accent:"var(--ac)",  sub:"monto adjudicado"},
                    {label:"Lotes vendidos", val:`${lotesSold} / ${lotesTotal}`,accent:"var(--gr)", sub:`${Math.round(lotesSold/Math.max(lotesTotal,1)*100)}% del remate`},
                    {label:"Garantías",      val:`${garCount}`,     accent:"var(--yl)", sub:`${garDev} devueltas`},
                    {label:"Comisiones",     val:fmt(totalCom),     accent:"var(--gr)", sub:"sin IVA"},
                    {label:"Bruto total",    val:fmt(bruto),        accent:"#c084fc",   sub:"inc. IVA comisión"},
                  ].map((c,i)=>(
                    <div key={i} className="rep-card" style={{borderTop:`3px solid ${c.accent}`}}>
                      <div className="rep-label">{c.label}</div>
                      <div className="rep-metric" style={{fontSize:"1.15rem",color:c.accent}}>{c.val}</div>
                      <div style={{fontSize:".65rem",color:"var(--mu)",marginTop:".25rem"}}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Fila 2: Top compradores + Resumen financiero ── */}
            {(()=>{
              const adjAll = [...ADJUDICACIONES, ...liquidaciones];
              const totalVentas = adjAll.reduce((s,a)=>s+(a.monto||0),0);
              const totalCom    = adjAll.reduce((s,a)=>s+(a.com||Math.round((a.monto||0)*0.03)),0);
              const totalGAdm   = adjAll.reduce((s,a)=>s+(a.gastosAdm||0),0);
              const ivaBase     = totalCom + totalGAdm;
              const iva         = Math.round(ivaBase * 0.19);
              const bruto       = totalVentas + totalCom + totalGAdm + iva;
              // Top 3 compradores por monto
              const byPostor = {};
              adjAll.forEach(a=>{
                const k = a.postor;
                if(!byPostor[k]) byPostor[k]={postor:k,monto:0,lotes:0};
                byPostor[k].monto += a.monto||0;
                byPostor[k].lotes++;
              });
              const top3 = Object.values(byPostor).sort((a,b)=>b.monto-a.monto).slice(0,3);
              const maxMonto = top3[0]?.monto||1;
              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".85rem",marginBottom:"1.1rem"}}>
                  {/* Top 3 compradores */}
                  <div className="chart-card" style={{padding:"1.1rem 1.25rem"}}>
                    <div className="chart-title">Top 3 compradores</div>
                    <div className="chart-sub">Por monto adjudicado en este remate</div>
                    <div style={{marginTop:"1rem",display:"flex",flexDirection:"column",gap:".75rem"}}>
                      {top3.length===0 && <div style={{fontSize:".75rem",color:"var(--mu)",textAlign:"center",padding:"1rem"}}>Sin adjudicaciones aún</div>}
                      {top3.map((t,i)=>{
                        const pct = Math.round(t.monto/maxMonto*100);
                        const posData = POSTORES_MERGED.find(p=>p.name===t.postor||p.razonSocial===t.postor);
                        return (
                          <div key={i}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".3rem"}}>
                              <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                                <div style={{width:22,height:22,borderRadius:6,background:i===0?"rgba(246,173,85,.15)":i===1?"rgba(56,178,246,.1)":"rgba(255,255,255,.05)",border:`1px solid ${i===0?"rgba(246,173,85,.3)":i===1?"rgba(56,178,246,.25)":"var(--b1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".65rem",fontWeight:800,color:i===0?"var(--yl)":i===1?"var(--ac)":"var(--mu)",flexShrink:0}}>
                                  {i+1}
                                </div>
                                <div>
                                  <div style={{fontSize:".76rem",fontWeight:700,color:"var(--wh2)"}}>{t.postor}</div>
                                  <div style={{fontSize:".62rem",color:"var(--mu)"}}>{t.lotes} lote{t.lotes>1?"s":""} · Paleta #{String(posData?.nComprador||"—").padStart(2,"0")}</div>
                                </div>
                              </div>
                              <div style={{fontFamily:"Inter,sans-serif",fontSize:".8rem",fontWeight:700,color:"var(--wh2)"}}>{fmt(t.monto)}</div>
                            </div>
                            <div style={{height:4,borderRadius:2,background:"var(--b1)",overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${pct}%`,background:i===0?"var(--yl)":i===1?"var(--ac)":"var(--mu)",borderRadius:2,transition:"width .4s"}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen financiero */}
                  <div className="chart-card" style={{padding:"1.1rem 1.25rem"}}>
                    <div className="chart-title">Resumen financiero</div>
                    <div className="chart-sub">Desglose contable del remate</div>
                    <div style={{marginTop:"1rem",display:"flex",flexDirection:"column",gap:0}}>
                      {[
                        ["Ventas neto (EX):",      fmt(totalVentas), "var(--wh2)", false],
                        ["Total comisiones:",       fmt(totalCom),    "var(--gr)",  false],
                        ["Gastos adm. motorizados:",fmt(totalGAdm),   "var(--yl)",  false],
                        ["Base afecta IVA:",        fmt(ivaBase),     "var(--mu2)", false],
                        ["IVA comisiones (19%):",   fmt(iva),         "var(--mu2)", false],
                      ].map(([l,v,c,b])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:".52rem 0",borderBottom:"1px solid var(--b1)",fontSize:".76rem"}}>
                          <span style={{color:"var(--mu2)"}}>{l}</span>
                          <span style={{fontFamily:"Inter,sans-serif",fontWeight:700,color:c}}>{v}</span>
                        </div>
                      ))}
                      <div style={{display:"flex",justifyContent:"space-between",padding:".7rem 0 .2rem",marginTop:".2rem"}}>
                        <span style={{fontSize:".88rem",fontWeight:800,color:"var(--wh)"}}>BRUTO TOTAL:</span>
                        <span style={{fontFamily:"Inter,sans-serif",fontSize:"1.05rem",fontWeight:800,color:"var(--ac)"}}>{fmt(bruto)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Fila 3: Gráfico ventas + lotes sin vender ── */}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:".85rem",marginBottom:"1.1rem"}}>
              <div className="chart-card">
                <div className="chart-title">Ventas mensuales</div>
                <div className="chart-sub">Millones CLP — últimos 7 meses</div>
                <ResponsiveContainer width="100%" height={145}>
                  <BarChart data={VENTAS_MES} barSize={18}>
                    <XAxis dataKey="mes" tick={{fontFamily:"Inter",fontSize:9,fill:"#5a7fa8"}} axisLine={false} tickLine={false}/>
                    <YAxis hide/><Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="v" fill="#38B2F6" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card" style={{padding:"1.1rem 1.25rem"}}>
                <div className="chart-title">Lotes sin vender</div>
                <div className="chart-sub">Del remate actual</div>
                <div style={{marginTop:".8rem",display:"flex",flexDirection:"column",gap:".5rem"}}>
                  {LOTES_REALES.slice(0,4).map((l,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:".5rem",padding:".42rem .6rem",background:"rgba(245,101,101,.05)",border:"1px solid rgba(245,101,101,.15)",borderRadius:6}}>
                      <span className="exp-badge" style={{fontSize:".6rem"}}>{l.exp}</span>
                      <span style={{flex:1,fontSize:".7rem",color:"var(--mu2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
                      <span style={{fontSize:".65rem",color:"var(--rd)",fontWeight:700,flexShrink:0}}>{fmt(l.base)}</span>
                    </div>
                  ))}
                  {LOTES_REALES.length>4&&<div style={{fontSize:".65rem",color:"var(--mu)",textAlign:"center"}}>+{LOTES_REALES.length-4} más</div>}
                </div>
              </div>
            </div>

            {/* ── Accesos rápidos (igual que estadisticas.php) ── */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:".6rem",marginBottom:"1rem"}}>
              {[
                {label:"Ver lotes",          page:"lotes",      color:"var(--ac)"},
                {label:"Liq. compradores",   page:"liquidac",   color:"var(--gr)"},
                {label:"Devoluciones",       page:"devoluciones",color:"var(--yl)"},
                {label:"Adjudicaciones",     page:"adjudicac",  color:"#c084fc"},
              ].map(l=>(
                <button key={l.label} onClick={()=>setPage(l.page)} style={{padding:".7rem .5rem",background:"var(--s2)",border:`1px solid var(--b1)`,borderRadius:9,fontSize:".74rem",fontWeight:700,color:l.color,cursor:"pointer",transition:"all .15s",textAlign:"center"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=l.color;e.currentTarget.style.background="rgba(255,255,255,.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b1)";e.currentTarget.style.background="var(--s2)";}}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* ── Tabla detalle por remate ── */}
            <div className="table-card">
              <div className="table-head"><div className="table-title">Historial de remates</div></div>
              <table>
                <thead><tr><th>ID</th><th>Nombre</th><th>Lotes vendidos</th><th>Sin vender</th><th>Recaudado</th><th>Comisiones</th><th>IVA</th><th>Bruto</th><th>Estado</th></tr></thead>
                <tbody>
                  {REMATES_MERGED.map(r => {
                    const com = Math.round(r.recaudado*.03);
                    const iva = Math.round(com*.19);
                    return (
                      <tr key={r.id}>
                        <td className="mono">{r.id}</td>
                        <td style={{fontWeight:600}}>{r.name}</td>
                        <td className="mono">{Math.round(r.lotes*.78)}</td>
                        <td className="mono" style={{color:"var(--rd)"}}>{Math.round(r.lotes*.22)}</td>
                        <td className="gt">{fmt(r.recaudado)}</td>
                        <td style={{color:"var(--gr)",fontFamily:"Inter,sans-serif",fontSize:".73rem",fontWeight:600}}>{fmt(com)}</td>
                        <td style={{color:"var(--mu2)",fontFamily:"Inter,sans-serif",fontSize:".73rem"}}>{fmt(iva)}</td>
                        <td style={{color:"var(--ac)",fontFamily:"Inter,sans-serif",fontSize:".73rem",fontWeight:700}}>{fmt(r.recaudado+com+iva)}</td>
                        <td><span className={`pill p-${r.estado}`}>{r.estado.charAt(0).toUpperCase()+r.estado.slice(1)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Panel admin: clientes ── */}
            {session?.role==="admin" && (()=>{
              const casas = [...new Set(REMATES_MERGED.map(r=>r.casa))];
              const stats = casas.map(casa => {
                const rematesCasa    = REMATES_MERGED.filter(r=>r.casa===casa);
                const cerrados       = rematesCasa.filter(r=>r.estado==="cerrado");
                const totalVendido   = cerrados.reduce((s,r)=>s+r.recaudado,0);
                const totalLotes     = rematesCasa.reduce((s,r)=>s+r.lotes,0);
                const lotesVend      = cerrados.reduce((s,r)=>s+r.lotes,0);
                const promLote       = lotesVend > 0 ? Math.round(totalVendido/lotesVend) : 0;
                const nRemates       = rematesCasa.length;
                const postoresUnicos = casa==="Remates Ahumada" ? 38 : 14;
                return { casa, totalVendido, totalLotes, promLote, nRemates, postoresUnicos, cerrados:cerrados.length, remates:rematesCasa };
              }).sort((a,b)=>b.totalVendido-a.totalVendido);

              const maxVendido  = Math.max(...stats.map(s=>s.totalVendido),1);
              const clienteActivo = adminClienteSel ? stats.find(s=>s.casa===adminClienteSel) : null;

              return (
                <div style={{marginTop:"1.5rem"}}>

                  {/* Header con selector */}
                  <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",paddingBottom:".8rem",borderBottom:"1px solid var(--b1)"}}>
                    <div style={{width:28,height:28,borderRadius:7,background:"rgba(56,178,246,.12)",border:"1px solid rgba(56,178,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><path d="M3 13V7M8 13V3M13 13V9"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:".82rem",fontWeight:800,color:"var(--wh2)"}}>Clientes GR Auction Software</div>
                      <div style={{fontSize:".68rem",color:"var(--mu2)"}}>Solo visible para administrador — métricas por casa de remates</div>
                    </div>
                    {/* Selector de cliente */}
                    <select
                      value={adminClienteSel||""}
                      onChange={e=>setAdminClienteSel(e.target.value||null)}
                      style={{padding:".4rem .8rem",background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:7,color:"var(--wh2)",fontSize:".78rem",fontFamily:"Inter,sans-serif",cursor:"pointer",minWidth:200}}>
                      <option value="">— Vista general —</option>
                      {stats.map(s=><option key={s.casa} value={s.casa}>{s.casa}</option>)}
                    </select>
                    <span style={{fontSize:".65rem",padding:".2rem .55rem",background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",borderRadius:4,color:"var(--ac)",fontWeight:700,letterSpacing:".05em",flexShrink:0}}>ADMIN</span>
                  </div>

                  {/* ── Vista general: ranking ── */}
                  {!clienteActivo && (
                    <div style={{display:"flex",flexDirection:"column",gap:".8rem"}}>
                      {stats.map((s,i)=>(
                        <div key={s.casa}
                          onClick={()=>setAdminClienteSel(s.casa)}
                          style={{background:"var(--s2)",border:`1px solid ${adminClienteSel===s.casa?"var(--ac)":"var(--b1)"}`,borderRadius:11,padding:"1rem 1.2rem",position:"relative",overflow:"hidden",cursor:"pointer",transition:"border .15s"}}>
                          <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${Math.round(s.totalVendido/maxVendido*100)}%`,background:"rgba(56,178,246,.04)",borderRight:"1px solid rgba(56,178,246,.08)",pointerEvents:"none"}}/>
                          <div style={{display:"flex",alignItems:"center",gap:"1rem",position:"relative"}}>
                            <div style={{width:32,height:32,borderRadius:8,background:i===0?"rgba(246,173,85,.15)":"rgba(255,255,255,.04)",border:`1px solid ${i===0?"rgba(246,173,85,.3)":"var(--b2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontSize:".9rem",fontWeight:900,color:i===0?"var(--yl)":"var(--mu2)"}}>#{i+1}</span>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:".88rem",fontWeight:800,color:"var(--wh2)",marginBottom:".15rem"}}>{s.casa}</div>
                              <div style={{fontSize:".68rem",color:"var(--mu)",display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                                <span>{s.nRemates} remates ({s.cerrados} cerrados)</span>
                                <span>·</span>
                                <span>{s.postoresUnicos} postores únicos</span>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:"1.5rem",flexShrink:0}}>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:700,color:"var(--ac)"}}>{fmt(s.totalVendido)}</div>
                                <div style={{fontSize:".6rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".04em"}}>Total vendido</div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:700,color:"var(--gr)"}}>{fmt(s.promLote)}</div>
                                <div style={{fontSize:".6rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".04em"}}>Prom/lote</div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:700,color:"var(--wh2)"}}>{s.totalLotes}</div>
                                <div style={{fontSize:".6rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".04em"}}>Lotes totales</div>
                              </div>
                            </div>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--mu)" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}><path d="M4 2l4 4-4 4"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Vista detalle cliente ── */}
                  {clienteActivo && (
                    <div>
                      {/* Stat cards del cliente */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".7rem",marginBottom:"1.2rem"}}>
                        {[
                          {label:"Total vendido",      val:fmt(clienteActivo.totalVendido),          color:"var(--ac)"},
                          {label:"Lotes rematados",    val:clienteActivo.totalLotes,                 color:"var(--gr)"},
                          {label:"Valor prom/lote",    val:fmt(clienteActivo.promLote),              color:"#c084fc"},
                          {label:"N° de remates",      val:clienteActivo.nRemates,                   color:"var(--yl)"},
                          {label:"Postores únicos",    val:clienteActivo.postoresUnicos,             color:"var(--ac)"},
                        ].map((c,i)=>(
                          <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,padding:".85rem 1rem",borderTop:`3px solid ${c.color}`}}>
                            <div style={{fontSize:".62rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".4rem"}}>{c.label}</div>
                            <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.1rem",fontWeight:800,color:c.color}}>{c.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Remates del cliente */}
                      <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:11,overflow:"hidden"}}>
                        <div style={{padding:".75rem 1rem",borderBottom:"1px solid var(--b1)",fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em"}}>
                          Remates de {clienteActivo.casa}
                        </div>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{background:"rgba(255,255,255,.02)"}}>
                              {["ID","Nombre","Fecha","Lotes","Modalidad","Recaudado","Estado"].map(h=>(
                                <th key={h} style={{padding:".5rem .85rem",textAlign:"left",fontSize:".65rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".04em",borderBottom:"1px solid var(--b1)"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {clienteActivo.remates.map(r=>(
                              <tr key={r.id} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                                <td style={{padding:".55rem .85rem",fontFamily:"Inter,sans-serif",fontSize:".72rem",color:"var(--mu2)"}}>{r.id}</td>
                                <td style={{padding:".55rem .85rem",fontSize:".78rem",fontWeight:600,color:"var(--wh2)"}}>{r.name}</td>
                                <td style={{padding:".55rem .85rem",fontFamily:"Inter,sans-serif",fontSize:".72rem",color:"var(--mu2)"}}>{r.fecha}</td>
                                <td style={{padding:".55rem .85rem",fontFamily:"Inter,sans-serif",fontSize:".78rem",color:"var(--wh2)"}}>{r.lotes}</td>
                                <td style={{padding:".55rem .85rem",fontSize:".72rem",color:"var(--mu2)"}}>{r.modal}</td>
                                <td style={{padding:".55rem .85rem",fontFamily:"Inter,sans-serif",fontSize:".78rem",fontWeight:700,color:"var(--ac)"}}>{fmt(r.recaudado)}</td>
                                <td style={{padding:".55rem .85rem"}}><span className={`pill p-${r.estado}`}>{r.estado.charAt(0).toUpperCase()+r.estado.slice(1)}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{marginTop:".75rem",padding:".6rem .9rem",background:"rgba(56,178,246,.04)",border:"1px solid rgba(56,178,246,.1)",borderRadius:7,fontSize:".7rem",color:"var(--mu)",lineHeight:1.6}}>
                        Datos basados en remates registrados. En producción con Supabase se calcularán en tiempo real con historial completo.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ USUARIOS ══ */}
        {page==="usuarios" && session?.role==="admin" && (()=>{
          // Casas reales desde Supabase — incluye "GR Auction Software" para admin global
          const CASAS_LISTA_REAL = [{ id: null, nombre: "GR Auction Software (Admin global)" }, ...dbLicencias];
          const toggleRol = (rol) => {
            setUsuarioForm(f=>({...f, roles: f.roles.includes(rol) ? f.roles.filter(r=>r!==rol) : [...f.roles, rol]}));
          };
          const guardarUsuario = async () => {
            if(!usuarioForm.nombre||!usuarioForm.email) { notify("Completa nombre y email.","inf"); return; }
            if(usuarioModal==="crear") {
              if(!usuarioForm.pass||usuarioForm.pass.length<6){ notify("La contraseña debe tener al menos 6 caracteres.","inf"); return; }

              const {data:casaData} = await supabase.from("casas").select("id").eq("nombre",usuarioForm.casa).single();
              const res = await fetch("/api/admin/create-user", {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({
                  email:   usuarioForm.email,
                  password:usuarioForm.pass,
                  nombre:  usuarioForm.nombre,
                  casa_id: casaData?.id||null,
                  roles:   usuarioForm.roles,
                  activo:  usuarioForm.activo,
                }),
              });
              const result = await res.json();
              if(!res.ok){ notify("Error: "+result.error,"inf"); return; }

              // Recargar lista
              const {data:uList} = await supabase.from("usuarios").select("*, casas(nombre)").order("nombre");
              if(uList) setUsuarios(uList.map(u=>({
                id:u.id, nombre:u.nombre, usuario:u.email?.split("@")[0]||"",
                email:u.email, roles:u.roles||[], casa:u.casas?.nombre||"", activo:u.activo,
              })));
              notify(`✓ Usuario ${usuarioForm.email} creado correctamente.`,"sold");
            } else {
              // Editar usuario existente
              const {data:casaData} = await supabase.from("casas").select("id").eq("nombre",usuarioForm.casa).single();
              const {error:uErr} = await supabase.from("usuarios").update({
                nombre:   usuarioForm.nombre,
                casa_id:  casaData?.id||null,
                roles:    usuarioForm.roles,
                activo:   usuarioForm.activo,
              }).eq("id", usuarioForm.id);
              if(uErr){ notify("Error al actualizar: "+uErr.message,"inf"); return; }
              // Si ingresó nueva contraseña, enviar email de reset al usuario
              if(usuarioForm.pass && usuarioForm.pass.length >= 6) {
                // Usamos resetPasswordForEmail — le llega un link al email del usuario
                const {error: resetErr} = await supabase.auth.resetPasswordForEmail(
                  usuarioForm.email,
                  { redirectTo: `${window.location.origin}/dashboard` }
                );
                if(resetErr) {
                  notify("Datos guardados. Error al enviar email de reset: "+resetErr.message,"inf");
                } else {
                  notify(`Datos guardados. Email de cambio de contraseña enviado a ${usuarioForm.email}.`,"sold");
                }
              } else {
                notify("Usuario actualizado.","sold");
              }
              setUsuarios(u=>u.map(x=>x.id===usuarioForm.id?{...usuarioForm}:x));
            }
            setUsuarioModal(false); resetUsuarioForm();
          };
          const editarUsuario = (u) => {
            setUsuarioForm({...u, pass:""});
            setUsuarioModal("editar");
          };
          const eliminarUsuario = async (id) => {
            if(!window.confirm("¿Eliminar este usuario? No podrá iniciar sesión.")) return;
            const res = await fetch("/api/admin/delete-user", {
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ id }),
            });
            const result = await res.json();
            if(!res.ok){ notify("Error al eliminar: "+result.error,"inf"); return; }
            setUsuarios(u=>u.filter(x=>x.id!==id));
            notify("Usuario eliminado.","inf");
          };
          const toggleActivo = async (id) => {
            const usr = usuarios.find(u=>u.id===id);
            if(!usr) return;
            const nuevoEstado = !usr.activo;
            await supabase.from("usuarios").update({activo: nuevoEstado}).eq("id", id);
            setUsuarios(u=>u.map(x=>x.id===id?{...x,activo:nuevoEstado}:x));
          };

          const ROLE_COLOR = {
            "admin":        {bg:"rgba(224,82,82,.12)",  color:"#e05252", border:"rgba(224,82,82,.25)"},
            "martillero":   {bg:"rgba(56,178,246,.12)", color:"#38B2F6", border:"rgba(56,178,246,.25)"},
            "postremate":   {bg:"rgba(20,184,166,.1)",  color:"#14B8A6", border:"rgba(20,184,166,.25)"},
            "garantias":    {bg:"rgba(246,173,85,.12)", color:"#f6ad55", border:"rgba(246,173,85,.25)"},
            "solo lectura": {bg:"rgba(255,255,255,.06)",color:"#5a7fa8", border:"rgba(255,255,255,.1)"},
          };

          return (
            <div className="page">
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.3rem"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"1rem",fontWeight:800,color:"var(--wh2)"}}>Gestión de Usuarios</div>
                  <div style={{fontSize:".72rem",color:"var(--mu2)",marginTop:".15rem"}}>Solo visible para administrador GR — {usuarios.length} usuarios · puedes asignar múltiples usuarios a la misma casa</div>
                </div>
                <button className="btn-primary" onClick={()=>{resetUsuarioForm();setUsuarioModal("crear");}}>
                  + Nuevo usuario
                </button>
              </div>

              {/* Resumen por casa */}
              {dbLicencias.length > 0 && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:".65rem",marginBottom:"1.2rem"}}>
                  {/* Admins globales */}
                  {usuarios.filter(u=>!u.casa).length > 0 && (
                    <div style={{padding:".75rem 1rem",background:"rgba(224,82,82,.06)",border:"1px solid rgba(224,82,82,.15)",borderRadius:10}}>
                      <div style={{fontSize:".68rem",fontWeight:700,color:"var(--rd)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".4rem"}}>Admin GR</div>
                      <div style={{fontSize:"1.2rem",fontWeight:800,color:"var(--wh2)"}}>{usuarios.filter(u=>!u.casa).length}</div>
                      <div style={{fontSize:".68rem",color:"var(--mu)",marginTop:".1rem"}}>Sin casa asignada</div>
                    </div>
                  )}
                  {/* Una card por casa */}
                  {dbLicencias.map(casa=>{
                    const usrsCasa = usuarios.filter(u=>u.casa===casa.nombre);
                    return (
                      <div key={casa.id} style={{padding:".75rem 1rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:10,cursor:"pointer",transition:"border .15s"}}
                        onClick={()=>{ resetUsuarioForm(); setUsuarioForm(f=>({...f,casa:casa.nombre})); setUsuarioModal("crear"); }}
                        title="Click para crear usuario en esta casa"
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(56,178,246,.4)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(56,178,246,.15)"}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".4rem"}}>
                          <div style={{fontSize:".68rem",fontWeight:700,color:"var(--ac)",textTransform:"uppercase",letterSpacing:".05em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"80%"}}>{casa.nombre}</div>
                          <span style={{fontSize:".6rem",padding:".1rem .35rem",borderRadius:4,background:"rgba(56,178,246,.12)",color:"var(--ac)",fontWeight:700}}>+ Agregar</span>
                        </div>
                        <div style={{fontSize:"1.2rem",fontWeight:800,color:"var(--wh2)"}}>{usrsCasa.length}</div>
                        <div style={{fontSize:".68rem",color:"var(--mu)",marginTop:".1rem"}}>
                          {usrsCasa.length===0?"Sin usuarios aún":usrsCasa.map(u=>u.roles[0]||"—").join(", ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabla usuarios */}
              <div className="table-card">
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"rgba(255,255,255,.02)"}}>
                      {["Usuario / Email","Casa asignada","Roles","Estado","Acciones"].map(h=>(
                        <th key={h} style={{padding:".55rem .9rem",textAlign:"left",fontSize:".65rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".04em",borderBottom:"1px solid var(--b1)"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length===0 && (
                      <tr><td colSpan={7} style={{padding:"2rem",textAlign:"center",color:"var(--mu)",fontSize:".82rem"}}>
                        No hay usuarios registrados aún. Crea el primero con el botón de arriba.
                      </td></tr>
                    )}
                    {usuarios.map(u=>(
                      <tr key={u.id} style={{borderBottom:"1px solid rgba(255,255,255,.03)",opacity:u.activo?1:.5,transition:"opacity .2s"}}>
                        {/* Avatar + nombre */}
                        <td style={{padding:".65rem .9rem"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#38B2F6,#14B8A6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".68rem",fontWeight:800,color:"#fff",flexShrink:0}}>
                              {u.nombre?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"??"}
                            </div>
                            <div>
                              <div style={{fontSize:".82rem",fontWeight:700,color:"var(--wh2)"}}>{u.nombre}</div>
                              <div style={{fontSize:".68rem",color:"var(--mu2)",fontFamily:"Inter,sans-serif"}}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        {/* Casa asignada */}
                        <td style={{padding:".65rem .9rem"}}>
                          {u.casa ? (
                            <div style={{display:"inline-flex",alignItems:"center",gap:".4rem",padding:".2rem .6rem",background:"rgba(56,178,246,.08)",border:"1px solid rgba(56,178,246,.2)",borderRadius:6}}>
                              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><path d="M2 12V6l5-4 5 4v6"/><path d="M5 12V9h4v3"/></svg>
                              <span style={{fontSize:".72rem",fontWeight:600,color:"var(--ac)"}}>{u.casa}</span>
                            </div>
                          ) : (
                            <span style={{fontSize:".7rem",color:"var(--mu)",fontStyle:"italic"}}>Admin global</span>
                          )}
                        </td>
                        {/* Roles */}
                        <td style={{padding:".65rem .9rem"}}>
                          <div style={{display:"flex",gap:".3rem",flexWrap:"wrap"}}>
                            {u.roles.map(r=>(
                              <span key={r} style={{fontSize:".6rem",fontWeight:700,padding:".1rem .4rem",borderRadius:4,background:ROLE_COLOR[r]?.bg,color:ROLE_COLOR[r]?.color,border:`1px solid ${ROLE_COLOR[r]?.border}`}}>
                                {r}
                              </span>
                            ))}
                            {u.roles.length===0 && <span style={{fontSize:".65rem",color:"var(--mu)"}}>Sin roles</span>}
                          </div>
                        </td>
                        {/* Estado activo/inactivo */}
                        <td style={{padding:".65rem .9rem"}}>
                          <div onClick={()=>toggleActivo(u.id)} style={{display:"inline-flex",alignItems:"center",gap:".35rem",cursor:"pointer",padding:".22rem .55rem",borderRadius:5,background:u.activo?"rgba(20,184,166,.08)":"rgba(255,255,255,.04)",border:`1px solid ${u.activo?"rgba(20,184,166,.2)":"var(--b2)"}`,transition:"all .15s"}}
                            title={u.activo?"Click para desactivar":"Click para activar"}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:u.activo?"var(--gr)":"var(--mu)",transition:"background .15s"}}/>
                            <span style={{fontSize:".65rem",fontWeight:700,color:u.activo?"var(--gr)":"var(--mu)"}}>{u.activo?"Activo":"Inactivo"}</span>
                          </div>
                        </td>
                        {/* Acciones */}
                        <td style={{padding:".65rem .9rem"}}>
                          <div style={{display:"flex",gap:".4rem"}}>
                            <button className="btn-sec" style={{fontSize:".68rem",padding:".25rem .6rem"}}
                              onClick={()=>editarUsuario(u)}>
                              ✎ Editar
                            </button>
                            {u.id !== session?.id && (
                              <button style={{fontSize:".68rem",padding:".25rem .6rem",background:"rgba(224,82,82,.08)",border:"1px solid rgba(224,82,82,.2)",borderRadius:6,color:"var(--rd)",cursor:"pointer",transition:"all .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.background="rgba(224,82,82,.18)";}}
                                onMouseLeave={e=>{e.currentTarget.style.background="rgba(224,82,82,.08)";}}
                                onClick={()=>eliminarUsuario(u.id)}>
                                🗑 Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda de roles */}
              <div style={{marginTop:"1rem",padding:".75rem 1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:9}}>
                <div style={{fontSize:".65rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".5rem"}}>Permisos por rol</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".5rem"}}>
                  {[
                    {rol:"admin",       desc:"Acceso total al sistema y gestión de usuarios"},
                    {rol:"martillero",  desc:"Sala en vivo, lotes, remates y postores"},
                    {rol:"postremate",  desc:"Adjudicaciones, liquidaciones y devoluciones"},
                    {rol:"garantias",   desc:"Solo módulo de garantías"},
                    {rol:"solo lectura",desc:"Ve todo pero no puede modificar nada"},
                  ].map(({rol,desc})=>(
                    <div key={rol} style={{padding:".5rem .65rem",background:"rgba(255,255,255,.02)",border:`1px solid ${ROLE_COLOR[rol]?.border}`,borderRadius:7}}>
                      <div style={{fontSize:".65rem",fontWeight:700,color:ROLE_COLOR[rol]?.color,marginBottom:".2rem"}}>{rol}</div>
                      <div style={{fontSize:".6rem",color:"var(--mu)",lineHeight:1.4}}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal crear/editar */}
              {usuarioModal && (
                <div className="ov" onClick={()=>{setUsuarioModal(false);resetUsuarioForm();}}>
                  <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:460}}>
                    <div className="modal-title">{usuarioModal==="crear"?"Nuevo usuario":"Editar usuario"}</div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem",marginBottom:".75rem"}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <label className="fl">Nombre completo</label>
                        <input className="fi" placeholder="Juan Pérez" value={usuarioForm.nombre} onChange={e=>setUsuarioForm(f=>({...f,nombre:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="fl">Usuario</label>
                        <input className="fi" placeholder="jperez" value={usuarioForm.usuario} onChange={e=>setUsuarioForm(f=>({...f,usuario:e.target.value.toLowerCase().replace(/\s/g,"")}))}/>
                      </div>
                      <div>
                        <label className="fl">Email</label>
                        <input className="fi" type="email" placeholder="correo@casa.cl" value={usuarioForm.email} onChange={e=>setUsuarioForm(f=>({...f,email:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="fl">{usuarioModal==="editar"?"Enviar reset de contraseña al email":"Contraseña *"}</label>
                        <input className="fi" type="password"
                          placeholder={usuarioModal==="editar"?"Escribe algo para enviar email de reset":"Mínimo 6 caracteres"}
                          value={usuarioForm.pass}
                          onChange={e=>setUsuarioForm(f=>({...f,pass:e.target.value}))}/>
                        {usuarioModal==="editar" && usuarioForm.pass && (
                          <div style={{fontSize:".68rem",color:"var(--yl)",marginTop:".3rem",display:"flex",alignItems:"center",gap:".35rem"}}>
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3.5M7 9.5v.01"/></svg>
                            Al guardar se enviará un email de cambio de contraseña a {usuarioForm.email}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="fl">Casa de remates</label>
                        <select className="fsel" value={usuarioForm.casa} onChange={e=>setUsuarioForm(f=>({...f,casa:e.target.value}))}>
                          {CASAS_LISTA_REAL.map(c=><option key={c.id||"admin"} value={c.nombre}>{c.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Roles */}
                    <div style={{marginBottom:"1rem"}}>
                      <label className="fl" style={{marginBottom:".5rem",display:"block"}}>Roles y accesos</label>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".4rem"}}>
                        {ROLES_DISPONIBLES.map(rol=>{
                          const activo = usuarioForm.roles.includes(rol);
                          const c = ROLE_COLOR[rol];
                          return (
                            <div key={rol} onClick={()=>toggleRol(rol)}
                              style={{display:"flex",alignItems:"center",gap:".5rem",padding:".5rem .75rem",borderRadius:7,cursor:"pointer",background:activo?c.bg:"rgba(255,255,255,.02)",border:`1px solid ${activo?c.border:"var(--b2)"}`,transition:"all .15s"}}>
                              <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${activo?c.color:"var(--mu)"}`,background:activo?c.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                                {activo && <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M1.5 5l3 3 4-4.5"/></svg>}
                              </div>
                              <span style={{fontSize:".75rem",fontWeight:activo?700:500,color:activo?c.color:"var(--mu2)"}}>{rol}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="modal-actions">
                      <button className="btn-sec" onClick={()=>{setUsuarioModal(false);resetUsuarioForm();}}>Cancelar</button>
                      <button className="btn-confirm" onClick={guardarUsuario}>
                        {usuarioModal==="crear"?"Crear usuario":"Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ LICENCIAS ══ */}
        {page==="licencias" && session?.role==="admin" && (()=>{
          const PLANES = {
            trial:      {label:"Trial",       color:"#f6ad55", bg:"rgba(246,173,85,.1)",   dias:30,  precio:"Gratis"},
            basico:     {label:"Básico",      color:"#38B2F6", bg:"rgba(56,178,246,.1)",   dias:365, precio:"$29.990/mes"},
            profesional:{label:"Profesional", color:"#14B8A6", bg:"rgba(20,184,166,.1)",   dias:365, precio:"$59.990/mes"},
            enterprise: {label:"Enterprise",  color:"#a78bfa", bg:"rgba(167,139,250,.1)",  dias:365, precio:"A convenir"},
          };
          const ESTADOS = {
            activo:     {label:"Activo",      color:"var(--gr)", bg:"rgba(20,184,166,.1)"},
            suspendido: {label:"Suspendido",  color:"var(--yl)", bg:"rgba(246,173,85,.1)"},
            bloqueado:  {label:"Bloqueado",   color:"var(--rd)", bg:"rgba(224,82,82,.1)"},
          };

          const diasRestantes = (fecha) => {
            if (!fecha) return null;
            const diff = Math.ceil((new Date(fecha) - new Date()) / (1000*60*60*24));
            return diff;
          };

          return (
            <div className="page">
              <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.5rem"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"1rem",fontWeight:800,color:"var(--wh2)"}}>Control de Licencias</div>
                  <div style={{fontSize:".72rem",color:"var(--mu2)",marginTop:".15rem"}}>Gestiona el acceso de cada casa de remates — solo visible para admin GR</div>
                </div>
              </div>

              {/* Cards por casa */}
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                {dbLicencias.map(casa => {
                  const plan   = PLANES[casa.licencia_plan]  || PLANES.trial;
                  const estado = ESTADOS[casa.licencia_estado] || ESTADOS.activo;
                  const dias   = diasRestantes(casa.licencia_vence);
                  const vencida = dias !== null && dias < 0;
                  const porVencer = dias !== null && dias >= 0 && dias <= 7;

                  return (
                    <div key={casa.id} style={{background:"var(--s2)",border:`1px solid ${vencida?"rgba(224,82,82,.3)":porVencer?"rgba(246,173,85,.3)":"var(--b1)"}`,borderRadius:12,overflow:"hidden"}}>
                      {/* Header */}
                      <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.2rem",borderBottom:"1px solid var(--b1)"}}>
                        <div style={{width:40,height:40,borderRadius:10,background:plan.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={plan.color} strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="4" width="14" height="11" rx="2"/><path d="M6 4V3a3 3 0 016 0v1"/></svg>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:800,fontSize:".9rem",color:"var(--wh2)"}}>{casa.nombre}</div>
                          <div style={{fontSize:".7rem",color:"var(--mu2)",marginTop:".1rem"}}>{casa.email||"sin email"}</div>
                        </div>
                        {/* Badge estado */}
                        <span style={{fontSize:".68rem",fontWeight:700,padding:".25rem .65rem",borderRadius:20,background:estado.bg,color:estado.color}}>
                          {estado.label}
                        </span>
                        {/* Badge plan */}
                        <span style={{fontSize:".68rem",fontWeight:700,padding:".25rem .65rem",borderRadius:20,background:plan.bg,color:plan.color}}>
                          {plan.label}
                        </span>
                      </div>

                      {/* Info + controles */}
                      <div style={{padding:"1rem 1.2rem",display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:"1rem",alignItems:"center"}}>
                        {/* Vencimiento */}
                        <div>
                          <div style={{fontSize:".65rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".25rem"}}>Vence</div>
                          <div style={{fontSize:".82rem",fontWeight:700,color:vencida?"var(--rd)":porVencer?"var(--yl)":"var(--wh2)"}}>
                            {casa.licencia_vence ? new Date(casa.licencia_vence).toLocaleDateString("es-CL") : "—"}
                          </div>
                          <div style={{fontSize:".65rem",color:vencida?"var(--rd)":porVencer?"var(--yl)":"var(--mu)"}}>
                            {dias===null?"—":vencida?`Venció hace ${Math.abs(dias)} días`:dias===0?"Vence hoy":`${dias} días restantes`}
                          </div>
                        </div>
                        {/* Plan precio */}
                        <div>
                          <div style={{fontSize:".65rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".25rem"}}>Plan</div>
                          <div style={{fontSize:".82rem",fontWeight:700,color:"var(--wh2)"}}>{plan.precio}</div>
                          <div style={{fontSize:".65rem",color:"var(--mu)"}}>{plan.label}</div>
                        </div>
                        {/* Límites */}
                        <div>
                          <div style={{fontSize:".65rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".25rem"}}>Límites</div>
                          <div style={{fontSize:".75rem",color:"var(--wh2)"}}>{casa.max_usuarios||3} usuarios · {casa.max_remates||5} remates</div>
                          <div style={{fontSize:".65rem",color:"var(--mu)"}}>activos simultáneos</div>
                        </div>

                        {/* Botones de control */}
                        <div style={{display:"flex",gap:".4rem",flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {casa.licencia_estado !== "activo" && (
                            <button className="btn-confirm" style={{fontSize:".68rem",padding:".3rem .7rem",background:"rgba(20,184,166,.12)",color:"var(--gr)",border:"1px solid rgba(20,184,166,.3)"}}
                              onClick={()=>actualizarLicencia(casa.id,"activo")}>
                              ✓ Activar
                            </button>
                          )}
                          {casa.licencia_estado === "activo" && (
                            <button className="btn-sec" style={{fontSize:".68rem",padding:".3rem .7rem",color:"var(--yl)",border:"1px solid rgba(246,173,85,.3)"}}
                              onClick={()=>actualizarLicencia(casa.id,"suspendido")}>
                              ⏸ Suspender
                            </button>
                          )}
                          {casa.licencia_estado !== "bloqueado" && (
                            <button style={{fontSize:".68rem",padding:".3rem .7rem",background:"rgba(224,82,82,.08)",border:"1px solid rgba(224,82,82,.25)",borderRadius:6,color:"var(--rd)",cursor:"pointer"}}
                              onClick={()=>{if(window.confirm(`¿Bloquear acceso a ${casa.nombre}? No podrán iniciar sesión.`))actualizarLicencia(casa.id,"bloqueado");}}>
                              🔒 Bloquear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Renovar / cambiar plan */}
                      <div style={{padding:".75rem 1.2rem",background:"rgba(255,255,255,.01)",borderTop:"1px solid var(--b1)",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
                        <span style={{fontSize:".7rem",color:"var(--mu)"}}>Renovar hasta:</span>
                        <input type="date" defaultValue={casa.licencia_vence||""}
                          style={{padding:".3rem .6rem",background:"var(--s3)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".73rem",fontFamily:"Inter,sans-serif"}}
                          onChange={e=>renovarLicencia(casa.id, e.target.value)}/>
                        <span style={{fontSize:".7rem",color:"var(--mu)"}}>Plan:</span>
                        <select defaultValue={casa.licencia_plan||"trial"}
                          style={{padding:".3rem .6rem",background:"var(--s3)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".73rem",fontFamily:"Inter,sans-serif",cursor:"pointer"}}
                          onChange={e=>cambiarPlan(casa.id, e.target.value)}>
                          {Object.entries(PLANES).map(([k,v])=><option key={k} value={k}>{v.label} — {v.precio}</option>)}
                        </select>
                        {casa.notas_admin!==undefined && (
                          <input placeholder="Notas internas..." defaultValue={casa.notas_admin||""}
                            style={{flex:1,minWidth:160,padding:".3rem .6rem",background:"var(--s3)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".73rem",fontFamily:"Inter,sans-serif"}}
                            onBlur={e=>guardarNota(casa.id, e.target.value)}/>
                        )}
                      </div>
                    </div>
                  );
                })}
                {dbLicencias.length === 0 && (
                  <div style={{textAlign:"center",padding:"3rem",color:"var(--mu)",fontSize:".8rem"}}>
                    No hay casas de remates registradas aún.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══ CASAS DE REMATES ══ */}
        {page==="casas" && session?.role==="admin" && (()=>{
          const BASE_URL = "https://gestionderemates.cl";

          const toSlug = (nombre) => nombre.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
            .replace(/\s+/g,"").replace(/[^a-z0-9]/g,"");

          const crearCasa = async () => {
            if(!casaForm.nombre.trim()){ notify("Ingresa el nombre de la casa.","inf"); return; }
            const slug = toSlug(casaForm.nombre);
            // Upload logo if provided
            let logoUrl = null;
            if(casaForm.logoFile) {
              try {
                const ext = casaForm.logoFile.name.split(".").pop();
                const path = `logos/${slug}.${ext}`;
                const { data: upData, error: upErr } = await supabase.storage
                  .from("logos").upload(path, casaForm.logoFile, { upsert: true });
                if(!upErr && upData) {
                  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
                  logoUrl = urlData?.publicUrl || null;
                }
              } catch(e) { /* storage optional */ }
            }
            const {data, error} = await supabase.from("casas").insert({
              nombre:              casaForm.nombre.trim(),
              slug,
              email:               casaForm.email.trim()||null,
              telefono:            casaForm.telefono.trim()||null,
              direccion:           casaForm.direccion.trim()||null,
              logo_url:            logoUrl,
              martillero:          casaForm.martillero.trim()||null,
              rut_martillero:      casaForm.rutMartillero.trim()||null,
              telefono_martillero: casaForm.telefonoMartillero.trim()||null,
              email_martillero:    casaForm.emailMartillero.trim()||null,
              direccion_martillero:casaForm.direccionMartillero.trim()||null,
              licencia_estado: "trial",
              licencia_plan:   "trial",
              licencia_vence:  new Date(Date.now()+30*24*60*60*1000).toISOString().split("T")[0],
            }).select().single();
            if(error){ notify("Error: "+error.message,"inf"); return; }
            setDbLicencias(prev=>[...prev, data]);
            setCasaModal(false); resetCasaForm();
            notify(`Casa "${casaForm.nombre}" creada. Slug: ${slug}`,"sold");
          };

          const copiar = (txt) => { navigator.clipboard.writeText(txt); notify("Link copiado.","sold"); };

          return (
            <div className="page">
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.5rem"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"1rem",fontWeight:800,color:"var(--wh2)"}}>Casas de Remates</div>
                  <div style={{fontSize:".72rem",color:"var(--mu2)",marginTop:".15rem"}}>Cada casa tiene su propia URL de participación y display — generadas automáticamente</div>
                </div>
                <button className="btn-primary" onClick={()=>setCasaModal(true)}>+ Nueva casa</button>
              </div>

              {/* Lista de casas */}
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                {dbLicencias.map((casa,idx)=>(
                  <div key={casa.id} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,overflow:"hidden"}}>
                    {/* Header casa */}
                    <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.2rem",borderBottom:"1px solid var(--b1)"}}>
                      <label title={casa.logo_url ? "Cambiar logo" : "Subir logo"} style={{width:48,height:48,borderRadius:10,background:"rgba(56,178,246,.08)",border:"1px solid rgba(56,178,246,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",cursor:"pointer",position:"relative",transition:"border-color .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(56,178,246,.5)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(56,178,246,.15)"}>
                        {logoUploading === casa.id
                          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" style={{animation:"spin 1s linear infinite"}}><path d="M9 2a7 7 0 110 14A7 7 0 019 2z" strokeOpacity=".25"/><path d="M9 2a7 7 0 017 7"/></svg>
                          : casa.logo_url
                            ? <img src={casa.logo_url} alt={casa.nombre} style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px"}}/>
                            : <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinecap="round"><path d="M2 16V8l7-6 7 6v8"/><path d="M7 16v-5h4v5"/></svg>
                        }
                        <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{display:"none"}}
                          onChange={e=>{ const f=e.target.files[0]; if(f) subirLogoCasa(casa.id, casa.slug, f); e.target.value=""; }}/>
                      </label>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                          <span style={{fontSize:".62rem",fontWeight:700,fontFamily:"Inter,sans-serif",color:"var(--ac)",background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",borderRadius:5,padding:".1rem .4rem",letterSpacing:".04em",flexShrink:0}}>#{String(idx+1).padStart(3,"0")}</span>
                          <div style={{fontWeight:800,fontSize:".92rem",color:"var(--wh2)"}}>{casa.nombre}</div>
                        </div>
                        <div style={{fontSize:".7rem",color:"var(--mu2)",marginTop:".25rem",fontFamily:"Inter,sans-serif"}}>slug: {casa.slug}</div>
                      </div>
                      <span style={{fontSize:".65rem",fontWeight:700,padding:".2rem .55rem",borderRadius:20,
                        background:casa.licencia_estado==="activo"?"rgba(20,184,166,.1)":casa.licencia_estado==="suspendido"?"rgba(246,173,85,.1)":"rgba(255,255,255,.04)",
                        color:casa.licencia_estado==="activo"?"var(--gr)":casa.licencia_estado==="suspendido"?"var(--yl)":"var(--mu)"}}>
                        {casa.licencia_estado||"trial"}
                      </span>
                    </div>

                    {/* Links */}
                    <div style={{padding:"1rem 1.2rem",display:"flex",flexDirection:"column",gap:".65rem"}}>
                      {/* Link inscripción */}
                      <div style={{display:"flex",alignItems:"center",gap:".75rem",padding:".65rem .9rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:8}}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M4 7h6M7 4l3 3-3 3"/></svg>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".15rem"}}>Página de inscripción pública</div>
                          <code style={{fontSize:".73rem",color:"var(--ac)",fontFamily:"Inter,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>
                            {BASE_URL}/participar?id={casa.id}
                          </code>
                        </div>
                        <button className="btn-sec" style={{fontSize:".65rem",whiteSpace:"nowrap",flexShrink:0}}
                          onClick={()=>copiar(`${BASE_URL}/participar?id=${casa.id}`)}>Copiar</button>
                        <a href={`${BASE_URL}/participar?id=${casa.id}`} target="_blank" rel="noreferrer"
                          style={{fontSize:".65rem",color:"var(--mu2)",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0,padding:".28rem .55rem",border:"1px solid var(--b2)",borderRadius:6}}>
                          Abrir →
                        </a>
                      </div>

                      {/* Link display */}
                      <div style={{display:"flex",alignItems:"center",gap:".75rem",padding:".65rem .9rem",background:"rgba(20,184,166,.04)",border:"1px solid rgba(20,184,166,.15)",borderRadius:8}}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--gr)" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="2" width="12" height="9" rx="2"/><path d="M5 13h4M7 11v2"/></svg>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".15rem"}}>Pantalla sala / display</div>
                          <code style={{fontSize:".73rem",color:"var(--gr)",fontFamily:"Inter,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>
                            {BASE_URL}/display/{casa.slug}
                          </code>
                        </div>
                        <button className="btn-sec" style={{fontSize:".65rem",whiteSpace:"nowrap",flexShrink:0}}
                          onClick={()=>copiar(`${BASE_URL}/display/${casa.slug}`)}>Copiar</button>
                        <a href={`${BASE_URL}/display/${casa.slug}`} target="_blank" rel="noreferrer"
                          style={{fontSize:".65rem",color:"var(--mu2)",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0,padding:".28rem .55rem",border:"1px solid var(--b2)",borderRadius:6}}>
                          Abrir →
                        </a>
                      </div>

                      {/* Datos de contacto */}
                      {(casa.email||casa.telefono) && (
                        <div style={{display:"flex",gap:"1.5rem",fontSize:".72rem",color:"var(--mu2)",paddingTop:".3rem"}}>
                          {casa.email    && <span>✉ {casa.email}</span>}
                          {casa.telefono && <span>☎ {casa.telefono}</span>}
                          {casa.direccion && <span>📍 {casa.direccion}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {dbLicencias.length===0 && (
                  <div style={{textAlign:"center",padding:"3rem",color:"var(--mu)",fontSize:".82rem",background:"var(--s2)",borderRadius:12,border:"1px dashed var(--b2)"}}>
                    No hay casas registradas. Crea la primera con el botón de arriba.
                  </div>
                )}
              </div>

              {/* Modal nueva casa */}
              {casaModal && (
                <div className="ov" onClick={()=>{setCasaModal(false);resetCasaForm();}}>
                  <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
                    <div className="modal-title">Nueva casa de remates</div>
                    <div className="form-grid">
                      {/* Logo upload */}
                      <div className="fg full">
                        <label className="fl">Logo de la casa</label>
                        <label style={{display:"flex",alignItems:"center",gap:"1rem",padding:".75rem 1rem",background:"rgba(255,255,255,.03)",border:`2px dashed ${casaForm.logoFile?"rgba(20,184,166,.4)":"var(--b2)"}`,borderRadius:9,cursor:"pointer",transition:"all .15s"}}>
                          <div style={{width:52,height:52,borderRadius:8,background:"rgba(56,178,246,.08)",border:"1px solid rgba(56,178,246,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                            {casaForm.logoUrl
                              ? <img src={casaForm.logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:"4px"}}/>
                              : <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--mu)" strokeWidth="1.4"><rect x="2" y="4" width="18" height="14" rx="2"/><circle cx="11" cy="11" r="3"/><path d="M7 4V3a1 1 0 011-1h6a1 1 0 011 1v1"/></svg>
                            }
                          </div>
                          <div>
                            <div style={{fontSize:".82rem",fontWeight:600,color:casaForm.logoFile?"var(--gr)":"var(--wh2)"}}>
                              {casaForm.logoFile ? `✓ ${casaForm.logoFile.name}` : "Subir logo"}
                            </div>
                            <div style={{fontSize:".7rem",color:"var(--mu)",marginTop:".15rem"}}>PNG, JPG o SVG — fondo transparente recomendado</div>
                          </div>
                          <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{display:"none"}}
                            onChange={e=>{
                              const file = e.target.files[0];
                              if(file) setCasaForm(f=>({...f, logoFile:file, logoUrl:URL.createObjectURL(file)}));
                            }}/>
                        </label>
                      </div>
                      <div className="fg full">
                        <label className="fl">Nombre de la casa *</label>
                        <input className="fi" placeholder="Remates García Ltda." value={casaForm.nombre}
                          onChange={e=>setCasaForm(f=>({...f,nombre:e.target.value}))}/>
                        {casaForm.nombre && (
                          <div style={{marginTop:".4rem",fontSize:".7rem",color:"var(--mu2)",fontFamily:"Inter,sans-serif"}}>
                            Slug: <span style={{color:"var(--ac)"}}>{toSlug(casaForm.nombre)}</span>
                            <span style={{color:"var(--mu)",marginLeft:".5rem"}}>→ gestionderemates.cl/participar/{toSlug(casaForm.nombre)}</span>
                          </div>
                        )}
                      </div>
                      <div className="fg">
                        <label className="fl">Email de contacto</label>
                        <input className="fi" type="email" placeholder="contacto@casa.cl" value={casaForm.email}
                          onChange={e=>setCasaForm(f=>({...f,email:e.target.value}))}/>
                      </div>
                      <div className="fg">
                        <label className="fl">Teléfono</label>
                        <input className="fi" placeholder="+56 9 1234 5678" value={casaForm.telefono}
                          onChange={e=>setCasaForm(f=>({...f,telefono:e.target.value}))}/>
                      </div>
                      <div className="fg full">
                        <label className="fl">Dirección</label>
                        <input className="fi" placeholder="Av. Principal 123, Rancagua" value={casaForm.direccion}
                          onChange={e=>setCasaForm(f=>({...f,direccion:e.target.value}))}/>
                      </div>
                    </div>

                    {/* Datos del Martillero Público */}
                    <div style={{marginTop:"1.2rem",marginBottom:".6rem",fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",display:"flex",alignItems:"center",gap:".5rem"}}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14l8-8M9 3l2 2-6 6-2-2z"/><path d="M12 2l3 3-1.5 1.5"/></svg>
                      Datos del Martillero Público
                    </div>
                    <div className="form-grid">
                      <div className="fg full">
                        <label className="fl">Nombre completo del martillero *</label>
                        <input className="fi" placeholder="Juan Manuel Ahumada Baeza" value={casaForm.martillero}
                          onChange={e=>setCasaForm(f=>({...f,martillero:e.target.value}))}/>
                      </div>
                      <div className="fg">
                        <label className="fl">RUT del martillero</label>
                        <input className="fi" placeholder="12.345.678-9" value={casaForm.rutMartillero}
                          onChange={e=>setCasaForm(f=>({...f,rutMartillero:e.target.value}))}/>
                      </div>
                      <div className="fg">
                        <label className="fl">Teléfono del martillero</label>
                        <input className="fi" placeholder="+56 9 9145 3680" value={casaForm.telefonoMartillero}
                          onChange={e=>setCasaForm(f=>({...f,telefonoMartillero:e.target.value}))}/>
                      </div>
                      <div className="fg">
                        <label className="fl">Email del martillero</label>
                        <input className="fi" type="email" placeholder="martillero@casa.cl" value={casaForm.emailMartillero}
                          onChange={e=>setCasaForm(f=>({...f,emailMartillero:e.target.value}))}/>
                      </div>
                      <div className="fg">
                        <label className="fl">Dirección del martillero</label>
                        <input className="fi" placeholder="Hermanos Carrera 1320, Malloa" value={casaForm.direccionMartillero}
                          onChange={e=>setCasaForm(f=>({...f,direccionMartillero:e.target.value}))}/>
                      </div>
                    </div>

                    <div style={{marginTop:"1rem",padding:".75rem 1rem",background:"rgba(56,178,246,.05)",border:"1px solid rgba(56,178,246,.15)",borderRadius:9,fontSize:".73rem",color:"var(--mu2)",lineHeight:1.6}}>
                      Al crear la casa se generan automáticamente los links de <strong style={{color:"var(--wh2)"}}>inscripción pública</strong> y <strong style={{color:"var(--wh2)"}}>pantalla de sala</strong>. La licencia parte en modo <strong style={{color:"var(--yl)"}}>Trial (30 días)</strong>.
                    </div>
                    <div className="modal-actions">
                      <button className="btn-cancel" onClick={()=>{setCasaModal(false);resetCasaForm();}}>Cancelar</button>
                      <button className="btn-confirm" onClick={crearCasa}>Crear casa</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ CONFIG ══ */}
        {page==="config" && (
          <div className="page">
            <div style={{maxWidth:520,display:"flex",flexDirection:"column",gap:"1.1rem"}}>

              {/* Perfil */}
              <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.1rem 1.2rem"}}>
                <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:"1rem"}}>Mi perfil</div>
                <div className="fg" style={{marginBottom:".7rem"}}>
                  <label className="fl">Nombre</label>
                  <input className="fi" defaultValue={session?.name||""} placeholder="Tu nombre"/>
                </div>
                <div className="fg" style={{marginBottom:".7rem"}}>
                  <label className="fl">Correo electrónico</label>
                  <input className="fi" defaultValue={session?.email||""} placeholder="correo@ejemplo.cl" type="email"/>
                </div>
                <div className="fg" style={{marginBottom:"1rem"}}>
                  <label className="fl">Rol</label>
                  <input className="fi" value={session?.role==="admin"?"Administrador":"Martillero"} readOnly style={{opacity:.7,cursor:"default"}}/>
                </div>
                <button className="btn-primary" style={{fontSize:".78rem"}} onClick={()=>notify("Perfil actualizado.")}>Guardar cambios</button>
              </div>

              {/* Cambiar contraseña */}
              <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1.1rem 1.2rem"}}>
                <div style={{fontSize:".72rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:"1rem"}}>Cambiar contraseña</div>
                <div className="fg" style={{marginBottom:".7rem"}}>
                  <label className="fl">Contraseña actual</label>
                  <input className="fi" type="password" placeholder="••••••••"/>
                </div>
                <div className="fg" style={{marginBottom:".7rem"}}>
                  <label className="fl">Nueva contraseña</label>
                  <input className="fi" type="password" placeholder="••••••••"/>
                </div>
                <div className="fg" style={{marginBottom:"1rem"}}>
                  <label className="fl">Confirmar nueva contraseña</label>
                  <input className="fi" type="password" placeholder="••••••••"/>
                </div>
                <button className="btn-primary" style={{fontSize:".78rem"}} onClick={()=>notify("Contraseña actualizada.")}>Actualizar contraseña</button>
              </div>

            </div>
          </div>
        )}

        {/* ══ GARANTIAS ══ */}
        {page==="garantias" && (
          <div className="page">
            {/* Stats */}
            <div className="gar-steps">
              {[
                {n:"Total recibidas",v:GARANTIAS.length,l:"inscripciones este remate",c:"var(--ac)"},
                {n:"Aprobadas",v:GARANTIAS.filter(g=>g.estado==="aprobada").length,l:"paletas asignadas",c:"var(--gr)"},
                {n:"Pendientes",v:GARANTIAS.filter(g=>g.estado==="pendiente").length,l:"sin comprobante o efectivo",c:"var(--yl)"},
              ].map((s,i)=>(
                <div className="gar-step" key={i} style={{"--sc":s.c}}>
                  <div className="gar-step-n">{s.n}</div>
                  <div className="gar-step-v">{s.v}</div>
                  <div className="gar-step-l">{s.l}</div>
                </div>
              ))}
            </div>
            {/* Info box */}
            <div className="gar-info">
              <div className="gar-info-text">
                <strong>Cuenta para transferencias:</strong> Banco Estado · Cta. Cte. 123456789 · Remates Ahumada · RUT 76.123.456-7 · mahumada@rematesahumada.cl<br/>
                Monto garantia: <strong>$300.000</strong> — Devolucion en 5 dias habiles post remate. Si el postor adjudicado no paga, la garantia queda retenida.
              </div>
            </div>
            {/* Filters */}
            <div className="filter-row" style={{marginBottom:".85rem"}}>
              {["todos","aprobada","pendiente","devuelta"].map(f=>(
                <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>{f}</button>
              ))}
            </div>
            <div className="table-card">
              <div className="table-head">
                <div className="table-title">{GARANTIAS.filter(g=>filterTab==="todos"||g.estado===filterTab).length} garantias — Remate Industrial Marzo</div>
              </div>
              <table>
                <thead><tr><th>ID</th><th>Postor</th><th>RUT</th><th>Email</th><th>Remate</th><th>Metodo</th><th>Paleta</th><th>Comprobante</th><th>Estado</th><th>Devolucion</th></tr></thead>
                <tbody>
                  {GARANTIAS.filter(g=>filterTab==="todos"||g.estado===filterTab).map(g=>(
                    <tr key={g.id}>
                      <td className="mono">{g.id}</td>
                      <td style={{fontWeight:600}}>{g.postor}</td>
                      <td className="mono">{g.rut}</td>
                      <td className="mono">{g.email}</td>
                      <td style={{fontSize:".73rem"}}>{g.remate}</td>
                      <td className="mono">{g.metodo}</td>
                      <td style={{textAlign:"center"}}>
                        {g.paleta
                          ? <div className="paleta-badge">{g.paleta}</div>
                          : <div className="paleta-none">—</div>}
                      </td>
                      <td>
                        {g.comprobante
                          ? <span style={{color:"var(--gr)",fontSize:".72rem",fontWeight:600}}>Adjunto</span>
                          : <span style={{color:"var(--yl)",fontSize:".72rem",fontWeight:600}}>Pendiente</span>}
                      </td>
                      <td>
                        <span className={`pill p-${g.estado}`}>
                          {g.estado==="aprobada"?"Aprobada":g.estado==="pendiente"?"Pendiente":"Devuelta"}
                        </span>
                      </td>
                      <td className="mono" style={{color:"var(--mu)"}}>{g.devolucion||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ ADJUDICACIONES ══ */}
        {page==="adjudicac" && (()=>{
          const NO_COMPRADORES_REMATE = noCompradoresState;

          // Adjudicaciones reales del remate actual (generadas en sala)
          const adjReal = liquidaciones.map((l,i)=>({
            nLote: i+1,
            lote:  l.lote,
            postor: l.postor,
            rut:   POSTORES_MERGED.find(p=>p.name===l.postor||p.razonSocial===l.postor)?.rut || l.rut || "—",
            nPart: POSTORES_MERGED.find(p=>p.name===l.postor||p.razonSocial===l.postor)?.nComprador || "—",
            monto: l.monto,
          }));

          if(adjReal.length===0) return (
            <div className="page">
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:"1rem",color:"var(--mu)"}}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="6" y="6" width="36" height="36" rx="6"/><path d="M16 24h16M16 16h16M16 32h8"/></svg>
                <div style={{fontSize:".95rem",fontWeight:600,color:"var(--wh2)"}}>No hay adjudicaciones aún</div>
                <div style={{fontSize:".78rem",textAlign:"center",maxWidth:320}}>Las adjudicaciones aparecen aquí cuando adjudicas lotes desde la Sala en vivo.</div>
                <button className="btn-primary" style={{marginTop:".5rem"}} onClick={()=>setPage("sala")}>Ir a Sala en vivo</button>
              </div>
            </div>
          );

          const devBadge = (d) => {
            if(d==="N/A")       return {label:"Sin garantía", bg:"rgba(255,255,255,.04)", color:"var(--mu)"};
            if(d==="pendiente") return {label:"Pendiente",    bg:"rgba(246,173,85,.1)",   color:"var(--yl)"};
            if(d==="cheque")    return {label:"Cheque",       bg:"rgba(20,184,166,.1)",   color:"var(--gr)"};
            if(d==="efectivo")  return {label:"Efectivo",     bg:"rgba(20,184,166,.1)",   color:"var(--gr)"};
            return                     {label:d,              bg:"rgba(255,255,255,.04)", color:"var(--mu)"};
          };

          // Descargar listado devoluciones .txt
          const descargarTxt = () => {
            const lineas = ["N° Part.\tNombre\tGarantía\tForma Pago\tDevolución"];
            noCompradoresState.forEach(c=>{
              lineas.push(`${c.nPart}\t${c.nombre}\t$${c.garantia.toLocaleString("es-CL")}\t${c.formaPago}\t${c.devolucion.toUpperCase()}`);
            });
            const blob = new Blob([lineas.join("\n")],{type:"text/plain"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `devoluciones-${remateActual?.id||"remate"}.txt`;
            a.click();
          };

          return (
            <div className="page">
              {/* Stat cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".7rem",marginBottom:"1.3rem"}}>
                {[
                  {label:"Lotes adjudicados", val:adjReal.length,                                    color:"var(--ac)"},
                  {label:"Total martillo",     val:fmt(adjReal.reduce((s,a)=>s+a.monto,0)),           color:"var(--gr)"},
                  {label:"Compradores únicos", val:new Set(adjReal.map(a=>a.postor)).size,            color:"var(--yl)"},
                ].map((s,i)=>(
                  <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,padding:".8rem 1rem",borderTop:`3px solid ${s.color}`}}>
                    <div style={{fontSize:".62rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".3rem"}}>{s.label}</div>
                    <div style={{fontFamily:"Inter,sans-serif",fontSize:"1.3rem",fontWeight:800,color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Tabla adjudicaciones */}
              <div className="table-card">
                <div className="table-head">
                  <div className="table-title">Adjudicaciones — {adjReal.length} lote{adjReal.length!==1?"s":""}</div>
                  <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>setPage("liquidac")}>Ver liquidaciones →</button>
                </div>
                <table>
                  <thead><tr>
                    <th>Lote</th>
                    <th>Descripción</th>
                    <th>N° Part.</th>
                    <th>Adjudicatario</th>
                    <th>RUT</th>
                    <th style={{textAlign:"right"}}>Monto martillo</th>
                  </tr></thead>
                  <tbody>
                    {adjReal.map((a,i)=>(
                      <tr key={i}>
                        <td><span style={{fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--ac)"}}>{a.nLote}</span></td>
                        <td style={{maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.lote}</td>
                        <td><span style={{fontWeight:700,color:"var(--wh2)"}}>{a.nPart}</span></td>
                        <td>{a.postor}</td>
                        <td style={{fontFamily:"Inter,sans-serif",fontSize:".75rem",color:"var(--mu2)"}}>{a.rut}</td>
                        <td style={{textAlign:"right",fontWeight:700,color:"var(--gr)",fontFamily:"Inter,sans-serif"}}>{fmt(a.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ══ LIQUIDACIONES ══ */}
        {page==="liquidac" && (
          <div className="page">
            {/* Banner selector de remate */}
            {(() => {
              const cerrados = REMATES_MERGED.filter(r => r.estado === "cerrado");
              if(cerrados.length===0) return (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:"1rem",color:"var(--mu)"}}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 40V16l16-8 16 8v24"/><path d="M20 40v-8h8v8"/><path d="M16 24h4M28 24h4M16 32h4M28 32h4"/></svg>
                  <div style={{fontSize:".95rem",fontWeight:600,color:"var(--wh2)"}}>No hay remates cerrados aún</div>
                  <div style={{fontSize:".78rem",textAlign:"center",maxWidth:320}}>Las liquidaciones se generan automáticamente al cerrar un remate desde la Sala en vivo.</div>
                  <button className="btn-primary" style={{marginTop:".5rem"}} onClick={()=>setPage("sala")}>Ir a Sala en vivo</button>
                </div>
              );
              return (
                <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1rem",padding:".75rem 1rem",background:"rgba(56,178,246,.06)",border:"1px solid rgba(56,178,246,.18)",borderRadius:9}}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5h6M5 11h3"/></svg>
                  <span style={{fontSize:".78rem",fontWeight:700,color:"var(--wh2)",whiteSpace:"nowrap"}}>Remate:</span>
                  <select
                    value={selectedRemate||""}
                    onChange={e => {
                      const rid = e.target.value||null;
                      setSelectedRemate(rid);
                      if(rid) {
                        const r = REMATES_MERGED.find(x=>x.id===rid);
                        if(r) {
                          const todasLiq = [...ADJUDICACIONES.map(a=>({lote:a.lote,exp:"",monto:a.monto,comPct:3,motorizado:false,postor:a.postor,rut:a.rut||"—",email:""})),...liquidaciones];
                          const byComprador = {};
                          todasLiq.forEach(l=>{
                            const pd = POSTORES_MERGED.find(p=>p.name===l.postor||p.razonSocial===l.postor)||null;
                            const key = pd?.nComprador??l.postor;
                            if(!byComprador[key]) byComprador[key]={postorData:pd,lotes:[],key};
                            byComprador[key].lotes.push(l);
                          });
                          const compradores = Object.values(byComprador).map(c=>({...c,liq:calcLiquidacion(c.lotes,c.postorData),enviado:false,facturado:false}));
                          setLiqReview({compradores,fecha:r.fecha,remateNombre:r.name,remateId:r.id});
                        }
                      } else {
                        setLiqReview(null);
                      }
                    }}
                    style={{flex:1,maxWidth:340,padding:".4rem .7rem",background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:7,color:"var(--wh2)",fontSize:".8rem",fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                    <option value="">— Selecciona un remate —</option>
                    {cerrados.map(r => (
                      <option key={r.id} value={r.id}>{r.name} · {r.fecha} · {r.casa}</option>
                    ))}
                  </select>
                  {selectedRemate && (
                    <button onClick={()=>{setSelectedRemate(null);setLiqReview(null);}}
                      style={{background:"transparent",border:"1px solid var(--b2)",borderRadius:6,color:"var(--mu2)",fontSize:".7rem",padding:".3rem .6rem",cursor:"pointer",whiteSpace:"nowrap"}}>
                      Limpiar
                    </button>
                  )}
                </div>
              );
            })()}
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.2rem",padding:".85rem 1rem",background:"rgba(56,178,246,.07)",border:"1px solid rgba(56,178,246,.2)",borderRadius:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:".82rem",fontWeight:700,color:"var(--wh2)",marginBottom:".2rem"}}>
                  {liqReview
                    ? <span>Liquidaciones — <span style={{color:"var(--ac)"}}>{liqReview.remateNombre||"Remate"}</span> &nbsp;·&nbsp; <span style={{fontFamily:"Inter,sans-serif",color:"var(--mu2)"}}>{liqReview.fecha}</span> &nbsp;·&nbsp; {liqReview.compradores.length} compradores</span>
                    : "Liquidaciones por comprador"
                  }
                </div>
                <div style={{fontSize:".73rem",color:"var(--mu2)"}}>
                  Revisa cada liquidacion antes de enviar. Una vez confirmadas se envia el correo con PDF a cada adjudicatario.
                </div>
              </div>
              {liqReview && (
                <button className="btn-primary" onClick={()=>{
                  setLiqReview(r=>({...r,compradores:r.compradores.map(c=>({...c,enviado:true}))}));
                  notify(`Liquidaciones enviadas a ${liqReview.compradores.length} compradores.`,"sold");
                }}>
                  Enviar a todos ({liqReview?.compradores?.filter(c=>!c.enviado).length} pendientes)
                </button>
              )}
            </div>

            {/* Sin liquidaciones aún */}
            {!liqReview && (
              <div style={{padding:"4rem 2rem",textAlign:"center"}}>
                <div style={{fontSize:"2rem",opacity:.2,marginBottom:"1rem"}}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--mu)" strokeWidth="1.5"><rect x="8" y="4" width="32" height="40" rx="3"/><path d="M16 16h16M16 24h16M16 32h8"/></svg>
                </div>
                <div style={{fontSize:".88rem",fontWeight:700,color:"var(--wh2)",marginBottom:".4rem"}}>Sin liquidaciones aun</div>
                <div style={{fontSize:".76rem",color:"var(--mu)",lineHeight:1.6}}>
                  Las liquidaciones se generan al cerrar el remate desde la Sala en vivo.<br/>
                  Presiona <strong style={{color:"var(--wh2)"}}>Cerrar remate</strong> para agruparlas por comprador y revisarlas antes de enviar.
                </div>
              </div>
            )}

            {/* ── Tabla resumen (estilo liquidar_compradores.php) ── */}
            {liqReview && (
              <div className="table-card" style={{marginBottom:"1.2rem"}}>
                <div className="table-head">
                  <div className="table-title">Resumen compradores — {liqReview.fecha}</div>
                  <div style={{fontSize:".72rem",color:"var(--mu)"}}>
                    {liqReview.compradores.length} compradores · Total bruto{" "}
                    <strong style={{color:"var(--ac)"}}>
                      {fmt(liqReview.compradores.reduce((s,c)=>s+c.liq.total,0))}
                    </strong>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>N° Part.</th>
                      <th>Nombre cliente</th>
                      <th>Lotes</th>
                      <th style={{textAlign:"right"}}>Garantía</th>
                      <th style={{textAlign:"right"}}>Total bruto</th>
                      <th style={{textAlign:"right"}}>Total a pagar</th>
                      <th style={{textAlign:"center"}}>Estado</th>
                      <th style={{textAlign:"center"}}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liqReview.compradores.map((c,ci)=>{
                      const p = c.postorData;
                      const l = c.liq;
                      return (
                        <tr key={ci} style={{cursor:"pointer"}} onClick={()=>setLiqExpanded(liqExpanded===ci?null:ci)}>
                          <td>
                            <div style={{width:30,height:30,borderRadius:6,background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:".78rem",fontWeight:800,color:"var(--ac)"}}>
                              {String(c.key).padStart(2,"0")}
                            </div>
                          </td>
                          <td style={{fontWeight:600,color:"var(--wh2)",textTransform:"uppercase"}}>
                            {p?.razonSocial||c.lotes[0]?.postor||"—"}
                          </td>
                          <td style={{fontFamily:"Inter,sans-serif",fontSize:".78rem",color:"var(--mu2)",textAlign:"center"}}>
                            {c.lotes.length}
                          </td>
                          <td style={{fontFamily:"Inter,sans-serif",fontSize:".78rem",textAlign:"right",color:l.garantia>0?"var(--yl)":"var(--mu)"}}>
                            {fmt(l.garantia)}
                          </td>
                          <td style={{fontFamily:"Inter,sans-serif",fontWeight:700,textAlign:"right",color:"var(--wh2)"}}>
                            {fmt(l.total)}
                          </td>
                          <td style={{fontFamily:"Inter,sans-serif",fontWeight:800,textAlign:"right",color:"var(--ac)",fontSize:".9rem"}}>
                            {fmt(l.totalAPagar)}
                          </td>
                          <td style={{textAlign:"center"}}>
                            {c.enviado
                              ? <span className="sent-badge">Enviado</span>
                              : <span className="pill p-saldo">Pendiente</span>}
                          </td>
                          <td style={{textAlign:"center"}}>
                            <button
                              className="btn-primary"
                              style={{fontSize:".68rem",padding:".28rem .7rem"}}
                              onClick={e=>{e.stopPropagation();setLiqExpanded(ci);setTimeout(()=>document.getElementById(`liq-card-${ci}`)?.scrollIntoView({behavior:"smooth",block:"start"}),50);}}
                            >
                              Ver liquidación
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:"2px solid var(--b2)",background:"rgba(255,255,255,.02)"}}>
                      <td colSpan={4} style={{padding:".6rem .75rem",textAlign:"right",fontSize:".7rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase"}}>Totales</td>
                      <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--wh2)",fontSize:".82rem"}}>
                        {fmt(liqReview.compradores.reduce((s,c)=>s+c.liq.total,0))}
                      </td>
                      <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:900,color:"var(--ac)",fontSize:".85rem"}}>
                        {fmt(liqReview.compradores.reduce((s,c)=>s+c.liq.totalAPagar,0))}
                      </td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Lista de compradores */}
            {liqReview?.compradores.map((c,ci) => {
              const p = c.postorData;
              const l = c.liq;
              const isOpen = liqExpanded === ci;
              return (
                <div key={ci} id={`liq-card-${ci}`} className="liq-card" style={{marginBottom:".8rem"}}>
                  {/* Header comprador */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: isOpen?".9rem":"0",cursor:"pointer"}} onClick={()=>setLiqExpanded(isOpen?null:ci)}>
                    <div style={{display:"flex",alignItems:"center",gap:".85rem"}}>
                      <div style={{width:38,height:38,borderRadius:8,background:"rgba(56,178,246,.12)",border:"1px solid rgba(56,178,246,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",fontSize:".8rem",fontWeight:700,color:"var(--ac)",flexShrink:0}}>
                        {String(c.key).padStart(2,"0")}
                      </div>
                      <div>
                        <div style={{fontSize:".88rem",fontWeight:700,color:"var(--wh)"}}>{p?.razonSocial||c.lotes[0]?.postor||"—"}</div>
                        <div style={{fontSize:".72rem",color:"var(--mu2)"}}>{p?.rut||"—"} · {p?.giro||"—"} · {c.lotes.length} lote{c.lotes.length>1?"s":""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:700,color:"var(--ac)"}}>{fmt(l.totalAPagar)}</div>
                        <div style={{fontSize:".65rem",color:"var(--mu)"}}>total a pagar</div>
                      </div>
                      {c.enviado
                        ? <span className="sent-badge">Enviado</span>
                        : <span className="pill p-saldo">Pendiente</span>}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--mu)" strokeWidth="1.8" strokeLinecap="round" style={{transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M2 5l5 5 5-5"/></svg>
                    </div>
                  </div>

                  {/* Detalle expandido — formato fiel a la liquidación real */}
                  {isOpen && (
                    <div style={{borderTop:"1px solid var(--b1)",paddingTop:".9rem"}}>
                      {/* Datos comprador */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".35rem .9rem",marginBottom:"1rem",padding:".7rem .85rem",background:"rgba(255,255,255,.025)",borderRadius:7,fontSize:".74rem"}}>
                        {[
                          ["Comprador N°", String(c.key).padStart(2,"0")],
                          ["Fecha", liqReview.fecha],
                          ["R.U.T", p?.rut||"—"],
                          ["Señor(es)", p?.razonSocial||"—"],
                          ["Giro", p?.giro||"—"],
                          ["Direccion", p?.direccion||"—"],
                          ["Telefono", p?.tel||"—"],
                          ["Mail", p?.email||"—"],
                          ["Comuna", p?.comuna||"—"],
                        ].map(([k,v])=>(
                          <div key={k} style={{display:"flex",gap:".5rem"}}>
                            <span style={{color:"var(--mu)",minWidth:90,flexShrink:0}}>{k}</span>
                            <span style={{color:"var(--wh2)",fontWeight:600}}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tabla de lotes — fiel al formato real */}
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:".76rem",marginBottom:"1rem"}}>
                        <thead>
                          <tr style={{borderBottom:"1px solid var(--b1)"}}>
                            {["Lote","Cant.","Descripcion","ND","Unitario","Total"].map(h=>(
                              <th key={h} style={{padding:".4rem .5rem",textAlign:h==="Unitario"||h==="Total"?"right":"left",color:"var(--mu)",fontWeight:600,fontSize:".65rem",textTransform:"uppercase",letterSpacing:".04em"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {l.lineas.map((ln,li)=>(
                            <>
                              <tr key={`a-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                                <td style={{padding:".45rem .5rem",fontFamily:"Inter,sans-serif",fontSize:".7rem",color:"var(--mu2)"}}>{ln.exp||`Lote ${li+1}`}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                                <td style={{padding:".45rem .5rem",fontWeight:600,color:"var(--wh2)"}}>{ln.lote}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(255,255,255,.05)",borderRadius:3,color:"var(--mu)"}}>EX</span></td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--wh2)"}}>{fmt(ln.monto)}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:"var(--wh2)"}}>{fmt(ln.monto)}</td>
                              </tr>
                              <tr key={`b-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                                <td style={{padding:".45rem .5rem",fontFamily:"Inter,sans-serif",fontSize:".7rem",color:"var(--mu2)"}}>{ln.exp||`Lote ${li+1}`}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                                <td style={{padding:".45rem .5rem",color:"var(--mu2)"}}>Comision {ln.comPct}%</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(56,178,246,.08)",borderRadius:3,color:"var(--ac)"}}>AF</span></td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--mu2)"}}>{fmt(ln.com)}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--mu2)"}}>{fmt(ln.com)}</td>
                              </tr>
                              {ln.motorizado && (
                                <tr key={`c-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                                  <td style={{padding:".45rem .5rem",fontFamily:"Inter,sans-serif",fontSize:".7rem",color:"var(--mu2)"}}>G-ADMIN</td>
                                  <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                                  <td style={{padding:".45rem .5rem",color:"var(--yl)",fontSize:".73rem"}}>Gastos Administrativos — Vehiculo Motorizado ({ln.exp||`Lote ${li+1}`})</td>
                                  <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(56,178,246,.08)",borderRadius:3,color:"var(--ac)"}}>AF</span></td>
                                  <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--yl)"}}>{fmt(ln.gastosAdm)}</td>
                                  <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"Inter,sans-serif",color:"var(--yl)"}}>{fmt(ln.gastosAdm)}</td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>

                      {/* Totales — fiel al formato real */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",alignItems:"start"}}>
                        <div style={{fontSize:".74rem",color:"var(--mu2)",lineHeight:2}}>
                          {[
                            ["Total Compras Exentas:", fmt(l.totalEx)],
                            ["Total Compras Afectas:", fmt(l.totalAf)],
                            ["Total Comision:", fmt(l.totalCom)],
                            ["19% IVA:", fmt(l.iva)],
                          ].map(([k,v])=>(
                            <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.03)",padding:".12rem 0"}}>
                              <span>{k}</span><span style={{fontFamily:"Inter,sans-serif",color:"var(--wh2)"}}>{v}</span>
                            </div>
                          ))}
                          <div style={{display:"flex",justifyContent:"space-between",padding:".25rem 0",borderTop:"1px solid var(--b2)",marginTop:".1rem",fontWeight:700,fontSize:".8rem"}}>
                            <span style={{color:"var(--wh2)"}}>Total:</span><span style={{fontFamily:"Inter,sans-serif",color:"var(--ac)"}}>{fmt(l.total)}</span>
                          </div>
                        </div>
                        <div style={{background:"rgba(56,178,246,.06)",border:"1px solid rgba(56,178,246,.2)",borderRadius:8,padding:".8rem 1rem",fontSize:".78rem"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:".4rem",color:"var(--mu2)"}}>
                            <span>Garantia:</span><span style={{fontFamily:"Inter,sans-serif",color:"var(--gr)"}}>{fmt(l.garantia)}</span>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",paddingTop:".4rem",borderTop:"1px solid rgba(56,178,246,.2)"}}>
                            <span style={{fontWeight:700,color:"var(--wh2)",fontSize:".85rem"}}>Total a Pagar:</span>
                            <span style={{fontFamily:"Inter,sans-serif",fontWeight:800,fontSize:"1rem",color:"var(--ac)"}}>{fmt(l.totalAPagar)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="liq-actions" style={{marginTop:"1rem",paddingTop:".8rem",borderTop:"1px solid var(--b1)",display:"flex",gap:".5rem",flexWrap:"wrap"}}>

                        {/* Descargar PDF */}
                        <button className="btn-sec" style={{fontSize:".73rem"}} onClick={()=>generarPDFLiquidacion(c, liqReview.fecha)}>
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><path d="M2 13h10M7 1v8M4 6l3 3 3-3"/></svg>
                          Descargar PDF
                        </button>

                        {/* Enviar por correo */}
                        <button
                          className="btn-primary"
                          style={{fontSize:".73rem", background: c.enviado?"rgba(20,184,166,.12)":"var(--ac)", color: c.enviado?"var(--gr)":"#fff", border: c.enviado?"1px solid rgba(20,184,166,.3)":"none"}}
                          onClick={()=>{
                            generarPDFLiquidacion(c, liqReview.fecha);
                            setLiqReview(r=>({...r,compradores:r.compradores.map((x,xi)=>xi===ci?{...x,enviado:true}:x)}));
                            notify(`PDF generado — envía a ${p?.email||c.postorData?.email||"comprador"} manualmente.`,"sold");
                          }}>
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><path d="M1 1l12 6-12 6V9l8-2-8-2V1z"/></svg>
                          {c.enviado ? "Reenviar correo" : "Enviar liquidación"}
                        </button>

                        {/* Facturar */}
                        {!c.facturado
                          ? <button
                              className="btn-sec"
                              style={{fontSize:".73rem", borderColor:"rgba(246,173,85,.4)", color:"#f6ad55"}}
                              onClick={()=>{
                                setLiqReview(r=>({...r,compradores:r.compradores.map((x,xi)=>xi===ci?{...x,facturado:true}:x)}));
                                notify(`Factura marcada para ${p?.name||c.postorData?.name||"comprador"}.`,"sold");
                              }}>
                              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:".3rem"}}><rect x="2" y="1" width="10" height="12" rx="1"/><path d="M5 5h4M5 8h4M5 11h2"/></svg>
                              Marcar como facturado
                            </button>
                          : <div style={{display:"flex",alignItems:"center",gap:".35rem",fontSize:".72rem",color:"var(--gr)",padding:".35rem .7rem",background:"rgba(20,184,166,.07)",border:"1px solid rgba(20,184,166,.2)",borderRadius:6}}>
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-7"/></svg>
                              Facturado
                            </div>
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ DEVOLUCIONES ══ */}
        {page==="devoluciones" && (
          <div className="page">
            {/* Banner selector de remate */}
            {(() => {
              const cerrados = REMATES_MERGED.filter(r => r.estado === "cerrado");
              return (
                <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1rem",padding:".75rem 1rem",background:"rgba(56,178,246,.06)",border:"1px solid rgba(56,178,246,.18)",borderRadius:9}}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5h6M5 11h3"/></svg>
                  <span style={{fontSize:".78rem",fontWeight:700,color:"var(--wh2)",whiteSpace:"nowrap"}}>Remate:</span>
                  <select value={selectedRemate||""} onChange={e=>setSelectedRemate(e.target.value||null)}
                    style={{flex:1,maxWidth:340,padding:".4rem .7rem",background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:7,color:"var(--wh2)",fontSize:".8rem",fontFamily:"Inter,sans-serif",cursor:"pointer"}}>
                    <option value="">— Todos los remates cerrados —</option>
                    {cerrados.map(r=><option key={r.id} value={r.id}>{r.name} · {r.fecha} · {r.casa}</option>)}
                  </select>
                  {selectedRemate && <button onClick={()=>setSelectedRemate(null)} style={{background:"transparent",border:"1px solid var(--b2)",borderRadius:6,color:"var(--mu2)",fontSize:".7rem",padding:".3rem .6rem",cursor:"pointer"}}>Ver todos</button>}
                </div>
              );
            })()}
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.2rem",padding:".8rem 1rem",background:"rgba(246,173,85,.07)",border:"1px solid rgba(246,173,85,.2)",borderRadius:8}}>
              <div style={{flex:1,fontSize:".76rem",color:"var(--mu2)",lineHeight:1.5}}>
                Postores que <strong style={{color:"var(--wh2)"}}>no compraron</strong> y tienen garantia a devolver. El sistema los identifica automaticamente al cerrar el remate. Plazo: <strong style={{color:"var(--wh2)"}}>5 dias habiles.</strong>
              </div>
              <button className="btn-primary" onClick={()=>notify("Notificaciones de devolucion enviadas.","sold")}>Notificar a todos</button>
            </div>
            {/* Devs from real GARANTIAS data + dynamic ones */}
            {[
              ...GARANTIAS.filter(g=>g.estado==="aprobada"&&!g.devolucion).map(g=>({
                postor:g.postor, rut:g.rut, email:g.email, monto:g.monto, estado:"pendiente", enviado:false, id:g.id
              })),
              ...devoluciones
            ].filter((v,i,arr)=>arr.findIndex(x=>x.postor===v.postor)===i)
            .map((d,i)=>(
              <div className="dev-card" key={i}>
                <div>
                  <div className="dev-name">{d.postor}</div>
                  <div className="dev-sub">{d.rut} · {d.email}</div>
                  <div className="dev-sub" style={{marginTop:".15rem"}}>Cuenta destino: {d.cuenta||"Por confirmar"}</div>
                  <div className="dev-monto">{fmt(d.monto)}</div>
                </div>
                <div className="dev-actions">
                  <span className={`pill ${d.enviado?"p-enviada":"p-penddev"}`}>{d.enviado?"Devolucion enviada":"Pendiente"}</span>
                  {!d.enviado && (
                    <button className="btn-primary" style={{fontSize:".7rem",padding:".3rem .75rem"}} onClick={()=>notify(`Devolucion marcada para ${d.postor}.`,"sold")}>
                      Marcar como enviada
                    </button>
                  )}
                  <button className="btn-sec" style={{fontSize:".68rem",padding:".26rem .65rem"}} onClick={()=>notify(`Correo enviado a ${d.email}.`,"inf")}>
                    Notificar por correo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ SALA EN VIVO — estado vacío ══ */}
        {page==="sala" && (!item || !bid) && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:"1.2rem",color:"var(--wh2)",textAlign:"center",padding:"2rem"}}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.35}}>
              <circle cx="32" cy="32" r="28"/>
              <path d="M32 20v12l8 4"/>
            </svg>
            <div style={{fontSize:"1.15rem",fontWeight:700}}>No hay ningún remate en curso</div>
            <div style={{fontSize:".85rem",color:"var(--mu)",maxWidth:320}}>Abrí un remate desde la sección <strong>Remates</strong> para comenzar la sala en vivo.</div>
            <button className="btn-primary" style={{marginTop:".5rem"}} onClick={()=>setPage("remates")}>Ir a Remates →</button>
          </div>
        )}

        {/* ══ SALA EN VIVO ══ */}
        {page==="sala" && item && bid && (
          <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
            <div className="topbar">
              <div className="topbar-left">
                <button className="btn-sec" onClick={()=>setPage("remates")}>← Volver</button>
                <div className="topbar-title">Sala en vivo</div>
                {/* Selector de remate en sala */}
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
                {/* Modalidad selector */}
                <div className="mod-tabs">
                  {[["presencial","Presencial"],["hibrido","Hibrido"],["online","Online"]].map(([k,l])=>(
                    <button key={k} className={`mod-tab${modalidad===k?" on":""}`} onClick={()=>setModalidad(k)}>{l}</button>
                  ))}
                </div>
                {aState==="live" && <div className="tb-live"><div className="ldot"/>Transmitiendo</div>}
                <button className="btn-sec" style={{fontSize:".7rem"}} title="Abrir pantalla para proyección en sala"
                  onClick={()=>window.open(`/display/${session?.casa||"rematesahumada"}`,"_blank","width=1280,height=720")}>
                  Pantalla sala
                </button>
                {bids.every(b=>b.status==="sold"||bids[idx].count>0) && (
                  <button className="btn-primary" style={{fontSize:".7rem"}} onClick={cerrarRemateCompleto}>Cerrar remate</button>
                )}
              </div>
            </div>

            <div className="sala-wrap-new">
              <div className="sala-body">

                {/* ── LEFT CARD: foto + timer ── */}
                <div className="sala-left-card">
                  {/* Live badge */}
                  <div className="sala-live-badge">
                    <span style={{fontSize:".65rem"}}>●</span>
                    {aState==="live" ? "Live Now" : aState==="sold" ? "Adjudicado" : "En espera"}
                  </div>

                  {/* Lot title */}
                  <div className="sala-lot-title">
                    LOTE {String(idx+1).padStart(2,"0")} — {item.name}
                  </div>

                  {/* Photo carousel */}
                  <div className="sala-photo-wrap">
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
                              style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 2L4 6l4 4"/></svg>
                            </button>
                            <button onClick={()=>{ if(photoIntervalRef.current) clearInterval(photoIntervalRef.current); setPhotoIdx(p=>(p+1)%item.imgs.length); startCarousel(item.imgs); }}
                              style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 2l4 4-4 4"/></svg>
                            </button>
                            <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
                              {item.imgs.map((_,i)=>(
                                <div key={i} onClick={()=>setPhotoIdx(i)}
                                  style={{width:i===photoIdx%item.imgs.length?18:7,height:7,borderRadius:4,background:i===photoIdx%item.imgs.length?"var(--ac)":"rgba(255,255,255,.4)",cursor:"pointer",transition:"all .2s"}}/>
                              ))}
                            </div>
                            <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.6)",borderRadius:4,padding:".15rem .45rem",fontSize:".68rem",color:"#fff",fontFamily:"Inter,sans-serif"}}>
                              {(photoIdx%item.imgs.length)+1}/{item.imgs.length}
                            </div>
                          </>
                        )}
                        <button onClick={()=>removePhoto(idx, photoIdx%item.imgs.length)}
                          style={{position:"absolute",top:8,left:8,background:"rgba(224,82,82,.7)",border:"none",borderRadius:4,padding:".15rem .4rem",fontSize:".65rem",color:"#fff",cursor:"pointer"}}>
                          Quitar
                        </button>
                        {(item.imgs||[]).length > 0 && (
                          <label htmlFor={`phadd${idx}`}
                            style={{position:"absolute",bottom:8,right:8,background:"rgba(56,178,246,.85)",borderRadius:5,padding:".2rem .55rem",fontSize:".65rem",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:".25rem"}}>
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                            Foto
                            <input id={`phadd${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                          </label>
                        )}
                      </>
                    ) : (
                      <label htmlFor={`ph${idx}`} className="sala-photo-placeholder" style={{cursor:"pointer"}}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--mu)" strokeWidth="1.5"><rect x="3" y="6" width="26" height="20" rx="3"/><circle cx="16" cy="16" r="5"/><path d="M12 6l2-3h4l2 3"/></svg>
                        <div style={{fontSize:".75rem",color:"var(--mu2)"}}>Agregar fotos del lote</div>
                        <input id={`ph${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                      </label>
                    )}
                  </div>

                  {/* Timer */}
                  <div className="sala-timer">
                    <span>Tiempo restante:</span>
                    {aState==="live" && bidTimer!==null && bidTimer>0 ? (
                      <span className={`sala-timer-num${bidTimer<=2?" critical":bidTimer<=5?" urgent":" safe"}`}>
                        00:00:{String(bidTimer).padStart(2,"0")}
                      </span>
                    ) : (
                      <span className="sala-timer-num" style={{color:"var(--mu)"}}>—</span>
                    )}
                  </div>

                  {/* ── LOTES PRÓXIMOS ── */}
                  <div className="sala-lotes-proximos">
                    <div className="sala-lotes-proximos-title">
                      <span>{lots.length} lotes en remate</span>
                      <span style={{color:"var(--mu)",fontWeight:400}}> · próximos</span>
                    </div>
                    <div className="sala-lotes-proximos-list">
                      {lots.map((l,i)=>{
                        const b = bids[i]||{};
                        const esCurrent = i===idx;
                        const esAdj = b.status==="adjudicado";
                        return (
                          <div key={i} className={`sala-lote-mini${esCurrent?" current":esAdj?" adj":""}`}>
                            {l.imgs?.[0]
                              ? <img src={l.imgs[0]} alt="" className="sala-lote-mini-img"/>
                              : <div className="sala-lote-mini-img sala-lote-mini-noimg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>
                            }
                            <div className="sala-lote-mini-info">
                              <div className="sala-lote-mini-num">Lote {i+1}</div>
                              <div className="sala-lote-mini-name">{l.name}</div>
                            </div>
                            <div className="sala-lote-mini-status">
                              {esAdj ? <span style={{color:"var(--gr)",fontSize:".65rem",fontWeight:700}}>✓ Adj.</span>
                               : esCurrent ? <span style={{color:"var(--ac)",fontSize:".65rem",fontWeight:700}}>● Actual</span>
                               : <span style={{color:"var(--mu)",fontSize:".65rem"}}>Pendiente</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="sala-right-col">

                  {/* ── Top bid card ── */}
                  <div className="sala-bid-card">
                    <div className="sala-bid-header">
                      <div>
                        <div className="sala-bid-label">Oferta actual:</div>
                        <div className={`sala-bid-amount${flash?" flash":""}`}>{fmt(bid.current)}</div>
                      </div>
                      {/* Camera / Live feed button */}
                      <button
                        className="sala-livefeed-btn"
                        onClick={camActiva ? detenerCamara : activarCamara}
                        title="Cámara martillero"
                      >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 3h8l3 3v5H1V3z"/><circle cx="5" cy="8" r="1.5"/></svg>
                        {camActiva ? "Detener cámara" : "Live Feed"}
                        {camActiva && <span style={{width:6,height:6,borderRadius:"50%",background:"var(--rd)",animation:"pulse 1s infinite",flexShrink:0}}/>}
                      </button>
                    </div>

                    {/* Video pequeño si cámara activa */}
                    {camActiva && (
                      <div style={{borderRadius:8,overflow:"hidden",marginBottom:".75rem",background:"#000",height:90,position:"relative"}}>
                        <video ref={videoRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        {grabando && <span style={{position:"absolute",top:5,right:5,fontSize:".6rem",fontWeight:800,color:"var(--rd)",display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:"var(--rd)",animation:"pulse 1s infinite"}}/>REC</span>}
                      </div>
                    )}

                    {/* Last bids */}
                    <div className="sala-last-bids-title">Últimas pujas:</div>
                    <div className="sala-last-bids" ref={feedRef}>
                      {bid.history.length===0
                        ? <div className="sala-no-bids">Sin pujas aún</div>
                        : [...bid.history].reverse().slice(0,8).map((b,i) => {
                          const initials = (b.bidder||"?").split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
                          const avatarColors = ["var(--ac)","#a78bfa","var(--yl)","var(--gr)"];
                          return (
                            <div key={i} className="sala-bid-row">
                              <div className="sala-bid-avatar" style={{background:avatarColors[i%avatarColors.length]}}>
                                {b.mine?"Yo":initials}
                              </div>
                              <div className="sala-bid-name">
                                {b.mine?"Tu (P-0245)":b.bidder}
                                {b.online && <span className="sala-bid-tag web" style={{marginLeft:4}}>WEB</span>}
                                {b.presencial && <span className="sala-bid-tag pres" style={{marginLeft:4}}>PRES</span>}
                              </div>
                              <div>
                                <div className="sala-bid-amount-sm">{fmt(b.amount)}</div>
                                <div className="sala-bid-time">{b.time}</div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>

                    {/* Tabs control/postor */}
                    <div className="ctrl-tabs" style={{marginBottom:".75rem"}}>
                      {[["control","Control Martillero"],["postor","Vista Postor"]].map(([k,l]) => (
                        <button key={k} className={`ctrl-tab${ctrlTab===k?" on":""}`} onClick={()=>setCtrlTab(k)}>{l}</button>
                      ))}
                    </div>

                    {/* CONTROL TAB */}
                    {ctrlTab==="control" && (
                      <>
                        <div className="ctrl-grid">
                          <div className="ctrl-card">
                            <div className="ctrl-card-title">Lote activo</div>
                            <select className="asel" value={idx} onChange={e=>{setIdx(Number(e.target.value));resetAuction();setCurInc(lots[Number(e.target.value)]?.inc||500000);}}>
                              {lots.map((it,i) => <option key={i} value={i}>Lote {String(i+1).padStart(2,"0")} — {it.name}</option>)}
                            </select>
                            <div className="inc-ctrl">
                              <div className="inc-title">Incremento por puja</div>
                              <div className="inc-cur-lbl">Activo ahora</div>
                              <div className="inc-cur">{fmtS(curInc)}</div>
                              <div className="inc-btns">
                                {INC_OPTIONS.map(v => (
                                  <button key={v} className={`inc-btn${curInc===v?" on":""}`} onClick={()=>setCurInc(v)}>{fmtS(v)}</button>
                                ))}
                              </div>
                              <div style={{display:"flex",gap:".4rem",marginTop:".5rem",alignItems:"center"}}>
                                <input
                                  placeholder="Monto personalizado..."
                                  value={customMonto}
                                  onChange={e=>setCustomMonto(e.target.value)}
                                  onKeyDown={e=>{ if(e.key==="Enter"&&customMonto){ const n=parseInt(customMonto.replace(/\D/g,"")); if(n>0){setCurInc(n);setCustomMonto("");} } }}
                                  style={{flex:1,padding:".3rem .55rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}
                                />
                                <button
                                  onClick={()=>{ const n=parseInt((customMonto||"").replace(/\D/g,"")); if(n>0){setCurInc(n);setCustomMonto("");} }}
                                  style={{padding:".3rem .6rem",background:"var(--ac)",border:"none",borderRadius:6,color:"#fff",fontSize:".68rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                                  Usar
                                </button>
                              </div>
                            </div>
                            {/* Postura presencial */}
                            <div style={{marginTop:".6rem",padding:".6rem .75rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:8}}>
                              <div style={{fontSize:".68rem",fontWeight:700,color:"var(--yl)",marginBottom:".4rem",display:"flex",alignItems:"center",gap:".35rem"}}>
                                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v4M7 10v.5"/></svg>
                                Postura presencial
                              </div>
                              <div style={{display:"flex",gap:".4rem"}}>
                                <input placeholder="Paleta" value={presPaleta} onChange={e=>setPresPaleta(e.target.value)}
                                  style={{width:64,padding:".3rem .5rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}/>
                                <input placeholder="Monto" value={presMonto} onChange={e=>setPresMonto(e.target.value)}
                                  onKeyDown={e=>e.key==="Enter"&&registrarPresencial()}
                                  style={{flex:1,padding:".3rem .5rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}/>
                                <button onClick={registrarPresencial}
                                  style={{padding:".3rem .6rem",background:"rgba(246,173,85,.2)",border:"1px solid rgba(246,173,85,.4)",borderRadius:6,color:"var(--yl)",fontSize:".68rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                                  ✓
                                </button>
                              </div>
                            </div>
                            <div className="ab-list" style={{marginTop:".6rem"}}>
                              <button className="ab g"  onClick={startAuction} disabled={aState==="live"}>▶ Iniciar</button>
                              <button className="ab y"  onClick={pauseAuction} disabled={aState!=="live"}>⏸ Pausar</button>
                              <button className="ab bl" onClick={adjudicar}    disabled={aState==="sold"}>✓ Adjudicar</button>
                              <button className="ab"    onClick={repetirLote}  style={{background:"rgba(167,139,250,.1)",color:"#a78bfa",border:"1px solid rgba(167,139,250,.25)"}}>↺ Repetir lote</button>
                              <button className="ab"    onClick={pasarLote}    style={{background:"rgba(255,255,255,.04)",color:"var(--mu2)",border:"1px solid var(--b2)"}} disabled={idx>=lots.length-1}>→ Pasar lote</button>
                              <button className="ab r"  onClick={resetAuction}>⟳ Reiniciar todo</button>
                            </div>
                          </div>
                          <div className="ctrl-card">
                            <div className="ctrl-card-title">Estado en tiempo real</div>
                            <div className="st-row"><div className="st-dot" style={{background:sColor,boxShadow:`0 0 7px ${sColor}`}}/><div className="st-txt" style={{color:sColor}}>{sLabel}</div></div>
                            <div className="ls-grid">
                              <div className="ls-card"><div className="ls-v" style={{fontSize:".82rem"}}>{fmt(bid.current)}</div><div className="ls-l">Oferta</div></div>
                              <div className="ls-card"><div className="ls-v">{bid.count}</div><div className="ls-l">Pujas</div></div>
                              <div className="ls-card"><div className="ls-v">{lastBidder ? "🏆" : "—"}</div><div className="ls-l">Líder</div></div>
                            </div>
                            {bidTimer!==null&&bidTimer>0&&aState==="live" && (
                              <div className={`bid-ticker${bidTimer<=5?" urgent":""}${bidTimer<=2?" critical":""}`}>
                                <div className="bt-num" style={{color:bidTimer>8?"var(--gr)":bidTimer>4?"var(--yl)":"var(--rd)",fontSize:bidTimer<=3?"1.7rem":"1.35rem"}}>{bidTimer}</div>
                                <div>
                                  <div className="bt-info">{bidTimer<=2?"¡ADJUDICANDO AHORA!":bidTimer<=5?"⚠ Última oportunidad":"Adjudica en"}</div>
                                  <div className="bt-leader">{lastBidder||"—"} lidera · {fmt((bids[idx]?.current||0))}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Place Bid / Adjudicar full-width button */}
                        <button
                          className={`sala-place-bid-btn${aState==="live"?" adj":""}`}
                          onClick={aState==="live" ? adjudicar : startAuction}
                          disabled={aState==="sold"}
                          style={{marginTop:".7rem"}}
                        >
                          {aState==="live" ? "✓ Adjudicar lote" : aState==="sold" ? "Lote adjudicado" : "▶ Iniciar subasta"}
                        </button>
                      </>
                    )}

                    {/* POSTOR TAB */}
                    {ctrlTab==="postor" && (
                      <div className="ba-card" style={{padding:0,background:"transparent",border:"none"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".75rem",padding:".4rem .7rem",background:"var(--s1)",borderRadius:7,border:"1px solid var(--b1)"}}>
                          <div style={{fontSize:".72rem",color:"var(--mu2)"}}>Estado</div>
                          <div style={{fontSize:".78rem",fontWeight:700,color:sColor}}>{sLabel}</div>
                        </div>
                        <div className="bal">Oferta actual</div>
                        <div className={`bap${flash?" flash":""}`}>{fmt(bid.current)}</div>
                        {aState==="live"&&bidTimer!==null&&bidTimer>0
                          ? <BidRing seconds={bidTimer} total={BID_TIMER} nextAmount={bid.current+curInc} increment={curInc}/>
                          : <div className="banl">Proxima puja: <span>{fmt(bid.current+curInc)}</span> · Incremento: <span>{fmtS(curInc)}</span></div>
                        }
                        {aState==="live" && iAmWinning && (
                          <div className="bb-winning">
                            <div className="bw-icon"><div className="bw-check"><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></div></div>
                            <div className="bw-text"><div className="bw-main">Vas ganando</div><div className="bw-sub">Tu oferta de {fmt(bid.current)} es la mas alta</div></div>
                          </div>
                        )}
                        {aState==="live" && lastBidder!==null && !iAmWinning && (
                          <div className="bb-losing">
                            <div className="bl-alert">!</div>
                            <div className="bl-text">
                              <div className="bl-main">Te lo estas perdiendo</div>
                              <div className="bl-sub">Oferta actual: <span>{fmt(bid.current)}</span> — Puja <span>{fmt(bid.current+curInc)}</span> para liderar</div>
                            </div>
                            <button className="bl-action" onClick={placeBid}>Pujar {fmtS(bid.current+curInc)}</button>
                          </div>
                        )}
                        {aState==="live"&&lastBidder===null && <button className="bb" onClick={placeBid}>Pujar {fmt(bid.current+curInc)}</button>}
                        {aState==="waiting" && <button className="bb" disabled>Esperando inicio...</button>}
                        {aState==="paused"  && <button className="bb" disabled>Pausado</button>}
                        {aState==="sold"    && <button className="bb sold" disabled>Adjudicado</button>}
                        {aState==="live" && (
                          <div style={{display:"flex",gap:".5rem",marginTop:".5rem"}}>
                            <input
                              type="text"
                              placeholder="Monto personalizado..."
                              value={postorCustom}
                              onChange={e=>{const v=e.target.value.replace(/\D/g,"");setPostorCustom(v?Number(v).toLocaleString("es-CL"):"")} }
                              onKeyDown={e=>{
                                if(e.key==="Enter"){
                                  const m=parseInt(postorCustom.replace(/\D/g,""));
                                  if(!m||m<=bid.current){notify("El monto debe ser mayor a la oferta actual","inf");return;}
                                  setCurInc(m-bid.current); placeBid(); setPostorCustom("");
                                }
                              }}
                              style={{flex:1,padding:".45rem .7rem",borderRadius:6,border:"1px solid var(--b1)",background:"var(--s2)",color:"var(--tx)",fontSize:".82rem"}}
                            />
                            <button
                              style={{padding:".45rem .9rem",borderRadius:6,background:"var(--ac)",color:"#fff",border:"none",cursor:"pointer",fontWeight:600,fontSize:".82rem"}}
                              onClick={()=>{
                                const m=parseInt(postorCustom.replace(/\D/g,""));
                                if(!m||m<=bid.current){notify("El monto debe ser mayor a la oferta actual","inf");return;}
                                setCurInc(m-bid.current); placeBid(); setPostorCustom("");
                              }}
                            >Pujar</button>
                          </div>
                        )}
                        <div className="bst">
                          <div className="bsc"><div className="bsv">{bid.count}</div><div className="bsl">Pujas totales</div></div>
                          <div className="bsc"><div className="bsv">{fmtS(bid.current-item.base)}</div><div className="bsl">Sobre base</div></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Quick Bid row (increment options) ── */}
                  <div className="sala-quick-bids">
                    {INC_OPTIONS.slice(0,4).map((inc,i) => (
                      <button
                        key={inc}
                        className={`sala-quick-card c${i}`}
                        disabled={aState!=="live"}
                        onClick={()=>{setCurInc(inc); placeBid();}}
                        title={`Pujar con incremento ${fmtS(inc)}`}
                      >
                        <div className="sala-quick-label">Quick Bid</div>
                        <div className="sala-quick-amount">{fmtS(inc)}</div>
                      </button>
                    ))}
                  </div>

                  {/* ── Lotes sidebar (collapsible list) ── */}
                  <div className="ctrl-card" style={{flexShrink:0}}>
                    <div className="ctrl-card-title" style={{marginBottom:".6rem"}}>
                      {lots.length} lotes en remate
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:".3rem",maxHeight:220,overflowY:"auto"}}>
                      {lots.map((it,i) => {
                        const bs=bids[i]; const st=bs?.status==="sold"?"sold":i===idx&&aState==="live"?"live":"wait";
                        return (
                          <div key={it.id} className={`lc${idx===i?" on":""}`} style={{borderRadius:7,display:"flex",alignItems:"center",gap:".55rem",padding:".5rem .7rem"}} onClick={()=>setIdx(i)}>
                            {it.imgs?.[0]
                              ? <img src={it.imgs[0]} alt={it.name} style={{width:36,height:36,borderRadius:5,objectFit:"cover",flexShrink:0,border:"1px solid var(--b2)"}}/>
                              : <div style={{width:36,height:36,borderRadius:5,background:"var(--s3)",border:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:".6rem",color:"var(--mu)"}}>—</div>
                            }
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:".62rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".04em"}}>Lote {String(i+1).padStart(2,"0")}</div>
                              <div style={{fontSize:".76rem",fontWeight:600,color:"var(--wh2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.name}</div>
                            </div>
                            <div className={`lbdg ${st==="live"?"blv":st==="sold"?"bsd":"bwt"}`} style={{flexShrink:0}}>{st==="live"?"En vivo":st==="sold"?"Vendido":"Pdte."}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>{/* end sala-right-col */}
              </div>{/* end sala-body */}
            </div>{/* end sala-wrap-new */}
          </div>
        )}

      </div>

      {/* ══ MODAL IA: Descripción de lote ══ */}
      {aiLoteModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}
          onClick={e=>{ if(e.target===e.currentTarget) setAiLoteModal(false); }}>
          <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:16,width:"100%",maxWidth:520,padding:"1.75rem",position:"relative"}}>
            <button onClick={()=>setAiLoteModal(false)} style={{position:"absolute",top:"1rem",right:"1rem",background:"transparent",border:"none",color:"var(--mu)",fontSize:"1.2rem",cursor:"pointer",lineHeight:1}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:"1.25rem"}}>
              <span style={{fontSize:"1.3rem"}}>✨</span>
              <div>
                <div style={{fontFamily:"Poppins,sans-serif",fontWeight:800,fontSize:"1rem",color:"var(--wh)"}}>Describir lote con IA</div>
                <div style={{fontSize:".72rem",color:"var(--mu)"}}>Sube una foto y la IA genera título y descripción automáticamente</div>
              </div>
            </div>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:".7rem",fontWeight:600,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".4rem"}}>Foto del lote (opcional)</label>
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:".5rem",padding:"1.25rem",background:"var(--s1)",border:`2px dashed ${aiLoteImg?"var(--ac)":"var(--b2)"}`,borderRadius:10,cursor:"pointer",transition:"border-color .2s"}}>
                {aiLoteImg
                  ? <img src={aiLoteImg.preview} alt="preview" style={{maxHeight:120,maxWidth:"100%",borderRadius:8,objectFit:"contain"}}/>
                  : <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      <span style={{fontSize:".75rem",color:"var(--mu)"}}>Haz clic para subir imagen</span>
                    </>
                }
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                  const file = e.target.files?.[0];
                  if(!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const base64 = ev.target.result.split(",")[1];
                    setAiLoteImg({ base64, mediaType: file.type, preview: ev.target.result });
                  };
                  reader.readAsDataURL(file);
                }}/>
              </label>
              {aiLoteImg && <button onClick={()=>setAiLoteImg(null)} style={{marginTop:".4rem",fontSize:".68rem",color:"var(--mu)",background:"transparent",border:"none",cursor:"pointer"}}>× Quitar imagen</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".75rem",marginBottom:"1.25rem"}}>
              <div>
                <label style={{display:"block",fontSize:".7rem",fontWeight:600,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".35rem"}}>Nombre del artículo</label>
                <input value={aiLoteName} onChange={e=>setAiLoteName(e.target.value)} placeholder="Ej: Toyota Hilux 2018" style={{width:"100%",background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:7,color:"var(--wh2)",fontSize:".82rem",padding:".6rem .8rem",outline:"none"}}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:".7rem",fontWeight:600,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".35rem"}}>Categoría</label>
                <select value={aiLoteCat} onChange={e=>setAiLoteCat(e.target.value)} style={{width:"100%",background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:7,color:"var(--wh2)",fontSize:".82rem",padding:".6rem .8rem",outline:"none"}}>
                  <option value="">Sin especificar</option>
                  <option>Vehículo</option><option>Maquinaria</option><option>Inmueble</option>
                  <option>Enseres</option><option>Electrodomésticos</option><option>Herramientas</option><option>Otro</option>
                </select>
              </div>
            </div>
            {aiLoteResult && (
              <div style={{marginBottom:"1.25rem",padding:"1rem",background:"rgba(6,182,212,.06)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10}}>
                <div style={{fontSize:".68rem",fontWeight:700,color:"var(--ac)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".5rem"}}>Resultado generado</div>
                <div style={{fontWeight:700,color:"var(--wh)",marginBottom:".35rem",fontSize:".9rem"}}>{aiLoteResult.titulo}</div>
                <div style={{fontSize:".8rem",color:"var(--mu2)",lineHeight:1.6}}>{aiLoteResult.descripcion}</div>
                <button onClick={()=>{ navigator.clipboard.writeText(`${aiLoteResult.titulo}\n\n${aiLoteResult.descripcion}`); notify("Copiado al portapapeles","sold"); }}
                  style={{marginTop:".75rem",fontSize:".7rem",padding:".35rem .8rem",background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.3)",borderRadius:6,color:"var(--ac)",fontWeight:600,cursor:"pointer"}}>
                  Copiar texto
                </button>
              </div>
            )}
            <button disabled={aiLoteLoading||(!aiLoteImg&&!aiLoteName)} style={{width:"100%",padding:".8rem",background:aiLoteLoading||(!aiLoteImg&&!aiLoteName)?"var(--s3)":"var(--ac)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:".88rem",cursor:aiLoteLoading||(!aiLoteImg&&!aiLoteName)?"not-allowed":"pointer",transition:"background .2s"}}
              onClick={async()=>{
                setAiLoteLoading(true); setAiLoteResult(null);
                try {
                  const res = await fetch("/api/ai/describe-lot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageBase64:aiLoteImg?.base64,mediaType:aiLoteImg?.mediaType,name:aiLoteName,category:aiLoteCat})});
                  const data = await res.json();
                  if(data.error) throw new Error(data.error);
                  setAiLoteResult(data);
                } catch(e){ notify("Error al generar: "+e.message,"inf"); }
                finally{ setAiLoteLoading(false); }
              }}>
              {aiLoteLoading ? "Generando descripción…" : "✨ Generar con IA"}
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL IA: Resumen post-remate ══ */}
      {aiRemateModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}
          onClick={e=>{ if(e.target===e.currentTarget){ setAiRemateModal(null); setAiRemateResult(null); } }}>
          <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:16,width:"100%",maxWidth:560,padding:"1.75rem",position:"relative"}}>
            <button onClick={()=>{ setAiRemateModal(null); setAiRemateResult(null); }} style={{position:"absolute",top:"1rem",right:"1rem",background:"transparent",border:"none",color:"var(--mu)",fontSize:"1.2rem",cursor:"pointer",lineHeight:1}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:"1.25rem"}}>
              <span style={{fontSize:"1.3rem"}}>✨</span>
              <div>
                <div style={{fontFamily:"Poppins,sans-serif",fontWeight:800,fontSize:"1rem",color:"var(--wh)"}}>Resumen ejecutivo IA</div>
                <div style={{fontSize:".72rem",color:"var(--mu)"}}>{aiRemateModal.name} — {aiRemateModal.fecha}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".6rem",marginBottom:"1.25rem"}}>
              {[
                {label:"Modalidad",val:aiRemateModal.modal},
                {label:"Lotes",val:aiRemateModal.lotes},
                {label:"Recaudado",val:aiRemateModal.recaudado?`$${(aiRemateModal.recaudado/1000000).toFixed(1)}M`:"N/D"},
              ].map(item=>(
                <div key={item.label} style={{padding:".65rem .8rem",background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:8,textAlign:"center"}}>
                  <div style={{fontSize:".62rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".2rem"}}>{item.label}</div>
                  <div style={{fontWeight:700,color:"var(--wh2)",fontSize:".88rem"}}>{item.val}</div>
                </div>
              ))}
            </div>
            {aiRemateResult && (
              <div style={{marginBottom:"1.25rem"}}>
                <div style={{padding:"1rem",background:"rgba(6,182,212,.06)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10,marginBottom:".75rem"}}>
                  <div style={{fontSize:".68rem",fontWeight:700,color:"var(--ac)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".5rem"}}>Resumen</div>
                  <div style={{fontSize:".82rem",color:"var(--mu2)",lineHeight:1.65}}>{aiRemateResult.resumen}</div>
                </div>
                <div style={{padding:"1rem",background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:10,marginBottom:".75rem"}}>
                  <div style={{fontSize:".68rem",fontWeight:700,color:"var(--gr)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".6rem"}}>Puntos destacados</div>
                  {aiRemateResult.destacados?.map((d,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:".5rem",marginBottom:".4rem",fontSize:".8rem",color:"var(--mu2)"}}>
                      <span style={{color:"var(--ac)",fontWeight:700,flexShrink:0}}>·</span>{d}
                    </div>
                  ))}
                </div>
                <div style={{padding:".8rem 1rem",background:"rgba(20,184,166,.06)",border:"1px solid rgba(20,184,166,.2)",borderRadius:8,fontSize:".8rem",color:"var(--gr)",fontStyle:"italic",lineHeight:1.55}}>
                  {aiRemateResult.conclusion}
                </div>
                <button onClick={()=>{
                  const txt = `RESUMEN — ${aiRemateModal.name}\n\n${aiRemateResult.resumen}\n\nPUNTOS DESTACADOS\n${aiRemateResult.destacados?.map(d=>`• ${d}`).join("\n")}\n\n${aiRemateResult.conclusion}`;
                  navigator.clipboard.writeText(txt); notify("Resumen copiado","sold");
                }} style={{marginTop:".75rem",fontSize:".7rem",padding:".35rem .8rem",background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.3)",borderRadius:6,color:"var(--ac)",fontWeight:600,cursor:"pointer"}}>
                  Copiar resumen
                </button>
              </div>
            )}
            {!aiRemateResult && (
              <button disabled={aiRemateLoading} style={{width:"100%",padding:".8rem",background:aiRemateLoading?"var(--s3)":"var(--ac)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:".88rem",cursor:aiRemateLoading?"not-allowed":"pointer"}}
                onClick={async()=>{
                  setAiRemateLoading(true);
                  try {
                    const res = await fetch("/api/ai/remate-summary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({remate:aiRemateModal})});
                    const data = await res.json();
                    if(data.error) throw new Error(data.error);
                    setAiRemateResult(data);
                  } catch(e){ notify("Error al generar: "+e.message,"inf"); }
                  finally{ setAiRemateLoading(false); }
                }}>
                {aiRemateLoading ? "Generando resumen…" : "✨ Generar resumen ejecutivo"}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
