import { z } from 'zod';

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is missing or empty. Please check your .env context.'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is missing or empty. Please check your .env context.'),
});

export const env = envSchema.parse({
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});
