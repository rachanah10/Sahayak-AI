"use server";

import {
  generateLocalizedContentAction,
  type GenerateLocalizedContentInput,
  suggestTagsForContentAction,
  type SuggestTagsForContentInput,
} from "@/ai/flows/generate-localized-content";
import {
  generateDifferentiatedWorksheets,
  type GenerateDifferentiatedWorksheetsInput,
} from "@/ai/flows/generate-differentiated-worksheets";
import {
  answerTeachingQuestion,
  type AnswerTeachingQuestionInput,
} from "@/ai/flows/answer-teaching-question";
import {
  generateAssessmentQuestions,
  type GenerateAssessmentQuestionsInput,
} from "@/ai/flows/generate-assessment-questions";
import {
  createWeeklyLessonPlan,
  type CreateWeeklyLessonPlanInput,
} from "@/ai/flows/create-weekly-lesson-plan";
import {
  generateVisualAidDiagram,
  type GenerateVisualAidDiagramInput,
} from "@/ai/flows/generate-visual-aid-diagram";
import {
  suggestFollowUpContent,
  type SuggestFollowUpContentInput,
} from "@/ai/flows/suggest-follow-up-content";

export async function generateLocalizedContentAction(
  input: GenerateLocalizedContentInput
) {
  return await generateLocalizedContentAction(input);
}

export async function suggestTagsForContentAction(
  input: SuggestTagsForContentInput
) {
  return await suggestTagsForContentAction(input);
}


export async function generateDifferentiatedWorksheetsAction(
  input: GenerateDifferentiatedWorksheetsInput
) {
  return await generateDifferentiatedWorksheets(input);
}

export async function answerTeachingQuestionAction(
  input: AnswerTeachingQuestionInput
) {
  return await answerTeachingQuestion(input);
}

export async function generateAssessmentQuestionsAction(
  input: GenerateAssessmentQuestionsInput
) {
  return await generateAssessmentQuestions(input);
}

export async function createWeeklyLessonPlanAction(
  input: CreateWeeklyLessonPlanInput
) {
  return await createWeeklyLessonPlan(input);
}

export async function generateVisualAidDiagramAction(
  input: GenerateVisualAidDiagramInput
) {
  return await generateVisualAidDiagram(input);
}

export async function suggestFollowUpContentAction(
  input: SuggestFollowUpContentInput
) {
  return await suggestFollowUpContent(input);
}
