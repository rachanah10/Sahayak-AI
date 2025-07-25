'use server';

/**
 * @fileOverview Assessment question generator AI agent.
 *
 * - generateAssessmentQuestions - A function that generates assessment questions based on the topic or lesson plan.
 * - GenerateAssessmentQuestionsInput - The input type for the generateAssessmentQuestions function.
 * - GenerateAssessmentQuestionsOutput - The return type for the generateAssessmentQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAssessmentQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for which assessment questions are to be generated.'),
  lessonPlan: z.string().optional().describe('Optional lesson plan to use as context.'),
  numQuestions: z.number().default(5).describe('The number of assessment questions to generate.'),
  type: z.enum(['oral', 'written', 'both']).default('both').describe('The type of assessment questions to generate.'),
});

export type GenerateAssessmentQuestionsInput = z.infer<typeof GenerateAssessmentQuestionsInputSchema>;

const GenerateAssessmentQuestionsOutputSchema = z.object({
  oralQuestions: z.array(z.string()).optional().describe('Generated oral assessment questions.'),
  writtenQuestions: z.array(z.string()).optional().describe('Generated written assessment questions.'),
});

export type GenerateAssessmentQuestionsOutput = z.infer<typeof GenerateAssessmentQuestionsOutputSchema>;

export async function generateAssessmentQuestions(input: GenerateAssessmentQuestionsInput): Promise<GenerateAssessmentQuestionsOutput> {
  return generateAssessmentQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssessmentQuestionsPrompt',
  input: {
    schema: GenerateAssessmentQuestionsInputSchema,
  },
  output: {
    schema: GenerateAssessmentQuestionsOutputSchema,
  },
  prompt: `You are an expert teacher specializing in creating effective assessment questions. Based on the given topic and optional lesson plan, generate a set of assessment questions.

Topic: {{{topic}}}

Lesson Plan: {{{lessonPlan}}}

Number of Questions: {{{numQuestions}}}

Type of Questions: {{{type}}}

{{#if (eq type \"oral\")}}
Only generate oral questions.
{{/if}}

{{#if (eq type \"written\")}}
Only generate written questions.
{{/if}}

{{#if (eq type \"both\")}}
Generate both oral and written questions.
{{/if}}

Make sure the questions are tailored to assess student understanding of the topic and are appropriate for the given lesson plan, if provided.
`, // Changed from system to prompt
});

const generateAssessmentQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAssessmentQuestionsFlow',
    inputSchema: GenerateAssessmentQuestionsInputSchema,
    outputSchema: GenerateAssessmentQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
