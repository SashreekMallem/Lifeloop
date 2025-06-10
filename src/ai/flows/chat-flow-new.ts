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
  calendarToken: z.string().optional().describe("User's Calendar-specific OAuth token, if available."),
  healthToken: z.string().optional().describe("User's Health-specific OAuth token, if available."),
  emailToken: z.string().optional().describe("User's Email-specific OAuth token, if available."),
  smartHomeToken: z.string().optional().describe("User's Smart Home OAuth token, if available."),
  amazonMusicToken: z.string().optional().describe("User's Amazon Music OAuth token, if available."),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s input.'),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Helper function to extract location from weather-related queries
function extractLocationFromQuery(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  // If it's not a weather-related query, don't extract location
  if (!/\b(weather|temperature|rain|sunny|cloudy|forecast|outside)\b/i.test(query)) {
    return null;
  }
  
  // Common location patterns
  const locationPatterns = [
    // "weather in New York" or "weather in NY"
    /weather\s+in\s+([^.?!]+)/i,
    // "what's the weather like in London"
    /weather\s+like\s+in\s+([^.?!]+)/i,
    // "temperature in Paris"
    /temperature\s+in\s+([^.?!]+)/i,
    // "forecast for Tokyo"
    /forecast\s+for\s+([^.?!]+)/i,
    // "how's the weather in Miami"
    /how'?s?\s+the\s+weather\s+in\s+([^.?!]+)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      let location = match[1].trim();
      
      // Handle common abbreviations and expansions
      const locationMappings: Record<string, string> = {
        'ny': 'New York, NY',
        'nyc': 'New York, NY',
        'la': 'Los Angeles, CA',
        'sf': 'San Francisco, CA',
        'chi': 'Chicago, IL',
        'london': 'London, UK',
        'paris': 'Paris, France',
        'tokyo': 'Tokyo, Japan',
        'sydney': 'Sydney, Australia',
        'miami': 'Miami, FL',
        'seattle': 'Seattle, WA',
        'boston': 'Boston, MA',
      };
      
      const mappedLocation = locationMappings[location.toLowerCase()];
      return mappedLocation || location;
    }
  }
  
  return null;
}

export async function chatWithAI(input: ChatInput): Promise<ChatOutput> {
  console.log('🚀 [NewChatFlow] Query:', input.prompt.substring(0, 50) + '...');
  
  try {
    // Extract location from weather queries
    const extractedLocation = extractLocationFromQuery(input.prompt);
    const userLocation = extractedLocation || 'Cumming, GA'; // Default location for the user
    
    // Determine the best OAuth token based on the query intent
    let bestToken = input.oauthToken;
    
    // Detect if the query is calendar-related and prioritize calendar token
    const queryLower = input.prompt.toLowerCase();
    const isCalendarQuery = /\b(calendar|schedule|event|meeting|appointment|today|tomorrow|this week|next week)\b/i.test(queryLower);
    const isHealthQuery = /\b(steps|heart|sleep|activity|health|fitness|workout|exercise)\b/i.test(queryLower);
    const isEmailQuery = /\b(email|inbox|unread|gmail|mail|messages|actionable|reply|send)\b/i.test(queryLower);
    const isSmartHomeQuery = /\b(smart home|devices|lights|thermostat|camera|speaker|home automation|control|turn on|turn off|energy|security)\b/i.test(queryLower);
    const isAmazonMusicQuery = /\b(music|song|track|playing|amazon music|spotify|artist|album|playlist|recently played|music stats)\b/i.test(queryLower);
    
    if (isCalendarQuery && input.calendarToken) {
      bestToken = input.calendarToken;
      console.log('🚀 [NewChatFlow] Using calendar-specific token for calendar query');
    } else if (isHealthQuery && input.healthToken) {
      bestToken = input.healthToken;
      console.log('🚀 [NewChatFlow] Using health-specific token for health query');
    } else if (isEmailQuery && input.emailToken) {
      bestToken = input.emailToken;
      console.log('🚀 [NewChatFlow] Using email-specific token for email query');
    } else if (isSmartHomeQuery && input.smartHomeToken) {
      bestToken = input.smartHomeToken;
      console.log('🚀 [NewChatFlow] Using smart home token for smart home query');
    } else if (isAmazonMusicQuery && input.amazonMusicToken) {
      bestToken = input.amazonMusicToken;
      console.log('🚀 [NewChatFlow] Using Amazon Music token for music query');
    } else if (input.calendarToken && !input.healthToken && !input.emailToken && !input.smartHomeToken && !input.amazonMusicToken) {
      bestToken = input.calendarToken;
      console.log('🚀 [NewChatFlow] Using available calendar token');
    } else if (input.healthToken && !input.calendarToken && !input.emailToken && !input.smartHomeToken && !input.amazonMusicToken) {
      bestToken = input.healthToken;
      console.log('🚀 [NewChatFlow] Using available health token');
    } else if (input.emailToken && !input.calendarToken && !input.healthToken && !input.smartHomeToken && !input.amazonMusicToken) {
      bestToken = input.emailToken;
      console.log('🚀 [NewChatFlow] Using available email token');
    } else if (input.smartHomeToken && !input.calendarToken && !input.healthToken && !input.emailToken && !input.amazonMusicToken) {
      bestToken = input.smartHomeToken;
      console.log('🚀 [NewChatFlow] Using available smart home token');
    } else if (input.amazonMusicToken && !input.calendarToken && !input.healthToken && !input.emailToken && !input.smartHomeToken) {
      bestToken = input.amazonMusicToken;
      console.log('🚀 [NewChatFlow] Using available Amazon Music token');
    }
    
    // Convert chat input to orchestration input
    const orchestrationInput: OrchestrationInput = {
      userQuery: input.prompt,
      oauthToken: bestToken,
      location: userLocation,
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
