
'use server';
/**
 * @fileOverview A Genkit flow to fetch calendar events.
 *
 * - getCalendarEvents - A function to retrieve calendar events for a user.
 * - GetCalendarEventsInput - The input type for the getCalendarEvents function.
 * - GetCalendarEventsOutput - The return type for the getCalendarEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EventSchema = z.object({
  summary: z.string().describe('The title or summary of the event.'),
  start: z.string().describe('The start date/time of the event in ISO format.'),
  end: z.string().describe('The end date/time of the event in ISO format.'),
});

const GetCalendarEventsInputSchema = z.object({
  userId: z.string().optional().describe('The ID of the user for whom to fetch events. Used to simulate fetching for an authenticated user.'),
  oauthToken: z.string().optional().describe('The OAuth token for accessing the calendar API. Not used in the current mock implementation.'),
});
export type GetCalendarEventsInput = z.infer<typeof GetCalendarEventsInputSchema>;

const GetCalendarEventsOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    events: z.array(EventSchema).describe("A list of calendar events."),
  }),
  z.object({
    status: z.literal("requires_authentication"),
    message: z.string().describe("A message indicating that authentication is required."),
  }),
  z.object({
    status: z.literal("error"),
    errorMessage: z.string().describe("A message describing the error that occurred."),
  }),
]);
export type GetCalendarEventsOutput = z.infer<typeof GetCalendarEventsOutputSchema>;


// Placeholder tool - this will be replaced with actual Google Calendar API calls
const getCalendarEventsTool = ai.defineTool(
  {
    name: 'getCalendarEventsTool',
    description: 'Fetches calendar events for a user. Simulates API interaction.',
    inputSchema: GetCalendarEventsInputSchema,
    outputSchema: GetCalendarEventsOutputSchema,
  },
  async (input) => {
    // Simulate needing authentication if no userId is explicitly provided (is undefined)
    if (input.userId === undefined) {
      console.log('Calendar Tool: userId is undefined, returning requires_authentication.');
      return {
        status: "requires_authentication",
        message: "User not authenticated. Please connect your Google Calendar.",
      };
    }

    // If userId is present (even if an empty string, though not expected for a real UID),
    // treat it as an attempt to fetch for an authenticated user.
    console.log(`Calendar Tool: Simulating event fetch for userId: '${input.userId}' (UID length: ${input.userId?.length}).`);
    return {
      status: "success",
      events: [
        { summary: `Project Meeting for ${input.userId ? 'User ' + input.userId.substring(0,5) : 'Unknown User'}`, start: new Date(Date.now() + 1*60*60*1000).toISOString(), end: new Date(Date.now() + 1.5*60*60*1000).toISOString() },
        { summary: "Client Demo - Axiom Corp", start: new Date(Date.now() + 3*60*60*1000).toISOString(), end: new Date(Date.now() + 4*60*60*1000).toISOString() },
        { summary: "R&D Strategy Session", start: new Date(Date.now() + 1*24*60*60*1000 + 2*60*60*1000).toISOString(), end: new Date(Date.now() + 1*24*60*60*1000 + 2.75*60*60*1000).toISOString() },
        { summary: "LifeOS Sync", start: new Date(Date.now() + 2*24*60*60*1000 + 4*60*60*1000).toISOString(), end: new Date(Date.now() + 2*24*60*60*1000 + 5*60*60*1000).toISOString() },
      ],
    };
  }
);

const calendarEventsPrompt = ai.definePrompt({
  name: 'calendarEventsPrompt',
  input: {schema: GetCalendarEventsInputSchema},
  output: {schema: GetCalendarEventsOutputSchema},
  tools: [getCalendarEventsTool],
  prompt: `Fetch calendar events for the user using the getCalendarEventsTool.
  User ID (if available): {{{userId}}}.
  OAuth Token (if available): {{{oauthToken}}}.
  
  The tool will return the events directly or an authentication/error status.
  Your primary role is to ensure the tool is called and its output is returned.
  Do not attempt to create events yourself.
  If the tool indicates authentication is required, ensure the output reflects that.
  If the tool returns an error, ensure the output reflects that.
  If the tool returns events, pass them through.
  `,
});

const calendarEventsFlow = ai.defineFlow(
  {
    name: 'calendarEventsFlow',
    inputSchema: GetCalendarEventsInputSchema,
    outputSchema: GetCalendarEventsOutputSchema,
  },
  async (input) => {
    try {
      // Directly call the tool
      const toolOutput = await getCalendarEventsTool(input);
      return toolOutput;
    } catch (error: any) {
      console.error("Error in calendarEventsFlow:", error);
      return {
        status: "error",
        errorMessage: error.message || "An unexpected error occurred in the flow.",
      };
    }
  }
);

export async function getCalendarEvents(input: GetCalendarEventsInput): Promise<GetCalendarEventsOutput> {
  return calendarEventsFlow(input);
}
