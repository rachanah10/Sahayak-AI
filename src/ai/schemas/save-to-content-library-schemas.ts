
import { z } from 'zod';

export const SaveToContentLibraryInputSchema = z.object({
  prompt: z.string().describe("The original prompt for the content."),
  grade: z.string().describe("The grade level for the content."),
  language: z.string().describe("The language of the content."),
  story: z.string().describe("The generated (and possibly edited) story text."),
  imageUrl: z.string().optional().describe("The data URI of the generated image."),
});
export type SaveToContentLibraryInput = z.infer<typeof SaveToContentLibraryInputSchema>;
