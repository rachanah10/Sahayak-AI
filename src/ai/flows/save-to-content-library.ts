
'use server';

/**
 * @fileOverview A flow for saving generated content to the Firestore content library.
 *
 * - saveToContentLibrary - A function that saves content.
 */

import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import type { SaveToContentLibraryInput } from "@/ai/schemas/save-to-content-library-schemas";


export async function saveToContentLibrary(input: SaveToContentLibraryInput, userId: string): Promise<{ id: string }> {
  if (!userId) {
    throw new Error("User must be authenticated to save to the library.");
  }
  
  // Ensure Firebase Admin is initialized
  initAdmin();
  const db = getFirestore();

  const docData: any = {
    ...input,
    userId: userId,
    createdAt: new Date(),
  };

  // The 'prompt' field will be used as the title.
  // For answer keys, we prepend "Answer Key: " to the original prompt.
  if (input.type === 'AnswerKey') {
    docData.prompt = `Answer Key: ${input.prompt}`;
    docData.content = input.content;
  } else {
    // For Story and Homework, content is stored in specific fields
    if (input.type === 'Story') {
        docData.story = input.content;
        docData.imageUrl = input.imageUrl;
    } else if (input.type === 'Homework') {
        docData.worksheet = input.content;
    }
  }


  const docRef = await db.collection('content-library').add(docData);

  return { id: docRef.id };
}
