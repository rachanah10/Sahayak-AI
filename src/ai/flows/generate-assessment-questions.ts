
'use server';

/**
 * @fileOverview Assessment question generator AI agent.
 *
 * - generateAssessmentQuestionsAction - A function that generates assessment questions based on the topic or lesson plan.
 * - suggestAssessmentTagsAction - A function that suggests relevant tags for the assessment.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for Tag Suggestion
const SuggestAssessmentTagsInputSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  grade: z.string(),
  uploadedContent: z.string().optional().describe("Text content extracted from an uploaded file."),
  libraryContent: z.string().optional().describe("Content selected from the user's library."),
});
export type SuggestAssessmentTagsInput = z.infer<typeof SuggestAssessmentTagsInputSchema>;

// Output Schema for Tag Suggestion
const SuggestAssessmentTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of suggested tags to improve the assessment generation.'),
});
export type SuggestAssessmentTagsOutput = z.infer<typeof SuggestAssessmentTagsOutputSchema>;


// Main Input Schema for Assessment Generation
const GenerateAssessmentQuestionsInputSchema = z.object({
  subject: z.string().optional().describe('The subject for the assessment (e.g., Math, Science).'),
  topic: z.string().optional().describe('The topic or chapter for which assessment questions are to be generated.'),
  grade: z.string().describe('The grade level for the students.'),
  numQuestions: z.number().default(10).describe('The total number of assessment questions to generate.'),
  questionType: z.enum(['Multiple Choice', 'Fill in the Blanks', 'Short Answer', 'Mix']).default('Mix').describe('The type of assessment questions to generate.'),
  timer: z.number().optional().describe('The time limit for the test in minutes.'),
  deadline: z.string().optional().describe('The deadline for the test.'),
  uploadedContent: z
    .string()
    .optional()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  libraryContent: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type GenerateAssessmentQuestionsInput = z.infer<typeof GenerateAssessmentQuestionsInputSchema>;

// New schemas for structured questions
const QuestionSchema = z.object({
    no: z.string().describe("Question number, e.g., '1'"),
    text: z.string().describe("The text of the question."),
    answer: z.string().describe("The correct answer to the question."),
    difficulty: z.number().min(1).max(5).describe("Difficulty rating from 1 (easiest) to 5 (hardest)."),
    tags: z.array(z.string()).describe("Relevant tags for the question."),
});
export type Question = z.infer<typeof QuestionSchema>;

const GenerateAssessmentQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe("A list of generated assessment questions."),
  testTitle: z.string().describe("A suitable title for the test, e.g. 'Science Test: The Solar System'"),
});

export type GenerateAssessmentQuestionsOutput = z.infer<typeof GenerateAssessmentQuestionsOutputSchema>;


// Exported actions for the frontend
export async function generateAssessmentQuestionsAction(input: GenerateAssessmentQuestionsInput): Promise<GenerateAssessmentQuestionsOutput> {
  return generateAssessmentQuestionsFlow(input);
}

export async function suggestAssessmentTagsAction(input: SuggestAssessmentTagsInput): Promise<SuggestAssessmentTagsOutput> {
    return suggestAssessmentTagsFlow(input);
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
  name: 'suggestAssessmentTagsPrompt',
  input: { schema: SuggestAssessmentTagsInputSchema },
  output: { schema: SuggestAssessmentTagsOutputSchema },
  prompt: `You are a Smart Content Assistant for teachers creating an assessment. Based on the user's input, generate a list of 5-10 useful tags.
  Tag categories should include: "Key Concepts", "Difficulty Level", and "Cognitive Skill".

  User's Input:
  - Grade: {{{grade}}}
  {{#if subject}}- Subject: {{{subject}}}{{/if}}
  {{#if topic}}- Topic: {{{topic}}}{{/if}}
  {{#if uploadedContent}}- Uploaded Content: {{{uploadedContent}}}{{/if}}
  {{#if libraryContent}}- Library Content: {{{libraryContent}}}{{/if}}

  Generate a list of relevant tags. For example:
  - "Key Concepts: Photosynthesis, Chlorophyll"
  - "Difficulty Level: Beginner"
  - "Cognitive Skill: Recall, Application"
  `,
  config: {
    safetySettings,
  }
});

// Flow for Tag Suggestions
const suggestAssessmentTagsFlow = ai.defineFlow(
  {
    name: 'suggestAssessmentTagsFlow',
    inputSchema: SuggestAssessmentTagsInputSchema,
    outputSchema: SuggestAssessmentTagsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTagsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate tags. The prompt may have been blocked by safety settings.');
    }
    return output;
  }
);


const prompt = ai.definePrompt({
  name: 'generateAssessmentQuestionsPrompt',
  input: {
    schema: GenerateAssessmentQuestionsInputSchema,
  },
  output: {
    schema: GenerateAssessmentQuestionsOutputSchema,
  },
  prompt: `You are an expert teacher creating grade-appropriate assessment questions. Generate a set of questions with varying difficulty levels from 1 (easiest) to 5 (hardest) based on the following details.

  Subject: {{subject}}
  Topic/Chapter: {{topic}}
  Grade: {{grade}}
  Total Number of Questions: {{numQuestions}}
  Type of Questions: {{questionType}}
  {{#if uploadedContent}}Base content on this image: {{media url=uploadedContent}}{{/if}}
  {{#if libraryContent}}Base content on this text: {{{libraryContent}}}{{/if}}
  {{#if tags}}Additional Context Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

  Instructions:
  1. Generate exactly {{numQuestions}} questions in total.
  2. For each question, provide all the fields specified in the output schema.
  3. The 'difficulty' field must be a number between 1 and 5. Ensure there is a good mix of difficulties unless the tags suggest otherwise.
  4. Ensure the question text, answer, and tags are relevant and accurate for the grade level.
  5. The 'no' field should be a string representing the question number (e.g., "1", "2", ...).
  6. Generate a suitable title for the test based on the subject and topic.
`,
  config: {
    safetySettings,
  }
});

const generateAssessmentQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAssessmentQuestionsFlow',
    inputSchema: GenerateAssessmentQuestionsInputSchema,
    outputSchema: GenerateAssessmentQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate assessment. The prompt may have been blocked by safety settings.');
    }
    return output;
  }
);
