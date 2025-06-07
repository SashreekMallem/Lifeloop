
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Sunrise, CalendarCheck, ListTodo, CloudSun, Bed, Loader2, AlertTriangle } from "lucide-react";
import { generateMorningSummary, type MorningSummaryOutput, type MorningSummaryInput } from '@/ai/flows/morning-summary';

interface MorningSummaryWidgetProps {
  className?: string;
}

const MorningSummaryWidget = ({ className }: MorningSummaryWidgetProps) => {
  const [summaryData, setSummaryData] = useState<MorningSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Mock input data for now
        const input: MorningSummaryInput = {
          calendarEvents: "Team sync at 10 AM, Project Phoenix review at 2 PM, Dinner with Alex at 7 PM.",
          healthData: "Slept 7.5 hours (Deep sleep: 75%), 7200 steps yesterday, Resting heart rate: 62bpm.",
          otherAppData: "Deadline for Q3 financial report is EOD Friday. Stock market is trending upwards."
        };
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

  // Original summary items, kept for structure if AI fails or as a fallback concept
  const staticSummaryItems = [
    { icon: <CalendarCheck className="text-secondary" />, text: "3 meetings scheduled, team sync at 10 AM." },
    { icon: <ListTodo className="text-secondary" />, text: "7 tasks pending, 2 critical for Project Nebula." },
    { icon: <CloudSun className="text-secondary" />, text: "Weather: Clear skies, 24°C. Optimal for outdoor activity." },
    { icon: <Bed className="text-secondary" />, text: "Sleep: 7h 45m (Deep sleep: 82%). Energy levels nominal." },
  ];

  return (
    <WidgetCard title="Morning Transmission // Daily Brief" icon={<Sunrise />} className={className}>
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
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{summaryData.summary}</p>
          </div>
        </div>
      )}
      {/* Fallback display if AI fails and no error message shown (e.g. if error state is not comprehensive) */}
      {!isLoading && !error && !summaryData && (
         <div className="space-y-3">
          <p className="text-base text-muted-foreground">No summary available. Displaying static intel:</p>
          {staticSummaryItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 p-2 rounded-md bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
              <div className="flex-shrink-0 mt-1 opacity-70">{item.icon}</div>
              <p className="text-sm text-foreground/90 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
};

export default MorningSummaryWidget;
