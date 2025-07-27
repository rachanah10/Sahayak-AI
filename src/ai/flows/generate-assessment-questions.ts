
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
  subject: z.string().describe('The subject for the assessment (e.g., Math, Science).'),
  topic: z.string().describe('The topic or chapter for which assessment questions are to be generated.'),
  grade: z.string().describe('The grade level for the students.'),
  numQuestions: z.number().default(5).describe('The number of assessment questions to generate.'),
  questionType: z.enum(['Multiple Choice', 'Fill in the Blanks', 'Short Answer', 'Mix']).default('Mix').describe('The type of assessment questions to generate.'),
  timer: z.number().optional().describe('The time limit for the test in minutes.'),
  deadline: z.string().optional().describe('The deadline for the test.'),
});

export type GenerateAssessmentQuestionsInput = z.infer<typeof GenerateAssessmentQuestionsInputSchema>;

const GenerateAssessmentQuestionsOutputSchema = z.object({
  testContent: z.string().describe("The generated test content with questions."),
  answerKey: z.string().describe("The generated answer key for the teacher."),
});

export type GenerateAssessmentQuestionsOutput = z.infer<typeof GenerateAssessmentQuestionsOutputSchema>;

export async function generateAssessmentQuestions(input: GenerateAssessmentQuestionsInput): Promise<GenerateAssessmentQuestionsOutput> {
  return generateAssessmentQuestionsFlow(input);
}

const safetySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ];

const prompt = ai.definePrompt({
  name: 'generateAssessmentQuestionsPrompt',
  input: {
    schema: GenerateAssessmentQuestionsInputSchema,
  },
  output: {
    schema: GenerateAssessmentQuestionsOutputSchema,
  },
  prompt: `You are an expert teacher specializing in creating comprehensive and grade-appropriate assessments. Generate a test and a corresponding answer key based on the following details.

Subject: {{{subject}}}
Topic/Chapter: {{{topic}}}
Grade: {{{grade}}}
Number of Questions: {{{numQuestions}}}
Type of Questions: {{{questionType}}}
{{#if timer}}
Time Limit: {{{timer}}} minutes
{{/if}}

Instructions for the Test:
- Create a clear and well-structured test.
- The questions should be diverse if 'Mix' is chosen, otherwise stick to the specified question type.
- Ensure the difficulty is appropriate for the specified grade level.
- Format the test cleanly.

Instructions for the Answer Key:
- Create a separate, clear, and accurate answer key for all the questions in the test.
- Label it clearly as "Answer Key".

Generate the test content and the answer key as two separate outputs.
`,
  config: {
    safetySettings,
  }
});

const generateAssessmentQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAssessmentQuestionsFlow',
    inputSchema: GenerateAssessmentQuestionsInputSchema,
    outputSchema: GenerateAssessmentQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate assessment. The prompt may have been blocked by safety settings.');
    }
    return output;
  }
);
