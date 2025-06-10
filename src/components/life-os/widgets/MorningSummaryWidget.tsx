'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Sunrise, CalendarCheck, ListTodo, CloudSun, Bed, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMorningSummary, type MorningSummaryOutput, type MorningSummaryInput } from '@/ai/flows/morning-summary';
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { getHealthSummary, type HealthSummaryInput } from '@/ai/flows/health-data-flow';
import { getWeatherForecast, type WeatherForecastInput } from '@/ai/flows/weather-forecast-flow';
import { authManager } from '@/lib/auth-manager';

interface MorningSummaryWidgetProps {
  className?: string;
}

const MorningSummaryWidget = ({ className }: MorningSummaryWidgetProps) => {
  const [summaryData, setSummaryData] = useState<MorningSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealDataAndGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get OAuth tokens
      const calendarToken = authManager.getToken('calendar');
      const healthToken = authManager.getToken('health');
      const currentUser = authManager.getCurrentUser();

      // Fetch real data from APIs
      let calendarEvents = "No calendar access";
      let healthData = "No health data access";
      let otherAppData = "";

      // Fetch calendar events if token available
      if (calendarToken && currentUser) {
        try {
          const calendarInput: GetCalendarEventsInput = {
            oauthToken: calendarToken,
            calendarId: 'primary',
            maxResults: 5
          };
          const calendarResult = await getCalendarEvents(calendarInput);
          
          if (calendarResult.status === 'success' && calendarResult.events) {
            const events = calendarResult.events.slice(0, 3);
            if (events.length > 0) {
              calendarEvents = events.map(event => {
                const time = event.start?.dateTime ? 
                  new Date(event.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 
                  'All day';
                return `${time} ${event.summary}`;
              }).join(', ');
            } else {
              calendarEvents = "No events scheduled for today";
            }
          }
        } catch (err) {
          console.warn("Failed to fetch calendar events for morning summary:", err);
        }
      }

      // Fetch health data if token available
      if (healthToken) {
        try {
          const healthInput: HealthSummaryInput = { oauthToken: healthToken };
          const healthResult = await getHealthSummary(healthInput);
          
          if (healthResult.status === 'success') {
            const sleepHours = healthResult.sleepDurationMinutes ? 
              (healthResult.sleepDurationMinutes / 60).toFixed(1) : 'N/A';
            healthData = `Sleep: ${sleepHours}h, Steps: ${healthResult.steps || 0}, Heart Rate: ${healthResult.heartRateBpm || 'N/A'}bpm`;
          }
        } catch (err) {
          console.warn("Failed to fetch health data for morning summary:", err);
        }
      }

      // Fetch weather data
      try {
        const weatherInput: WeatherForecastInput = { location: "Cumming, Georgia" };
        const weatherResult = await getWeatherForecast(weatherInput);
        
        // Weather API returns data directly without status wrapper
        otherAppData = `Weather: ${weatherResult.condition}, ${weatherResult.temperature} in ${weatherResult.locationName}`;
      } catch (err) {
        console.warn("Failed to fetch weather data for morning summary:", err);
        otherAppData = "Weather data unavailable";
      }

      // Generate morning summary with real data
      const input: MorningSummaryInput = {
        calendarEvents,
        healthData,
        otherAppData
      };

      const result = await generateMorningSummary(input);
      setSummaryData(result);
    } catch (err) {
      console.error("Error generating morning summary:", err);
      setError("Failed to generate morning summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealDataAndGenerateSummary();
  }, []);

  const handleRefresh = () => {
    fetchRealDataAndGenerateSummary();
  };

  return (
    <WidgetCard 
      title="Morning Transmission // Daily Brief" 
      icon={<Sunrise />} 
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
        <div className="flex items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Synthesizing daily parameters...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Please try again later or check system status.</p>
        </div>
      )}
      {!isLoading && !error && summaryData && (
        <div className="space-y-3">
          <p className="text-base text-muted-foreground">Initializing daily parameters, Operator.</p>
          <div className="p-3 rounded-md bg-card/5 border border-primary/10">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{summaryData.summary || "No summary data available at this moment."}</p>
          </div>
        </div>
      )}
      {!isLoading && !error && !summaryData && (
         <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Sunrise className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Morning brief not yet available.</p>
        </div>
      )}
      <div className="absolute top-4 right-4">
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </WidgetCard>
  );
};

export default MorningSummaryWidget;
