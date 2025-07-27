
"use server";

import {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
} from "@/ai/flows/generate-localized-content";

import { generateHomeworkAction, suggestHomeworkTagsAction } from "@/ai/flows/generate-homework";
import { answerTeachingQuestion } from "@/ai/flows/answer-teaching-question";
import { answerStudyingQuestion } from "@/ai/flows/answer-studying-question";
import { generateAssessmentQuestions } from "@/ai/flows/generate-assessment-questions";
import { createWeeklyLessonPlan } from "@/ai/flows/create-weekly-lesson-plan";
import { suggestFollowUpContent } from "@/ai/flows/suggest-follow-up-content";
import { saveToContentLibrary } from "@/ai/flows/save-to-content-library";
import { saveAssessment } from "@/ai/flows/save-assessment";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";
import type { SaveToContentLibraryInput } from "@/ai/schemas/save-to-content-library-schemas";
import type { SaveAssessmentInput } from "@/ai/schemas/save-assessment-schemas";


async function getCurrentUserId(): Promise<string> {
    initAdmin();
    // In a real app, you'd get this from the session.
    // For this prototype, we'll get the first user as a stand-in.
    const user = await getAuth().listUsers(1);
    if(user.users.length > 0) {
        return user.users[0].uid;
    }
    throw new Error("No users found.");
}


export {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
  generateHomeworkAction,
  suggestHomeworkTagsAction,
};

export const answerTeachingQuestionAction = answerTeachingQuestion;
export const answerStudyingQuestionAction = answerStudyingQuestion;
export const generateAssessmentQuestionsAction = generateAssessmentQuestions;
export const createWeeklyLessonPlanAction = createWeeklyLessonPlan;
export const suggestFollowUpContentAction = suggestFollowUpContent;

export async function saveToContentLibraryAction(input: SaveToContentLibraryInput) {
    const userId = await getCurrentUserId();
    return saveToContentLibrary(input, userId);
}

export async function saveAssessmentAction(input: SaveAssessmentInput) {
     const userId = await getCurrentUserId();
    return saveAssessment(input, userId);
}
