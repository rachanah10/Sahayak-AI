
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
  
  // Convert grade string (e.g., "4th Grade") to a number
  const gradeNumber = parseInt(input.grade, 10);

  const assessmentDoc = {
    userId: userId,
    subject: input.subject,
    topic: input.topic,
    grade: input.grade, // Keep original string for display
    numQuestions: input.numQuestions,
    questionType: input.questionType,
    timer: input.timer,
    deadline: input.deadline,
    createdAt: new Date(),
    questions: input.questions.map(q => ({
      ...q,
      grade: gradeNumber, // Save numeric grade
      topic: input.topic, // Add topic to each question for easier querying
    })),
  };
  
  const docRef = await db.collection('assessments').add(assessmentDoc);

  return { id: docRef.id };
}
