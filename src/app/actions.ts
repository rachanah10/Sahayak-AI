
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


export {
  generateLocalizedContentAction,
  suggestTagsForContentAction,
  generateHomeworkAction,
  suggestHomeworkTagsAction,
  createWeeklyLessonPlanAction,
  suggestLessonPlanTagsAction,
  generateAssessmentQuestionsAction,
  suggestAssessmentTagsAction
};

export const answerTeachingQuestionAction = answerTeachingQuestion;
export const answerStudyingQuestionAction = answerStudyingQuestion;

export const suggestFollowUpContentAction = suggestFollowUpContent;

export const saveToContentLibraryAction = saveToContentLibrary;
export const saveAssessmentAction = saveAssessment;

