import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function tokenFromReq(req) {
  const header = req.headers.get("Authorization") || "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

export async function requireAuth(req) {
  const token = tokenFromReq(req);
  if (!token) return { error: "No autorizado", status: 401, user: null };

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { error: "Token inválido o expirado", status: 401, user: null };

  return { user, error: null, status: 200 };
}

export async function requireAdmin(req) {
  const result = await requireAuth(req);
  if (result.error) return result;

  const { data: perfil } = await supabaseAdmin
    .from("usuarios")
    .select("roles")
    .eq("id", result.user.id)
    .single();

  if (!perfil?.roles?.includes("admin")) {
    return { error: "Acceso denegado — solo administradores", status: 403, user: null };
  }

  return result;
}
