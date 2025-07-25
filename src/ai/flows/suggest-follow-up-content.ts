// Implemented the suggestFollowUpContent flow to provide personalized learning suggestions and draft reports.

'use server';

/**
 * @fileOverview Suggests follow-up content and generates a draft weekly performance report based on a student's skill level.
 *
 * - suggestFollowUpContent - A function that suggests follow-up content and generates a draft report.
 * - SuggestFollowUpContentInput - The input type for the suggestFollowUpContent function.
 * - SuggestFollowUpContentOutput - The return type for the suggestFollowUpContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFollowUpContentInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  skillLevel: z.string().describe('The current skill level of the student.'),
  topic: z.string().describe('The topic or subject area.'),
  weeklyPerformance: z.string().optional().describe('Optional details of the student\'s weekly performance.'),
});
export type SuggestFollowUpContentInput = z.infer<typeof SuggestFollowUpContentInputSchema>;

const SuggestFollowUpContentOutputSchema = z.object({
  suggestedContent: z.string().describe('Suggested follow-up content for the student.'),
  draftReport: z.string().describe('A draft weekly performance report.'),
});
export type SuggestFollowUpContentOutput = z.infer<typeof SuggestFollowUpContentOutputSchema>;

export async function suggestFollowUpContent(input: SuggestFollowUpContentInput): Promise<SuggestFollowUpContentOutput> {
  return suggestFollowUpContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFollowUpContentPrompt',
  input: {schema: SuggestFollowUpContentInputSchema},
  output: {schema: SuggestFollowUpContentOutputSchema},
  prompt: `You are an AI assistant helping teachers individualize learning for their students.

  Based on the student's current skill level, suggest appropriate follow-up content.
  Also, generate a draft weekly performance report summarizing the student's progress and areas for improvement.

  Student Name: {{{studentName}}}
  Skill Level: {{{skillLevel}}}
  Topic: {{{topic}}}
  Weekly Performance Details: {{{weeklyPerformance}}}

  Suggested Content:
  Draft Report: `,
});

const suggestFollowUpContentFlow = ai.defineFlow(
  {
    name: 'suggestFollowUpContentFlow',
    inputSchema: SuggestFollowUpContentInputSchema,
    outputSchema: SuggestFollowUpContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
