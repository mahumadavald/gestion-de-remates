'use client'
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

// ── BRAND ─────────────────────────────────────────────────────────
const GRLogo = ({ collapsed = false }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 3C9.716 3 3 9.716 3 18s6.716 15 15 15 15-6.716 15-15S26.284 3 18 3z" fill="none"/>
      <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#2F80ED" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    </svg>
    {!collapsed && (
      <div>
        <div style={{ fontFamily:"Inter,sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#fff", letterSpacing:"-.01em", lineHeight:1 }}>GR</div>
        <div style={{ fontFamily:"Inter,sans-serif", fontWeight:400, fontSize:".6rem", color:"#5a7fa8", letterSpacing:".04em", marginTop:1 }}>Auction Software</div>
      </div>
    )}
  </div>
);

// ── DATA ──────────────────────────────────────────────────────────
const VENTAS_MES = [
  {mes:"Sep",v:92},{mes:"Oct",v:118},{mes:"Nov",v:105},
  {mes:"Dic",v:144},{mes:"Ene",v:128},{mes:"Feb",v:161},{mes:"Mar",v:185},
];
const TOP_LOTES = [
  {name:"Maquinaria",v:68},{name:"Inmuebles",v:52},{name:"Vehículos",v:41},{name:"Otros",v:24},
];
const PIE_DATA = [
  {name:"Online",v:58},{name:"Presencial",v:28},{name:"Híbrido",v:14},
];
const PIE_COLORS = ["#2F80ED","#34d399","#f6ad55"];

const REMATES = [
  {id:"R-044",name:"Remate Industrial Marzo", fecha:"06 Mar 2026",lotes:190,modal:"Híbrido",   estado:"activo", recaudado:47500000, casa:"Remates Ahumada"},
  {id:"R-043",name:"Remate Agrícola Febrero", fecha:"22 Feb 2026",lotes:87, modal:"Online",    estado:"activo", recaudado:32000000, casa:"Remates Ahumada"},
  {id:"R-042",name:"Remate Inmobiliario Feb", fecha:"15 Feb 2026",lotes:12, modal:"Presencial",estado:"activo", recaudado:105500000,casa:"Casa Demo S.A."},
  {id:"R-041",name:"Remate Industrial Enero", fecha:"18 Ene 2026",lotes:143,modal:"Híbrido",   estado:"cerrado",recaudado:89000000, casa:"Remates Ahumada"},
  {id:"R-040",name:"Remate Vehículos Enero",  fecha:"11 Ene 2026",lotes:34, modal:"Online",    estado:"cerrado",recaudado:28400000, casa:"Casa Demo S.A."},
  {id:"R-039",name:"Remate Agrícola Dic",     fecha:"14 Dic 2025",lotes:96, modal:"Presencial",estado:"cerrado",recaudado:63500000, casa:"Remates Ahumada"},
];

const LOTES = [
  {id:"L-142",name:"Toyota Hilux 2018",          cat:"Vehículo",  base:8000000, min:7000000,  com:3, estado:"publicado"},
  {id:"L-141",name:"Tractor John Deere 6130B",   cat:"Maquinaria",base:18500000,min:16000000, com:3, estado:"publicado"},
  {id:"L-140",name:"Parcela 12 Hec. Santa Cruz", cat:"Inmueble",  base:95000000,min:88000000, com:2, estado:"publicado"},
  {id:"L-139",name:"Cosechadora Case IH 8230",   cat:"Maquinaria",base:42000000,min:38000000, com:3, estado:"vendido"},
  {id:"L-138",name:"Galpon 800m2 Rancagua",      cat:"Inmueble",  base:68000000,min:62000000, com:2, estado:"vendido"},
  {id:"L-137",name:"Camioneta Ford Ranger 4x4",  cat:"Vehículo",  base:16900000,min:15000000, com:3, estado:"publicado"},
  {id:"L-136",name:"Excavadora Komatsu PC200",   cat:"Maquinaria",base:55000000,min:50000000, com:3, estado:"publicado"},
  {id:"L-135",name:"Depto 2D/1B Rancagua",       cat:"Inmueble",  base:48000000,min:44000000, com:2, estado:"sin vender"},
];

const POSTORES = [
  {id:"P-0245",nComprador:45,name:"Rodrigo Fuentes",         razonSocial:"Rodrigo Fuentes Soto",                           rut:"12.345.678-9",giro:"Particular",                  direccion:"Los Aromos 234",       comuna:"Rancagua",  email:"rfuentes@gmail.com",   tel:"+56 9 8123 4567",pujas:18,remates:4,estado:"verificado"},
  {id:"P-0318",nComprador:12,name:"Agricola Del Valle",       razonSocial:"Agricola Del Valle Ltda.",                       rut:"76.543.210-K",giro:"Agricultura y Ganaderia",     direccion:"Fundo El Recreo s/n", comuna:"Malloa",    email:"contacto@delvalle.cl", tel:"+56 9 7654 3210",pujas:34,remates:7,estado:"verificado"},
  {id:"P-0112",nComprador:7, name:"Maria I. Torres",          razonSocial:"Maria Ines Torres Lopez",                        rut:"9.876.543-2", giro:"Particular",                  direccion:"Los Veleros Casa 11",  comuna:"Rancagua",  email:"mitorresl@outlook.com",tel:"+56 9 6543 2109",pujas:11,remates:3,estado:"verificado"},
  {id:"P-0089",nComprador:33,name:"Carlos Mena",              razonSocial:"Carlos Mena Jimenez",                            rut:"15.432.109-8",giro:"Particular",                  direccion:"Av. O'Higgins 890",    comuna:"San Fernando",email:"cmena@gmail.com",     tel:"+56 9 5432 1098",pujas:6, remates:2,estado:"pendiente"},
  {id:"P-0067",nComprador:19,name:"Transportes Lagos",        razonSocial:"Empresa Transportes Lagos SpA",                  rut:"77.891.234-5",giro:"Transporte de Carga",         direccion:"Ruta 5 Sur km 82",     comuna:"Graneros",  email:"admin@tlagos.cl",      tel:"+56 9 4321 0987",pujas:22,remates:5,estado:"verificado"},
  {id:"P-0055",nComprador:19,name:"Emp. Transporte Nova",     razonSocial:"Empresa Transporte Pasajero Jose Luis Nova Orellana EIRL",rut:"77.922.655-7",giro:"Transporte de Pasajeros",direccion:"Los Veleros Casa 11",comuna:"Rancagua",email:"joselnova@gmail.com",tel:"+56 9 3210 9876",pujas:3, remates:1,estado:"verificado"},
];

const FACTURAS = [
  {id:"F-2026-041",remate:"R-041",postor:"Agricola Del Valle",lote:"Retroexcavadora CAT",monto:47500000,com:1425000,estado:"pagado",  fecha:"01 Mar 2026"},
  {id:"F-2026-040",remate:"R-040",postor:"R. Fuentes",        lote:"Parcela 8 Hec.",     monto:89000000,com:2670000,estado:"pagado",  fecha:"22 Feb 2026"},
  {id:"F-2026-039",remate:"R-039",postor:"Transportes Lagos", lote:"Camion Volvo FH460", monto:63500000,com:1905000,estado:"pendiente",fecha:"15 Feb 2026"},
  {id:"F-2026-038",remate:"R-038",postor:"Del Valle",         lote:"Tractor JD 6130B",   monto:22000000,com:660000, estado:"pagado",  fecha:"11 Feb 2026"},
  {id:"F-2026-037",remate:"R-037",postor:"C. Mena",           lote:"Toyota Hilux 2019",  monto:12400000,com:372000, estado:"vencido", fecha:"04 Feb 2026"},
];

// Datos reales basados en el flujo de rematesahumada.cl
const GARANTIAS = [
  {id:"G-0245",postor:"Rodrigo Fuentes",      rut:"12.345.678-9",email:"rfuentes@gmail.com",   tel:"+56 9 8123 4567",remate:"Remate Industrial Marzo",monto:300000,metodo:"transferencia",comprobante:"comp_245.pdf",paleta:"45",estado:"aprobada",   devolucion:null,       fecha:"02 Mar 2026"},
  {id:"G-0318",postor:"Agricola Del Valle",   rut:"76.543.210-K",email:"contacto@delvalle.cl", tel:"+56 9 7654 3210",remate:"Remate Industrial Marzo",monto:300000,metodo:"transferencia",comprobante:"comp_318.pdf",paleta:"12",estado:"aprobada",   devolucion:null,       fecha:"02 Mar 2026"},
  {id:"G-0112",postor:"Maria I. Torres",      rut:"9.876.543-2", email:"mitorresl@outlook.com",tel:"+56 9 6543 2109",remate:"Remate Industrial Marzo",monto:300000,metodo:"transferencia",comprobante:"comp_112.pdf",paleta:"07",estado:"aprobada",   devolucion:null,       fecha:"03 Mar 2026"},
  {id:"G-0089",postor:"Carlos Mena",          rut:"15.432.109-8",email:"cmena@gmail.com",       tel:"+56 9 5432 1098",remate:"Remate Industrial Marzo",monto:300000,metodo:"efectivo",    comprobante:null,          paleta:null,estado:"pendiente",  devolucion:null,       fecha:"05 Mar 2026"},
  {id:"G-0067",postor:"Transportes Lagos",    rut:"77.891.234-5",email:"admin@tlagos.cl",       tel:"+56 9 4321 0987",remate:"Remate Agricola Febrero", monto:300000,metodo:"transferencia",comprobante:"comp_067.pdf",paleta:"33",estado:"devuelta",  devolucion:"14 Feb 2026",fecha:"20 Feb 2026"},
  {id:"G-0055",postor:"Juan P. Sandoval",     rut:"18.765.432-1",email:"jpsandoval@gmail.com",  tel:"+56 9 3210 9876",remate:"Remate Agricola Febrero", monto:300000,metodo:"transferencia",comprobante:"comp_055.pdf",paleta:"19",estado:"devuelta",  devolucion:"14 Feb 2026",fecha:"21 Feb 2026"},
];

// Lotes reales del sitio rematesahumada.cl (formato expediente)
// Comisiones por tipo de remate
const COMISIONES = {
  judicial:   { label:"Judicial",            com: 3,   desc:"Remate por orden judicial. Comision fija 3%." },
  concursal:  { label:"Concursal",           com: 2.5, desc:"Liquidacion concursal. Comision 2.5%." },
  privado:    { label:"Privado",             com: 5,   desc:"Remate privado. Comision configurable." },
};
const GASTO_ADMIN_MOTORIZADO = 50000; // CLP — solo vehículos motorizados

const LOTES_REALES = [
  {id:"L-E61",  exp:"E-61-2025",   mandante:"Tanner Servicios Financieros S.A.",propietario:"Figueroa",        name:"JAC JS3 1.6",                          cat:"Vehiculo",  year:2022,base:4500000, min:4000000, com:3,   tipoRemate:"judicial",  motorizado:true,  estado:"publicado",patente:"FKRP-45"},
  {id:"L-E3039",exp:"E-3039-2025", mandante:"Tanner Servicios Financieros S.A.",propietario:"Vega",            name:"Hyundai Santa Fe 2.4",                  cat:"Vehiculo",  year:2019,base:9800000, min:8500000, com:3,   tipoRemate:"judicial",  motorizado:true,  estado:"publicado",patente:"JZXF-12"},
  {id:"L-20543",exp:"20-543-K-2021",mandante:"Judicial",                        propietario:"Faunes Jimenez",  name:"Hyundai Accent RB GL 1.4",              cat:"Vehiculo",  year:2018,base:5200000, min:4500000, com:3,   tipoRemate:"judicial",  motorizado:true,  estado:"publicado",patente:"BKRL-89"},
  {id:"L-NK01", exp:"NK-01-2026",  mandante:"Particular",                       propietario:"",               name:"Nissan Kicks",                          cat:"Vehiculo",  year:2021,base:8900000, min:8000000, com:5,   tipoRemate:"privado",   motorizado:true,  estado:"publicado",patente:"HKPZ-33"},
  {id:"L-P315", exp:"P-315-2026",  mandante:"Particular",                       propietario:"",               name:"Parcela 315 — Altos de Coinco VI Region",cat:"Inmueble",  year:null,base:42000000,min:38000000, com:2.5, tipoRemate:"concursal", motorizado:false, estado:"publicado",patente:null},
  {id:"L-C1537",exp:"C-1537-2025", mandante:"Judicial",                         propietario:"Vallejos Moro",  name:"Enseres Varios — Hogar",                cat:"Enseres",   year:null,base:1200000, min:900000,  com:3,   tipoRemate:"judicial",  motorizado:false, estado:"publicado",patente:null},
  {id:"L-C2502",exp:"C-2502-2024", mandante:"Judicial",                         propietario:"Arenas Bustamante",name:"Enseres Varios — Oficina",             cat:"Enseres",   year:null,base:850000,  min:650000,  com:3,   tipoRemate:"judicial",  motorizado:false, estado:"publicado",patente:null},
  {id:"L-C916", exp:"C-916-2025",  mandante:"Judicial",                         propietario:"Droguett Navarro",name:"Enseres Varios — Electrodomesticos",    cat:"Enseres",   year:null,base:780000,  min:600000,  com:3,   tipoRemate:"judicial",  motorizado:false, estado:"publicado",patente:null},
];

// Adjudicaciones post-remate
const ADJUDICACIONES = [
  {id:"A-001",postor:"Rodrigo Fuentes",   rut:"12.345.678-9",lote:"Hyundai Santa Fe 2.4",monto:10500000,garantia:300000,saldo:10200000,estado:"saldo pendiente",retiro:null,      fecha:"06 Mar 2026"},
  {id:"A-002",postor:"Agricola Del Valle",rut:"76.543.210-K",lote:"Tractor John Deere",  monto:21000000,garantia:300000,saldo:20700000,estado:"pagado",          retiro:"10 Mar 2026",fecha:"06 Mar 2026"},
  {id:"A-003",postor:"Maria I. Torres",   rut:"9.876.543-2", lote:"Parcela 12 Hec.",     monto:98000000,garantia:300000,saldo:97700000,estado:"saldo pendiente",retiro:null,      fecha:"06 Mar 2026"},
];

const LOTES_SALA = [
  {id:1,name:"Tractor John Deere 6130B",         cat:"Maquinaria",year:2018,base:18500000,img:null,desc:"3.200 hrs, cabina climatizada, doble traccion.",      inc:500000 },
  {id:2,name:"Parcela 12 Hec. Santa Cruz",        cat:"Inmueble",  year:null,base:95000000,img:null,desc:"Tierra agricola, riego asegurado, escrituras al dia.",inc:2000000},
  {id:3,name:"Cosechadora Case IH 8230",          cat:"Maquinaria",year:2016,base:42000000,img:null,desc:"Motor 354 HP, cabezal 30 pies incluido.",             inc:1000000},
  {id:4,name:"Camioneta Ford Ranger XLT",         cat:"Vehiculo",  year:2021,base:16900000,img:null,desc:"Diesel 3.2L, 72.000 km, unico dueno.",                inc:300000 },
  {id:5,name:"Galpon Industrial 800m2",           cat:"Inmueble",  year:2010,base:68000000,img:null,desc:"Estructura metalica, 3 fases, permiso vigente.",      inc:1500000},
];

