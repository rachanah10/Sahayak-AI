
'use server';
/**
 * @fileOverview An AI agent to answer studying-related questions for middle schoolers.
 *
 * - answerStudyingQuestion - A function that answers a studying question.
 * - AnswerStudyingQuestionInput - The input type for the answerStudyingQuestion function.
 * - AnswerStudyingQuestionOutput - The return type for the answerStudyingQuestion function.
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
const AnswerStudyingQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s current studying-related question.'),
  history: z.array(MessageSchema).optional().describe('The history of the conversation.'),
  context: z.string().optional().describe('Optional context from an uploaded document or library item.'),
   mediaDataUri: z
    .string()
    .optional()
    .describe(
      "An optional image file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnswerStudyingQuestionInput = z.infer<typeof AnswerStudyingQuestionInputSchema>;

// Update the output schema to include the audio data URI
const AnswerStudyingQuestionOutputSchema = z.object({
  answer: z.string().describe('The text answer to the studying-related question.'),
  audioDataUri: z.string().optional().describe('The generated audio for the answer, as a data URI.'),
});
export type AnswerStudyingQuestionOutput = z.infer<typeof AnswerStudyingQuestionOutputSchema>;

// The main exported function that the frontend will call.
export async function answerStudyingQuestion(input: AnswerStudyingQuestionInput): Promise<AnswerStudyingQuestionOutput> {
  return answerStudyingQuestionFlow(input);
}


// Define the main prompt for generating the text answer
const answerPrompt = ai.definePrompt({
  name: 'answerStudyingQuestionPrompt',
  input: { schema: AnswerStudyingQuestionInputSchema },
  output: { schema: z.object({ answer: z.string() }) },
  prompt: `You are a friendly and encouraging study buddy for a middle school student. Your name is Sahayak.
Your goal is to help the student understand concepts and answer their questions in a clear, simple, and engaging way.
Always maintain a positive and supportive tone. Use examples and analogies that a middle schooler can relate to.

{{#if context}}
Use the following context to help answer the user's question:
---
{{{context}}}
---
{{/if}}

{{#if history}}
Chat History:
{{#each history}}
{{this.role}}: {{this.content}}
{{/each}}
{{/if}}

Current Question: {{{question}}}
{{#if mediaDataUri}}
Analyze this image to help answer the question: {{media url=mediaDataUri}}
{{/if}}
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
const answerStudyingQuestionFlow = ai.defineFlow(
  {
    name: 'answerStudyingQuestionFlow',
    inputSchema: AnswerStudyingQuestionInputSchema,
    outputSchema: AnswerStudyingQuestionOutputSchema,
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
