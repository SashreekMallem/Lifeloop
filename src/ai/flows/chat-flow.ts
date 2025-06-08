
'use server';
/**
 * @fileOverview A Genkit flow for handling chat interactions with an AI,
 * including capabilities to manage Google Calendar events.
 *
 * - chatWithAI - A function that takes user input and returns an AI-generated response.
 * - ChatInput - The input type for the chatWithAI function.
 * - ChatOutput - The return type for the chatWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  addCalendarEventTool, 
  editCalendarEventTool, 
  deleteCalendarEventTool,
  // getActualCalendarEventsTool // For reading events, if AI needs to confirm before acting
} from './calendar-events-flow'; // Import the tools

const ChatInputSchema = z.object({
  prompt: z.string().describe('The user\'s input message or question.'),
  // We might need to pass the oauthToken here if the tools can't access it contextually
  // For now, assuming tools called by LLM can get it from their own input schemas if defined by user later.
  // The calendar tools themselves expect oauthToken in their input.
  // The LLM would need to be prompted to ask for it or it needs to be passed implicitly.
  // This requires a more complex setup; for now, the tools will fail if invoked by LLM without a token.
  // A better approach would be for the chat flow to retrieve the token and pass it to the tools.
  // Let's assume for now the user might say "using my connected calendar, add an event..."
  // The calendar tools themselves will be responsible for getting the token from their direct input.
  // If called by LLM, it has to be part of the `input` the LLM constructs for the tool.
  // This means the LLM needs to know it *can* ask for an oauth token if it's going to call such a tool.
  // Or, the application layer calling chatWithAI needs to provide it.
  // For now, this flow doesn't handle token propagation to tools called by the LLM.
  // The user would have to explicitly give the token in the chat, which is not secure or practical.

  // Revised Strategy: The calendar tools in calendar-events-flow.ts expect `oauthToken` in their input.
  // The AI Console (`ai-console.tsx`) will need to retrieve this token (e.g., from session storage
  // after user signs into CalendarWidget) and pass it to `chatWithAI`.
  // `chatWithAI` will then need to make this token available to the `chatPrompt`
  // so it can be passed to the tools if the LLM decides to use them.

  oauthToken: z.string().optional().describe("User's OAuth token for API calls, if available and relevant for tools."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s input.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithAI(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema}, // Input now includes optional oauthToken
  output: {schema: ChatOutputSchema},
  tools: [
    addCalendarEventTool, 
    editCalendarEventTool, 
    deleteCalendarEventTool,
    // getActualCalendarEventsTool // If AI needs to fetch events to discuss them
  ],
  system: `You are a helpful AI assistant integrated into a Life OS.
Respond to the user's prompt concisely and helpfully.
You have tools to manage Google Calendar events: add, edit, and delete.
If the user asks to perform any of these actions, use the respective tool.
- For adding an event, you'll need at least a summary (title), start time, and end time. Dates and times should be in ISO 8601 format.
- For editing an event, you'll need the event's ID and the details to change.
- For deleting an event, you'll need the event's ID.
If you need to use a calendar tool, and the user's OAuth token is provided in the input, make sure to pass it along to the tool. If the token is not available, you can inform the user that calendar actions require authentication.
If an action is successful, confirm it. If it fails, inform the user.
If details are missing for a calendar action, ask the user for them.
Example for adding: User says "Schedule 'Team Meeting' for tomorrow 2 PM to 3 PM". You should confirm the date for "tomorrow" and then use addCalendarEventTool.
Start and end times for events must include a dateTime (e.g., '2024-07-30T14:00:00-07:00') and optionally a timeZone.
`,
  prompt: `User prompt: {{{prompt}}}
  {{#if oauthToken}}
  (User OAuth token is available for use with tools that require it)
  {{else}}
  (User OAuth token is NOT available. Calendar actions requiring it may fail or need user to authenticate separately)
  {{/if}}
  `,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // The LLM will receive the input, which includes the oauthToken.
    // The prompt guides the LLM to use this token when calling tools.
    // The tools themselves (addCalendarEventTool etc.) are defined to accept oauthToken in their input schema.
    const {output} = await chatPrompt(input); 
    
    if (!output) {
      return { response: "I'm sorry, I couldn't generate a response at this moment." };
    }
    return output;
  }
);
