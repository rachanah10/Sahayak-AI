
"use server";

import {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
} from "@/ai/flows/generate-localized-content";

import { generateHomework } from "@/ai/flows/generate-homework";
import { answerTeachingQuestion } from "@/ai/flows/answer-teaching-question";
import { generateAssessmentQuestions } from "@/ai/flows/generate-assessment-questions";
import { createWeeklyLessonPlan } from "@/ai/flows/create-weekly-lesson-plan";
import { generateVisualAidDiagram } from "@/ai/flows/generate-visual-aid-diagram";
import { suggestFollowUpContent } from "@/ai/flows/suggest-follow-up-content";
import { saveToContentLibrary } from "@/ai/flows/save-to-content-library";

// Re-exporting the functions to be used as server actions
// This is the correct pattern for "use server" files.

export {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
};

export const generateHomeworkAction = generateHomework;
export const answerTeachingQuestionAction = answerTeachingQuestion;
export const generateAssessmentQuestionsAction = generateAssessmentQuestions;
export const createWeeklyLessonPlanAction = createWeeklyLessonPlan;
export const generateVisualAidDiagramAction = generateVisualAidDiagram;
export const suggestFollowUpContentAction = suggestFollowUpContent;
export const saveToContentLibraryAction = saveToContentLibrary;
