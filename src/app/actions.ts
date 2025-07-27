
"use server";

import {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
} from "@/ai/flows/generate-localized-content";

import { generateHomework } from "@/ai/flows/generate-homework";
import { answerTeachingQuestion } from "@/ai/flows/answer-teaching-question";
import { generateAssessmentQuestions } from "@/ai/flows/generate-assessment-questions";
import { createWeeklyLessonPlan } from "@/ai/flows/create-weekly-lesson-plan";
import { suggestFollowUpContent } from "@/ai/flows/suggest-follow-up-content";
import { saveToContentLibrary } from "@/ai/flows/save-to-content-library";
import { saveAssessment } from "@/ai/flows/save-assessment";


export {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
};

export const generateHomeworkAction = generateHomework;
export const answerTeachingQuestionAction = answerTeachingQuestion;
export const generateAssessmentQuestionsAction = generateAssessmentQuestions;
export const createWeeklyLessonPlanAction = createWeeklyLessonPlan;
export const suggestFollowUpContentAction = suggestFollowUpContent;
export const saveToContentLibraryAction = saveToContentLibrary;
export const saveAssessmentAction = saveAssessment;
