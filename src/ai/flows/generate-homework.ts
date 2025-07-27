'use server';

/**
 * @fileOverview Homework generator with multiple input types and smart tag suggestions.
 *
 * - generateHomeworkAction - A function that generates differentiated worksheets.
 * - suggestHomeworkTagsAction - A function that suggests relevant tags for the homework.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for Tag Suggestion
const SuggestHomeworkTagsInputSchema = z.object({
  topic: z.string().optional(),
  grade: z.string(),
  language: z.string(),
  uploadedContent: z.string().optional().describe("Text content extracted from an uploaded file."),
  libraryContent: z.string().optional().describe("Content selected from the user's library."),
});
export type SuggestHomeworkTagsInput = z.infer<typeof SuggestHomeworkTagsInputSchema>;

// Output Schema for Tag Suggestion
const SuggestHomeworkTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of suggested tags to improve the worksheet generation.'),
});
export type SuggestHomeworkTagsOutput = z.infer<typeof SuggestHomeworkTagsOutputSchema>;


// Main Input Schema for Homework Generation
const GenerateHomeworkInputSchema = z.object({
  topic: z.string().optional(),
  grade: z.string(),
  language: z.string(),
  uploadedContent: z
    .string()
    .optional()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  libraryContent: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type GenerateHomeworkInput = z.infer<typeof GenerateHomeworkInputSchema>;

// Main Output Schema for Homework Generation
const GenerateHomeworkOutputSchema = z.object({
  worksheet: z.string().describe('A single string containing three worksheets (Easy, Medium, Hard).'),
  answerKey: z.string().describe('A corresponding answer key with a rubric.'),
});
export type GenerateHomeworkOutput = z.infer<typeof GenerateHomeworkOutputSchema>;


// Exported actions for the frontend
export async function generateHomeworkAction(input: GenerateHomeworkInput): Promise<GenerateHomeworkOutput> {
  return generateHomeworkFlow(input);
}

export async function suggestHomeworkTagsAction(input: SuggestHomeworkTagsInput): Promise<SuggestHomeworkTagsOutput> {
    return suggestHomeworkTagsFlow(input);
}

// Prompt for Tag Suggestions
const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestHomeworkTagsPrompt',
  input: { schema: SuggestHomeworkTagsInputSchema },
  output: { schema: SuggestHomeworkTagsOutputSchema },
  prompt: `You are a Smart Content Assistant for teachers creating homework. Based on the user's input, generate a list of 5-10 useful tags.
  Tag categories should include: "Potential Topics to Deep Dive On", "Worksheet Objective", and "Question Types".

  User's Input:
  - Grade: {{{grade}}}
  - Language: {{{language}}}
  {{#if topic}}- Topic: {{{topic}}}{{/if}}
  {{#if uploadedContent}}- Uploaded Content: {{{uploadedContent}}}{{/if}}
  {{#if libraryContent}}- Library Content: {{{libraryContent}}}{{/if}}

  Generate a list of relevant tags. For example:
  - "Question Type: Bloom's Taxonomy - Analysis"
  - "Worksheet Objective: Reinforce vocabulary"
  - "Deep Dive: The role of mitochondria"
  `,
});

// Flow for Tag Suggestions
const suggestHomeworkTagsFlow = ai.defineFlow(
  {
    name: 'suggestHomeworkTagsFlow',
    inputSchema: SuggestHomeworkTagsInputSchema,
    outputSchema: SuggestHomeworkTagsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTagsPrompt(input);
    return output!;
  }
);


// Prompt for Homework Generation
const generateHomeworkPrompt = ai.definePrompt({
  name: 'generateHomeworkPrompt',
  input: {schema: GenerateHomeworkInputSchema},
  output: {schema: GenerateHomeworkOutputSchema},
  prompt: `You are an expert teacher creating a differentiated homework assignment. Generate a single block of text containing three worksheets (Easy, Medium, Hard) and a separate, detailed answer key with a rubric.

  Assignment Details:
  - Grade: {{{grade}}}
  - Language: {{{language}}}
  {{#if topic}}- Main Topic: {{{topic}}}{{/if}}
  {{#if uploadedContent}}- Base content on this image: {{media url=uploadedContent}}{{/if}}
  {{#if libraryContent}}- Base content on this text: {{{libraryContent}}}{{/if}}
  {{#if tags}}- Additional Context Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

  ---
  PART 1: WORKSHEET
  Generate the full worksheet content now. Structure it with clear headings for each section.
  
  ### Easy Worksheet
  (Simple, straightforward questions for students needing support.)

  ### Medium Worksheet
  (Grade-level questions that are more challenging than the easy ones.)

  ### Hard Worksheet
  (Challenging questions requiring critical thinking for advanced students.)

  ---
  PART 2: ANSWER KEY
  Generate the full answer key now. Provide clear answers for all questions from all three worksheets. Include a simple, clear rubric for grading the entire assignment.
  
  ### Answer Key & Rubric

  `,
});

// Flow for Homework Generation
const generateHomeworkFlow = ai.defineFlow(
  {
    name: 'generateHomeworkFlow',
    inputSchema: GenerateHomeworkInputSchema,
    outputSchema: GenerateHomeworkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
