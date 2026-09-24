import { NextResponse } from "next/server";
import { supabaseAdmin } from "../_lib/auth";

export const dynamic = 'force-dynamic';

// Rate limit: 5 actualizaciones por IP cada 10 min (endpoint público de escritura)
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
const rlMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rlMap.get(ip);
  if (!entry || now > entry.resetAt) { rlMap.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS }); return true; }
  if (entry.count >= RL_MAX) return false;
  entry.count++;
  return true;
}

// GET /api/devoluciones?p=<postor-uuid>
// Carga los datos del postor + remate + casa para pre-rellenar el formulario.
// El UUID actúa como token de acceso (128 bits, imposible de adivinar).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postorId = (searchParams.get("p") || "").trim();

  // Validación básica de formato UUID
  if (!/^[0-9a-f-]{36}$/i.test(postorId)) {
    return NextResponse.json({ error: "enlace_invalido" }, { status: 400 });
  }

  const { data: postor, error } = await supabaseAdmin
    .from("postores")
    .select("id, numero, nombre, rut, banco, tipo_cuenta, numero_cuenta, remate_id, casa_id")
    .eq("id", postorId)
    .single();

  if (error || !postor) {
    return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  }

  // Fetch remate y casa en paralelo
  const [remateRes, casaRes] = await Promise.all([
    postor.remate_id
      ? supabaseAdmin.from("remates").select("nombre, fecha").eq("id", postor.remate_id).single()
      : Promise.resolve({ data: null }),
    postor.casa_id
      ? supabaseAdmin.from("casas").select("nombre, logo_url").eq("id", postor.casa_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    postor,
    remate: remateRes.data || null,
    casa:   casaRes.data   || null,
  });
}

// PATCH /api/devoluciones
// Guarda los datos bancarios del postor identificado por su UUID.
export async function PATCH(request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en unos minutos." }, { status: 429 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { postorId, banco, tipoCuenta, numeroCuenta, titular } = body;

  if (!/^[0-9a-f-]{36}$/i.test(postorId)) {
    return NextResponse.json({ error: "enlace_invalido" }, { status: 400 });
  }
  if (!banco?.trim())        return NextResponse.json({ error: "Banco requerido" },   { status: 400 });
  if (!tipoCuenta?.trim())   return NextResponse.json({ error: "Tipo requerido" },    { status: 400 });
  if (!numeroCuenta?.trim()) return NextResponse.json({ error: "Número requerido" },  { status: 400 });

  const payload = {
    banco:         banco.trim(),
    tipo_cuenta:   tipoCuenta.trim(),
    numero_cuenta: numeroCuenta.trim(),
  };

  // Intentar guardar con titular_cuenta; si la columna no existe, guardar sin ella
  const { error: errConTitular } = await supabaseAdmin
    .from("postores")
    .update({ ...payload, titular_cuenta: titular?.trim() || null })
    .eq("id", postorId);

  if (errConTitular) {
    if (errConTitular.message?.includes("titular_cuenta") || errConTitular.code === "PGRST204") {
      const { error: errSinTitular } = await supabaseAdmin
        .from("postores")
        .update(payload)
        .eq("id", postorId);
      if (errSinTitular) return NextResponse.json({ error: errSinTitular.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: errConTitular.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
