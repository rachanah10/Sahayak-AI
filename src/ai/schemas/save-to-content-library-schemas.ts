
import { z } from 'zod';

export const SaveToContentLibraryInputSchema = z.object({
  prompt: z.string().describe("The original prompt or title for the content."),
  type: z.enum(['Story', 'Homework', 'AnswerKey']).describe("The type of content being saved."),
  content: z.string().describe("The main text content (story, worksheet, or answer key)."),
  grade: z.string().optional().describe("The grade level for the content."),
  language: z.string().optional().describe("The language of the content."),
  imageUrl: z.string().optional().describe("The data URI of a generated image, if applicable."),
});
export type SaveToContentLibraryInput = z.infer<typeof SaveToContentLibraryInputSchema>;
