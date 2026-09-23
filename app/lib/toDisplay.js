// Palabras que siempre se muestran en mayúscula en la UI (marcas, siglas, abreviaciones)
const PROTECTED = ["TAKKA", "RUT", "IVA", "PDF", "S.A.", "SPA", "LTDA.", "ROL"];

/**
 * Convierte un string a sentence case en español.
 * Primera letra mayúscula, resto minúscula, preservando palabras protegidas.
 * Ej: "REMATE PRUEBA HOY" → "Remate prueba hoy"
 *     "takka remates" → "TAKKA remates"
 */
export function toDisplay(str) {
  if (!str || typeof str !== "string") return str;
  const trimmed = str.trim();
  if (!trimmed) return str;

  const lower = trimmed.toLowerCase();
  let result = lower.charAt(0).toUpperCase() + lower.slice(1);

  PROTECTED.forEach(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), word);
  });

  return result;
}
