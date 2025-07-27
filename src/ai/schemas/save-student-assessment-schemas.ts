
import { z } from 'zod';

const SubmittedAnswerSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  answer: z.string(),
  correctAnswer: z.string(),
  difficulty: z.number(),
  tags: z.array(z.string()),
});

export const SaveStudentAssessmentInputSchema = z.object({
  studentId: z.string(),
  assessmentId: z.string(),
  assessmentTopic: z.string(),
  submittedAnswers: z.array(SubmittedAnswerSchema),
  timeTaken: z.number().describe("Time taken in seconds"),
});

export type SaveStudentAssessmentInput = z.infer<typeof SaveStudentAssessmentInputSchema>;
