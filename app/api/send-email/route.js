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

export async function POST(req) {
  try {
    const body = await req.json();
    const { tipo, nombre, numero, remate, fecha, casa, email_cliente, email_casa,
            rut, telefono, giro, direccion, banco, tipo_cuenta, numero_cuenta } = body;

    const fechaStr = fecha
      ? new Date(fecha).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "";

    const results = [];

    // ── 1. Email al cliente ──────────────────────────────────────────
    if (tipo === "cliente" && email_cliente) {
      const html = `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f2; margin: 0; padding: 0; }
          .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
          .header { background: linear-gradient(135deg, #0f4c5c, #06B6D4); padding: 32px 36px; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
          .header p  { color: rgba(255,255,255,.8); margin: 6px 0 0; font-size: 14px; }
          .body { padding: 32px 36px; }
          .num-box { background: #f0fdfe; border: 2px solid #06B6D4; border-radius: 10px; text-align: center; padding: 20px; margin: 20px 0; }
          .num-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #6b7280; }
          .num-box .num   { font-size: 40px; font-weight: 800; color: #06B6D4; letter-spacing: .05em; }
          .info-row { display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; }
          .info-row .key { color: #6b7280; min-width: 120px; }
          .info-row .val { color: #1a1a1a; font-weight: 600; }
          .alert { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.6; }
          .footer { background: #f9fafb; padding: 20px 36px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          .footer a { color: #06B6D4; }
        </style></head><body>
        <div class="wrap">
          <div class="header">
            <h1>Pre-inscripción recibida</h1>
            <p>${casa} · ${remate}</p>
          </div>
          <div class="body">
            <p style="font-size:15px;color:#374151;">Hola <strong>${nombre}</strong>,</p>
            <p style="font-size:14px;color:#6b7280;margin-top:8px;">Tu pre-inscripción en <strong style="color:#1a1a1a">${remate}</strong> fue recibida correctamente. Te asignamos el siguiente número de postor provisional:</p>
            <div class="num-box">
              <div class="label">Número de postor provisional</div>
              <div class="num">#${numero}</div>
            </div>
            <div class="info-row"><span class="key">Remate</span><span class="val">${remate}</span></div>
            ${fechaStr ? `<div class="info-row"><span class="key">Fecha</span><span class="val">${fechaStr}</span></div>` : ""}
            <div class="info-row"><span class="key">RUT</span><span class="val">${rut}</span></div>
            <div class="info-row"><span class="key">Casa de remates</span><span class="val">${casa}</span></div>
            <div class="alert">
              Tu inscripción está como <strong>PRE-INSCRITA</strong>. Será confirmada una vez que ${casa} verifique el comprobante de pago de garantía que adjuntaste. Recibirás otro correo cuando sea aprobada.
            </div>
          </div>
          <div class="footer">
            Este correo fue generado automáticamente · <a href="https://gestionderemates.cl">GR Auction Software</a>
          </div>
        </div>
        </body></html>
      `;
      const r = await sendMail({
        to: email_cliente,
        subject: `Pre-inscripción #${numero} — ${remate}`,
        html,
      });
      results.push({ destino: "cliente", ...r });
    }

    // ── 2. Email al martillero / casa ────────────────────────────────
    if (tipo === "casa" && email_casa) {
      const html = `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f2; margin: 0; padding: 0; }
          .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
          .header { background: linear-gradient(135deg, #0f4c5c, #06B6D4); padding: 28px 36px; }
          .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 700; }
          .header p  { color: rgba(255,255,255,.8); margin: 6px 0 0; font-size: 13px; }
          .body { padding: 28px 36px; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin: 18px 0; }
          .row { display: flex; gap: 8px; margin-bottom: 7px; font-size: 14px; }
          .row .k { color: #6b7280; min-width: 140px; }
          .row .v { color: #1a1a1a; font-weight: 600; }
          .badge { display: inline-block; background: rgba(6,182,212,.1); color: #0891b2; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 700; }
          .footer { background: #f9fafb; padding: 18px 36px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style></head><body>
        <div class="wrap">
          <div class="header">
            <h1>Nueva pre-inscripción recibida</h1>
            <p>${remate} ${fechaStr ? "· " + fechaStr : ""}</p>
          </div>
          <div class="body">
            <p style="font-size:14px;color:#374151;">Se ha registrado un nuevo postor en <strong>${remate}</strong>. <span class="badge">Postor #${numero}</span></p>
            <div class="card">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:12px;">Datos del postor</div>
              <div class="row"><span class="k">Nombre</span><span class="v">${nombre}</span></div>
              <div class="row"><span class="k">RUT</span><span class="v">${rut}</span></div>
              <div class="row"><span class="k">Correo</span><span class="v">${email_cliente}</span></div>
              ${telefono ? `<div class="row"><span class="k">Teléfono</span><span class="v">${telefono}</span></div>` : ""}
              ${giro ? `<div class="row"><span class="k">Giro / Actividad</span><span class="v">${giro}</span></div>` : ""}
              ${direccion ? `<div class="row"><span class="k">Dirección</span><span class="v">${direccion}</span></div>` : ""}
            </div>
            <div class="card">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:12px;">Datos de devolución de garantía</div>
              <div class="row"><span class="k">Banco</span><span class="v">${banco || "—"}</span></div>
              <div class="row"><span class="k">Tipo de cuenta</span><span class="v">${tipo_cuenta || "—"}</span></div>
              <div class="row"><span class="k">Número de cuenta</span><span class="v">${numero_cuenta || "—"}</span></div>
            </div>
            <p style="font-size:13px;color:#6b7280;">El postor adjuntó un comprobante de transferencia. Revisa el panel de control para verificar y aprobar la inscripción.</p>
          </div>
          <div class="footer">
            GR Auction Software · gestionderemates.cl
          </div>
        </div>
        </body></html>
      `;
      const r = await sendMail({
        to: email_casa,
        subject: `Nueva inscripción #${numero} en ${remate} — ${nombre}`,
        html,
      });
      results.push({ destino: "casa", ...r });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
