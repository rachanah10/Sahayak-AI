
import { z } from 'zod';

export const QuestionSchema = z.object({
    no: z.string().describe("Question number, e.g., '1'"),
    text: z.string().describe("The text of the question."),
    answer: z.string().describe("The correct answer to the question."),
    options: z.array(z.string()).optional().describe("A list of options for multiple choice questions."),
    difficulty: z.number().min(1).max(5).describe("Difficulty rating from 1 (easiest) to 5 (hardest)."),
    tags: z.array(z.string()).describe("Relevant tags for the question."),
    questionType: z.string().describe("The type of the question, e.g., 'Multiple Choice'."),
});
export type Question = z.infer<typeof QuestionSchema>;

export const AnsweredQuestionSchema = QuestionSchema.extend({
    isCorrect: z.boolean(),
    studentAnswer: z.string(),
});
export type AnsweredQuestion = z.infer<typeof AnsweredQuestionSchema>;


export const GetNextQuestionInputSchema = z.object({
  allQuestions: z.array(QuestionSchema).describe("The full list of questions available for the assessment."),
  answeredQuestions: z.array(AnsweredQuestionSchema).describe("An array of questions the student has already answered."),
  questionsToAsk: z.number().describe("The total number of questions that should be asked in this adaptive session.")
});


export const GetNextQuestionOutputSchema = z.object({
    isComplete: z.boolean().optional().describe("Set to true only when the assessment is finished."),
    nextQuestion: QuestionSchema.optional().describe("The next question for the student to answer. Should be null if the assessment is complete."),
    finalScore: z.number().optional().describe("The final, difficulty-weighted score. Should only be present if the assessment is complete."),
});

    
