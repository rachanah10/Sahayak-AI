
'use server';
/**
 * @fileOverview An AI agent to answer teaching-related questions with history and TTS.
 *
 * - answerTeachingQuestion - A function that answers a teaching question.
 * - AnswerTeachingQuestionInput - The input type for the answerTeachingQuestion function.
 * - AnswerTeachingQuestionOutput - The return type for the answerTeachingQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

// Define a schema for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

// Update the input schema to include chat history and optional context
const AnswerTeachingQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s current teaching-related question.'),
  history: z.array(MessageSchema).optional().describe('The history of the conversation.'),
  context: z.string().optional().describe('Optional context from an uploaded document or library item.'),
});
export type AnswerTeachingQuestionInput = z.infer<typeof AnswerTeachingQuestionInputSchema>;

// Update the output schema to include the audio data URI
const AnswerTeachingQuestionOutputSchema = z.object({
  answer: z.string().describe('The text answer to the teaching-related question.'),
  audioDataUri: z.string().optional().describe('The generated audio for the answer, as a data URI.'),
});
export type AnswerTeachingQuestionOutput = z.infer<typeof AnswerTeachingQuestionOutputSchema>;

// The main exported function that the frontend will call.
export async function answerTeachingQuestion(input: AnswerTeachingQuestionInput): Promise<AnswerTeachingQuestionOutput> {
  return answerTeachingQuestionFlow(input);
}


// Define the main prompt for generating the text answer
const answerPrompt = ai.definePrompt({
  name: 'answerTeachingQuestionPrompt',
  input: { schema: AnswerTeachingQuestionInputSchema },
  output: { schema: z.object({ answer: z.string() }) },
  prompt: `You are a helpful and friendly teaching assistant. Your name is Sahayak.
Continue the conversation with the user and answer their question based on the chat history and any provided context. Keep your answers clear and concise.

{{#if context}}
Use the following context to help answer the user's question:
---
{{{context}}}
---
{{/if}}

{{#if history}}
Chat History:
{{#each history}}
{{#if (this.role == 'user')}}User: {{this.content}}{{/if}}
{{#if (this.role == 'model')}}Assistant: {{this.content}}{{/if}}
{{/each}}
{{/if}}

Current Question: {{{question}}}
`,
});

// Helper function to convert PCM audio buffer to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}


// The main flow that orchestrates text generation and TTS
const answerTeachingQuestionFlow = ai.defineFlow(
  {
    name: 'answerTeachingQuestionFlow',
    inputSchema: AnswerTeachingQuestionInputSchema,
    outputSchema: AnswerTeachingQuestionOutputSchema,
  },
  async (input) => {
    // 1. Generate the text answer from the LLM.
    const { output: answerOutput } = await answerPrompt(input);
    const answerText = answerOutput?.answer;

    if (!answerText) {
      throw new Error('Failed to generate a text answer.');
    }

    // 2. Generate the audio from the text answer using a TTS model.
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: answerText,
    });
    
    if (!media) {
       console.warn('TTS generation failed, returning text answer only.');
       return { answer: answerText };
    }

    // 3. Convert the raw PCM audio data to a WAV data URI.
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    const audioDataUri = 'data:audio/wav;base64,' + wavBase64;

    return {
      answer: answerText,
      audioDataUri,
    };
  }
);
