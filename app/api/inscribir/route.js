import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// POST /api/inscribir
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    rut, nombre, email, telefono, giro, direccion, comuna,
    banco, tipoCta, numCta, remateId, casaId, modalidad,
    comprobanteUrl, suscribir, userId,
  } = body;

  // Validaciones mínimas server-side
  if (!validarRut(rut))    return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
  if (!nombre?.trim())     return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (!email?.trim())      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  if (!remateId)           return NextResponse.json({ error: "Remate requerido" }, { status: 400 });
  if (!casaId)             return NextResponse.json({ error: "Casa requerida" }, { status: 400 });

  // 1. Verificar duplicado (usa service key — anon ya no necesita SELECT)
  const { data: yaInscrito } = await supabaseAdmin
    .from("postores")
    .select("id")
    .eq("rut", rut.trim().toUpperCase())
    .eq("remate_id", remateId)
    .maybeSingle();

  if (yaInscrito) {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }

  // 2. Número de postor
  const { data: maxPostor } = await supabaseAdmin
    .from("postores")
    .select("numero")
    .eq("remate_id", remateId)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();
  const numero = (maxPostor?.numero || 0) + 1;

  // 3. Insertar
  const { data: postorData, error: postorErr } = await supabaseAdmin
    .from("postores")
    .insert({
      casa_id:         casaId,
      remate_id:       remateId,
      numero,
      nombre:          nombre.trim(),
      rut:             rut.trim().toUpperCase(),
      email:           email.trim(),
      telefono:        telefono?.trim() || null,
      tipo:            giro?.trim() ? "empresa" : "natural",
      empresa:         giro?.trim() || null,
      direccion:       direccion?.trim() || null,
      comuna:          comuna || null,
      estado:          "pendiente",
      modalidad:       modalidad || "PRESENCIAL",
      banco:           banco || null,
      tipo_cuenta:     tipoCta || null,
      numero_cuenta:   numCta?.trim() || null,
      comprobante_url: comprobanteUrl || null,
      suscrito:        suscribir ?? true,
      user_id:         userId || null,
    })
    .select()
    .single();

  if (postorErr) {
    return NextResponse.json({ error: postorErr.message }, { status: 500 });
  }

  return NextResponse.json({ numero, postor: postorData });
}
