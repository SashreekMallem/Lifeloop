
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
        // Use placeholder or empty inputs for the flow
        const input: MorningSummaryInput = {
          calendarEvents: "", // Placeholder, to be replaced by real data source
          healthData: "",     // Placeholder, to be replaced by real data source
          otherAppData: ""    // Placeholder, to be replaced by real data source
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
          <div className="p-3 rounded-md bg-card/5 border border-primary/10 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
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
    </WidgetCard>
  );
};

export default MorningSummaryWidget;
