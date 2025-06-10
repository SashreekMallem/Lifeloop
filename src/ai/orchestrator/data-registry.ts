/**
 * @fileOverview Central registry for all data sources in LifeLoop
 * This allows the orchestrator to know what data is available and how to fetch it
 */

import { z } from 'zod';

// Base schema for all data sources
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  requiresAuth: z.boolean(),
  categories: z.array(z.enum(['health', 'calendar', 'weather', 'email', 'entertainment', 'social', 'productivity', 'finance', 'home', 'smarthome', 'amazonmusic'])),
});

export type DataSource = z.infer<typeof DataSourceSchema>;

// Registry of all available data sources
export const DATA_SOURCES: Record<string, DataSource> = {
  health: {
    id: 'health',
    name: 'Health & Fitness',
    description: 'Steps, heart rate, sleep, active minutes from Google Fit',
    requiresAuth: true,
    categories: ['health'],
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar Events',
    description: 'Upcoming meetings, events, and schedule from Google Calendar',
    requiresAuth: true,
    categories: ['calendar', 'productivity'],
  },
  weather: {
    id: 'weather',
    name: 'Weather Forecast',
    description: 'Current weather conditions and forecast',
    requiresAuth: false,
    categories: ['weather'],
  },
  email: {
    id: 'email',
    name: 'Email & Communication',
    description: 'Unread emails, recent messages, priority senders, and actionable items from Gmail',
    requiresAuth: true,
    categories: ['productivity', 'social'],
  },
  // Future data sources - placeholder for now
  mood: {
    id: 'mood',
    name: 'Mood Tracking',
    description: 'Current mood and emotional patterns',
    requiresAuth: false,
    categories: ['health', 'social'],
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment Preferences',
    description: 'Music, movies, shows from Spotify, Netflix, etc.',
    requiresAuth: true,
    categories: ['entertainment'],
  },
  finance: {
    id: 'finance',
    name: 'Financial Data',
    description: 'Spending patterns, budgets, financial goals',
    requiresAuth: true,
    categories: ['finance'],
  },
  home: {
    id: 'home',
    name: 'Smart Home',
    description: 'Smart home device states and controls',
    requiresAuth: true,
    categories: ['home'],
  },
  smarthome: {
    id: 'smarthome',
    name: 'Smart Home Control',
    description: 'Google Smart Home devices, status, controls, energy usage, and automation',
    requiresAuth: true,
    categories: ['home', 'smarthome'],
  },
  amazonmusic: {
    id: 'amazonmusic',
    name: 'Amazon Music',
    description: 'Currently playing music, recent tracks, playlists, listening history, and music preferences',
    requiresAuth: true,
    categories: ['entertainment', 'amazonmusic'],
  },
};

