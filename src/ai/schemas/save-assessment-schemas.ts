
import { z } from 'zod';

export const SaveAssessmentInputSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  grade: z.string(),
  numQuestions: z.number(),
  questionType: z.string(),
  timer: z.number().optional(),
  deadline: z.string().optional(),
  testContent: z.string(),
  answerKey: z.string(),
});

export type SaveAssessmentInput = z.infer<typeof SaveAssessmentInputSchema>;
