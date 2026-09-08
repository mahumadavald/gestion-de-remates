import { NextResponse } from "next/server";
import { requireAuth } from "../_lib/auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.FROM_EMAIL || "noreply@gestionderemates.cl";

// Tipos que requieren sesión activa (llamados desde el Dashboard)
const TIPOS_INTERNOS = new Set(["verificado", "bienvenida_postor", "no_comprador"]);

// Escapa caracteres HTML peligrosos en datos de usuario
function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Valida que la URL pertenezca al almacenamiento de Supabase (evita SSRF)
function isSafeStorageUrl(url) {
  if (!url) return false;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const { hostname } = new URL(url);
    const { hostname: supaHost } = new URL(supabaseUrl);
    return hostname === supaHost;
  } catch { return false; }
}

async function sendMail({ to, subject, html, attachments }) {
  if (!RESEND_API_KEY) {
    console.error("[send-email] RESEND_API_KEY no está configurada");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  console.log(`[send-email] Enviando a=${to} from=${FROM_EMAIL} subject="${subject}"`);
  const body = { from: FROM_EMAIL, to, subject, html };
  if (attachments?.length) body.attachments = attachments;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) console.error("[send-email] Error Resend:", JSON.stringify(data));
  else console.log("[send-email] OK id:", data.id);
  return { ok: res.ok, data };
}

