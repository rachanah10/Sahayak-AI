'use server';

/**
 * @fileOverview A flow for generating localized and culturally relevant stories based on a simple prompt.
 *
 * - generateLocalizedContent - A function that generates localized content.
 * - GenerateLocalizedContentInput - The input type for the generateLocalizedContent function.
 * - GenerateLocalizedContentOutput - The return type for the generateLocalizedContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLocalizedContentInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the localized story.'),
  localizationDetails: z.string().describe('Details about the target region, culture, and context for localization.'),
});

export type GenerateLocalizedContentInput = z.infer<typeof GenerateLocalizedContentInputSchema>;

const GenerateLocalizedContentOutputSchema = z.object({
  localizedStory: z.string().describe('The generated localized and culturally relevant story.'),
});

export type GenerateLocalizedContentOutput = z.infer<typeof GenerateLocalizedContentOutputSchema>;

export async function generateLocalizedContent(input: GenerateLocalizedContentInput): Promise<GenerateLocalizedContentOutput> {
  return generateLocalizedContentFlow(input);
}

const generateLocalizedContentPrompt = ai.definePrompt({
  name: 'generateLocalizedContentPrompt',
  input: {schema: GenerateLocalizedContentInputSchema},
  output: {schema: GenerateLocalizedContentOutputSchema},
  prompt: `You are a story writer specializing in localizing content for specific regions and cultures. Based on the following prompt and localization details, generate a culturally relevant and engaging story for students.

Prompt: {{{prompt}}}

Localization Details: {{{localizationDetails}}}

Localized Story:`, 
});

const generateLocalizedContentFlow = ai.defineFlow(
  {
    name: 'generateLocalizedContentFlow',
    inputSchema: GenerateLocalizedContentInputSchema,
    outputSchema: GenerateLocalizedContentOutputSchema,
  },
  async input => {
    const {output} = await generateLocalizedContentPrompt(input);
    return output!;
  }
);
