
'use server';
/**
 * @fileOverview Genkit flow and tools for interacting with Google Fit API.
 * Includes fetching summary health data like steps and sleep.
 *
 * - getHealthSummary - Retrieves a summary of health data.
 * - HealthSummaryInput - Input type for getHealthSummary.
 * - HealthSummaryOutput - Output type for getHealthSummary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for the main flow
export const HealthSummaryInputSchema = z.object({
  oauthToken: z.string().describe('The OAuth access token for Google Fit API.'),
});
export type HealthSummaryInput = z.infer<typeof HealthSummaryInputSchema>;

// Output Schema for the main flow
const HealthSummarySuccessSchema = z.object({
  status: z.literal("success"),
  steps: z.number().optional().describe("Today's step count."),
  sleepDurationMinutes: z.number().optional().describe("Last night's sleep duration in minutes."),
  // Add more fields like heartRate, activeMinutes as needed
});

const HealthSummaryAuthErrorSchema = z.object({
    status: z.literal("requires_authentication"),
    message: z.string().describe("Message indicating authentication or valid token is required."),
});

const HealthSummaryErrorSchema = z.object({
    status: z.literal("error"),
    errorMessage: z.string().describe("Message describing the error."),
});

export const HealthSummaryOutputSchema = z.discriminatedUnion("status", [
    HealthSummarySuccessSchema,
    HealthSummaryAuthErrorSchema,
    HealthSummaryErrorSchema
]);
export type HealthSummaryOutput = z.infer<typeof HealthSummaryOutputSchema>;


// Helper function to get start and end of today in milliseconds
const getTodayMillis = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    startTimeMillis: startOfDay.getTime(),
    endTimeMillis: endOfDay.getTime(),
  };
};

// Helper function to get time window for "last night's sleep" (e.g., 6 PM yesterday to 12 PM today)
const getLastNightSleepWindowISO = () => {
  const now = new Date();
  const todayAtNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const yesterdayAt6PM = new Date(todayAtNoon);
  yesterdayAt6PM.setDate(yesterdayAt6PM.getDate() - 1);
  yesterdayAt6PM.setHours(18, 0, 0, 0);

  return {
    startTimeISO: yesterdayAt6PM.toISOString(),
    endTimeISO: todayAtNoon.toISOString(),
  };
};


// Tool to get today's step count
const getTodaysStepsTool = ai.defineTool(
  {
    name: 'getTodaysStepsTool',
    description: 'Fetches today\'s step count from Google Fit API.',
    inputSchema: z.object({ oauthToken: z.string() }),
    outputSchema: z.object({ steps: z.number().optional() }),
  },
  async (input) => {
    console.log("[getTodaysStepsTool] Called");
    if (!input.oauthToken) {
        console.warn("[getTodaysStepsTool] OAuth token missing.");
        throw new Error("OAuth token required for getTodaysStepsTool.");
    }
    try {
      const { startTimeMillis, endTimeMillis } = getTodayMillis();
      const requestBody = {
        aggregateBy: [{
          dataTypeName: "com.google.step_count.delta",
          dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
        }],
        bucketByTime: { durationMillis: endTimeMillis - startTimeMillis }, // One bucket for the whole day
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis
      };

      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${input.oauthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      console.log(`[getTodaysStepsTool] API Response Status: ${response.status}`, responseText);

      if (!response.ok) {
        throw new Error(`Google Fit API error for steps (Status ${response.status}): ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      if (data.bucket && data.bucket.length > 0 && data.bucket[0].dataset && data.bucket[0].dataset.length > 0 && data.bucket[0].dataset[0].point && data.bucket[0].dataset[0].point.length > 0) {
        const point = data.bucket[0].dataset[0].point[0];
        if (point.value && point.value.length > 0 && point.value[0].intVal !== undefined) {
          console.log("[getTodaysStepsTool] Steps found:", point.value[0].intVal);
          return { steps: point.value[0].intVal };
        }
      }
      console.log("[getTodaysStepsTool] No step data points found in response.");
      return { steps: 0 }; // Default to 0 if no data
    } catch (error: any) {
      console.error("[getTodaysStepsTool] Error:", error.message);
      // Let the flow handle more granular error reporting to widget
      throw error; 
    }
  }
);

// Tool to get last night's sleep duration
const getLastNightsSleepTool = ai.defineTool(
  {
    name: 'getLastNightsSleepTool',
    description: 'Fetches last night\'s sleep duration from Google Fit API.',
    inputSchema: z.object({ oauthToken: z.string() }),
    outputSchema: z.object({ sleepDurationMinutes: z.number().optional() }),
  },
  async (input) => {
    console.log("[getLastNightsSleepTool] Called");
    if (!input.oauthToken) {
        console.warn("[getLastNightsSleepTool] OAuth token missing.");
        throw new Error("OAuth token required for getLastNightsSleepTool.");
    }
    try {
      const { startTimeISO, endTimeISO } = getLastNightSleepWindowISO();
      const apiUrl = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startTimeISO}&endTime=${endTimeISO}&activityType=72`;
      
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${input.oauthToken}` },
      });

      const responseText = await response.text();
      console.log(`[getLastNightsSleepTool] API Response Status: ${response.status}`, responseText);

      if (!response.ok) {
        throw new Error(`Google Fit API error for sleep (Status ${response.status}): ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      let totalSleepMillis = 0;
      if (data.session) {
        data.session.forEach((session: any) => {
          // Ensure it's a sleep session (activityType 72 is sleep)
          // The API filter should handle this, but double check if session.activityType is available
          if (session.activityType === 72) { 
            totalSleepMillis += (parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis));
          }
        });
      }
      const totalSleepMinutes = Math.round(totalSleepMillis / 60000);
      console.log("[getLastNightsSleepTool] Total sleep (minutes):", totalSleepMinutes);
      return { sleepDurationMinutes: totalSleepMinutes };
    } catch (error: any) {
      console.error("[getLastNightsSleepTool] Error:", error.message);
      throw error;
    }
  }
);


// Main flow to get health summary
const getHealthSummaryFlow = ai.defineFlow(
  {
    name: 'getHealthSummaryFlow',
    inputSchema: HealthSummaryInputSchema,
    outputSchema: HealthSummaryOutputSchema,
  },
  async (input): Promise<HealthSummaryOutput> => {
    console.log('[getHealthSummaryFlow] Called with input token (presence):', input.oauthToken ? 'present' : 'absent');
    if (!input.oauthToken) {
      return { status: "requires_authentication", message: "OAuth token missing for Google Fit." };
    }

    try {
      const [stepsResult, sleepResult] = await Promise.allSettled([
        getTodaysStepsTool(input),
        getLastNightsSleepTool(input)
      ]);

      let steps: number | undefined = undefined;
      let sleepDurationMinutes: number | undefined = undefined;
      let stepsError: string | null = null;
      let sleepError: string | null = null;

      if (stepsResult.status === 'fulfilled') {
        steps = stepsResult.value.steps;
      } else {
        console.error('[getHealthSummaryFlow] Error fetching steps:', stepsResult.reason);
        stepsError = (stepsResult.reason as Error).message || "Error fetching steps.";
      }

      if (sleepResult.status === 'fulfilled') {
        sleepDurationMinutes = sleepResult.value.sleepDurationMinutes;
      } else {
        console.error('[getHealthSummaryFlow] Error fetching sleep:', sleepResult.reason);
        sleepError = (sleepResult.reason as Error).message || "Error fetching sleep data.";
      }
      
      // If a specific error indicates auth failure, prioritize that message
      const combinedErrorMessage = [stepsError, sleepError].filter(Boolean).join('; ');
      if (combinedErrorMessage.includes("401") || combinedErrorMessage.includes("403") || combinedErrorMessage.toLowerCase().includes("invalid credentials")) {
        return { status: "requires_authentication", message: "Google Fit authentication failed or token expired. Please re-authenticate." };
      }
      if (stepsError || sleepError) {
        // Return success but with potentially missing fields if only one tool failed, or an error if both critical.
        // For simplicity, if any tool has an error not auth-related, we'll reflect it as a general error for now.
        // A more granular approach might return partial success.
        // If we want to be strict and say any tool failure is a flow failure:
        return { status: "error", errorMessage: `Failed to retrieve some health data: ${combinedErrorMessage}` };
      }

      return {
        status: "success",
        steps,
        sleepDurationMinutes,
      };

    } catch (error: any) {
      console.error('[getHealthSummaryFlow] Unhandled error in flow:', error);
      if (error.message?.includes("401") || error.message?.includes("403") || error.message?.toLowerCase().includes("invalid credentials")) {
        return { status: "requires_authentication", message: "Google Fit authentication error. Please re-authenticate." };
      }
      return { status: "error", errorMessage: error.message || "An unexpected error occurred while fetching health data." };
    }
  }
);

// Exported wrapper function
export async function getHealthSummary(input: HealthSummaryInput): Promise<HealthSummaryOutput> {
  return getHealthSummaryFlow(input);
}
