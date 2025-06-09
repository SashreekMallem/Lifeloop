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
  categories: z.array(z.enum(['health', 'calendar', 'weather', 'entertainment', 'social', 'productivity', 'finance', 'home'])),
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
    pattern: /\b(weather|temperature|rain|sunny|cloudy|forecast|outside)\b/i,
    dataSources: ['weather'],
    examples: ['what\'s the weather?', 'is it raining?', 'temperature today'],
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
  
  // If no patterns match, return a default set for general queries
  if (relevantSources.size === 0) {
    return { sources: ['health', 'calendar', 'weather'], specifics: [] };
  }
  
  return { 
    sources: Array.from(relevantSources),
    specifics: Array.from(specifics)
  };
}
