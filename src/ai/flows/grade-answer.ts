
'use server';

/**
 * @fileOverview An AI agent to grade a student's open-ended answer.
 *
 * - gradeAnswer - A function that grades a student's answer.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for the Grading Agent
const GradeAnswerInputSchema = z.object({
  questionText: z.string().describe("The question the student was asked."),
  correctAnswer: z.string().describe("The model or correct answer for the question."),
  studentAnswer: z.string().describe("The answer provided by the student."),
});
export type GradeAnswerInput = z.infer<typeof GradeAnswerInputSchema>;

// Output Schema for the Grading Agent
const GradeAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe("Whether the student's answer is considered correct."),
  feedback: z.string().describe("A brief explanation for why the answer is correct or incorrect."),
});
export type GradeAnswerOutput = z.infer<typeof GradeAnswerOutputSchema>;

// The main exported function that the frontend will call.
export async function gradeAnswer(input: GradeAnswerInput): Promise<GradeAnswerOutput> {
  return gradeAnswerFlow(input);
}

const gradingPrompt = ai.definePrompt({
  name: 'gradeAnswerPrompt',
  input: { schema: GradeAnswerInputSchema },
  output: { schema: GradeAnswerOutputSchema },
  prompt: `You are an expert AI grader for school assessments. Your task is to evaluate a student's answer and determine if it is correct. Be lenient with spelling and grammar, but strict on the core concepts.

  **Question:**
  {{{questionText}}}

  **Correct Answer / Rubric:**
  {{{correctAnswer}}}

  **Student's Answer:**
  {{{studentAnswer}}}

  ---
  **Evaluation:**
  Analyze the student's answer. Does it correctly address the main points of the question based on the provided correct answer?
  - If the student's answer is substantially correct, even if phrased differently, set 'isCorrect' to true.
  - If the student's answer is incorrect, incomplete, or misses the key concept, set 'isCorrect' to false.

  Provide a very brief, one-sentence feedback explaining your decision.
  `,
  config: {
    temperature: 0.1, // Be more deterministic for grading
  }
});


const gradeAnswerFlow = ai.defineFlow(
  {
    name: 'gradeAnswerFlow',
    inputSchema: GradeAnswerInputSchema,
    outputSchema: GradeAnswerOutputSchema,
  },
  async (input) => {
    const { output } = await gradingPrompt(input);

    if (!output) {
      throw new Error('The AI grader failed to evaluate the answer.');
    }
    
    return output;
  }
);
