
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
  getActualCalendarEventsTool 
} from './calendar-events-flow'; 

const ChatInputSchema = z.object({
  prompt: z.string().describe('The user\'s input message or question.'),
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
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  tools: [
    addCalendarEventTool, 
    editCalendarEventTool, 
    deleteCalendarEventTool,
    getActualCalendarEventsTool 
  ],
  system: `You are a helpful AI assistant integrated into a Life OS.
Respond to the user's prompt concisely and helpfully.
You have tools to manage Google Calendar events: add, edit, delete, and get (list/read) events.
If the user asks to perform any of these actions, use the respective tool.
- For adding an event, you'll need at least a summary (title), start time, and end time. Dates and times should be in ISO 8601 format.
- For editing an event, you'll need the event's ID and the details to change.
- For deleting an event, you'll need the event's ID.
- For listing or getting events, you can specify a time range or ask for upcoming events. The tool will fetch them.

If you need to use a calendar tool, and the user's OAuth token is provided in the input, make sure to pass it along to the tool. If the token is not available, you can inform the user that calendar actions require authentication.
Unless specified otherwise by the user, assume any calendar operations (get, add, edit, delete) should apply to the user's 'primary' calendar by setting the 'calendarId' parameter to 'primary' for the tools.
If an action is successful, confirm it. If it fails, or if you cannot perform an action (e.g., a tool is missing for a specific request not covered above), inform the user clearly.
If details are missing for a calendar action, ask the user for them.

CRITICALLY IMPORTANT: Your final textual response to the user MUST ALWAYS be a single string within the 'response' field of a JSON object. For example: { "response": "Your event has been scheduled." } or { "response": "I found 3 events for tomorrow." } or { "response": "I'm sorry, I can't help with that specific request right now." }
Do NOT output any other JSON structure or plain text.
`,
  prompt: `User prompt: {{{prompt}}}
  {{#if oauthToken}}
  (User OAuth token is available for use with tools that require it for calendar actions.)
  {{else}}
  (User OAuth token is NOT available. Calendar actions requiring it may fail or need user to authenticate separately. Inform the user if they try a calendar action.)
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
    const {output} = await chatPrompt(input); 
    
    if (!output || typeof output.response !== 'string') {
      console.error("Chat prompt returned malformed output or missing response field:", output);
      return { response: "I'm sorry, I couldn't generate a valid response structure at this moment. Please try rephrasing your request." };
    }
    return output; 
  }
);

    