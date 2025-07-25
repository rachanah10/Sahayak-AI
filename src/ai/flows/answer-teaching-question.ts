// This file defines a Genkit flow for answering teaching-related questions.

'use server';

/**
 * @fileOverview An AI agent to answer teaching-related questions.
 *
 * - answerTeachingQuestion - A function that answers a teaching question.
 * - AnswerTeachingQuestionInput - The input type for the answerTeachingQuestion function.
 * - AnswerTeachingQuestionOutput - The return type for the answerTeachingQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerTeachingQuestionInputSchema = z.object({
  question: z.string().describe('The teaching-related question to answer.'),
});
export type AnswerTeachingQuestionInput = z.infer<typeof AnswerTeachingQuestionInputSchema>;

const AnswerTeachingQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the teaching-related question.'),
});
export type AnswerTeachingQuestionOutput = z.infer<typeof AnswerTeachingQuestionOutputSchema>;

export async function answerTeachingQuestion(input: AnswerTeachingQuestionInput): Promise<AnswerTeachingQuestionOutput> {
  return answerTeachingQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerTeachingQuestionPrompt',
  input: {schema: AnswerTeachingQuestionInputSchema},
  output: {schema: AnswerTeachingQuestionOutputSchema},
  prompt: `You are a helpful teaching assistant. Please answer the following question clearly and concisely:\n\nQuestion: {{{question}}}`,
});

const answerTeachingQuestionFlow = ai.defineFlow(
  {
    name: 'answerTeachingQuestionFlow',
    inputSchema: AnswerTeachingQuestionInputSchema,
    outputSchema: AnswerTeachingQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
