'use server';

/**
 * @fileOverview A weekly lesson plan creation AI agent.
 *
 * - createWeeklyLessonPlan - A function that handles the weekly lesson plan creation process.
 * - CreateWeeklyLessonPlanInput - The input type for the createWeeklyLessonPlan function.
 * - CreateWeeklyLessonPlanOutput - The return type for the createWeeklyLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateWeeklyLessonPlanInputSchema = z.object({
  gradeLevel: z.string().describe('The grade level for the lesson plan.'),
  availableTime: z.string().describe('The available time for the week in hours.'),
  syllabus: z.string().describe('The syllabus or topics to be covered during the week.'),
});
export type CreateWeeklyLessonPlanInput = z.infer<typeof CreateWeeklyLessonPlanInputSchema>;

const CreateWeeklyLessonPlanOutputSchema = z.object({
  weeklyLessonPlan: z.string().describe('A detailed weekly lesson plan.'),
});
export type CreateWeeklyLessonPlanOutput = z.infer<typeof CreateWeeklyLessonPlanOutputSchema>;

export async function createWeeklyLessonPlan(input: CreateWeeklyLessonPlanInput): Promise<CreateWeeklyLessonPlanOutput> {
  return createWeeklyLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createWeeklyLessonPlanPrompt',
  input: {schema: CreateWeeklyLessonPlanInputSchema},
  output: {schema: CreateWeeklyLessonPlanOutputSchema},
  prompt: `You are an expert teacher specializing in creating weekly lesson plans.

You will use the following information to generate a detailed and comprehensive weekly lesson plan.

Grade Level: {{{gradeLevel}}}
Available Time: {{{availableTime}}} hours
Syllabus: {{{syllabus}}}

Consider the grade level, available time, and syllabus to create a realistic and effective weekly lesson plan.
Ensure the plan includes specific topics, activities, and assessments.

Output the weekly lesson plan in a well-structured format.
`, // Ensure Handlebars syntax is correctly used
});

const createWeeklyLessonPlanFlow = ai.defineFlow(
  {
    name: 'createWeeklyLessonPlanFlow',
    inputSchema: CreateWeeklyLessonPlanInputSchema,
    outputSchema: CreateWeeklyLessonPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
