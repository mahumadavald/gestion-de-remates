// Formato de moneda CLP ($ 1.234.567)
export const fmt = n =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n ?? 0);

// Formato corto: $1.2M, $350K, $5.000
export const fmtS = n =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n}`;

// Formato CLP sin símbolo formal: $ 1.234.567 (para texto inline)
export const fmtCLP = n =>
  n != null && n > 0 ? "$" + Math.round(n).toLocaleString("es-CL") : "$0";

// Formato millones para KPIs: "$1.2M" / "$350K" / "$5.000"
export const fmtMill = n => {
  if (!n) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

// Formato fecha (2026-09-23 → "23/09/2026")
export const fmtDate = dateStr => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-CL");
};

// Formato fecha + hora
export const fmtDateTime = dateStr => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
};
