/**
 * @fileOverview Data fetchers for all integrated services
 * Each fetcher knows how to get data from a specific source and normalize it
 */

import { getHealthSummary, type HealthSummaryInput } from '@/ai/flows/health-data-flow';
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { getWeatherForecast, type WeatherForecastInput } from '@/ai/flows/weather-forecast-flow';
import { getEmailSummary, type EmailSummaryInput } from '@/ai/flows/email-data-flow';
import { getSmartHomeData, type SmartHomeInput } from '@/ai/flows/smart-home-flow';
import { getAmazonMusicData, type AmazonMusicInput } from '../flows/amazon-music-flow';

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

// Email data fetcher
export async function fetchEmailData(context: FetchContext): Promise<NormalizedData> {
  console.log('📧 [Email Fetcher] Starting email data fetch, token present:', !!context.oauthToken);
  
  if (!context.oauthToken) {
    console.log('📧 [Email Fetcher] No OAuth token available');
    return {
      source: 'email',
      status: 'requires_auth',
      error: 'OAuth token required for email data',
      summary: 'Email unavailable - authentication required',
    };
  }

  try {
    const input: EmailSummaryInput = {
      oauthToken: context.oauthToken,
    };
    console.log('📧 [Email Fetcher] Calling getEmailSummary');
    const result = await getEmailSummary(input);
    console.log('📧 [Email Fetcher] Result status:', result.status);

    if (result.status === 'success') {
      const { unreadCount, recentEmails, prioritySenders, actionableEmails } = result;
      
      console.log('📧 [Email Fetcher] Success! Unread:', unreadCount, 'Recent:', recentEmails?.length, 'Actionable:', actionableEmails?.length);
      
      // Create human-readable summary
      let summary = `Email: ${unreadCount || 0} unread`;
      
      if (recentEmails && recentEmails.length > 0) {
        const recentSubjects = recentEmails.slice(0, 2).map(email => 
          `"${email.subject}" from ${email.sender}`
        );
        summary += `, recent: ${recentSubjects.join(', ')}`;
      }
      
      if (actionableEmails && actionableEmails.length > 0) {
        summary += `, ${actionableEmails.length} actionable items`;
      }
      
      return {
        source: 'email',
        status: 'success',
        data: result,
        summary,
      };
    } else {
      const errorMessage = result.status === 'requires_authentication' 
        ? result.message 
        : result.errorMessage;
      return {
        source: 'email',
        status: result.status === 'requires_authentication' ? 'requires_auth' : 'error',
        error: errorMessage,
        summary: 'Email unavailable',
      };
    }
  } catch (error: any) {
    return {
      source: 'email',
      status: 'error',
      error: error.message,
      summary: 'Email fetch failed',
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

// Smart home data fetcher
export async function fetchSmartHomeData(context: FetchContext): Promise<NormalizedData> {
  console.log('🏠 [Smart Home Fetcher] Starting smart home data fetch, token present:', !!context.oauthToken);
  
  if (!context.oauthToken) {
    console.log('🏠 [Smart Home Fetcher] No OAuth token available');
    return {
      source: 'smarthome',
      status: 'requires_auth',
      error: 'OAuth token required for smart home data',
      summary: 'Smart Home unavailable - authentication required',
    };
  }

  try {
    const input: SmartHomeInput = {
      oauthToken: context.oauthToken,
      deviceTypes: ['light', 'thermostat', 'camera', 'switch', 'sensor', 'speaker'],
      includeStatus: true,
      includeControls: true,
    };
    console.log('🏠 [Smart Home Fetcher] Calling getSmartHomeData');
    const result = await getSmartHomeData(input);
    console.log('🏠 [Smart Home Fetcher] Result status:', result.status);

    if (result.status === 'success') {
      const { totalDevices, onlineDevices, offlineDevices, devices, rooms } = result;
      console.log('🏠 [Smart Home Fetcher] Success! Total devices:', totalDevices, 'Online:', onlineDevices);
      
      // Create human-readable summary
      let summary = `Smart Home: ${totalDevices || 0} devices (${onlineDevices || 0} online, ${offlineDevices || 0} offline)`;
      
      if (rooms && rooms.length > 0) {
        summary += `, ${rooms.length} rooms: ${rooms.slice(0, 3).join(', ')}`;
        if (rooms.length > 3) summary += ` (+${rooms.length - 3} more)`;
      }
      
      if (devices && devices.length > 0) {
        const deviceSummary = devices.slice(0, 3).map(device => {
          const status = device.status === 'online' ? '✓' : '✗';
          const state = device.state?.on !== undefined ? (device.state.on ? 'ON' : 'OFF') : '';
          return `${device.name} ${status}${state ? ` (${state})` : ''}`;
        });
        summary += `, devices: ${deviceSummary.join(', ')}`;
        if (devices.length > 3) summary += ` (+${devices.length - 3} more)`;
      }
      
      return {
        source: 'smarthome',
        status: 'success',
        data: result,
        summary,
      };
    } else {
      const errorMessage = result.status === 'requires_authentication' 
        ? 'Smart Home authentication required'
        : result.error;
      return {
        source: 'smarthome',
        status: result.status === 'requires_authentication' ? 'requires_auth' : 'error',
        error: errorMessage,
        summary: 'Smart Home unavailable',
      };
    }
  } catch (error: any) {
    return {
      source: 'smarthome',
      status: 'error',
      error: error.message,
      summary: 'Smart Home fetch failed',
    };
  }
}

// Amazon Music data fetcher
export async function fetchAmazonMusicData(context: FetchContext): Promise<NormalizedData> {
  if (!context.oauthToken) {
    return {
      source: 'amazonmusic',
      status: 'requires_auth',
      error: 'OAuth token required for Amazon Music data',
      summary: 'Amazon Music data unavailable - authentication required',
    };
  }

  try {
    const input: AmazonMusicInput = { 
      oauthToken: context.oauthToken,
      includeCurrentlyPlaying: true,
      includeRecentlyPlayed: true,
      includeRecommendations: true,
      includeLibrary: false,
      limit: 20
    };
    const result = await getAmazonMusicData(input);

    if (result.status === 'success') {
      const { currentlyPlaying, recentlyPlayed, listeningStats } = result;
      console.log('🎵 [Amazon Music Fetcher] Success! Currently playing:', currentlyPlaying?.name);
      
      // Create human-readable summary
      let summary = 'Amazon Music: ';
      
      if (currentlyPlaying) {
        summary += `Now playing "${currentlyPlaying.name}" by ${currentlyPlaying.artist}`;
        if (currentlyPlaying.album) summary += ` from ${currentlyPlaying.album}`;
      } else {
        summary += 'Not currently playing';
      }
      
      if (recentlyPlayed && recentlyPlayed.length > 0) {
        summary += `, Recent: ${recentlyPlayed.slice(0, 2).map((track: any) => `"${track.name}"`).join(', ')}`;
      }
      
      if (listeningStats) {
        summary += `, Stats: ${listeningStats.songsPlayed || 0} songs played`;
        if (listeningStats.topGenre) {
          summary += `, Top genre: ${listeningStats.topGenre}`;
        }
      }
      
      return {
        source: 'amazonmusic',
        status: 'success',
        data: result,
        summary,
      };
    } else {
      const errorMessage = result.status === 'requires_authentication' 
        ? 'Amazon Music authentication required'
        : result.error;
      return {
        source: 'amazonmusic',
        status: result.status === 'requires_authentication' ? 'requires_auth' : 'error',
        error: errorMessage,
        summary: 'Amazon Music unavailable',
      };
    }
  } catch (error: any) {
    return {
      source: 'amazonmusic',
      status: 'error',
      error: error.message,
      summary: 'Amazon Music fetch failed',
    };
  }
}

// Legacy alias for backward compatibility
export async function fetchHomeData(context: FetchContext): Promise<NormalizedData> {
  return fetchSmartHomeData(context);
}

// Master fetcher registry
export const DATA_FETCHERS: Record<string, (context: FetchContext) => Promise<NormalizedData>> = {
  health: fetchHealthData,
  calendar: fetchCalendarData,
  weather: fetchWeatherData,
  email: fetchEmailData,
  mood: fetchMoodData,
  entertainment: fetchEntertainmentData,
  finance: fetchFinanceData,
  home: fetchHomeData,
  smarthome: fetchSmartHomeData,
  amazonmusic: fetchAmazonMusicData,
};
