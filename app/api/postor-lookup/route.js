import { createClient } from "@supabase/supabase-js";

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

// GET /api/postor-lookup?rut=12345678-9
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rut = (searchParams.get("rut") || "").trim().toUpperCase();

  if (!rut || !validarRut(rut)) {
    return Response.json({ found: false }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("postores")
    .select("nombre, email, telefono, empresa, direccion, comuna")
    .eq("rut", rut)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return Response.json({ found: false });

  return Response.json({ found: true, data });
}
