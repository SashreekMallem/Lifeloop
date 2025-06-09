'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Sunrise, CalendarCheck, ListTodo, CloudSun, Bed, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMorningSummary, type MorningSummaryOutput, type MorningSummaryInput } from '@/ai/flows/morning-summary';

interface MorningSummaryWidgetProps {
  className?: string;
}

const sampleInputs: MorningSummaryInput[] = [
  {
    calendarEvents: "Today: 10 AM Project Alpha sync, 2 PM Client Demo. Tomorrow: Team workshop.",
    healthData: "Sleep: 7h 30m (Good), Steps: 8,500 (Active), Heart Rate: Resting 62bpm.",
    otherAppData: "Tasks: 3 high-priority tasks due. Weather: Sunny, 24°C. News: Tech stocks rally."
  },
  {
    calendarEvents: "Light schedule today. Dentist appointment at 4 PM.",
    healthData: "Sleep: 6h (Restless), Steps: 2,100 (Low), Heart Rate: Resting 70bpm.",
    otherAppData: "Tasks: 1 overdue task. Weather: Cloudy with chance of rain. Focus Mode: Scheduled for 2 hours this afternoon."
  },
  {
    calendarEvents: "Packed day: Morning marathon of meetings (9 AM - 1 PM), followed by an evening networking event.",
    healthData: "Sleep: 8h (Excellent), Steps: 12,000 (Very Active), Heart Rate: Resting 58bpm.",
    otherAppData: "Tasks: All caught up! Weather: Clear skies, perfect for the event. Reminders: Pick up dry cleaning."
  }
];

const MorningSummaryWidget = ({ className }: MorningSummaryWidgetProps) => {
  const [summaryData, setSummaryData] = useState<MorningSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const randomIndex = Math.floor(Math.random() * sampleInputs.length);
        const input = sampleInputs[randomIndex];
        const result = await generateMorningSummary(input);
        setSummaryData(result);
      } catch (err) {
        console.error("Error fetching morning summary:", err);
        setError("Failed to load morning summary. The AI core might be offline.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const randomIndex = Math.floor(Math.random() * sampleInputs.length);
      const input = sampleInputs[randomIndex];
      const result = await generateMorningSummary(input);
      setSummaryData(result);
    } catch (err) {
      console.error("Error fetching morning summary:", err);
      setError("Failed to load morning summary. The AI core might be offline.");
    } finally {
      setIsLoading(false);
    }
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
