
'use server';

/**
 * @fileOverview A flow for saving generated assessments to Firestore.
 *
 * - saveAssessment - A function that saves an assessment.
 * - SaveAssessmentInput - The input type for the saveAssessment function.
 */

import { z } from 'genkit';
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

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

// This function will be called from a Server Action, so it needs to handle auth.
// We'll assume a mechanism exists to pass the user's UID to this function.
export async function saveAssessment(input: SaveAssessmentInput, userId: string): Promise<{ id: string }> {
  if (!userId) {
    throw new Error("User must be authenticated to save an assessment.");
  }
  
  // Ensure Firebase Admin is initialized
  initFirebaseAdmin();
  const db = getFirestore();
  const docRef = await db.collection('assessments').add({
    ...input,
    userId: userId,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}
