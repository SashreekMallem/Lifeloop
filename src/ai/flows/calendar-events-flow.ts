
'use server';
/**
 * @fileOverview Genkit flows and tools for interacting with Google Calendar.
 * Includes reading events, and adding, editing, or deleting events.
 *
 * - getCalendarEvents - Retrieves calendar events.
 * - addCalendarEvent - Adds a new calendar event.
 * - editCalendarEvent - Edits an existing calendar event.
 * - deleteCalendarEvent - Deletes a calendar event.
 * - getActualCalendarEventsTool - Tool to fetch events (for AI use).
 * - addCalendarEventTool - Tool to add events (for AI use).
 * - editCalendarEventTool - Tool to edit events (for AI use).
 * - deleteCalendarEventTool - Tool to delete events (for AI use).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Common Schemas
const EventDateTimeSchema = z.object({
  dateTime: z.string().datetime().describe("The start or end date/time of the event in ISO 8601 format (e.g., '2024-07-30T10:00:00-07:00' or '2024-07-30' for all-day events)."),
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
export type CalendarEvent = z.infer<typeof EventSchema>;


// Output Schema for most actions
const CalendarActionStatusSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    eventId: z.string().optional().describe("The ID of the event that was actioned upon (e.g., created or modified)."),
    message: z.string().optional().describe("A success message."),
    // Include the full event if it was created or modified and is available
    event: EventSchema.optional().describe("The event object after creation or modification, if applicable."),
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
   userId: z.string().optional().describe('The ID of the user (for logging/context).'),
   timeMin: z.string().datetime().optional().describe("The minimum start time for events to filter by (ISO 8601 format). Defaults to now if not provided."),
   maxResults: z.number().int().min(1).optional().default(10).describe("Maximum number of events to return."),
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

export const getActualCalendarEventsTool = ai.defineTool(
  {
    name: 'getActualCalendarEventsTool',
    description: 'Fetches actual calendar events for a user from Google Calendar API using an OAuth token.',
    inputSchema: GetCalendarEventsInputSchema,
    outputSchema: GetCalendarEventsOutputSchema,
  },
  async (input) => {
    console.log("[getActualCalendarEventsTool] Tool called with input:", JSON.stringify(input));
    if (!input.oauthToken) {
      console.warn("[getActualCalendarEventsTool] OAuth token not provided.");
      return {
        status: "requires_authentication",
        message: "OAuth token not provided. Please authenticate to connect your Google Calendar.",
      };
    }
    try {
      const calendarIdToUse = (input.calendarId && input.calendarId.trim() !== '') ? input.calendarId.trim() : 'primary';
      const timeMin = input.timeMin || new Date().toISOString();
      const finalMaxResults = (typeof input.maxResults === 'number' && !isNaN(input.maxResults) && input.maxResults > 0)
                                ? input.maxResults
                                : 10;

      const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarIdToUse}/events?timeMin=${encodeURIComponent(timeMin)}&orderBy=startTime&singleEvents=true&maxResults=${finalMaxResults}`;
      console.log("[getActualCalendarEventsTool] Requesting URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${input.oauthToken}` },
      });
      console.log(`[getActualCalendarEventsTool] API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown API error, response not JSON." }));
        console.error("[getActualCalendarEventsTool] API request failed. Error data:", JSON.stringify(errorData));
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
      console.log("[getActualCalendarEventsTool] API Response Data (raw):", JSON.stringify(data));
      const items = data.items || [];
      const mappedEvents = items.map((item: any) => {
        let startValue: string | undefined = undefined;
        let endValue: string | undefined = undefined;

        if (item.start) {
          if (typeof item.start.dateTime === 'string' && item.start.dateTime.length > 0) {
            startValue = item.start.dateTime;
          } else if (typeof item.start.date === 'string' && item.start.date.length > 0) {
            startValue = item.start.date; // For all-day events
          }
        }

        if (item.end) {
          if (typeof item.end.dateTime === 'string' && item.end.dateTime.length > 0) {
            endValue = item.end.dateTime;
          } else if (typeof item.end.date === 'string' && item.end.date.length > 0) {
            endValue = item.end.date;
          }
        }
        
        if (!startValue || !endValue) {
            console.warn('[getActualCalendarEventsTool] Filtered out event due to missing/invalid start/end date/dateTime:', {id: item.id, summary: item.summary, start: item.start, end: item.end });
            return null; 
        }

        return {
            id: item.id,
            summary: item.summary || "No Title",
            description: item.description,
            start: { dateTime: startValue, timeZone: item.start?.timeZone },
            end: { dateTime: endValue, timeZone: item.end?.timeZone },
            location: item.location,
        };
      });

      const events = mappedEvents.filter((event): event is CalendarEvent => event !== null);
      console.log("[getActualCalendarEventsTool] Mapped and filtered events:", JSON.stringify(events));
      return { status: "success", events };

    } catch (error: any) {
      console.error("[getActualCalendarEventsTool] Error processing calendar events:", error);
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
  start: EventDateTimeSchema.describe("The start date/time object for the event. For all-day events, dateTime should be 'YYYY-MM-DD' and no timeZone is needed."),
  end: EventDateTimeSchema.describe("The end date/time object for the event. For all-day events, dateTime should be 'YYYY-MM-DD' (exclusive end for GCal API, so often one day after start for a single all-day event)."),
  location: z.string().optional().describe("The location of the event."),
});
export type AddCalendarEventInput = z.infer<typeof AddCalendarEventInputSchema>;

export const addCalendarEventTool = ai.defineTool(
  {
    name: 'addCalendarEventTool',
    description: 'Adds a new event to the Google Calendar. Requires summary, start, and end. Start and end times should be in ISO 8601 format (e.g., "2024-07-30T10:00:00-07:00") or "YYYY-MM-DD" for all-day events.',
    inputSchema: AddCalendarEventInputSchema,
    outputSchema: CalendarActionStatusSchema,
  },
  async (input) => {
    console.log("[addCalendarEventTool] Tool called with input:", JSON.stringify(input));
    if (!input.oauthToken) {
      console.warn("[addCalendarEventTool] OAuth token not provided.");
      return { status: "requires_authentication", message: "OAuth token not provided." };
    }
    try {
      const { oauthToken, calendarId: rawCalendarId, ...eventData } = input;
      const calendarIdToUse = (rawCalendarId && rawCalendarId.trim() !== '') ? rawCalendarId.trim() : 'primary';
      
      const googleEvent: any = {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
      };

      if (eventData.start.dateTime.length === 10 && eventData.start.dateTime.match(/^\d{4}-\d{2}-\d{2}$/)) { // YYYY-MM-DD
        googleEvent.start = { date: eventData.start.dateTime };
      } else {
        googleEvent.start = { dateTime: eventData.start.dateTime, timeZone: eventData.start.timeZone };
      }
      
      if (eventData.end.dateTime.length === 10 && eventData.end.dateTime.match(/^\d{4}-\d{2}-\d{2}$/)) { // YYYY-MM-DD
        googleEvent.end = { date: eventData.end.dateTime };
      } else {
        googleEvent.end = { dateTime: eventData.end.dateTime, timeZone: eventData.end.timeZone };
      }
      console.log("[addCalendarEventTool] Requesting with calendarId:", calendarIdToUse, "and event body:", JSON.stringify(googleEvent));
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarIdToUse}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      });
      const responseData = await response.json().catch(() => ({}));
      console.log(`[addCalendarEventTool] API Response Status: ${response.status}`, JSON.stringify(responseData));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return { status: "requires_authentication", message: `API Auth Error (Status ${response.status}): ${responseData.error?.message}` };
        return { status: "error", errorMessage: `API Error (Status ${response.status}): ${responseData.error?.message || JSON.stringify(responseData)}` };
      }

      const createdEvent: CalendarEvent = {
        id: responseData.id,
        summary: responseData.summary || "No Title",
        description: responseData.description,
        start: {dateTime: responseData.start?.dateTime || responseData.start?.date, timeZone: responseData.start?.timeZone},
        end: {dateTime: responseData.end?.dateTime || responseData.end?.date, timeZone: responseData.end?.timeZone},
        location: responseData.location
      };

      return { status: "success", eventId: responseData.id, message: "Event created successfully.", event: createdEvent };
    } catch (error: any) {
      console.error("[addCalendarEventTool] Error:", error);
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
  start: EventDateTimeSchema.optional().describe("The new start date/time object. For all-day events, dateTime should be 'YYYY-MM-DD'."),
  end: EventDateTimeSchema.optional().describe("The new end date/time object. For all-day events, dateTime should be 'YYYY-MM-DD'."),
  location: z.string().optional().describe("The new location of the event."),
});
export type EditCalendarEventInput = z.infer<typeof EditCalendarEventInputSchema>;

export const editCalendarEventTool = ai.defineTool(
  {
    name: 'editCalendarEventTool',
    description: 'Edits an existing event in the Google Calendar. Requires eventId and at least one field to update. Dates/times should be ISO 8601 or YYYY-MM-DD.',
    inputSchema: EditCalendarEventInputSchema,
    outputSchema: CalendarActionStatusSchema,
  },
  async (input) => {
    console.log("[editCalendarEventTool] Tool called with input:", JSON.stringify(input));
    if (!input.oauthToken) {
      console.warn("[editCalendarEventTool] OAuth token not provided.");
      return { status: "requires_authentication", message: "OAuth token not provided." };
    }
    try {
      const { oauthToken, calendarId: rawCalendarId, eventId, ...updates } = input;
      const calendarIdToUse = (rawCalendarId && rawCalendarId.trim() !== '') ? rawCalendarId.trim() : 'primary';

      if (Object.keys(updates).length === 0) {
        return { status: "error", errorMessage: "No properties provided to update for the event." };
      }

      const googleUpdates: any = {};
      if (updates.summary !== undefined) googleUpdates.summary = updates.summary;
      if (updates.description !== undefined) googleUpdates.description = updates.description;
      if (updates.location !== undefined) googleUpdates.location = updates.location;
      
      if (updates.start) {
        if (updates.start.dateTime.length === 10 && updates.start.dateTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
          googleUpdates.start = { date: updates.start.dateTime };
        } else {
          googleUpdates.start = { dateTime: updates.start.dateTime, timeZone: updates.start.timeZone };
        }
      }
      if (updates.end) {
         if (updates.end.dateTime.length === 10 && updates.end.dateTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
          googleUpdates.end = { date: updates.end.dateTime };
        } else {
          googleUpdates.end = { dateTime: updates.end.dateTime, timeZone: updates.end.timeZone };
        }
      }
      console.log("[editCalendarEventTool] Requesting with calendarId:", calendarIdToUse, "eventId:", eventId, "and updates:", JSON.stringify(googleUpdates));
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarIdToUse}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleUpdates),
      });
      const responseData = await response.json().catch(() => ({}));
      console.log(`[editCalendarEventTool] API Response Status: ${response.status}`, JSON.stringify(responseData));
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return { status: "requires_authentication", message: `API Auth Error (Status ${response.status}): ${responseData.error?.message}` };
        return { status: "error", errorMessage: `API Error (Status ${response.status}): ${responseData.error?.message || JSON.stringify(responseData)}` };
      }
      
      const updatedEvent: CalendarEvent = {
        id: responseData.id,
        summary: responseData.summary || "No Title",
        description: responseData.description,
        start: {dateTime: responseData.start?.dateTime || responseData.start?.date, timeZone: responseData.start?.timeZone},
        end: {dateTime: responseData.end?.dateTime || responseData.end?.date, timeZone: responseData.end?.timeZone},
        location: responseData.location
      };
      return { status: "success", eventId: responseData.id, message: "Event updated successfully.", event: updatedEvent };
    } catch (error: any) {
      console.error("[editCalendarEventTool] Error:", error);
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
    description: 'Deletes an event from the Google Calendar. Requires eventId.',
    inputSchema: DeleteCalendarEventInputSchema,
    outputSchema: CalendarActionStatusSchema, 
  },
  async (input) => {
    console.log("[deleteCalendarEventTool] Tool called with input:", JSON.stringify(input));
    if (!input.oauthToken) {
      console.warn("[deleteCalendarEventTool] OAuth token not provided.");
      return { status: "requires_authentication", message: "OAuth token not provided." };
    }
    try {
      const { oauthToken, calendarId: rawCalendarId, eventId } = input;
      const calendarIdToUse = (rawCalendarId && rawCalendarId.trim() !== '') ? rawCalendarId.trim() : 'primary';
      console.log("[deleteCalendarEventTool] Requesting with calendarId:", calendarIdToUse, "eventId:", eventId);

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarIdToUse}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${oauthToken}` },
      });
      console.log(`[deleteCalendarEventTool] API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
        const errorData = await response.json().catch(() => ({}));
        console.error("[deleteCalendarEventTool] API Error data:", JSON.stringify(errorData));
        if (response.status === 401 || response.status === 403) return { status: "requires_authentication", message: `API Auth Error (Status ${response.status}): ${errorData.error?.message}` };
        return { status: "error", errorMessage: `API Error (Status ${response.status}): ${errorData.error?.message || 'Failed to delete event'}` };
      }
      return { status: "success", eventId: eventId, message: "Event deleted successfully." };
    } catch (error: any) {
      console.error("[deleteCalendarEventTool] Error:", error);
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
