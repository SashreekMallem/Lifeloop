
'use server';
/**
 * @fileOverview Genkit flow and tools for interacting with Google Fit API.
 * Includes fetching summary health data like steps, sleep, active minutes, and heart rate.
 *
 * - getHealthSummary - Retrieves a summary of health data.
 * - HealthSummaryInput - Input type for getHealthSummary.
 * - HealthSummaryOutput - Output type for getHealthSummary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for the main flow - NOT EXPORTED
const HealthSummaryInputSchema = z.object({
  oauthToken: z.string().describe('The OAuth access token for Google Fit API.'),
});
export type HealthSummaryInput = z.infer<typeof HealthSummaryInputSchema>;

// Output Schema for the main flow
const HealthSummarySuccessSchema = z.object({
  status: z.literal("success"),
  steps: z.number().optional().describe("Today's step count."),
  sleepDurationMinutes: z.number().optional().describe("Last night's sleep duration in minutes."),
  activeMinutes: z.number().optional().describe("Today's total active minutes."),
  heartRateBpm: z.number().optional().describe("Today's average or latest heart rate in BPM."),
});

const HealthSummaryAuthErrorSchema = z.object({
    status: z.literal("requires_authentication"),
    message: z.string().describe("Message indicating authentication or valid token is required."),
});

const HealthSummaryErrorSchema = z.object({
    status: z.literal("error"),
    errorMessage: z.string().describe("Message describing the error."),
});

const HealthSummaryOutputSchema = z.discriminatedUnion("status", [
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
        bucketByTime: { durationMillis: endTimeMillis - startTimeMillis }, 
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
      return { steps: 0 }; 
    } catch (error: any) {
      console.error("[getTodaysStepsTool] Error:", error.message);
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

// Tool to get today's active minutes
const getTodaysActiveMinutesTool = ai.defineTool(
  {
    name: 'getTodaysActiveMinutesTool',
    description: 'Fetches today\'s total active minutes from Google Fit API.',
    inputSchema: z.object({ oauthToken: z.string() }),
    outputSchema: z.object({ activeMinutes: z.number().optional() }),
  },
  async (input) => {
    console.log("[getTodaysActiveMinutesTool] Called");
    if (!input.oauthToken) {
        console.warn("[getTodaysActiveMinutesTool] OAuth token missing.");
        throw new Error("OAuth token required for getTodaysActiveMinutesTool.");
    }
    try {
      const { startTimeMillis, endTimeMillis } = getTodayMillis();
      const requestBody = {
        aggregateBy: [{
          dataTypeName: "com.google.active_minutes",
          dataSourceId: "derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes"
        }],
        bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
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
      console.log(`[getTodaysActiveMinutesTool] API Response Status: ${response.status}`, responseText);

      if (!response.ok) {
        throw new Error(`Google Fit API error for active minutes (Status ${response.status}): ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      if (data.bucket && data.bucket.length > 0 && data.bucket[0].dataset && data.bucket[0].dataset.length > 0 && data.bucket[0].dataset[0].point && data.bucket[0].dataset[0].point.length > 0) {
        const point = data.bucket[0].dataset[0].point[0];
        if (point.value && point.value.length > 0 && point.value[0].intVal !== undefined) {
          console.log("[getTodaysActiveMinutesTool] Active minutes found:", point.value[0].intVal);
          return { activeMinutes: point.value[0].intVal };
        }
      }
      console.log("[getTodaysActiveMinutesTool] No active minutes data points found in response.");
      return { activeMinutes: 0 };
    } catch (error: any) {
      console.error("[getTodaysActiveMinutesTool] Error:", error.message);
      throw error;
    }
  }
);

// Tool to get today's average heart rate
const getTodaysHeartRateTool = ai.defineTool(
  {
    name: 'getTodaysHeartRateTool',
    description: 'Fetches today\'s average heart rate (BPM) from Google Fit API.',
    inputSchema: z.object({ oauthToken: z.string() }),
    outputSchema: z.object({ heartRateBpm: z.number().optional() }),
  },
  async (input) => {
    console.log("[getTodaysHeartRateTool] Called");
    if (!input.oauthToken) {
        console.warn("[getTodaysHeartRateTool] OAuth token missing.");
        throw new Error("OAuth token required for getTodaysHeartRateTool.");
    }
    try {
      const { startTimeMillis, endTimeMillis } = getTodayMillis();
      const requestBody = {
        aggregateBy: [{
          dataTypeName: "com.google.heart_rate.bpm",
          dataSourceId: "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm" // Merged source
        }],
        bucketByTime: { durationMillis: endTimeMillis - startTimeMillis }, // Single bucket for the whole day
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
      console.log(`[getTodaysHeartRateTool] API Response Status: ${response.status}`, responseText);

      if (!response.ok) {
        // Handle permission errors gracefully for heart rate data
        if (response.status === 403) {
          console.log("[getTodaysHeartRateTool] Heart rate data access denied (permission not granted)");
          return { heartRateBpm: undefined };
        }
        throw new Error(`Google Fit API error for heart rate (Status ${response.status}): ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      if (data.bucket && data.bucket.length > 0 && data.bucket[0].dataset && data.bucket[0].dataset.length > 0 && data.bucket[0].dataset[0].point && data.bucket[0].dataset[0].point.length > 0) {
        const point = data.bucket[0].dataset[0].point[0];
        // Heart rate is often fpVal for average, but check value structure
        if (point.value && point.value.length > 0 && point.value[0].fpVal !== undefined) {
          console.log("[getTodaysHeartRateTool] Average heart rate (BPM) found:", point.value[0].fpVal);
          return { heartRateBpm: Math.round(point.value[0].fpVal) };
        }
      }
      console.log("[getTodaysHeartRateTool] No heart rate data points found in response for average.");
      return { heartRateBpm: undefined }; // Return undefined if no data
    } catch (error: any) {
      console.error("[getTodaysHeartRateTool] Error:", error.message);
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
      const [stepsResult, sleepResult, activeMinutesResult, heartRateResult] = await Promise.allSettled([
        getTodaysStepsTool(input),
        getLastNightsSleepTool(input),
        getTodaysActiveMinutesTool(input),
        getTodaysHeartRateTool(input)
      ]);

      let steps: number | undefined = undefined;
      let sleepDurationMinutes: number | undefined = undefined;
      let activeMinutes: number | undefined = undefined;
      let heartRateBpm: number | undefined = undefined;
      
      const errors: string[] = [];

      if (stepsResult.status === 'fulfilled') {
        steps = stepsResult.value.steps;
      } else {
        console.error('[getHealthSummaryFlow] Error fetching steps:', stepsResult.reason);
        errors.push((stepsResult.reason as Error).message || "Error fetching steps.");
      }

      if (sleepResult.status === 'fulfilled') {
        sleepDurationMinutes = sleepResult.value.sleepDurationMinutes;
      } else {
        console.error('[getHealthSummaryFlow] Error fetching sleep:', sleepResult.reason);
        errors.push((sleepResult.reason as Error).message || "Error fetching sleep data.");
      }

      if (activeMinutesResult.status === 'fulfilled') {
        activeMinutes = activeMinutesResult.value.activeMinutes;
      } else {
        console.error('[getHealthSummaryFlow] Error fetching active minutes:', activeMinutesResult.reason);
        errors.push((activeMinutesResult.reason as Error).message || "Error fetching active minutes.");
      }

      if (heartRateResult.status === 'fulfilled') {
        heartRateBpm = heartRateResult.value.heartRateBpm;
      } else {
        console.error('[getHealthSummaryFlow] Error fetching heart rate:', heartRateResult.reason);
        errors.push((heartRateResult.reason as Error).message || "Error fetching heart rate data.");
      }
      
      const combinedErrorMessage = errors.join('; ');
      if (combinedErrorMessage.includes("401") || combinedErrorMessage.includes("403") || combinedErrorMessage.toLowerCase().includes("invalid credentials") || combinedErrorMessage.toLowerCase().includes("token has been expired or revoked")) {
        return { status: "requires_authentication", message: "Google Fit authentication failed or token expired. Please re-authenticate." };
      }
      if (errors.length > 0) {
        // If all results failed and it's not an auth error, it's a general error.
        // If some succeeded and some failed, we still return success but with missing data.
        // The current schema allows optional fields for success, so partial success is okay.
        if (errors.length === 4 && !(steps || sleepDurationMinutes || activeMinutes || heartRateBpm) ) { // All 4 failed
             return { status: "error", errorMessage: `Failed to retrieve health data: ${combinedErrorMessage}` };
        }
      }

      return {
        status: "success",
        steps,
        sleepDurationMinutes,
        activeMinutes,
        heartRateBpm,
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

    