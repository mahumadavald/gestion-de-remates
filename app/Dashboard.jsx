'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client ───────────────────────────────────────────────
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;


// ── BRAND ─────────────────────────────────────────────────────────
const PeckerLogo = ({ collapsed = false }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 3C9.716 3 3 9.716 3 18s6.716 15 15 15 15-6.716 15-15S26.284 3 18 3z" fill="none"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    </svg>
    {!collapsed && (
      <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:".88rem", color:"#fff", letterSpacing:".02em" }}>
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

// Quick bids inteligentes según precio base del lote
const getSmartIncs = (base = 0) => {
  if (base >= 10000000) return [500000,1000000,2000000,5000000];
  if (base >= 5000000)  return [200000,500000,1000000,2000000,5000000];
  if (base >= 2000000)  return [100000,200000,500000,1000000,2000000];
  if (base >= 1000000)  return [100000,200000,500000,1000000];
  if (base >= 500000)   return [50000,100000,200000,500000,1000000];
  if (base >= 100000)   return [10000,20000,50000,100000,200000];
  return [5000,10000,20000,50000,100000];
};
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
  Documento generado por Pecker · ${new Date().toLocaleDateString("es-CL")} · pecker.cl
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
.sidebar{width:240px;background:linear-gradient(180deg,#0e7490 0%,#06B6D4 60%,#14B8A6 100%);border-right:none;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;}
.sb-logo{padding:1.2rem 1.3rem 1.1rem;border-bottom:1px solid rgba(255,255,255,.15);display:flex;align-items:center;}
.sb-section{padding:.9rem 1.3rem .3rem;font-size:.62rem;font-weight:700;letter-spacing:.1em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.sb-item{display:flex;align-items:center;gap:.7rem;padding:.55rem 1rem;margin:.06rem .7rem;border-radius:9px;cursor:pointer;transition:all .18s cubic-bezier(.34,1.56,.64,1);color:rgba(255,255,255,.8);font-size:.82rem;font-weight:500;}
.sb-item:hover{background:rgba(255,255,255,.18);color:#fff;transform:scale(1.03);box-shadow:0 2px 10px rgba(0,0,0,.12);}
.sb-item.on{background:rgba(255,255,255,.25);color:#fff;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.12);}
.sb-item.on .sb-icon{opacity:1;}
.sb-icon{width:17px;text-align:center;flex-shrink:0;opacity:.7;color:#fff;}
.sb-badge{margin-left:auto;background:rgba(255,255,255,.9);color:#0e7490;font-size:.58rem;padding:.1rem .42rem;border-radius:10px;font-weight:700;}
.sb-footer{margin-top:auto;padding:.9rem 1rem;border-top:1px solid rgba(255,255,255,.15);}
.sb-user{display:flex;align-items:center;gap:.65rem;}
.sb-ava{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#fff;flex-shrink:0;}
.sb-uname{font-size:.78rem;font-weight:600;color:#fff;line-height:1.25;}
.sb-urole{font-size:.65rem;color:rgba(255,255,255,.65);}

/* ── MAIN ── */
.main-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 1.6rem;height:52px;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0;flex-wrap:nowrap;overflow:hidden;}
.topbar-left{display:flex;align-items:center;gap:.8rem;flex:1;min-width:0;overflow:hidden;}
.topbar-title{font-size:1.18rem;font-weight:800;color:var(--wh);letter-spacing:-.01em;}
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
.sala-body{display:grid;grid-template-columns:1fr 360px;gap:1rem;padding:.85rem 1.1rem;flex:1;overflow:hidden;min-height:0;}

/* Left card */
.sala-left-card{background:var(--s2);border:1px solid var(--b1);border-radius:14px;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
.sala-live-badge{display:inline-flex;align-items:center;gap:.35rem;padding:.22rem .65rem;background:rgba(20,184,166,.15);color:var(--gr);border-radius:20px;font-size:.68rem;font-weight:700;letter-spacing:.04em;margin:.6rem auto 0;width:fit-content;}
.sala-lot-title{font-size:1rem;font-weight:800;color:var(--wh);text-align:center;padding:.35rem 1.1rem .2rem;line-height:1.2;}
/* Foto + cámara: flex:1 para llenar el espacio disponible */
.sala-photo-wrap{position:relative;background:var(--s3);margin:.3rem .75rem;border-radius:10px;overflow:hidden;flex:1;min-height:300px;display:flex;gap:0;}
.sala-photo-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.sala-photo-placeholder{width:100%;height:100%;min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;}
/* Foto principal */
.sala-photo-main{flex:1;position:relative;overflow:hidden;min-width:0;}
.sala-photo-main img{width:100%;height:100%;object-fit:cover;display:block;}
/* Cámara lateral martillero — pequeña, 20% del ancho */
.sala-cam-side{width:20%;flex-shrink:0;background:#000;position:relative;border-left:2px solid var(--s3);border-radius:0 10px 10px 0;}
.sala-cam-side video{width:100%;height:100%;object-fit:cover;display:block;}
.sala-cam-side-label{position:absolute;top:5px;left:5px;background:rgba(0,0,0,.6);border-radius:4px;padding:.12rem .4rem;font-size:.58rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:3px;}
.sala-cam-rec{width:5px;height:5px;border-radius:50%;background:var(--rd);animation:pulse 1s infinite;}
/* Timer compacto */
.sala-timer{display:flex;align-items:center;justify-content:space-between;padding:.4rem 1rem .45rem;border-top:1px solid var(--b1);margin-top:.25rem;background:rgba(0,0,0,.04);flex-shrink:0;}
/* Lotes próximos — ultra compacto */
.sala-lotes-proximos{padding:.6rem .85rem .75rem;border-top:1px solid var(--b1);flex-shrink:0;}
.sala-lotes-proximos-title{font-size:.75rem;font-weight:700;color:var(--wh2);margin-bottom:.5rem;letter-spacing:.01em;}
.sala-lotes-proximos-list{display:flex;flex-direction:column;gap:.32rem;max-height:180px;overflow-y:auto;}
.sala-lotes-proximos-list::-webkit-scrollbar{width:3px;}
.sala-lotes-proximos-list::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px;}
.sala-lote-mini{display:flex;align-items:center;gap:.6rem;padding:.42rem .6rem;border-radius:8px;background:var(--s1);border:1px solid var(--b1);transition:all .15s;}
.sala-lote-mini:hover{border-color:rgba(6,182,212,.25);background:rgba(6,182,212,.04);}
.sala-lote-mini.current{background:rgba(6,182,212,.08);border-color:rgba(6,182,212,.3);}
.sala-lote-mini.adj{opacity:.45;}
.sala-lote-mini-img{width:34px;height:34px;border-radius:5px;object-fit:cover;flex-shrink:0;}
.sala-lote-mini-noimg{width:34px;height:34px;border-radius:5px;background:var(--s3);display:flex;align-items:center;justify-content:center;color:var(--mu);flex-shrink:0;}
.sala-lote-mini-info{flex:1;min-width:0;display:flex;align-items:center;gap:.45rem;}
.sala-lote-mini-num{font-size:.65rem;color:var(--mu);font-weight:700;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;flex-shrink:0;}
.sala-lote-mini-name{font-size:.8rem;font-weight:600;color:var(--wh2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sala-lote-mini-status{flex-shrink:0;}
.sala-timer span:first-child{font-size:.68rem;font-weight:600;color:var(--mu2);}
.sala-timer-num{font-size:1.3rem;font-weight:800;letter-spacing:.04em;font-family:'Inter',monospace;}
.sala-timer-num.urgent{color:var(--yl);}
.sala-timer-num.critical{color:var(--rd);animation:losepulse .5s infinite;}
.sala-timer-num.safe{color:var(--gr);}

/* Right column */
.sala-right-col{display:flex;flex-direction:column;gap:.85rem;overflow-y:auto;min-height:0;}

/* Bid card */
.sala-bid-card{background:var(--s2);border:1px solid var(--b1);border-radius:14px;padding:1.1rem;flex:1;display:flex;flex-direction:column;min-height:0;}
.sala-bid-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.85rem;}
.sala-bid-label{font-size:.65rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem;}
.sala-bid-amount{font-size:2.1rem;font-weight:800;color:var(--ac);line-height:1;letter-spacing:-.02em;transition:color .2s;}
.sala-bid-amount.flash{color:var(--acH);text-shadow:0 0 18px rgba(56,178,246,.45);}
.sala-livefeed-btn{display:flex;align-items:center;gap:.35rem;padding:.32rem .7rem;background:rgba(56,178,246,.1);border:1px solid rgba(56,178,246,.25);border-radius:7px;color:var(--ac);font-size:.68rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.sala-livefeed-btn:hover{background:rgba(56,178,246,.18);}
.sala-last-bids-title{font-size:.63rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;}
.sala-last-bids{display:flex;flex-direction:column;gap:.35rem;flex:1;min-height:80px;max-height:260px;overflow-y:auto;margin-bottom:.85rem;}
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
.sala-quick-bids{display:grid;grid-template-columns:repeat(5,1fr);gap:.45rem;flex-shrink:0;}
.sala-quick-card{border-radius:10px;padding:.7rem .6rem;display:flex;flex-direction:column;align-items:center;gap:.22rem;cursor:pointer;transition:all .15s;border:1px solid var(--b1);background:var(--s2);position:relative;overflow:hidden;}
.sala-quick-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;}
.sala-quick-card.c0::after{background:var(--ac);}
.sala-quick-card.c1::after{background:var(--yl);}
.sala-quick-card.c2::after{background:#a78bfa;}
.sala-quick-card.c3::after{background:var(--mu);}
.sala-quick-card.c4::after{background:var(--gr);}
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
.bb{width:100%;padding:1.1rem 1rem;background:var(--ac);border:none;border-radius:10px;font-size:1.15rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;letter-spacing:.01em;}
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
.inc-ctrl{background:rgba(56,178,246,.05);border:1px solid rgba(56,178,246,.15);border-radius:8px;padding:.85rem;margin-bottom:.7rem;display:flex;flex-direction:column;height:100%;box-sizing:border-box;}
.inc-title{font-size:.65rem;font-weight:700;color:var(--ac);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;}
.inc-cur-lbl{font-size:.64rem;font-weight:500;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.18rem;}
.inc-cur{font-size:1.4rem;font-weight:800;color:var(--wh);letter-spacing:-.01em;margin-bottom:.45rem;}
.inc-btns{display:grid;grid-template-columns:repeat(5,1fr);gap:.3rem;flex:1;}
.inc-btn{padding:0;border-radius:7px;border:1px solid var(--b1);background:transparent;font-size:.72rem;font-weight:500;color:var(--mu);cursor:pointer;transition:all .15s;width:100%;height:100%;min-height:2rem;}
.inc-btn:hover{border-color:var(--ac);color:var(--ac);background:rgba(56,178,246,.05);}
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
  .topbar-title{font-size:1rem;}
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
  .sala-body{grid-template-columns:1fr;overflow:visible;padding:.6rem;}
  .sala-left-card{min-height:420px;}
  .sala-photo-wrap{min-height:280px;max-height:340px;flex:none;height:300px;}
  .sala-cam-side{width:26%;}
  .sala-cam-side{display:none;}
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
  { id:"u1", email:"admin@pecker.cl",           password:"admin2026",      role:"admin",      name:"Max Ahumada",        casa:null,            casaNombre:"Pecker" },
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
    background: #f4f6f9;
    display: flex;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Left branding panel — mismo gradiente turquesa que sidebar y participar */
  .auth-left {
    flex: 0 0 48%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem 4.5rem;
    position: relative;
    z-index: 1;
    background: linear-gradient(160deg, #0e7490 0%, #06B6D4 60%, #14B8A6 100%);
    overflow: hidden;
  }
  /* Orbs decorativos en el panel izquierdo */
  .auth-left::before {
    content: '';
    position: absolute;
    width: 420px; height: 420px;
    background: radial-gradient(circle, rgba(255,255,255,.12) 0%, transparent 70%);
    top: -120px; right: -120px;
    border-radius: 50%;
    pointer-events: none;
  }
  .auth-left::after {
    content: '';
    position: absolute;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 70%);
    bottom: -80px; left: -60px;
    border-radius: 50%;
    pointer-events: none;
  }

  .auth-brand-title {
    font-family: 'Poppins', sans-serif;
    font-size: 2.8rem;
    font-weight: 800;
    color: #fff;
    line-height: 1.05;
    letter-spacing: -.03em;
    margin-bottom: .65rem;
    position: relative;
  }
  .auth-brand-sub {
    font-size: .98rem;
    color: rgba(255,255,255,.78);
    font-weight: 400;
    margin-bottom: 3rem;
    line-height: 1.55;
    position: relative;
  }

  .auth-features { display: flex; flex-direction: column; gap: .6rem; position: relative; }
  .auth-feat {
    display: flex; align-items: center; gap: .75rem;
    padding: .65rem .9rem;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 10px;
    font-size: .82rem; color: rgba(255,255,255,.9);
    backdrop-filter: blur(4px);
    transition: background .2s;
  }
  .auth-feat:hover { background: rgba(255,255,255,.2); }
  .auth-feat-icon { color: #fff; flex-shrink: 0; opacity: .9; }
  .auth-feat strong { color: #fff; font-weight: 700; }

  /* Right form panel */
  .auth-right {
    flex: 0 0 52%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 3rem 2.5rem;
    position: relative;
    z-index: 1;
    background: #f4f6f9;
  }

  .auth-form-wrap {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 20px;
    padding: 2.5rem 2.25rem;
    box-shadow: 0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
    animation: slideUp .35s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

  .auth-form-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: .3rem;
  }
  .auth-form-sub { font-size: .8rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.5; }

  /* Form fields */
  .auth-field { margin-bottom: 1.1rem; }
  .auth-label { display: block; font-size: .7rem; font-weight: 600; color: #6b7280; letter-spacing: .05em; text-transform: uppercase; margin-bottom: .45rem; }
  .auth-input {
    width: 100%;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    color: #1a1a1a;
    font-size: .88rem;
    font-family: 'Inter', sans-serif;
    padding: .78rem 1rem;
    transition: all .18s;
    outline: none;
  }
  .auth-input:focus { border-color: #06B6D4; background: #fff; box-shadow: 0 0 0 3px rgba(6,182,212,.1); }
  .auth-input::placeholder { color: #9ca3af; }
  .auth-input.mono { font-family: 'Inter', sans-serif; font-size: .95rem; letter-spacing: .12em; text-transform: uppercase; }
  .auth-input.error { border-color: #e05252; background: rgba(224,82,82,.04); }

  .auth-error {
    padding: .65rem .9rem;
    background: rgba(224,82,82,.07);
    border: 1px solid rgba(224,82,82,.22);
    border-radius: 8px;
    font-size: .77rem;
    color: #dc2626;
    margin-bottom: 1.1rem;
    animation: shake .3s ease;
  }
  @keyframes shake { 0%,100%{transform:none} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

  .auth-submit {
    width: 100%;
    padding: .88rem;
    background: linear-gradient(135deg, #0e7490 0%, #06B6D4 60%, #14B8A6 100%);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: .9rem;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all .18s;
    margin-top: .4rem;
    letter-spacing: .01em;
  }
  .auth-submit:hover { opacity: .92; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(6,182,212,.35); }
  .auth-submit:active { transform: none; box-shadow: none; }
  .auth-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  .auth-hint {
    margin-top: 1.5rem;
    padding: .75rem .9rem;
    background: rgba(6,182,212,.05);
    border: 1px solid rgba(6,182,212,.15);
    border-radius: 8px;
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
    color: #0e7490;
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
    .auth-root { flex-direction: column; overflow: auto; }
    .auth-left { display: none; }
    .auth-right { flex: 1; width: 100%; max-width: 100%; border-left: none; overflow-y: auto; height: auto; min-height: 100vh; padding: 2.5rem 1.25rem; background: linear-gradient(160deg,#0e7490 0%,#06B6D4 60%,#14B8A6 100%); align-items: center; justify-content: center; }
    .auth-form-wrap { border-radius: 16px; padding: 2rem 1.5rem; }
  }
`;

function AuthScreen({ onLogin }) {
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [forgotMode,     setForgotMode]     = useState(false);
  const [forgotEmail,    setForgotEmail]    = useState("");
  const [forgotSent,     setForgotSent]     = useState(false);
  const [turnstileOk,    setTurnstileOk]    = useState(false);

  // Carga el script de Cloudflare Turnstile
  useEffect(() => {
    window.__turnstileCb = () => setTurnstileOk(true);
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : "" },
    });
    if (e) { setError(e.message); setLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { setError("Ingresa tu correo."); return; }
    setLoading(true); setError("");
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: "https://pecker.cl/reset-password",
    });
    setForgotSent(true);
    setLoading(false);
  };

  const handleLogin = async () => {
    setError(""); setLoading(true);
    if (!supabase) { setError("Error de configuración. Contacta al administrador."); setLoading(false); return; }
    try {
      {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authErr) { setError("Credenciales incorrectas."); setLoading(false); return; }
        // Buscar perfil — con fallback si no existe en tabla usuarios
        let sessionData = { id:data.user.id, email:data.user.email, name:"Admin", role:"admin", roles:["admin"], casa:null, casaNombre:"Pecker", activo:true };
        try {
          const { data: perfil } = await supabase
            .from("usuarios")
            .select("*, casas(id, slug, nombre, licencia_estado, licencia_vence, licencia_plan)")
            .eq("id", data.user.id)
            .single();
          if (perfil) {
            const r = Array.isArray(perfil.roles) && perfil.roles.length > 0 ? perfil.roles[0] : "admin";
            if (!perfil.activo) { setError("Usuario inactivo. Contacta al administrador."); await supabase.auth.signOut(); setLoading(false); return; }
            // ── Verificar licencia (solo para no-admin Pecker) ──
            if (perfil.casas && r !== "admin") {
              const lic = perfil.casas.licencia_estado;
              const vence = perfil.casas.licencia_vence ? new Date(perfil.casas.licencia_vence) : null;
              const vencida = vence && vence < new Date();
              if (lic === "bloqueado") {
                setError("Acceso bloqueado. Contacta a Pecker: contacto@pecker.cl");
                await supabase.auth.signOut(); setLoading(false); return;
              }
              if (lic === "suspendido" || vencida) {
                setError("Tu licencia está suspendida o venció. Contacta a Pecker para renovar.");
                await supabase.auth.signOut(); setLoading(false); return;
              }
            }
            sessionData = {
              id: data.user.id, email: data.user.email, name: perfil.nombre, role: r,
              roles: perfil.roles||[r], casa: perfil.casas?.slug||null,
              casaId: perfil.casas?.id||null,
              casaNombre: perfil.casas?.nombre||"Pecker",
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
      setError("Error de conexión: " + (e?.message || "Intenta nuevamente."));
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{AUTH_CSS}</style>

      {/* Left branding — gradiente turquesa */}
      <div className="auth-left">
        {/* Logo blanco */}
        <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"2.2rem",position:"relative"}}>
          <svg width="52" height="52" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
            <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M4 12 Q4 5 12 5 L20 5" stroke="rgba(255,255,255,.6)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:"1.2rem",color:"#fff",letterSpacing:".01em"}}>Pecker</div>
        </div>

        <div className="auth-brand-title">La plataforma<br/>de remates<br/>en Chile.</div>
        <div className="auth-brand-sub">Sala en vivo híbrida, liquidaciones automáticas y gestión completa para tu casa de remates.</div>
        <div className="auth-features">
          {[
            ["Sala en vivo híbrida", "Presencial y online en un solo sistema"],
            ["Liquidaciones automáticas", "Se generan al instante al adjudicar"],
            ["Gestión de garantías", "Registro, aprobación y devolución"],
            ["Multi-empresa", "Cada casa de remates con su acceso"],
          ].map(([t,d]) => (
            <div className="auth-feat" key={t}>
              <svg className="auth-feat-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5l4 4 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span><strong>{t}</strong> — {d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form — card blanca sobre fondo gris suave */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {/* Logo pequeño en el card */}
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"1.6rem"}}>
            <svg width="38" height="38" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="rgba(6,182,212,.1)" stroke="rgba(6,182,212,.22)" strokeWidth="1"/>
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#06B6D4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="#0e7490" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            </svg>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#06B6D4",letterSpacing:".01em"}}>Pecker</div>
              <div style={{fontSize:".7rem",color:"#9ca3af",letterSpacing:".04em",textTransform:"uppercase",marginTop:1}}>Auction Software</div>
            </div>
          </div>
          <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:"1.3rem",color:"#1a1a1a",marginBottom:".3rem"}}>Iniciar sesión</div>
          <div style={{fontSize:".82rem",color:"#6b7280",marginBottom:"1.8rem",lineHeight:1.5}}>Ingresa con tu correo y contraseña.</div>

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

          {/* Cloudflare Turnstile */}
          <div style={{margin:".75rem 0"}}
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000BB"}
            data-callback="__turnstileCb"
            data-theme="light"
          />

          <button className="auth-submit" onClick={handleLogin} disabled={loading}>
            {loading ? "Verificando..." : "Iniciar sesión"}
          </button>

          {/* Divisor */}
          <div style={{display:"flex",alignItems:"center",gap:".75rem",margin:"1rem 0"}}>
            <div style={{flex:1,height:1,background:"#e5e7eb"}}/>
            <span style={{fontSize:".75rem",color:"#9ca3af",fontWeight:500}}>o</span>
            <div style={{flex:1,height:1,background:"#e5e7eb"}}/>
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogleLogin} disabled={loading}
            style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:".65rem",padding:".8rem",border:"1.5px solid #e5e7eb",borderRadius:8,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:".88rem",fontWeight:600,color:"#374151",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#f9fafb";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.background="#fff";}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
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
          <PeckerLogo/>
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
          <PeckerLogo/>
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

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") { setSession(null); }
    });

    const url = typeof window !== "undefined" ? window.location.href : "";
    const isOAuthRedirect = url.includes("code=") || url.includes("access_token=");

    if (isOAuthRedirect) {
      // Viene del redirect de Google — detectar sesión OAuth
      supabase.auth.getSession().then(async ({ data: { session: s } }) => {
        if (s?.user) {
          const perfil = await fetchPerfil(s.user.id);
          setSession(perfil);
        }
        setLoading(false);
      });
    } else {
      // Carga normal — siempre pedir login
      supabase.auth.signOut().then(() => setLoading(false));
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (uid) => {
    try {
      // Usuarios de Google → siempre rol postor (cliente), sin excepción
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const isGoogle = authUser?.app_metadata?.provider === "google" ||
                       authUser?.identities?.some(i => i.provider === "google");
      if (isGoogle) {
        return {
          id:         uid,
          email:      authUser.email,
          name:       authUser.user_metadata?.full_name || authUser.email,
          role:       "postor",
          roles:      ["postor"],
          casa:       null,
          casaNombre: "",
          activo:     true,
        };
      }

      const { data } = await supabase
        .from("usuarios")
        .select("*, casas(slug, nombre)")
        .eq("id", uid)
        .single();
      if (!data) return { id:uid, name:"Admin", role:"admin", casa:null, casaNombre:"Pecker", activo:true };
      const role = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles[0] : "martillero";
      return {
        id:         uid,
        name:       data.nombre,
        role:       role,
        roles:      data.roles || [],
        casa:       data.casas?.slug   || null,
        casaNombre: data.casas?.nombre || "Pecker",
        activo:     data.activo,
      };
    } catch(e) {
      return { id:uid, name:"Admin", role:"admin", casa:null, casaNombre:"Pecker", activo:true };
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
  const [importModal,  setImportModal]  = useState(false); // modal importar excel
  const [importRows,   setImportRows]   = useState([]);    // filas parseadas
  const [importSaving, setImportSaving] = useState(false);
  const [importDone,   setImportDone]   = useState(null);  // {ok, errors}
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

  // ── Usuarios (solo admin) ──
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

  // ── Licencias (solo admin) ──
  const [dbLicencias, setDbLicencias] = useState([]);
  // ── Casas (solo admin) ──
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
    casaSlug:   r.casas?.slug || "",
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
  const camStreamRef       = React.useRef(null);   // stream webcam (preview)
  const screenStreamRef    = React.useRef(null);   // stream pantalla (grabación)
  const mediaRecorderRef   = React.useRef(null);
  const recordedChunksRef  = React.useRef([]);
  const [camActiva,   setCamActiva]   = useState(false);
  const [camError,    setCamError]    = useState(null);
  const [grabando,    setGrabando]    = useState(false);

  // Fix live preview: asignar srcObject después de que el <video> esté en el DOM
  React.useEffect(() => {
    if (camActiva && videoRef.current && camStreamRef.current) {
      videoRef.current.srcObject = camStreamRef.current;
    }
  }, [camActiva]);
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
  const [selectedBalanceRemate, setSelectedBalanceRemate] = useState("all");
  const [statsView,  setStatsView]  = useState("mes");
  const [statsAnio,  setStatsAnio]  = useState(new Date().getFullYear());
  const [statsMes,   setStatsMes]   = useState(new Date().getMonth());
  const [adjCountdown,    setAdjCountdown]    = useState(null); // countdown auto-avance

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

  // adjCountdown: se activa al adjudicar — avance MANUAL por el martillero
  const avanzarSiguienteLote = () => {
    setAdjCountdown(null);
    setIdx(prev => {
      const next = prev + 1;
      if (next < lots.length) {
        setAState("waiting"); setBidTimer(null); setLastBidder(null);
        setCurInc(lots[next]?.inc||100000); setCustomMonto(""); setPhotoIdx(0);
        notify(`Lote ${next+1} — ${lots[next]?.name}`, "inf");
        return next;
      } else {
        notify("Último lote adjudicado — remate finalizado", "ok");
        return prev;
      }
    });
  };

  const revertirAdjudicacion = () => {
    setBids(p => { const n=[...p]; n[idx]={...n[idx], status:"live", winner: n[idx].history?.[0]?.bidder||null}; return n; });
    setAState("live"); setBidTimer(BID_TIMER);
    setAdjCountdown(null);
    // Eliminar la liquidación auto-creada para este lote
    setLiquidaciones(p => p.filter(l => !(l.lote===lots[idx]?.name && l.id.startsWith("LIQ-"))));
    notify("Adjudicación revertida — lote en vivo nuevamente", "inf");
  };

  // ── Supabase: carga inicial ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      setDbLoading(true);
      try {
        const timeout = new Promise((_,rej) => setTimeout(()=>rej(new Error("timeout")), 5000));
        const fetches = Promise.all([
          supabase.from("remates").select("*, casas(slug)").order("created_at", {ascending:false}),
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

  const placeBid = (overrideInc) => {
    const inc = overrideInc ?? curInc;
    const amt = (bids[idx]?.current||0) + inc;
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
    // Mostrar panel de control manual — el martillero decide cuándo avanzar
    setAdjCountdown(true);

    if (winner) {
      // Liquidación automática — comisión según tipo + gastos admin si motorizado
      const gar     = 300000;
      const com     = Math.round(monto * (comPct / 100));
      const saldo   = Math.max(0, monto - gar);
      const totalAPagar = saldo + com + gastosAdm;
      const remateActivo = REMATES_MERGED.find(r=>(r.supabaseId||r.id)===salaRemateId);
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
        fechaISO: new Date().toISOString(),
        remateId: salaRemateId||null,
        remateNombre: remateActivo?.name||"Sin remate",
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

  // ── Cámara en vivo martillero (solo preview, sin grabar) ──
  const activarCamara = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      camStreamRef.current = stream;
      setCamActiva(true);
      // srcObject se asigna via useEffect (el <video> puede no estar en DOM aún)
    } catch(e) {
      setCamError("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
    }
  };

  const detenerCamara = () => {
    if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => t.stop());
    camStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamActiva(false);
  };

  // ── Grabación de pantalla completa (se inicia al Iniciar el remate) ──
  const iniciarGrabacionPantalla = async () => {
    if (grabando) return;
    try {
      // Captura toda la pestaña incluyendo las pujas — para transparencia
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "browser", displaySurface: "browser" },
        audio: true,
        preferCurrentTab: true,
      });
      screenStreamRef.current = screenStream;
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus" : "video/webm";
      const mr = new MediaRecorder(screenStream, { mimeType });
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setGrabando(true);
      // Si el usuario detiene el share desde el navegador, parar grabación
      screenStream.getVideoTracks()[0].onended = () => {
        setGrabando(false);
        screenStreamRef.current = null;
      };
    } catch(e) {
      // Usuario canceló o navegador no soporta — continuar sin grabación
      console.log("Grabación de pantalla cancelada:", e.message);
    }
  };

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
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
    setGrabando(false);
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

  const startAuction  = () => {
    setAState("live"); setBidTimer(null); setLastBidder(null);
    // Iniciar grabación de pantalla completa automáticamente al arrancar el remate
    iniciarGrabacionPantalla();
  };
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

  // ── Import Excel: descargar plantilla ──
  const descargarPlantillaExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [
      "Nombre del artículo *","Expediente / N° causa","Mandante",
      "Categoría (Vehículo / Inmueble / Muebles / Enseres)",
      "Año","Patente (si es vehículo)","Precio base *",
      "Precio mínimo","Incremento mínimo",
      "Comisión % (vacío = judicial 10% / concursal 7%)",
      "Tipo de remate (judicial / concursal / privado)","Descripción"
    ];
    const ejemplo = [
      "Suzuki Baleno GLX HB 1.4 AUT Siniestrado","RGSL-74-2024","Banco Estado",
      "Vehículo","2021","ABCD12","400000","350000","50000","10","judicial",
      "Vehículo recupero de robo, sin motor, con llaves y arranque"
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ejemplo]);
    ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lotes");
    XLSX.writeFile(wb, "plantilla-lotes-gr.xlsx");
  };

  // ── Import Excel: parsear archivo ──
  const handleImportFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const XLSX = await import("xlsx");
    const buf  = await file.arrayBuffer();
    const wb   = XLSX.read(buf);
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const raw  = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });
    const dataRows = raw.slice(1).filter(r => r.some(c => String(c).trim() !== ""));
    const parsed = dataRows.map((r, i) => {
      const nombre   = String(r[0]  || "").trim();
      const exp      = String(r[1]  || "").trim();
      const mandante = String(r[2]  || "").trim();
      const cat      = String(r[3]  || "Muebles").trim() || "Muebles";
      const anio     = String(r[4]  || "").trim();
      const patente  = String(r[5]  || "").trim();
      const base     = parseInt(String(r[6]  || "0").replace(/\D/g,"")) || 0;
      const minimo   = parseInt(String(r[7]  || "0").replace(/\D/g,"")) || 0;
      const incr     = parseInt(String(r[8]  || "0").replace(/\D/g,"")) || 0;
      const comStr   = String(r[9]  || "").trim();
      const com      = comStr !== "" ? parseFloat(comStr.replace(",",".")) : null;
      const tipo     = String(r[10] || "judicial").trim().toLowerCase() || "judicial";
      const desc     = String(r[11] || "").trim();
      const errors   = [];
      if (!nombre) errors.push("Nombre obligatorio");
      if (!base)   errors.push("Precio base obligatorio");
      return { _row:i+2, nombre, exp, mandante, cat, anio, patente, base, minimo, incr, com, tipo, desc, errors };
    });
    setImportRows(parsed);
    setImportDone(null);
    setImportModal(true);
    e.target.value = "";
  };

  // ── Import Excel: confirmar y guardar en Supabase ──
  const confirmarImport = async () => {
    setImportSaving(true);
    const validas  = importRows.filter(r => r.errors.length === 0);
    const errCount = importRows.filter(r => r.errors.length > 0).length;
    let ok = 0;
    const { data: casaData } = await supabase.from("casas").select("id").eq("slug", session?.casa).single();
    for (const r of validas) {
      const comFinal = r.com != null ? r.com
        : (r.tipo === "concursal" ? 7 : 10);
      const { error } = await supabase.from("lotes").insert({
        casa_id:     casaData?.id || null,
        codigo:      `L-${String(Date.now()+ok).slice(-5)}`,
        nombre:      r.nombre,
        descripcion: r.desc,
        expediente:  r.exp  || null,
        mandante:    r.mandante || null,
        categoria:   r.cat  || "Muebles",
        anio:        r.anio ? parseInt(r.anio) : null,
        patente:     r.patente || null,
        base:        r.base,
        minimo:      r.minimo || null,
        incremento:  r.incr || Math.round(r.base * 0.05) || 50000,
        comision:    comFinal,
        tipo_remate: r.tipo,
        estado:      "disponible",
        orden:       dbLotes.length + ok + 1,
      });
      if (!error) ok++;
    }
    const { data: lotData } = await supabase.from("lotes").select("*").order("orden");
    if (lotData) setDbLotes(lotData);
    setImportDone({ ok, errors: errCount + (validas.length - ok) });
    setImportSaving(false);
  };
  const removePhoto   = (loteI, photoI) => { setLots(p=>{const n=[...p];const imgs=n[loteI].imgs.filter((_,j)=>j!==photoI);n[loteI]={...n[loteI],imgs};return n;}); setPhotoIdx(0); };

  // Genera e imprime PDF de liquidación de un comprador
  const generarPDFLiquidacion = async (c, fechaRemate) => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const p   = c.postorData;
    const l   = c.liq;
    const num = String(c.key).padStart(2,"0");

    // Datos de la casa
    const casaData   = dbLicencias.find(x => x.slug === session?.casa) || {};
    const casaNombre = casaData.nombre    || session?.casaNombre || "Casa de Remates";
    const logoUrl    = casaData.logo_url  || null;
    const martillero = casaData.martillero|| "";
    const rutMart    = casaData.rut_martillero       || "";
    const telMart    = casaData.telefono_martillero  || casaData.telefono  || "";
    const emailMart  = casaData.email_martillero     || casaData.email     || "";
    const remNombre  = liqReview?.remateNombre || "Remate";

    // Paleta — consistente con la app
    const TEAL   = [20,  184, 166];
    const NAVY   = [30,  58,  95 ];
    const CYAN   = [6,   182, 212];
    const GRAY   = [100, 116, 139];
    const LTGRAY = [248, 250, 252];
    const BORDER = [226, 232, 240];
    const GREEN  = [22,  163, 74 ];
    const WHITE  = [255, 255, 255];

    const fmtCLP = v => "$ " + Math.round(v).toLocaleString("es-CL");

    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 0;

    // Barra superior teal
    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, 3.5, "F");
    y = 10;

    // Header: logo casa (izquierda) | título centrado | logo Pecker (derecha)

    // Logo casa (izquierda)
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise(res => { img.onload = res; img.onerror = res; img.src = logoUrl; });
        if (img.naturalWidth > 0) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const lw = Math.min(36, 24 * ratio);
          doc.addImage(img, "PNG", 14, y, lw, 24, undefined, "FAST");
        }
      } catch {}
    }

    // Logo Pecker (derecha, pequeño) — TODO: reemplazar por logo final de Pecker
    try {
      const grCanvas = document.createElement("canvas");
      grCanvas.width = 72; grCanvas.height = 72;
      const ctx2 = grCanvas.getContext("2d");
      ctx2.fillStyle = "#EBF8FF"; ctx2.beginPath();
      ctx2.roundRect(0,0,72,72,14); ctx2.fill();
      ctx2.strokeStyle = "#38B2F6"; ctx2.lineWidth = 7;
      ctx2.lineCap = "round"; ctx2.lineJoin = "round";
      ctx2.beginPath(); ctx2.moveTo(16,24); ctx2.quadraticCurveTo(16,14,28,14);
      ctx2.lineTo(44,14); ctx2.quadraticCurveTo(60,14,60,28);
      ctx2.quadraticCurveTo(60,38,48,40); ctx2.lineTo(60,56); ctx2.stroke();
      ctx2.strokeStyle = "#1E3A5F";
      ctx2.beginPath(); ctx2.moveTo(8,24); ctx2.quadraticCurveTo(8,10,24,10);
      ctx2.lineTo(40,10); ctx2.stroke();
      doc.addImage(grCanvas.toDataURL("image/png"), "PNG", W - 14 - 16, y + 1, 16, 16, undefined, "FAST");
      doc.setFont("helvetica","normal"); doc.setFontSize(5.5); doc.setTextColor(...GRAY);
      doc.text("Pecker", W - 14 - 8, y + 20, { align:"center" });
    } catch {}

    // Título centrado
    doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(...TEAL);
    doc.text("LIQUIDACIÓN", W / 2, y + 9, { align:"center" });
    doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text("COMPRADOR", W / 2, y + 16, { align:"center" });
    doc.setFontSize(22); doc.setTextColor(...CYAN);
    doc.text(`N° ${num}`, W / 2, y + 26, { align:"center" });

    y = 42;

    // Separador
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);
    y += 2;

    // Banda de identificación de la casa de remates
    doc.setFillColor(...NAVY);
    doc.rect(14, y, W - 28, martillero ? 14 : 8, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text(casaNombre.toUpperCase(), W / 2, y + 6, { align:"center" });
    if (martillero) {
      const infoLine = [martillero, rutMart && `RUT: ${rutMart}`, telMart && `Tel: ${telMart}`].filter(Boolean).join("  ·  ");
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(180, 220, 240);
      doc.text(infoLine, W / 2, y + 11.5, { align:"center" });
    }
    y += (martillero ? 14 : 8) + 5;

    // Banner remate
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.3);
    doc.roundedRect(14, y, W - 28, 9, 2, 2, "FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
    doc.text(remNombre, 19, y + 6);
    doc.setFont("helvetica","normal"); doc.setTextColor(...GRAY);
    doc.text(`Fecha: ${fechaRemate}`, W - 18, y + 6, { align:"right" });
    y += 14;

    // Datos comprador
    const datos = [
      ["SEÑOR(ES)", p?.razonSocial || p?.nombre || "—"],
      ["R.U.T.",    p?.rut         || "—"],
      ["GIRO",      p?.giro        || "—"],
      ["DIRECCIÓN", p?.direccion   || "—"],
      ["TELÉFONO",  p?.tel         || "—"],
      ["MAIL",      p?.email       || "—"],
      ["COMUNA",    p?.comuna      || "—"],
    ];
    const datosH = datos.length * 6 + 8;
    doc.setFillColor(...LTGRAY); doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.roundedRect(14, y, W - 28, datosH, 2, 2, "FD");
    let dy = y + 7;
    datos.forEach(([k, v]) => {
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
      doc.text(k, 18, dy);
      doc.setFont("helvetica","normal"); doc.setTextColor(30, 30, 30);
      doc.text(String(v || "—"), 56, dy);
      dy += 6;
    });
    y = dy + 5;

    // Tabla lotes
    const rows = [];
    l.lineas.forEach((ln, li) => {
      const label = `LOTE ${li + 1}`;
      rows.push([label, "1", ln.lote.toUpperCase(), "EX", fmtCLP(ln.monto), fmtCLP(ln.monto)]);
      rows.push([label, "1", `Comisión ${ln.comPct}%`, "AF", fmtCLP(ln.com), fmtCLP(ln.com)]);
      if (ln.motorizado) rows.push(["G-ADM", "1", `Gastos Adm. Vehículo (${label})`, "AF", fmtCLP(ln.gastosAdm), fmtCLP(ln.gastosAdm)]);
    });

    autoTable(doc, {
      startY: y,
      head: [["LOTE","CANT.","DESCRIPCIÓN","ND","UNITARIO","TOTAL"]],
      body: rows,
      styles: { fontSize:8, cellPadding:2.8, textColor:[30,30,30], font:"helvetica" },
      headStyles: { fillColor:NAVY, textColor:WHITE, fontStyle:"bold", fontSize:7.5, halign:"center" },
      columnStyles: {
        0: { cellWidth:18, halign:"center", textColor:GRAY, fontSize:7.5 },
        1: { cellWidth:12, halign:"center" },
        2: { cellWidth:"auto" },
        3: { cellWidth:13, halign:"center" },
        4: { cellWidth:26, halign:"right" },
        5: { cellWidth:26, halign:"right", fontStyle:"bold" },
      },
      alternateRowStyles: { fillColor:LTGRAY },
      tableLineColor:BORDER, tableLineWidth:0.2,
      didDrawCell: (data) => {
        if (data.section==="body" && data.column.index===3) {
          const txt = data.cell.raw;
          const x=data.cell.x+1.5, cy=data.cell.y+1.8, w=data.cell.width-3, h=data.cell.height-3.5;
          if (txt==="EX") { doc.setFillColor(220,252,231); doc.setDrawColor(134,239,172); }
          else            { doc.setFillColor(204,251,241); doc.setDrawColor(94,234,212); }
          doc.roundedRect(x,cy,w,h,1,1,"FD");
          doc.setFontSize(6.5); doc.setFont("helvetica","bold");
          doc.setTextColor(txt==="EX"?22:15, txt==="EX"?163:118, txt==="EX"?74:110);
          doc.text(txt, x+w/2, cy+h-1.2, {align:"center"});
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Page break si no hay espacio para totales + box
    if (y + 70 > H - 20) {
      doc.addPage();
      y = 20;
    }

    // Totales — izquierda (desglose claro EX / AF / IVA)
    const colW = (W - 28) / 2 - 4;
    const totalesY = y;
    const ivaBase = l.totalCom + l.totalAf;
    const totItems = [
      ["PRECIO MARTILLO (EX)",   l.totalEx,  false],
      ["COMISIONES MARTILLERO (AF)", l.totalCom, false],
      ...(l.totalAf > 0 ? [["GASTOS ADM. (AF)", l.totalAf, false]] : []),
      ["BASE AFECTA IVA",        ivaBase,    true],
      ["IVA 19%",                l.iva,      false],
    ];
    let ty = totalesY;
    totItems.forEach(([k, v, bold]) => {
      doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(8.5);
      doc.setTextColor(...(bold ? NAVY : GRAY));
      doc.text(k, 14, ty);
      doc.setFont("helvetica","bold"); doc.setTextColor(30, 30, 30);
      doc.text(fmtCLP(v), 14 + colW, ty, { align:"right" });
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
      doc.line(14, ty + 2, 14 + colW, ty + 2);
      ty += 6.5;
    });
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.6);
    doc.line(14, ty, 14 + colW, ty);
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...NAVY);
    doc.text("TOTAL:", 14, ty + 7);
    doc.setFontSize(11); doc.setTextColor(...TEAL);
    doc.text(fmtCLP(l.total), 14 + colW, ty + 7, { align:"right" });

    // Box garantía + total a pagar — derecha
    const bx = W / 2 + 6, bw = W / 2 - 20, bh = 34;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...TEAL); doc.setLineWidth(0.6);
    doc.roundedRect(bx, totalesY, bw, bh, 3, 3, "FD");
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...GRAY);
    doc.text("GARANTÍA:", bx + 5, totalesY + 10);
    doc.setFont("helvetica","bold"); doc.setTextColor(...GREEN);
    doc.text(fmtCLP(l.garantia), bx + bw - 5, totalesY + 10, { align:"right" });
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.line(bx + 5, totalesY + 14, bx + bw - 5, totalesY + 14);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text("TOTAL A PAGAR:", bx + 5, totalesY + 24);
    doc.setFontSize(14); doc.setTextColor(...TEAL);
    doc.text(fmtCLP(l.totalAPagar), bx + bw - 5, totalesY + 25, { align:"right" });

    // Footer
    const fy = H - 12;
    doc.setFillColor(...TEAL);
    doc.rect(0, H - 5, W, 5, "F");
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
    doc.line(14, fy - 3, W - 14, fy - 3);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text(`${casaNombre} · Powered by Pecker · pecker.cl`, 14, fy + 1);
    doc.text(`Remate ${fechaRemate} · Comprador N° ${num}`, W - 14, fy + 1, { align:"right" });

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
                        // Obtener casa_id del usuario actual (no hardcodeado)
                        const casaIdActual = session?.casaId || null;
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
                          casa_id:     casaIdActual,
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

      {/* ── SIDEBAR ── oculto en sala en vivo para maximizar espacio */}
      <aside className={`sidebar${mobileMenu?" open":""}`} style={page==="sala"?{display:"none"}:undefined}>
        <div className="sb-logo"><PeckerLogo/></div>
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
              <div className="sb-urole">{session?.casaNombre||"Pecker"}</div>
            </div>
            <button title="Cerrar sesion" onClick={onLogout} style={{background:"transparent",border:"none",cursor:"pointer",color:"#364d70",padding:".2rem",borderRadius:4,flexShrink:0,transition:"color .15s"}}
              onMouseEnter={e=>e.target.style.color="#e05252"} onMouseLeave={e=>e.target.style.color="#364d70"}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 2H2v10h3M9 10l3-3-3-3M12 7H5"/></svg>
            </button>
          </div>
          {session?.role && (
            <div style={{marginTop:".5rem",paddingTop:".5rem",borderTop:"1px solid var(--b1)"}}>
              <span className={`role-badge ${session.role}`}>{session.role==="admin"?"Admin":session.role==="martillero"?"Martillero":"Postor"}</span>
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
                <button className="btn-sec" style={{fontSize:".7rem",display:"inline-flex",alignItems:"center",gap:".3rem"}} onClick={()=>{setImportModal(true);setImportRows([]);setImportDone(null);}}>
                  ↑ Importar Excel
                </button>
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
            <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:"1.5rem",alignItems:"start"}}>

              {/* COLUMNA IZQUIERDA — Acciones + Remates Activos */}
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

                {/* Remates Activos — debajo de los botones */}
                <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:16,padding:"1.2rem 1.3rem"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
                    <div style={{fontSize:".95rem",fontWeight:700,color:"var(--wh2)"}}>Remates Activos</div>
                    <button className="btn-sec" style={{fontSize:".72rem"}} onClick={()=>setPage("remates")}>Ver todos</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:".75rem"}}>
                    {REMATES_MERGED.filter(r=>r.estado==="activo").length===0 ? (
                      <div style={{padding:"1.5rem",textAlign:"center",color:"var(--mu)",fontSize:".82rem",background:"var(--s1)",borderRadius:10,border:"1px solid var(--b1)"}}>
                        No hay remates activos.{" "}
                        <span style={{color:"var(--ac)",cursor:"pointer",fontWeight:600}} onClick={()=>setModal("nuevo-remate")}>Crear uno →</span>
                      </div>
                    ) : REMATES_MERGED.filter(r=>r.estado==="activo").map(r=>(
                      <div key={r.id} style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:12,padding:"1rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",transition:"border-color .15s,box-shadow .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(6,182,212,.3)";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.06)"}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b1)";e.currentTarget.style.boxShadow="none"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:".9rem",color:"var(--wh2)",marginBottom:".45rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                          <div style={{display:"flex",gap:"1.2rem"}}>
                            <div style={{display:"flex",alignItems:"center",gap:".3rem",fontSize:".75rem",color:"var(--gr)",fontWeight:600}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:"var(--gr)"}}/>Activo
                            </div>
                            <div style={{fontSize:".75rem",color:"var(--mu)"}}>{r.fecha||"—"}</div>
                            <div style={{fontSize:".75rem",color:"var(--mu)"}}>{r.modal||"—"}</div>
                          </div>
                        </div>
                        <button style={{background:"var(--ac)",color:"#fff",border:"none",borderRadius:9,padding:".55rem 1rem",fontSize:".76rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"background .15s"}}
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
                          }}>Entrar →</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA — Stats cards */}
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
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
                  <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:16,padding:"1.2rem 1.4rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`3px solid ${s.color}`}}>
                    <div>
                      <div style={{fontSize:".72rem",color:"var(--mu)",marginBottom:".35rem",textTransform:"uppercase",letterSpacing:".04em"}}>{s.label}</div>
                      <div style={{fontSize:"2.2rem",fontWeight:800,color:"var(--wh2)",lineHeight:1}}>{s.val}</div>
                    </div>
                    <div style={{width:44,height:44,background:`${s.color}18`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {s.icon}
                    </div>
                  </div>
                ))}
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
                              let mapped = [];
                              if(r.supabaseId){
                                // 1º buscar lotes asignados a este remate
                                const {data:lotesRemate} = await supabase.from("lotes").select("*").eq("remate_id",r.supabaseId).order("orden");
                                if(lotesRemate&&lotesRemate.length>0){
                                  mapped = lotesRemate.map(l=>({id:l.id,supabaseId:l.id,remateId:l.remate_id,name:l.nombre,cat:l.categoria||"Muebles",base:l.base||0,imgs:Array.isArray(l.imagenes)?l.imagenes:(l.imagenes?[l.imagenes]:[]),desc:l.descripcion||"",inc:l.incremento||Math.round((l.base||0)*0.05)||100000}));
                                } else {
                                  // fallback: todos los lotes disponibles de esta casa
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
                                setPage("sala"); notify("Sala abierta.","sold");
                              } else {
                                setIdx(0); setAState("waiting"); setBidTimer(null);
                                setPage("sala");
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
                pecker.cl/participar?id={session?.casaId||session?.casa||"—"}
              </code>
              <button className="btn-sec" style={{fontSize:".68rem"}} onClick={()=>{
                navigator.clipboard.writeText(`https://pecker.cl/participar?id=${session?.casaId||session?.casa||""}`);
                notify("Link copiado al portapapeles.","sold");
              }}>Copiar link</button>
            </div>
          </div>
          );
        })()}

        {/* ══ FACTURACION ══ */}
        {page==="factura" && (
          <div className="page">

            {/* ── Selector de remate ── */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem",padding:".8rem 1.1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,gap:"1rem",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Balance por remate</div>
                <div style={{fontSize:"1rem",fontWeight:800,color:"var(--wh)"}}>
                  {selectedBalanceRemate==="all" ? "Todos los remates" : REMATES_MERGED.find(r=>(r.supabaseId||r.id)===selectedBalanceRemate)?.name||"Remate seleccionado"}
                </div>
              </div>
              <div style={{display:"flex",gap:".5rem",alignItems:"center",flexWrap:"wrap"}}>
                <select
                  className="fsel"
                  style={{fontSize:".76rem",width:"auto"}}
                  value={selectedBalanceRemate}
                  onChange={e=>setSelectedBalanceRemate(e.target.value)}
                >
                  <option value="all">Todos los remates</option>
                  {REMATES_MERGED.map(r=>(
                    <option key={r.supabaseId||r.id} value={r.supabaseId||r.id}>{r.name}</option>
                  ))}
                </select>
                {/* PDF Martillero */}
                <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async()=>{
                  const adjFiltradas = [...ADJUDICACIONES,...liquidaciones].filter(a=>selectedBalanceRemate==="all"||a.remateId===selectedBalanceRemate);
                  if(!adjFiltradas.length){notify("Sin adjudicaciones para este remate.","inf");return;}
                  try {
                    const {jsPDF} = await import("jspdf");
                    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
                    const W = doc.internal.pageSize.getWidth();
                    const remateNom = selectedBalanceRemate==="all"?"Todos los remates":(REMATES_MERGED.find(r=>(r.supabaseId||r.id)===selectedBalanceRemate)?.name||"Remate");
                    const fecha = new Date().toLocaleDateString("es-CL");

                    // Header
                    doc.setFillColor(7,15,28); doc.rect(0,0,W,32,"F");
                    doc.setTextColor(56,178,246); doc.setFontSize(9); doc.setFont("helvetica","bold");
                    doc.text("PECKER",14,10);
                    doc.setTextColor(255,255,255); doc.setFontSize(15);
                    doc.text("LIQUIDACIÓN AL MARTILLERO",14,20);
                    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(90,127,168);
                    doc.text(`Remate: ${remateNom}   ·   Fecha: ${fecha}`,14,28);

                    let y = 42;
                    // Tabla lotes
                    doc.setFillColor(11,31,56); doc.rect(10,y-5,W-20,7,"F");
                    doc.setTextColor(90,127,168); doc.setFontSize(7); doc.setFont("helvetica","bold");
                    doc.text("LOTE",14,y); doc.text("COMPRADOR",45,y); doc.text("MONTO MARTILLO",110,y,{align:"right"}); doc.text("COMISIÓN",140,y,{align:"right"}); doc.text("G.ADM.",163,y,{align:"right"}); doc.text("TOTAL",W-14,y,{align:"right"});
                    y+=4;

                    let totalMonto=0,totalCom=0,totalGAdm=0;
                    adjFiltradas.forEach(a=>{
                      const com = a.com||Math.round((a.monto||0)*(a.comPct??3)/100);
                      const gadm = a.gastosAdm||0;
                      totalMonto+=a.monto||0; totalCom+=com; totalGAdm+=gadm;
                      if(y>270){doc.addPage();y=20;}
                      doc.setFillColor(255,255,255); doc.setTextColor(20,20,40); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
                      const fmtCL = n=>"$"+Math.round(n).toLocaleString("es-CL");
                      doc.text(String(a.lote||"").slice(0,22),14,y);
                      doc.text(String(a.postor||"").slice(0,28),45,y);
                      doc.text(fmtCL(a.monto||0),110,y,{align:"right"});
                      doc.setTextColor(34,197,94); doc.text(fmtCL(com),140,y,{align:"right"});
                      doc.setTextColor(gadm?230:150,gadm?180:150,gadm?0:150); doc.text(gadm?fmtCL(gadm):"—",163,y,{align:"right"});
                      doc.setTextColor(56,178,246); doc.setFont("helvetica","bold"); doc.text(fmtCL(com+gadm),W-14,y,{align:"right"});
                      y+=6;
                      doc.setDrawColor(30,40,60); doc.line(10,y-1,W-10,y-1);
                    });

                    // Totales
                    y+=3;
                    const iva = Math.round((totalCom+totalGAdm)*0.19);
                    const neto = totalCom+totalGAdm-iva;
                    doc.setFillColor(7,15,28); doc.rect(10,y,W-20,30,"F");
                    doc.setTextColor(90,127,168); doc.setFontSize(7); doc.setFont("helvetica","normal");
                    const fmtCL = n=>"$"+Math.round(n).toLocaleString("es-CL");
                    doc.text("Venta total martillo:",14,y+7); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.text(fmtCL(totalMonto),W-14,y+7,{align:"right"});
                    doc.setTextColor(90,127,168); doc.setFont("helvetica","normal"); doc.text("Comisiones netas:",14,y+13); doc.setTextColor(34,197,94); doc.setFont("helvetica","bold"); doc.text(fmtCL(totalCom),W-14,y+13,{align:"right"});
                    doc.setTextColor(90,127,168); doc.setFont("helvetica","normal"); doc.text("Gastos adm. motorizados:",14,y+19); doc.setTextColor(230,180,0); doc.setFont("helvetica","bold"); doc.text(fmtCL(totalGAdm),W-14,y+19,{align:"right"});
                    doc.setTextColor(90,127,168); doc.setFont("helvetica","normal"); doc.text("IVA 19% (AF):",14,y+25); doc.setTextColor(255,100,100); doc.setFont("helvetica","bold"); doc.text(fmtCL(iva),W-14,y+25,{align:"right"});
                    y+=33;
                    doc.setFillColor(56,178,246); doc.rect(10,y,W-20,10,"F");
                    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold");
                    doc.text("TOTAL A PAGAR A PECKER:",14,y+7);
                    doc.text(fmtCL(neto),W-14,y+7,{align:"right"});

                    doc.save(`balance-martillero-${remateNom.replace(/\s/g,"-")}.pdf`);
                    notify("PDF generado.","sold");
                  } catch(e){ console.error(e); notify("Error al generar PDF: "+e.message,"inf"); }
                }}>↓ PDF Martillero</button>
              </div>
            </div>

            {/* ── Calcular datos filtrados ── */}
            {(()=>{
              const adjAll = [...ADJUDICACIONES, ...liquidaciones].filter(a=>selectedBalanceRemate==="all"||a.remateId===selectedBalanceRemate);
              const ventaTotal   = adjAll.reduce((s,a)=>s+(a.monto||0),0);
              const totalCom     = adjAll.reduce((s,a)=>s+(a.com||Math.round((a.monto||0)*0.03)),0);
              const totalGAdm    = adjAll.reduce((s,a)=>s+(a.gastosAdm||0),0);
              const iva          = Math.round((totalCom+totalGAdm)*0.19);
              const ingresoNeto  = totalCom + totalGAdm - iva;
              const motorizados  = adjAll.filter(a=>a.motorizado||LOTES_REALES.find(l=>l.name===a.lote)?.motorizado).length;

              // Comisiones por tramo
              const tramos = {};
              adjAll.forEach(a=>{
                const pct = a.comPct ?? 3;
                if(!tramos[pct]) tramos[pct]={pct,lotes:[],subtotalMonto:0,subtotalCom:0};
                tramos[pct].lotes.push(a);
                tramos[pct].subtotalMonto += a.monto||0;
                tramos[pct].subtotalCom   += a.com||Math.round((a.monto||0)*pct/100);
              });
              const tramosArr = Object.values(tramos).sort((a,b)=>b.pct-a.pct);

              return (
                <>
                  {/* 5 cards hero */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".75rem",marginBottom:"1.1rem"}}>
                    {[
                      {label:"Venta total martillo",   val:fmt(ventaTotal),           accent:"var(--gr)",  sub:`${adjAll.length} lotes adjudicados`},
                      {label:"Comisiones netas",        val:fmt(totalCom),             accent:"var(--ac)",  sub:"antes de IVA"},
                      {label:"Gastos adm. motorizados", val:fmt(totalGAdm),            accent:"var(--yl)",  sub:`${motorizados} vehículos`},
                      {label:"IVA 19% (AF)",            val:fmt(iva),                  accent:"#f87171",    sub:"sobre com. + G.adm."},
                      {label:"Ingreso neto empresa",    val:fmt(ingresoNeto),          accent:"#a78bfa",    sub:"com. + G.adm. − IVA"},
                    ].map((c,i)=>(
                      <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1rem 1.1rem",borderBottom:`3px solid ${c.accent}`,textAlign:"center"}}>
                        <div style={{fontSize:".6rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".35rem"}}>{c.label}</div>
                        <div style={{fontSize:"1.25rem",fontWeight:900,color:c.accent,lineHeight:1,marginBottom:".2rem"}}>{c.val}</div>
                        <div style={{fontSize:".62rem",color:"var(--mu)"}}>{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* 2 cols: tramos comisión + gastos/IVA */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".85rem",marginBottom:"1.1rem"}}>

                    {/* Comisiones por tramo */}
                    <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,overflow:"hidden"}}>
                      <div style={{background:"var(--s3)",padding:".6rem 1rem",fontSize:".65rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".08em",borderBottom:"1px solid var(--b1)"}}>
                        Comisiones netas por tramo
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{borderBottom:"1px solid var(--b1)"}}>
                            {["Tramo","Lotes","Venta neta","Comisión"].map(h=>(
                              <th key={h} style={{padding:".4rem .75rem",fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",textAlign:h==="Lotes"?"center":"right",letterSpacing:".04em"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tramosArr.length===0 && (
                            <tr><td colSpan={4} style={{padding:"1.5rem",textAlign:"center",color:"var(--mu)",fontSize:".75rem",fontStyle:"italic"}}>Sin comisiones registradas</td></tr>
                          )}
                          {tramosArr.map((t,i)=>(
                            <tr key={i} style={{borderBottom:"1px solid var(--b1)"}}>
                              <td style={{padding:".5rem .75rem"}}>
                                <span style={{padding:".15rem .5rem",background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",borderRadius:5,fontFamily:"Inter,sans-serif",fontSize:".72rem",fontWeight:700,color:"var(--ac)"}}>{t.pct}%</span>
                              </td>
                              <td style={{padding:".5rem .75rem",textAlign:"center",fontFamily:"Inter,sans-serif",fontSize:".76rem",color:"var(--mu2)"}}>{t.lotes.length}</td>
                              <td style={{padding:".5rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".73rem",color:"var(--wh2)"}}>{fmt(t.subtotalMonto)}</td>
                              <td style={{padding:".5rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".76rem",fontWeight:700,color:"var(--gr)"}}>{fmt(t.subtotalCom)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{borderTop:"2px solid var(--b2)",background:"rgba(255,255,255,.02)"}}>
                            <td colSpan={3} style={{padding:".6rem .75rem",textAlign:"right",fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".04em"}}>Total neto comisiones</td>
                            <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".85rem",fontWeight:900,color:"var(--gr)"}}>{fmt(totalCom)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Gastos e IVA */}
                    <div style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,overflow:"hidden"}}>
                      <div style={{background:"var(--s3)",padding:".6rem 1rem",fontSize:".65rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".08em",borderBottom:"1px solid var(--b1)"}}>
                        Gastos e impuestos
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <tbody>
                          {[
                            ["Comisiones netas (base AF)",     fmt(totalCom),           "var(--gr)"],
                            ["Gastos adm. motorizados (neto)", fmt(totalGAdm),           "var(--yl)"],
                            ["Base afecta IVA",                fmt(totalCom+totalGAdm),  "var(--mu2)"],
                            ["IVA 19% s/ingresos",             fmt(iva),                 "#f87171"],
                          ].map(([l,v,c],i)=>(
                            <tr key={i} style={{borderBottom:"1px solid var(--b1)"}}>
                              <td style={{padding:".65rem .9rem",fontSize:".76rem",fontStyle:"italic",color:"var(--mu2)"}}>{l}</td>
                              <td style={{padding:".65rem .9rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontWeight:700,color:c,fontSize:".8rem"}}>{v}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{background:"rgba(167,139,250,.06)",borderTop:"2px solid rgba(167,139,250,.25)"}}>
                            <td style={{padding:".75rem .9rem",fontSize:".72rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:".04em"}}>Ingreso neto empresa</td>
                            <td style={{padding:".75rem .9rem",textAlign:"right",fontFamily:"Inter,sans-serif",fontSize:".95rem",fontWeight:900,color:"#a78bfa"}}>{fmt(ingresoNeto)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Detalle lote a lote */}
                  <div className="table-card">
                    <div className="table-head"><div className="table-title">Detalle por lote adjudicado</div></div>
                    {adjAll.length===0
                      ? <div style={{padding:"2rem",textAlign:"center",color:"var(--mu)",fontSize:".8rem",fontStyle:"italic"}}>Sin adjudicaciones para este remate</div>
                      : <table>
                          <thead><tr><th>Comprador</th><th>Lote</th><th>Tipo</th><th>Monto</th><th>Com %</th><th>Comisión</th><th>G.Adm.</th><th>Total empresa</th></tr></thead>
                          <tbody>
                            {adjAll.map((a,i)=>{
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
                    }
                  </div>
                </>
              );
            })()}
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

            // Datos de la casa — igual que PDF comprador
            const casaData   = dbLicencias.find(x => x.slug === session?.casa) || {};
            const casaNombre = casaData.nombre    || session?.casaNombre || "Casa de Remates";
            const logoUrl    = casaData.logo_url  || null;
            const martillero = casaData.martillero|| "";
            const rutMart    = casaData.rut_martillero       || "";
            const telMart    = casaData.telefono_martillero  || casaData.telefono  || "";
            const emailMart  = casaData.email_martillero     || casaData.email     || "";

            // Paleta
            const TEAL   = [20,  184, 166];
            const NAVY   = [30,  58,  95 ];
            const GRAY   = [100, 116, 139];
            const LTGRAY = [248, 250, 252];
            const BORDER = [226, 232, 240];
            const RED    = [239, 68,  68 ];
            const WHITE  = [255, 255, 255];

            const fmtCLP = v => "$ " + Math.round(v).toLocaleString("es-CL");
            const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"letter"});
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();
            let y = 0;

            // Barra superior teal
            doc.setFillColor(...TEAL);
            doc.rect(0, 0, W, 3.5, "F");
            y = 10;

            // Header: logo + datos casa (izquierda) | título (derecha)
            let logoEndX = 14;
            if (logoUrl) {
              try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                await new Promise(res => { img.onload = res; img.onerror = res; img.src = logoUrl; });
                if (img.naturalWidth > 0) {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  const lw = Math.min(38, 22 * ratio);
                  doc.addImage(img, "PNG", 14, y, lw, 22, undefined, "FAST");
                  logoEndX = 14 + lw + 5;
                }
              } catch {}
            } else {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = 72; canvas.height = 72;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#EBF8FF"; ctx.beginPath();
                ctx.roundRect(0,0,72,72,14); ctx.fill();
                ctx.strokeStyle = "#38B2F6"; ctx.lineWidth = 7;
                ctx.lineCap = "round"; ctx.lineJoin = "round";
                ctx.beginPath(); ctx.moveTo(16,24); ctx.quadraticCurveTo(16,14,28,14);
                ctx.lineTo(44,14); ctx.quadraticCurveTo(60,14,60,28);
                ctx.quadraticCurveTo(60,38,48,40); ctx.lineTo(60,56); ctx.stroke();
                ctx.strokeStyle = "#1E3A5F";
                ctx.beginPath(); ctx.moveTo(8,24); ctx.quadraticCurveTo(8,10,24,10);
                ctx.lineTo(40,10); ctx.stroke();
                doc.addImage(canvas.toDataURL("image/png"), "PNG", 14, y, 18, 18, undefined, "FAST");
                logoEndX = 37;
              } catch {}
            }

            doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...NAVY);
            doc.text(casaNombre.toUpperCase(), logoEndX, y + 7);
            if (martillero) {
              doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...TEAL);
              doc.text("MARTILLERO PÚBLICO", logoEndX, y + 13);
              doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
              doc.text(martillero, logoEndX, y + 18);
              let iY = y + 23;
              const info = [rutMart && `RUT: ${rutMart}`, telMart && `Tel: ${telMart}`, emailMart && `Email: ${emailMart}`].filter(Boolean);
              info.forEach(line => { doc.text(line, logoEndX, iY); iY += 4; });
            }

            doc.setFont("helvetica","bold"); doc.setFontSize(19); doc.setTextColor(...TEAL);
            doc.text("LIQUIDACIÓN", W - 14, y + 9, {align:"right"});
            doc.setFontSize(11); doc.setTextColor(...NAVY);
            doc.text("VENDEDOR", W - 14, y + 16, {align:"right"});
            doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
            doc.text("Powered by Pecker", W - 14, y + 32, {align:"right"});

            y = 42;
            doc.setDrawColor(...TEAL); doc.setLineWidth(0.5);
            doc.line(14, y, W - 14, y);
            y += 5;

            // Banner remate
            doc.setFillColor(236, 253, 245);
            doc.setDrawColor(...TEAL); doc.setLineWidth(0.3);
            doc.roundedRect(14, y, W - 28, 9, 2, 2, "FD");
            doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...NAVY);
            doc.text(REMATES_MERGED[0]?.name || "Remate", 19, y + 6);
            doc.setFont("helvetica","normal"); doc.setTextColor(...GRAY);
            doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, W - 18, y + 6, {align:"right"});
            y += 14;

            // Datos vendedor
            const datosV = [
              ["PROPIETARIO", vd?.nombre    || "—"],
              ["R.U.T.",      vd?.rut       || "—"],
              ["GIRO",        vd?.giro      || "—"],
              ["DIRECCIÓN",   vd?.direccion || "—"],
              ["COMUNA",      vd?.comuna    || "—"],
              ["MAIL",        vd?.email     || "—"],
            ];
            const datosH = datosV.length * 6 + 8;
            doc.setFillColor(...LTGRAY); doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
            doc.roundedRect(14, y, W - 28, datosH, 2, 2, "FD");
            let dvy = y + 7;
            datosV.forEach(([k, v]) => {
              doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
              doc.text(k, 18, dvy);
              doc.setFont("helvetica","normal"); doc.setTextColor(30, 30, 30);
              doc.text(String(v || "—"), 56, dvy);
              dvy += 6;
            });
            y = dvy + 5;

            // Tabla lotes vendidos
            if (adjVendedor.length > 0) {
              doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
              doc.text("Lotes vendidos", 14, y); y += 4;
              autoTable(doc, {
                startY: y,
                head: [["Expediente","Descripción","Precio martillo"]],
                body: adjVendedor.map(a => [lotesVendedor.find(l=>l.name===a.lote)?.exp||"—", a.lote, fmtCLP(a.monto||0)]),
                styles: { fontSize:8.5, cellPadding:2.8 },
                headStyles: { fillColor:NAVY, textColor:WHITE, fontStyle:"bold", fontSize:8 },
                columnStyles: { 2: { halign:"right", fontStyle:"bold" } },
                alternateRowStyles: { fillColor:LTGRAY },
                tableLineColor:BORDER, tableLineWidth:0.2,
              });
              y = doc.lastAutoTable.finalY + 6;
            }

            // Tabla lotes no vendidos
            if (lotesNoVendidos.length > 0) {
              doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
              doc.text("Lotes no vendidos (base comisión defensa)", 14, y); y += 4;
              autoTable(doc, {
                startY: y,
                head: [["Expediente","Descripción","Base"]],
                body: lotesNoVendidos.map(l => [l.exp||"—", l.name, fmtCLP(l.base||0)]),
                styles: { fontSize:8.5, cellPadding:2.8 },
                headStyles: { fillColor:GRAY, textColor:WHITE, fontStyle:"bold", fontSize:8 },
                columnStyles: { 2: { halign:"right" } },
                alternateRowStyles: { fillColor:LTGRAY },
                tableLineColor:BORDER, tableLineWidth:0.2,
              });
              y = doc.lastAutoTable.finalY + 6;
            }

            // Liquidación financiera
            // Page break si no cabe
            if (y + 80 > H - 20) { doc.addPage(); y = 20; }

            const baseAfectaIva = comVentaMonto + comDefensaMonto + Number(vendedorForm.publicidad||0);
            const items = [
              { k: "TOTAL VENTAS MARTILLO",                          v: totalVentas,                          desc: false, bold: true  },
              { k: `COMISIÓN VENTA ${vendedorForm.comVenta}% (AF)`,  v: -comVentaMonto,                       desc: true,  bold: false },
              { k: `COMISIÓN DEFENSA ${vendedorForm.comDefensa}% (AF)`, v: -comDefensaMonto,                  desc: true,  bold: false },
              ...(Number(vendedorForm.publicidad||0) > 0
                ? [{ k: "AVISOS PUBLICITARIOS (AF)",                 v: -Number(vendedorForm.publicidad||0),  desc: true,  bold: false }]
                : []),
              { k: "BASE AFECTA IVA",                                v: baseAfectaIva,                        desc: false, bold: true  },
              { k: "IVA 19% S/COMISIONES",                           v: -iva,                                 desc: true,  bold: false },
              { k: "TOTAL DESCUENTOS",                               v: -totalDescuentos,                     desc: true,  bold: true  },
            ];
            doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...NAVY);
            doc.text("Liquidación financiera", 14, y); y += 7;
            items.forEach(({ k, v, desc, bold }) => {
              doc.setFont("helvetica", bold ? "bold" : "normal");
              doc.setFontSize(9); doc.setTextColor(...(desc && !bold ? GRAY : [30,30,30]));
              doc.text(k, 14, y);
              doc.setFont("helvetica","bold");
              doc.setTextColor(...(v < 0 ? RED : [30,30,30]));
              doc.text(fmtCLP(v), W - 14, y, {align:"right"});
              doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
              doc.line(14, y + 2, W - 14, y + 2);
              y += 8;
            });
            doc.setDrawColor(...TEAL); doc.setLineWidth(0.8);
            doc.line(14, y - 2, W - 14, y - 2);
            doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
            doc.text("LÍQUIDO A PAGAR AL VENDEDOR:", 14, y + 8);
            doc.setFontSize(14); doc.setTextColor(...TEAL);
            doc.text(fmtCLP(liquidoAPagar), W - 14, y + 8, {align:"right"});

            // Footer
            const fy = H - 12;
            doc.setFillColor(...TEAL);
            doc.rect(0, H - 5, W, 5, "F");
            doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
            doc.line(14, fy - 3, W - 14, fy - 3);
            doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...GRAY);
            doc.text(`${casaNombre} · Powered by Pecker · pecker.cl`, 14, fy + 1);
            doc.text(new Date().toLocaleDateString("es-CL"), W - 14, fy + 1, {align:"right"});
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

            {/* ── Header: período + controles ── */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem",padding:".8rem 1.1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:10,gap:"1rem",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Estadísticas</div>
                <div style={{fontSize:"1rem",fontWeight:800,color:"var(--wh)"}}>
                  {statsView==="mes"
                    ? `${["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][statsMes]} ${statsAnio}`
                    : `Año ${statsAnio}`}
                </div>
              </div>
              <div style={{display:"flex",gap:".45rem",alignItems:"center",flexWrap:"wrap"}}>
                {/* Toggle Mensual/Anual */}
                <div style={{display:"flex",border:"1px solid var(--b1)",borderRadius:7,overflow:"hidden"}}>
                  {[["mes","Mensual"],["anio","Anual"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setStatsView(v)}
                      style={{padding:".35rem .75rem",fontSize:".73rem",fontWeight:600,border:"none",cursor:"pointer",background:statsView===v?"var(--ac)":"transparent",color:statsView===v?"#fff":"var(--mu2)",transition:"all .15s"}}>
                      {l}
                    </button>
                  ))}
                </div>
                {/* Año */}
                <select className="fsel" style={{fontSize:".76rem",width:"auto"}} value={statsAnio} onChange={e=>setStatsAnio(Number(e.target.value))}>
                  {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                {/* Mes (solo en vista mensual) */}
                {statsView==="mes" && (
                  <select className="fsel" style={{fontSize:".76rem",width:"auto"}} value={statsMes} onChange={e=>setStatsMes(Number(e.target.value))}>
                    {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m,i)=>(
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                )}
                {/* CSV */}
                <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async()=>{
                  const adjAll = [...ADJUDICACIONES,...liquidaciones];
                  const csv = ["Postor,Lote,Monto,Comisión,IVA,Total,Estado,Fecha",
                    ...adjAll.map(a=>{
                      const com=a.com||Math.round((a.monto||0)*0.03);
                      const iva=Math.round(com*0.19);
                      return `"${a.postor}","${a.lote||""}",${a.monto||0},${com},${iva},${(a.monto||0)+com+iva},${a.estado||"adjudicado"},"${a.fecha||""}"`;
                    })
                  ].join("\n");
                  const el=document.createElement("a"); el.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv); el.download="estadisticas.csv"; el.click();
                  notify("CSV exportado.","sold");
                }}>↓ CSV</button>
                {/* Catálogo PDF */}
                <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={async()=>{
                  if(!LOTES_MERGED.length){notify("No hay lotes.","inf");return;}
                  try{
                    const {jsPDF}=await import("jspdf");
                    const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
                    const W=doc.internal.pageSize.getWidth();
                    doc.setFillColor(7,15,28); doc.rect(0,0,W,30,"F");
                    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont("helvetica","bold");
                    doc.text("CATÁLOGO DE LOTES",W/2,14,{align:"center"});
                    doc.setFontSize(9); doc.setFont("helvetica","normal");
                    doc.text(`Generado: ${new Date().toLocaleDateString("es-CL")}`,W/2,22,{align:"center"});
                    let y=38;
                    LOTES_MERGED.forEach((l,i)=>{
                      if(y>260){doc.addPage();y=20;}
                      doc.setFillColor(11,31,56); doc.roundedRect(10,y,W-20,22,2,2,"F");
                      doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont("helvetica","bold");
                      doc.text(`Lote ${i+1} — ${l.name}`,15,y+8);
                      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(90,127,168);
                      doc.text(`Base: ${fmt(l.base||0)}   Estado: ${l.estado||"disponible"}`,15,y+16);
                      y+=26;
                    });
                    doc.save("catalogo-lotes.pdf");
                    notify("PDF generado.","sold");
                  }catch(e){notify("Error: "+e.message,"inf");}
                }}>↓ Catálogo PDF</button>
              </div>
            </div>

            {/* ── Calcular datos del período ── */}
            {(()=>{
              const parseFecha = (a) => {
                if(a.fechaISO) return new Date(a.fechaISO);
                if(a.fecha){
                  const p = a.fecha.split(/[\/\-\.]/);
                  if(p.length===3) return new Date(Number(p[2]),Number(p[1])-1,Number(p[0]));
                }
                return new Date();
              };
              const adjAll = [...ADJUDICACIONES,...liquidaciones];
              // Filtrar por período seleccionado
              const adjPeriodo = adjAll.filter(a=>{
                const d = parseFecha(a);
                if(statsView==="mes") return d.getFullYear()===statsAnio && d.getMonth()===statsMes;
                return d.getFullYear()===statsAnio;
              });
              // Stats cards
              const ventaTotal = adjPeriodo.reduce((s,a)=>s+(a.monto||0),0);
              const totalCom   = adjPeriodo.reduce((s,a)=>s+(a.com||Math.round((a.monto||0)*0.03)),0);
              const totalGAdm  = adjPeriodo.reduce((s,a)=>s+(a.gastosAdm||0),0);
              const iva        = Math.round((totalCom+totalGAdm)*0.19);
              const neto       = totalCom+totalGAdm-iva;
              const lotesSold  = adjPeriodo.length;
              const totalLotes = LOTES_MERGED.length;

              // Datos para gráfico: siempre 12 meses del año seleccionado
              const mesesShort = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
              const chartData = mesesShort.map((mes,i)=>{
                const v = adjAll.filter(a=>{
                  const d=parseFecha(a);
                  return d.getFullYear()===statsAnio && d.getMonth()===i;
                }).reduce((s,a)=>s+(a.monto||0),0);
                return {mes, v: Math.round(v/1000000*10)/10, highlight: statsView==="mes"&&i===statsMes};
              });

              // Top 3 compradores del período
              const byPostor = {};
              adjPeriodo.forEach(a=>{
                const k=a.postor||"Desconocido";
                if(!byPostor[k]) byPostor[k]={postor:k,monto:0,lotes:0};
                byPostor[k].monto+=a.monto||0; byPostor[k].lotes++;
              });
              const top3 = Object.values(byPostor).sort((a,b)=>b.monto-a.monto).slice(0,3);
              const maxMonto = top3[0]?.monto||1;

              // Lotes sin vender del período actual
              const lotesSinVender = LOTES_MERGED.filter(l=>l.estado==="disponible"||l.estado==="pendiente"||!l.estado).slice(0,5);

              return (
                <>
                  {/* 5 cards hero */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".75rem",marginBottom:"1.1rem"}}>
                    {[
                      {label:"Venta total",        val:fmt(ventaTotal),  accent:"var(--gr)",  sub:`${lotesSold} lotes adjudicados`},
                      {label:"Comisiones netas",    val:fmt(totalCom),    accent:"var(--ac)",  sub:"sin IVA"},
                      {label:"G. adm. motorizados", val:fmt(totalGAdm),   accent:"var(--yl)",  sub:"vehículos"},
                      {label:"IVA 19%",             val:fmt(iva),         accent:"#f87171",    sub:"sobre ingresos AF"},
                      {label:"Ingreso neto",        val:fmt(neto),        accent:"#a78bfa",    sub:"empresa"},
                    ].map((c,i)=>(
                      <div key={i} style={{background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,padding:"1rem 1.1rem",borderBottom:`3px solid ${c.accent}`,textAlign:"center"}}>
                        <div style={{fontSize:".6rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".35rem"}}>{c.label}</div>
                        <div style={{fontSize:"1.2rem",fontWeight:900,color:c.accent,lineHeight:1,marginBottom:".2rem"}}>{c.val}</div>
                        <div style={{fontSize:".62rem",color:"var(--mu)"}}>{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Fila 2: gráfico + top compradores */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:".85rem",marginBottom:"1rem"}}>
                    {/* Gráfico ventas mensuales */}
                    <div className="chart-card">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".2rem"}}>
                        <div>
                          <div className="chart-title">Ventas {statsView==="mes"?"— año "+statsAnio:"— "+statsAnio}</div>
                          <div className="chart-sub">Millones CLP por mes{statsView==="mes"?" · mes seleccionado destacado":""}</div>
                        </div>
                        <div style={{fontSize:".68rem",fontWeight:700,color:"var(--ac)"}}>
                          {fmt(ventaTotal)} total período
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={155}>
                        <BarChart data={chartData} barSize={18}>
                          <XAxis dataKey="mes" tick={{fontFamily:"Inter",fontSize:9,fill:"#5a7fa8"}} axisLine={false} tickLine={false}/>
                          <YAxis hide/>
                          <Tooltip content={<CustomTooltip/>}/>
                          <Bar dataKey="v" radius={[4,4,0,0]}>
                            {chartData.map((entry,index)=>(
                              <Cell key={index} fill={entry.highlight?"#38B2F6":statsView==="mes"?"rgba(56,178,246,.35)":"#38B2F6"}/>
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Top 3 compradores */}
                    <div className="chart-card" style={{padding:"1.1rem 1.25rem"}}>
                      <div className="chart-title">Top compradores</div>
                      <div className="chart-sub">Por monto en el período</div>
                      <div style={{marginTop:"1rem",display:"flex",flexDirection:"column",gap:".75rem"}}>
                        {top3.length===0 && <div style={{fontSize:".75rem",color:"var(--mu)",textAlign:"center",padding:"1rem",fontStyle:"italic"}}>Sin adjudicaciones en este período</div>}
                        {top3.map((t,i)=>{
                          const pct=Math.round(t.monto/maxMonto*100);
                          const posData=POSTORES_MERGED.find(p=>p.name===t.postor||p.razonSocial===t.postor);
                          return (
                            <div key={i}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".3rem"}}>
                                <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                                  <div style={{width:22,height:22,borderRadius:6,background:i===0?"rgba(246,173,85,.15)":i===1?"rgba(56,178,246,.1)":"rgba(255,255,255,.05)",border:`1px solid ${i===0?"rgba(246,173,85,.3)":i===1?"rgba(56,178,246,.25)":"var(--b1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".65rem",fontWeight:800,color:i===0?"var(--yl)":i===1?"var(--ac)":"var(--mu)",flexShrink:0}}>{i+1}</div>
                                  <div>
                                    <div style={{fontSize:".76rem",fontWeight:700,color:"var(--wh2)"}}>{t.postor}</div>
                                    <div style={{fontSize:".62rem",color:"var(--mu)"}}>{t.lotes} lote{t.lotes>1?"s":""}{posData?` · #${String(posData.nComprador).padStart(2,"0")}`:""}</div>
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
                  </div>

                  {/* Fila 3: Historial remates + lotes sin vender */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:".85rem",marginBottom:"1rem"}}>
                    {/* Historial de remates */}
                    <div className="table-card">
                      <div className="table-head"><div className="table-title">Historial de remates — {statsAnio}</div></div>
                      <table>
                        <thead><tr><th>Nombre</th><th>Lotes</th><th>Recaudado</th><th>Comisiones</th><th>Estado</th></tr></thead>
                        <tbody>
                          {REMATES_MERGED.filter(r=>{
                            if(!r.fecha) return true;
                            const d = new Date(r.fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1")||r.fecha);
                            return isNaN(d.getFullYear()) || d.getFullYear()===statsAnio;
                          }).map((r,i)=>{
                            const com=Math.round((r.recaudado||0)*.03);
                            return (
                              <tr key={i}>
                                <td style={{fontWeight:600,fontSize:".78rem"}}>{r.name}</td>
                                <td className="mono">{r.lotes||0}</td>
                                <td className="gt">{fmt(r.recaudado||0)}</td>
                                <td style={{color:"var(--gr)",fontFamily:"Inter,sans-serif",fontSize:".73rem",fontWeight:600}}>{fmt(com)}</td>
                                <td><span className={`pill p-${r.estado}`}>{r.estado?.charAt(0).toUpperCase()+(r.estado?.slice(1)||"")}</span></td>
                              </tr>
                            );
                          })}
                          {REMATES_MERGED.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:"1.5rem",color:"var(--mu)",fontStyle:"italic",fontSize:".78rem"}}>Sin remates registrados</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* Lotes sin vender */}
                    <div className="chart-card" style={{padding:"1.1rem 1.25rem"}}>
                      <div className="chart-title">Lotes sin vender</div>
                      <div className="chart-sub">{lotesSinVender.length} lotes disponibles</div>
                      <div style={{marginTop:".8rem",display:"flex",flexDirection:"column",gap:".45rem"}}>
                        {lotesSinVender.length===0
                          ? <div style={{fontSize:".75rem",color:"var(--mu)",textAlign:"center",padding:"1rem",fontStyle:"italic"}}>Sin lotes pendientes</div>
                          : lotesSinVender.map((l,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:".5rem",padding:".42rem .6rem",background:"rgba(245,101,101,.05)",border:"1px solid rgba(245,101,101,.15)",borderRadius:6}}>
                              <span style={{flex:1,fontSize:".72rem",color:"var(--mu2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
                              <span style={{fontSize:".65rem",color:"var(--rd)",fontWeight:700,flexShrink:0,fontFamily:"Inter,sans-serif"}}>{fmt(l.base||0)}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>

                  {/* ── Panel admin: casas de remates ── */}
                  {session?.role==="admin" && (()=>{
                    const dbCasas = [...new Set(REMATES_MERGED.map(r=>r.casa).filter(Boolean))];
                    const casaStats = dbCasas.map(casa=>{
                      const rematesCasa = REMATES_MERGED.filter(r=>r.casa===casa);
                      const liqCasa = liquidaciones.filter(l=>
                        rematesCasa.some(r=>(r.supabaseId||r.id)===l.remateId)
                      );
                      const ventaCasa   = liqCasa.reduce((s,l)=>s+(l.monto||0),0);
                      const comCasa     = liqCasa.reduce((s,l)=>s+(l.com||Math.round((l.monto||0)*0.03)),0);
                      const ivaCasa     = Math.round(comCasa*0.19);
                      const netoCasa    = comCasa - ivaCasa;
                      const nRemates    = rematesCasa.length;
                      const lotesCasa   = rematesCasa.reduce((s,r)=>s+(r.lotes||0),0);
                      return {casa, ventaCasa, comCasa, ivaCasa, netoCasa, nRemates, lotesCasa, rematesCasa};
                    }).sort((a,b)=>b.ventaCasa-a.ventaCasa);

                    if(casaStats.length===0) return null;
                    return (
                      <div style={{marginTop:"1rem",background:"var(--s2)",border:"1px solid var(--b1)",borderRadius:12,overflow:"hidden"}}>
                        {/* Header */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:".85rem 1.15rem",borderBottom:"1px solid var(--b1)",background:"var(--s3)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".65rem"}}>
                            <div style={{width:26,height:26,borderRadius:7,background:"rgba(56,178,246,.12)",border:"1px solid rgba(56,178,246,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><path d="M3 13V7M8 13V3M13 13V9"/></svg>
                            </div>
                            <div>
                              <div style={{fontSize:".82rem",fontWeight:800,color:"var(--wh2)"}}>Estadísticas por casa de remates</div>
                              <div style={{fontSize:".65rem",color:"var(--mu2)"}}>Vista exclusiva administrador — {casaStats.length} casas activas</div>
                            </div>
                          </div>
                          <span style={{fontSize:".63rem",padding:".2rem .55rem",background:"rgba(56,178,246,.1)",border:"1px solid rgba(56,178,246,.2)",borderRadius:4,color:"var(--ac)",fontWeight:700,letterSpacing:".05em"}}>ADMIN</span>
                        </div>
                        {/* Grid de casas */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:".85rem",padding:"1rem"}}>
                          {casaStats.map((s,i)=>(
                            <div key={i} style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:10,padding:"1rem 1.15rem",borderLeft:`3px solid ${i===0?"var(--ac)":i===1?"var(--gr)":"var(--yl)"}`}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".6rem"}}>
                                <div style={{fontSize:".82rem",fontWeight:800,color:"var(--wh2)"}}>{s.casa}</div>
                                <span style={{fontSize:".62rem",padding:".15rem .45rem",background:"rgba(255,255,255,.05)",border:"1px solid var(--b1)",borderRadius:4,color:"var(--mu)",fontWeight:600}}>{s.nRemates} remates</span>
                              </div>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".45rem"}}>
                                {[
                                  ["Venta total",   fmt(s.ventaCasa), "var(--wh2)"],
                                  ["Comisiones",    fmt(s.comCasa),   "var(--gr)"],
                                  ["IVA 19%",       fmt(s.ivaCasa),   "#f87171"],
                                  ["Ingreso neto",  fmt(s.netoCasa),  "var(--ac)"],
                                ].map(([l,v,c])=>(
                                  <div key={l} style={{background:"var(--s2)",borderRadius:7,padding:".5rem .65rem"}}>
                                    <div style={{fontSize:".58rem",color:"var(--mu)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".15rem"}}>{l}</div>
                                    <div style={{fontFamily:"Inter,sans-serif",fontSize:".82rem",fontWeight:800,color:c}}>{v}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{marginTop:".55rem",fontSize:".65rem",color:"var(--mu)"}}>
                                {s.lotesCasa} lotes totales
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        )}
        {/* ══ USUARIOS ══ */}
        {page==="usuarios" && session?.role==="admin" && (()=>{
          // Casas reales desde Supabase — incluye "Pecker" para admin global
          const CASAS_LISTA_REAL = [{ id: null, nombre: "Pecker (Admin global)" }, ...dbLicencias];
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

              {/* Resumen por casa */}
              {dbLicencias.length > 0 && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:".65rem",marginBottom:"1.2rem"}}>
                  {/* Admins globales */}
                  {usuarios.filter(u=>!u.casa).length > 0 && (
                    <div style={{padding:".75rem 1rem",background:"rgba(224,82,82,.06)",border:"1px solid rgba(224,82,82,.15)",borderRadius:10}}>
                      <div style={{fontSize:".68rem",fontWeight:700,color:"var(--rd)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".4rem"}}>Admin</div>
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
          const BASE_URL = "https://pecker.cl";

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
                            <span style={{color:"var(--mu)",marginLeft:".5rem"}}>→ pecker.cl/participar/{toSlug(casaForm.nombre)}</span>
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

        {/* ══ SALA EN VIVO ══ */}
        {page==="sala" && (
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
                  onClick={()=>{
                    const rem = REMATES_MERGED.find(r=>(r.supabaseId||r.id)===salaRemateId);
                    const slug = session?.casa || rem?.casaSlug || "";
                    if (!slug) { notify("Selecciona un remate primero para abrir la pantalla de sala.","inf"); return; }
                    window.open(`/display/${slug}`,"_blank","width=1280,height=720");
                  }}>
                  Pantalla sala
                </button>
                {bids.every(b=>b.status==="sold"||bids[idx].count>0) && (
                  <button className="btn-primary" style={{fontSize:".7rem"}} onClick={cerrarRemateCompleto}>Cerrar remate</button>
                )}
              </div>
            </div>

            <div className="sala-wrap-new">

              {/* Sin lotes cargados */}
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

                  {/* Photo + Camera — side by side */}
                  <div className="sala-photo-wrap">

                    {/* ── FOTO PRINCIPAL ── */}
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
                          <button onClick={()=>removePhoto(idx, photoIdx%item.imgs.length)}
                            style={{position:"absolute",top:6,left:6,background:"rgba(224,82,82,.7)",border:"none",borderRadius:4,padding:".12rem .35rem",fontSize:".62rem",color:"#fff",cursor:"pointer"}}>
                            Quitar
                          </button>
                          <label htmlFor={`phadd${idx}`}
                            style={{position:"absolute",top:6,right:6,background:"rgba(56,178,246,.85)",borderRadius:5,padding:".15rem .45rem",fontSize:".62rem",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:".2rem"}}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                            Foto
                            <input id={`phadd${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                          </label>
                        </>
                      ) : (
                        <label htmlFor={`ph${idx}`} className="sala-photo-placeholder" style={{cursor:"pointer"}}>
                          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="var(--mu)" strokeWidth="1.5"><rect x="3" y="6" width="26" height="20" rx="3"/><circle cx="16" cy="16" r="5"/><path d="M12 6l2-3h4l2 3"/></svg>
                          <div style={{fontSize:".72rem",color:"var(--mu2)"}}>Agregar fotos del lote</div>
                          <input id={`ph${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                        </label>
                      )}

                      {/* Botón cámara — overlay esquina inferior izquierda */}
                      <button
                        onClick={camActiva ? detenerCamara : activarCamara}
                        style={{position:"absolute",bottom:6,left:6,display:"flex",alignItems:"center",gap:".3rem",padding:".22rem .55rem",background:camActiva?"rgba(224,82,82,.82)":"rgba(0,0,0,.58)",border:"none",borderRadius:5,color:"#fff",fontSize:".62rem",fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)"}}
                        title="Cámara martillero (solo preview)"
                      >
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 3h8l3 3v5H1V3z"/><circle cx="5" cy="8" r="1.5"/></svg>
                        {camActiva ? "Apagar cam" : "Cámara"}
                      </button>

                      {/* Indicador REC grabación de pantalla */}
                      {grabando && (
                        <div style={{position:"absolute",bottom:6,right:6,display:"flex",alignItems:"center",gap:".3rem",padding:".22rem .55rem",background:"rgba(224,82,82,.85)",borderRadius:5,color:"#fff",fontSize:".62rem",fontWeight:800,backdropFilter:"blur(4px)"}}>
                          <span style={{width:6,height:6,borderRadius:"50%",background:"#fff",animation:"pulse .8s infinite"}}/>
                          REC
                        </div>
                      )}
                    </div>

                    {/* ── CÁMARA LATERAL (solo desktop) ── */}
                    {camActiva && (
                      <div className="sala-cam-side">
                        <video ref={videoRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                        <div className="sala-cam-side-label">CAM</div>
                      </div>
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
                        const esAdj = b.status==="sold";
                        return (
                          <div key={i} className={`sala-lote-mini${esCurrent?" current":esAdj?" adj":""}`}
                            style={{cursor:"pointer"}}
                            onClick={()=>{ if(!esCurrent){ setIdx(i); setAState("waiting"); setBidTimer(null); } }}>
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
                    </div>


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
                        {/* ── Lote selector ── */}
                        <div style={{marginBottom:".6rem"}}>
                          <div style={{fontSize:".63rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".3rem"}}>Lote activo</div>
                          <select className="asel" style={{marginBottom:0}} value={idx} onChange={e=>{setIdx(Number(e.target.value));resetAuction();setCurInc(lots[Number(e.target.value)]?.inc||500000);}}>
                            {lots.map((it,i) => <option key={i} value={i}>Lote {String(i+1).padStart(2,"0")} — {it.name}</option>)}
                          </select>
                        </div>

                        {/* ── 2-col: incremento + acciones ── */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:".65rem",marginBottom:".6rem",alignItems:"stretch"}}>
                          {/* Incremento */}
                          <div className="inc-ctrl" style={{marginBottom:0}}>
                            <div style={{display:"flex",alignItems:"baseline",gap:".5rem",marginBottom:".35rem"}}>
                              <div className="inc-title" style={{marginBottom:0}}>Incremento</div>
                              <div className="inc-cur" style={{marginBottom:0,fontSize:"1.25rem"}}>{fmtS(curInc)}</div>
                            </div>
                            <div className="inc-btns" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".22rem"}}>
                              {INC_OPTIONS.map(v => (
                                <button key={v} className={`inc-btn${curInc===v?" on":""}`} onClick={()=>setCurInc(v)}>{fmtS(v)}</button>
                              ))}
                            </div>
                            <div style={{display:"flex",gap:".35rem",marginTop:".4rem",alignItems:"center"}}>
                              <input
                                placeholder="Personalizado..."
                                value={customMonto}
                                onChange={e=>setCustomMonto(e.target.value)}
                                onKeyDown={e=>{ if(e.key==="Enter"&&customMonto){ const n=parseInt(customMonto.replace(/\D/g,"")); if(n>0){setCurInc(n);setCustomMonto("");} } }}
                                style={{flex:1,padding:".28rem .5rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".7rem",fontFamily:"Inter,sans-serif"}}
                              />
                              <button
                                onClick={()=>{ const n=parseInt((customMonto||"").replace(/\D/g,"")); if(n>0){setCurInc(n);setCustomMonto("");} }}
                                style={{padding:".28rem .55rem",background:"var(--ac)",border:"none",borderRadius:6,color:"#fff",fontSize:".67rem",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                                Usar
                              </button>
                            </div>
                          </div>

                          {/* Botones acción */}
                          <div style={{display:"flex",flexDirection:"column",gap:".32rem",minWidth:108}}>
                            <button className="ab g"  style={{flex:1}} onClick={startAuction} disabled={aState==="live"}>▶ Iniciar</button>
                            <button className="ab y"  style={{flex:1}} onClick={pauseAuction} disabled={aState!=="live"}>⏸ Pausar</button>
                            <button className="ab bl" style={{flex:1}} onClick={adjudicar}    disabled={aState==="sold"}>✓ Adjudicar</button>
                            <button className="ab"    style={{flex:1,background:"rgba(167,139,250,.1)",color:"#a78bfa",border:"1px solid rgba(167,139,250,.25)"}} onClick={repetirLote}>↺ Repetir</button>
                            <button className="ab"    style={{flex:1,background:"rgba(255,255,255,.04)",color:"var(--mu2)",border:"1px solid var(--b2)"}} onClick={pasarLote} disabled={idx>=lots.length-1}>→ Pasar</button>
                            <button className="ab r"  style={{flex:1}} onClick={resetAuction}>⟳ Reset</button>
                          </div>
                        </div>

                        {/* ── Postura presencial ── */}
                        <div style={{padding:".5rem .7rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:8,marginBottom:".6rem"}}>
                          <div style={{fontSize:".65rem",fontWeight:700,color:"var(--yl)",marginBottom:".35rem",display:"flex",alignItems:"center",gap:".3rem"}}>
                            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v4M7 10v.5"/></svg>
                            Postura presencial
                          </div>
                          <div style={{display:"flex",gap:".35rem"}}>
                            <input placeholder="Paleta" value={presPaleta} onChange={e=>setPresPaleta(e.target.value)}
                              style={{width:60,padding:".28rem .45rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}/>
                            <input placeholder="Monto" value={presMonto} onChange={e=>setPresMonto(e.target.value)}
                              onKeyDown={e=>e.key==="Enter"&&registrarPresencial()}
                              style={{flex:1,padding:".28rem .45rem",background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:6,color:"var(--wh2)",fontSize:".72rem",fontFamily:"Inter,sans-serif"}}/>
                            <button onClick={registrarPresencial}
                              style={{padding:".28rem .55rem",background:"rgba(246,173,85,.2)",border:"1px solid rgba(246,173,85,.4)",borderRadius:6,color:"var(--yl)",fontSize:".72rem",fontWeight:700,cursor:"pointer"}}>
                              ✓
                            </button>
                          </div>
                        </div>

                        {/* ── Adjudicar / Iniciar big button ── */}
                        <button
                          className={`sala-place-bid-btn${aState==="live"?" adj":""}`}
                          onClick={aState==="live" ? adjudicar : startAuction}
                          disabled={aState==="sold"}
                        >
                          {aState==="live" ? "✓ Adjudicar lote" : aState==="sold" ? "Lote adjudicado" : "▶ Iniciar subasta"}
                        </button>

                        {/* ── Estado en tiempo real ── */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:".45rem",marginTop:".55rem"}}>
                          <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:9,padding:".5rem .6rem",textAlign:"center"}}>
                            <div style={{fontSize:".62rem",color:"var(--mu)",marginBottom:".15rem",textTransform:"uppercase",letterSpacing:".04em"}}>Oferta</div>
                            <div style={{fontSize:".8rem",fontWeight:800,color:"var(--wh2)",fontVariantNumeric:"tabular-nums"}}>{fmt(bid.current)}</div>
                          </div>
                          <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:9,padding:".5rem .6rem",textAlign:"center"}}>
                            <div style={{fontSize:".62rem",color:"var(--mu)",marginBottom:".15rem",textTransform:"uppercase",letterSpacing:".04em"}}>Pujas</div>
                            <div style={{fontSize:".8rem",fontWeight:800,color:"var(--wh2)"}}>{bid.count}</div>
                          </div>
                          <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:9,padding:".5rem .6rem",textAlign:"center"}}>
                            <div style={{fontSize:".62rem",color:"var(--mu)",marginBottom:".15rem",textTransform:"uppercase",letterSpacing:".04em"}}>Estado</div>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:".3rem"}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:sColor,boxShadow:`0 0 5px ${sColor}`,flexShrink:0}}/>
                              <div style={{fontSize:".72rem",fontWeight:700,color:sColor,whiteSpace:"nowrap"}}>{sLabel}</div>
                            </div>
                          </div>
                        </div>
                        {bidTimer!==null&&bidTimer>0&&aState==="live" && (
                          <div className={`bid-ticker${bidTimer<=5?" urgent":""}${bidTimer<=2?" critical":""}`} style={{marginTop:".5rem"}}>
                            <div className="bt-num" style={{color:bidTimer>8?"var(--gr)":bidTimer>4?"var(--yl)":"var(--rd)",fontSize:bidTimer<=3?"1.7rem":"1.35rem"}}>{bidTimer}</div>
                            <div>
                              <div className="bt-info">{bidTimer<=2?"¡ADJUDICANDO AHORA!":bidTimer<=5?"⚠ Última oportunidad":"Adjudica en"}</div>
                              <div className="bt-leader">{lastBidder||"—"} lidera · {fmt((bids[idx]?.current||0))}</div>
                            </div>
                          </div>
                        )}
                        {/* Panel post-adjudicación — control manual del martillero */}
                        {adjCountdown && (
                          <div style={{marginTop:".5rem",background:"rgba(20,184,166,.07)",border:"1px solid rgba(20,184,166,.35)",borderRadius:10,padding:".75rem .9rem",display:"flex",flexDirection:"column",gap:".5rem"}}>
                            <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="var(--gr)" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="var(--gr)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <div style={{fontSize:".75rem",fontWeight:700,color:"var(--gr)"}}>Lote adjudicado correctamente</div>
                            </div>
                            <div style={{display:"flex",gap:".45rem"}}>
                              <button
                                onClick={avanzarSiguienteLote}
                                disabled={idx >= lots.length-1}
                                style={{flex:1,padding:".5rem",background:"var(--gr)",border:"none",borderRadius:7,color:"#fff",fontSize:".78rem",fontWeight:700,cursor:"pointer",opacity:idx>=lots.length-1?.4:1}}>
                                Siguiente lote →
                              </button>
                              <button
                                onClick={revertirAdjudicacion}
                                style={{padding:".5rem .75rem",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,color:"#f87171",fontSize:".75rem",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                                ↩ Revertir
                              </button>
                            </div>
                            {idx >= lots.length-1 && (
                              <div style={{fontSize:".65rem",color:"var(--mu)",textAlign:"center"}}>Último lote — remate finalizado</div>
                            )}
                          </div>
                        )}
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
                              style={{flex:1,padding:".65rem .9rem",borderRadius:8,border:"1px solid var(--b1)",background:"var(--s2)",color:"var(--tx)",fontSize:".9rem"}}
                            />
                            <button
                              style={{padding:".65rem 1.1rem",borderRadius:8,background:"var(--ac)",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:".9rem"}}
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

                    {/* ── Quick Bid row ── */}
                    <div className="sala-quick-bids" style={{marginTop:"auto",paddingTop:".75rem"}}>
                      {getSmartIncs(item?.base||0).map((inc,i) => (
                        <button
                          key={inc}
                          className={`sala-quick-card c${i}`}
                          disabled={aState!=="live"}
                          onClick={()=>{ setCurInc(inc); placeBid(inc); }}
                          title={`Pujar con incremento ${fmtS(inc)}`}
                        >
                          <div className="sala-quick-label">Quick Bid</div>
                          <div className="sala-quick-amount">{fmtS(inc)}</div>
                        </button>
                      ))}
                    </div>

                  </div>{/* end sala-bid-card */}

                </div>{/* end sala-right-col */}
              </div>}{/* end sala-body */}
            </div>{/* end sala-wrap-new */}
          </div>
        )}

      </div>

      {/* ══ MODAL IMPORTAR EXCEL ══ */}
      {importModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}
          onClick={e=>{ if(e.target===e.currentTarget && !importSaving){ setImportModal(false); setImportRows([]); setImportDone(null); } }}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:900,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.5)",display:"flex",flexDirection:"column"}}>

            {/* Header */}
            <div style={{padding:"1.4rem 1.75rem 1rem",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div>
                <div style={{fontSize:"1.1rem",fontWeight:800,color:"#0f172a"}}>Importar lotes desde Excel</div>
                <div style={{fontSize:".78rem",color:"#6b7280",marginTop:".15rem"}}>Carga tu archivo .xlsx o .csv con los datos de los lotes</div>
              </div>
              <button onClick={()=>{ if(!importSaving){ setImportModal(false); setImportRows([]); setImportDone(null); } }}
                style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:".3rem .7rem",fontSize:".8rem",color:"#6b7280",cursor:"pointer"}}>✕ Cerrar</button>
            </div>

            <div style={{padding:"1.5rem 1.75rem",flex:1}}>

              {/* ── ESTADO: resultado final ── */}
              {importDone && (
                <div style={{textAlign:"center",padding:"2rem 1rem"}}>
                  <div style={{fontSize:"3rem",marginBottom:".75rem"}}>
                    {importDone.errors === 0 ? "✅" : "⚠️"}
                  </div>
                  <div style={{fontSize:"1.2rem",fontWeight:800,color:"#0f172a",marginBottom:".5rem"}}>
                    {importDone.ok} lote{importDone.ok!==1?"s":""} importado{importDone.ok!==1?"s":""} correctamente
                  </div>
                  {importDone.errors > 0 && (
                    <div style={{fontSize:".88rem",color:"#ef4444",marginBottom:".5rem"}}>
                      {importDone.errors} fila{importDone.errors!==1?"s":""} con errores — no fueron importadas
                    </div>
                  )}
                  <div style={{marginTop:"1.25rem",padding:"1rem 1.25rem",background:"rgba(6,182,212,.07)",border:"1px solid rgba(6,182,212,.2)",borderRadius:10,fontSize:".84rem",color:"#0f172a",lineHeight:1.6}}>
                    💡 <strong>Lotes importados.</strong> Puedes agregar fotos a cada lote desde el módulo de <strong>Lotes</strong>.
                  </div>
                  <div style={{display:"flex",gap:".75rem",justifyContent:"center",marginTop:"1.5rem"}}>
                    <button onClick={()=>{ setImportModal(false); setImportRows([]); setImportDone(null); setPage("lotes"); }}
                      style={{padding:".6rem 1.4rem",background:"#06B6D4",border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:".9rem",cursor:"pointer"}}>
                      Ir a Lotes →
                    </button>
                    <button onClick={()=>{ setImportModal(false); setImportRows([]); setImportDone(null); }}
                      style={{padding:".6rem 1.2rem",background:"none",border:"1px solid #d1d5db",borderRadius:9,color:"#6b7280",fontSize:".9rem",cursor:"pointer"}}>
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {/* ── ESTADO: preview de filas ── */}
              {!importDone && importRows.length > 0 && (
                <>
                  {/* Resumen validación */}
                  <div style={{display:"flex",gap:".75rem",marginBottom:"1rem",flexWrap:"wrap"}}>
                    <div style={{padding:".45rem .9rem",background:"rgba(20,184,166,.1)",border:"1px solid rgba(20,184,166,.25)",borderRadius:8,fontSize:".78rem",fontWeight:600,color:"#0f766e"}}>
                      ✓ {importRows.filter(r=>r.errors.length===0).length} lotes válidos
                    </div>
                    {importRows.filter(r=>r.errors.length>0).length > 0 && (
                      <div style={{padding:".45rem .9rem",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,fontSize:".78rem",fontWeight:600,color:"#dc2626"}}>
                        ✕ {importRows.filter(r=>r.errors.length>0).length} con errores (no se importarán)
                      </div>
                    )}
                  </div>

                  {/* Tabla preview */}
                  <div style={{overflowX:"auto",border:"1px solid #e5e7eb",borderRadius:10,marginBottom:"1.25rem"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:".78rem"}}>
                      <thead>
                        <tr style={{background:"#1e3a5f",color:"#fff"}}>
                          {["Fila","Nombre","Categoría","Tipo remate","Base","Comisión","Estado"].map(h=>(
                            <th key={h} style={{padding:".55rem .7rem",textAlign:"left",fontWeight:700,whiteSpace:"nowrap",fontSize:".72rem",letterSpacing:".04em"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((r, i) => (
                          <tr key={i} style={{borderTop:"1px solid #f1f5f9",background:r.errors.length>0?"#fff5f5":i%2===0?"#fff":"#f8fafc"}}>
                            <td style={{padding:".45rem .7rem",color:"#6b7280",fontWeight:600}}>{r._row}</td>
                            <td style={{padding:".45rem .7rem",maxWidth:200}}>
                              <div style={{fontWeight:600,color:"#0f172a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:180}}>{r.nombre || <span style={{color:"#ef4444",fontStyle:"italic"}}>— vacío —</span>}</div>
                              {r.exp && <div style={{fontSize:".68rem",color:"#6b7280"}}>{r.exp}</div>}
                            </td>
                            <td style={{padding:".45rem .7rem",color:"#374151"}}>{r.cat}</td>
                            <td style={{padding:".45rem .7rem"}}>
                              <span style={{padding:".15rem .5rem",borderRadius:5,fontSize:".68rem",fontWeight:700,
                                background:r.tipo==="judicial"?"rgba(6,182,212,.1)":r.tipo==="concursal"?"rgba(167,139,250,.1)":"rgba(246,173,85,.1)",
                                color:r.tipo==="judicial"?"#0891b2":r.tipo==="concursal"?"#7c3aed":"#b45309"}}>
                                {r.tipo}
                              </span>
                            </td>
                            <td style={{padding:".45rem .7rem",fontWeight:700,color:r.base?"#0f172a":"#ef4444"}}>
                              {r.base ? `$ ${r.base.toLocaleString("es-CL")}` : <span style={{fontStyle:"italic"}}>— vacío —</span>}
                            </td>
                            <td style={{padding:".45rem .7rem",color:"#374151"}}>
                              {r.com != null ? `${r.com}%` : <span style={{color:"#6b7280",fontSize:".7rem"}}>auto ({r.tipo==="concursal"?"7":"10"}%)</span>}
                            </td>
                            <td style={{padding:".45rem .7rem"}}>
                              {r.errors.length === 0
                                ? <span style={{color:"#059669",fontWeight:600,fontSize:".72rem"}}>✓ OK</span>
                                : <span style={{color:"#dc2626",fontSize:".7rem",lineHeight:1.4}}>{r.errors.join(" · ")}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Acciones */}
                  <div style={{display:"flex",gap:".75rem",justifyContent:"flex-end",alignItems:"center"}}>
                    <label style={{padding:".55rem 1rem",border:"1px solid #d1d5db",borderRadius:9,fontSize:".82rem",color:"#6b7280",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:".4rem"}}>
                      ↑ Cambiar archivo
                      <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleImportFile}/>
                    </label>
                    <button onClick={()=>{ setImportRows([]); setImportDone(null); }}
                      style={{padding:".55rem 1rem",border:"1px solid #d1d5db",borderRadius:9,fontSize:".82rem",color:"#6b7280",background:"none",cursor:"pointer"}}>
                      Cancelar
                    </button>
                    <button onClick={confirmarImport} disabled={importSaving || importRows.filter(r=>r.errors.length===0).length===0}
                      style={{padding:".55rem 1.4rem",background: importRows.filter(r=>r.errors.length===0).length===0?"#d1d5db":"#06B6D4",border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:".88rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".4rem",opacity:importSaving?.6:1}}>
                      {importSaving ? <><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/> Guardando...</> : `Confirmar importación (${importRows.filter(r=>r.errors.length===0).length} lotes) →`}
                    </button>
                  </div>
                </>
              )}

              {/* ── ESTADO: pantalla inicial ── */}
              {!importDone && importRows.length === 0 && (
                <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
                  {/* Paso 1: descargar plantilla */}
                  <div style={{padding:"1.25rem",background:"rgba(6,182,212,.05)",border:"1px solid rgba(6,182,212,.2)",borderRadius:12}}>
                    <div style={{fontWeight:700,color:"#0f172a",marginBottom:".4rem",display:"flex",alignItems:"center",gap:".5rem"}}>
                      <span style={{background:"#06B6D4",color:"#fff",borderRadius:"50%",width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:".72rem",fontWeight:800,flexShrink:0}}>1</span>
                      Descarga la plantilla (recomendado)
                    </div>
                    <div style={{fontSize:".82rem",color:"#6b7280",marginBottom:".85rem",lineHeight:1.6}}>
                      Usa nuestra plantilla Excel con las columnas correctas: nombre, expediente, mandante, categoría, precio base, comisión, tipo de remate y más.
                    </div>
                    <button onClick={descargarPlantillaExcel}
                      style={{padding:".55rem 1.2rem",background:"#06B6D4",border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:".84rem",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:".4rem"}}>
                      ⬇ Descargar plantilla .xlsx
                    </button>
                  </div>

                  {/* Paso 2: subir archivo */}
                  <div style={{padding:"1.25rem",background:"#f8fafc",border:"2px dashed #d1d5db",borderRadius:12,textAlign:"center"}}>
                    <div style={{fontWeight:700,color:"#0f172a",marginBottom:".4rem",display:"flex",alignItems:"center",justifyContent:"center",gap:".5rem"}}>
                      <span style={{background:"#1e3a5f",color:"#fff",borderRadius:"50%",width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:".72rem",fontWeight:800,flexShrink:0}}>2</span>
                      Sube tu archivo Excel o CSV
                    </div>
                    <div style={{fontSize:".8rem",color:"#9ca3af",marginBottom:"1rem"}}>Formatos aceptados: .xlsx, .xls, .csv</div>
                    <label style={{padding:".65rem 1.6rem",background:"#1e3a5f",border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:".88rem",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:".5rem"}}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 11V3M5 6l3-3 3 3"/><path d="M3 13h10"/></svg>
                      Seleccionar archivo
                      <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleImportFile}/>
                    </label>
                  </div>

                  {/* Columnas disponibles */}
                  <div style={{padding:"1rem 1.25rem",background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:10}}>
                    <div style={{fontSize:".72rem",fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".65rem"}}>Columnas de la plantilla</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:".35rem"}}>
                      {["Nombre *","Expediente","Mandante","Categoría","Año","Patente","Precio base *","Precio mínimo","Incremento","Comisión %","Tipo de remate","Descripción"].map((c,i)=>(
                        <span key={i} style={{padding:".2rem .55rem",borderRadius:5,fontSize:".7rem",fontWeight:600,
                          background:c.includes("*")?"rgba(6,182,212,.12)":"rgba(0,0,0,.05)",
                          color:c.includes("*")?"#0891b2":"#374151",
                          border:c.includes("*")?"1px solid rgba(6,182,212,.25)":"1px solid #e5e7eb"}}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <div style={{fontSize:".7rem",color:"#9ca3af",marginTop:".6rem"}}>* campos obligatorios</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

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
