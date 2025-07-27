
'use server';
/**
 * @fileOverview An AI flow for extracting a person's full name from an ID photo.
 *
 * - extractFullName - A function that performs OCR on an image to find a name.
 * - ExtractNameInput - The input type for the flow.
 * - ExtractNameOutput - The return type for the flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractNameInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an identification document (like a driver's license), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractNameInput = z.infer<typeof ExtractNameInputSchema>;

const ExtractNameOutputSchema = z.object({
  fullName: z.string().describe("The extracted full name of the person from the ID. If no name is found, return an empty string."),
});
export type ExtractNameOutput = z.infer<typeof ExtractNameOutputSchema>;

export async function extractFullName(
  input: ExtractNameInput
): Promise<ExtractNameOutput> {
  return extractFullNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractFullNamePrompt',
  input: {schema: ExtractNameInputSchema},
  output: {schema: ExtractNameOutputSchema},
  prompt: `You are an Optical Character Recognition (OCR) system specialized in reading official identification documents.

Your task is to analyze the provided image and extract the person's full name. Look for fields labeled "NOMBRE" or similar.

- The output must contain only the full name, including first name and all last names.
- Do not include any other text from the ID.
- If you cannot find a name in the image, return an empty string for the 'fullName' field.

Image to analyze:
{{media url=photoDataUri}}`,
});

const extractFullNameFlow = ai.defineFlow(
  {
    name: 'extractFullNameFlow',
    inputSchema: ExtractNameInputSchema,
    outputSchema: ExtractNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