// Intent detection patterns - maps user queries to relevant data sources
export const INTENT_PATTERNS = [
  {
    pattern: /\b(calendar|events|schedule|meeting|appointment|agenda|today|tomorrow|week|busy)\b/i,
    dataSources: ['calendar'],
    examples: ['what\'s on my calendar?', 'my schedule today', 'any meetings?', 'events tomorrow'],
    specific: 'events',
  },
  {
    pattern: /\b(add|create|schedule|book|set up|plan)\s+(meeting|event|appointment|call)\b/i,
    dataSources: ['calendar'],
    examples: ['add a meeting', 'create an event', 'schedule a call', 'book an appointment'],
    specific: 'create_event',
  },
  {
    pattern: /\b(add|create|schedule)\s+.*\s+(at|for|on)\s+\d+/i,
    dataSources: ['calendar'],
    examples: ['add meeting at 8', 'schedule call for 3pm', 'create event at 2'],
    specific: 'create_event',
  },
  {
    pattern: /\b(weather|temperature|rain|sunny|cloudy|forecast|outside|near me|climate)\b/i,
    dataSources: ['weather'],
    examples: ['what\'s the weather?', 'is it raining?', 'temperature today', 'weather near me'],
  },
  {
    pattern: /\b(heart rate|bpm|pulse)\b/i,
    dataSources: ['health'],
    examples: ['what is my heart rate?', 'my bpm', 'current pulse'],
    specific: 'heartRate', // Flag for specific data
  },
  {
    pattern: /\b(steps|step count)\b/i,
    dataSources: ['health'], 
    examples: ['how many steps?', 'step count today'],
    specific: 'steps',
  },
  {
    pattern: /\b(sleep|slept)\b/i,
    dataSources: ['health'],
    examples: ['how did I sleep?', 'sleep last night'],
    specific: 'sleep',
  },
  {
    pattern: /\b(active minutes|activity|exercise minutes)\b/i,
    dataSources: ['health'],
    examples: ['active minutes today', 'how active am I?'],
    specific: 'activeMinutes',
  },
  {
    pattern: /\b(steps|heart rate|sleep|fitness|health|workout|exercise|bpm|calories)\b/i,
    dataSources: ['health'],
    examples: ['steps today', 'heart rate', 'how did I sleep', 'health summary'],
    specific: 'general',
  },
  {
    pattern: /\b(smart home|devices|lights|thermostat|camera|speaker|home automation|control|turn on|turn off)\b/i,
    dataSources: ['smarthome'],
    examples: ['smart home status', 'turn on lights', 'control devices', 'check thermostat', 'home automation'],
    specific: 'general',
  },
  {
    pattern: /\b(lights|lighting|lamp|bulb)\b/i,
    dataSources: ['smarthome'],
    examples: ['turn on lights', 'dim living room lights', 'lighting status'],
    specific: 'lights',
  },
  {
    pattern: /\b(thermostat|temperature|heating|cooling|climate)\b/i,
    dataSources: ['smarthome'],
    examples: ['set thermostat', 'current temperature', 'adjust heating'],
    specific: 'thermostat',
  },
  {
    pattern: /\b(security|camera|lock|alarm|motion)\b/i,
    dataSources: ['smarthome'],
    examples: ['security status', 'camera feed', 'lock doors', 'motion detected'],
    specific: 'security',
  },
  {
    pattern: /\b(energy|power|usage|consumption)\b/i,
    dataSources: ['smarthome'],
    examples: ['energy usage', 'power consumption', 'electricity today'],
    specific: 'energy',
  },
  {
    pattern: /\b(music|song|track|playing|amazon music|spotify|artist|album|playlist)\b/i,
    dataSources: ['amazonmusic'],
    examples: ['what\'s playing?', 'current song', 'my music', 'amazon music', 'what track is this?'],
    specific: 'currentlyPlaying',
  },
  {
    pattern: /\b(recently played|recent music|last played|music history)\b/i,
    dataSources: ['amazonmusic'],
    examples: ['recently played songs', 'recent music', 'what did I listen to?'],
    specific: 'recentTracks',
  },
  {
    pattern: /\b(music stats|listening habits|top songs|music summary|music taste)\b/i,
    dataSources: ['amazonmusic'],
    examples: ['my music stats', 'listening habits', 'top songs', 'music summary'],
    specific: 'stats',
  },
];

export function detectIntent(userQuery: string): { sources: string[], specifics: string[] } {
  const relevantSources = new Set<string>();
  const specifics = new Set<string>();
  
  for (const intent of INTENT_PATTERNS) {
    if (intent.pattern.test(userQuery)) {
      intent.dataSources.forEach(source => relevantSources.add(source));
      if (intent.specific) {
        specifics.add(intent.specific);
      }
    }
  }
  
  // If no patterns match, only fetch data for truly general status queries
  if (relevantSources.size === 0) {
    // Check if it's a general status query
    if (/\b(status|summary|overview|how am i|how's everything|update|dashboard)\b/i.test(userQuery)) {
      return { sources: ['health', 'calendar', 'weather'], specifics: [] };
    }
    // For other unmatched queries, try to be conservative and only return weather as a fallback
    return { sources: ['weather'], specifics: [] };
  }
  
  return { 
    sources: Array.from(relevantSources),
    specifics: Array.from(specifics)
  };
}
