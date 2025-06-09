/**
 * @fileOverview Defines Zod schemas and Genkit tools for interacting with Health Data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// We're importing the existing flow from health-data-flow.ts to use in our tool
import { getHealthSummary, type HealthSummaryInput, type HealthSummaryOutput } from '@/ai/flows/health-data-flow';

// Define the schema for the health data tool input
export const GetHealthDataInputSchema = z.object({
  oauthToken: z.string().describe('The OAuth access token for Google Fit API.')
});

// Health data tool for getting health summary
export const getHealthDataTool = ai.defineTool(
  {
    name: "getHealthDataTool",
    description: "Retrieves summary health data like steps, sleep, active minutes, and heart rate from Google Fit.",
    inputSchema: GetHealthDataInputSchema,
  },
  async (input) => {
    console.log("🏥 [getHealthDataTool] Called with token:", !!input.oauthToken);
    
    if (!input.oauthToken) {
      return {
        status: "requires_authentication" as const,
        message: "OAuth token missing for Google Fit."
      };
    }
    
    try {
      const result = await getHealthSummary({ oauthToken: input.oauthToken });
      console.log("🏥 [getHealthDataTool] Result:", result.status);
      return result;
    } catch (error: any) {
      console.error("💥 [getHealthDataTool] Error:", error.message?.substring(0, 100) || 'Unknown');
      
      if (error.message?.includes("401") || error.message?.includes("403") || 
          error.message?.toLowerCase().includes("invalid credentials") ||
          error.message?.toLowerCase().includes("token")) {
        return {
          status: "requires_authentication" as const,
          message: "Google Fit authentication failed or token expired. Please re-authenticate."
        };
      }

      return {
        status: "error" as const,
        errorMessage: error.message || "Failed to retrieve health data."
      };
    }
  }
);
