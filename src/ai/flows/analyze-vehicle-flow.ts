
'use server';
/**
 * @fileOverview An AI flow for analyzing a vehicle's visual characteristics from a photo.
 *
 * - analyzeVehicle - A function that identifies the type, brand, and color of a vehicle from an image.
 * - AnalyzeVehicleInput - The input type for the flow.
 * - AnalyzeVehicleOutput - The return type for the flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVehicleInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a vehicle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVehicleInput = z.infer<typeof AnalyzeVehicleInputSchema>;

const AnalyzeVehicleOutputSchema = z.object({
  type: z.string().describe("The type of the vehicle (e.g., 'SUV', 'Sedán', 'Camioneta Pick-Up')."),
  brand: z.string().describe("The brand of the vehicle (e.g., 'Nissan', 'Ford', 'Toyota')."),
  color: z.string().describe("The primary color of the vehicle (e.g., 'Rojo', 'Blanco', 'Gris')."),
});
export type AnalyzeVehicleOutput = z.infer<typeof AnalyzeVehicleOutputSchema>;

export async function analyzeVehicle(
  input: AnalyzeVehicleInput
): Promise<AnalyzeVehicleOutput> {
  return analyzeVehicleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVehiclePrompt',
  input: {schema: AnalyzeVehicleInputSchema},
  output: {schema: AnalyzeVehicleOutputSchema},
  prompt: `You are a vehicle recognition expert. Analyze the provided image of a vehicle and identify its key characteristics.

Your task is to determine the vehicle's type, brand, and primary color. Provide the output in the specified JSON format.

-   **type**: Identify the category of the vehicle. Examples: 'Automóvil Sedán', 'SUV', 'Camioneta Pick-Up', 'Motocicleta'.
-   **brand**: Identify the manufacturer of the vehicle. Examples: 'Toyota', 'Chevrolet', 'Volkswagen'.
-   **color**: Identify the main color of the vehicle. Examples: 'Blanco', 'Negro', 'Rojo'.

Analyze the image and provide only the requested information.

Image to analyze:
{{media url=photoDataUri}}`,
});

const analyzeVehicleFlow = ai.defineFlow(
  {
    name: 'analyzeVehicleFlow',
    inputSchema: AnalyzeVehicleInputSchema,
    outputSchema: AnalyzeVehicleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
