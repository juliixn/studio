
'use server';
/**
 * @fileOverview Un agente de IA que redacta un borrador para un comunicado.
 *
 * - generateComunicadoDraft - Una función que sugiere un texto para un comunicado.
 * - GenerateComunicadoDraftInput - El tipo de entrada para el flujo.
 * - GenerateComunicadoDraftOutput - El tipo de retorno para el flujo.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateComunicadoDraftInputSchema = z.object({
  subject: z.string().describe("El asunto o tema principal del comunicado."),
});
export type GenerateComunicadoDraftInput = z.infer<typeof GenerateComunicadoDraftInputSchema>;

const GenerateComunicadoDraftOutputSchema = z.object({
  draft: z.string().describe('El borrador del texto para el cuerpo del comunicado.'),
});
export type GenerateComunicadoDraftOutput = z.infer<typeof GenerateComunicadoDraftOutputSchema>;

export async function generateComunicadoDraft(
  input: GenerateComunicadoDraftInput
): Promise<GenerateComunicadoDraftOutput> {
  return generateComunicadoDraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateComunicadoDraftPrompt',
  input: {schema: GenerateComunicadoDraftInputSchema},
  output: {schema: GenerateComunicadoDraftOutputSchema},
  prompt: `Eres un asistente de comunicación para un administrador de condominios. Tu tarea es redactar un borrador claro, conciso y amigable para un comunicado masivo a los residentes.

El administrador te proporcionará el asunto del comunicado. Basado en ese asunto, crea un texto apropiado.

Asunto del Comunicado:
"{{{subject}}}"

Considera los siguientes ejemplos para guiar tu redacción:

- Si el asunto es "Mantenimiento de Alberca", el borrador podría ser:
"Estimados residentes,

Les informamos que el área de la alberca permanecerá cerrada por mantenimiento el próximo viernes [Fecha] de [Hora de inicio] a [Hora de fin]. Agradecemos su comprensión mientras realizamos estas mejoras.

Atentamente,
La Administración."

- Si el asunto es "Recordatorio de pago de cuota", el borrador podría ser:
"Estimados vecinos,

Este es un amable recordatorio de que la fecha límite para el pago de la cuota de mantenimiento de este mes es el día [Fecha Límite]. Pueden realizar su pago a través de [Métodos de Pago].

Agradecemos su puntualidad.

Saludos cordiales,
La Administración."

- Si el asunto es "Fiesta de fin de año", el borrador podría ser:
"¡Hola a todos!

Nos complace invitarlos a nuestra tradicional fiesta de fin de año, que se llevará a cabo el [Fecha] a las [Hora] en el salón de eventos. Habrá música, comida y muchas sorpresas.

¡Esperamos contar con su presencia para celebrar juntos!

Atentamente,
El Comité Organizador."

Genera el borrador en el formato JSON especificado.
`,
});

const generateComunicadoDraftFlow = ai.defineFlow(
  {
    name: 'generateComunicadoDraftFlow',
    inputSchema: GenerateComunicadoDraftInputSchema,
    outputSchema: GenerateComunicadoDraftOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
