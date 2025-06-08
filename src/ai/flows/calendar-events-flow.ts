
'use server';
/**
 * @fileOverview Genkit flows for interacting with Google Calendar.
 * This file uses 'use server' and exports async Server Actions.
 * It imports tools and Zod schemas from 'src/ai/tools/calendar-tools.ts'.
 *
 * - getCalendarEvents - Retrieves calendar events.
 * - addCalendarEvent - Adds a new calendar event.
 * - editCalendarEvent - Edits an existing calendar event.
 * - deleteCalendarEvent - Deletes a calendar event.
 *
 * (Type exports for client-side usage)
 * - CalendarEvent (type)
 * - CalendarActionStatus (type)
 * - GetCalendarEventsInput (type)
 * - GetCalendarEventsOutput (type)
 * - AddCalendarEventInput (type)
 * - EditCalendarEventInput (type)
 * - DeleteCalendarEventInput (type)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  GetCalendarEventsInputSchema,
  GetCalendarEventsOutputSchema,
  AddCalendarEventInputSchema,
  EditCalendarEventInputSchema,
  DeleteCalendarEventInputSchema,
  CalendarActionStatusSchema,
  EventSchema,
  getActualCalendarEventsTool, // Tool imported
  addCalendarEventTool,       // Tool imported
  editCalendarEventTool,      // Tool imported
  deleteCalendarEventTool     // Tool imported
} from '@/ai/tools/calendar-tools';


// Type Exports (derived from imported schemas)
export type CalendarEvent = z.infer<typeof EventSchema>;
export type CalendarActionStatus = z.infer<typeof CalendarActionStatusSchema>;

export type GetCalendarEventsInput = z.infer<typeof GetCalendarEventsInputSchema>;
export type GetCalendarEventsOutput = z.infer<typeof GetCalendarEventsOutputSchema>;

export type AddCalendarEventInput = z.infer<typeof AddCalendarEventInputSchema>;
export type EditCalendarEventInput = z.infer<typeof EditCalendarEventInputSchema>;
export type DeleteCalendarEventInput = z.infer<typeof DeleteCalendarEventInputSchema>;


// 1. Get Calendar Events Flow
// ============================
const getCalendarEventsFlow = ai.defineFlow(
  { name: 'getCalendarEventsFlow', inputSchema: GetCalendarEventsInputSchema, outputSchema: GetCalendarEventsOutputSchema },
  async (input) => {
    console.log("[getCalendarEventsFlow] Flow called with input:", JSON.stringify(input));
    // The tool itself now lives in calendar-tools.ts but is called here.
    // However, the standard pattern is for the tool to be called by a prompt, or directly if the flow orchestrates.
    // Here, getActualCalendarEventsTool handles the direct API call.
    const result = await getActualCalendarEventsTool(input); 
    console.log("[getCalendarEventsFlow] Result from tool:", JSON.stringify(result));
    return result;
  }
);
export async function getCalendarEvents(input: GetCalendarEventsInput): Promise<GetCalendarEventsOutput> {
  return getCalendarEventsFlow(input);
}


// 2. Add Calendar Event Flow
// ===========================
const addCalendarEventFlow = ai.defineFlow(
  { name: 'addCalendarEventFlow', inputSchema: AddCalendarEventInputSchema, outputSchema: CalendarActionStatusSchema },
  async (input) => {
    console.log("[addCalendarEventFlow] Flow called with input:", JSON.stringify(input));
    const result = await addCalendarEventTool(input); // Tool is imported
    console.log("[addCalendarEventFlow] Result from tool:", JSON.stringify(result));
    return result;
  }
);
export async function addCalendarEvent(input: AddCalendarEventInput): Promise<CalendarActionStatus> {
  return addCalendarEventFlow(input);
}


// 3. Edit Calendar Event Flow
// ===========================
const editCalendarEventFlow = ai.defineFlow(
  { name: 'editCalendarEventFlow', inputSchema: EditCalendarEventInputSchema, outputSchema: CalendarActionStatusSchema },
  async (input) => {
    console.log("[editCalendarEventFlow] Flow called with input:", JSON.stringify(input));
    const result = await editCalendarEventTool(input); // Tool is imported
    console.log("[editCalendarEventFlow] Result from tool:", JSON.stringify(result));
    return result;
  }
);
export async function editCalendarEvent(input: EditCalendarEventInput): Promise<CalendarActionStatus> {
  return editCalendarEventFlow(input);
}

// 4. Delete Calendar Event Flow
// =============================
const deleteCalendarEventFlow = ai.defineFlow(
  { name: 'deleteCalendarEventFlow', inputSchema: DeleteCalendarEventInputSchema, outputSchema: CalendarActionStatusSchema },
  async (input) => {
    console.log("[deleteCalendarEventFlow] Flow called with input:", JSON.stringify(input));
    const result = await deleteCalendarEventTool(input); // Tool is imported
    console.log("[deleteCalendarEventFlow] Result from tool:", JSON.stringify(result));
    return result;
  }
);
export async function deleteCalendarEvent(input: DeleteCalendarEventInput): Promise<CalendarActionStatus> {
  return deleteCalendarEventFlow(input);
}
