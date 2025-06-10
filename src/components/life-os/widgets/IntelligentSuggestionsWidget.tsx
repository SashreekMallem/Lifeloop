'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Lightbulb, Zap, Users, Loader2, AlertTriangle, Utensils, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggest, type SuggestInput, type SuggestOutput } from '@/ai/flows/intelligent-suggestions';
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { getHealthSummary, type HealthSummaryInput } from '@/ai/flows/health-data-flow';
import { authManager } from '@/lib/auth-manager';

interface IntelligentSuggestionsWidgetProps {
  className?: string;
}

const IntelligentSuggestionsWidget = ({ className }: IntelligentSuggestionsWidgetProps) => {
  const [suggestions, setSuggestions] = useState<SuggestOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateRealSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get real data to inform suggestions
      const calendarToken = authManager.getToken('calendar');
      const healthToken = authManager.getToken('health');
      const currentUser = authManager.getCurrentUser();

      // Gather context data
      let userContext = "User preferences: Prefers productive, healthy lifestyle choices.";
      let contacts: string[] = [];
      let upcomingEvents: string[] = [];

      // Get calendar context for contact suggestions
      if (calendarToken && currentUser) {
        try {
          const calendarInput: GetCalendarEventsInput = {
            oauthToken: calendarToken,
            calendarId: 'primary',
            maxResults: 10
          };
          const calendarResult = await getCalendarEvents(calendarInput);
          
          if (calendarResult.status === 'success' && calendarResult.events) {
            // Extract contacts from calendar events (attendees not available in API response)
            const recentContacts = new Set<string>();
            calendarResult.events.forEach(event => {
              // Note: Calendar API doesn't return attendees in the current schema
              // Instead, we can suggest contacts based on meeting titles or descriptions
              if (event.summary && (event.summary.includes('with') || event.summary.includes('meeting'))) {
                // Extract potential contact info from event summaries
                const summary = event.summary.toLowerCase();
                if (summary.includes('with ')) {
                  const contactMatch = event.summary.match(/with\s+([^,\n]+)/i);
                  if (contactMatch) {
                    recentContacts.add(`${contactMatch[1].trim()} (from ${event.summary})`);
                  }
                }
              }
            });
            contacts = Array.from(recentContacts).slice(0, 3);
            
            // Track upcoming events for scheduling suggestions
            upcomingEvents = calendarResult.events
              .filter(event => event.start?.dateTime)
              .slice(0, 2)
              .map(event => event.summary || 'Untitled event');
          }
        } catch (err) {
          console.warn("Failed to fetch calendar data for suggestions:", err);
        }
      }

      // Get health context for wellness suggestions
      if (healthToken) {
        try {
          const healthInput: HealthSummaryInput = { oauthToken: healthToken };
          const healthResult = await getHealthSummary(healthInput);
          
          if (healthResult.status === 'success') {
            const sleepHours = healthResult.sleepDurationMinutes ? 
              (healthResult.sleepDurationMinutes / 60) : 0;
            
            if (sleepHours < 7) {
              userContext += " May benefit from better sleep habits.";
            }
            if ((healthResult.steps || 0) < 8000) {
              userContext += " Could increase daily activity.";
            }
            if (healthResult.heartRateBpm && healthResult.heartRateBpm > 80) {
              userContext += " May benefit from stress management techniques.";
            }
          }
        } catch (err) {
          console.warn("Failed to fetch health data for suggestions:", err);
        }
      }

      // Create intelligent input based on real data
      const input: SuggestInput = {
        expiringIngredients: [], // Could be integrated with grocery/meal planning apps
        historicalContacts: contacts.length > 0 ? contacts : [
          "Consider reaching out to colleagues for networking",
          "Schedule catch-up calls with friends",
          "Follow up on pending conversations"
        ],
        userPreferences: userContext + 
          (upcomingEvents.length > 0 ? ` Upcoming: ${upcomingEvents.join(', ')}.` : " Schedule is flexible today.")
      };

      const result = await suggest(input);
      setSuggestions(result);
    } catch (err) {
      console.error("Error generating intelligent suggestions:", err);
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateRealSuggestions();
  }, []);

  const handleRefresh = () => {
    generateRealSuggestions();
  };

  return (
    <WidgetCard 
      title="Cognitive Feed // Suggestions" 
      icon={<Lightbulb />} 
      className={className}
      showHeader={true}
      headerActions={
        <Button 
          onClick={handleRefresh} 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Generating intelligent suggestions...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
      {!isLoading && !error && suggestions && (
        <div className="space-y-4">
          {suggestions.recipeSuggestion && (
            <div className="p-3 rounded-lg bg-card/5 border border-primary/10 hover:border-primary/30 transition-all">
              <div className="flex items-center mb-1">
                <Utensils size={18} className="text-green-400 mr-2" />
                <h4 className="font-medium text-base text-foreground/90">Recipe Idea</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{suggestions.recipeSuggestion}</p>
            </div>
          )}
          {suggestions.contactSuggestion && (
            <div className="p-3 rounded-lg bg-card/5 border border-primary/10 hover:border-primary/30 transition-all">
              <div className="flex items-center mb-1">
                <MessageSquare size={18} className="text-blue-400 mr-2" />
                <h4 className="font-medium text-base text-foreground/90">Connection Prompt</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{suggestions.contactSuggestion}</p>
            </div>
          )}
          {!suggestions.recipeSuggestion && !suggestions.contactSuggestion && (
             <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
                <Lightbulb className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No specific suggestions at this moment.</p>
            </div>
          )}
        </div>
      )}
       {!isLoading && !error && !suggestions && (
         <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
            <Lightbulb className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No suggestions available currently.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export default IntelligentSuggestionsWidget;
