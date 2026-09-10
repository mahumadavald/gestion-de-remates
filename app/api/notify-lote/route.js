import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "mahumadavald@gmail.com";
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL  || "TAKKA <notificaciones@takka.cl>";

export async function POST(request) {
  try {
    const body = await request.json();
    const { lote, bodegaAdmin } = body;

    if (!lote) return Response.json({ error: "Falta lote" }, { status: 400 });

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ ok: false, msg: "RESEND_API_KEY no configurada" }, { status: 200 });
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to:   [ADMIN_EMAIL],
      subject: `📦 Nuevo lote pendiente de revisión — ${lote.nombre}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0e7490,#06B6D4);padding:2rem;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;">TAKKA · Nuevo lote</h1>
            <p style="color:rgba(255,255,255,.8);margin:.4rem 0 0;font-size:.875rem;">Pendiente de revisión</p>
          </div>
          <div style="padding:1.75rem;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:.5rem 0;color:#6b7280;font-size:.85rem;width:120px;">Nombre</td>
                <td style="padding:.5rem 0;font-weight:700;color:#111827;">${lote.nombre || "—"}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:.5rem 0;color:#6b7280;font-size:.85rem;">Código</td>
                <td style="padding:.5rem 0;color:#374151;">${lote.codigo || "—"}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:.5rem 0;color:#6b7280;font-size:.85rem;">Categoría</td>
                <td style="padding:.5rem 0;color:#374151;">${lote.categoria || "—"}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:.5rem 0;color:#6b7280;font-size:.85rem;">Base</td>
                <td style="padding:.5rem 0;font-weight:700;color:#0e7490;">${lote.base ? "$" + Number(lote.base).toLocaleString("es-CL") : "Sin base"}</td>
              </tr>
              ${lote.descripcion ? `
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:.5rem 0;color:#6b7280;font-size:.85rem;">Descripción</td>
                <td style="padding:.5rem 0;color:#374151;font-size:.875rem;">${lote.descripcion}</td>
              </tr>` : ""}
              ${bodegaAdmin ? `
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:.5rem 0;color:#6b7280;font-size:.85rem;">Ingresado por</td>
                <td style="padding:.5rem 0;color:#374151;">${bodegaAdmin}</td>
              </tr>` : ""}
            </table>

            <div style="margin-top:1.5rem;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://gestion-de-remates.vercel.app"}/dashboard"
                style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:.75rem 1.75rem;border-radius:8px;font-weight:700;font-size:.9rem;">
                Revisar en TAKKA →
              </a>
            </div>
          </div>
          <div style="background:#f3f4f6;padding:1rem;text-align:center;font-size:.75rem;color:#9ca3af;">
            TAKKA · Sistema de Gestión de Remates
          </div>
        </div>
      `,
    });

    if (error) return Response.json({ ok: false, error }, { status: 500 });
    return Response.json({ ok: true, id: data?.id });

  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
