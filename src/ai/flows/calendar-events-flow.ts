
'use server';
/**
 * @fileOverview A Genkit flow to fetch actual calendar events from Google Calendar.
 *
 * - getCalendarEvents - A function to retrieve calendar events for a user.
 * - GetCalendarEventsInput - The input type for the getCalendarEvents function.
 * - GetCalendarEventsOutput - The return type for the getCalendarEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for individual events, mirroring a simplified Google Calendar event structure
const EventSchema = z.object({
  summary: z.string().describe('The title or summary of the event.'),
  start: z.string().describe('The start date/time of the event in ISO format.'),
  end: z.string().describe('The end date/time of the event in ISO format.'),
});

const GetCalendarEventsInputSchema = z.object({
  userId: z.string().optional().describe('The ID of the user (for logging/context, not directly for API call if token is present).'),
  oauthToken: z.string().optional().describe('The OAuth access token for accessing the Google Calendar API.'),
});
export type GetCalendarEventsInput = z.infer<typeof GetCalendarEventsInputSchema>;

const GetCalendarEventsOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    events: z.array(EventSchema).describe("A list of calendar events."),
  }),
  z.object({
    status: z.literal("requires_authentication"),
    message: z.string().describe("A message indicating that authentication or a valid token is required."),
  }),
  z.object({
    status: z.literal("error"),
    errorMessage: z.string().describe("A message describing the error that occurred during API call or processing."),
  }),
]);
export type GetCalendarEventsOutput = z.infer<typeof GetCalendarEventsOutputSchema>;

// This tool now attempts to fetch real data from Google Calendar API
const getActualCalendarEventsTool = ai.defineTool(
  {
    name: 'getActualCalendarEventsTool',
    description: 'Fetches actual calendar events for a user from Google Calendar API using an OAuth token.',
    inputSchema: GetCalendarEventsInputSchema,
    outputSchema: GetCalendarEventsOutputSchema,
  },
  async (input) => {
    if (!input.oauthToken) {
      console.log('Calendar Tool: OAuth token is missing, returning requires_authentication.');
      return {
        status: "requires_authentication",
        message: "OAuth token not provided. Please authenticate to connect your Google Calendar.",
      };
    }

    try {
      console.log('Calendar Tool: Attempting to fetch events from Google Calendar API with provided token.');
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + (new Date().toISOString()) + '&orderBy=startTime&singleEvents=true&maxResults=10', {
        headers: {
          'Authorization': `Bearer ${input.oauthToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
        console.error('Google Calendar API error:', response.status, errorData);
        if (response.status === 401 || response.status === 403) {
            return {
                status: "requires_authentication",
                message: `Google Calendar API authentication failed (Status: ${response.status}). Token might be invalid or expired. Please re-authenticate. Details: ${errorData.error?.message || JSON.stringify(errorData)}`,
            };
        }
        return {
          status: "error",
          errorMessage: `Google Calendar API request failed with status ${response.status}. Details: ${errorData.error?.message || JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json();
      console.log('Calendar Tool: Successfully fetched events from API.');

      const events = data.items.map((item: any) => ({
        summary: item.summary || "No Title",
        // Ensure start and end times are correctly parsed (dateTime for timed events, date for all-day events)
        start: item.start?.dateTime || item.start?.date, 
        end: item.end?.dateTime || item.end?.date,
      })).filter((event:any) => event.start && event.end); // Ensure events have start/end

      return {
        status: "success",
        events: events,
      };

    } catch (error: any) {
      console.error('Calendar Tool: Exception during API call or processing -', error);
      return {
        status: "error",
        errorMessage: `Failed to process calendar events: ${error.message || "An unexpected error occurred."}`,
      };
    }
  }
);

// This flow directly calls the tool, no LLM prompt needed for this version
const calendarEventsFlow = ai.defineFlow(
  {
    name: 'calendarEventsFlow',
    inputSchema: GetCalendarEventsInputSchema,
    outputSchema: GetCalendarEventsOutputSchema,
  },
  async (input) => {
    // Directly call the tool that attempts the API fetch
    return getActualCalendarEventsTool(input);
  }
);

export async function getCalendarEvents(input: GetCalendarEventsInput): Promise<GetCalendarEventsOutput> {
  return calendarEventsFlow(input);
}
    