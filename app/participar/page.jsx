'use client'
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const SUPA_URL = "https://xqkfcqibukghtyfjcwfb.supabase.co";
const SUPA_KEY = "sb_publishable_m2bABYE65JScB4oCJUBmFg_3eVzUuIR";
const supabase = createClient(SUPA_URL, SUPA_KEY);

// ── RUT validator (Chile) ────────────────────────────────────────
function validarRut(rut) {
  if (!rut || typeof rut !== "string") return false;
  const clean = rut.replace(/[.\s]/g, "").toUpperCase();
  if (!/^\d{7,8}-[\dK]$/.test(clean)) return false;
  const [num, dv] = clean.split("-");
  let sum = 0, mul = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    sum += parseInt(num[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const expected = 11 - (sum % 11);
  const dvCalc = expected === 11 ? "0" : expected === 10 ? "K" : String(expected);
  return dv === dvCalc;
}

function formatRut(value) {
  const clean = value.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv   = clean.slice(-1);
  return body + "-" + dv;
}

function randomPassword(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const COMUNAS = ["ALGARROBO","ALHUE","ALTO BIOBIO","ALTO DEL CARMEN","ALTO HOSPICIO","ANCUD","ANDACOLLO","ANGOL","ANTOFAGASTA","BUIN","BULNES","CABILDO","CABRERO","CALAMA","CALBUCO","CALDERA","CALERA DE TANGO","CALLE LARGA","CANELA","CANETE","CARAHUE","CARTAGENA","CASABLANCA","CASTRO","CATEMU","CAUQUENES","CERRILLOS","CERRO NAVIA","CHANARAL","CHANCO","CHEPICA","CHIGUAYANTE","CHILE CHICO","CHILLAN","CHIMBARONGO","CODEGUA","COELEMU","COIHUECO","COINCO","COLBUN","COLINA","COLLIPULLI","COLTAUCO","COMBARBALA","CONCEPCION","CONCON","CONSTITUCION","COPIAPO","COQUIMBO","CORRAL","COYHAIQUE","CURICO","EL BOSQUE","EL CARMEN","EL MONTE","EMPEDRADO","ESTACION CENTRAL","FLORIDA","FREIRE","FREIRINA","FRESIA","FRUTILLAR","FUTRONO","GRANEROS","ILLAPEL","INDEPENDENCIA","IQUIQUE","ISLA DE MAIPO","LA CALERA","LA CISTERNA","LA FLORIDA","LA GRANJA","LA LIGUA","LA PINTANA","LA REINA","LA SERENA","LA UNION","LAJA","LAMPA","LANCO","LAS CABRAS","LAS CONDES","LAUTARO","LEBU","LICANTEN","LIMACHE","LINARES","LITUECHE","LLAY-LLAY","LO BARNECHEA","LO ESPEJO","LO PRADO","LOLOL","LONCOCHE","LONGAVI","LOS ALAMOS","LOS ANDES","LOS ANGELES","LOS LAGOS","LOS VILOS","LOTA","MACHALI","MAIPU","MALLOA","MAULE","MEJILLONES","MELIPILLA","MOLINA","MONTE PATRIA","MOSTAZAL","MULCHEN","NACIMIENTO","NANCAGUA","NAVIDAD","NEGRETE","NINHUE","NOGALES","NUEVA IMPERIAL","NUNOA","OLIVAR","OLMUE","OSORNO","OVALLE","PADRE HURTADO","PAINE","PALMILLA","PANGUIPULLI","PANQUEHUE","PAPUDO","PAREDONES","PARRAL","PELARCO","PEMUCO","PENCAHUE","PENCO","PENALOLEN","PERALILLO","PETORCA","PEUMO","PICA","PICHIDEGUA","PICHILEMU","PINTO","PIRQUE","PLACILLA","PORTEZUELO","PROVIDENCIA","PUCHUNCAVI","PUCON","PUDAHUEL","PUENTE ALTO","PUERTO MONTT","PUERTO VARAS","PUMANQUE","PUNITAQUI","PUNTA ARENAS","QUILICURA","QUILPUE","QUINTA DE TILCOCO","QUINTA NORMAL","QUINTERO","QUIRIHUE","RANCAGUA","RANQUIL","RAUCO","RECOLETA","RENAICO","RENCA","RENGO","REQUINOA","RETIRO","RINCONADA","RIO BUENO","RIO CLARO","ROMERAL","SAGRADA FAMILIA","SALAMANCA","SAN ANTONIO","SAN BERNARDO","SAN CARLOS","SAN CLEMENTE","SAN ESTEBAN","SAN FABIAN","SAN FELIPE","SAN FERNANDO","SAN IGNACIO","SAN JAVIER","SAN JOSE DE MAIPO","SAN MIGUEL","SAN PEDRO","SAN PEDRO DE LA PAZ","SAN RAFAEL","SAN RAMON","SAN VICENTE","SANTA BARBARA","SANTA CRUZ","SANTA JUANA","SANTA MARIA","SANTIAGO","SANTO DOMINGO","TALAGANTE","TALCA","TALCAHUANO","TALTAL","TEMUCO","TENO","TIERRA AMARILLA","TIL-TIL","TOCOPILLA","TOME","TRAIGUEN","TUCAPEL","VALDIVIA","VALLENAR","VALPARAISO","VICUNA","VICTORIA","VILLA ALEGRE","VILLA ALEMANA","VILLARRICA","VINA DEL MAR","VITACURA","YERBAS BUENAS","YUMBEL","YUNGAY","ZAPALLAR"];
const BANCOS = ["BANCO DE CHILE","BANCO DEL ESTADO DE CHILE","SCOTIABANK","BCI","BCI MACH","BANCO BICE","HSBC BANK","BANCO SANTANDER","ITAU CHILE","BANCO SECURITY","BANCO FALABELLA","BANCO RIPLEY","BANCO CONSORCIO","COOPEUCH","TENPO PREPAGO S.A","MERCADO PAGO"];

// ── CSS ───────────────────────────────────────────────────────────
const CSS = `

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:   #f4f4f2;
    --s1:   #f4f4f2;
    --s2:   #ffffff;
    --b1:   #e5e7eb;
    --b2:   #d1d5db;
    --ac:   #06B6D4;
    --acL:  #22d3ee;
    --wh:   #1a1a1a;
    --wh2:  #374151;
    --mu:   #6b7280;
    --mu2:  #9ca3af;
    --gr:   #14B8A6;
    --rd:   #ef4444;
    --yl:   #f59e0b;
    --font: 'Inter', sans-serif;
    --mono: 'Inter', sans-serif;
    --head: 'Poppins', sans-serif;
  }

  html, body { height: 100%; background: var(--bg); color: var(--wh); font-family: var(--font); font-size: 16px; line-height: 1.6; overflow: hidden; }

  .page-wrap {
    height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }
  @media (max-width: 860px) {
    html, body { overflow: auto; }
    .page-wrap { grid-template-columns: 1fr; height: auto; }
    .hero-col  { display: none; }
    .form-col  { height: auto !important; overflow: visible !important; }
  }

  .hero-col {
    background: linear-gradient(160deg, #0f4c5c 0%, #0891b2 55%, #06B6D4 100%);
    border-right: 1px solid rgba(255,255,255,.1);
    padding: 2.5rem 2.5rem 3rem;
    display: flex; flex-direction: column; gap: 0;
    height: 100vh;
    overflow-y: auto;
    position: relative;
  }
  .hero-col::-webkit-scrollbar { width: 4px; }
  .hero-col::-webkit-scrollbar-track { background: transparent; }
  .hero-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,.2); border-radius: 2px; }

  .hero-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .hero-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .15; }

  .form-col {
    height: 100vh;
    overflow-y: auto;
    padding: 2.5rem 2.75rem 4rem;
    background: var(--s2);
  }
  .form-col::-webkit-scrollbar { width: 4px; }
  .form-col::-webkit-scrollbar-track { background: transparent; }
  .form-col::-webkit-scrollbar-thumb { background: var(--b2); border-radius: 2px; }

  .hero-brand { font-family: var(--font); font-size: .82rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.6); }
  .hero-title { font-family: var(--head); font-size: clamp(2.1rem, 3.5vw, 3rem); font-weight: 800; color: #ffffff; line-height: 1.1; letter-spacing: -.03em; margin: .9rem 0 .65rem; }
  .hero-title span { color: #67e8f9; }
  .hero-sub   { font-size: .97rem; color: rgba(255,255,255,.78); line-height: 1.75; }

  .hero-topbar { display: flex; align-items: center; gap: .6rem; margin-bottom: 1.75rem; }
  .hero-topbar-name { font-family: var(--font); font-weight: 700; font-size: .88rem; color: #fff; letter-spacing: -.01em; }
  .hero-topbar-sub  { font-size: .62rem; color: rgba(255,255,255,.5); letter-spacing: .06em; text-transform: uppercase; margin-top: 1px; }

  .hero-trust { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-top: 2rem; }
  .trust-item { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: .75rem 1rem; display: flex; align-items: center; gap: .6rem; }
  .trust-icon { width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .trust-text { font-size: .78rem; color: rgba(255,255,255,.85); font-weight: 500; line-height: 1.35; }
  .trust-text strong { display: block; font-size: .72rem; color: rgba(255,255,255,.5); font-weight: 400; }

  .hero-steps { margin-top: 2rem; }
  .step-item  { display: flex; align-items: flex-start; gap: .9rem; margin-bottom: 1.25rem; }
  .step-num   { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: .72rem; font-weight: 700; color: #ffffff; flex-shrink: 0; margin-top: .15rem; }
  .step-txt   { font-size: .88rem; color: rgba(255,255,255,.7); }
  .step-ttl   { font-weight: 700; color: #ffffff; margin-bottom: .1rem; font-size: .92rem; }

  .hero-note  { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); border-radius: 10px; padding: .9rem 1rem; margin-top: 2rem; }
  .hero-note-t{ font-size: .75rem; font-weight: 700; color: rgba(255,255,255,.9); text-transform: uppercase; letter-spacing: .07em; margin-bottom: .3rem; }
  .hero-note-b{ font-size: .84rem; color: rgba(255,255,255,.72); line-height: 1.6; }

  .form-header { margin-bottom: 1.75rem; }
  .form-title  { font-family: var(--head); font-size: clamp(1.9rem, 3.5vw, 2.8rem); font-weight: 800; color: var(--wh); line-height: 1.1; letter-spacing: -.03em; }
  .form-sub    { font-size: .92rem; color: var(--mu); margin-top: .55rem; line-height: 1.65; }

  .form-topbar { display: flex; align-items: center; gap: .55rem; margin-bottom: 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--b1); }
  .form-topbar-label { font-size: .78rem; font-weight: 600; color: var(--wh); letter-spacing: -.01em; }
  .form-topbar-sub   { font-size: .6rem; color: var(--mu); letter-spacing: .04em; text-transform: uppercase; margin-top: 1px; }

  .rut-wrap    { margin-bottom: 1.75rem; }
  .rut-label   { font-size: .78rem; font-weight: 700; color: var(--mu); text-transform: uppercase; letter-spacing: .07em; margin-bottom: .5rem; }
  .rut-input-w { position: relative; }
  .rut-input   { width: 100%; padding: .9rem 1rem .9rem 3rem; background: var(--s2); border: 2px solid var(--b1); border-radius: 10px; color: var(--wh); font-family: var(--mono); font-size: 1.05rem; font-weight: 500; outline: none; transition: border .2s; letter-spacing: .05em; }
  .rut-input:focus { border-color: var(--ac); }
  .rut-input.ok    { border-color: var(--gr); }
  .rut-input.err   { border-color: var(--rd); }
  .rut-icon  { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .rut-msg   { display: flex; align-items: center; gap: .4rem; font-size: .82rem; margin-top: .5rem; font-weight: 500; }
  .rut-msg.ok  { color: var(--gr); }
  .rut-msg.err { color: var(--rd); }

  .sec-title { font-family: var(--font); font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--mu); margin: 1.6rem 0 .9rem; display: flex; align-items: center; gap: .6rem; }
  .sec-title::after { content: ''; flex: 1; height: 1px; background: var(--b1); }

  .field-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
  .field-full  { grid-column: 1 / -1; }
  .field-wrap  { display: flex; flex-direction: column; gap: .35rem; }
  .field-label { font-size: .76rem; font-weight: 600; color: var(--wh2); text-transform: uppercase; letter-spacing: .06em; }
  .field-input, .field-select { width: 100%; padding: .75rem .95rem; background: var(--s2); border: 1.5px solid var(--b1); border-radius: 9px; color: var(--wh); font-family: var(--font); font-size: .9rem; outline: none; transition: border .15s; }
  .field-input:focus, .field-select:focus { border-color: var(--ac); }
  .field-select option { background: var(--s2); color: var(--wh); }
  .field-input::placeholder { color: var(--mu2); }

  .remate-grid { display: flex; flex-direction: column; gap: .65rem; }
  .remate-card { display: flex; align-items: center; gap: 1rem; padding: .9rem 1rem; background: var(--s1); border: 2px solid var(--b1); border-radius: 11px; cursor: pointer; transition: all .15s; }
  .remate-card:hover { border-color: var(--ac); background: rgba(6,182,212,.04); }
  .remate-card.sel   { border-color: var(--ac); background: rgba(6,182,212,.07); }
  .remate-card-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s; }
  .remate-card.sel .remate-card-radio { border-color: var(--ac); background: var(--ac); }
  .remate-card-dot   { width: 8px; height: 8px; border-radius: 50%; background: #fff; opacity: 0; transition: opacity .15s; }
  .remate-card.sel .remate-card-dot  { opacity: 1; }
  .remate-card-info  { flex: 1; min-width: 0; }
  .remate-card-name  { font-weight: 700; font-size: .92rem; color: var(--wh); }
  .remate-card-meta  { font-size: .76rem; color: var(--mu); margin-top: .1rem; }
  .remate-card-badge { font-size: .64rem; font-weight: 700; padding: .15rem .5rem; border-radius: 5px; white-space: nowrap; }
  .rb-activo   { background: rgba(20,184,166,.1);  color: var(--gr); }
  .rb-publicado{ background: rgba(6,182,212,.1);   color: var(--ac); }

  .modal-pills { display: flex; gap: .6rem; }
  .mpill { flex: 1; padding: .7rem; text-align: center; border-radius: 9px; border: 2px solid var(--b1); background: var(--s2); font-size: .84rem; font-weight: 600; color: var(--mu); cursor: pointer; transition: all .15s; }
  .mpill:hover { border-color: var(--b2); }
  .mpill.sel  { border-color: var(--ac); background: rgba(6,182,212,.08); color: var(--ac); }

  .file-zone { display: block; border: 2px dashed var(--b2); border-radius: 11px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all .15s; background: var(--s1); }
  .file-zone:hover { border-color: var(--ac); background: rgba(6,182,212,.04); }
  .file-zone.filled { border-color: var(--gr); border-style: solid; background: rgba(20,184,166,.04); }
  .file-zone input  { display: none; }
  .file-icon { margin-bottom: .6rem; }
  .file-text { font-size: .84rem; color: var(--mu); }
  .file-name { font-size: .86rem; font-weight: 600; color: var(--gr); }
  .file-hint { font-size: .7rem; color: var(--mu2); margin-top: .3rem; }

  .check-row { display: flex; align-items: flex-start; gap: .75rem; cursor: pointer; }
  .check-box { width: 18px; height: 18px; border-radius: 5px; border: 2px solid var(--b2); background: var(--s2); flex-shrink: 0; margin-top: .15rem; display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .check-box.on { background: var(--ac); border-color: var(--ac); }
  .check-label { font-size: .86rem; color: var(--mu); line-height: 1.5; }

  .submit-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, #06B6D4, #14B8A6); border: none; border-radius: 11px; color: #fff; font-family: var(--font); font-size: 1rem; font-weight: 700; cursor: pointer; letter-spacing: .02em; transition: all .2s; margin-top: 1.5rem; }
  .submit-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(6,182,212,.3); }
  .submit-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

  .monto-badge { display: flex; align-items: center; justify-content: space-between; padding: .8rem 1rem; background: rgba(245,158,11,.06); border: 1px solid rgba(245,158,11,.25); border-radius: 9px; margin-top: .75rem; }
  .monto-label { font-size: .78rem; color: var(--yl); font-weight: 600; }
  .monto-val   { font-family: var(--mono); font-size: 1.05rem; font-weight: 700; color: var(--yl); }

  .err-msg  { background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.2); border-radius: 9px; padding: .8rem 1rem; font-size: .84rem; color: #ef4444; margin-top: .75rem; }
  .success-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 1.5rem; min-height: 60vh; }
  .success-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(20,184,166,.1); border: 2px solid rgba(20,184,166,.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
  .success-title { font-family: var(--head); font-size: 1.5rem; font-weight: 800; color: var(--wh); margin-bottom: .75rem; }
  .success-sub   { font-size: .92rem; color: var(--mu); max-width: 340px; line-height: 1.7; }
  .success-num   { font-family: var(--mono); font-size: 2rem; font-weight: 700; color: var(--ac); margin: 1.2rem 0 .4rem; }
  .success-num-l { font-size: .74rem; color: var(--mu2); text-transform: uppercase; letter-spacing: .1em; }

  .loading-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; gap: .75rem; color: var(--mu); font-size: .9rem; background: var(--bg); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--b1); border-top-color: var(--ac); border-radius: 50%; animation: spin .8s linear infinite; }

  .casa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1.5rem; }
  .casa-card { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 1.25rem 1rem; background: var(--s1); border: 2px solid var(--b1); border-radius: 12px; cursor: pointer; transition: all .15s; text-align: center; }
  .casa-card:hover { border-color: var(--ac); background: rgba(6,182,212,.04); }
  .casa-card.sel   { border-color: var(--ac); background: rgba(6,182,212,.07); }
  .casa-card-name  { font-size: .9rem; font-weight: 700; color: var(--wh); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  .fade-up { animation: fadeUp .4s ease both; }
  .fade-up-1 { animation-delay: .05s; }
  .fade-up-2 { animation-delay: .1s; }
  .fade-up-3 { animation-delay: .15s; }
  .fade-up-4 { animation-delay: .2s; }
`;

function ParticiparContent() {
  const searchParams = useSearchParams();
  const idParam   = searchParams.get("id")   || "";   // nuevo: ?id=UUID
  const slugParam = searchParams.get("casa") || "";   // legado: ?casa=slug
  const returnUrl = (() => {
    try { return searchParams.get("return") ? decodeURIComponent(searchParams.get("return")) : ""; }
    catch { return ""; }
  })();

  const [casas,   setCasas]   = useState([]);
  const [casa,    setCasa]    = useState(null);
  const [remates, setRemates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound,setNotFound]= useState(false);
  const [casaSlug,setCasaSlug]= useState(slugParam);
  const [countdown, setCountdown] = useState(null); // para redirect automático

  // Form state
  const [rut,       setRut]       = useState("");
  const [rutStatus, setRutStatus] = useState(null);
  const [formReady, setFormReady] = useState(false);
  const [nombre,    setNombre]    = useState("");
  const [email,     setEmail]     = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [giro,      setGiro]      = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna,    setComuna]    = useState("");
  const [banco,     setBanco]     = useState("");
  const [tipoCta,   setTipoCta]   = useState("CUENTA CORRIENTE");
  const [numCta,    setNumCta]    = useState("");
  const [remateId,  setRemateId]  = useState("");
  const [modalidad, setModalidad] = useState("PRESENCIAL");
  const [comprobante, setComprobante] = useState(null);
  const [suscribir, setSuscribir] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(null);

  // Cargar casa por ?id= (UUID) o por ?casa= (slug), o todas si ninguno
  useEffect(() => {
    const load = async () => {
      // ── Prioridad 1: ?id=UUID ──────────────────────────────────────
      if (idParam) {
        const { data: casaData } = await supabase
          .from("casas").select("*").eq("id", idParam).single();
        if (!casaData) { setNotFound(true); setLoading(false); return; }
        setCasa(casaData);
        const { data: rematesData } = await supabase
          .from("remates").select("*")
          .eq("casa_id", casaData.id)
          .in("estado", ["publicado","en_vivo","activo"])
          .order("fecha");
        setRemates(rematesData || []);
        setLoading(false);
        return;
      }

      // ── Prioridad 2: ?casa=slug (legado) ──────────────────────────
      if (!casaSlug) {
        const { data } = await supabase.from("casas").select("*").order("nombre");
        setCasas(data || []);
        setLoading(false);
        return;
      }

      const { data: casaData } = await supabase
        .from("casas").select("*").eq("slug", casaSlug).single();

      if (!casaData) { setNotFound(true); setLoading(false); return; }
      setCasa(casaData);

      const { data: rematesData } = await supabase
        .from("remates").select("*")
        .eq("casa_id", casaData.id)
        .in("estado", ["publicado","en_vivo","activo"])
        .order("fecha");

      setRemates(rematesData || []);
      setLoading(false);
    };
    load();
  }, [idParam, casaSlug]);

  // Countdown y redirect automático tras éxito (si hay returnUrl)
  useEffect(() => {
    if (!success || !returnUrl) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); window.location.href = returnUrl; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, returnUrl]);

  const handleSelectCasa = async (c) => {
    setCasa(c);
    setCasaSlug(c.slug);
    setLoading(true);
    const { data } = await supabase.from("remates").select("*")
      .eq("casa_id", c.id).in("estado", ["publicado","en_vivo","activo"]).order("fecha");
    setRemates(data || []);
    setLoading(false);
  };

  const handleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    if (formatted.includes("-") && formatted.length >= 8) {
      const valid = validarRut(formatted);
      setRutStatus(valid ? "ok" : "err");
      setFormReady(valid);
    } else {
      setRutStatus(null);
      setFormReady(false);
    }
  };

  const remateSeleccionado = remates.find(r => r.id === remateId);

  const handleSubmit = async () => {
    setError("");
    if (!rut || rutStatus !== "ok")   { setError("RUT inválido. Verifica el formato."); return; }
    if (!nombre.trim())               { setError("Ingresa tu nombre completo o razón social."); return; }
    if (!email.trim())                { setError("Ingresa tu correo electrónico."); return; }
    if (!giro.trim())                 { setError("El giro o actividad es obligatorio para la facturación."); return; }
    if (!direccion.trim())            { setError("La dirección es obligatoria para la facturación."); return; }
    if (!banco)                       { setError("Selecciona el banco para la devolución de garantía."); return; }
    if (!numCta.trim())               { setError("El número de cuenta es obligatorio para devolver la garantía."); return; }
    if (!remateId)                    { setError("Selecciona un remate para inscribirte."); return; }
    if (!comprobante)                 { setError("Debes adjuntar el comprobante de transferencia."); return; }

    setSubmitting(true);

    try {
      // 0. Verificar que el RUT no esté ya registrado
      const { data: rutExistente } = await supabase
        .from("postores")
        .select("id")
        .eq("rut", rut.trim())
        .limit(1)
        .single();
      if (rutExistente) {
        setError("Ya tienes una cuenta registrada con este RUT. Ingresa en gestionderemates.cl/dashboard con tu correo y contraseña. Si no recuerdas tu contraseña, usa la opción '¿Olvidaste tu contraseña?' en el login.");
        setSubmitting(false);
        return;
      }

      // 1. Crear cuenta Supabase Auth para el postor
      let userId = null;
      let tempPassword = null;
      try {
        tempPassword = randomPassword(8);
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: email.trim(),
          password: tempPassword,
        });
        if (!authErr && authData?.user) {
          userId = authData.user.id;
        }
      } catch(e) { /* continuar sin user_id si falla */ }

      // 2. Subir comprobante
      let comprobanteUrl = null;
      try {
        const ext = comprobante.name.split(".").pop();
        const path = `comprobantes/${remateId}/${Date.now()}-${rut.replace("-","")}.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage
          .from("comprobantes").upload(path, comprobante, { upsert: false });
        if (!upErr && upData) {
          const { data: urlData } = supabase.storage.from("comprobantes").getPublicUrl(path);
          comprobanteUrl = urlData?.publicUrl || null;
        }
      } catch(e) {}

      // 3. Número de postor
      const { data: maxPostor } = await supabase
        .from("postores").select("numero")
        .eq("remate_id", remateId).order("numero", { ascending: false }).limit(1).single();
      const numero = (maxPostor?.numero || 0) + 1;

      // 4. Insertar postor
      const { data: postorData, error: postorErr } = await supabase
        .from("postores").insert({
          casa_id:         casa.id,
          remate_id:       remateId,
          numero,
          nombre:          nombre.trim(),
          rut:             rut.trim(),
          email:           email.trim(),
          telefono:        telefono.trim(),
          tipo:            giro ? "empresa" : "natural",
          empresa:         giro.trim() || null,
          direccion:       direccion.trim() || null,
          comuna:          comuna || null,
          estado:          "pendiente",
          modalidad:       modalidad,
          banco:           banco || null,
          tipo_cuenta:     tipoCta || null,
          numero_cuenta:   numCta.trim() || null,
          comprobante_url: comprobanteUrl,
          suscrito:        suscribir,
          user_id:         userId,
        }).select().single();

      if (postorErr) throw new Error(postorErr.message);

      const emailPayload = {
        nombre,
        numero:        String(numero).padStart(3,"0"),
        remate:        remateSeleccionado?.nombre || "Remate",
        fecha:         remateSeleccionado?.fecha || null,
        casa:          casa.nombre,
        logo_url:      casa.logo_url || null,
        email_cliente: email.trim(),
        email_casa:    casa.email || null,
        rut:           rut.trim(),
        telefono:      telefono.trim(),
        giro:          giro.trim(),
        direccion:     direccion.trim(),
        comuna:        comuna || null,
        banco:         banco,
        tipo_cuenta:   tipoCta,
        numero_cuenta: numCta.trim(),
        modalidad:     modalidad,
      };

      // 5a. Email de bienvenida con credenciales (si se creó cuenta nueva)
      if (userId && tempPassword) {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "bienvenida_postor",
              nombre,
              email_cliente: email.trim(),
              casa: casa.nombre,
              logo_url: casa.logo_url || null,
              temp_password: tempPassword,
            }),
          });
        } catch(e) {}
      }

      // 5b. Email pre-inscripción al cliente
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...emailPayload, tipo: "cliente" }),
        });
      } catch(e) {}

      // 5c. Email al martillero/casa
      if (casa.email) {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...emailPayload, tipo: "casa" }),
          });
        } catch(e) {}
      }

      setSuccess({
        numero: String(numero).padStart(3,"0"),
        remate: remateSeleccionado?.nombre || "Remate",
        fecha:  remateSeleccionado?.fecha,
        cuentaCreada: !!userId,
      });

    } catch(e) {
      setError("Error al registrar: " + e.message);
    }
    setSubmitting(false);
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="loading-wrap">
      <style>{CSS}</style>
      <div className="spinner"/>
      <span>Cargando...</span>
    </div>
  );

  if (notFound) return (
    <div className="loading-wrap">
      <style>{CSS}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"1.2rem",fontWeight:700,color:"var(--wh)",marginBottom:".5rem"}}>Casa de remates no encontrada</div>
        <div style={{fontSize:".85rem",color:"var(--mu)"}}>Verifica la URL o contacta a GR Auction Software.</div>
      </div>
    </div>
  );

  // ── Sin slug: selector de casa ───────────────────────────────────
  if (!casaSlug && !casa) return (
    <div className="loading-wrap" style={{flexDirection:"column",gap:"1.5rem",padding:"2rem"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",maxWidth:480,width:"100%"}}>
        <div style={{fontFamily:"'Poppins', sans-serif",fontSize:"1.5rem",fontWeight:800,color:"var(--wh)",marginBottom:".5rem",letterSpacing:"-.02em"}}>Inscripción de postor</div>
        <div style={{fontSize:".9rem",color:"var(--mu)",marginBottom:"2rem"}}>Selecciona la casa de remates en la que quieres participar.</div>
        <div className="casa-grid">
          {casas.map(c => (
            <div key={c.id} className="casa-card" onClick={() => handleSelectCasa(c)}>
              {c.logo_url
                ? <img src={c.logo_url} alt={c.nombre} style={{maxHeight:48,maxWidth:120,objectFit:"contain"}}/>
                : <div style={{fontSize:".82rem",fontWeight:700,color:"var(--mu)"}}>{c.nombre}</div>}
              <div className="casa-card-name">{c.nombre}</div>
            </div>
          ))}
        </div>
        {casas.length === 0 && <div style={{color:"var(--mu)",fontSize:".85rem"}}>No hay casas de remates disponibles en este momento.</div>}
      </div>
    </div>
  );

  // ── Vista principal ──────────────────────────────────────────────
  return (
    <div className="page-wrap">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="hero-col">
        <div className="hero-bg">
          <div className="hero-orb" style={{width:300,height:300,background:"#1d4ed8",top:-80,left:-100}}/>
          <div className="hero-orb" style={{width:200,height:200,background:"#0ea5e9",bottom:100,right:-60}}/>
        </div>
        <div style={{position:"relative",zIndex:1}}>

          {/* Logo GR + nombre plataforma */}
          <div className="hero-topbar">
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="rgba(255,255,255,.5)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            </svg>
            <div>
              <div className="hero-topbar-name">GR Auction Software</div>
              <div className="hero-topbar-sub">gestionderemates.cl</div>
            </div>
          </div>

          {/* Logo de la casa si existe */}
          {casa?.logo_url && (
            <div style={{marginBottom:"1.25rem",paddingBottom:"1.25rem",borderBottom:"1px solid rgba(255,255,255,.12)"}}>
              <img src={casa.logo_url} alt={casa.nombre} style={{maxHeight:48,maxWidth:180,objectFit:"contain",display:"block"}}/>
            </div>
          )}

          {/* Eyebrow con nombre de la casa */}
          <div className="hero-brand" style={{marginBottom:".5rem"}}>
            {casa?.nombre ? `Remates — ${casa.nombre}` : "Portal de Inscripción"}
          </div>

          <div className="hero-title">Inscríbete y<br/><span>participa en vivo.</span></div>
          <div className="hero-sub">Regístrate para participar en nuestros remates. El proceso toma menos de 3 minutos y es 100% online.</div>

          <div className="hero-steps">
            {[
              ["Valida tu RUT", "Verificamos que tu RUT sea válido antes de continuar."],
              ["Completa tus datos", "Nombre, contacto y datos bancarios para devolución."],
              ["Elige el remate", "Selecciona el remate al que deseas inscribirte."],
              ["Adjunta comprobante", "Sube el comprobante de la garantía transferida."],
              ["Confirmación", "Recibirás un correo con tu cuenta de acceso y pre-inscripción."],
            ].map(([ttl, txt], i) => (
              <div className="step-item" key={i}>
                <div className="step-num">{i+1}</div>
                <div className="step-txt">
                  <div className="step-ttl">{ttl}</div>
                  {txt}
                </div>
              </div>
            ))}
          </div>

          <div className="hero-note">
            <div className="hero-note-t">Importante</div>
            <div className="hero-note-b">
              Tu inscripción quedará como <strong style={{color:"rgba(255,255,255,.95)"}}>pre-inscrita</strong> hasta que {casa?.nombre} verifique el pago de la garantía. Recibirás confirmación por correo.
            </div>
          </div>

          {/* Trust items */}
          <div className="hero-trust">
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2l1.5 3.5H13l-2.8 2 1 3.5L8 9.2l-3.2 1.8 1-3.5L3 5.5h3.5z"/></svg>
              </div>
              <div className="trust-text">Proceso validado<strong>RUT + garantía</strong></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="12" height="9" rx="2"/><path d="M5 5V4a3 3 0 016 0v1"/></svg>
              </div>
              <div className="trust-text">Datos seguros<strong>cifrado de extremo a extremo</strong></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>
              </div>
              <div className="trust-text">Menos de 3 min<strong>registro completo</strong></div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>
              </div>
              <div className="trust-text">Confirmación inmediata<strong>por correo electrónico</strong></div>
            </div>
          </div>

          <div style={{marginTop:"2rem",paddingTop:"1.25rem",borderTop:"1px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",gap:".6rem"}}>
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="rgba(255,255,255,.9)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="rgba(255,255,255,.4)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{fontFamily:"'Inter',sans-serif",fontSize:".7rem",color:"rgba(255,255,255,.6)",letterSpacing:".04em"}}>
              Powered by <strong style={{color:"rgba(255,255,255,.9)"}}>GR Auction Software</strong> · gestionderemates.cl
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="form-col">
        {success ? (
          <div className="success-wrap fade-up">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round"><path d="M6 16l8 8 12-14"/></svg>
            </div>
            <div className="success-title">¡Pre-inscripción enviada!</div>
            <div className="success-num">#{success.numero}</div>
            <div className="success-num-l">Tu número de postor provisional</div>
            <div className="success-sub" style={{marginTop:"1rem"}}>
              Te inscribiste en <strong style={{color:"var(--wh)"}}>{success.remate}</strong>.
              <br/><br/>
              {success.cuentaCreada
                ? <>Se creó tu cuenta de acceso. <strong style={{color:"var(--wh)"}}>Revisa tu correo</strong> para obtener tu contraseña provisoria.</>
                : <>Tu participación será <strong style={{color:"var(--wh)"}}>confirmada por {casa?.nombre}</strong> una vez que verifiquen tu comprobante.</>}
            </div>
            {/* Botones de acción post-inscripción */}
            <div style={{marginTop:"1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:".75rem",width:"100%",maxWidth:320}}>
              {success.cuentaCreada && (
                <a href="/dashboard" style={{display:"block",width:"100%",padding:".75rem 2rem",background:"linear-gradient(135deg,#06B6D4,#14B8A6)",color:"#fff",borderRadius:10,fontWeight:700,fontSize:".9rem",textDecoration:"none",textAlign:"center"}}>
                  Ir al portal de postores →
                </a>
              )}
              {returnUrl && (
                <a href={returnUrl} style={{display:"block",width:"100%",padding:".7rem 2rem",background:"none",border:"1.5px solid var(--b2)",color:"var(--wh2)",borderRadius:10,fontWeight:600,fontSize:".88rem",textDecoration:"none",textAlign:"center"}}>
                  ← Volver{countdown !== null && countdown > 0 ? ` (${countdown}s)` : ""}
                </a>
              )}
            </div>

            <div style={{marginTop:"1.25rem",padding:"1rem 1.5rem",background:"rgba(6,182,212,.06)",border:"1px solid rgba(6,182,212,.15)",borderRadius:10,maxWidth:320,width:"100%",fontSize:".78rem",color:"#6b7280",lineHeight:1.7}}>
              <div style={{fontWeight:700,color:"#1a1a1a",marginBottom:".3rem"}}>¿Dudas?</div>
              Contacta a {casa?.nombre}<br/>
              {casa?.email && <>{casa.email}<br/></>}
              {casa?.telefono && <>{casa.telefono}</>}
            </div>
          </div>
        ) : (
          <>
            {/* Logo GR Auction Software — visible en todas las pantallas */}
            <div className="form-topbar">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#06B6D4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M4 12 Q4 5 12 5 L20 5" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              </svg>
              <div>
                <div className="form-topbar-label">GR Auction Software</div>
                <div className="form-topbar-sub">Portal de inscripción</div>
              </div>
            </div>

            <div className="form-header fade-up" style={{textAlign:"center"}}>
              {/* Logo de la casa si existe */}
              {casa?.logo_url ? (
                <div style={{display:"flex",justifyContent:"center",marginBottom:"1.25rem"}}>
                  <img src={casa.logo_url} alt={casa.nombre} style={{maxHeight:64,maxWidth:220,objectFit:"contain",display:"block"}}/>
                </div>
              ) : casa?.nombre ? (
                <div style={{display:"flex",justifyContent:"center",marginBottom:"1.25rem"}}>
                  <div style={{display:"inline-flex",alignItems:"center",gap:".4rem",padding:".45rem 1rem",background:"rgba(6,182,212,.06)",border:"1px solid rgba(6,182,212,.18)",borderRadius:8}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:".85rem",color:"#1a1a1a"}}>{casa.nombre}</span>
                  </div>
                </div>
              ) : null}
              <div className="form-title">Inscríbete y<br/>participa en vivo.</div>
              <div className="form-sub">Completa el formulario para participar en los remates de {casa?.nombre || "esta casa"}. El proceso toma menos de 3 minutos.</div>
              <div style={{width:48,height:3,background:"linear-gradient(90deg,#06B6D4,#14B8A6)",borderRadius:2,margin:"1.1rem auto 0"}}/>
            </div>

            {/* RUT */}
            <div className="rut-wrap fade-up fade-up-1">
              <div className="rut-label">Paso 1 — Valida tu RUT</div>
              <div className="rut-input-w">
                <svg className="rut-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={rutStatus==="ok"?"#14B8A6":rutStatus==="err"?"#ef4444":"#4a6a8a"} strokeWidth="1.6" strokeLinecap="round">
                  <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h4M5 10.5h2"/>
                </svg>
                <input
                  className={`rut-input${rutStatus==="ok"?" ok":rutStatus==="err"?" err":""}`}
                  placeholder="12.345.678-9"
                  value={rut}
                  onChange={handleRutChange}
                  maxLength={12}
                />
              </div>
              {rutStatus==="ok"  && <div className="rut-msg ok"><svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 7l4 4 6-7"/></svg>RUT válido — puedes continuar</div>}
              {rutStatus==="err" && <div className="rut-msg err"><svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>RUT inválido — verifica el número y dígito verificador</div>}
              {!rutStatus        && <div className="rut-msg" style={{color:"var(--mu)"}}>Sin puntos, con guión — ejemplo: 12345678-9</div>}
            </div>

            {formReady && (
              <>
                <div className="sec-title fade-up">Información personal</div>
                <div className="field-grid fade-up fade-up-1">
                  <div className="field-wrap field-full">
                    <label className="field-label">Nombre completo / Razón social *</label>
                    <input className="field-input" placeholder="Juan Pérez Soto / Empresa S.A." value={nombre} onChange={e=>setNombre(e.target.value)}/>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Correo electrónico *</label>
                    <input className="field-input" type="email" placeholder="correo@empresa.cl" value={email} onChange={e=>setEmail(e.target.value)}/>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Teléfono</label>
                    <input className="field-input" placeholder="+56 9 1234 5678" value={telefono} onChange={e=>setTelefono(e.target.value)}/>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Giro / Actividad *</label>
                    <input className="field-input" placeholder="Particular / Transporte / etc." value={giro} onChange={e=>setGiro(e.target.value)}/>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Dirección *</label>
                    <input className="field-input" placeholder="Av. Los Aromos 234" value={direccion} onChange={e=>setDireccion(e.target.value)}/>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Comuna</label>
                    <select className="field-select" value={comuna} onChange={e=>setComuna(e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {COMUNAS.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="sec-title fade-up">Datos para devolución de garantía</div>
                <div className="field-grid fade-up fade-up-1">
                  <div className="field-wrap">
                    <label className="field-label">Banco *</label>
                    <select className="field-select" value={banco} onChange={e=>setBanco(e.target.value)}>
                      <option value="">— Selecciona banco —</option>
                      {BANCOS.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Tipo de cuenta</label>
                    <select className="field-select" value={tipoCta} onChange={e=>setTipoCta(e.target.value)}>
                      <option>CUENTA CORRIENTE</option>
                      <option>CUENTA VISTA</option>
                      <option>CUENTA AHORRO</option>
                    </select>
                  </div>
                  <div className="field-wrap field-full">
                    <label className="field-label">Número de cuenta *</label>
                    <input className="field-input" style={{fontFamily:"var(--mono)"}} placeholder="123456789" value={numCta} onChange={e=>setNumCta(e.target.value)}/>
                  </div>
                </div>

                <div className="sec-title fade-up">Selección de remate *</div>
                <div className="remate-grid fade-up fade-up-1">
                  {remates.length === 0 ? (
                    <div style={{padding:"1.5rem",textAlign:"center",color:"var(--mu)",fontSize:".82rem",background:"var(--s1)",borderRadius:10,border:"1px solid var(--b1)"}}>
                      No hay remates activos en este momento.
                    </div>
                  ) : remates.map(r => (
                    <div key={r.id} className={`remate-card${remateId===r.id?" sel":""}`} onClick={()=>setRemateId(r.id)}>
                      <div className="remate-card-radio"><div className="remate-card-dot"/></div>
                      <div className="remate-card-info">
                        <div className="remate-card-name">{r.nombre}</div>
                        <div className="remate-card-meta">
                          {new Date(r.fecha).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                          {r.hora && ` · ${r.hora}`}
                          {" · "}{r.modalidad}
                        </div>
                      </div>
                      <span className={`remate-card-badge ${r.estado==="en_vivo"||r.estado==="activo"?"rb-activo":"rb-publicado"}`}>
                        {r.estado==="en_vivo"||r.estado==="activo"?"● En vivo":"Próximo"}
                      </span>
                    </div>
                  ))}
                </div>

                {remateSeleccionado && (
                  <div className="monto-badge fade-up">
                    <span className="monto-label">Garantía requerida para este remate</span>
                    <span className="monto-val">$300.000</span>
                  </div>
                )}

                {remateSeleccionado && (
                  <>
                    <div className="sec-title fade-up">Forma de participación</div>
                    <div className="modal-pills fade-up fade-up-1">
                      {["PRESENCIAL","REMOTO"].map(m=>(
                        <div key={m} className={`mpill${modalidad===m?" sel":""}`} onClick={()=>setModalidad(m)}>
                          {m==="PRESENCIAL"?"Presencial":"Remoto (online)"}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="sec-title fade-up">Comprobante de transferencia *</div>
                <label className={`file-zone fade-up${comprobante?" filled":""}`}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setComprobante(e.target.files[0]||null)}/>
                  {comprobante ? (
                    <>
                      <div className="file-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round"><path d="M6 3h11l5 5v17H6V3z"/><path d="M17 3v5h5"/><path d="M9 13l4 4 6-7"/></svg></div>
                      <div className="file-name">{comprobante.name}</div>
                      <div className="file-hint">Click para cambiar el archivo</div>
                    </>
                  ) : (
                    <>
                      <div className="file-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#4a6a8a" strokeWidth="1.6" strokeLinecap="round"><path d="M14 3v14M10 7l4-4 4 4"/><path d="M4 20v3a2 2 0 002 2h16a2 2 0 002-2v-3"/></svg></div>
                      <div className="file-text">Arrastra tu comprobante aquí o <strong style={{color:"var(--ac)"}}>haz click para seleccionar</strong></div>
                      <div className="file-hint">PDF, JPG o PNG — máx. 5MB</div>
                    </>
                  )}
                </label>

                <div style={{marginTop:"1.2rem"}} className="fade-up">
                  <div className="check-row" onClick={()=>setSuscribir(v=>!v)}>
                    <div className={`check-box${suscribir?" on":""}`}>
                      {suscribir && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M1 4l3 3 5-6"/></svg>}
                    </div>
                    <span className="check-label">Deseo recibir información de próximos remates de {casa?.nombre}</span>
                  </div>
                </div>

                {error && <div className="err-msg fade-up">{error}</div>}

                <button className="submit-btn fade-up" disabled={submitting || !formReady} onClick={handleSubmit}>
                  {submitting ? "Creando cuenta e inscripción..." : "Enviar inscripción →"}
                </button>

                <div style={{marginTop:"1rem",fontSize:".7rem",color:"var(--mu)",textAlign:"center",lineHeight:1.6}}>
                  Al enviar, se creará tu cuenta de postor y tu inscripción quedará como <strong style={{color:"var(--mu2)"}}>pre-inscrita</strong> hasta verificación.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ParticiparPage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:".75rem",color:"#6b7280",fontSize:".9rem",background:"#f4f4f2"}}>
        <div style={{width:20,height:20,border:"2px solid #e5e7eb",borderTopColor:"#06B6D4",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
        Cargando...
      </div>
    }>
      <ParticiparContent />
    </Suspense>
  );
}
