'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Smile, BrainCircuit, Frown, Meh, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectMood, type DetectMoodOutput, type DetectMoodInput } from '@/ai/flows/mood-detection';
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { getHealthSummary, type HealthSummaryInput } from '@/ai/flows/health-data-flow';
import { authManager } from '@/lib/auth-manager';

interface MoodWidgetProps {
  className?: string;
}


const MoodWidget = ({ className }: MoodWidgetProps) => {
  const [moodData, setMoodData] = useState<DetectMoodOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzeRealMoodData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get real data to analyze mood
      const calendarToken = authManager.getToken('calendar');
      const healthToken = authManager.getToken('health');
      const currentUser = authManager.getCurrentUser();

      let sleepData = "Sleep data not available";
      let activityData = "Activity data not available";
      let calendarEvents = "Calendar data not available";

      // Get health data for sleep and activity analysis
      if (healthToken) {
        try {
          const healthInput: HealthSummaryInput = { oauthToken: healthToken };
          const healthResult = await getHealthSummary(healthInput);
          
          if (healthResult.status === 'success') {
            const sleepHours = healthResult.sleepDurationMinutes ? 
              (healthResult.sleepDurationMinutes / 60).toFixed(1) : 'N/A';
            
            if (healthResult.sleepDurationMinutes) {
              const quality = healthResult.sleepDurationMinutes >= 420 ? 'good' : 
                            healthResult.sleepDurationMinutes >= 300 ? 'fair' : 'poor';
              sleepData = `Slept for ${sleepHours} hours, quality: ${quality}`;
            }
            
            if (healthResult.steps) {
              const activityLevel = healthResult.steps >= 10000 ? 'very active' :
                                  healthResult.steps >= 8000 ? 'active' :
                                  healthResult.steps >= 5000 ? 'moderate' : 'low activity';
              activityData = `${healthResult.steps} steps today (${activityLevel})`;
              
              if (healthResult.activeMinutes) {
                activityData += `, ${healthResult.activeMinutes} active minutes`;
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch health data for mood analysis:", err);
        }
      }

      // Get calendar data for stress/workload analysis
      if (calendarToken && currentUser) {
        try {
          const calendarInput: GetCalendarEventsInput = {
            oauthToken: calendarToken,
            calendarId: 'primary',
            maxResults: 10
          };
          const calendarResult = await getCalendarEvents(calendarInput);
          
          if (calendarResult.status === 'success' && calendarResult.events) {
            const todayEvents = calendarResult.events.filter(event => {
              if (!event.start?.dateTime) return false;
              const eventDate = new Date(event.start.dateTime);
              const today = new Date();
              return eventDate.toDateString() === today.toDateString();
            });
            
            if (todayEvents.length === 0) {
              calendarEvents = "Light schedule today, no major events";
            } else if (todayEvents.length <= 3) {
              calendarEvents = `${todayEvents.length} meetings today: ${todayEvents.map(e => e.summary).join(', ')}`;
            } else {
              calendarEvents = `Busy day with ${todayEvents.length} meetings and events`;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch calendar data for mood analysis:", err);
        }
      }

      // Create mood analysis input from real data
      const input: DetectMoodInput = {
        sleepData,
        activityData,
        calendarEvents
      };

      const result = await detectMood(input);
      setMoodData(result);
    } catch (err) {
      console.error("Error analyzing mood:", err);
      setError("Failed to analyze mood. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeRealMoodData();
  }, []);

  const handleRefresh = () => {
    analyzeRealMoodData();
  };

  const getMoodVisuals = (mood?: string) => {
    const lowerCaseMood = mood?.toLowerCase() || "unknown";
    if (lowerCaseMood.includes("positive") || lowerCaseMood.includes("happy") || lowerCaseMood.includes("optimized") || lowerCaseMood.includes("energized") || lowerCaseMood.includes("calm") || lowerCaseMood.includes("good")) {
      return { icon: <Smile className="h-12 w-12 text-green-400 mb-2 group-hover:scale-110 transition-transform" />, color: "text-green-400" };
    }
    if (lowerCaseMood.includes("negative") || lowerCaseMood.includes("sad") || lowerCaseMood.includes("stressed") || lowerCaseMood.includes("tired")) {
      return { icon: <Frown className="h-12 w-12 text-red-400 mb-2 group-hover:scale-110 transition-transform" />, color: "text-red-400" };
    }
    if (lowerCaseMood.includes("neutral") || lowerCaseMood.includes("moderate") || lowerCaseMood.includes("okay")) {
      return { icon: <Meh className="h-12 w-12 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />, color: "text-yellow-400" };
    }
    return { icon: <BrainCircuit className="h-12 w-12 text-primary mb-2 group-hover:scale-110 transition-transform" />, color: "text-primary" }; // Default/Unknown
  };

  const visuals = getMoodVisuals(moodData?.mood);

  return (
    <WidgetCard 
      title="Affective State // Sentiment Analysis" 
      icon={<BrainCircuit />} 
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
          <p className="mt-2 text-muted-foreground">Analyzing sentiment data...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Please allow the system to recalibrate.</p>
        </div>
      )}
      {!isLoading && !error && moodData && (
        <div className="flex flex-col items-center text-center py-2 group h-full justify-center space-y-2">
          {visuals.icon}
          <p className={`text-xl font-bold ${visuals.color}`}>{moodData.mood || "Analysis Inconclusive"}</p>
          <p className="text-sm text-gray-600 px-2 leading-tight">
            {moodData.explanation || "Emotional state assessment pending further data collection."}
          </p>
        </div>
      )}
       {!isLoading && !error && !moodData && (
         <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <BrainCircuit className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Affective state data currently unavailable.</p>
        </div>
      )}
      <div className="absolute top-4 right-4">
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} className="group">
          <RefreshCw className="h-5 w-5 text-muted-foreground transition-transform group-hover:rotate-180" />
        </Button>
      </div>
    </WidgetCard>
  );
};

export default MoodWidget;
