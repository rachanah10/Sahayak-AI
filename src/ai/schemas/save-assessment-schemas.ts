
import { z } from 'zod';

const QuestionSchema = z.object({
    no: z.string(),
    text: z.string(),
    answer: z.string(),
    difficulty: z.number().min(1).max(5),
    tags: z.array(z.string()),
});

export const SaveAssessmentInputSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  grade: z.string(),
  numQuestions: z.number(),
  questionType: z.string(),
  timer: z.number().optional(),
  deadline: z.string().optional(),
  questions: z.array(QuestionSchema),
});

export type SaveAssessmentInput = z.infer<typeof SaveAssessmentInputSchema>;
