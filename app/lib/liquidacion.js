// ── Calcula liquidación completa por comprador (puede tener varios lotes) ──
// Separa EX (artículos) vs AF (comisión + gastos admin), aplica IVA 19% solo a AF
// garantias: array de garantías para descontar al comprador (default vacío)
export const calcLiquidacion = (lotes, postor, gastoAdminMotorizado = 72000, garantias = []) => {
  const IVA = 0.19;
  let totalEx = 0, totalAf = 0, totalCom = 0, totalGastosAdm = 0;
  const lineas = [];
  lotes.forEach(l => {
    const afecto    = l.afectoIva || false;
    const com       = Math.round(l.monto * (l.comPct ?? 10) / 100);
    const gastosAdm = l.motorizado ? gastoAdminMotorizado : 0;
    if(afecto) { totalAf += l.monto; } else { totalEx += l.monto; }
    totalCom      += com;
    totalGastosAdm+= gastosAdm;
    totalAf       += gastosAdm;
    lineas.push({ lote:l.lote, exp:l.exp||"", monto:l.monto, com, gastosAdm, motorizado:l.motorizado, comPct:l.comPct??10, afectoIva:afecto });
  });
  const ivaBase   = totalCom + totalAf;
  const iva       = Math.round(ivaBase * IVA);
  const total     = totalEx + totalCom + totalAf + iva;
  const garantia  = postor ? (garantias.find(g=>g.postor===postor.name&&g.estado==="aprobada")?.monto||0) : 0;
  const totalAPagar = Math.max(0, total - garantia);
  return { lineas, totalEx, totalCom, totalAf, iva, total, garantia, totalAPagar };
};

export const printLiquidacion = (c, liqFecha, remateNombre) => {
  const p = c.postorData;
  const l = c.liq;
  const fmt = n => "$ " + Math.round(n).toLocaleString("es-CL");
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
  thead tr{background:#0D9488;color:#fff;}
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
  ${remateNombre || "Remate"} &nbsp;·&nbsp; Fecha: ${liqFecha}
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
  Documento generado por TAKKA · ${new Date().toLocaleDateString("es-CL")} · takka.cl
</div>

<script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`;
  const w = window.open("","_blank","width=900,height=700");
  w.document.write(html);
  w.document.close();
};
