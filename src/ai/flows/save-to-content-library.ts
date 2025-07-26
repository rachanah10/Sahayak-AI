
'use server';

/**
 * @fileOverview A flow for saving generated content to the Firestore content library.
 *
 * - saveToContentLibrary - A function that saves content.
 * - SaveToContentLibraryInput - The input type for the saveToContentLibrary function.
 */

import { z } from 'genkit';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

// Ensure Firebase Admin is initialized
initFirebaseAdmin();

export const SaveToContentLibraryInputSchema = z.object({
  prompt: z.string().describe("The original prompt for the content."),
  grade: z.string().describe("The grade level for the content."),
  language: z.string().describe("The language of the content."),
  story: z.string().describe("The generated (and possibly edited) story text."),
  imageUrl: z.string().optional().describe("The data URI of the generated image."),
});
export type SaveToContentLibraryInput = z.infer<typeof SaveToContentLibraryInputSchema>;

// This function will be called from a Server Action, so it needs to handle auth.
// For this to work, you need a way to get the currently authenticated user's ID on the server.
// We'll assume a mechanism exists to pass the user's UID to this function.
// In a real app, this would come from the server-side session or token.
// For now, we'll modify it to require a `userId` in the input.

const SaveToContentLibraryWithUserSchema = SaveToContentLibraryInputSchema.extend({
    userId: z.string(),
});


export async function saveToContentLibrary(input: SaveToContentLibraryInput, userId: string): Promise<{ id: string }> {
  if (!userId) {
    throw new Error("User must be authenticated to save to the library.");
  }
  
  const db = getFirestore();
  const docRef = await db.collection('content-library').add({
    ...input,
    userId: userId,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}
