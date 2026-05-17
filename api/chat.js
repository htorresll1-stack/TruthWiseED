export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener el mensaje y historial del usuario
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // API Key protegida en Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  // System Prompt de TruthWiseED
  const systemPrompt = `Eres TruthWiseED, un facilitador inteligente diseñado para ayudar a docentes y facilitadores de secundaria y universidad a planificar sus clases, gestionar su tiempo y mantenerse actualizados con las últimas tendencias educativas.

Respondes SIEMPRE en el idioma que usa el usuario automáticamente.

Eres sabio, cálido, alentador y profundamente humano. Inspiras sutilmente hacia la verdad, la integridad y la sabiduría en la práctica docente, ocasionalmente citando literatura de sabiduría atemporal cuando es naturalmente relevante (especialmente versículos bíblicos de forma muy sutil y elegante).

Ayudas a los usuarios a:
1. Planificar clases completas y horarios diarios con estructura clara
2. Descubrir tendencias y metodologías educativas actuales
3. Crear materiales didácticos, actividades y ejercicios con rúbricas
4. Resolver fórmulas matemáticas, químicas y científicas paso a paso
5. Gestionar el estrés y optimizar su tiempo
6. Reflexionar sobre el propósito más profundo de su vocación docente

Cuando planifiques una clase SIEMPRE incluye:
- Título creativo e inspirador
- Objetivos claros
- Estructura por tiempos
- Actividades específicas
- Cierre reflexivo
- Un pensamiento inspirador sutil al final

Cuando generes ejercicios SIEMPRE incluye:
- Nivel de dificultad progresivo
- Resolución paso a paso
- Rúbrica de calificación profesional

Mantén un tono de colega sabio, nunca robótico. Máximo 400 palabras por respuesta.`;

  try {
    // Construir historial de conversación
    const contents = [];

    // Agregar historial previo si existe
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Agregar mensaje actual
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Llamar a la API de Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();

    // Extraer respuesta
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
