
import { z } from 'zod';
import { AnsweredQuestionSchema } from './adaptive-assessment-schemas';

export const SaveStudentAssessmentInputSchema = z.object({
  studentId: z.string(),
  assessmentId: z.string(),
  assessmentTopic: z.string(),
  questionsAttempted: z.array(AnsweredQuestionSchema).describe("The list of questions the student actually answered."),
  timeTaken: z.number().describe("Time taken in seconds"),
  adaptiveScore: z.number().describe("The final score calculated by the adaptive AI agent."),
});

export type SaveStudentAssessmentInput = z.infer<typeof SaveStudentAssessmentInputSchema>;
