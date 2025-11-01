'use server';

import { InferenceClient } from '@huggingface/inference';
import { z } from 'zod';

// Importamos las variables de entorno
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

// Schema de validación para los mensajes del chat usando Zod
const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const chatHistorySchema = z.array(messageSchema);

/**
 * Genera una respuesta conversacional utilizando un modelo de chat de Hugging Face.
 * @param messages - El historial de la conversación.
 * @returns Un objeto con la respuesta generada o un error.
 */
export async function generateActionPlan(messages: z.infer<typeof chatHistorySchema>): Promise<{ reply: string | null; error: string | null }> {
  // Validación de la entrada con Zod
  const validationResult = chatHistorySchema.safeParse(messages);
  if (!validationResult.success) {
    return { reply: null, error: 'El formato del historial de mensajes es inválido.' };
  }

  if (!HUGGING_FACE_TOKEN) {
    console.error('La variable de entorno HUGGING_FACE_TOKEN no está configurada.');
    return { reply: null, error: 'Error de configuración del servidor. Contacte al administrador.' };
  }

  try {
    // Aseguramos que el primer mensaje sea el del sistema
    const systemPrompt = messageSchema.parse({
        role: 'system',
        content: `
Eres un experto neuropediatra con más de 20 años de experiencia en el tratamiento del Trastorno por Déficit de Atención e Hiperactividad (TDAH) en niños y adolescentes. Tu especialización se centra en el enfoque psicosocial, entendiendo que el TDAH no solo afecta el rendimiento académico, sino también las relaciones sociales, la autoestima y la dinámica familiar.

Tu tarea es generar un plan de acción claro, práctico y empático para los padres o tutores que describen un desafío específico relacionado con el TDAH. El plan debe:

1.  **Ser empático y sin prejuicios:** Reconocer la frustración de los padres y validar sus sentimientos.
2.  **Ser estructurado:** Utilizar encabezados y listas para que el plan sea fácil de seguir.
3.  **Incluir estrategias concretas:** Proporcionar acciones específicas, no solo consejos generales.
4.  **Establecer metas realistas:** Las sugerencias deben ser alcanzables y medibles a corto plazo.
5.  **Fomentar la comunicación:** Incluir consejos sobre cómo hablar con el niño sobre el desafío.
6.  **Considerar el entorno:** Ofrecer sugerencias para adaptar el hogar o el espacio de estudio.
7.  **Recomendar refuerzos positivos:** Sugerir un sistema de recompensas no materialista para motivar al niño.

Responde siempre en español y con un tono profesional pero cercano. No uses terminología médica excesivamente compleja. Usa formato Markdown para estructurar tus respuestas.
        `,
    });

    let finalMessages = validationResult.data;
    if (finalMessages[0]?.role !== 'system') {
        finalMessages = [systemPrompt, ...finalMessages];
    }

    // Creamos una instancia del cliente de Hugging Face
    const hf = new InferenceClient(HUGGING_FACE_TOKEN);

    // Llamada a la API de Hugging Face usando el endpoint de chatCompletion
    const response = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: finalMessages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    if (!response || !response.choices || response.choices.length === 0 || !response.choices[0]?.message?.content) {
        return { reply: null, error: 'No se pudo generar una respuesta del modelo.' };
    }

    const generatedReply = response.choices[0].message.content.trim();
    return { reply: generatedReply, error: null };

  } catch (error) {
    console.error('Error al llamar a la API de Hugging Face:', error);
    return { reply: null, error: 'Ocurrió un error al generar el plan. Inténtalo de nuevo más tarde.' };
  }
}