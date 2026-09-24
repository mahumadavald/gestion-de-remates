import { supabaseAdmin } from "../_lib/auth";

export const dynamic = 'force-dynamic';

// Rate limit: 10 lookups por IP cada 5 min — previene enumeración de RUTs
const RL_WINDOW_MS = 5 * 60 * 1000;
const RL_MAX = 10;
const rlMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rlMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rlMap.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (entry.count >= RL_MAX) return false;
  entry.count++;
  return true;
}

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

// GET /api/postor-lookup?rut=12345678-9&casaId=UUID
export async function GET(request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!checkRateLimit(ip)) {
    return Response.json({ found: false }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rut    = (searchParams.get("rut")    || "").trim().toUpperCase();
  const casaId = (searchParams.get("casaId") || "").trim();

  if (!rut || !validarRut(rut)) {
    return Response.json({ found: false }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("postores")
    .select("nombre, email, telefono, empresa, direccion, comuna")
    .eq("rut", rut)
    .order("created_at", { ascending: false })
    .limit(1);

  if (casaId) query = query.eq("casa_id", casaId);

  const { data, error } = await query.maybeSingle();

  if (error || !data) return Response.json({ found: false });

  return Response.json({ found: true, data });
}
