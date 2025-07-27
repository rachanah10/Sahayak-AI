
'use server';

/**
 * @fileOverview A flow for saving generated assessments to Firestore.
 *
 * - saveAssessment - A function that saves an assessment.
 */

import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import type { SaveAssessmentInput } from "@/ai/schemas/save-assessment-schemas";

// This function will be called from a Server Action, so it needs to handle auth.
// We'll assume a mechanism exists to pass the user's UID to this function.
export async function saveAssessment(input: SaveAssessmentInput, userId: string): Promise<{ id: string }> {
  if (!userId) {
    throw new Error("User must be authenticated to save an assessment.");
  }
  
  // Ensure Firebase Admin is initialized
  initAdmin();
  const db = getFirestore();
  const docRef = await db.collection('assessments').add({
    ...input,
    userId: userId,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}
