
'use server';

/**
 * @fileOverview A flow for generating personalized revision questions for a student.
 *
 * - generateRevisionQuestionsAction - A function that generates revision questions based on past performance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import type { AnsweredQuestion } from '@/ai/schemas/adaptive-assessment-schemas';

// Schema for the main revision question generation
const GenerateRevisionQuestionsInputSchema = z.object({
  studentId: z.string().describe("The ID of the student requesting the revision."),
  topic: z.string().describe('The topic or chapter for which revision questions are to be generated.'),
  numQuestions: z.number().min(1).max(20).describe('The total number of revision questions to generate.'),
  questionType: z.enum(['Multiple Choice', 'Fill in the Blanks', 'Short Answer', 'Mix']).describe('The type of questions to generate.'),
});
export type GenerateRevisionQuestionsInput = z.infer<typeof GenerateRevisionQuestionsInputSchema>;

// Reuse the Question schema from assessment generation
const QuestionSchema = z.object({
    no: z.string().describe("Question number, e.g., '1'"),
    text: z.string().describe("The text of the question."),
    answer: z.string().describe("The correct answer to the question."),
    difficulty: z.number().min(1).max(5).describe("Difficulty rating from 1 (easiest) to 5 (hardest)."),
    tags: z.array(z.string()).describe("Relevant tags for the question."),
});

const GenerateRevisionQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe("A list of generated revision questions."),
});
export type GenerateRevisionQuestionsOutput = z.infer<typeof GenerateRevisionQuestionsOutputSchema>;


// Exported action for the frontend
export async function generateRevisionQuestionsAction(input: GenerateRevisionQuestionsInput): Promise<GenerateRevisionQuestionsOutput> {
  return generateRevisionQuestionsFlow(input);
}

// Function to fetch past performance data from Firestore
async function getPastPerformance(studentId: string, topic: string): Promise<AnsweredQuestion[]> {
    initAdmin();
    const db = getFirestore();

    const snapshot = await db.collection(`student-assessments/${studentId}/assessments`)
                             .where('topic', '==', topic)
                             .get();

    if (snapshot.empty) {
        return [];
    }
    
    let allAnsweredQuestions: AnsweredQuestion[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.questionsAttempted) {
            allAnsweredQuestions = allAnsweredQuestions.concat(data.questionsAttempted as AnsweredQuestion[]);
        }
    });

    return allAnsweredQuestions;
}

const revisionPrompt = ai.definePrompt({
  name: 'generateRevisionQuestionsPrompt',
  input: {
    schema: z.object({
        ...GenerateRevisionQuestionsInputSchema.shape,
        pastPerformanceSummary: z.string().describe("A summary of the student's past incorrect answers.")
    }),
  },
  output: {
    schema: GenerateRevisionQuestionsOutputSchema,
  },
  prompt: `You are an expert tutor creating a personalized revision worksheet for a student. Your goal is to help them improve by focusing on their past mistakes.

  **Student's Goal:**
  - Topic: {{topic}}
  - Number of Questions to Generate: {{numQuestions}}
  - Question Type: {{questionType}}

  **Student's Past Mistakes on this Topic:**
  Based on their previous assessments, the student struggled with the following questions/concepts:
  {{{pastPerformanceSummary}}}

  **Your Task:**
  Generate exactly {{numQuestions}} new questions that target these specific areas of weakness. The new questions should be slightly challenging to encourage learning, but directly related to the concepts the student answered incorrectly before. Do not simply repeat the old questions. Create new scenarios or rephrase the questions to test for genuine understanding.

  Ensure the questions match the requested type: {{questionType}}.
  For each question, provide all the fields specified in the output schema, including a difficulty rating from 1 to 5.
`,
});

const generateRevisionQuestionsFlow = ai.defineFlow(
  {
    name: 'generateRevisionQuestionsFlow',
    inputSchema: GenerateRevisionQuestionsInputSchema,
    outputSchema: GenerateRevisionQuestionsOutputSchema,
  },
  async (input) => {
    // 1. Fetch the student's past performance
    const pastAnswers = await getPastPerformance(input.studentId, input.topic);
    
    const incorrectAnswers = pastAnswers.filter(a => !a.isCorrect);

    let pastPerformanceSummary = "No past mistakes found on this topic. Please generate general revision questions with a mix of difficulties.";
    
    if (incorrectAnswers.length > 0) {
        pastPerformanceSummary = incorrectAnswers
            .map(q => `- Question: "${q.text}" (Correct Answer was: "${q.answer}")`)
            .join('\n');
    }

    // 2. Call the prompt with the performance summary
    const { output } = await revisionPrompt({
        ...input,
        pastPerformanceSummary,
    });

    if (!output?.questions) {
      throw new Error('Failed to generate revision questions. The prompt may have been blocked.');
    }
    return output;
  }
);
