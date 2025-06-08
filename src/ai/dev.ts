
import { config } from 'dotenv';
config();

import '@/ai/flows/morning-summary.ts';
import '@/ai/flows/goal-replanning.ts';
import '@/ai/flows/entertainment-curator.ts';
import '@/ai/flows/intelligent-suggestions.ts';
import '@/ai/flows/recipe-grocery-suggestions.ts';
import '@/ai/flows/mood-detection.ts';
import '@/ai/flows/weather-forecast-flow.ts';
// Note: calendar-tools.ts does not need to be imported here as it's not a flow file.
import '@/ai/flows/calendar-events-flow.ts'; // Includes get, add, edit, delete Server Actions
import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/health-data-flow.ts'; // Added new health data flow
