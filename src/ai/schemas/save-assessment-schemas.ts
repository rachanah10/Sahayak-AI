
import { z } from 'zod';

const QuestionSchema = z.object({
    no: z.string(),
    text: z.string(),
    answer: z.string(),
    difficulty: z.number(),
    tags: z.array(z.string()),
});

export const SaveAssessmentInputSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  grade: z.string(), // Keep as string for display, convert to number on save
  numQuestions: z.number(),
  questionType: z.string(),
  timer: z.number().optional(),
  deadline: z.string().optional(),
  questions: z.array(QuestionSchema),
});

export type SaveAssessmentInput = z.infer<typeof SaveAssessmentInputSchema>;
