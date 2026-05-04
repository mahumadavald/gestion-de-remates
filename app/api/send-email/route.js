import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.FROM_EMAIL || "noreply@pecker.cl";

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

// ── Header: título a la izquierda, logo casa a la derecha ─────────
function buildHeader({ casa, logo_url, titulo, subtitulo }) {
  const logoHtml = logo_url
    ? `<img src="${logo_url}" alt="${casa}" style="max-height:52px;max-width:160px;object-fit:contain;display:block;" />`
    : `<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);text-align:right;letter-spacing:-.01em;">${casa}</div>`;

  return `
    <div style="background:linear-gradient(135deg,#0f4c5c 0%,#0891b2 60%,#06B6D4 100%);padding:30px 36px 26px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:20px;font-weight:700;color:#ffffff;line-height:1.25;">${titulo}</div>
            ${subtitulo ? `<div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:5px;">${subtitulo}</div>` : ""}
          </td>
          <td style="vertical-align:middle;text-align:right;width:1%;white-space:nowrap;padding-left:20px;">
            ${logoHtml}
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ── Fila de tabla ─────────────────────────────────────────────────
function tr(label, value) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:10px 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;background:#f9fafb;border-bottom:1px solid #e5e7eb;white-space:nowrap;width:1%;">${label}</td>
      <td style="padding:10px 14px;font-size:14px;font-weight:600;color:#1a1a1a;background:#ffffff;border-bottom:1px solid #e5e7eb;">${value}</td>
    </tr>
  `;
}

// ── Footer con logo Pecker ────────────────────────────────────────────
const FOOTER = `
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="display:inline-block;background:rgba(6,182,212,.15);border:1.5px solid rgba(6,182,212,.35);border-radius:8px;width:30px;height:30px;line-height:30px;text-align:center;font-size:13px;font-weight:800;color:#0891b2;font-family:Arial,sans-serif;">P</div>
      <span style="font-size:13px;font-weight:700;color:#374151;letter-spacing:-.01em;">Pecker</span>
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-top:2px;"><a href="https://pecker.cl" style="color:#9ca3af;text-decoration:none;">pecker.cl</a></div>
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

    const esOnline = modalidad && modalidad.toLowerCase().includes("online");

    const results = [];

    // ── 1. Email al CLIENTE (pre-inscripción desde formulario) ───────
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

            <div style="background:linear-gradient(135deg,#f0fdfe,#ecfeff);border:2px solid #0891b2;border-radius:12px;text-align:center;padding:22px 16px;margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0e7490;margin-bottom:6px;">Número de postor provisional</div>
              <div style="font-size:52px;font-weight:800;color:#0891b2;line-height:1;letter-spacing:-.02em;">#${numero}</div>
            </div>

            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
              ${tr("Remate", remate)}
              ${fechaStr ? tr("Fecha", fechaStr) : ""}
              ${tr("RUT", rut)}
              ${tr("Nombre", nombre)}
              ${tr("Correo", email_cliente)}
              ${telefono ? tr("Teléfono", telefono) : ""}
              ${tr("Forma de participación", modalidad || "—")}
            </table>

            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>Inscripción pendiente de aprobación.</strong><br>
              ${casa} verificará tu comprobante de transferencia y confirmará tu participación. Recibirás un correo cuando sea aprobada.
            </div>

            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">¿Dudas? Contacta directamente a ${casa}${email_casa ? " en <a href='mailto:" + email_casa + "' style='color:#0891b2;'>" + email_casa + "</a>" : ""}.</p>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Pre-inscripción recibida — ${remate} · ${casa}`,
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
            <div style="display:inline-block;background:rgba(8,145,178,.12);color:#0e7490;border-radius:6px;padding:4px 12px;font-size:13px;font-weight:700;margin:10px 0 20px;">Postor #${numero}</div>

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

            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:10px;">Datos para devolución de garantía</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              ${tr("Banco", banco || "—")}
              ${tr("Tipo de cuenta", tipo_cuenta || "—")}
              ${tr("Número de cuenta", numero_cuenta || "—")}
            </table>

            <div style="background:#f0fdf4;border-left:4px solid #0891b2;border-radius:0 8px 8px 0;padding:13px 16px;font-size:13px;color:#0e7490;line-height:1.6;">
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

    // ── 3. Email de CONFIRMACIÓN (postor verificado por martillero) ──
    if (tipo === "verificado" && email_cliente) {
      const mensajeAcceso = esOnline
        ? `<div style="background:#f0fdfe;border:1px solid #a5f3fc;border-radius:10px;padding:16px 20px;margin:20px 0;font-size:13px;color:#0e7490;line-height:1.8;">
            Para participar en el remate <strong>online</strong> debes ingresar con tu <strong>número de postor</strong> y la <strong>clave de acceso de un solo uso</strong> que recibirás el día del remate. Esta clave es personal e intransferible y expirará tras su primer uso.
          </div>`
        : `<div style="background:#f0fdf4;border-left:4px solid #0891b2;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;font-size:13px;color:#0e7490;line-height:1.6;">
            <strong>Todo listo para el remate presencial.</strong> Preséntate con tu número de postor el día del remate en el lugar indicado por ${casa}.
          </div>`;

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:580px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

          ${buildHeader({
            casa, logo_url,
            titulo: "Confirmación de inscripción",
            subtitulo: remate + (fechaStr ? " · " + fechaStr : ""),
          })}

          <div style="background:#ffffff;padding:28px 36px;">
            <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${nombre}</strong></p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.6;">
              Hemos confirmado tu garantía y te damos la bienvenida al remate de <strong style="color:#1a1a1a;">${remate}</strong> de <strong style="color:#1a1a1a;">${casa}</strong>.
            </p>

            <div style="background:linear-gradient(135deg,#0f4c5c,#0891b2);border-radius:12px;text-align:center;padding:24px 16px;margin-bottom:20px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.7);margin-bottom:8px;">Tu número de postor</div>
              <div style="font-size:58px;font-weight:800;color:#ffffff;line-height:1;letter-spacing:-.02em;">#${numero}</div>
              ${modalidad ? `<div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:10px;text-transform:uppercase;letter-spacing:.05em;">${modalidad}</div>` : ""}
            </div>

            ${mensajeAcceso}

            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">¿Dudas? Contacta directamente a ${casa}${email_casa ? " en <a href='mailto:" + email_casa + "' style='color:#0891b2;'>" + email_casa + "</a>" : ""}.</p>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Confirmación inscripción — Bienvenido al remate de ${casa}`,
        html,
      });
      results.push({ destino: "verificado", ...r });
    }

    // ── 4. Email de BIENVENIDA al postor (cuenta creada en /participar) ─
    if (tipo === "bienvenida_postor" && email_cliente) {
      const { temp_password } = body;
      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:580px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

          ${buildHeader({
            casa, logo_url,
            titulo: "Bienvenido a " + casa,
            subtitulo: "Tu cuenta de postor ha sido creada",
          })}

          <div style="background:#ffffff;padding:28px 36px;">
            <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${nombre}</strong></p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6;">Tu cuenta de postor fue creada exitosamente. Usa estas credenciales para acceder a tu portal de postores.</p>

            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <div style="margin-bottom:14px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px;">Correo / Usuario</div>
                <div style="font-size:15px;font-weight:600;color:#1a1a1a;">${email_cliente}</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px;">Contraseña provisoria</div>
                <div style="font-size:22px;font-weight:800;color:#0891b2;letter-spacing:.08em;font-family:monospace;">${temp_password || "—"}</div>
              </div>
            </div>

            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>Esta contraseña es de un solo uso.</strong><br>
              Al ingresar por primera vez debes cambiarla. Es personal e intransferible.
            </div>

            <a href="https://pecker.cl/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#06B6D4,#14B8A6);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:10px;margin-bottom:16px;">Ingresar a mi portal →</a>

            <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">En caso de no poder ingresar, contacta a ${casa}.</p>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Bienvenido a ${casa} — Tus credenciales de acceso`,
        html,
      });
      results.push({ destino: "bienvenida_postor", ...r });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
