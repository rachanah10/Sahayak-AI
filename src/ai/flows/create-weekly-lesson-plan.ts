
'use server';

/**
 * @fileOverview A weekly lesson plan creation AI agent.
 *
 * - createWeeklyLessonPlan - A function that handles the weekly lesson plan creation process.
 * - suggestLessonPlanTags - A function that suggests relevant tags for the lesson plan.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for Tag Suggestion
const SuggestLessonPlanTagsInputSchema = z.object({
  syllabus: z.string(),
  grades: z.array(z.string()),
  dateRange: z.object({
      from: z.string(),
      to: z.string(),
  }),
});
export type SuggestLessonPlanTagsInput = z.infer<typeof SuggestLessonPlanTagsInputSchema>;

// Output Schema for Tag Suggestion
const SuggestLessonPlanTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of suggested tags to improve the lesson plan generation.'),
});
export type SuggestLessonPlanTagsOutput = z.infer<typeof SuggestLessonPlanTagsOutputSchema>;


// Main Input Schema for Lesson Plan Generation
const CreateWeeklyLessonPlanInputSchema = z.object({
  grades: z.array(z.string()).describe('The grade levels for the lesson plan.'),
  dateRange: z.object({
      from: z.string().describe("The start date for the plan."),
      to: z.string().describe("The end date for the plan."),
  }).describe("The date range for the lesson plan."),
  syllabus: z.string().describe('The syllabus or topics to be covered during the week.'),
  tags: z.array(z.string()).optional().describe("Optional tags to provide more context."),
});
export type CreateWeeklyLessonPlanInput = z.infer<typeof CreateWeeklyLessonPlanInputSchema>;

// Main Output Schema for Lesson Plan Generation
const CreateWeeklyLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('A detailed weekly lesson plan, structured day-by-day and grade-by-grade in Markdown format.'),
});
export type CreateWeeklyLessonPlanOutput = z.infer<typeof CreateWeeklyLessonPlanOutputSchema>;


// Exported actions for the frontend
export async function createWeeklyLessonPlanAction(input: CreateWeeklyLessonPlanInput): Promise<CreateWeeklyLessonPlanOutput> {
  return createWeeklyLessonPlanFlow(input);
}

export async function suggestLessonPlanTagsAction(input: SuggestLessonPlanTagsInput): Promise<SuggestLessonPlanTagsOutput> {
    return suggestLessonPlanTagsFlow(input);
}

const safetySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ];

// Prompt for Tag Suggestions
const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestLessonPlanTagsPrompt',
  input: { schema: SuggestLessonPlanTagsInputSchema },
  output: { schema: SuggestLessonPlanTagsOutputSchema },
  prompt: `You are a Smart Content Assistant for teachers creating a lesson plan. Based on the user's input, generate a list of 5-10 useful tags.
  Tag categories should include: "Lesson Objective", "Key Concepts", and "Potential Topics to Deep Dive On".

  User's Input:
  - Grades: {{#each grades}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Date Range: {{{dateRange.from}}} to {{{dateRange.to}}}
  - Syllabus: {{{syllabus}}}
  
  Generate a list of relevant tags. For example:
  - "Lesson Objective: Understand the water cycle"
  - "Key Concepts: Evaporation, Condensation, Precipitation"
  - "Deep Dive: The role of the sun in the water cycle"
  `,
  config: {
    safetySettings,
  }
});

// Flow for Tag Suggestions
const suggestLessonPlanTagsFlow = ai.defineFlow(
  {
    name: 'suggestLessonPlanTagsFlow',
    inputSchema: SuggestLessonPlanTagsInputSchema,
    outputSchema: SuggestLessonPlanTagsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTagsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate tags. The prompt may have been blocked by safety settings.');
    }
    return output;
  }
);


// Prompt for Lesson Plan Generation
const createWeeklyLessonPlanPrompt = ai.definePrompt({
  name: 'createWeeklyLessonPlanPrompt',
  input: {schema: CreateWeeklyLessonPlanInputSchema},
  output: {schema: CreateWeeklyLessonPlanOutputSchema},
  prompt: `You are an expert teacher specializing in creating detailed and actionable lesson plans.

  Generate a lesson plan based on the following details. The plan should cover the period from {{{dateRange.from}}} to {{{dateRange.to}}}.

  - Grade Levels: {{#each grades}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Syllabus/Topics: {{{syllabus}}}
  {{#if tags}}- Additional Context Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

  Instructions:
  1.  Create a day-by-day breakdown for the specified date range. Use Markdown '##' for the day's heading (e.g., "## 2024-08-05: Introduction to Photosynthesis").
  2.  For each day, create a sub-section for each selected grade level. Use Markdown '###' for the grade heading (e.g., "### 5th Grade").
  3.  Under each grade's sub-section, provide a clear topic, a list of activities, and a small assessment or check for understanding.
  4.  The content should be appropriate for the specified grade levels.
  5.  Format the entire output as a single Markdown string.
  6.  Ensure the plan is realistic and covers the syllabus topics effectively within the given timeframe.
`,
  config: {
    safetySettings,
  }
});

// Flow for Lesson Plan Generation
const createWeeklyLessonPlanFlow = ai.defineFlow(
  {
    name: 'createWeeklyLessonPlanFlow',
    inputSchema: CreateWeeklyLessonPlanInputSchema,
    outputSchema: CreateWeeklyLessonPlanOutputSchema,
  },
  async input => {
    const {output} = await createWeeklyLessonPlanPrompt(input);
    if (!output?.lessonPlan) {
      throw new Error('Failed to generate lesson plan. The prompt may have been blocked by safety settings.');
    }
    return { lessonPlan: output.lessonPlan };
  }
);
