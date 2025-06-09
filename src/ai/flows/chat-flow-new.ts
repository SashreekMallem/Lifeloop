/**
 * @fileOverview New chat flow using the orchestrator pattern
 * This replaces the old chat-flow.ts with a much simpler, more scalable approach
 */

'use server';

import { orchestrateLifeLoopQuery, type OrchestrationInput, type OrchestrationOutput } from '../orchestrator/orchestrator';
import { z } from 'genkit';

// Keep the same input/output interface for compatibility
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
  console.log('🚀 [NewChatFlow] Query:', input.prompt.substring(0, 50) + '...');
  
  try {
    // Convert chat input to orchestration input
    const orchestrationInput: OrchestrationInput = {
      userQuery: input.prompt,
      oauthToken: input.oauthToken,
      // TODO: Get user's location from their profile or geolocation
      location: 'Cumming, GA', // Default location for the user
      // TODO: Get user ID from authentication context
      userId: 'default-user',
    };

    // Use the orchestrator to get an intelligent, multi-source response
    const result = await orchestrateLifeLoopQuery(orchestrationInput);
    
    console.log('🚀 [NewChatFlow] Data sources used:', result.dataUsed);
    console.log('🚀 [NewChatFlow] Success');
    
    return {
      response: result.response
    };
    
  } catch (error: any) {
    console.error('💥 [NewChatFlow] Error:', error.message);
    
    return {
      response: "I'm having trouble accessing your data right now. Please try again in a moment."
    };
  }
}
