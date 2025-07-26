"use server";

export {
  generateLocalizedContentAction,
  type GenerateLocalizedContentInput,
  suggestTagsForContentAction,
  type SuggestTagsForContentInput,
} from "@/ai/flows/generate-localized-content";

export {
  generateDifferentiatedWorksheets as generateDifferentiatedWorksheetsAction,
  type GenerateDifferentiatedWorksheetsInput,
} from "@/ai/flows/generate-differentiated-worksheets";

export {
  answerTeachingQuestion as answerTeachingQuestionAction,
  type AnswerTeachingQuestionInput,
} from "@/ai/flows/answer-teaching-question";

export {
  generateAssessmentQuestions as generateAssessmentQuestionsAction,
  type GenerateAssessmentQuestionsInput,
} from "@/ai/flows/generate-assessment-questions";

export {
  createWeeklyLessonPlan as createWeeklyLessonPlanAction,
  type CreateWeeklyLessonPlanInput,
} from "@/ai/flows/create-weekly-lesson-plan";

export {
  generateVisualAidDiagram as generateVisualAidDiagramAction,
  type GenerateVisualAidDiagramInput,
} from "@/ai/flows/generate-visual-aid-diagram";

export {
  suggestFollowUpContent as suggestFollowUpContentAction,
  type SuggestFollowUpContentInput,
} from "@/ai/flows/suggest-follow-up-content";