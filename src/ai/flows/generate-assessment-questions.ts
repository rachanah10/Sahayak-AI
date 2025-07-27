
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
  numQuestions: z.number().default(5).describe('The number of assessment questions to generate.'),
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

const GenerateAssessmentQuestionsOutputSchema = z.object({
  testContent: z.string().describe("The generated test content with questions."),
  answerKey: z.string().describe("The generated answer key for the teacher."),
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
  prompt: `You are an expert teacher specializing in creating comprehensive and grade-appropriate assessments. Generate a test and a corresponding answer key based on the following details.

  {{#if subject}}Subject: {{{subject}}}{{/if}}
  {{#if topic}}Topic/Chapter: {{{topic}}}{{/if}}
  Grade: {{{grade}}}
  Number of Questions: {{{numQuestions}}}
  Type of Questions: {{{questionType}}}
  {{#if timer}}Time Limit: {{{timer}}} minutes{{/if}}
  {{#if uploadedContent}}- Base content on this image: {{media url=uploadedContent}}{{/if}}
  {{#if libraryContent}}- Base content on this text: {{{libraryContent}}}{{/if}}
  {{#if tags}}- Additional Context Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

Instructions for the Test:
- Create a clear and well-structured test.
- The questions should be diverse if 'Mix' is chosen, otherwise stick to the specified question type.
- Ensure the difficulty is appropriate for the specified grade level.
- Format the test cleanly.

Instructions for the Answer Key:
- Create a separate, clear, and accurate answer key for all the questions in the test.
- Label it clearly as "Answer Key".

Generate the test content and the answer key as two separate outputs.
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
