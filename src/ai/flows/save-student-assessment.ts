
'use server';

/**
 * @fileOverview A flow for saving a student's assessment attempt to Firestore.
 *
 * - saveStudentAssessment - A function that saves the student's attempt.
 */

import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import type { SaveStudentAssessmentInput } from "@/ai/schemas/save-student-assessment-schemas";

export async function saveStudentAssessment(input: SaveStudentAssessmentInput): Promise<{ id: string }> {
  const { studentId, assessmentId, questionsAttempted, timeTaken, assessmentTopic, adaptiveScore } = input;

  if (!studentId) {
    throw new Error("Student must be authenticated to save an assessment.");
  }
  
  initAdmin();
  const db = getFirestore();

  const attemptDoc = {
    studentId,
    assessmentId,
    topic: assessmentTopic,
    questionsAttempted,
    adaptiveScore,
    timeTaken,
    submittedAt: new Date(),
  };

  const docRef = db.collection('student-assessments').doc(studentId).collection('assessments').doc();
  await docRef.set(attemptDoc);

  return { id: docRef.id };
}
