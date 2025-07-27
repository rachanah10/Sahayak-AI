
'use server';

/**
 * @fileOverview A flow for saving generated assessments to Firestore.
 *
 * - saveAssessment - A function that saves an assessment.
 */

import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import type { SaveAssessmentInput } from "@/ai/schemas/save-assessment-schemas";
import { getAuth } from "firebase-admin/auth";

async function getCurrentUserId(): Promise<string> {
    initAdmin();
    // In a real app, you'd get this from the session.
    // For this prototype, we'll use a hardcoded UID to avoid permission issues with listUsers.
    // This corresponds to the first pre-seeded user.
    return "erYvJ848w6hSFjvPBfOA5zwqLK72";
}


// This function will be called from a Server Action.
export async function saveAssessment(input: SaveAssessmentInput): Promise<{ id: string }> {
  
  const userId = await getCurrentUserId();
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
      grade: parseInt(input.grade, 10),
      topic: input.topic,
    })),
  };
  
  // Remove fields that are not part of the top-level document
  // @ts-ignore
  delete assessmentDoc.numQuestions;
  // @ts-ignore
  delete assessmentDoc.questionType;

  const docRef = await db.collection('assessments').add(assessmentDoc);

  return { id: docRef.id };
}

    