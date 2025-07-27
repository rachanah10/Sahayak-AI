
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
  const { studentId, assessmentId, submittedAnswers, timeTaken, assessmentTopic } = input;

  if (!studentId) {
    throw new Error("Student must be authenticated to save an assessment.");
  }
  
  // Ensure Firebase Admin is initialized
  initAdmin();
  const db = getFirestore();

  let correctAnswersCount = 0;
  const processedAnswers = submittedAnswers.map(answer => {
    // Simple case-insensitive and whitespace-trimmed comparison
    const isCorrect = answer.answer.trim().toLowerCase() === answer.correctAnswer.trim().toLowerCase();
    if (isCorrect) {
      correctAnswersCount++;
    }
    return {
      ...answer,
      isCorrect,
    };
  });

  const score = (correctAnswersCount / submittedAnswers.length) * 100;

  const attemptDoc = {
    studentId,
    assessmentId,
    topic: assessmentTopic,
    answers: processedAnswers,
    score: parseFloat(score.toFixed(2)),
    timeTaken,
    submittedAt: new Date(),
  };

  const docRef = db.collection('student-assessments').doc(studentId).collection('assessments').doc(assessmentId);
  await docRef.set(attemptDoc);

  return { id: docRef.id };
}
