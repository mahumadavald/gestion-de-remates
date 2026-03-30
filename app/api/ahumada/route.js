// ── Proxy seguro hacia la base de datos MySQL de Remates Ahumada ──
// Las credenciales MySQL nunca salen del servidor de ellos.
// Este route actúa como intermediario con un token secreto compartido.

export const dynamic = 'force-dynamic';

const AHUMADA_URL   = process.env.AHUMADA_API_URL;
const AHUMADA_TOKEN = process.env.AHUMADA_API_TOKEN;

// GET /api/ahumada?rut=12345678-9  →  lookup en cliente DB de Ahumada
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rut = searchParams.get("rut") || "";

  if (!rut) return Response.json({ found: false });

  try {
    const res = await fetch(
      `${AHUMADA_URL}?action=lookup_rut&rut=${encodeURIComponent(rut)}`,
      {
        headers: { "Authorization": `Bearer ${AHUMADA_TOKEN}` },
        signal: AbortSignal.timeout(6000), // 6s max — no bloquear el formulario
      }
    );
    if (!res.ok) return Response.json({ found: false });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    // Si el servidor de Ahumada no responde, simplemente retornamos not-found
    // El formulario igual funciona — esta integración es "best effort"
    console.warn("[ahumada] lookup error:", e.message);
    return Response.json({ found: false });
  }
}

// POST /api/ahumada  →  sync datos a las 2 tablas MySQL de Ahumada
// Body: { nombre, rut, email, telefono, giro, direccion, comuna, banco,
//         tipo_cuenta, numero_cuenta, modalidad, suscribir, comprobante_url }
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ success: false }, { status: 400 }); }

  try {
    const res = await fetch(`${AHUMADA_URL}?action=sync`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AHUMADA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    console.warn("[ahumada] sync error:", e.message);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
