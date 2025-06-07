// Goal Replanning

'use server';
/**
 * @fileOverview Goal replanning AI agent.
 *
 * - goalReplan - A function that handles the goal replanning process.
 * - GoalReplanInput - The input type for the goalReplan function.
 * - GoalReplanOutput - The return type for the goalReplan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoalReplanInputSchema = z.object({
  userSchedule: z
    .string()
    .describe('The user schedule, including tasks and meetings.'),
  productivityData: z
    .string()
    .describe('The user productivity data, including task completion rates and time spent on tasks.'),
  userGoals: z.string().describe('The user goals.'),
});
export type GoalReplanInput = z.infer<typeof GoalReplanInputSchema>;

const GoalReplanOutputSchema = z.object({
  reassignedTasks: z
    .string()
    .describe('The reassigned tasks, including new deadlines and priorities.'),
  adjustedGoals: z.string().describe('The adjusted goals, including new targets and milestones.'),
});
export type GoalReplanOutput = z.infer<typeof GoalReplanOutputSchema>;

export async function goalReplan(input: GoalReplanInput): Promise<GoalReplanOutput> {
  return goalReplanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'goalReplanPrompt',
  input: {schema: GoalReplanInputSchema},
  output: {schema: GoalReplanOutputSchema},
  prompt: `You are an AI-powered personal assistant that automatically reassigns tasks and adjusts user goals based on productivity patterns.

You will use this information to reassign tasks and adjust goals to optimize the user's schedule and help them achieve their objectives more efficiently.

User Schedule: {{{userSchedule}}}
Productivity Data: {{{productivityData}}}
User Goals: {{{userGoals}}}`,
});

const goalReplanFlow = ai.defineFlow(
  {
    name: 'goalReplanFlow',
    inputSchema: GoalReplanInputSchema,
    outputSchema: GoalReplanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
