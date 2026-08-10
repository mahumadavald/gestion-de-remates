import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64, mediaType, name, category } = await request.json();

    const contextText = [
      name && `Artículo: "${name}"`,
      category && `Categoría: ${category}`,
    ].filter(Boolean).join(', ');

    const prompt = `Eres un experto en remates y subastas chilenas. ${contextText ? `Para el artículo (${contextText}), genera` : 'Analiza la imagen y genera'}:
1. Un título conciso y atractivo para el catálogo (máximo 65 caracteres)
2. Una descripción profesional para el catálogo de remates (2-3 oraciones, menciona características relevantes)

Responde SOLO con JSON válido, sin markdown, con las claves "titulo" y "descripcion".`;

    const content = imageBase64
      ? [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: prompt },
        ]
      : prompt;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content }],
    });

    const text = response.content[0].text.trim();
    const data = JSON.parse(text);
    return Response.json(data);
  } catch (err) {
    console.error('AI describe-lot error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
