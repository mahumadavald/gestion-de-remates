import { NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_lib/auth";

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await supabaseAdmin.from("usuarios").delete().eq("id", id);

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
