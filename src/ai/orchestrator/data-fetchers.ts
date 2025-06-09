/**
 * @fileOverview Data fetchers for all integrated services
 * Each fetcher knows how to get data from a specific source and normalize it
 */

import { getHealthSummary, type HealthSummaryInput } from '@/ai/flows/health-data-flow';
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { getWeatherForecast, type WeatherForecastInput } from '@/ai/flows/weather-forecast-flow';

// Normalized data structure that all fetchers return
export interface NormalizedData {
  source: string;
  status: 'success' | 'error' | 'requires_auth';
  data?: any;
  error?: string;
  summary: string; // Human-readable summary for the LLM
}

export interface FetchContext {
  oauthToken?: string;
  location?: string;
  userId?: string;
}

// Health data fetcher
export async function fetchHealthData(context: FetchContext): Promise<NormalizedData> {
  if (!context.oauthToken) {
    return {
      source: 'health',
      status: 'requires_auth',
      error: 'OAuth token required for health data',
      summary: 'Health data unavailable - authentication required',
    };
  }

  try {
    const input: HealthSummaryInput = { oauthToken: context.oauthToken };
    const result = await getHealthSummary(input);

    if (result.status === 'success') {
      const { steps, sleepDurationMinutes, activeMinutes, heartRateBpm } = result;
      
      // Create human-readable summary
      const sleepHours = sleepDurationMinutes ? (sleepDurationMinutes / 60).toFixed(1) : 'N/A';
      const summary = `Health: ${steps || 0} steps, ${sleepHours}h sleep, ${activeMinutes || 0} active mins, ${heartRateBpm || 'N/A'} bpm heart rate`;
      
      return {
        source: 'health',
        status: 'success',
        data: result,
        summary,
      };
    } else {
      const errorMessage = result.status === 'requires_authentication' 
        ? result.message 
        : result.errorMessage;
      return {
        source: 'health',
        status: result.status === 'requires_authentication' ? 'requires_auth' : 'error',
        error: errorMessage,
        summary: 'Health data unavailable',
      };
    }
  } catch (error: any) {
    return {
      source: 'health',
      status: 'error',
      error: error.message,
      summary: 'Health data fetch failed',
    };
  }
}

// Calendar data fetcher
export async function fetchCalendarData(context: FetchContext): Promise<NormalizedData> {
  console.log('📅 [Calendar Fetcher] Starting calendar data fetch, token present:', !!context.oauthToken);
  
  if (!context.oauthToken) {
    console.log('📅 [Calendar Fetcher] No OAuth token available');
    return {
      source: 'calendar',
      status: 'requires_auth',
      error: 'OAuth token required for calendar data',
      summary: 'Calendar unavailable - authentication required',
    };
  }

  try {
    const input: GetCalendarEventsInput = {
      oauthToken: context.oauthToken,
      calendarId: 'primary',
      maxResults: 5,
    };
    console.log('📅 [Calendar Fetcher] Calling getCalendarEvents with input:', JSON.stringify(input));
    const result = await getCalendarEvents(input);
    console.log('📅 [Calendar Fetcher] Result status:', result.status);

    if (result.status === 'success') {
      const events = result.events || [];
      console.log('📅 [Calendar Fetcher] Success! Found', events.length, 'events');
      let summary: string;
      
      if (events.length === 0) {
        summary = 'Calendar: No upcoming events';
      } else {
        const eventSummaries = events.slice(0, 3).map(event => {
          const startTime = event.start?.dateTime ? 
            new Date(event.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 
            'All day';
          return `${event.summary} at ${startTime}`;
        });
        
        const moreCount = events.length > 3 ? ` (+${events.length - 3} more)` : '';
        summary = `Calendar: ${eventSummaries.join(', ')}${moreCount}`;
      }
      
      return {
        source: 'calendar',
        status: 'success',
        data: result,
        summary,
      };
    } else {
      const errorMessage = result.status === 'requires_authentication' 
        ? result.message 
        : result.errorMessage;
      return {
        source: 'calendar',
        status: result.status === 'requires_authentication' ? 'requires_auth' : 'error',
        error: errorMessage,
        summary: 'Calendar unavailable',
      };
    }
  } catch (error: any) {
    return {
      source: 'calendar',
      status: 'error',
      error: error.message,
      summary: 'Calendar fetch failed',
    };
  }
}

// Weather data fetcher
export async function fetchWeatherData(context: FetchContext): Promise<NormalizedData> {
  // Default to a reasonable location if none provided
  const location = context.location || 'New York, NY';

  try {
    const input: WeatherForecastInput = { location };
    const result = await getWeatherForecast(input);

    const summary = `Weather: ${result.temperature}, ${result.condition} in ${result.locationName}. ${result.humidity} humidity, ${result.wind} wind`;
    
    return {
      source: 'weather',
      status: 'success',
      data: result,
      summary,
    };
  } catch (error: any) {
    return {
      source: 'weather',
      status: 'error',
      error: error.message,
      summary: 'Weather data unavailable',
    };
  }
}

// Mood data fetcher (placeholder for now)
export async function fetchMoodData(context: FetchContext): Promise<NormalizedData> {
  // TODO: Implement mood detection logic
  // For now, return a placeholder
  return {
    source: 'mood',
    status: 'success',
    data: { mood: 'neutral', confidence: 0.7 },
    summary: 'Mood: Neutral (estimated from activity patterns)',
  };
}

// Entertainment data fetcher (placeholder)
export async function fetchEntertainmentData(context: FetchContext): Promise<NormalizedData> {
  // TODO: Integrate with Spotify, Netflix APIs
  return {
    source: 'entertainment',
    status: 'success',
    data: { recentlyPlayed: [], recommendations: [] },
    summary: 'Entertainment: No recent activity tracked',
  };
}

// Finance data fetcher (placeholder)
export async function fetchFinanceData(context: FetchContext): Promise<NormalizedData> {
  // TODO: Integrate with banking/spending APIs
  return {
    source: 'finance',
    status: 'success',
    data: { weeklySpending: 0, budget: 0 },
    summary: 'Finance: Spending data not yet integrated',
  };
}

// Smart home data fetcher (placeholder)
export async function fetchHomeData(context: FetchContext): Promise<NormalizedData> {
  // TODO: Integrate with smart home APIs
  return {
    source: 'home',
    status: 'success',
    data: { devices: [], scenes: [] },
    summary: 'Smart Home: No devices connected',
  };
}

// Master fetcher registry
export const DATA_FETCHERS: Record<string, (context: FetchContext) => Promise<NormalizedData>> = {
  health: fetchHealthData,
  calendar: fetchCalendarData,
  weather: fetchWeatherData,
  mood: fetchMoodData,
  entertainment: fetchEntertainmentData,
  finance: fetchFinanceData,
  home: fetchHomeData,
};
