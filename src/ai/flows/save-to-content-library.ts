
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
  const docRef = await db.collection('content-library').add({
    ...input,
    userId: userId,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}
