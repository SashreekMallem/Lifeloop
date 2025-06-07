
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Smile, BrainCircuit, Frown, Meh, Loader2, AlertTriangle } from "lucide-react"; // Added more icons
import { detectMood, type DetectMoodOutput, type DetectMoodInput } from '@/ai/flows/mood-detection';

const MoodWidget = () => {
  const [moodData, setMoodData] = useState<DetectMoodOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMood = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Mock input data for now
        const input: DetectMoodInput = {
          sleepData: "Slept for 6 hours, woke up twice. Sleep quality: 65%",
          activityData: "Completed a 30-minute light workout. Total steps: 3500.",
          calendarEvents: "Upcoming: Project deadline review. Past: Team conflict resolution meeting."
        };
        const result = await detectMood(input);
        setMoodData(result);
      } catch (err) {
        console.error("Error fetching mood data:", err);
        setError("Failed to analyze affective state. AI core might be experiencing fluctuations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMood();
  }, []);

  const getMoodVisuals = (mood?: string) => {
    const lowerCaseMood = mood?.toLowerCase() || "unknown";
    if (lowerCaseMood.includes("positive") || lowerCaseMood.includes("happy") || lowerCaseMood.includes("optimized") || lowerCaseMood.includes("energized") || lowerCaseMood.includes("calm")) {
      return { icon: <Smile className="h-12 w-12 text-green-400 mb-2 group-hover:scale-110 transition-transform" />, color: "text-green-400" };
    }
    if (lowerCaseMood.includes("negative") || lowerCaseMood.includes("sad") || lowerCaseMood.includes("stressed")) {
      return { icon: <Frown className="h-12 w-12 text-red-400 mb-2 group-hover:scale-110 transition-transform" />, color: "text-red-400" };
    }
    if (lowerCaseMood.includes("neutral") || lowerCaseMood.includes("moderate")) {
      return { icon: <Meh className="h-12 w-12 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />, color: "text-yellow-400" };
    }
    return { icon: <BrainCircuit className="h-12 w-12 text-primary mb-2 group-hover:scale-110 transition-transform" />, color: "text-primary" }; // Default/Unknown
  };

  const visuals = getMoodVisuals(moodData?.mood);

  return (
    <WidgetCard title="Affective State // Sentiment Analysis" icon={<BrainCircuit />}>
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
        <div className="flex flex-col items-center text-center py-2 group">
          {visuals.icon}
          <p className={`text-2xl font-bold ${visuals.color}`}>{moodData.mood || "Analysis Inconclusive"}</p>
          <p className="text-sm text-muted-foreground mt-2 px-2 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
            {moodData.explanation || "Unable to provide detailed explanation at this time."}
          </p>
        </div>
      )}
       {!isLoading && !error && !moodData && (
         <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <BrainCircuit className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Affective state data currently unavailable.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export default MoodWidget;