// ── Header: título a la izquierda, logo casa a la derecha ─────────
function buildHeader({ casa, logo_url, titulo, subtitulo }) {
  const logoHtml = logo_url
    ? `<img src="${logo_url}" alt="${esc(casa)}" style="max-height:52px;max-width:160px;object-fit:contain;display:block;" />`
    : `<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);text-align:right;letter-spacing:-.01em;">${esc(casa)}</div>`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0891b2">
      <tr>
        <td style="background-color:#0891b2;background:linear-gradient(135deg,#0f4c5c 0%,#0891b2 60%,#06B6D4 100%);padding:28px 36px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;line-height:1.25;font-family:Arial,sans-serif;">${titulo}</div>
                ${subtitulo ? `<div style="font-size:13px;color:#cce9f5;margin-top:5px;font-family:Arial,sans-serif;">${subtitulo}</div>` : ""}
              </td>
              <td style="vertical-align:middle;text-align:right;width:1%;white-space:nowrap;padding-left:20px;">
                ${logoHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// ── Fila de tabla (escapa el valor para evitar HTML injection) ────
function tr(label, value) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:11px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;background:#f3f4f6;border-bottom:1px solid #e5e7eb;white-space:nowrap;width:38%;">${label}</td>
      <td style="padding:11px 16px;font-size:14px;font-weight:700;color:#111827;background:#ffffff;border-bottom:1px solid #e5e7eb;">${esc(value)}</td>
    </tr>
  `;
}

// ── Footer con logo Pecker ────────────────────────────────────────────
const FOOTER = `
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:6px;">
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
        <rect x="2" y="4" width="32" height="9" rx="3" fill="#0891b2"/>
        <rect x="13.5" y="13" width="9" height="19" rx="3" fill="#0891b2"/>
        <polygon points="13.5,20.5 22.5,13 22.5,17.5 13.5,25.5" fill="rgba(255,255,255,0.72)"/>
      </svg>
      <span style="font-size:13px;font-weight:800;color:#374151;letter-spacing:.08em;">TAKKA</span>
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-top:2px;"><a href="https://takka.cl" style="color:#9ca3af;text-decoration:none;">takka.cl</a></div>
  </div>
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { tipo } = body;

    // Tipos internos requieren sesión activa
    if (TIPOS_INTERNOS.has(tipo)) {
      const auth = await requireAuth(req);
      if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const {
      nombre, numero, remate, fecha, casa, logo_url,
      email_cliente, email_casa,
      rut, telefono, giro, direccion, comuna,
      banco, tipo_cuenta, numero_cuenta, modalidad,
      comprobante_url,
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

          <div style="background:#ffffff;padding:28px 36px;font-family:Arial,Helvetica,sans-serif;">
            <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${esc(nombre)}</strong></p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.6;">Tu pre-inscripción en <strong style="color:#1a1a1a;">${esc(remate)}</strong> de <strong style="color:#1a1a1a;">${esc(casa)}</strong> fue recibida correctamente.</p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              ${tr("Remate", remate)}
              ${fechaStr ? tr("Fecha", fechaStr) : ""}
              ${tr("RUT", rut)}
              ${tr("Nombre", nombre)}
              ${tr("Correo", email_cliente)}
              ${telefono ? tr("Teléfono", telefono) : ""}
              ${tr("Forma de participación", modalidad || "—")}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffbeb">
              <tr><td style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;font-size:13px;color:#92400e;line-height:1.6;">
                <strong>Inscripción pendiente de aprobación.</strong><br>
                ${esc(casa)} verificará tu comprobante de transferencia. Cuando sea aprobada recibirás un correo con tu número de postor e instrucciones para participar.
              </td></tr>
            </table>

            <p style="font-size:13px;color:#6b7280;margin:20px 0 0;line-height:1.6;">¿Dudas? Contacta directamente a ${esc(casa)}${email_casa ? " en <a href='mailto:" + email_casa + "' style='color:#0891b2;'>" + email_casa + "</a>" : ""}.</p>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Pre-inscripción recibida — ${esc(remate)} · ${esc(casa)}`,
        html,
      });
      results.push({ destino: "cliente", ...r });
    }

    // ── 2. Email al MARTILLERO / CASA ────────────────────────────────
    if (tipo === "casa" && email_casa) {
      const trN = (label, value) => !value ? "" : `
        <tr>
          <td style="padding:11px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;background:#f3f4f6;border-bottom:1px solid #e5e7eb;white-space:nowrap;width:38%;">${label}</td>
          <td style="padding:11px 16px;font-size:14px;font-weight:700;color:#111827;background:#ffffff;border-bottom:1px solid #e5e7eb;">${value}</td>
        </tr>`;

      const datosBancarios = [banco, tipo_cuenta, numero_cuenta].filter(Boolean).join(" / ") || "—";
      const dirComuna = [direccion, comuna].filter(Boolean).join(", ") || "—";

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

          ${buildHeader({
            casa, logo_url,
            titulo: "Notificación de nuevo participante",
            subtitulo: "Se registró una nueva inscripción para: " + remate + (fechaStr ? " · " + fechaStr : ""),
          })}

          <!-- Cuerpo -->
          <div style="background:#ffffff;padding:28px 36px 32px;">

            <p style="font-size:14px;color:#4b5563;margin:0 0 20px;line-height:1.7;font-family:Arial,sans-serif;">
              El siguiente postor completó su formulario de inscripción y adjuntó el comprobante de garantía.
            </p>

            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              ${trN("Nombres / Razón Social", nombre)}
              ${trN("RUT", rut)}
              ${trN("Correo Electrónico", email_cliente)}
              ${trN("Teléfono", telefono)}
              ${trN("Giro", giro)}
              ${trN("Dirección / Comuna", dirComuna)}
              ${trN("Datos Bancarios", datosBancarios)}
              ${trN("Forma de Participación", modalidad)}
            </table>

            ${comprobante_url ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
              <tr>
                <td align="center">
                  <a href="${comprobante_url}" target="_blank"
                    style="display:inline-block;background:linear-gradient(135deg,#0891b2,#06b6d4);color:#ffffff;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:8px;font-family:Arial,sans-serif;">
                    Ver comprobante adjunto
                  </a>
                </td>
              </tr>
            </table>` : ""}

          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      // Adjuntar comprobante si existe — solo URLs de Supabase Storage (evita SSRF)
      let attachments = [];
      if (comprobante_url && isSafeStorageUrl(comprobante_url)) {
        try {
          const fileRes = await fetch(comprobante_url);
          if (fileRes.ok) {
            const buffer = await fileRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const ext = comprobante_url.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
            attachments = [{ filename: `comprobante-${numero}.${ext}`, content: base64 }];
          }
        } catch(e) { console.error("[send-email] Error adjuntando comprobante:", e.message); }
      }
      const r = await sendMail({
        to: email_casa,
        subject: `Nueva inscripción #${numero} — ${esc(nombre)} en ${esc(remate)}`,
        html,
        attachments,
      });
      results.push({ destino: "casa", ...r });
    }

    // ── 3. Email de CONFIRMACIÓN (postor verificado por martillero) ──
    if (tipo === "verificado" && email_cliente) {
      const esRemoto = modalidad && (modalidad.toLowerCase().includes("online") || modalidad.toLowerCase().includes("remoto"));
      const portalUrl = body.portal_url || "https://gestionderemates.cl/dashboard";

      const mensajeAcceso = esRemoto
        ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0fdfe" style="margin:20px 0;">
            <tr><td style="background-color:#f0fdfe;border:1px solid #a5f3fc;border-radius:10px;padding:16px 20px;font-size:13px;color:#0e7490;line-height:1.8;font-family:Arial,sans-serif;">
              <strong>Participación remota:</strong><br>
              Sigue las instrucciones de acceso que recibirás en el siguiente correo. Necesitarás ingresar a tu cuenta con tu correo y contraseña.
            </td></tr>
          </table>`
        : `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0fdf4" style="margin:20px 0;">
            <tr><td style="background-color:#f0fdf4;border-left:4px solid #0891b2;padding:14px 16px;font-size:13px;color:#0e7490;line-height:1.6;font-family:Arial,sans-serif;">
              <strong>Participación presencial:</strong><br>
              Preséntate con tu número de postor el día del remate en el lugar indicado por <strong>${esc(casa)}</strong>.
            </td></tr>
          </table>`;

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f4f8">
          <tr><td align="center" style="padding:32px 16px;">
          <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

          <tr><td>${buildHeader({ casa, logo_url, titulo: "Inscripción confirmada", subtitulo: remate + (fechaStr ? " · " + fechaStr : "") })}</td></tr>

          <tr><td style="background:#ffffff;padding:28px 36px;font-family:Arial,Helvetica,sans-serif;">
            <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${esc(nombre)}</strong></p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6;">
              Hemos confirmado tu garantía y te damos la bienvenida al remate <strong style="color:#1a1a1a;">${esc(remate)}</strong> de <strong style="color:#1a1a1a;">${esc(casa)}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0891b2">
              <tr><td align="center" style="background-color:#0891b2;background:linear-gradient(135deg,#0f4c5c,#0891b2);border-radius:12px;padding:24px 16px;text-align:center;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#cce9f5;margin-bottom:8px;font-family:Arial,sans-serif;">Tu número de postor confirmado</div>
                <div style="font-size:58px;font-weight:800;color:#ffffff;line-height:1;font-family:Arial,sans-serif;">#${numero}</div>
                ${modalidad ? `<div style="font-size:13px;color:#cce9f5;margin-top:10px;text-transform:uppercase;font-family:Arial,sans-serif;">${esc(modalidad)}</div>` : ""}
              </td></tr>
            </table>

            ${mensajeAcceso}

            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;font-family:Arial,sans-serif;">¿Dudas? Contacta directamente a <strong>${esc(casa)}</strong>${email_casa ? " en <a href='mailto:" + email_casa + "' style='color:#0891b2;'>" + email_casa + "</a>" : ""}.</p>
          </td></tr>

          <tr><td>${FOOTER}</td></tr>
          </table>
          </td></tr>
        </table>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `¡Inscripción confirmada! — ${esc(remate)} · ${esc(casa)}`,
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

          <div style="background:#ffffff;padding:28px 36px;font-family:Arial,Helvetica,sans-serif;">
            <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${esc(nombre)}</strong></p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6;">Bienvenido a la plataforma de remates. Aquí encontrarás tus accesos para participar.</p>

            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
              <div style="margin-bottom:14px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px;font-family:Arial,sans-serif;">Correo / Usuario</div>
                <div style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">${esc(email_cliente)}</div>
              </div>
              ${temp_password ? `
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px;font-family:Arial,sans-serif;">Contraseña provisoria</div>
                <div style="font-size:24px;font-weight:800;color:#0891b2;letter-spacing:.1em;font-family:monospace;">${temp_password}</div>
              </div>` : `
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px;font-family:Arial,sans-serif;">Contraseña</div>
                <div style="font-size:13px;color:#374151;font-family:Arial,sans-serif;">Usa tu contraseña habitual. Si no la recuerdas, puedes recuperarla desde el portal.</div>
              </div>`}
            </div>

            ${temp_password ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffbeb" style="margin-bottom:20px;">
              <tr><td style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;font-size:13px;color:#92400e;line-height:1.6;font-family:Arial,sans-serif;">
                <strong>Al ingresar por primera vez se te pedirá crear una contraseña nueva.</strong> La clave provisoria es de un solo uso.
              </td></tr>
            </table>` : ""}

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
              <tr><td align="center">
                <a href="${body.portal_url||'https://gestionderemates.cl/postor'}" style="display:inline-block;background:linear-gradient(135deg,#0891b2,#06b6d4);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 36px;border-radius:10px;font-family:Arial,sans-serif;">
                  Ingresar a mi cuenta →
                </a>
              </td></tr>
            </table>

            <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0 0 16px;font-family:Arial,sans-serif;">gestionderemates.cl</p>
            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;font-family:Arial,sans-serif;">¿Dudas? Contacta a ${esc(casa)}${body.email_casa ? " en <a href='mailto:" + body.email_casa + "' style='color:#0891b2;'>" + body.email_casa + "</a>" : ""}.</p>
          </div>

          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Bienvenido a ${esc(casa)} — Tus credenciales de acceso`,
        html,
      });
      results.push({ destino: "bienvenida_postor", ...r });
    }

    // ── 5. Email a NO-COMPRADORES (para devolución de garantía) ────────
    if (tipo === "no_comprador" && email_cliente) {
      const { postor_id, nombre: nombrePosNc, numero: numeroPosNc, remate: remateNc, casa: casaNc, logo_url: logoNc, devolucion_url } = body;

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:580px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

      ${buildHeader({
        casa: casaNc, logo_url: logoNc,
        titulo: "Gracias por participar",
        subtitulo: remateNc,
      })}

      <div style="background:#ffffff;padding:28px 36px;">
        <p style="font-size:15px;color:#374151;margin:0 0 6px;">Hola, <strong style="color:#1a1a1a;">${esc(nombrePosNc)}</strong></p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6;">
          Gracias por participar en el remate <strong style="color:#1a1a1a;">${esc(remateNc)}</strong>. En esta oportunidad no resultaste adjudicatario de ningún lote, pero tu garantía está disponible para devolución.
        </p>

        <div style="background:linear-gradient(135deg,#f0fdfe,#ecfeff);border:2px solid #0891b2;border-radius:12px;text-align:center;padding:22px 16px;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0e7490;margin-bottom:6px;">Tu número de postor</div>
          <div style="font-size:48px;font-weight:800;color:#0891b2;line-height:1;letter-spacing:-.02em;">#${esc(numeroPosNc)}</div>
        </div>

        <p style="font-size:14px;color:#374151;margin:0 0 20px;line-height:1.6;">
          Para procesar la devolución de tu garantía, registra tu cuenta bancaria haciendo click en el botón de abajo:
        </p>

        <a href="${devolucion_url}" style="display:block;text-align:center;background:linear-gradient(135deg,#06B6D4,#14B8A6);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 24px;border-radius:10px;margin-bottom:24px;">
          Registrar cuenta para devolución →
        </a>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;font-size:13px;color:#6b7280;line-height:1.7;">
          <strong style="color:#374151;">¿Ya registraste tu cuenta?</strong><br>
          Si ya completaste el formulario de devolución con el QR de tu boleta, no es necesario hacerlo nuevamente. La devolución se procesará en los próximos días hábiles.
        </div>
      </div>

      ${FOOTER}
    </div>
  </body></html>`;

      const r = await sendMail({
        to: email_cliente,
        subject: `Devolución de garantía disponible — ${esc(remateNc)} · ${esc(casaNc)}`,
        html,
      });
      results.push({ destino: "no_comprador", ...r });
    }

    // ── 6. Solicitud de DEMO desde la landing ────────────────────────
    if (tipo === "demo") {
      const { nombre, correo, registro, remates, lotes, sistema } = body;
      const casaDemo = body.casa || "—";
      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:580px;margin:32px auto;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">
          ${buildHeader({ casa:"TAKKA", logo_url:null, titulo:"Nueva solicitud de demo", subtitulo:"Alguien quiere conocer Pecker" })}
          <div style="background:#ffffff;padding:28px 36px;">
            <p style="font-size:14px;color:#374151;margin:0 0 20px;line-height:1.6;">Se recibió una nueva solicitud de demo a través de la landing page.</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              ${tr("Nombre", nombre)}
              ${tr("Correo", correo)}
              ${tr("Casa de remates", casaDemo)}
              ${tr("N° Registro Martillero", registro)}
              ${remates ? tr("Remates / mes", remates) : ""}
              ${lotes   ? tr("Lotes / remate", lotes)   : ""}
              ${sistema ? tr("Sistema actual", sistema)  : ""}
            </table>
            <a href="mailto:${esc(correo)}" style="display:block;text-align:center;background:linear-gradient(135deg,#06B6D4,#14B8A6);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:10px;">Responder a ${esc(nombre)} →</a>
          </div>
          ${FOOTER}
        </div>
      </body></html>`;

      const r = await sendMail({
        to: "contacto@takka.cl",
        subject: `Nueva solicitud de demo — ${esc(nombre)} (${esc(casaDemo)})`,
        html,
      });
      results.push({ destino: "demo", ...r });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
