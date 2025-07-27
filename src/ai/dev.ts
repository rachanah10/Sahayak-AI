
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-localized-content.ts';
import '@/ai/flows/generate-assessment-questions.ts';
import '@/ai/flows/answer-teaching-question.ts';
import '@/ai/flows/answer-studying-question.ts';
import '@/ai/flows/generate-homework.ts';
import '@/ai/flows/suggest-follow-up-content.ts';
import '@/ai/flows/create-weekly-lesson-plan.ts';
import '@/ai/flows/save-to-content-library.ts';
import '@/ai/flows/save-assessment.ts';
import '@/ai/schemas/save-assessment-schemas.ts';
import '@/ai/schemas/save-to-content-library-schemas.ts';

