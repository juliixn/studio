
'use server';
/**
 * @fileOverview An AI flow for extracting license plate text from an image.
 *
 * - extractLicensePlate - A function that performs OCR on an image to find a license plate.
 * - ExtractLicensePlateInput - The input type for the flow.
 * - ExtractLicensePlateOutput - The return type for the flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractLicensePlateInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a vehicle's license plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractLicensePlateInput = z.infer<typeof ExtractLicensePlateInputSchema>;

const ExtractLicensePlateOutputSchema = z.object({
  licensePlate: z.string().describe('The extracted license plate text. Should be uppercase and contain no spaces or special characters. If no plate is found, return an empty string.'),
});
export type ExtractLicensePlateOutput = z.infer<
  typeof ExtractLicensePlateOutputSchema
>;

export async function extractLicensePlate(
  input: ExtractLicensePlateInput
): Promise<ExtractLicensePlateOutput> {
  return extractLicensePlateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractLicensePlatePrompt',
  input: {schema: ExtractLicensePlateInputSchema},
  output: {schema: ExtractLicensePlateOutputSchema},
  prompt: `You are an Optical Character Recognition (OCR) system specialized in reading vehicle license plates from images.

Your task is to analyze the provided image and extract the license plate number.

-   The output must only contain the letters and numbers of the license plate.
-   Remove any dashes, spaces, or other special characters.
-   The text should be in all uppercase.
-   If you cannot find a license plate in the image, return an empty string for the 'licensePlate' field.

Image to analyze:
{{media url=photoDataUri}}`,
});

const extractLicensePlateFlow = ai.defineFlow(
  {
    name: 'extractLicensePlateFlow',
    inputSchema: ExtractLicensePlateInputSchema,
    outputSchema: ExtractLicensePlateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
