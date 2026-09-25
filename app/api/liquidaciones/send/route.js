import { NextResponse } from "next/server";
import { requireAuth } from "../../_lib/auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "TAKKA <notificaciones@takka.cl>";

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtCLP(n) {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { to, postorNombre, rut, liq, remateNombre, fecha } = await req.json();

    if (!to || !liq) return NextResponse.json({ error: "Faltan datos obligatorios (to, liq)" }, { status: 400 });
    if (!RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });

    const { lineas = [], totalEx, totalCom, totalAf, iva, total, garantia, totalAPagar } = liq;

    const lotesRows = lineas.map(l => `
      <tr>
        <td style="padding:9px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;font-family:Arial,sans-serif;">${esc(l.lote)}${l.exp ? ` — <span style="color:#9ca3af;">${esc(l.exp)}</span>` : ""}</td>
        <td style="padding:9px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;font-family:Arial,sans-serif;">${fmtCLP(l.monto)}</td>
        <td style="padding:9px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;font-family:Arial,sans-serif;">${l.comPct ?? 10}%</td>
        <td style="padding:9px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;font-family:Arial,sans-serif;">${fmtCLP(l.com)}</td>
        <td style="padding:9px 14px;font-size:13px;border-bottom:1px solid #f3f4f6;text-align:right;color:#d97706;font-family:Arial,sans-serif;">${l.gastosAdm ? fmtCLP(l.gastosAdm) : "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f4f8">
  <tr><td align="center" style="padding:32px 16px;background:#f0f4f8;">
  <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;">

    <!-- Header -->
    <tr><td bgcolor="#0891b2" style="background:linear-gradient(135deg,#0f4c5c 0%,#0891b2 60%,#06B6D4 100%);padding:28px 36px 24px;border-radius:0;">
      <div style="font-size:20px;font-weight:700;color:#fff;font-family:Arial,Helvetica,sans-serif;">Liquidación de Remate</div>
      <div style="font-size:13px;color:#cce9f5;margin-top:5px;font-family:Arial,Helvetica,sans-serif;">${esc(remateNombre)}${fecha ? " · " + esc(fecha) : ""}</div>
    </td></tr>

    <!-- Datos comprador -->
    <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:24px 36px 8px;font-family:Arial,Helvetica,sans-serif;">
      <p style="font-size:15px;color:#374151;margin:0 0 4px;">Estimado/a, <strong>${esc(postorNombre)}</strong></p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 16px;">RUT: ${esc(rut || "—")}</p>
      <p style="font-size:13px;color:#374151;margin:0 0 0;line-height:1.6;">A continuación el detalle de los bienes adjudicados en <strong>${esc(remateNombre)}</strong>.</p>
    </td></tr>

    <!-- Tabla de lotes -->
    <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:16px 36px;">
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;min-width:480px;">
          <thead>
            <tr bgcolor="#f9fafb">
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-family:Arial,sans-serif;">Lote</th>
              <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-family:Arial,sans-serif;">Martillo</th>
              <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-family:Arial,sans-serif;">Com %</th>
              <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-family:Arial,sans-serif;">Comisión</th>
              <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-family:Arial,sans-serif;">G. Adm.</th>
            </tr>
          </thead>
          <tbody>${lotesRows}</tbody>
        </table>
      </div>
    </td></tr>

    <!-- Resumen financiero -->
    <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:0 36px 28px;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
        ${totalEx ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Subtotal bienes (exento)</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmtCLP(totalEx)}</td></tr>` : ""}
        ${totalAf ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Subtotal bienes (AF)</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmtCLP(totalAf)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Comisiones</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmtCLP(totalCom)}</td></tr>
        ${iva ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">IVA (19%)</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmtCLP(iva)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">Total bruto</td><td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${fmtCLP(total)}</td></tr>
        ${garantia ? `<tr><td style="padding:6px 0;font-size:13px;color:#059669;">Garantía descontada</td><td style="padding:6px 0;font-size:13px;color:#059669;text-align:right;">&#8722;${fmtCLP(garantia)}</td></tr>` : ""}
        <tr>
          <td style="padding:14px 0 6px;font-size:16px;font-weight:800;color:#0891b2;border-top:2px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">TOTAL A PAGAR</td>
          <td style="padding:14px 0 6px;font-size:16px;font-weight:800;color:#0891b2;text-align:right;border-top:2px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">${fmtCLP(totalAPagar)}</td>
        </tr>
      </table>
      <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">Para consultas o coordinación de pago y retiro, contacta a la casa rematadora.</p>
    </td></tr>

    <!-- Footer -->
    <tr><td bgcolor="#f9fafb" style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 6px;">
        <tr>
          <td style="vertical-align:middle;padding-right:8px;">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject: `Liquidación — ${remateNombre || "Remate"}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[liquidaciones/send] Error Resend:", JSON.stringify(data));
      return NextResponse.json({ error: data.message || "Error al enviar" }, { status: 502 });
    }
    console.log("[liquidaciones/send] OK id:", data.id, "→", to);
    return NextResponse.json({ ok: true, id: data.id });

  } catch (e) {
    console.error("[liquidaciones/send] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
