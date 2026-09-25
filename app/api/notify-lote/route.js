import { Resend } from "resend";
import { requireAuth } from "../_lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "mahumadavald@gmail.com";
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL  || "TAKKA <notificaciones@takka.cl>";

function esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { lote, bodegaAdmin } = body;

    if (!lote) return Response.json({ error: "Falta lote" }, { status: 400 });

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ ok: false, error: "RESEND_API_KEY no configurada" }, { status: 200 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gestion-de-remates.vercel.app";

    const tr = (label, value) => !value ? "" : `
      <tr>
        <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;background:#f3f4f6;border-bottom:1px solid #e5e7eb;white-space:nowrap;width:38%;font-family:Arial,Helvetica,sans-serif;">${label}</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111827;background:#ffffff;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">${esc(value)}</td>
      </tr>`;

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f4f8">
  <tr><td align="center" style="padding:32px 16px;background:#f0f4f8;">
  <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

    <!-- Header -->
    <tr><td bgcolor="#0891b2" style="background:linear-gradient(135deg,#0e7490 0%,#0891b2 60%,#06B6D4 100%);padding:28px 36px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:20px;font-weight:800;color:#ffffff;font-family:Arial,Helvetica,sans-serif;letter-spacing:-.01em;">Nuevo lote pendiente</div>
            <div style="font-size:13px;color:#cce9f5;margin-top:5px;font-family:Arial,Helvetica,sans-serif;">Requiere revisión en el Dashboard</div>
          </td>
          <td style="vertical-align:middle;text-align:right;padding-left:20px;">
            <div style="font-size:13px;font-weight:800;color:rgba(255,255,255,.85);letter-spacing:.06em;font-family:Arial,Helvetica,sans-serif;">TAKKA</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Cuerpo -->
    <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:24px 36px 28px;font-family:Arial,Helvetica,sans-serif;">
      <p style="font-size:14px;color:#4b5563;margin:0 0 20px;line-height:1.7;">
        Se registró un nuevo lote en el inventario y está pendiente de aprobación.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${tr("Nombre", lote.nombre)}
        ${tr("Código", lote.codigo)}
        ${tr("Categoría", lote.categoria)}
        ${lote.base ? tr("Precio base", "$" + Number(lote.base).toLocaleString("es-CL")) : ""}
        ${lote.descripcion ? tr("Descripción", lote.descripcion) : ""}
        ${bodegaAdmin ? tr("Ingresado por", bodegaAdmin) : ""}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center">
          <a href="${appUrl}/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#0891b2,#06B6D4);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">
            Revisar en TAKKA &#8594;
          </a>
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td bgcolor="#f9fafb" style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 6px;">
        <tr>
          <td style="vertical-align:middle;padding-right:8px;">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
              <rect x="2" y="4" width="32" height="9" rx="3" fill="#0891b2"/>
              <rect x="13.5" y="13" width="9" height="19" rx="3" fill="#0891b2"/>
              <polygon points="13.5,20.5 22.5,13 22.5,17.5 13.5,25.5" fill="rgba(255,255,255,0.72)"/>
            </svg>
          </td>
          <td style="vertical-align:middle;font-size:13px;font-weight:800;color:#374151;letter-spacing:.08em;font-family:Arial,Helvetica,sans-serif;">TAKKA</td>
        </tr>
      </table>
      <div style="font-size:11px;color:#9ca3af;"><a href="https://takka.cl" style="color:#9ca3af;text-decoration:none;">takka.cl</a></div>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to:   [ADMIN_EMAIL],
      subject: `Nuevo lote pendiente de revisión — ${esc(lote.nombre)}`,
      html,
    });

    if (error) return Response.json({ ok: false, error }, { status: 500 });
    return Response.json({ ok: true, id: data?.id });

  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
