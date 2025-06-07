'use server';

/**
 * @fileOverview Provides intelligent suggestions to the user based on their data.
 *
 * - suggest - A function that generates intelligent suggestions for the user.
 * - SuggestInput - The input type for the suggest function.
 * - SuggestOutput - The return type for the suggest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInputSchema = z.object({
  expiringIngredients: z.array(z.string()).describe('A list of ingredients that are about to expire.'),
  historicalContacts: z
    .array(z.string())
    .describe('A list of names of people the user has historically contacted.'),
  userPreferences: z.string().describe('A summary of user preferences and goals.'),
});
export type SuggestInput = z.infer<typeof SuggestInputSchema>;

const SuggestOutputSchema = z.object({
  recipeSuggestion: z.string().describe('A recipe suggestion based on expiring ingredients.'),
  contactSuggestion: z
    .string()
    .describe('A suggestion of who to contact and why, based on historical contact data.'),
});
export type SuggestOutput = z.infer<typeof SuggestOutputSchema>;

export async function suggest(input: SuggestInput): Promise<SuggestOutput> {
  return suggestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPrompt',
  input: {schema: SuggestInputSchema},
  output: {schema: SuggestOutputSchema},
  prompt: `You are a personal assistant providing intelligent suggestions to the user.

  Based on the following information, provide a recipe suggestion using the expiring ingredients and a suggestion of who to contact.

  Expiring Ingredients: {{expiringIngredients}}
  Historical Contacts: {{historicalContacts}}
  User Preferences: {{userPreferences}}

  Recipe Suggestion: A recipe suggestion using the expiring ingredients.
  Contact Suggestion: A suggestion of who to contact and why, based on historical contact data.

  Format your response as a JSON object:
  {
    "recipeSuggestion": "recipe",
    "contactSuggestion": "contact suggestion"
  }`,
});

const suggestFlow = ai.defineFlow(
  {
    name: 'suggestFlow',
    inputSchema: SuggestInputSchema,
    outputSchema: SuggestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
