
'use server';
/**
 * @fileOverview An AI agent that generates a concept for a financial charge.
 *
 * - generateChargeConcept - A function that returns a suggested charge concept.
 * - GenerateChargeConceptInput - The input type for the flow.
 * - GenerateChargeConceptOutput - The return type for the flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GenerateChargeConceptInputSchema = z.object({});
export type GenerateChargeConceptInput = z.infer<typeof GenerateChargeConceptInputSchema>;

const GenerateChargeConceptOutputSchema = z.object({
  concept: z.string().describe('The generated concept text, e.g., "Cuota de Mantenimiento Octubre 2024"'),
});
export type GenerateChargeConceptOutput = z.infer<typeof GenerateChargeConceptOutputSchema>;

export async function generateChargeConcept(
  input: GenerateChargeConceptInput
): Promise<GenerateChargeConceptOutput> {
  return generateChargeConceptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChargeConceptPrompt',
  input: {
    schema: z.object({
      currentDate: z.string().describe("The current date in 'MMMM yyyy' format in Spanish."),
    })
  },
  output: {schema: GenerateChargeConceptOutputSchema},
  prompt: `Eres un asistente para un administrador de condominios. Tu tarea es generar un concepto conciso y descriptivo para un cargo de cuota de mantenimiento.

Usa el mes y año proporcionados para crear el concepto.

Fecha de referencia: {{{currentDate}}}

Ejemplo de salida:
- Si la fecha es "Octubre 2024", el concepto debe ser "Cuota de Mantenimiento Octubre 2024".

Genera el concepto en el formato JSON especificado.`,
});

const generateChargeConceptFlow = ai.defineFlow(
  {
    name: 'generateChargeConceptFlow',
    inputSchema: GenerateChargeConceptInputSchema,
    outputSchema: GenerateChargeConceptOutputSchema,
  },
  async () => {
    const currentDate = format(new Date(), "MMMM yyyy", { locale: es });
    const {output} = await prompt({ currentDate });
    return output!;
  }
);
