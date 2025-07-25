'use server';

/**
 * @fileOverview Generates blackboard-friendly diagrams from voice/text input.
 *
 * - generateVisualAidDiagram - A function that generates a diagram.
 * - GenerateVisualAidDiagramInput - The input type for the generateVisualAidDiagram function.
 * - GenerateVisualAidDiagramOutput - The return type for the generateVisualAidDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVisualAidDiagramInputSchema = z.object({
  description: z.string().describe('A voice or text description of the diagram to generate.'),
});
export type GenerateVisualAidDiagramInput = z.infer<typeof GenerateVisualAidDiagramInputSchema>;

const GenerateVisualAidDiagramOutputSchema = z.object({
  diagramDataUri: z
    .string()
    .describe(
      'A data URI containing the generated diagram image, that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateVisualAidDiagramOutput = z.infer<typeof GenerateVisualAidDiagramOutputSchema>;

export async function generateVisualAidDiagram(
  input: GenerateVisualAidDiagramInput
): Promise<GenerateVisualAidDiagramOutput> {
  return generateVisualAidDiagramFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVisualAidDiagramPrompt',
  input: {schema: GenerateVisualAidDiagramInputSchema},
  output: {schema: GenerateVisualAidDiagramOutputSchema},
  prompt: `You are an AI assistant that generates simple, blackboard-friendly diagrams based on user descriptions.

  Please generate a visual diagram based on the following description. The diagram should be suitable for display on a blackboard in a classroom setting. Focus on clarity and simplicity, using a hand-drawn style. Optimize the image for quick comprehension by students.

  Description: {{{description}}}

  If the description is not image-related, return a default diagram of a flower.
  `,
});

const generateVisualAidDiagramFlow = ai.defineFlow(
  {
    name: 'generateVisualAidDiagramFlow',
    inputSchema: GenerateVisualAidDiagramInputSchema,
    outputSchema: GenerateVisualAidDiagramOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.description,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      console.error('No image was generated. Returning a default image.');
      // Provide a default image if the image generation fails.
      return {
        diagramDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w+bJgYGBgYGB4Tt9///4DwAEoQKLWQOAAAABJRU5ErkJggg==',
      };
    }

    return {
      diagramDataUri: media.url,
    };
  }
);
