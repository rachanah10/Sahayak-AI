
'use server';

/**
 * @fileOverview A flow for generating localized and culturally relevant stories based on a detailed prompt.
 *
 * - generateLocalizedContent - A function that generates localized content.
 * - GenerateLocalizedContentInput - The input type for the generateLocalizedContent function.
 * - GenerateLocalizedContentOutput - The return type for the generateLocalizedContent function.
 * - suggestTagsForContent - A function that suggests tags based on a prompt.
 * - SuggestTagsForContentInput - The input type for the suggestTagsForContent function.
 * - SuggestTagsForContentOutput - The return type for the suggestTagsForContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for the Smart Content Assistant (Tag Suggestion)
const SuggestTagsForContentInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the localized story.'),
  localizationDetails: z.string().describe('Details about the target region, culture, and context for localization.'),
  grade: z.string().describe('The grade level for the content.'),
  language: z.string().describe('The target language for the content.'),
});
export type SuggestTagsForContentInput = z.infer<typeof SuggestTagsForContentInputSchema>;

const SuggestTagsForContentOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of suggested tags or keywords to improve the prompt.'),
});
export type SuggestTagsForContentOutput = z.infer<typeof SuggestTagsForContentOutputSchema>;


// Main Content Generation Schemas
const GenerateLocalizedContentInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the localized story.'),
  localizationDetails: z.string().optional().describe('Details about the target region, culture, and context for localization.'),
  grade: z.string().describe('The grade level for the content.'),
  language: z.string().describe('The target language for the content.'),
  generateImage: z.boolean().describe('Whether to generate a blackboard-friendly image.'),
  generateContent: z.boolean().describe('Whether to generate written content.'),
  tags: z.array(z.string()).optional().describe('Optional list of tags to provide more context.'),
});

export type GenerateLocalizedContentInput = z.infer<typeof GenerateLocalizedContentInputSchema>;

const GenerateLocalizedContentOutputSchema = z.object({
  localizedStory: z.string().optional().describe('The generated localized and culturally relevant story.'),
  diagramDataUri: z.string().optional().describe('A data URI containing the generated diagram image.'),
});

export type GenerateLocalizedContentOutput = z.infer<typeof GenerateLocalizedContentOutputSchema>;


// Flow for suggesting tags
const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: { schema: SuggestTagsForContentInputSchema },
  output: { schema: SuggestTagsForContentOutputSchema },
  prompt: `You are a smart content assistant for teachers. Based on the user's request, generate a list of useful tags or keywords that will help create better educational content.
  Consider the theme, tone, style, and educational goals.

  Here are some examples of tag categories:
  - Story Type: Folk Tale, Fable, Realistic Fiction, Myth, Fantasy, Moral Story
  - Tone / Mood: Uplifting, Funny, Sad, Mysterious, Exciting, Calm
  - Theme: Forgiveness, Courage, Kindness, Greed, Family, Nature
  - Cultural Layer: Local Festival, Village Life, Forest Folklore, Regional Legends
  - Teaching Goal: Empathy, Critical Thinking, Listening Skills, Morals, Language Practice

  User's Request:
  Prompt: {{{prompt}}}
  Localization: {{{localizationDetails}}}
  Grade: {{{grade}}}
  Language: {{{language}}}

  Based on this, generate a list of 5-10 relevant tags.
  `,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsForContentInputSchema,
    outputSchema: SuggestTagsForContentOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTagsPrompt(input);
    return output!;
  }
);


// Main flow for generating content
const generateContentFinalPrompt = ai.definePrompt({
  name: 'generateLocalizedContentFinalPrompt',
  input: { schema: GenerateLocalizedContentInputSchema },
  output: { schema: z.object({ localizedStory: z.string().optional() }) },
  prompt: `You are a story writer specializing in localizing content for specific regions and cultures. Based on the following prompt and details, generate a culturally relevant and engaging story for students.

  Prompt: {{{prompt}}}
  {{#if localizationDetails}}
  Localization Details: {{{localizationDetails}}}
  {{/if}}
  Grade Level: {{{grade}}}
  Target Language: {{{language}}}
  {{#if tags}}
  Additional Context Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}

  Generate the story now. If the target language is not English, please provide the story in {{{language}}}.
  `,
});


const generateLocalizedContentFlow = ai.defineFlow(
  {
    name: 'generateLocalizedContentFlow',
    inputSchema: GenerateLocalizedContentInputSchema,
    outputSchema: GenerateLocalizedContentOutputSchema,
  },
  async (input) => {
    let storyPromise: Promise<string | undefined> = Promise.resolve(undefined);
    let imagePromise: Promise<string | undefined> = Promise.resolve(undefined);

    if (input.generateContent) {
      storyPromise = generateContentFinalPrompt(input).then(response => response.output?.localizedStory);
    }

    if (input.generateImage) {
      const imageGenPrompt = `A simple, blackboard-friendly, hand-drawn style diagram for a story about: "${input.prompt}". Localization focus: ${input.localizationDetails}. Grade: ${input.grade}.`;
      imagePromise = ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: imageGenPrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      }).then(response => response.media?.url);
    }
    
    const [localizedStory, diagramDataUri] = await Promise.all([storyPromise, imagePromise]);
    
    if (!localizedStory && !diagramDataUri) {
        // Return a default message if both failed or were not requested.
        return { localizedStory: "Could not generate content or image. Please try again with a different prompt." };
    }

    return {
      localizedStory,
      diagramDataUri,
    };
  }
);


// Exported actions for the frontend
export async function generateLocalizedContentAction(input: GenerateLocalizedContentInput): Promise<GenerateLocalizedContentOutput> {
  return generateLocalizedContentFlow(input);
}

export async function suggestTagsForContentAction(input: SuggestTagsForContentInput): Promise<SuggestTagsForContentOutput> {
  return suggestTagsFlow(input);
}
