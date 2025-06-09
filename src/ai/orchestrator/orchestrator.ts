/**
 * @fileOverview Main orchestrator that coordinates data fetching and AI reasoning
 * This is the central brain that decides what data to fetch and how to present it to the LLM
 */

import { detectIntent } from './data-registry';
import { DATA_FETCHERS, type NormalizedData, type FetchContext } from './data-fetchers';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the orchestrator
const OrchestrationInputSchema = z.object({
  userQuery: z.string().describe('The user\'s question or request'),
  oauthToken: z.string().optional().describe('OAuth token for authenticated services'),
  location: z.string().optional().describe('User\'s location for weather and location-based services'),
  userId: z.string().optional().describe('User identifier for personalization'),
});

export type OrchestrationInput = z.infer<typeof OrchestrationInputSchema>;

// Output schema for the orchestrator
const OrchestrationOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s query'),
  dataUsed: z.array(z.string()).describe('List of data sources that were consulted'),
  suggestedActions: z.array(z.string()).optional().describe('Optional suggested follow-up actions'),
});

export type OrchestrationOutput = z.infer<typeof OrchestrationOutputSchema>;

// Lightweight AI prompt for reasoning over fused data
const reasoningPrompt = ai.definePrompt({
  name: 'lifeLoopReasoningPrompt',
  input: {
    schema: z.object({
      userQuery: z.string(),
      dataFusion: z.string(),
      availableActions: z.array(z.string()).optional(),
    })
  },
  output: { schema: OrchestrationOutputSchema },
  system: `You are the AI brain of LifeLoop, a personal life operating system.

Your role:
- Answer the user's SPECIFIC question directly and concisely
- Only include relevant data that answers their question
- Be helpful and context-aware
- Use a friendly, personal tone

Guidelines:
- If they ask about ONE thing (like heart rate), focus ONLY on that
- If they ask about weather, focus ONLY on weather for their location
- If they ask about general status, then give a broader overview
- Keep responses under 100 words unless they ask for details
- Be precise and avoid information overload

Always answer what they actually asked, not everything you know.`,
  prompt: `User asked: "{{{userQuery}}}"

Here's all their current data:
{{{dataFusion}}}

Please provide a helpful, actionable response that takes into account all available information.`,
});

// Main orchestration flow
const orchestrationFlow = ai.defineFlow({
  name: 'lifeLoopOrchestrationFlow',
  inputSchema: OrchestrationInputSchema,
  outputSchema: OrchestrationOutputSchema,
}, async (input: OrchestrationInput): Promise<OrchestrationOutput> => {
  console.log('🎯 [Orchestrator] Processing query:', input.userQuery);

  // 1. Detect what data sources we need
  const intentResult = detectIntent(input.userQuery);
  const relevantSources = intentResult.sources;
  const specifics = intentResult.specifics;
  
  console.log('🎯 [Orchestrator] Detected relevant sources:', relevantSources);
  console.log('🎯 [Orchestrator] Specific data requested:', specifics);

  // 2. Fetch data from all relevant sources in parallel
  const fetchContext: FetchContext = {
    oauthToken: input.oauthToken,
    location: input.location,
    userId: input.userId,
  };

  const dataPromises = relevantSources.map(async (sourceId) => {
    const fetcher = DATA_FETCHERS[sourceId];
    if (!fetcher) {
      console.warn(`🎯 [Orchestrator] No fetcher found for source: ${sourceId}`);
      return null;
    }
    
    try {
      const result = await fetcher(fetchContext);
      console.log(`🎯 [Orchestrator] ${sourceId}:`, result.summary);
      return result;
    } catch (error) {
      console.error(`🎯 [Orchestrator] Error fetching ${sourceId}:`, error);
      return {
        source: sourceId,
        status: 'error' as const,
        error: 'Fetch failed',
        summary: `${sourceId} data unavailable`,
      };
    }
  });

  const dataResults = (await Promise.all(dataPromises)).filter(Boolean) as NormalizedData[];

  // 3. Fuse all data into a compact summary for the LLM
  const successfulData = dataResults.filter(d => d.status === 'success');
  const authRequiredData = dataResults.filter(d => d.status === 'requires_auth');
  const errorData = dataResults.filter(d => d.status === 'error');

  let dataFusion = '';
  
  if (successfulData.length > 0) {
    dataFusion += 'Current Data:\n' + successfulData.map(d => `- ${d.summary}`).join('\n');
  }
  
  if (authRequiredData.length > 0) {
    dataFusion += '\n\nUnavailable (needs authentication):\n' + authRequiredData.map(d => `- ${d.source}`).join('\n');
  }
  
  if (errorData.length > 0) {
    dataFusion += '\n\nData fetch errors:\n' + errorData.map(d => `- ${d.source}: ${d.error}`).join('\n');
  }

  // 4. Define available actions the AI can suggest
  const availableActions = [
    'Set a reminder',
    'Schedule a calendar event',
    'Check detailed health metrics',
    'Get weather for a different location',
    'Suggest workout routine',
    'Plan optimal work breaks',
    'Recommend restaurants/entertainment',
    'Adjust smart home settings',
  ];

  // 5. Let the LLM reason over all the data
  console.log('🎯 [Orchestrator] Data fusion for LLM:', dataFusion);
  
  try {
    const { output } = await reasoningPrompt({
      userQuery: input.userQuery,
      dataFusion,
      availableActions,
    });

    if (!output) {
      throw new Error('No output from reasoning prompt');
    }

    return {
      response: output.response,
      dataUsed: successfulData.map(d => d.source),
      suggestedActions: output.suggestedActions,
    };
  } catch (error) {
    console.error('🎯 [Orchestrator] Reasoning failed:', error);
    
    // Fallback response
    return {
      response: "I'm having trouble processing your request right now. Let me try to help with the data I have available.",
      dataUsed: successfulData.map(d => d.source),
    };
  }
});

// Main export function
export async function orchestrateLifeLoopQuery(input: OrchestrationInput): Promise<OrchestrationOutput> {
  return orchestrationFlow(input);
}
