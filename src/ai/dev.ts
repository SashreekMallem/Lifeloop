
import { config } from 'dotenv';
config();

import '@/ai/flows/morning-summary.ts';
import '@/ai/flows/goal-replanning.ts';
import '@/ai/flows/entertainment-curator.ts';
import '@/ai/flows/intelligent-suggestions.ts';
import '@/ai/flows/recipe-grocery-suggestions.ts';
import '@/ai/flows/mood-detection.ts';
import '@/ai/flows/weather-forecast-flow.ts';
import '@/ai/flows/calendar-events-flow.ts';
import '@/ai/flows/chat-flow.ts'; // Added new chat flow
