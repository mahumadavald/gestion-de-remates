import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { remate } = await request.json();

    const recaudadoFmt = remate.recaudado
      ? `$${remate.recaudado.toLocaleString('es-CL')}`
      : 'no disponible';

    const prompt = `Eres un analista experto en remates y subastas chilenas. Genera un resumen ejecutivo profesional en español para el siguiente remate finalizado:

- Nombre: ${remate.name}
- Fecha: ${remate.fecha}
- Modalidad: ${remate.modal}
- Total lotes: ${remate.lotes}
- Total recaudado: ${recaudadoFmt}
- Casa de remates: ${remate.casa || 'N/A'}

El resumen debe ser profesional y útil para el martillero. Responde SOLO con JSON válido, sin markdown, con estas claves:
- "resumen": párrafo general de 2-3 oraciones sobre el resultado del remate
- "destacados": array de exactamente 3 strings con puntos clave (cortos, con datos concretos)
- "conclusion": una oración ejecutiva de cierre

Ejemplo de formato:
{"resumen":"...","destacados":["...","...","..."],"conclusion":"..."}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const data = JSON.parse(text);
    return Response.json(data);
  } catch (err) {
    console.error('AI remate-summary error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
