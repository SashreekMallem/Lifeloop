'use server';

/**
 * @fileOverview This file defines a Genkit flow for curating entertainment suggestions
 * based on the user's mood and available time slots.
 *
 * - `curateEntertainment` - A function that takes mood and time slot information and returns entertainment suggestions.
 * - `CurateEntertainmentInput` - The input type for the `curateEntertainment` function.
 * - `CurateEntertainmentOutput` - The return type for the `curateEntertainment` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CurateEntertainmentInputSchema = z.object({
  mood: z.string().describe('The current mood of the user (e.g., happy, sad, stressed).'),
  availableTime: z.string().describe('The available time slot in minutes for entertainment (e.g., 30, 60, 90).'),
});
export type CurateEntertainmentInput = z.infer<typeof CurateEntertainmentInputSchema>;

const CurateEntertainmentOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      platform: z.enum(['Spotify', 'Netflix', 'YouTube']).describe('The entertainment platform.'),
      type: z.string().describe('The type of entertainment (e.g., music, movie, video).'),
      title: z.string().describe('The title of the suggested entertainment.'),
      description: z.string().describe('A brief description of the suggested entertainment.'),
      link: z.string().url().describe('A link to the entertainment content.'),
    })
  ).describe('A list of entertainment suggestions based on the user input.'),
});
export type CurateEntertainmentOutput = z.infer<typeof CurateEntertainmentOutputSchema>;

export async function curateEntertainment(input: CurateEntertainmentInput): Promise<CurateEntertainmentOutput> {
  return curateEntertainmentFlow(input);
}

const curateEntertainmentPrompt = ai.definePrompt({
  name: 'curateEntertainmentPrompt',
  input: {schema: CurateEntertainmentInputSchema},
  output: {schema: CurateEntertainmentOutputSchema},
  prompt: `You are an entertainment expert who provides suggestions based on mood and available time.

  Given the user's current mood: {{{mood}}} and the available time: {{{availableTime}}} minutes,
  suggest entertainment options from Spotify, Netflix, and YouTube that would be suitable.
  Provide a variety of options, considering different types of entertainment (music, movies, videos).
  Ensure each suggestion includes the platform, type, title, description, and a direct link.

  Format your response as a JSON array of suggestions.
  `,
});

const curateEntertainmentFlow = ai.defineFlow(
  {
    name: 'curateEntertainmentFlow',
    inputSchema: CurateEntertainmentInputSchema,
    outputSchema: CurateEntertainmentOutputSchema,
  },
  async input => {
    const {output} = await curateEntertainmentPrompt(input);
    return output!;
  }
);
