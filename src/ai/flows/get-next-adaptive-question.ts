
'use server';

/**
 * @fileOverview An adaptive assessment agent that selects the next question and calculates the final score.
 *
 * - getNextAdaptiveQuestion - A function that handles the adaptive question selection logic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GetNextQuestionInputSchema, GetNextQuestionOutputSchema, QuestionSchema, AnsweredQuestionSchema } from '@/ai/schemas/adaptive-assessment-schemas';

export type GetNextQuestionInput = z.infer<typeof GetNextQuestionInputSchema>;
export type GetNextQuestionOutput = z.infer<typeof GetNextQuestionOutputSchema>;

export async function getNextAdaptiveQuestion(input: GetNextQuestionInput): Promise<GetNextQuestionOutput> {
  return getNextAdaptiveQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getNextAdaptiveQuestionPrompt',
  input: {schema: GetNextQuestionInputSchema},
  output: {schema: GetNextQuestionOutputSchema},
  prompt: `You are an AI agent that facilitates an adaptive test for a student. Your goal is to select the next best question to ask and, when the test is over, to calculate a final score based on performance and difficulty.

  **Assessment Context:**
  - Total questions available: {{allQuestions.length}}
  - Total questions to ask in this session: {{questionsToAsk}}
  - Questions answered so far: {{answeredQuestions.length}}

  **Student's Answer History (Recent to Oldest):**
  {{#if answeredQuestions.length}}
    {{#each answeredQuestions}}
    - Question {{this.no}} (Difficulty: {{this.difficulty}}): {{#if this.isCorrect}}Correct{{else}}Incorrect{{/if}}
    {{/each}}
  {{else}}
    This is the first question.
  {{/if}}

  **Your Task:**

  1.  **Check if the test is complete.** The test is complete if the number of answered questions equals the 'questionsToAsk' value.

  2.  **If the test is NOT complete:**
      a.  Analyze the student's performance on the answered questions. Pay attention to the difficulty of the questions they got right or wrong.
      b.  Select the **best next question** from the 'allQuestions' list that has NOT already been answered. Do not repeat questions.
      c.  The ideal next question should challenge the student appropriately. If they are doing well (especially on hard questions), select a slightly harder question. If they are struggling (especially on easy questions), select an easier one. Try to vary the difficulty to get a good sense of their ability.
      d.  Return **only** the 'nextQuestion'. Do not return 'isComplete' or 'finalScore'.

  3.  **If the test IS complete:**
      a.  Calculate a 'finalScore'. This score should be out of 100. It must be weighted based on the difficulty of the questions the student answered correctly. A correct answer on a difficulty 5 question is worth more than a correct answer on a difficulty 1 question.
      b.  Return 'isComplete: true' and the calculated 'finalScore'. Do not return a 'nextQuestion'.
  
  **List of all available questions (Do not choose from questions already answered):**
  {{#each allQuestions}}
  - Question {{this.no}} (ID: {{this.no}}): "{{this.text}}" (Difficulty: {{this.difficulty}})
  {{/each}}
`,
  config: {
    temperature: 0.3
  }
});


const getNextAdaptiveQuestionFlow = ai.defineFlow(
  {
    name: 'getNextAdaptiveQuestionFlow',
    inputSchema: GetNextQuestionInputSchema,
    outputSchema: GetNextQuestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    if (!output) {
        throw new Error("The AI failed to select a question or calculate a score.");
    }
    
    // Ensure the returned question exists in the original list
    if (output.nextQuestion) {
        const questionExists = input.allQuestions.some(q => q.no === output.nextQuestion?.no);
        if (!questionExists) {
            // Fallback: if the AI hallucinates a question, pick a random unanswered one.
            const answeredNos = new Set(input.answeredQuestions.map(q => q.no));
            const unanswered = input.allQuestions.filter(q => !answeredNos.has(q.no));
            if (unanswered.length > 0) {
                output.nextQuestion = unanswered[Math.floor(Math.random() * unanswered.length)];
            } else {
                 // This case should ideally not be reached if logic is correct
                return { isComplete: true, finalScore: output.finalScore || 0 };
            }
        }
    }
    
    return output;
  }
);
