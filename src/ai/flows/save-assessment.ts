
'use server';

/**
 * @fileOverview A flow for saving generated assessments to Firestore.
 *
 * - saveAssessment - A function that saves an assessment.
 */

import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import type { SaveAssessmentInput } from "@/ai/schemas/save-assessment-schemas";

// This function will be called from a Server Action.
export async function saveAssessment(input: SaveAssessmentInput, userId: string): Promise<{ id: string }> {
  
  if (!userId) {
    throw new Error("User must be authenticated to save an assessment.");
  }
  
  // Ensure Firebase Admin is initialized
  initAdmin();
  const db = getFirestore();
  
  const assessmentDoc = {
    ...input,
    userId: userId,
    createdAt: new Date(),
    questions: input.questions.map(q => ({
      ...q,
      // grade and topic are now top-level fields on the assessment
    })),
  };
  
  // Remove fields that are not part of the top-level document schema
  // @ts-ignore
  delete assessmentDoc.numQuestions;
  // @ts-ignore
  delete assessmentDoc.questionType;

  const docRef = await db.collection('assessments').add(assessmentDoc);

  return { id: docRef.id };
}
