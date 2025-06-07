'use server';

/**
 * @fileOverview Mood detection AI agent.
 *
 * - detectMood - A function that handles the mood detection process.
 * - DetectMoodInput - The input type for the detectMood function.
 * - DetectMoodOutput - The return type for the detectMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectMoodInputSchema = z.object({
  sleepData: z
    .string()
    .describe('Sleep data, including duration and quality.'),
  activityData: z
    .string()
    .describe('Activity data, including steps, heart rate, and workouts.'),
  calendarEvents: z
    .string()
    .describe('Calendar events, including meetings and appointments.'),
});
export type DetectMoodInput = z.infer<typeof DetectMoodInputSchema>;

const DetectMoodOutputSchema = z.object({
  mood: z.string().describe('The detected mood of the user.'),
  explanation: z
    .string()
    .describe('Explanation of why the mood was detected.'),
});
export type DetectMoodOutput = z.infer<typeof DetectMoodOutputSchema>;

export async function detectMood(input: DetectMoodInput): Promise<DetectMoodOutput> {
  return detectMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectMoodPrompt',
  input: {schema: DetectMoodInputSchema},
  output: {schema: DetectMoodOutputSchema},
  prompt: `You are an AI assistant specializing in mood detection.

You will analyze the user's sleep data, activity data, and calendar events to determine their current mood.

Provide a mood and an explanation of why that mood was detected.

Sleep Data: {{{sleepData}}}
Activity Data: {{{activityData}}}
Calendar Events: {{{calendarEvents}}}`,
});

const detectMoodFlow = ai.defineFlow(
  {
    name: 'detectMoodFlow',
    inputSchema: DetectMoodInputSchema,
    outputSchema: DetectMoodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
