
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
  console.log('--- CHAT FLOW (chatWithAI function) START --- Input:', JSON.stringify(input));
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

- For adding an event, you'll need at least a summary (title), start time, and end time. Dates and times should be in ISO 8601 format (e.g., "2024-07-30T10:00:00-07:00") or "YYYY-MM-DD" for all-day events.
- For editing an event, you'll need the event's ID and the details to change.
- For deleting an event, you'll need the event's ID.

- For listing or getting events (using getActualCalendarEventsTool):
    - **CRUCIAL**: If the user asks for their schedule generally (e.g., "my schedule?", "what's on my calendar?", "show my events", "what do I have today?", "my events for today"), you are calling the tool to get events from *now* onwards. To achieve this, when you construct the input for \`getActualCalendarEventsTool\`, you MUST **COMPLETELY OMIT** the \`timeMin\` field. The tool will automatically use the current time if \`timeMin\` is not present. DO NOT pass \`timeMin: null\`, \`timeMin: ""\`, \`timeMin: {}\`, or any other placeholder. The \`timeMin\` key itself should be ABSENT from the JSON input to the tool.
    - The same applies to \`maxResults\`: if the user doesn't specify a limit, **COMPLETELY OMIT** the \`maxResults\` field. It defaults to 10.
    - You MUST always pass the \`oauthToken\` (if available in the input to this chatFlow) and \`calendarId\` (defaulting to 'primary') to the tool.
    - If the user provides a specific date or time range for when to list events that is NOT in a valid ISO 8601 format (e.g., "June 8th 2025", "next Tuesday at 2pm", "events for tomorrow morning"), you MUST politely ask them to provide the relevant date/time in a standard ISO 8601 format (e.g., "YYYY-MM-DDTHH:MM:SSZ" for a specific time, or "YYYY-MM-DD" to see events starting on that day). For example, say: "To look up events for that date, could you please provide it in YYYY-MM-DD format? Or for a specific time, YYYY-MM-DDTHH:MM:SSZ format might be needed." Do NOT try to convert it yourself or pass an invalid format to the tool.
    - If the user *does* provide a valid ISO 8601 date/time string for filtering, pass it as the 'timeMin' parameter to the tool.
    - OMIT 'userId' as the tool does not require it and it is part of the overall flow input already.
    - The *only* fields you should provide to \`getActualCalendarEventsTool\` are \`oauthToken\`, \`calendarId\`, and optionally \`timeMin\` and/or \`maxResults\` if appropriate. DO NOT pass any other fields like \`userId\` or empty objects for optional fields.
    - Example of calling \`getActualCalendarEventsTool\` for a general query (assuming \`oauthToken\` is "USER_TOKEN"):
      \`{ "oauthToken": "USER_TOKEN", "calendarId": "primary" }\` (Notice \`timeMin\` and \`maxResults\` are ABSENT)
    - Example of calling \`getActualCalendarEventsTool\` for a specific date (assuming \`oauthToken\` is "USER_TOKEN" and user provided "2024-08-15T00:00:00Z"):
      \`{ "oauthToken": "USER_TOKEN", "calendarId": "primary", "timeMin": "2024-08-15T00:00:00Z" }\`


If you need to use a calendar tool, and the user's OAuth token is provided in the input, make sure to pass it along to the tool.
If an OAuth token is NOT available OR if a tool reports an authentication failure (e.g., an invalid or expired token), clearly inform the user that they need to connect or re-authenticate their Google Calendar. This can usually be done via the 'Chrono-Stream // Calendar' widget on the dashboard. Do not attempt to use the tool again in the same turn if authentication failed.
Unless specified otherwise by the user, assume any calendar operations (get, add, edit, delete) should apply to the user's 'primary' calendar by setting the 'calendarId' parameter to 'primary' for the tools.
If an action is successful (e.g. event created, events listed), confirm it. If it fails for reasons other than authentication, or if you cannot perform an action, inform the user clearly.
If details are missing for a calendar action (e.g. time for a new event), ask the user for them.

CRITICALLY IMPORTANT: Your final textual response to the user MUST ALWAYS be a single string within the 'response' field of a JSON object. For example: { "response": "Your event has been scheduled." } or { "response": "I found 3 events for tomorrow." } or { "response": "To access your calendar, please connect or re-authenticate in the Calendar widget on your dashboard." }
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
    console.log("--- CHAT FLOW (chatFlow Genkit function) START --- Input:", JSON.stringify(input));
    try {
      console.log("[chatFlow] Calling chatPrompt with input:", JSON.stringify(input));
      const {output} = await chatPrompt(input); 
      
      console.log("[chatFlow] Received raw output from chatPrompt:", JSON.stringify(output));
      
      if (!output || typeof output.response !== 'string') {
        console.error("[chatFlow] Chat prompt returned malformed output or missing response field. Output was:", JSON.stringify(output));
        return { response: "I'm sorry, I couldn't generate a valid response structure at this moment. Please try rephrasing your request." };
      }
      console.log("[chatFlow] Successfully processed chatPrompt. Returning response:", output.response);
      return { response: output.response }; 

    } catch (error: any) {
      console.error("[chatFlow] Error during chatPrompt execution. Full error object:", error);
      const errorMessage = error.message || error.toString() || "Unknown error";
      console.error("[chatFlow] Extracted error message:", errorMessage);

      if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("too many requests") || errorMessage.toLowerCase().includes("quota")) {
        console.warn("[chatFlow] Detected rate limit error.");
        return { response: "I'm currently experiencing high demand and have hit my request limit. Please try again in a moment." };
      }
      if (errorMessage.toLowerCase().includes("schema validation failed")) {
         console.warn("[chatFlow] Detected schema validation error. This might be due to incorrect tool input from the LLM.");
         return { response: "I encountered an issue with the data format while trying to process your request. Could you try rephrasing or providing the information differently?"};
      }
      console.error("[chatFlow] Returning generic error response due to unhandled error.");
      return { response: "An unexpected error occurred while processing your request. Please try again." };
    }
  }
);

