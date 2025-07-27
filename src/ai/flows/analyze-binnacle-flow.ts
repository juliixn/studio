
'use server';
/**
 * @fileOverview Un agente de IA que analiza las entradas de la bitácora.
 *
 * - analyzeBinnacle - Una función que revisa el reporte de un guardia y sugiere una acción.
 * - AnalyzeBinnacleInput - El tipo de entrada para el flujo.
 * - AnalyzeBinnacleOutput - El tipo de retorno para el flujo.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBinnacleInputSchema = z.object({
  report: z.string().describe("El contenido textual del reporte del guardia desde la bitácora."),
});
export type AnalyzeBinnacleInput = z.infer<typeof AnalyzeBinnacleInputSchema>;

const AnalyzeBinnacleOutputSchema = z.object({
  suggestedAction: z
    .enum(['create_peticion', 'none'])
    .describe(
      "La acción sugerida. Debe ser 'create_peticion' si el reporte indica un problema que necesita atención administrativa, o 'none' si es puramente informativo."
    ),
  petitionTitle: z
    .string()
    .optional()
    .describe(
      'Un título conciso y descriptivo para la petición sugerida (máximo 10 palabras). Solo es requerido si suggestedAction es "create_peticion".'
    ),
  petitionDescription: z
    .string()
    .optional()
    .describe(
      'Una descripción detallada para la petición, basada en el reporte. Solo es requerido si suggestedAction es "create_peticion".'
    ),
});
export type AnalyzeBinnacleOutput = z.infer<typeof AnalyzeBinnacleOutputSchema>;

export async function analyzeBinnacle(
  input: AnalyzeBinnacleInput
): Promise<AnalyzeBinnacleOutput> {
  return analyzeBinnacleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBinnaclePrompt',
  input: {schema: AnalyzeBinnacleInputSchema},
  output: {schema: AnalyzeBinnacleOutputSchema},
  prompt: `Eres un asistente inteligente para un supervisor de una empresa de seguridad. Analiza el siguiente reporte de la bitácora de un guardia de seguridad.

Tu tarea es determinar si el reporte describe un problema que requiere una acción o seguimiento por parte de la administración.

- Si el reporte describe un problema (como una fuga, una luz rota, un conflicto, daño a la propiedad, un riesgo de seguridad), sugiere crear una 'petición'.
- Si el reporte es puramente informativo (ej. "rondín de rutina completado", "ingresó proveedor", "todo en orden"), no requiere ninguna acción.

Basado en tu análisis, proporciona la salida en el formato JSON especificado.

- Si se necesita una acción, establece 'suggestedAction' a 'create_peticion'. Luego, genera un 'petitionTitle' (título de petición) conciso y una 'petitionDescription' (descripción de petición) clara, basada en el contenido del reporte.
- Si no se necesita ninguna acción, establece 'suggestedAction' a 'none' y omite los otros campos.

Reporte del Guardia:
"{{{report}}}"`,
});

const analyzeBinnacleFlow = ai.defineFlow(
  {
    name: 'analyzeBinnacleFlow',
    inputSchema: AnalyzeBinnacleInputSchema,
    outputSchema: AnalyzeBinnacleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