const INC_OPTIONS = [100000,200000,300000,500000,750000,1000000,1500000,2000000,3000000,5000000];
const BID_TIMER   = 12;
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

// ── CSS ───────────────────────────────────────────────────────────
const CSS = `
${FONT}
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#070f1c;
  --s1:#0b1f38;
  --s2:#0f2847;
  --s3:#122e52;
  --b1:#1a3a5c;
  --b2:#1e4570;
  --ac:#2F80ED;
  --acH:#4a94f5;
  --acD:#1a5fb8;
  --wh:#ffffff;
  --wh2:#e8f0fe;
  --mu:#5a7fa8;
  --mu2:#7a9fc8;
  --gr:#22d3a0;
  --rd:#f56565;
  --yl:#f6ad55;
}
html,body{height:100%;background:var(--bg);color:var(--wh2);font-family:'Inter',sans-serif;overflow:hidden;font-size:14px;}
button,input,select{font-family:'Inter',sans-serif;}

/* ── APP SHELL ── */
.app{display:flex;height:100vh;overflow:hidden;}

/* ── SIDEBAR ── */
.sidebar{width:224px;background:var(--s1);border-right:1px solid var(--b1);display:flex;flex-direction:column;flex-shrink:0;}
.sb-logo{padding:1.1rem 1.2rem 1rem;border-bottom:1px solid var(--b1);display:flex;align-items:center;}
.sb-section{padding:.75rem 1.2rem .3rem;font-size:.65rem;font-weight:600;letter-spacing:.09em;color:var(--mu);text-transform:uppercase;}
.sb-item{display:flex;align-items:center;gap:.65rem;padding:.5rem 1rem;margin:.05rem .6rem;border-radius:7px;cursor:pointer;transition:all .15s;color:var(--mu2);font-size:.82rem;font-weight:500;}
.sb-item:hover{background:rgba(47,128,237,.08);color:var(--wh2);}
.sb-item.on{background:rgba(47,128,237,.15);color:var(--ac);}
.sb-icon{width:17px;text-align:center;flex-shrink:0;opacity:.7;}
.sb-item.on .sb-icon{opacity:1;}
.sb-badge{margin-left:auto;background:var(--ac);color:#fff;font-size:.6rem;padding:.1rem .42rem;border-radius:10px;font-weight:700;}
.sb-footer{margin-top:auto;padding:.85rem 1rem;border-top:1px solid var(--b1);}
.sb-user{display:flex;align-items:center;gap:.6rem;}
.sb-ava{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--ac),var(--acH));display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#fff;flex-shrink:0;}
.sb-uname{font-size:.78rem;font-weight:600;color:var(--wh2);line-height:1.25;}
.sb-urole{font-size:.65rem;color:var(--mu);}

/* ── MAIN ── */
.main-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 1.6rem;height:52px;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0;}
.topbar-left{display:flex;align-items:center;gap:.8rem;}
.topbar-title{font-size:.95rem;font-weight:700;color:var(--wh);}
.topbar-right{display:flex;align-items:center;gap:.75rem;}
.tb-live{display:flex;align-items:center;gap:.4rem;padding:.25rem .7rem;border-radius:5px;background:rgba(34,211,160,.1);border:1px solid rgba(34,211,160,.25);font-size:.7rem;font-weight:600;color:var(--gr);}
.ldot{width:6px;height:6px;border-radius:50%;background:var(--gr);box-shadow:0 0 6px var(--gr);animation:pu 1.8s infinite;}
@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}

/* BUTTONS */
.btn-primary{padding:.4rem 1rem;background:var(--ac);border:none;border-radius:6px;font-size:.76rem;font-weight:600;color:#fff;cursor:pointer;transition:all .15s;}
.btn-primary:hover{background:var(--acH);transform:translateY(-1px);}
.btn-sec{padding:.38rem .9rem;background:transparent;border:1px solid var(--b2);border-radius:6px;font-size:.74rem;font-weight:500;color:var(--mu2);cursor:pointer;transition:all .15s;}
.btn-sec:hover{border-color:var(--ac);color:var(--ac);}
.btn-cancel{padding:.5rem .9rem;border:1px solid var(--b1);background:transparent;color:var(--mu);border-radius:6px;font-size:.76rem;font-weight:500;cursor:pointer;transition:all .15s;}
.btn-cancel:hover{border-color:var(--rd);color:var(--rd);}
.btn-confirm{padding:.5rem 1.1rem;background:var(--ac);border:none;border-radius:6px;font-size:.76rem;font-weight:600;color:#fff;cursor:pointer;transition:background .15s;}
.btn-confirm:hover{background:var(--acH);}

/* PAGE */
.page{flex:1;overflow-y:auto;padding:1.4rem 1.6rem;}

/* NOTIF */
.notif{position:fixed;top:62px;right:1.4rem;z-index:999;padding:.55rem 1.2rem;border-radius:7px;font-size:.75rem;font-weight:600;animation:si .2s ease;}
.notif.ok  {background:rgba(34,211,160,.12);border:1px solid rgba(34,211,160,.35);color:var(--gr);}
.notif.sold{background:rgba(47,128,237,.14);border:1px solid rgba(47,128,237,.38);color:var(--ac);}
.notif.inf {background:rgba(47,128,237,.12);border:1px solid rgba(47,128,237,.3);color:var(--acH);}
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
.table-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;overflow:hidden;margin-bottom:1rem;}
.table-head{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1.2rem;border-bottom:1px solid var(--b1);}
.table-title{font-size:.76rem;font-weight:700;color:var(--wh);}
.filter-row{display:flex;gap:.35rem;}
.filter-btn{padding:.2rem .6rem;background:transparent;border:1px solid var(--b1);border-radius:5px;font-size:.68rem;font-weight:500;color:var(--mu);cursor:pointer;transition:all .15s;text-transform:capitalize;}
.filter-btn.on{border-color:var(--ac);color:var(--ac);background:rgba(47,128,237,.08);}
.filter-btn:hover:not(.on){border-color:var(--b2);color:var(--mu2);}
table{width:100%;border-collapse:collapse;}
th{padding:.5rem 1.2rem;text-align:left;font-size:.67rem;font-weight:600;letter-spacing:.04em;color:var(--mu);text-transform:uppercase;border-bottom:1px solid var(--b1);background:rgba(255,255,255,.01);}
td{padding:.7rem 1.2rem;font-size:.78rem;border-bottom:1px solid rgba(26,58,92,.5);vertical-align:middle;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:rgba(47,128,237,.04);}
.mono{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--mu2);}
.gt{color:var(--ac);font-family:'DM Mono',monospace;font-size:.75rem;font-weight:500;}
.pill{display:inline-flex;align-items:center;gap:.22rem;padding:.12rem .52rem;border-radius:12px;font-size:.66rem;font-weight:600;white-space:nowrap;}
.p-activo   {background:rgba(47,128,237,.12);color:var(--ac);border:1px solid rgba(47,128,237,.28);}
.p-cerrado  {background:rgba(90,127,168,.1); color:var(--mu2);border:1px solid var(--b1);}
.p-publicado{background:rgba(34,211,160,.1); color:var(--gr);border:1px solid rgba(34,211,160,.25);}
.p-vendido  {background:rgba(47,128,237,.12);color:var(--ac);border:1px solid rgba(47,128,237,.28);}
.p-sinvender{background:rgba(245,101,101,.1);color:var(--rd);border:1px solid rgba(245,101,101,.28);}
.p-pagado   {background:rgba(34,211,160,.1); color:var(--gr);border:1px solid rgba(34,211,160,.25);}
.p-pendiente{background:rgba(246,173,85,.1); color:var(--yl);border:1px solid rgba(246,173,85,.25);}
.p-vencido  {background:rgba(245,101,101,.1);color:var(--rd);border:1px solid rgba(245,101,101,.28);}
.p-verificado{background:rgba(34,211,160,.1);color:var(--gr);border:1px solid rgba(34,211,160,.25);}

/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem;}
.modal{background:var(--s2);border:1px solid var(--b2);border-radius:12px;padding:1.7rem;width:100%;max-width:460px;box-shadow:0 24px 60px rgba(0,0,0,.6);}
.modal.wide{max-width:720px;}
.modal-title{font-size:1.05rem;font-weight:800;color:var(--wh);margin-bottom:1.25rem;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;}
.fg{margin-bottom:.0;}
.fg.full{grid-column:1/-1;}
.fl{display:block;font-size:.68rem;font-weight:600;color:var(--mu2);margin-bottom:.26rem;letter-spacing:.01em;}
.fi{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--b2);border-radius:7px;color:var(--wh2);font-size:.82rem;padding:.55rem .78rem;transition:border-color .15s;}
.fi:focus{outline:none;border-color:var(--ac);background:rgba(47,128,237,.05);}
.fi::placeholder{color:var(--mu);}
.fsel{width:100%;background:#0b1f38;border:1px solid var(--b2);border-radius:7px;color:var(--wh2);font-size:.82rem;padding:.55rem .78rem;cursor:pointer;}
.fsel:focus{outline:none;border-color:var(--ac);}
.modal-actions{display:flex;gap:.6rem;margin-top:1.2rem;}
/* Lote wizard steps */
.wiz-steps{display:flex;gap:0;margin-bottom:1.4rem;border-bottom:1px solid var(--b1);padding-bottom:1rem;}
.wiz-step{display:flex;align-items:center;gap:.45rem;font-size:.7rem;font-weight:600;color:var(--mu);padding:.25rem .5rem;border-radius:6px;cursor:default;transition:all .15s;flex:1;justify-content:center;}
.wiz-step.on{color:var(--ac);background:rgba(47,128,237,.08);}
.wiz-step.done{color:var(--gr);}
.wiz-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;background:var(--b1);color:var(--mu);flex-shrink:0;}
.wiz-step.on .wiz-num{background:var(--ac);color:#fff;}
.wiz-step.done .wiz-num{background:var(--gr);color:#0b1f38;}
/* Tipo selector grande */
.tipo-sel{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1rem;}
.tipo-opt{padding:.75rem .5rem;border-radius:9px;border:1px solid var(--b1);background:transparent;cursor:pointer;text-align:center;transition:all .15s;color:var(--mu);font-size:.72rem;font-weight:600;}
.tipo-opt:hover{border-color:var(--b2);color:var(--mu2);}
.tipo-opt.on{border-color:var(--ac);background:rgba(47,128,237,.1);color:var(--ac);}
.tipo-opt-icon{font-size:1.3rem;margin-bottom:.3rem;display:block;}
/* Foto upload grid */
.foto-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:.8rem;}
.foto-slot{aspect-ratio:1;border-radius:9px;border:1px dashed var(--b2);background:rgba(255,255,255,.02);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;cursor:pointer;transition:all .15s;position:relative;overflow:hidden;font-size:.62rem;color:var(--mu);font-weight:600;text-align:center;}
.foto-slot:hover{border-color:var(--ac);background:rgba(47,128,237,.05);color:var(--ac);}
.foto-slot.filled{border-color:var(--ac);border-style:solid;}
.foto-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;}
.foto-label{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.7);font-size:.6rem;padding:.2rem;text-align:center;color:#fff;}
/* Items dinámicos */
.item-card{background:rgba(255,255,255,.025);border:1px solid var(--b1);border-radius:8px;padding:.7rem .85rem;display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem;}
.doc-card{background:rgba(246,173,85,.04);border:1px solid rgba(246,173,85,.15);border-radius:8px;padding:.6rem .85rem;display:flex;align-items:center;gap:.6rem;margin-bottom:.35rem;}
.add-btn-row{border:1px dashed var(--b2);border-radius:8px;padding:.5rem;display:flex;align-items:center;justify-content:center;gap:.4rem;cursor:pointer;color:var(--mu);font-size:.72rem;font-weight:600;transition:all .15s;margin-top:.3rem;}
.add-btn-row:hover{border-color:var(--ac);color:var(--ac);background:rgba(47,128,237,.04);}

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

/* ── SALA EN VIVO ── */
.sala-wrap{display:grid;grid-template-columns:240px 1fr 260px;height:calc(100vh - 52px);overflow:hidden;}
.sala-sb{background:var(--s1);border-right:1px solid var(--b1);overflow-y:auto;display:flex;flex-direction:column;}
.sala-sbh{padding:.7rem 1rem;font-size:.68rem;font-weight:700;color:var(--wh2);border-bottom:1px solid var(--b1);letter-spacing:.02em;}
.lc{padding:.65rem .9rem;border-bottom:1px solid rgba(26,58,92,.4);cursor:pointer;transition:background .15s;}
.lc:hover{background:rgba(47,128,237,.06);}
.lc.on{background:rgba(47,128,237,.1);border-left:3px solid var(--ac);}
.lth{width:100%;height:74px;border-radius:6px;object-fit:cover;margin-bottom:.38rem;border:1px solid var(--b2);}
.lph{width:100%;height:74px;border-radius:6px;background:var(--s3);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;margin-bottom:.38rem;font-size:.7rem;font-weight:500;color:var(--mu);}
.ln{font-size:.62rem;font-weight:600;color:var(--mu);letter-spacing:.04em;text-transform:uppercase;margin-bottom:.12rem;}
.lnm{font-size:.78rem;font-weight:600;color:var(--wh2);line-height:1.3;margin-bottom:.25rem;}
.lpr{font-family:'DM Mono',monospace;font-size:.74rem;color:var(--ac);font-weight:500;}
.lbdg{display:inline-block;padding:.07rem .36rem;border-radius:4px;font-size:.6rem;font-weight:600;margin-top:.2rem;}
.blv{background:rgba(34,211,160,.1);color:var(--gr);}
.bsd{background:rgba(47,128,237,.12);color:var(--ac);}
.bwt{background:rgba(90,127,168,.07);color:var(--mu);}
.sala-main{padding:1.2rem 1.5rem;display:flex;flex-direction:column;gap:.95rem;overflow-y:auto;}
.pz{position:relative;width:100%;height:215px;border-radius:10px;overflow:hidden;background:var(--s3);border:1px solid var(--b2);}
.pzimg{width:100%;height:100%;object-fit:cover;}
.pzph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;cursor:pointer;transition:background .2s;}
.pzph:hover{background:rgba(47,128,237,.05);}
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
.bap.flash{color:var(--acH)!important;text-shadow:0 0 20px rgba(47,128,237,.5);}
.banl{font-size:.73rem;color:var(--mu);margin-bottom:.88rem;}
.banl span{color:var(--wh2);font-weight:600;}

/* BID RING */
.bid-ring-wrap{display:flex;align-items:center;gap:.85rem;margin-bottom:.88rem;padding:.75rem;background:rgba(47,128,237,.06);border:1px solid rgba(47,128,237,.18);border-radius:8px;}
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
.bb:hover:not(:disabled){background:var(--acH);transform:translateY(-2px);box-shadow:0 6px 20px rgba(47,128,237,.35);}
.bb:disabled{opacity:.22;cursor:not-allowed;}
.bb.sold{background:transparent;color:var(--ac);border:1px solid rgba(47,128,237,.3);}
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
.fda{font-family:'DM Mono',monospace;font-size:.78rem;font-weight:500;color:var(--ac);}
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
.asel{width:100%;background:#0b1f38;border:1px solid var(--b2);border-radius:7px;color:var(--wh2);font-size:.8rem;padding:.5rem .75rem;cursor:pointer;margin-bottom:.7rem;}
.asel:focus{outline:none;border-color:var(--ac);}
.inc-ctrl{background:rgba(47,128,237,.05);border:1px solid rgba(47,128,237,.15);border-radius:8px;padding:.85rem;margin-bottom:.7rem;}
.inc-title{font-size:.65rem;font-weight:700;color:var(--ac);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;}
.inc-cur-lbl{font-size:.64rem;font-weight:500;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.18rem;}
.inc-cur{font-size:1.4rem;font-weight:800;color:var(--wh);letter-spacing:-.01em;margin-bottom:.45rem;}
.inc-btns{display:flex;flex-wrap:wrap;gap:.28rem;}
.inc-btn{padding:.26rem .56rem;border-radius:5px;border:1px solid var(--b1);background:transparent;font-size:.66rem;font-weight:500;color:var(--mu);cursor:pointer;transition:all .15s;}
.inc-btn:hover{border-color:var(--ac);color:var(--ac);}
.inc-btn.on{background:rgba(47,128,237,.15);border-color:var(--ac);color:var(--ac);font-weight:700;}
.ab-list{display:flex;flex-direction:column;gap:.33rem;}
.ab{padding:.58rem .9rem;border-radius:7px;border:none;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s;}
.ab:disabled{opacity:.22;cursor:not-allowed;}
.ab.g{background:rgba(34,211,160,.1);color:var(--gr);border:1px solid rgba(34,211,160,.25);}
.ab.g:hover:not(:disabled){background:rgba(34,211,160,.18);}
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
.bid-ticker{margin-top:.65rem;background:rgba(47,128,237,.06);border:1px solid rgba(47,128,237,.18);border-radius:7px;padding:.6rem;display:flex;align-items:center;gap:.55rem;}
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
.gar-info{background:rgba(47,128,237,.07);border:1px solid rgba(47,128,237,.2);border-radius:8px;padding:.75rem 1rem;margin-bottom:1.1rem;display:flex;align-items:flex-start;gap:.65rem;}
.gar-info-text{font-size:.76rem;color:var(--mu2);line-height:1.55;}
.gar-info-text strong{color:var(--wh2);}
.paleta-badge{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;background:var(--ac);color:#fff;font-size:.82rem;font-weight:800;flex-shrink:0;}
.paleta-none{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;background:var(--s3);color:var(--mu);font-size:.65rem;border:1px dashed var(--b2);flex-shrink:0;}
.p-aprobada{background:rgba(34,211,160,.1);color:var(--gr);border:1px solid rgba(34,211,160,.25);}
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
.p-pagado{background:rgba(34,211,160,.1);color:var(--gr);border:1px solid rgba(34,211,160,.25);}
.exp-badge{display:inline-block;padding:.08rem .42rem;background:rgba(255,255,255,.04);border:1px solid var(--b1);border-radius:4px;font-family:'DM Mono',monospace;font-size:.62rem;color:var(--mu2);}
.role-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .6rem;border-radius:4px;font-size:.65rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
.role-badge.admin{background:rgba(246,173,85,.12);color:#f6ad55;border:1px solid rgba(246,173,85,.25);}
.role-badge.martillero{background:rgba(47,128,237,.12);color:#2F80ED;border:1px solid rgba(47,128,237,.25);}
.role-badge.comprador{background:rgba(34,211,160,.1);color:#22d3a0;border:1px solid rgba(34,211,160,.22);}

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
.sent-badge{display:inline-flex;align-items:center;gap:.28rem;padding:.18rem .55rem;border-radius:4px;font-size:.66rem;font-weight:600;background:rgba(34,211,160,.08);color:var(--gr);border:1px solid rgba(34,211,160,.22);}

/* DEVOLUCIONES */
.dev-card{background:var(--s2);border:1px solid var(--b1);border-radius:10px;padding:1rem 1.2rem;margin-bottom:.6rem;display:grid;grid-template-columns:1fr auto;gap:.9rem;align-items:center;}
.dev-name{font-size:.86rem;font-weight:700;color:var(--wh);margin-bottom:.1rem;}
.dev-sub{font-size:.72rem;color:var(--mu2);}
.dev-monto{font-family:'DM Mono',monospace;font-size:1rem;font-weight:700;color:var(--gr);margin-top:.15rem;}
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
.mod-tab.on{background:rgba(47,128,237,.15);border-color:var(--ac);color:var(--ac);}
.mod-tab:hover:not(.on){border-color:var(--b2);color:var(--mu2);}
`;


