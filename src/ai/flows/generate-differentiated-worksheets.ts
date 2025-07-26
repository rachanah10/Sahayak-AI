'use server';

/**
 * @fileOverview Homework generator from textbook image.
 *
 * - generateHomework - A function that generates differentiated worksheets.
 * - GenerateHomeworkInput - The input type for the generateHomework function.
 * - GenerateHomeworkOutput - The return type for the generateHomework function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHomeworkInputSchema = z.object({
  textbookPageImage: z
    .string()
    .describe(
      "A photo of a textbook page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topic: z.string().describe('The topic of the textbook page.'),
});
export type GenerateHomeworkInput = z.infer<typeof GenerateHomeworkInputSchema>;

const GenerateHomeworkOutputSchema = z.object({
  easyWorksheet: z.string().describe('A worksheet for students who need more support.'),
  mediumWorksheet: z.string().describe('A worksheet for students who are at grade level.'),
  hardWorksheet: z.string().describe('A worksheet for students who need a challenge.'),
});
export type GenerateHomeworkOutput = z.infer<typeof GenerateHomeworkOutputSchema>;

export async function generateHomework(
  input: GenerateHomeworkInput
): Promise<GenerateHomeworkOutput> {
  return generateHomeworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHomeworkPrompt',
  input: {schema: GenerateHomeworkInputSchema},
  output: {schema: GenerateHomeworkOutputSchema},
  prompt: `You are an expert teacher specializing in creating differentiated worksheets for students with different learning needs.

You will use the following information to generate three worksheets: one easy, one medium, and one hard.

Topic: {{{topic}}}
Textbook Page Image: {{media url=textbookPageImage}}

Generate three worksheets, one for each difficulty level. The worksheets should be tailored to the content of the textbook page image, and the topic.

Easy Worksheet: A worksheet for students who need more support. The questions should be simple and straightforward.

Medium Worksheet: A worksheet for students who are at grade level. The questions should be more challenging than the easy worksheet, but still accessible to students at grade level.

Hard Worksheet: A worksheet for students who need a challenge. The questions should be the most challenging, and should require students to think critically about the material.

Format the worksheets as text.

{{output schema=GenerateHomeworkOutputSchema}}
`,
});

const generateHomeworkFlow = ai.defineFlow(
  {
    name: 'generateHomeworkFlow',
    inputSchema: GenerateHomeworkInputSchema,
    outputSchema: GenerateHomeworkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
