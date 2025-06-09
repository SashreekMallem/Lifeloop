
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Smile, BrainCircuit, Frown, Meh, Loader2, AlertTriangle } from "lucide-react";
import { detectMood, type DetectMoodOutput, type DetectMoodInput } from '@/ai/flows/mood-detection';

interface MoodWidgetProps {
  className?: string;
}

const sampleInputs: DetectMoodInput[] = [
  {
    sleepData: "Slept for 7.5 hours, fairly restful, woke up once.",
    activityData: "Morning run 5km, moderate heart rate. Afternoon desk work.",
    calendarEvents: "Team sync at 10 AM, Project deadline review at 3 PM."
  },
  {
    sleepData: "Only 5 hours of broken sleep, feeling tired.",
    activityData: "No significant activity, mostly sedentary.",
    calendarEvents: "Multiple urgent meetings, critical bug report received."
  },
  {
    sleepData: "8 hours of deep sleep, woke up refreshed.",
    activityData: "Yoga session in the morning, light walk in the evening.",
    calendarEvents: "Client presentation went well. Quiet evening planned."
  },
  {
    sleepData: "6 hours, tossed and turned a bit.",
    activityData: "Missed workout, feeling a bit sluggish.",
    calendarEvents: "No major events, routine tasks."
  }
];


const MoodWidget = ({ className }: MoodWidgetProps) => {
  const [moodData, setMoodData] = useState<DetectMoodOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSampleInput, setCurrentSampleInput] = useState<DetectMoodInput | null>(null);

  useEffect(() => {
    // Select a random sample input on mount
    const randomIndex = Math.floor(Math.random() * sampleInputs.length);
    const selectedInput = sampleInputs[randomIndex];
    setCurrentSampleInput(selectedInput);

    const fetchMood = async (input: DetectMoodInput) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await detectMood(input);
        setMoodData(result);
      } catch (err) {
        console.error("Error fetching mood data:", err);
        setError("Failed to analyze affective state. AI core might be experiencing fluctuations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMood(selectedInput);
  }, []);

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
    <WidgetCard title="Affective State // Sentiment Analysis" icon={<BrainCircuit />} className={className}>
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Analyzing sentiment data...</p>
           {currentSampleInput && <p className="text-xs text-muted-foreground/50 mt-1">Based on simulated data...</p>}
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
          <p className="text-sm text-gray-600 px-2 leading-tight max-h-[60px] overflow-y-auto">
            {moodData.summary || "Emotional state assessment pending further data collection."}
          </p>
          {moodData.recommendation && (
            <p className="text-xs text-blue-600 italic px-2 leading-tight">
              💡 {moodData.recommendation}
            </p>
          )}
          {moodData.explanation && (
            <p className="text-xs text-gray-500 mt-1 px-2 max-h-[50px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {moodData.explanation}
            </p>
          )}
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
