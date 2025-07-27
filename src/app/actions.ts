

"use server";

import {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
} from "@/ai/flows/generate-localized-content";

import { generateHomeworkAction, suggestHomeworkTagsAction } from "@/ai/flows/generate-homework";
import { answerTeachingQuestion } from "@/ai/flows/answer-teaching-question";
import { answerStudyingQuestion } from "@/ai/flows/answer-studying-question";
import { generateAssessmentQuestionsAction, suggestAssessmentTagsAction } from "@/ai/flows/generate-assessment-questions";
import { createWeeklyLessonPlanAction, suggestLessonPlanTagsAction } from "@/ai/flows/create-weekly-lesson-plan";
import { suggestFollowUpContent } from "@/ai/flows/suggest-follow-up-content";
import { saveToContentLibrary } from "@/ai/flows/save-to-content-library";
import { saveAssessment } from "@/ai/flows/save-assessment";
import { saveStudentAssessment } from "@/ai/flows/save-student-assessment";
import { getNextAdaptiveQuestion } from "@/ai/flows/get-next-adaptive-question";
import type { SaveToContentLibraryInput } from "@/ai/schemas/save-to-content-library-schemas";
import type { SaveAssessmentInput } from "@/ai/schemas/save-assessment-schemas";
import type { SaveStudentAssessmentInput } from "@/ai/schemas/save-student-assessment-schemas";


export {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
  generateHomeworkAction,
  suggestHomeworkTagsAction,
  createWeeklyLessonPlanAction,
  suggestLessonPlanTagsAction,
  generateAssessmentQuestionsAction,
  suggestAssessmentTagsAction,
  getNextAdaptiveQuestion as getNextAdaptiveQuestionAction,
};

export const answerTeachingQuestionAction = answerTeachingQuestion;
export const answerStudyingQuestionAction = answerStudyingQuestion;

export const suggestFollowUpContentAction = suggestFollowUpContent;

export async function saveToContentLibraryAction(input: SaveToContentLibraryInput, userId: string) {
    return saveToContentLibrary(input, userId);
}

export async function saveAssessmentAction(input: SaveAssessmentInput, userId: string) {
    return saveAssessment(input, userId);
}

export async function saveStudentAssessmentAction(input: SaveStudentAssessmentInput) {
    return saveStudentAssessment(input);
}
