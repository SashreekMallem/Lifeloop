'use server';
/**
 * @fileOverview Generates a personalized morning summary for the user.
 *
 * - generateMorningSummary - A function that generates the morning summary.
 * - MorningSummaryInput - The input type for the generateMorningSummary function.
 * - MorningSummaryOutput - The return type for the generateMorningSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MorningSummaryInputSchema = z.object({
  calendarEvents: z.string().describe('A summary of the user\'s calendar events for the day.'),
  healthData: z.string().describe('A summary of the user\'s health data, including sleep, activity, and heart rate.'),
  otherAppData: z.string().describe('A summary of other relevant app data for the day.'),
});
export type MorningSummaryInput = z.infer<typeof MorningSummaryInputSchema>;

const MorningSummaryOutputSchema = z.object({
  summary: z.string().describe('A personalized morning summary for the user.'),
});
export type MorningSummaryOutput = z.infer<typeof MorningSummaryOutputSchema>;

export async function generateMorningSummary(input: MorningSummaryInput): Promise<MorningSummaryOutput> {
  return generateMorningSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'morningSummaryPrompt',
  input: {schema: MorningSummaryInputSchema},
  output: {schema: MorningSummaryOutputSchema},
  prompt: `You are a personal assistant that generates a personalized morning summary for the user.

  Here is the user's calendar events for the day: {{{calendarEvents}}}

  Here is the user's health data for the day: {{{healthData}}}

  Here is the user's other relevant app data for the day: {{{otherAppData}}}

  Generate a personalized morning summary for the user that includes key information from their connected apps to help them quickly understand their day ahead and any important insights.
  The summary should be concise and easy to read.
  `,
});

const generateMorningSummaryFlow = ai.defineFlow(
  {
    name: 'generateMorningSummaryFlow',
    inputSchema: MorningSummaryInputSchema,
    outputSchema: MorningSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
