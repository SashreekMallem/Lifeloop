
'use server';
/**
 * @fileOverview Genkit flows and tools for interacting with Google Calendar.
 * Includes reading events, and adding, editing, or deleting events.
 *
 * - getCalendarEvents - Retrieves calendar events.
 * - addCalendarEvent - Adds a new calendar event.
 * - editCalendarEvent - Edits an existing calendar event.
 * - deleteCalendarEvent - Deletes a calendar event.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Common Schemas
const EventDateTimeSchema = z.object({
  dateTime: z.string().datetime().describe("The start or end date/time of the event in ISO 8601 format (e.g., '2024-07-30T10:00:00-07:00')."),
  timeZone: z.string().optional().describe("The time zone of the date/time (e.g., 'America/Los_Angeles'). If not provided, the calendar's default time zone will be used."),
});

const BaseEventInputSchema = z.object({
  oauthToken: z.string().describe('The OAuth access token for Google Calendar API.'),
  calendarId: z.string().default('primary').describe("The ID of the calendar. 'primary' for the user's main calendar."),
});

const EventSchema = z.object({
  id: z.string().optional().describe("The ID of the event."),
  summary: z.string().describe('The title or summary of the event.'),
  description: z.string().optional().describe("A description of the event."),
  start: EventDateTimeSchema.describe("The start date/time of the event."),
  end: EventDateTimeSchema.describe("The end date/time of the event."),
  location: z.string().optional().describe("The location of the event."),
  // Add attendees, recurrence, etc. as needed later
});

// Output Schema for most actions
const CalendarActionStatusSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    eventId: z.string().optional().describe("The ID of the event that was actioned upon (e.g., created or modified)."),
    message: z.string().optional().describe("A success message."),
  }),
  z.object({
    status: z.literal("requires_authentication"),
    message: z.string().describe("Message indicating authentication or a valid token is required."),
  }),
  z.object({
    status: z.literal("error"),
    errorMessage: z.string().describe("Message describing the error."),
  }),
]);
export type CalendarActionStatus = z.infer<typeof CalendarActionStatusSchema>;


// 1. Get Calendar Events
// ========================
const GetCalendarEventsInputSchema = BaseEventInputSchema.extend({
   userId: z.string().optional().describe('The ID of the user (for logging/context).'), // Retained for potential logging
   timeMin: z.string().datetime().optional().describe("The minimum start time for events to filter by (ISO 8601 format). Defaults to now if not provided."),
   maxResults: z.number().optional().default(10).describe("Maximum number of events to return."),
});
export type GetCalendarEventsInput = z.infer<typeof GetCalendarEventsInputSchema>;

const GetCalendarEventsOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    events: z.array(EventSchema).describe("A list of calendar events."),
  }),
  z.object({
    status: z.literal("requires_authentication"),
    message: z.string().describe("Message indicating authentication or valid token is required."),
  }),
  z.object({
    status: z.literal("error"),
    errorMessage: z.string().describe("Message describing the error."),
  }),
]);
export type GetCalendarEventsOutput = z.infer<typeof GetCalendarEventsOutputSchema>;

const getActualCalendarEventsTool = ai.defineTool(
  {
    name: 'getActualCalendarEventsTool',
    description: 'Fetches actual calendar events for a user from Google Calendar API using an OAuth token.',
    inputSchema: GetCalendarEventsInputSchema,
    outputSchema: GetCalendarEventsOutputSchema,
  },
  async (input) => {
    if (!input.oauthToken) {
      return {
        status: "requires_authentication",
        message: "OAuth token not provided. Please authenticate to connect your Google Calendar.",
      };
    }
    try {
      const timeMin = input.timeMin || new Date().toISOString();
      const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${input.calendarId}/events?timeMin=${encodeURIComponent(timeMin)}&orderBy=startTime&singleEvents=true&maxResults=${input.maxResults}`;
      
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${input.oauthToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
        if (response.status === 401 || response.status === 403) {
            return {
                status: "requires_authentication",
                message: `Google Calendar API authentication failed (Status: ${response.status}). Token might be invalid or expired. Please re-authenticate. Details: ${errorData.error?.message || JSON.stringify(errorData)}`,
            };
        }
        return {
          status: "error",
          errorMessage: `Google Calendar API request failed (Status ${response.status}). Details: ${errorData.error?.message || JSON.stringify(errorData)}`,
        };
      }
      const data = await response.json();
      const events = (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || "No Title",
        description: item.description,
        start: { dateTime: item.start?.dateTime || item.start?.date, timeZone: item.start?.timeZone },
        end: { dateTime: item.end?.dateTime || item.end?.date, timeZone: item.end?.timeZone },
        location: item.location,
      })).filter((event:any) => event.start?.dateTime && event.end?.dateTime);
      return { status: "success", events: events };
    } catch (error: any) {
      return { status: "error", errorMessage: `Failed to process calendar events: ${error.message || "Unexpected error."}` };
    }
  }
);

const getCalendarEventsFlow = ai.defineFlow(
  { name: 'getCalendarEventsFlow', inputSchema: GetCalendarEventsInputSchema, outputSchema: GetCalendarEventsOutputSchema },
  async (input) => getActualCalendarEventsTool(input)
);
export async function getCalendarEvents(input: GetCalendarEventsInput): Promise<GetCalendarEventsOutput> {
  return getCalendarEventsFlow(input);
}


// 2. Add Calendar Event
// =======================
const AddCalendarEventInputSchema = BaseEventInputSchema.extend({
  summary: z.string().describe("The title of the event."),
  description: z.string().optional().describe("A description for the event."),
  start: EventDateTimeSchema.describe("The start date/time object for the event."),
  end: EventDateTimeSchema.describe("The end date/time object for the event."),
  location: z.string().optional().describe("The location of the event."),
  // attendees: z.array(z.object({ email: z.string().email() })).optional().describe("List of attendees with their emails."),
});
export type AddCalendarEventInput = z.infer<typeof AddCalendarEventInputSchema>;

export const addCalendarEventTool = ai.defineTool(
  {
    name: 'addCalendarEventTool',
    description: 'Adds a new event to the Google Calendar.',
    inputSchema: AddCalendarEventInputSchema,
    outputSchema: CalendarActionStatusSchema,
  },
  async (input) => {
    if (!input.oauthToken) {
      return { status: "requires_authentication", message: "OAuth token not provided." };
    }
    try {
      const { oauthToken, calendarId, ...eventData } = input;
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      const responseData = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return { status: "requires_authentication", message: `API Auth Error (Status ${response.status}): ${responseData.error?.message}` };
        return { status: "error", errorMessage: `API Error (Status ${response.status}): ${responseData.error?.message || JSON.stringify(responseData)}` };
      }
      return { status: "success", eventId: responseData.id, message: "Event created successfully." };
    } catch (error: any) {
      return { status: "error", errorMessage: `Failed to add event: ${error.message}` };
    }
  }
);
const addCalendarEventFlow = ai.defineFlow(
  { name: 'addCalendarEventFlow', inputSchema: AddCalendarEventInputSchema, outputSchema: CalendarActionStatusSchema },
  async (input) => addCalendarEventTool(input)
);
export async function addCalendarEvent(input: AddCalendarEventInput): Promise<CalendarActionStatus> {
  return addCalendarEventFlow(input);
}


// 3. Edit Calendar Event
// ========================
const EditCalendarEventInputSchema = BaseEventInputSchema.extend({
  eventId: z.string().describe("The ID of the event to edit."),
  summary: z.string().optional().describe("The new title of the event."),
  description: z.string().optional().describe("The new description for the event."),
  start: EventDateTimeSchema.optional().describe("The new start date/time object."),
  end: EventDateTimeSchema.optional().describe("The new end date/time object."),
  location: z.string().optional().describe("The new location of the event."),
});
export type EditCalendarEventInput = z.infer<typeof EditCalendarEventInputSchema>;

export const editCalendarEventTool = ai.defineTool(
  {
    name: 'editCalendarEventTool',
    description: 'Edits an existing event in the Google Calendar.',
    inputSchema: EditCalendarEventInputSchema,
    outputSchema: CalendarActionStatusSchema,
  },
  async (input) => {
    if (!input.oauthToken) {
      return { status: "requires_authentication", message: "OAuth token not provided." };
    }
    try {
      const { oauthToken, calendarId, eventId, ...eventData } = input;
      if (Object.keys(eventData).length === 0) {
        return { status: "error", errorMessage: "No properties provided to update for the event." };
      }
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      const responseData = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return { status: "requires_authentication", message: `API Auth Error (Status ${response.status}): ${responseData.error?.message}` };
        return { status: "error", errorMessage: `API Error (Status ${response.status}): ${responseData.error?.message || JSON.stringify(responseData)}` };
      }
      return { status: "success", eventId: responseData.id, message: "Event updated successfully." };
    } catch (error: any) {
      return { status: "error", errorMessage: `Failed to edit event: ${error.message}` };
    }
  }
);
const editCalendarEventFlow = ai.defineFlow(
  { name: 'editCalendarEventFlow', inputSchema: EditCalendarEventInputSchema, outputSchema: CalendarActionStatusSchema },
  async (input) => editCalendarEventTool(input)
);
export async function editCalendarEvent(input: EditCalendarEventInput): Promise<CalendarActionStatus> {
  return editCalendarEventFlow(input);
}

// 4. Delete Calendar Event
// ==========================
const DeleteCalendarEventInputSchema = BaseEventInputSchema.extend({
  eventId: z.string().describe("The ID of the event to delete."),
});
export type DeleteCalendarEventInput = z.infer<typeof DeleteCalendarEventInputSchema>;

export const deleteCalendarEventTool = ai.defineTool(
  {
    name: 'deleteCalendarEventTool',
    description: 'Deletes an event from the Google Calendar.',
    inputSchema: DeleteCalendarEventInputSchema,
    outputSchema: CalendarActionStatusSchema, // Output can be just success/failure
  },
  async (input) => {
    if (!input.oauthToken) {
      return { status: "requires_authentication", message: "OAuth token not provided." };
    }
    try {
      const { oauthToken, calendarId, eventId } = input;
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${oauthToken}` },
      });
      if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) return { status: "requires_authentication", message: `API Auth Error (Status ${response.status}): ${errorData.error?.message}` };
        return { status: "error", errorMessage: `API Error (Status ${response.status}): ${errorData.error?.message || 'Failed to delete event'}` };
      }
      return { status: "success", message: "Event deleted successfully." };
    } catch (error: any) {
      return { status: "error", errorMessage: `Failed to delete event: ${error.message}` };
    }
  }
);
const deleteCalendarEventFlow = ai.defineFlow(
  { name: 'deleteCalendarEventFlow', inputSchema: DeleteCalendarEventInputSchema, outputSchema: CalendarActionStatusSchema },
  async (input) => deleteCalendarEventTool(input)
);
export async function deleteCalendarEvent(input: DeleteCalendarEventInput): Promise<CalendarActionStatus> {
  return deleteCalendarEventFlow(input);
}