// ── TOOLTIP ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="ctt"><div style={{color:"var(--mu)",marginBottom:".15rem",fontSize:".65rem"}}>{label}</div><div style={{color:"var(--ac)",fontWeight:700}}>{payload[0].value >= 10 ? `$${payload[0].value}M` : payload[0].value}</div></div>;
};

// ── BID RING ──────────────────────────────────────────────────────
const BidRing = ({ seconds, total, nextAmount, increment }) => {
  const r = 20, circ = 2 * Math.PI * r, offset = circ * (1 - seconds / total);
  const color = seconds > 6 ? "#22d3a0" : seconds > 3 ? "#f6ad55" : "#f56565";
  return (
    <div className="bid-ring-wrap">
      <div className="bid-ring-outer">
        <svg className="bid-ring-svg" width="52" height="52" viewBox="0 0 52 52">
          <circle className="bid-ring-bg" cx="26" cy="26" r={r}/>
          <circle className="bid-ring-fill" cx="26" cy="26" r={r} stroke={color} strokeDasharray={circ} strokeDashoffset={offset}/>
        </svg>
        <div className="bid-ring-num" style={{color}}>{seconds}</div>
      </div>
      <div style={{flex:1}}>
        <div className="bid-ring-label">Proxima puja en</div>
        <div className="bid-ring-next">{fmt(nextAmount)}</div>
        <div className="bid-ring-inc">Incremento: +{fmtS(increment)}</div>
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
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh;
    background: #070f1c;
    display: flex;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Animated background grid */
  .auth-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(47,128,237,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(47,128,237,.04) 1px, transparent 1px);
    background-size: 48px 48px;
    animation: gridShift 20s linear infinite;
    pointer-events: none;
  }
  @keyframes gridShift { from{background-position:0 0} to{background-position:48px 48px} }

  /* Glow orb */
  .auth-root::after {
    content: '';
    position: absolute;
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(47,128,237,.12) 0%, transparent 70%);
    top: -200px; right: -100px;
    border-radius: 50%;
    pointer-events: none;
    animation: pulse 6s ease-in-out infinite alternate;
  }
  @keyframes pulse { from{opacity:.6; transform:scale(1)} to{opacity:1; transform:scale(1.12)} }

  /* Left branding panel */
  .auth-left {
    flex: 1;
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
    background: rgba(47,128,237,.12);
    border: 1px solid rgba(47,128,237,.3);
    border-radius: 4px;
    font-size: .68rem;
    font-weight: 600;
    color: #2F80ED;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-bottom: 2.5rem;
    width: fit-content;
  }
  .auth-left-tag-dot { width: 5px; height: 5px; background: #2F80ED; border-radius: 50%; animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  .auth-brand-title {
    font-family: 'Syne', sans-serif;
    font-size: 3.6rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    letter-spacing: -.03em;
    margin-bottom: .6rem;
  }
  .auth-brand-title span { color: #2F80ED; }
  .auth-brand-sub {
    font-size: 1.05rem;
    color: #4a6a8a;
    font-weight: 400;
    margin-bottom: 3.5rem;
    line-height: 1.5;
  }

  .auth-features { display: flex; flex-direction: column; gap: .75rem; }
  .auth-feat {
    display: flex; align-items: center; gap: .75rem;
    padding: .65rem .9rem;
    background: rgba(255,255,255,.02);
    border: 1px solid rgba(255,255,255,.05);
    border-radius: 8px;
    font-size: .82rem; color: #5a7fa8;
    transition: all .2s;
  }
  .auth-feat:hover { background: rgba(47,128,237,.06); border-color: rgba(47,128,237,.2); color: #8ab4d4; }
  .auth-feat-icon { color: #2F80ED; flex-shrink: 0; }

  /* Right form panel */
  .auth-right {
    width: 480px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3rem;
    position: relative;
    z-index: 1;
    border-left: 1px solid rgba(255,255,255,.05);
    background: rgba(11,31,56,.4);
    backdrop-filter: blur(20px);
  }

  .auth-form-wrap {
    animation: slideUp .35s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

  .auth-form-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.65rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: .3rem;
  }
  .auth-form-sub { font-size: .8rem; color: #4a6a8a; margin-bottom: 2.2rem; line-height: 1.5; }

  /* Role selector */
  .role-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .4rem;
    margin-bottom: 2rem;
    padding: .3rem;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.07);
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
    background: rgba(47,128,237,.15);
    box-shadow: 0 0 0 1px rgba(47,128,237,.35);
  }
  .role-tab-icon { display:flex; align-items:center; justify-content:center; color: #4a6a8a; transition: color .18s; }
  .role-tab.active .role-tab-icon { color: #2F80ED; }
  .role-tab-label { font-size: .62rem; font-weight: 600; color: #4a6a8a; letter-spacing: .03em; text-transform: uppercase; transition: color .18s; }
  .role-tab.active .role-tab-label { color: #2F80ED; }

  /* Form fields */
  .auth-field { margin-bottom: 1.1rem; }
  .auth-label { display: block; font-size: .7rem; font-weight: 600; color: #4a6a8a; letter-spacing: .05em; text-transform: uppercase; margin-bottom: .45rem; }
  .auth-input {
    width: 100%;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    color: #e0eaf4;
    font-size: .88rem;
    font-family: 'Inter', sans-serif;
    padding: .75rem 1rem;
    transition: all .18s;
    outline: none;
  }
  .auth-input:focus { border-color: #2F80ED; background: rgba(47,128,237,.06); box-shadow: 0 0 0 3px rgba(47,128,237,.1); }
  .auth-input::placeholder { color: #2a4a6a; }
  .auth-input.mono { font-family: 'DM Mono', monospace; font-size: .95rem; letter-spacing: .12em; text-transform: uppercase; }
  .auth-input.error { border-color: #e05252; background: rgba(224,82,82,.05); }

  .auth-error {
    padding: .65rem .9rem;
    background: rgba(224,82,82,.08);
    border: 1px solid rgba(224,82,82,.25);
    border-radius: 7px;
    font-size: .77rem;
    color: #f08080;
    margin-bottom: 1.1rem;
    animation: shake .3s ease;
  }
  @keyframes shake { 0%,100%{transform:none} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

  .auth-submit {
    width: 100%;
    padding: .85rem;
    background: #2F80ED;
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
  .auth-submit:hover { background: #1a6fd4; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(47,128,237,.35); }
  .auth-submit:active { transform: none; }
  .auth-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  .auth-hint {
    margin-top: 1.5rem;
    padding: .75rem .9rem;
    background: rgba(47,128,237,.06);
    border: 1px solid rgba(47,128,237,.15);
    border-radius: 7px;
    font-size: .72rem;
    color: #4a6a8a;
    line-height: 1.55;
  }
  .auth-hint strong { color: #5a8ab0; }

  /* Buyer token view */
  .buyer-info {
    padding: 1rem;
    background: rgba(34,211,160,.06);
    border: 1px solid rgba(34,211,160,.2);
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
  .role-badge.martillero{ background: rgba(47,128,237,.12); color: #2F80ED; border: 1px solid rgba(47,128,237,.25); }
  .role-badge.comprador { background: rgba(34,211,160,.1);  color: #22d3a0; border: 1px solid rgba(34,211,160,.22); }

  @media (max-width: 900px) {
    .auth-left { display: none; }
    .auth-right { width: 100%; border-left: none; }
  }
`;

function AuthScreen({ onLogin }) {
  const [role,     setRole]     = useState("martillero"); // admin | martillero | comprador
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [token,    setToken]    = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const roleConfig = {
    admin:      { label:"Admin",      icon:<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8.5" cy="8.5" r="2.2"/><path d="M8.5 1v2M8.5 14v2M1 8.5h2M14 8.5h2M3.1 3.1l1.4 1.4M12.5 12.5l1.4 1.4M3.1 13.9l1.4-1.4M12.5 4.5l1.4-1.4"/></svg>,  title:"Acceso administrador",  sub:"Panel de control GR Auction Software. Gestion de clientes y configuracion global." },
    martillero: { label:"Martillero", icon:<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14l8-8"/><path d="M9 3l2 2-6 6-2-2z"/><path d="M12 2l3 3-1.5 1.5"/></svg>,  title:"Acceso casa de remates", sub:"Gestiona tus remates, lotes, postores y liquidaciones post-remate." },
    comprador:  { label:"Postor",     icon:<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="13" height="9" rx="1.5"/><path d="M5 5V4a3.5 3.5 0 017 0v1"/><path d="M8.5 9v2"/></svg>,  title:"Acceso postor",          sub:"Entra con tu codigo de paleta asignado al inscribirte en la casa de remates." },
  };

  const handleLogin = () => {
    setError(""); setLoading(true);
    setTimeout(() => {
      if (role === "comprador") {
        const paleta = PALETAS_ACTIVAS.find(p => p.token.toUpperCase() === token.trim().toUpperCase());
        if (!paleta) { setError("Codigo de paleta no encontrado o no activo."); setLoading(false); return; }
        onLogin({ role:"comprador", name:paleta.nombre, rut:paleta.rut, casa:paleta.casa, casaNombre:paleta.casaNombre, token:paleta.token });
      } else {
        const user = USERS.find(u => u.email === email.trim() && u.password === password && u.role === role);
        if (!user) { setError("Credenciales incorrectas. Verifica tu correo y contraseña."); setLoading(false); return; }
        onLogin(user);
      }
      setLoading(false);
    }, 700);
  };

  const cfg = roleConfig[role];

  return (
    <div className="auth-root">
      <style>{AUTH_CSS}</style>

      {/* Left branding */}
      <div className="auth-left">
        {/* GR Logo — full size version */}
        <div style={{display:"flex",alignItems:"center",gap:"18px",marginBottom:"1.5rem"}}>
          <svg width="64" height="64" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="rgba(47,128,237,.1)" stroke="rgba(47,128,237,.25)" strokeWidth="1"/>
            <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#2F80ED" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{fontFamily:"Inter,sans-serif",fontWeight:400,fontSize:".85rem",color:"#4a6a8a",letterSpacing:".12em",textTransform:"uppercase",marginTop:2}}>Auction Software</div>
        </div>

        <div className="auth-brand-sub">La plataforma que moderniza<br/>los remates en Chile.</div>
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
        <div className="auth-form-wrap" key={role}>
          {/* Logo en vez de título de texto */}
          <div style={{marginBottom:"2rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:".6rem"}}>
              <svg width="52" height="52" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="8" fill="rgba(47,128,237,.1)" stroke="rgba(47,128,237,.2)" strokeWidth="1"/>
                <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#2F80ED" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M4 12 Q4 5 12 5 L20 5" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              </svg>
              <div style={{fontFamily:"Inter,sans-serif",fontWeight:400,fontSize:".72rem",color:"#4a6a8a",letterSpacing:".12em",textTransform:"uppercase"}}>Auction Software</div>
            </div>
            <div style={{fontSize:".8rem",color:"#4a6a8a",lineHeight:1.5}}>{cfg.sub}</div>
          </div>

          {/* Role selector */}
          <div className="role-tabs">
            {Object.entries(roleConfig).map(([k,v]) => (
              <button key={k} className={`role-tab${role===k?" active":""}`} onClick={()=>{setRole(k);setError("");}}>
                <span className="role-tab-icon">{v.icon}</span>
                <span className="role-tab-label">{v.label}</span>
              </button>
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          {role !== "comprador" ? (
            <>
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
              <div className="auth-hint">
                <strong>Demo Admin:</strong> admin@grauction.cl / admin2026<br/>
                <strong>Demo Martillero:</strong> martillero@rematesahumada.cl / remates2026
              </div>
            </>
          ) : (
            <>
              <div className="buyer-info">
                No necesitas crear una cuenta. Ingresa el <strong style={{color:"#22d3a0"}}>codigo de paleta</strong> que te asigno la casa de remates al momento de inscribirte y pagar tu garantia.
              </div>
              <div className="auth-field">
                <label className="auth-label">Codigo de paleta</label>
                <input className={`auth-input mono${error?" error":""}`} type="text" placeholder="RA-045"
                  value={token} onChange={e=>setToken(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              </div>
              <div className="auth-hint">
                <strong>Demo Postor:</strong> RA-045 · RA-012 · RA-007
              </div>
            </>
          )}

          <button className="auth-submit" onClick={handleLogin} disabled={loading}>
            {loading ? "Verificando..." : role==="comprador" ? "Entrar al remate" : "Iniciar sesion"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Buyer-facing view — minimal sala pública
function BuyerView({ user, onLogout }) {
  const BUYER_CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .bv-root { min-height: 100vh; background: #070f1c; font-family: 'Inter', sans-serif; color: #e0eaf4; }
    .bv-header { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.5rem; background: #0b1f38; border-bottom: 1px solid rgba(255,255,255,.07); }
    .bv-header-left { display: flex; align-items: center; gap: .75rem; }
    .bv-casa { font-size: .82rem; font-weight: 700; color: #e0eaf4; }
    .bv-paleta { font-family: 'DM Mono', monospace; font-size: .75rem; background: rgba(47,128,237,.15); color: #2F80ED; border: 1px solid rgba(47,128,237,.3); padding: .18rem .55rem; border-radius: 4px; }
    .bv-logout { background: transparent; border: 1px solid rgba(255,255,255,.1); color: #4a6a8a; font-size: .72rem; padding: .3rem .7rem; border-radius: 5px; cursor: pointer; }
    .bv-logout:hover { color: #e05252; border-color: rgba(224,82,82,.3); }
    .bv-body { max-width: 720px; margin: 3rem auto; padding: 0 1.5rem; }
    .bv-welcome { font-size: 1.3rem; font-weight: 700; margin-bottom: .3rem; }
    .bv-welcome span { color: #2F80ED; }
    .bv-sub { font-size: .82rem; color: #4a6a8a; margin-bottom: 2.5rem; }
    .bv-card { background: #0b1f38; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 1.4rem; margin-bottom: 1rem; }
    .bv-card-title { font-size: .72rem; font-weight: 700; color: #2F80ED; letter-spacing: .06em; text-transform: uppercase; margin-bottom: .75rem; }
    .bv-row { display: flex; justify-content: space-between; align-items: center; padding: .5rem 0; border-bottom: 1px solid rgba(255,255,255,.04); }
    .bv-row:last-child { border-bottom: none; }
    .bv-row-l { font-size: .78rem; color: #4a6a8a; }
    .bv-row-v { font-size: .82rem; font-weight: 600; color: #e0eaf4; }
    .bv-row-v.ac { color: #2F80ED; }
    .bv-row-v.gr { color: #22d3a0; }
    .bv-row-v.yl { color: #f6ad55; }
    .bv-status { display: flex; align-items: center; gap: .4rem; }
    .bv-dot { width: 7px; height: 7px; border-radius: 50%; background: #22d3a0; animation: bv-pulse 1.5s infinite; }
    @keyframes bv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    .bv-info { padding: 1rem 1.2rem; background: rgba(47,128,237,.06); border: 1px solid rgba(47,128,237,.15); border-radius: 8px; font-size: .78rem; color: #5a7fa8; line-height: 1.6; margin-top: 1.5rem; }
  `;
  return (
    <div className="bv-root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <style>{BUYER_CSS}</style>
      <div className="bv-header">
        <div className="bv-header-left">
          <GRLogo/>
          <div style={{width:1,height:24,background:"rgba(255,255,255,.1)"}}/>
          <div className="bv-casa">{user.casaNombre}</div>
          <div className="bv-paleta">Paleta {user.token}</div>
        </div>
        <button className="bv-logout" onClick={onLogout}>Salir</button>
      </div>
      <div className="bv-body">
        <div className="bv-welcome">Hola, <span>{user.name.split(" ")[0]}</span></div>
        <div className="bv-sub">RUT {user.rut} — {user.casaNombre}</div>

        <div className="bv-card">
          <div className="bv-card-title">Estado del remate</div>
          <div className="bv-row">
            <div className="bv-row-l">Remate activo</div>
            <div className="bv-row-v">Remate Industrial Marzo 2026</div>
          </div>
          <div className="bv-row">
            <div className="bv-row-l">Estado</div>
            <div className="bv-row-v">
              <div className="bv-status"><div className="bv-dot"/>En vivo</div>
            </div>
          </div>
          <div className="bv-row">
            <div className="bv-row-l">Tu paleta</div>
            <div className="bv-row-v ac">{user.token}</div>
          </div>
          <div className="bv-row">
            <div className="bv-row-l">Garantia</div>
            <div className="bv-row-v gr">$300.000 — Aprobada</div>
          </div>
        </div>

        <div className="bv-card">
          <div className="bv-card-title">Lote actual en subasta</div>
          <div className="bv-row"><div className="bv-row-l">Articulo</div><div className="bv-row-v">Hyundai Santa Fe 2.4 2019</div></div>
          <div className="bv-row"><div className="bv-row-l">Precio base</div><div className="bv-row-v">$4.500.000</div></div>
          <div className="bv-row"><div className="bv-row-l">Puja actual</div><div className="bv-row-v ac">$6.500.000</div></div>
          <div className="bv-row"><div className="bv-row-l">Tiempo restante</div><div className="bv-row-v yl">01:24</div></div>
        </div>

        <div className="bv-info">
          Para pujar, levanta tu paleta en la sala presencial o comunicate con el martillero a traves del chat en vivo. Las adjudicaciones y liquidaciones se enviaran a tu correo al finalizar el remate.
        </div>
      </div>
    </div>
  );
}

// ── Root entry point ──────────────────────────────────────────────
export default function Root() {
  const [session, setSession] = useState(null); // null = not logged in

  const handleLogin  = (user) => setSession(user);
  const handleLogout = () => setSession(null);

  if (!session) return <AuthScreen onLogin={handleLogin}/>;
  if (session.role === "comprador") return <BuyerView user={session} onLogout={handleLogout}/>;
  return <Dashboard session={session} onLogout={handleLogout}/>;
}

// ─────────────────────────────────────────────────────────────────
function Dashboard({ session, onLogout }) {
  const [page,       setPage]       = useState("dashboard");
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
  const resetWiz = () => { setWizStep(1); setWizTipo(null); setWizVehTipo(""); setWizFotos({frente:null,izq:null,der:null,trasera:null}); setWizItems([{id:1,nombre:"",foto:null}]); setWizDocs([]); setLoteForm({ tipoRemate:"judicial", motorizado:false, comCustom:"" }); };
  // Liquidaciones agrupadas por comprador para revisión post-remate
  const [liqReview,  setLiqReview]  = useState(null);  // null | { compradores: [...] }
  const [liqExpanded,setLiqExpanded]= useState(null);  // nComprador expandido

  // ── Auction state ──────────────────────────────────────────────
  const [lots,        setLots]        = useState(LOTES_SALA);
  const [idx,         setIdx]         = useState(0);
  const [bids,        setBids]        = useState(LOTES_SALA.map(l => ({ current:l.base, count:0, history:[], status:"waiting", winner:null })));
  const [aState,      setAState]      = useState("waiting");
  const [timeLeft,    setTimeLeft]    = useState(120);
  const [bidTimer,    setBidTimer]    = useState(null);
  const [lastBidder,  setLastBidder]  = useState(null);
  const [curInc,      setCurInc]      = useState(500000);
  const [flash,       setFlash]       = useState(false);
  const [ctrlTab,     setCtrlTab]     = useState("control");
  const [chatInput,   setChatInput]   = useState("");
  const [chatMsgs,    setChatMsgs]    = useState([
    {id:1,from:"P-0318 (Online)",text:"Listo para participar",time:"11:58"},
    {id:2,from:"P-0112 (Online)",text:"Buenos dias",time:"11:59"},
  ]);
  const [modalidad,   setModalidad]   = useState("hibrido"); // "presencial" | "online" | "hibrido"
  // Post-remate: liquidaciones y devoluciones generadas automáticamente
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [devoluciones,  setDevoluciones]  = useState([]);
  const [remateTerminado, setRemateTerminado] = useState(false);

  const timerRef    = useRef(null);
  const bidTimerRef = useRef(null);
  const feedRef     = useRef(null);
  const chatRef     = useRef(null);

  const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),4000); };

  useEffect(() => {
    if (aState==="live" && timeLeft>0) { timerRef.current = setTimeout(()=>setTimeLeft(t=>t-1),1000); }
    else if (aState==="live" && timeLeft===0) { doAdjudicar(); }
    return () => clearTimeout(timerRef.current);
  }, [aState, timeLeft]);

  useEffect(() => {
    if (bidTimer===null||bidTimer<=0||aState!=="live") return;
    bidTimerRef.current = setTimeout(()=>setBidTimer(t=>t-1),1000);
    return () => clearTimeout(bidTimerRef.current);
  }, [bidTimer, aState]);

  // Simulated bids from online participants
  useEffect(() => {
    if (aState!=="live"||!lots.length) return;
    const onlinePostors = ["P-0318 (Online)","P-0112 (Online)","P-0067 (Online)"];
    const iv = setInterval(() => {
      if (Math.random()<0.3) {
        const bidder = onlinePostors[Math.floor(Math.random()*onlinePostors.length)];
        const amt = (bids[idx]?.current||0) + curInc;
        setBids(p=>{const n=[...p];const c=n[idx];n[idx]={...c,current:amt,count:c.count+1,history:[{bidder,amount:amt,time:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),online:true},...c.history.slice(0,19)],winner:bidder};return n;});
        setLastBidder(bidder); setBidTimer(BID_TIMER); setTimeLeft(t=>Math.min(t+8,120));
        setFlash(true); setTimeout(()=>setFlash(false),600);
        if (feedRef.current) feedRef.current.scrollTop=0;
        // Auto-announce in chat
        setChatMsgs(p=>[...p,{id:Date.now(),from:"Sistema",text:`${bidder} puja ${fmt(amt)}`,time:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}),system:true}]);
      }
    }, 4200);
    return () => clearInterval(iv);
  }, [aState, idx, lots, curInc, bids]);

  const placeBid = () => {
    const amt = (bids[idx]?.current||0) + curInc;
    setBids(p=>{const n=[...p];const c=n[idx];n[idx]={...c,current:amt,count:c.count+1,history:[{bidder:"Tu (P-0245)",amount:amt,time:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),mine:true},...c.history.slice(0,19)],winner:"Tu (P-0245)"};return n;});
    setLastBidder("me"); setBidTimer(BID_TIMER); setTimeLeft(t=>Math.min(t+10,120));
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
    const comPct      = loteReal.com ?? COMISIONES[tipoRemate]?.com ?? 3;
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
        exp: loteReal.exp || lots[idx]?.id || "",
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

  // Cerrar remate completo → genera todas las liquidaciones/devoluciones pendientes
  const cerrarRemateCompleto = () => {
    setRemateTerminado(true);
    // Agrupar todas las adjudicaciones (demo + generadas en vivo) por comprador
    const todasLiq = [...ADJUDICACIONES.map(a=>({
      lote:a.lote, exp:"", monto:a.monto, comPct:3, motorizado:false,
      postor:a.postor, rut:a.rut||"—", email:"",
    })), ...liquidaciones];

    // Buscar datos completos del postor en POSTORES
    const byComprador = {};
    todasLiq.forEach(l => {
      const postorData = POSTORES.find(p=>p.name===l.postor||p.razonSocial===l.postor) || null;
      const key = postorData?.nComprador ?? l.postor;
      if (!byComprador[key]) byComprador[key] = { postorData, lotes:[], key };
      byComprador[key].lotes.push(l);
    });

    const compradores = Object.values(byComprador).map(c => ({
      ...c,
      liq: calcLiquidacion(c.lotes, c.postorData),
      enviado: false,
    }));

    setLiqReview({ compradores, fecha: new Date().toLocaleDateString("es-CL") });
    notify("Remate cerrado. Revisando liquidaciones antes de enviar.", "sold");
    setPage("liquidac");
  };

  const startAuction  = () => { setAState("live"); setTimeLeft(120); setBidTimer(null); setLastBidder(null); };
  const pauseAuction  = () => { setAState("paused"); setBidTimer(null); };
  const adjudicar     = () => doAdjudicar(true);
  const resetAuction  = () => { setAState("waiting"); setTimeLeft(120); setBidTimer(null); setLastBidder(null); setBids(lots.map(l=>({current:l.base,count:0,history:[],status:"waiting",winner:null}))); };
  const handlePhoto   = (i,e) => { const f=e.target.files[0]; if(!f) return; setLots(p=>{const n=[...p];n[i]={...n[i],img:URL.createObjectURL(f)};return n;}); notify("Foto cargada.","inf"); };

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
    { id:"reportes",     icon:"reportes",  label:"Reportes" },
    { id:"config",       icon:"config",    label:"Configuracion" },
  ];

  const PAGE_TITLE = {dashboard:"Dashboard",remates:"Remates",lotes:"Lotes",sala:"Sala en vivo",postores:"Postores",garantias:"Garantias",adjudicac:"Adjudicaciones",liquidac:"Liquidaciones",devoluciones:"Devoluciones de Garantia",factura:"Balance Económico",reportes:"Estadísticas",config:"Configuracion"};

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
                <div className="fg full"><label className="fl">Nombre del remate</label><input className="fi" placeholder="Remate Industrial Abril 2026"/></div>
                <div className="fg"><label className="fl">Fecha</label><input className="fi" type="date"/></div>
                <div className="fg"><label className="fl">Modalidad</label><select className="fsel"><option>Presencial</option><option>Online</option><option>Hibrido</option></select></div>
                <div className="fg full"><label className="fl">Tipo de remate</label>
                  <select className="fsel" value={loteForm.tipoRemate} onChange={e=>setLoteForm(f=>({...f,tipoRemate:e.target.value}))}>
                    <option value="judicial">Judicial — 3% comision</option>
                    <option value="concursal">Concursal — 2.5% comision</option>
                    <option value="privado">Privado — comision personalizada</option>
                  </select>
                </div>
                {loteForm.tipoRemate==="privado" && (
                  <div className="fg full">
                    <label className="fl">Comision personalizada (%)</label>
                    <input className="fi" type="number" step="0.5" min="0" max="20" placeholder="Ej: 5" value={loteForm.comCustom} onChange={e=>setLoteForm(f=>({...f,comCustom:e.target.value}))}/>
                  </div>
                )}
                <div className="fg full" style={{padding:".65rem .85rem",background:`rgba(${loteForm.tipoRemate==="judicial"?"47,128,237":loteForm.tipoRemate==="concursal"?"246,173,85":"34,211,160"},.07)`,border:`1px solid rgba(${loteForm.tipoRemate==="judicial"?"47,128,237":loteForm.tipoRemate==="concursal"?"246,173,85":"34,211,160"},.2)`,borderRadius:7,fontSize:".75rem",color:"var(--mu2)"}}>
                  {COMISIONES[loteForm.tipoRemate]?.desc}{loteForm.tipoRemate==="privado"&&loteForm.comCustom?` Comision configurada: ${loteForm.comCustom}%.`:""}
                </div>
                <div className="fg full"><label className="fl">Descripcion</label><input className="fi" placeholder="Descripcion breve"/></div>
              </div>
            </>}
            {modal==="nuevo-lote" && <>
              {/* ── WIZARD HEADER ── */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
                <div className="modal-title" style={{margin:0}}>Ingresar lote</div>
                <div style={{fontSize:".7rem",color:"var(--mu)"}}>Paso {wizStep} de 4</div>
              </div>
              {/* Steps bar */}
              <div className="wiz-steps">
                {[["1","Tipo"],["2","Datos"],["3","Fotos"],["4","Documentos"]].map(([n,l])=>(
                  <div key={n} className={`wiz-step${wizStep===+n?" on":wizStep>+n?" done":""}`}>
                    <div className="wiz-num">{wizStep>+n?"✓":n}</div>{l}
                  </div>
                ))}
              </div>
              {/* ── PASO 1: Tipo ── */}
              {wizStep===1 && (
                <div>
                  <div style={{fontSize:".78rem",color:"var(--mu2)",marginBottom:"1rem"}}>¿Qué tipo de bien es este lote?</div>
                  <div className="tipo-sel">
                    {[{k:"MUEBLES",icon:"📦",label:"Muebles",sub:"Enseres, maquinaria, equipos"},{k:"VEHICULOS",icon:"🚗",label:"Vehículos",sub:"Autos, camiones, maquinaria"},{k:"INMUEBLES",icon:"🏠",label:"Inmuebles",sub:"Propiedades, terrenos"}].map(o=>(
                      <div key={o.k} className={`tipo-opt${wizTipo===o.k?" on":""}`} onClick={()=>{setWizTipo(o.k);setLoteForm(f=>({...f,motorizado:o.k==="VEHICULOS"}));}}>
                        <span className="tipo-opt-icon">{o.icon}</span>
                        <div style={{fontWeight:700,marginBottom:".15rem"}}>{o.label}</div>
                        <div style={{fontSize:".62rem",opacity:.7}}>{o.sub}</div>
                      </div>
                    ))}
                  </div>
                  {wizTipo==="VEHICULOS" && (
                    <div style={{marginTop:".8rem"}}>
                      <label className="fl">Tipo de vehículo</label>
                      <select className="fsel" value={wizVehTipo} onChange={e=>setWizVehTipo(e.target.value)}>
                        <option value="">Seleccione tipo...</option>
                        {["Automóvil","Station Wagon","Jeep","Camioneta","Camión","Camión Tractor","Remolque","Semirremolque","Bus","Minibús","Taxibús","Taxi","Motocicleta","Carro de Arrastre","Casa Rodante","Maquinaria Agrícola","Maquinaria Industrial"].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {/* ── PASO 2: Datos ── */}
              {wizStep===2 && (
                <div className="form-grid">
                  <div className="fg full"><label className="fl">Nombre del artículo</label><input className="fi" placeholder={wizTipo==="VEHICULOS"?"Toyota Hilux 2020 4x4":wizTipo==="INMUEBLES"?"Parcela 315 — Coinco VI Region":"Enseres varios — Hogar"}/></div>
                  <div className="fg"><label className="fl">Expediente / N° causa</label><input className="fi" placeholder="E-61-2025"/></div>
                  <div className="fg"><label className="fl">Mandante</label><input className="fi" placeholder="Tanner / Judicial / Particular"/></div>
                  <div className="fg"><label className="fl">Propietario</label><input className="fi" placeholder="Apellido del propietario"/></div>
                  {wizTipo==="VEHICULOS" && <>
                    <div className="fg"><label className="fl">Patente</label><input className="fi" placeholder="ABCD-12" style={{fontFamily:"DM Mono,monospace",fontWeight:700}}/></div>
                    <div className="fg"><label className="fl">Año</label><input className="fi" placeholder="2020"/></div>
                    <div className="fg"><label className="fl">Kilometraje</label><input className="fi" placeholder="85.000 km"/></div>
                    <div className="fg"><label className="fl">Color</label><input className="fi" placeholder="Blanco"/></div>
                  </>}
                  {wizTipo==="INMUEBLES" && <>
                    <div className="fg"><label className="fl">Rol SII</label><input className="fi" placeholder="332-15"/></div>
                    <div className="fg"><label className="fl">Superficie</label><input className="fi" placeholder="12 Hec. / 850 m²"/></div>
                  </>}
                  <div className="fg">
                    <label className="fl">Tipo de remate</label>
                    <select className="fsel" value={loteForm.tipoRemate} onChange={e=>setLoteForm(f=>({...f,tipoRemate:e.target.value}))}>
                      <option value="judicial">Judicial</option><option value="concursal">Concursal</option><option value="privado">Privado</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="fl" style={{display:"flex",alignItems:"center",gap:".35rem"}}>
                      Comisión (%) <span style={{padding:".06rem .3rem",background:"rgba(47,128,237,.12)",color:"var(--ac)",borderRadius:3,fontSize:".58rem",fontWeight:700}}>REQUERIDO</span>
                    </label>
                    <input className="fi" type="number" step="0.5" min="0" max="50" placeholder={`Ej: ${COMISIONES[loteForm.tipoRemate]?.com??3}`} value={loteForm.comCustom} onChange={e=>setLoteForm(f=>({...f,comCustom:e.target.value}))} style={{fontFamily:"DM Mono,monospace",fontWeight:700,color:"var(--ac)"}}/>
                  </div>
                  {wizTipo==="VEHICULOS" && <div className="fg full" style={{padding:".55rem .8rem",background:"rgba(246,173,85,.06)",border:"1px solid rgba(246,173,85,.2)",borderRadius:7,fontSize:".72rem",color:"var(--yl)"}}>Vehículo motorizado — se agregarán <strong>$50.000 gastos administrativos</strong> en la liquidación.</div>}
                  <div className="fg"><label className="fl">Precio base</label><input className="fi" placeholder="$8.000.000"/></div>
                  <div className="fg"><label className="fl">Precio mínimo</label><input className="fi" placeholder="$7.000.000"/></div>
                  <div className="fg full"><label className="fl">Descripción</label><textarea className="fi" rows={3} placeholder="Estado general, condición, observaciones..." style={{resize:"none"}}/></div>
                  <div className="fg full"><label className="fl">Ubicación</label><input className="fi" placeholder="Rancagua, VI Región"/></div>
                </div>
              )}
              {/* ── PASO 3: Fotos ── */}
              {wizStep===3 && (
                <div>
                  {wizTipo==="VEHICULOS" ? <>
                    <div style={{fontSize:".76rem",color:"var(--mu2)",marginBottom:".85rem"}}>Sube las 4 fotos requeridas del vehículo.</div>
                    <div className="foto-grid">
                      {[["frente","Frente"],["izq","Izquierdo"],["der","Derecho"],["trasera","Trasera"]].map(([k,lbl])=>(
                        <label key={k} className={`foto-slot${wizFotos[k]?" filled":""}`}>
                          {wizFotos[k]?<><img src={URL.createObjectURL(wizFotos[k])} alt={lbl}/><div className="foto-label">{lbl}</div></>:<><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="18" height="13" rx="2"/><circle cx="10" cy="10.5" r="3"/><path d="M6.5 4V3a1 1 0 011-1h5a1 1 0 011 1v1"/></svg><span>{lbl}</span></>}
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizFotos(f=>({...f,[k]:e.target.files[0]}))}/>
                        </label>
                      ))}
                    </div>
                  </> : <>
                    <div style={{fontSize:".76rem",color:"var(--mu2)",marginBottom:".85rem"}}>Inventario de fotos / ítems del lote.</div>
                    {wizItems.map((it,i)=>(
                      <div key={it.id} className="item-card">
                        <label style={{width:52,height:52,borderRadius:8,border:"1px dashed var(--b2)",background:"rgba(255,255,255,.02)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,overflow:"hidden",position:"relative"}}>
                          {it.foto?<img src={URL.createObjectURL(it.foto)} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:7}}/>:<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--mu)" strokeWidth="1.5"><rect x="1" y="4" width="18" height="13" rx="2"/><circle cx="10" cy="10.5" r="3"/></svg>}
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizItems(items=>items.map((x,xi)=>xi===i?{...x,foto:e.target.files[0]}:x))}/>
                        </label>
                        <input className="fi" style={{flex:1,fontSize:".78rem"}} placeholder="Nombre del bien / ítem..." value={it.nombre} onChange={e=>setWizItems(items=>items.map((x,xi)=>xi===i?{...x,nombre:e.target.value}:x))}/>
                        <button onClick={()=>setWizItems(items=>items.filter((_,xi)=>xi!==i))} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--mu)",padding:".2rem",borderRadius:4,flexShrink:0}}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
                      </div>
                    ))}
                    <div className="add-btn-row" onClick={()=>setWizItems(items=>[...items,{id:Date.now(),nombre:"",foto:null}])}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg> Agregar foto de bien
                    </div>
                  </>}
                </div>
              )}
              {/* ── PASO 4: Documentos ── */}
              {wizStep===4 && (()=>{
                const DOCS_VEHICULO = [
                  {key:"anotaciones", label:"Certificado de Anotaciones Vigentes", desc:"Registro Civil — acredita que el vehículo no tiene prendas, prohibiciones ni alzamientos pendientes.", req:false},
                  {key:"multas",      label:"Certificado de Multas",               desc:"RNVM — acredita que el vehículo no tiene multas impagas ante el SII o municipios.",                  req:false},
                  {key:"revision",    label:"Revisión Técnica vigente",            desc:"Certificado de revisión técnica al día. Aumenta la confianza del comprador.",                         req:false},
                  {key:"permiso",     label:"Permiso de Circulación vigente",      desc:"Comprobante del permiso de circulación pagado.",                                                       req:false},
                ];
                return (
                  <div>
                    {/* Bloque documentos específicos de vehículo */}
                    {wizTipo==="VEHICULOS" && (
                      <div style={{marginBottom:"1.1rem"}}>
                        <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:".7rem"}}>
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4.5v.5M7 7v3"/></svg>
                          <span style={{fontSize:".71rem",fontWeight:700,color:"var(--wh2)",textTransform:"uppercase",letterSpacing:".05em"}}>Documentos del vehículo</span>
                        </div>
                        {DOCS_VEHICULO.map(doc=>{
                          const adj = wizDocs.find(d=>d.key===doc.key);
                          const ok  = adj?.archivo;
                          return (
                            <div key={doc.key} style={{display:"flex",alignItems:"flex-start",gap:".7rem",padding:".7rem .85rem",background:ok?"rgba(34,211,160,.03)":"rgba(255,255,255,.02)",border:`1px solid ${ok?"rgba(34,211,160,.2)":"var(--b1)"}`,borderRadius:9,marginBottom:".4rem",transition:"border .2s"}}>
                              {/* ícono estado */}
                              <div style={{width:30,height:30,borderRadius:7,flexShrink:0,marginTop:".05rem",display:"flex",alignItems:"center",justifyContent:"center",background:ok?"rgba(34,211,160,.1)":"rgba(255,255,255,.04)",border:`1px solid ${ok?"rgba(34,211,160,.25)":"var(--b2)"}`}}>
                                {ok
                                  ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--gr)" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-7"/></svg>
                                  : <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 2h6l3 3v9H4V2z"/><path d="M10 2v3h3"/><path d="M6 8h4M6 11h3"/></svg>}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:".4rem",marginBottom:".15rem",flexWrap:"wrap"}}>
                                  <span style={{fontSize:".75rem",fontWeight:700,color:"var(--wh2)"}}>{doc.label}</span>
                                  <span style={{fontSize:".57rem",padding:".05rem .3rem",borderRadius:3,fontWeight:700,background:"rgba(47,128,237,.08)",color:"var(--ac)",border:"1px solid rgba(47,128,237,.2)"}}>{doc.req?"RECOMENDADO":"RECOMENDADO"}</span>
                                </div>
                                <div style={{fontSize:".64rem",color:"var(--mu)",lineHeight:1.4,marginBottom:".4rem"}}>{doc.desc}</div>
                                {ok
                                  ? <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                                      <span style={{fontSize:".68rem",color:"var(--gr)",fontWeight:600}}>✓ {adj.archivo.name}</span>
                                      <label style={{fontSize:".62rem",color:"var(--mu)",cursor:"pointer",textDecoration:"underline"}}>Cambiar<input type="file" accept=".pdf,.jpg,.png" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizDocs(docs=>docs.map(d=>d.key===doc.key?{...d,archivo:e.target.files[0]}:d))}/></label>
                                    </div>
                                  : <label style={{display:"inline-flex",alignItems:"center",gap:".3rem",cursor:"pointer",fontSize:".69rem",fontWeight:600,color:"var(--ac)",padding:".28rem .55rem",border:"1px solid rgba(47,128,237,.25)",borderRadius:6,background:"rgba(47,128,237,.06)"}}>
                                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg>
                                      Adjuntar PDF / imagen
                                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{if(!e.target.files[0])return; setWizDocs(docs=>{const ex=docs.find(d=>d.key===doc.key); return ex?docs.map(d=>d.key===doc.key?{...d,archivo:e.target.files[0]}:d):[...docs,{id:Date.now(),key:doc.key,nombre:doc.label,archivo:e.target.files[0]}];});}}/>
                                    </label>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Documentos adicionales libres */}
                    <div style={{fontSize:".71rem",fontWeight:700,color:"var(--mu2)",marginBottom:".55rem",textTransform:"uppercase",letterSpacing:".05em"}}>
                      {wizTipo==="VEHICULOS"?"Otros documentos (actas, resoluciones…)":"Documentos del lote (actas, resoluciones, etc.)"}
                    </div>
                    {wizDocs.filter(d=>!d.key).map((d,i)=>(
                      <div key={d.id} className="doc-card">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--yl)" strokeWidth="1.5" strokeLinecap="round" style={{flexShrink:0}}><path d="M4 2h6l3 3v9H4V2z"/><path d="M10 2v3h3"/><path d="M6 8h4M6 11h3"/></svg>
                        <div style={{flex:1}}>
                          <input className="fi" style={{marginBottom:".25rem",fontSize:".76rem"}} placeholder="Nombre del documento / acta" value={d.nombre} onChange={e=>setWizDocs(docs=>docs.map(x=>x.id===d.id?{...x,nombre:e.target.value}:x))}/>
                          <div style={{fontSize:".65rem",color:"var(--mu)"}}>{d.archivo?<span style={{color:"var(--gr)",fontWeight:600}}>✓ {d.archivo.name}</span>:<label style={{cursor:"pointer",color:"var(--ac)"}}>+ Adjuntar archivo<input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&setWizDocs(docs=>docs.map(x=>x.id===d.id?{...x,archivo:e.target.files[0]}:x))}/></label>}</div>
                        </div>
                        <button onClick={()=>setWizDocs(docs=>docs.filter(x=>x.id!==d.id))} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--mu)",padding:".2rem",flexShrink:0}}><svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
                      </div>
                    ))}
                    <div className="add-btn-row" onClick={()=>setWizDocs(docs=>[...docs,{id:Date.now(),key:null,nombre:"",archivo:null}])}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v12M1 7h12"/></svg> Adjuntar documento / acta
                    </div>

                    {/* Resumen / alerta faltantes */}
                    <div style={{marginTop:"1rem",padding:".7rem .9rem",background:"rgba(47,128,237,.05)",border:"1px solid rgba(47,128,237,.15)",borderRadius:8,fontSize:".72rem",color:"var(--mu2)",lineHeight:1.6}}>
                      <strong style={{color:"var(--wh2)"}}>Resumen: </strong>
                      <strong style={{color:"var(--wh2)"}}>{wizTipo||"—"}</strong>{wizTipo==="VEHICULOS"&&wizVehTipo?` — ${wizVehTipo}`:""} · Com. <strong style={{color:"var(--ac)"}}>{loteForm.comCustom||"?"}%</strong> · {COMISIONES[loteForm.tipoRemate]?.label}
                      {wizTipo==="VEHICULOS"?<> · <span style={{color:"var(--yl)"}}>+$50.000 adm.</span></>:""}
                      {" · "}{wizDocs.filter(d=>d.archivo).length} doc{wizDocs.filter(d=>d.archivo).length!==1?"s":""} adjunto{wizDocs.filter(d=>d.archivo).length!==1?"s":""}
                      {" · "}{wizTipo==="VEHICULOS"?`${Object.values(wizFotos).filter(Boolean).length}/4 fotos`:`${wizItems.filter(x=>x.nombre).length} ítems`}
                    </div>
                  </div>
                );
              })()}
            </>}
            {modal==="nuevo-postor" && <>
              <div className="modal-title">Registrar postor</div>
              <div style={{padding:".55rem .85rem",background:"rgba(47,128,237,.07)",border:"1px solid rgba(47,128,237,.2)",borderRadius:7,fontSize:".74rem",color:"var(--mu2)",marginBottom:".9rem",lineHeight:1.55}}>
                Al registrarse se asignara un <strong style={{color:"var(--wh2)"}}>N° de comprador</strong> automaticamente. Este numero mantiene la confidencialidad del postor durante el remate y aparecera en su liquidacion.
              </div>
              <div className="form-grid">
                <div className="fg full"><label className="fl">Razon social o nombre completo</label><input className="fi" placeholder="Empresa Transporte Pasajero Jose Luis Nova EIRL"/></div>
                <div className="fg"><label className="fl">RUT</label><input className="fi" placeholder="77.922.655-7"/></div>
                <div className="fg"><label className="fl">Giro</label><input className="fi" placeholder="Transporte de Pasajeros"/></div>
                <div className="fg"><label className="fl">Telefono</label><input className="fi" placeholder="+56 9 1234 5678"/></div>
                <div className="fg"><label className="fl">Email</label><input className="fi" placeholder="contacto@empresa.cl"/></div>
                <div className="fg full"><label className="fl">Direccion</label><input className="fi" placeholder="Los Veleros Casa 11"/></div>
                <div className="fg"><label className="fl">Comuna</label><input className="fi" placeholder="Rancagua"/></div>
                <div className="fg"><label className="fl">N° comprador asignado</label>
                  <div className="fi" style={{fontFamily:"DM Mono,monospace",fontWeight:700,color:"var(--ac)",background:"rgba(47,128,237,.07)",border:"1px solid rgba(47,128,237,.25)",display:"flex",alignItems:"center"}}>
                    #{String(POSTORES.length+1).padStart(2,"0")} — asignado automaticamente
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
                  {wizStep<4
                    ? <button className="btn-confirm" onClick={()=>{if(wizStep===1&&!wizTipo){notify("Selecciona el tipo de bien.","inf");return;}setWizStep(s=>s+1);}}>Siguiente →</button>
                    : <button className="btn-confirm" onClick={()=>{setModal(null);resetWiz();notify("Lote guardado correctamente.","sold");}}>Guardar lote</button>}
                </>
              ) : (
                <button className="btn-confirm" onClick={()=>{setModal(null);notify("Guardado correctamente.");}}>Guardar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sb-logo"><GRLogo/></div>
        <div style={{height:".5rem"}}/>
        <div className="sb-section">Principal</div>
        {NAV.slice(0,3).map(n => (
          <div key={n.id} className={`sb-item${page===n.id?" on":""}`} onClick={()=>setPage(n.id)}>
            <span className="sb-icon"><Icon name={n.icon}/></span>{n.label}
            {n.badge && <span className="sb-badge">{n.badge}</span>}
          </div>
        ))}
        <div className="sb-section">Remate Live</div>
        <div className={`sb-item${page==="sala"?" on":""}`} onClick={()=>setPage("sala")}>
          <span className="sb-icon"><Icon name="sala"/></span>Sala en vivo
          {aState==="live" && <div className="ldot" style={{marginLeft:"auto"}}/>}
        </div>
        <div className="sb-section">Gestion</div>
        {NAV.slice(4).map(n => (
          <div key={n.id} className={`sb-item${page===n.id?" on":""}`} onClick={()=>setPage(n.id)}>
            <span className="sb-icon"><Icon name={n.icon}/></span>{n.label}
            {n.badge ? <span className="sb-badge" style={{background:"var(--yl)",color:"#0b1f38"}}>{n.badge}</span> : null}
          </div>
        ))}
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-ava">{session?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"??"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sb-uname">{session?.name||"Usuario"}</div>
              <div className="sb-urole">{session?.casaNombre||"GR Auction Software"}</div>
            </div>
            <button title="Cerrar sesion" onClick={onLogout} style={{background:"transparent",border:"none",cursor:"pointer",color:"#2a4a6a",padding:".2rem",borderRadius:4,flexShrink:0,transition:"color .15s"}}
              onMouseEnter={e=>e.target.style.color="#e05252"} onMouseLeave={e=>e.target.style.color="#2a4a6a"}>
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
              <div className="topbar-title">{PAGE_TITLE[page]}</div>
            </div>
            <div className="topbar-right">
              {aState==="live" && <div className="tb-live"><div className="ldot"/>En vivo — Remate Industrial Marzo</div>}
              {page==="remates"   && <button className="btn-primary" onClick={()=>setModal("nuevo-remate")}>+ Nuevo remate</button>}
              {page==="lotes"     && <button className="btn-primary" onClick={()=>setModal("nuevo-lote")}>+ Agregar lote</button>}
              {page==="postores"  && <button className="btn-primary" onClick={()=>setModal("nuevo-postor")}>+ Registrar postor</button>}
              {page==="garantias" && <button className="btn-primary" onClick={()=>setModal("nueva-garantia")}>+ Registrar garantia</button>}
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {page==="dashboard" && (
          <div className="page">
            <div className="stat-grid">
              {[
                {label:"Remates activos",   val:"3",     delta:"↑ 1 este mes",   c:"var(--ac)"},
                {label:"Lotes publicados",  val:"248",   delta:"↑ 31 este mes",  c:"var(--gr)"},
                {label:"Postores",          val:"1.420", delta:"↑ 87 este mes",  c:"var(--yl)"},
                {label:"Ventas del mes",    val:"$185M", delta:"↑ 14.9% vs Feb", c:"var(--gr)"},
              ].map((s,i) => (
                <div className="stat-card" key={i} style={{"--sc":s.c}}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-delta"><span className="delta-up">{s.delta}</span></div>
                </div>
              ))}
            </div>
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-title">Evolucion de ventas</div>
                <div className="chart-sub">Ultimos 7 meses — millones CLP</div>
                <ResponsiveContainer width="100%" height={135}>
                  <LineChart data={VENTAS_MES}>
                    <XAxis dataKey="mes" tick={{fontFamily:"Inter",fontSize:10,fill:"#5a7fa8"}} axisLine={false} tickLine={false}/>
                    <YAxis hide/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Line type="monotone" dataKey="v" stroke="#2F80ED" strokeWidth={2.5} dot={{r:3,fill:"#2F80ED",strokeWidth:0}} activeDot={{r:5}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-title">Lotes por categoria</div>
                <div className="chart-sub">Volumen vendido este mes</div>
                <ResponsiveContainer width="100%" height={135}>
                  <BarChart data={TOP_LOTES} barSize={20}>
                    <XAxis dataKey="name" tick={{fontFamily:"Inter",fontSize:9,fill:"#5a7fa8"}} axisLine={false} tickLine={false}/>
                    <YAxis hide/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="v" fill="#2F80ED" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-title">Modalidad</div>
                <div className="chart-sub">Participacion de postores</div>
                <ResponsiveContainer width="100%" height={96}>
                  <PieChart>
                    <Pie data={PIE_DATA} dataKey="v" cx="50%" cy="50%" outerRadius={40} innerRadius={22}>
                      {PIE_DATA.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{display:"flex",justifyContent:"center",gap:".75rem",marginTop:".35rem"}}>
                  {PIE_DATA.map((d,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:".28rem"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:PIE_COLORS[i]}}/>
                      <span style={{fontSize:".6rem",color:"var(--mu)",fontWeight:500}}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="table-card">
              <div className="table-head">
                <div className="table-title">Remates recientes</div>
                <button className="btn-sec" onClick={()=>setPage("remates")}>Ver todos</button>
              </div>
              <table>
                <thead><tr><th>ID</th><th>Nombre</th><th>Fecha</th><th>Lotes</th><th>Modalidad</th><th>Recaudado</th><th>Estado</th></tr></thead>
                <tbody>
                  {REMATES.slice(0,4).map(r => (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td style={{fontWeight:600}}>{r.name}</td>
                      <td className="mono">{r.fecha}</td>
                      <td className="mono">{r.lotes}</td>
                      <td className="mono">{r.modal}</td>
                      <td className="gt">{fmtS(r.recaudado)}</td>
                      <td><span className={`pill p-${r.estado}`}>{r.estado==="activo"?"● ":""}{r.estado.charAt(0).toUpperCase()+r.estado.slice(1)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              : <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem",padding:".7rem 1rem",background:"rgba(47,128,237,.05)",border:"1px solid rgba(47,128,237,.15)",borderRadius:8,fontSize:".74rem",color:"var(--mu2)"}}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.01"/></svg>
                  <span>Solo ves los remates de <strong style={{color:"var(--wh2)"}}>{session?.casaNombre}</strong>. Crea y gestiona tus propios remates desde aquí.</span>
                </div>
            }
            <div className="filter-row" style={{marginBottom:"1rem"}}>
              {["todos","activo","cerrado"].map(f => (
                <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>{f}</button>
              ))}
            </div>
            <div className="table-card">
              <div className="table-head"><div className="table-title">{REMATES.filter(r=>filterTab==="todos"||r.estado===filterTab).length} remates</div></div>
              <table>
                <thead><tr><th>ID</th><th>Nombre</th><th>Fecha</th><th>Lotes</th><th>Modalidad</th><th>Recaudado</th><th>Estado</th>{session?.role==="admin"&&<th>Casa</th>}<th></th></tr></thead>
                <tbody>
                  {REMATES.filter(r=>filterTab==="todos"||r.estado===filterTab).map(r => (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td style={{fontWeight:600}}>{r.name}</td>
                      <td className="mono">{r.fecha}</td>
                      <td className="mono">{r.lotes}</td>
                      <td className="mono">{r.modal}</td>
                      <td className="gt">{fmt(r.recaudado)}</td>
                      <td><span className={`pill p-${r.estado}`}>{r.estado==="activo"?"● ":""}{r.estado.charAt(0).toUpperCase()+r.estado.slice(1)}</span></td>
                      {session?.role==="admin" && (
                        <td>
                          <span style={{fontSize:".68rem",fontWeight:600,color:"var(--mu2)",background:"var(--s3)",border:"1px solid var(--b1)",borderRadius:5,padding:".1rem .45rem",whiteSpace:"nowrap"}}>
                            {r.casa||"Remates Ahumada"}
                          </span>
                        </td>
                      )}
                      <td><button className="btn-sec" onClick={()=>{setPage("sala");notify("Abriendo sala...","inf");}}>Abrir sala</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ LOTES ══ */}
        {page==="lotes" && (
          <div className="page">
            <div className="filter-row" style={{marginBottom:"1rem"}}>
              {["todos","publicado","vendido","sin vender"].map(f => (
                <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>{f}</button>
              ))}
            </div>
            <div className="table-card">
              <div className="table-head"><div className="table-title">{LOTES_REALES.length} lotes — Remate Industrial Marzo</div>
                <button className="btn-sec" style={{fontSize:".7rem"}} onClick={()=>notify("Exportando listado...","inf")}>Exportar PDF</button>
              </div>
              <table>
                <thead><tr><th>Expediente</th><th>Articulo</th><th>Mandante</th><th>Tipo remate</th><th>Cat.</th><th>Año</th><th>Base</th><th>Com.</th><th>Gastos adm.</th><th>Estado</th></tr></thead>
                <tbody>
                  {LOTES_REALES.map(l => (
                    <tr key={l.id}>
                      <td><span className="exp-badge">{l.exp}</span></td>
                      <td style={{fontWeight:600}}>{l.name}{l.patente&&<span className="mono" style={{color:"var(--mu)",marginLeft:".4rem",fontSize:".65rem"}}>{l.patente}</span>}</td>
                      <td style={{fontSize:".73rem",color:"var(--mu2)"}}>{l.mandante}</td>
                      <td>
                        <span className="pill" style={{
                          background: l.tipoRemate==="judicial"?"rgba(47,128,237,.1)":l.tipoRemate==="concursal"?"rgba(246,173,85,.1)":"rgba(34,211,160,.1)",
                          color:      l.tipoRemate==="judicial"?"var(--ac)":l.tipoRemate==="concursal"?"var(--yl)":"var(--gr)",
                          border:     `1px solid ${l.tipoRemate==="judicial"?"rgba(47,128,237,.25)":l.tipoRemate==="concursal"?"rgba(246,173,85,.25)":"rgba(34,211,160,.25)"}`,
                        }}>{COMISIONES[l.tipoRemate]?.label||l.tipoRemate}</span>
                      </td>
                      <td className="mono">{l.cat}</td>
                      <td className="mono">{l.year||"—"}</td>
                      <td className="gt">{fmt(l.base)}</td>
                      <td className="mono" style={{color:"var(--ac)",fontWeight:600}}>{l.com}%</td>
                      <td className="mono">
                        {l.motorizado
                          ? <span style={{color:"var(--yl)",fontWeight:600,fontSize:".72rem"}}>+{fmt(GASTO_ADMIN_MOTORIZADO)}</span>
                          : <span style={{color:"var(--mu)"}}>—</span>}
                      </td>
                      <td><span className="pill p-publicado">Publicado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ POSTORES ══ */}
        {page==="postores" && (
          <div className="page">
            <div className="filter-row" style={{marginBottom:"1rem"}}>
              {["todos","verificado","pendiente"].map(f => (
                <button key={f} className={`filter-btn${filterTab===f?" on":""}`} onClick={()=>setFilterTab(f)}>{f}</button>
              ))}
            </div>
            <div className="table-card">
              <div className="table-head"><div className="table-title">{POSTORES.filter(p=>filterTab==="todos"||p.estado===filterTab).length} postores</div></div>
              <table>
                <thead><tr><th>N Postor</th><th>Nombre</th><th>RUT</th><th>Email</th><th>Telefono</th><th>Pujas</th><th>Remates</th><th>Estado</th></tr></thead>
                <tbody>
                  {POSTORES.filter(p=>filterTab==="todos"||p.estado===filterTab).map(p => (
                    <tr key={p.id}>
                      <td><span style={{fontFamily:"DM Mono,monospace",fontSize:".8rem",fontWeight:700,color:"var(--ac)"}}>{p.id}</span></td>
                      <td style={{fontWeight:600}}>{p.name}</td>
                      <td className="mono">{p.rut}</td>
                      <td className="mono">{p.email}</td>
                      <td className="mono">{p.tel}</td>
                      <td className="mono" style={{textAlign:"center"}}>{p.pujas}</td>
                      <td className="mono" style={{textAlign:"center"}}>{p.remates}</td>
                      <td><span className={`pill p-${p.estado}`}>{p.estado==="verificado"?"✓ ":""}{p.estado.charAt(0).toUpperCase()+p.estado.slice(1)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ FACTURACION ══ */}
        {page==="factura" && (
          <div className="page">
            {/* ── Header con selector de remate ── */}
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"1.4rem",paddingBottom:"1rem",borderBottom:"2px solid var(--ac)"}}>
              <div>
                <div style={{fontSize:"1.5rem",fontWeight:900,color:"var(--ac)",letterSpacing:"-.03em",textTransform:"uppercase",fontStyle:"italic",lineHeight:1}}>Balance Económico</div>
                <div style={{fontSize:".76rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginTop:".3rem"}}>
                  <select className="fsel" style={{fontSize:".75rem",width:"auto",background:"transparent",border:"none",color:"var(--mu2)",fontWeight:700,padding:"0",cursor:"pointer"}}>
                    {REMATES.map(r=><option key={r.id}>{r.name}</option>)}
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
                              <span style={{padding:".15rem .5rem",background:"rgba(47,128,237,.1)",border:"1px solid rgba(47,128,237,.2)",borderRadius:5,fontFamily:"DM Mono,monospace",fontSize:".72rem",fontWeight:700,color:"var(--ac)"}}>{t.pct}%</span>
                            </td>
                            <td style={{padding:".55rem .75rem",textAlign:"center",fontFamily:"DM Mono,monospace",fontSize:".76rem",color:"var(--mu2)"}}>{t.lotes.length}</td>
                            <td style={{padding:".55rem .75rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:".73rem",color:"var(--wh2)"}}>{fmt(t.subtotalMonto)}</td>
                            <td style={{padding:".55rem .75rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:".76rem",fontWeight:700,color:"var(--gr)"}}>{fmt(t.subtotalCom)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid var(--b2)",background:"rgba(255,255,255,.02)"}}>
                          <td colSpan={3} style={{padding:".65rem .75rem",textAlign:"right",fontSize:".72rem",fontWeight:700,color:"var(--mu2)",textTransform:"uppercase",letterSpacing:".04em"}}>Total neto comisiones</td>
                          <td style={{padding:".65rem .75rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:".85rem",fontWeight:900,color:"var(--gr)"}}>{fmt(totalComNeto)}</td>
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
                            <td style={{padding:".65rem .9rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:c,fontSize:".8rem"}}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid rgba(246,173,85,.3)",background:"rgba(246,173,85,.04)"}}>
                          <td style={{padding:".7rem .9rem",textAlign:"right",fontSize:".72rem",fontWeight:700,color:"var(--yl)",textTransform:"uppercase",letterSpacing:".04em"}}>Suma extras + IVA</td>
                          <td style={{padding:".7rem .9rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:".88rem",fontWeight:900,color:"var(--yl)"}}>{fmt(sumaExtras)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Ingreso neto empresa — resultado final */}
                    <div style={{margin:"1rem",padding:".85rem 1rem",background:"rgba(47,128,237,.07)",border:"1px solid rgba(47,128,237,.2)",borderRadius:9}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:".62rem",fontWeight:700,color:"var(--mu)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:".2rem"}}>Ingreso neto empresa</div>
                          <div style={{fontSize:".68rem",color:"var(--mu)",lineHeight:1.4}}>Com. netas + G.adm. − IVA</div>
                        </div>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:"1.2rem",fontWeight:900,color:"var(--ac)"}}>
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
                    const postorD = POSTORES.find(p=>p.name===a.postor||p.razonSocial===a.postor);
                    const loteR   = LOTES_REALES.find(l=>l.name===a.lote);
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                            <div style={{width:22,height:22,borderRadius:5,background:"rgba(47,128,237,.1)",border:"1px solid rgba(47,128,237,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Mono,monospace",fontSize:".6rem",fontWeight:800,color:"var(--ac)",flexShrink:0}}>
                              {String(postorD?.nComprador||"?").padStart(2,"0")}
                            </div>
                            <span style={{fontSize:".76rem",fontWeight:600}}>{a.postor}</span>
                          </div>
                        </td>
                        <td style={{fontSize:".73rem",color:"var(--mu2)"}}>{a.lote}</td>
                        <td>
                          {loteR?.tipoRemate && <span className="pill" style={{fontSize:".6rem",background:"rgba(47,128,237,.08)",color:"var(--ac)",border:"1px solid rgba(47,128,237,.2)"}}>{COMISIONES[loteR.tipoRemate]?.label||loteR.tipoRemate}</span>}
                        </td>
                        <td className="gt">{fmt(a.monto||0)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:".73rem",fontWeight:700,color:"var(--ac)",textAlign:"center"}}>{a.comPct??3}%</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:".73rem",fontWeight:700,color:"var(--gr)",textAlign:"right"}}>{fmt(com)}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:".73rem",color: gadm?"var(--yl)":"var(--mu)",textAlign:"right"}}>{gadm?fmt(gadm):"—"}</td>
                        <td style={{fontFamily:"DM Mono,monospace",fontSize:".78rem",fontWeight:800,color:"var(--wh2)",textAlign:"right"}}>{fmt(com+gadm)}</td>
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
                        <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:900,color:"var(--gr)",fontSize:".82rem"}}>{fmt(tCom)}</td>
                        <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:"var(--yl)",fontSize:".82rem"}}>{fmt(tGadm)}</td>
                        <td style={{padding:".6rem .75rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:900,color:"var(--ac)",fontSize:".85rem"}}>{fmt(tCom+tGadm)}</td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        )}

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
                  {REMATES.map(r=><option key={r.id}>{r.name}</option>)}
                </select>
                <button className="btn-sec" style={{fontSize:".7rem",whiteSpace:"nowrap"}} onClick={()=>notify("Exportando balance PDF...","inf")}>Exportar PDF</button>
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
                        const posData = POSTORES.find(p=>p.name===t.postor||p.razonSocial===t.postor);
                        return (
                          <div key={i}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".3rem"}}>
                              <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                                <div style={{width:22,height:22,borderRadius:6,background:i===0?"rgba(246,173,85,.15)":i===1?"rgba(47,128,237,.1)":"rgba(255,255,255,.05)",border:`1px solid ${i===0?"rgba(246,173,85,.3)":i===1?"rgba(47,128,237,.25)":"var(--b1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".65rem",fontWeight:800,color:i===0?"var(--yl)":i===1?"var(--ac)":"var(--mu)",flexShrink:0}}>
                                  {i+1}
                                </div>
                                <div>
                                  <div style={{fontSize:".76rem",fontWeight:700,color:"var(--wh2)"}}>{t.postor}</div>
                                  <div style={{fontSize:".62rem",color:"var(--mu)"}}>{t.lotes} lote{t.lotes>1?"s":""} · Paleta #{String(posData?.nComprador||"—").padStart(2,"0")}</div>
                                </div>
                              </div>
                              <div style={{fontFamily:"DM Mono,monospace",fontSize:".8rem",fontWeight:700,color:"var(--wh2)"}}>{fmt(t.monto)}</div>
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
                          <span style={{fontFamily:"DM Mono,monospace",fontWeight:700,color:c}}>{v}</span>
                        </div>
                      ))}
                      <div style={{display:"flex",justifyContent:"space-between",padding:".7rem 0 .2rem",marginTop:".2rem"}}>
                        <span style={{fontSize:".88rem",fontWeight:800,color:"var(--wh)"}}>BRUTO TOTAL:</span>
                        <span style={{fontFamily:"DM Mono,monospace",fontSize:"1.05rem",fontWeight:800,color:"var(--ac)"}}>{fmt(bruto)}</span>
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
                    <Bar dataKey="v" fill="#2F80ED" radius={[4,4,0,0]}/>
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
                  {REMATES.map(r => {
                    const com = Math.round(r.recaudado*.03);
                    const iva = Math.round(com*.19);
                    return (
                      <tr key={r.id}>
                        <td className="mono">{r.id}</td>
                        <td style={{fontWeight:600}}>{r.name}</td>
                        <td className="mono">{Math.round(r.lotes*.78)}</td>
                        <td className="mono" style={{color:"var(--rd)"}}>{Math.round(r.lotes*.22)}</td>
                        <td className="gt">{fmt(r.recaudado)}</td>
                        <td style={{color:"var(--gr)",fontFamily:"DM Mono,monospace",fontSize:".73rem",fontWeight:600}}>{fmt(com)}</td>
                        <td style={{color:"var(--mu2)",fontFamily:"DM Mono,monospace",fontSize:".73rem"}}>{fmt(iva)}</td>
                        <td style={{color:"var(--ac)",fontFamily:"DM Mono,monospace",fontSize:".73rem",fontWeight:700}}>{fmt(r.recaudado+com+iva)}</td>
                        <td><span className={`pill p-${r.estado}`}>{r.estado.charAt(0).toUpperCase()+r.estado.slice(1)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ CONFIG ══ */}
        {page==="config" && (
          <div className="page">
            <div className="config-grid">
              {[
                {title:"Casa de remates",fields:[["Nombre","Remates Ahumada"],["RUT","76.123.456-7"],["Direccion","Av. O'Higgins 456, Rancagua"],["Telefono","+56 72 234 5678"]]},
                {title:"Configuracion de pujas",fields:[["Incremento por defecto","$500.000"],["Timer entre pujas","12 segundos"],["Tiempo maximo por lote","120 segundos"],["Comision por defecto","3%"]]},
              ].map((s,i) => (
                <div className="config-card" key={i}>
                  <div className="config-title">{s.title}</div>
                  {s.fields.map(([l,v]) => (
                    <div className="fg" key={l} style={{marginBottom:".7rem"}}>
                      <label className="fl">{l}</label>
                      <input className="fi" defaultValue={v}/>
                    </div>
                  ))}
                  <button className="btn-primary" style={{marginTop:".3rem"}} onClick={()=>notify("Configuracion guardada.")}>Guardar cambios</button>
                </div>
              ))}
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
        {page==="adjudicac" && (
          <div className="page">
            <div className="stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginBottom:"1.2rem"}}>
              {[
                {label:"Total adjudicado",    val:fmt([...ADJUDICACIONES,...liquidaciones].reduce((s,a)=>s+a.monto,0)),       c:"var(--ac)"},
                {label:"Saldo pendiente",     val:fmt([...ADJUDICACIONES,...liquidaciones].filter(a=>a.estado==="saldo pendiente").reduce((s,a)=>s+a.saldo,0)), c:"var(--yl)"},
                {label:"Liquidaciones generadas", val:[...ADJUDICACIONES,...liquidaciones].length,                            c:"var(--gr)"},
                {label:"Devoluciones pendientes", val:[...ADJUDICACIONES.map(()=>({estado:"pendiente"})),...devoluciones].filter(d=>d.estado==="pendiente").length, c:"var(--yl)"},
              ].map((s,i)=>(
                <div className="stat-card" key={i} style={{"--sc":s.c}}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-val" style={{fontSize:"1.35rem"}}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:".7rem",marginBottom:"1.1rem"}}>
              <button className="btn-primary" onClick={()=>setPage("liquidac")}>Ver liquidaciones ({[...ADJUDICACIONES,...liquidaciones].length})</button>
              <button className="btn-sec" onClick={()=>setPage("devoluciones")}>Ver devoluciones de garantia ({devoluciones.length + ADJUDICACIONES.length})</button>
              {remateTerminado && <span className="pill p-pagado" style={{padding:".3rem .8rem",alignSelf:"center"}}>Remate cerrado</span>}
            </div>
            <div style={{padding:".75rem 1rem",background:"rgba(47,128,237,.07)",border:"1px solid rgba(47,128,237,.2)",borderRadius:8,fontSize:".76rem",color:"var(--mu2)",lineHeight:1.55,marginBottom:"1.1rem"}}>
              Al adjudicar cada lote, el sistema genera automaticamente la liquidacion para el comprador y prepara las devoluciones para los no adjudicados. <strong style={{color:"var(--wh2)"}}>La garantia se descuenta del total. El saldo restante debe ser transferido antes del retiro.</strong>
            </div>
            {[...ADJUDICACIONES,...liquidaciones].map((a,i)=>(
              <div className="adj-card" key={i}>
                <div>
                  <div className="adj-lote">{a.lote}</div>
                  <div className="adj-postor">{a.postor} · {a.rut||"—"}</div>
                  <div className="adj-row">
                    <div className="adj-item"><div className="adj-item-l">Monto adjudicado</div><div className="adj-item-v ac">{fmt(a.monto)}</div></div>
                    <div className="adj-item"><div className="adj-item-l">Garantia descontada</div><div className="adj-item-v gr">{fmt(a.garantia||a.gar||300000)}</div></div>
                    <div className="adj-item"><div className="adj-item-l">Saldo a pagar</div><div className={`adj-item-v${a.estado==="saldo pendiente"?" rd":""}`}>{a.estado==="pagado"?"Pagado":fmt(a.saldo)}</div></div>
                    <div className="adj-item"><div className="adj-item-l">Comision (3%)</div><div className="adj-item-v">{fmt(a.com||Math.round(a.monto*0.03))}</div></div>
                    <div className="adj-item"><div className="adj-item-l">Retiro</div><div className="adj-item-v">{a.retiro||"Sin coordinar"}</div></div>
                  </div>
                </div>
                <div className="adj-actions">
                  <span className={`pill ${a.estado==="pagado"?"p-pagado":"p-saldo"}`}>{a.estado==="pagado"?"Pagado":"Saldo pendiente"}</span>
                  <button className="btn-primary" style={{fontSize:".68rem",padding:".28rem .7rem"}} onClick={()=>notify("Liquidacion enviada por correo.","sold")}>Enviar liquidacion</button>
                  {a.estado==="saldo pendiente" && <button className="btn-sec" style={{fontSize:".68rem",padding:".26rem .7rem"}} onClick={()=>notify("Confirmado.","inf")}>Confirmar pago</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ LIQUIDACIONES ══ */}
        {page==="liquidac" && (
          <div className="page">
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.2rem",padding:".85rem 1rem",background:"rgba(47,128,237,.07)",border:"1px solid rgba(47,128,237,.2)",borderRadius:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:".82rem",fontWeight:700,color:"var(--wh2)",marginBottom:".2rem"}}>
                  {liqReview ? `Revision post-remate — ${liqReview.fecha} — ${liqReview.compradores.length} compradores` : "Liquidaciones por comprador"}
                </div>
                <div style={{fontSize:".73rem",color:"var(--mu2)"}}>
                  Revisa cada liquidacion antes de enviar. Una vez confirmadas se envia el correo masivo a todos los adjudicatarios.
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

            {/* Lista de compradores */}
            {liqReview?.compradores.map((c,ci) => {
              const p = c.postorData;
              const l = c.liq;
              const isOpen = liqExpanded === ci;
              return (
                <div key={ci} className="liq-card" style={{marginBottom:".8rem"}}>
                  {/* Header comprador */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: isOpen?".9rem":"0",cursor:"pointer"}} onClick={()=>setLiqExpanded(isOpen?null:ci)}>
                    <div style={{display:"flex",alignItems:"center",gap:".85rem"}}>
                      <div style={{width:38,height:38,borderRadius:8,background:"rgba(47,128,237,.12)",border:"1px solid rgba(47,128,237,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Mono,monospace",fontSize:".8rem",fontWeight:700,color:"var(--ac)",flexShrink:0}}>
                        {String(c.key).padStart(2,"0")}
                      </div>
                      <div>
                        <div style={{fontSize:".88rem",fontWeight:700,color:"var(--wh)"}}>{p?.razonSocial||c.lotes[0]?.postor||"—"}</div>
                        <div style={{fontSize:".72rem",color:"var(--mu2)"}}>{p?.rut||"—"} · {p?.giro||"—"} · {c.lotes.length} lote{c.lotes.length>1?"s":""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:".95rem",fontWeight:700,color:"var(--ac)"}}>{fmt(l.totalAPagar)}</div>
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
                                <td style={{padding:".45rem .5rem",fontFamily:"DM Mono,monospace",fontSize:".7rem",color:"var(--mu2)"}}>{ln.exp||`Lote ${li+1}`}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                                <td style={{padding:".45rem .5rem",fontWeight:600,color:"var(--wh2)"}}>{ln.lote}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(255,255,255,.05)",borderRadius:3,color:"var(--mu)"}}>EX</span></td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"DM Mono,monospace",color:"var(--wh2)"}}>{fmt(ln.monto)}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:"var(--wh2)"}}>{fmt(ln.monto)}</td>
                              </tr>
                              <tr key={`b-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                                <td style={{padding:".45rem .5rem",fontFamily:"DM Mono,monospace",fontSize:".7rem",color:"var(--mu2)"}}>{ln.exp||`Lote ${li+1}`}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                                <td style={{padding:".45rem .5rem",color:"var(--mu2)"}}>Comision {ln.comPct}%</td>
                                <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(47,128,237,.08)",borderRadius:3,color:"var(--ac)"}}>AF</span></td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"DM Mono,monospace",color:"var(--mu2)"}}>{fmt(ln.com)}</td>
                                <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"DM Mono,monospace",color:"var(--mu2)"}}>{fmt(ln.com)}</td>
                              </tr>
                              {ln.motorizado && (
                                <tr key={`c-${li}`} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                                  <td style={{padding:".45rem .5rem",fontFamily:"DM Mono,monospace",fontSize:".7rem",color:"var(--mu2)"}}>G-ADMIN</td>
                                  <td style={{padding:".45rem .5rem",textAlign:"center",color:"var(--mu2)"}}>1</td>
                                  <td style={{padding:".45rem .5rem",color:"var(--yl)",fontSize:".73rem"}}>Gastos Administrativos — Vehiculo Motorizado ({ln.exp||`Lote ${li+1}`})</td>
                                  <td style={{padding:".45rem .5rem",textAlign:"center"}}><span style={{fontSize:".62rem",padding:".1rem .35rem",background:"rgba(47,128,237,.08)",borderRadius:3,color:"var(--ac)"}}>AF</span></td>
                                  <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"DM Mono,monospace",color:"var(--yl)"}}>{fmt(ln.gastosAdm)}</td>
                                  <td style={{padding:".45rem .5rem",textAlign:"right",fontFamily:"DM Mono,monospace",color:"var(--yl)"}}>{fmt(ln.gastosAdm)}</td>
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
                              <span>{k}</span><span style={{fontFamily:"DM Mono,monospace",color:"var(--wh2)"}}>{v}</span>
                            </div>
                          ))}
                          <div style={{display:"flex",justifyContent:"space-between",padding:".25rem 0",borderTop:"1px solid var(--b2)",marginTop:".1rem",fontWeight:700,fontSize:".8rem"}}>
                            <span style={{color:"var(--wh2)"}}>Total:</span><span style={{fontFamily:"DM Mono,monospace",color:"var(--ac)"}}>{fmt(l.total)}</span>
                          </div>
                        </div>
                        <div style={{background:"rgba(47,128,237,.06)",border:"1px solid rgba(47,128,237,.2)",borderRadius:8,padding:".8rem 1rem",fontSize:".78rem"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:".4rem",color:"var(--mu2)"}}>
                            <span>Garantia:</span><span style={{fontFamily:"DM Mono,monospace",color:"var(--gr)"}}>{fmt(l.garantia)}</span>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",paddingTop:".4rem",borderTop:"1px solid rgba(47,128,237,.2)"}}>
                            <span style={{fontWeight:700,color:"var(--wh2)",fontSize:".85rem"}}>Total a Pagar:</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontWeight:800,fontSize:"1rem",color:"var(--ac)"}}>{fmt(l.totalAPagar)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="liq-actions" style={{marginTop:"1rem",paddingTop:".8rem",borderTop:"1px solid var(--b1)"}}>
                        <button className="btn-primary" style={{fontSize:".75rem"}} onClick={()=>{
                          setLiqReview(r=>({...r,compradores:r.compradores.map((x,xi)=>xi===ci?{...x,enviado:true}:x)}));
                          notify(`Liquidacion enviada a ${p?.email||"comprador"}.`,"sold");
                        }}>
                          {c.enviado?"Reenviar correo":"Enviar correo al comprador"}
                        </button>
                        <button className="btn-sec" style={{fontSize:".74rem"}} onClick={()=>notify("PDF generado listo para imprimir.","inf")}>
                          Descargar PDF
                        </button>
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
        {page==="sala" && item && bid && (
          <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
            <div className="topbar">
              <div className="topbar-left">
                <button className="btn-sec" onClick={()=>setPage("remates")}>← Volver</button>
                <div className="topbar-title">Sala en vivo — Remate Industrial Marzo</div>
              </div>
              <div className="topbar-right">
                {/* Modalidad selector */}
                <div className="mod-tabs">
                  {[["presencial","Presencial"],["hibrido","Hibrido"],["online","Online"]].map(([k,l])=>(
                    <button key={k} className={`mod-tab${modalidad===k?" on":""}`} onClick={()=>setModalidad(k)}>{l}</button>
                  ))}
                </div>
                {aState==="live" && <div className="tb-live"><div className="ldot"/>Transmitiendo</div>}
                {bids.every(b=>b.status==="sold"||bids[idx].count>0) && (
                  <button className="btn-primary" style={{fontSize:".7rem"}} onClick={cerrarRemateCompleto}>Cerrar remate</button>
                )}
              </div>
            </div>

            <div className="sala-wrap">
              {/* Sidebar lotes */}
              <aside className="sala-sb">
                <div className="sala-sbh">{lots.length} lotes en remate</div>
                {lots.map((it,i) => {
                  const bs=bids[i]; const st=bs?.status==="sold"?"sold":i===idx&&aState==="live"?"live":"wait";
                  return (
                    <div key={it.id} className={`lc${idx===i?" on":""}`} onClick={()=>setIdx(i)}>
                      {it.img ? <img src={it.img} alt={it.name} className="lth"/> : <div className="lph">Sin foto</div>}
                      <div className="ln">Lote {String(i+1).padStart(2,"0")}</div>
                      <div className="lnm">{it.name}</div>
                      <div className="lpr">{fmtS(bs?.current||it.base)}</div>
                      <div className={`lbdg ${st==="live"?"blv":st==="sold"?"bsd":"bwt"}`}>{st==="live"?"En vivo":st==="sold"?"Vendido":"Pendiente"}</div>
                    </div>
                  );
                })}
              </aside>

              {/* Main */}
              <main className="sala-main">
                <div className="pz">
                  {item.img ? (
                    <><img src={item.img} alt={item.name} className="pzimg"/>
                      <div className="pzov"><label className="pzch" htmlFor={`ph${idx}`}>Cambiar foto</label><input id={`ph${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/></div></>
                  ) : (
                    <label className="pzph" htmlFor={`ph${idx}`}>
                      <div className="pzpt">Subir foto del lote</div>
                      <input id={`ph${idx}`} type="file" accept="image/*" className="hid" onChange={e=>handlePhoto(idx,e)}/>
                    </label>
                  )}
                </div>

                <div>
                  <div className="ict">{item.cat}{item.year?` · ${item.year}`:""} · Lote {String(idx+1).padStart(2,"0")} de {lots.length}</div>
                  <div className="itl">{item.name}</div>
                  <div className="ids">{item.desc}</div>
                </div>

                <div className="ctrl-tabs">
                  {[["control","Control Martillero"],["postor","Vista Postor"]].map(([k,l]) => (
                    <button key={k} className={`ctrl-tab${ctrlTab===k?" on":""}`} onClick={()=>setCtrlTab(k)}>{l}</button>
                  ))}
                </div>

                {/* CONTROL */}
                {ctrlTab==="control" && (
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
                      </div>
                      <div className="ab-list">
                        <button className="ab g"  onClick={startAuction} disabled={aState==="live"}>Iniciar remate</button>
                        <button className="ab y"  onClick={pauseAuction} disabled={aState!=="live"}>Pausar</button>
                        <button className="ab bl" onClick={adjudicar}    disabled={aState==="sold"}>Adjudicar ahora</button>
                        <button className="ab r"  onClick={resetAuction}>Reiniciar lote</button>
                      </div>
                    </div>
                    <div className="ctrl-card">
                      <div className="ctrl-card-title">Estado en tiempo real</div>
                      <div className="st-row"><div className="st-dot" style={{background:sColor,boxShadow:`0 0 7px ${sColor}`}}/><div className="st-txt" style={{color:sColor}}>{sLabel}</div></div>
                      <div className="ls-grid">
                        <div className="ls-card"><div className="ls-v" style={{fontSize:".82rem"}}>{fmt(bid.current)}</div><div className="ls-l">Oferta</div></div>
                        <div className="ls-card"><div className="ls-v">{String(Math.floor(timeLeft/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}</div><div className="ls-l">Tiempo</div></div>
                        <div className="ls-card"><div className="ls-v">{bid.count}</div><div className="ls-l">Pujas</div></div>
                      </div>
                      {bidTimer!==null&&bidTimer>0&&aState==="live" && (
                        <div className="bid-ticker">
                          <div className="bt-num" style={{color:bidTimer>6?"var(--gr)":bidTimer>3?"var(--yl)":"var(--rd)"}}>{bidTimer}</div>
                          <div><div className="bt-info">Proxima puja en</div><div className="bt-leader">{lastBidder||"—"} lidera</div></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* POSTOR */}
                {ctrlTab==="postor" && (
                  <div className="ba-card">
                    <div className="tm-card" style={{marginBottom:".9rem"}}>
                      <div className="tmr">
                        <div><div className="tml">Tiempo del remate</div>
                          <div className="tmv" style={{color:tColor}}>{String(Math.floor(timeLeft/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}</div></div>
                        <div style={{textAlign:"right"}}><div className="tml">Estado</div><div className="tmst" style={{color:sColor}}>{sLabel}</div></div>
                      </div>
                      <div className="tmbg"><div className="tmfill" style={{width:`${(timeLeft/120)*100}%`,background:tColor}}/></div>
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
                    <div className="bst">
                      <div className="bsc"><div className="bsv">{bid.count}</div><div className="bsl">Pujas totales</div></div>
                      <div className="bsc"><div className="bsv">{fmtS(bid.current-item.base)}</div><div className="bsl">Sobre base</div></div>
                    </div>
                  </div>
                )}
              </main>

              {/* Right panel: feed + chat */}
              <aside style={{display:"flex",flexDirection:"column",background:"var(--s1)",borderLeft:"1px solid var(--b1)",overflow:"hidden"}}>
                {/* Pujas feed — top half */}
                <div style={{flex:1,display:"flex",flexDirection:"column",borderBottom:"1px solid var(--b1)",minHeight:0}}>
                  <div className="fdh">Registro de pujas {aState==="live"&&<div className="ldot" style={{width:6,height:6}}/>}</div>
                  <div className="fdl" ref={feedRef} style={{flex:1}}>
                    {bid.history.length===0 ? <div className="fde">Sin pujas aun</div>
                      : bid.history.map((b,i) => (
                        <div key={i} className="fdi">
                          <div style={{display:"flex",alignItems:"center",gap:".35rem"}}>
                            {b.online && <span style={{padding:".04rem .3rem",background:"rgba(47,128,237,.15)",color:"var(--ac)",borderRadius:3,fontSize:".55rem",fontWeight:700}}>WEB</span>}
                            <div className={`fdb${b.mine?" me":""}`}>{b.mine?"Tu (P-0245)":b.bidder}</div>
                          </div>
                          <div className="fda">{fmt(b.amount)}</div>
                          <div className="fdt">{b.time}</div>
                        </div>
                      ))}
                  </div>
                </div>
                {/* Chat online — bottom half — visible en modo hibrido/online */}
                {(modalidad==="hibrido"||modalidad==="online") && (
                  <div className="chat-wrap" style={{flex:"0 0 auto",height:"48%"}}>
                    <div className="chat-hdr">
                      <div className="chat-hdr-t">Chat postores online</div>
                      <div className="chat-online"><div className="ldot"/>3 conectados</div>
                    </div>
                    <div className="chat-body" ref={chatRef}>
                      {chatMsgs.map(m=>(
                        <div key={m.id} className="chat-msg">
                          <div className={`chat-from${m.martillero?" m":m.system?" s":""}`}>{m.from}</div>
                          <div className={`chat-text${m.system?" sys":""}`}>{m.text}</div>
                          <div className="chat-time">{m.time}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chat-input-row">
                      <input className="chat-inp" placeholder="Mensaje a postores online..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") sendChat();}}/>
                      <button className="chat-send" onClick={sendChat}>Enviar</button>
                    </div>
                  </div>
                )}
                {modalidad==="presencial" && (
                  <div style={{padding:"1rem",textAlign:"center",fontSize:".7rem",color:"var(--mu)",borderTop:"1px solid var(--b1)"}}>
                    Modo presencial — Chat desactivado
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
