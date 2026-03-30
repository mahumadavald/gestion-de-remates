import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY no configurada en Vercel" }, { status: 500 });
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey
    );
    const { email, password, nombre, casa_id, roles, activo } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    // Crear usuario en Supabase Auth con admin API (no cierra sesión del admin)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Insertar perfil en tabla usuarios
    const { error: dbErr } = await supabaseAdmin.from("usuarios").insert({
      id:      userId,
      email,
      nombre,
      casa_id: casa_id || null,
      roles:   roles   || [],
      activo:  activo  ?? true,
    });

    if (dbErr) {
      // Si falla la inserción en DB, borrar el usuario de Auth para no dejar inconsistencia
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Error al crear perfil: " + dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ id: userId });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
