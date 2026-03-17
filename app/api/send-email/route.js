import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.FROM_EMAIL || "noreply@gestionderemates.cl";

async function sendMail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// ── Shared header HTML (logo de la casa o nombre) ────────────────
function buildHeader({ casa, logo_url, titulo, subtitulo }) {
  const logoHtml = logo_url
    ? `<img src="${logo_url}" alt="${casa}" style="max-height:52px;max-width:180px;object-fit:contain;display:block;margin-bottom:14px;" />`
    : `<div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-.02em;margin-bottom:10px;">${casa}</div>`;

  return `
    <div style="background:linear-gradient(135deg,#0f4c5c 0%,#0891b2 60%,#06B6D4 100%);padding:32px 36px 28px;">
      ${logoHtml}
      <div style="font-size:20px;font-weight:700;color:#ffffff;line-height:1.2;">${titulo}</div>
      ${subtitulo ? `<div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;">${subtitulo}</div>` : ""}
    </div>
  `;
}

// ── Shared table row ─────────────────────────────────────────────
function tr(label, value) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:10px 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;background:#f9fafb;border-bottom:1px solid #e5e7eb;white-space:nowrap;width:1%;">${label}</td>
      <td style="padding:10px 14px;font-size:14px;font-weight:600;color:#1a1a1a;background:#ffffff;border-bottom:1px solid #e5e7eb;">${value}</td>
    </tr>
  `;
}

// ── Shared footer ────────────────────────────────────────────────
const FOOTER = `
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
    <img src="https://gestionderemates.cl/gr-logo.png" alt="GR" style="height:18px;opacity:.5;margin-bottom:6px;" onerror="this.style.display='none'" />
    <div style="font-size:11px;color:#9ca3af;">Powered by <a href="https://gestionderemates.cl" style="color:#06B6D4;text-decoration:none;">GR Auction Software</a></div>
  </div>
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      tipo, nombre, numero, remate, fecha, casa, logo_url,
      email_cliente, email_casa,
      rut, telefono, giro, direccion, comuna,
      banco, tipo_cuenta, numero_cuenta, modalidad,
    } = body;

    const fechaStr = fecha
      ? new Date(fecha).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : null;

    const results = [];

    // ── 1. Email al CLIENTE ──────────────────────────────────────────
    if (tipo === "cliente" && email_cliente) {
      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:580px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

          ${buildHeader({
            casa, logo_url,
            titulo: "Pre-inscripción recibida",
            subtitulo: remate + (fechaStr ? " · " + fechaStr : ""),
          })}

          <div style="background:#ffffff;padding:28px 36px;">
            <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${nombre}</strong></p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.6;">Tu pre-inscripción en <strong style="color:#1a1a1a;">${remate}</strong> fue recibida correctamente.</p>

            <!-- Número de postor -->
            <div style="background:linear-gradient(135deg,#f0fdfe,#ecfeff);border:2px solid #06B6D4;border-radius:12px;text-align:center;padding:22px 16px;margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0891b2;margin-bottom:6px;">Número de postor provisional</div>
              <div style="font-size:52px;font-weight:800;color:#06B6D4;line-height:1;letter-spacing:-.02em;">#${numero}</div>
            </div>

            <!-- Tabla de datos -->
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:10px;">Datos de tu inscripción</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
              ${tr("Remate", remate)}
              ${fechaStr ? tr("Fecha", fechaStr) : ""}
              ${tr("RUT", rut)}
              ${tr("Nombre", nombre)}
              ${tr("Correo", email_cliente)}
              ${telefono ? tr("Teléfono", telefono) : ""}
              ${tr("Forma de participación", modalidad || "—")}
            </table>

            <!-- Aviso pendiente -->
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>Inscripción pendiente de aprobación.</strong><br>
              ${casa} verificará tu comprobante de transferencia y confirmará tu participación. Recibirás un correo cuando sea aprobada.
            </div>

            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">¿Dudas? Contacta directamente a ${casa}${email_casa ? " en <a href='mailto:" + email_casa + "' style='color:#06B6D4;'>" + email_casa + "</a>" : ""}.</p>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Pre-inscripción #${numero} confirmada — ${remate}`,
        html,
      });
      results.push({ destino: "cliente", ...r });
    }

    // ── 2. Email al MARTILLERO / CASA ────────────────────────────────
    if (tipo === "casa" && email_casa) {
      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:580px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

          ${buildHeader({
            casa, logo_url,
            titulo: "Nueva pre-inscripción recibida",
            subtitulo: remate + (fechaStr ? " · " + fechaStr : ""),
          })}

          <div style="background:#ffffff;padding:28px 36px;">
            <p style="font-size:14px;color:#374151;margin:0 0 4px;">Se registró un nuevo postor en <strong style="color:#1a1a1a;">${remate}</strong>.</p>
            <div style="display:inline-block;background:rgba(6,182,212,.1);color:#0891b2;border-radius:6px;padding:4px 12px;font-size:13px;font-weight:700;margin:10px 0 20px;">Postor #${numero}</div>

            <!-- DATOS DEL PARTICIPANTE -->
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:10px;">Datos del participante</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              ${tr("Nombres / Razón social", nombre)}
              ${tr("R.U.T.", rut)}
              ${tr("Correo electrónico", email_cliente)}
              ${telefono ? tr("Teléfono", telefono) : ""}
              ${tr("Giro", giro || "Sin giro")}
              ${tr("Dirección", direccion)}
              ${comuna ? tr("Comuna", comuna) : ""}
              ${tr("Forma de participación", modalidad || "—")}
            </table>

            <!-- DATOS BANCARIOS -->
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:10px;">Datos para devolución de garantía</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              ${tr("Banco", banco || "—")}
              ${tr("Tipo de cuenta", tipo_cuenta || "—")}
              ${tr("Número de cuenta", numero_cuenta || "—")}
            </table>

            <!-- Aviso comprobante -->
            <div style="background:#f0fdf4;border-left:4px solid #14B8A6;border-radius:0 8px 8px 0;padding:13px 16px;font-size:13px;color:#065f46;line-height:1.6;">
              El postor adjuntó un <strong>comprobante de transferencia</strong>. Revisa el panel de control para verificar el pago y aprobar la inscripción.
            </div>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_casa,
        subject: `Nueva inscripción #${numero} — ${nombre} en ${remate}`,
        html,
      });
      results.push({ destino: "casa", ...r });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
