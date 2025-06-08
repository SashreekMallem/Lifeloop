
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Clapperboard, Music2, Youtube, Film, Tv, Loader2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { curateEntertainment, type CurateEntertainmentInput, type CurateEntertainmentOutput } from '@/ai/flows/entertainment-curator';

interface EntertainmentWidgetProps {
  className?: string;
}

const sampleInputs: CurateEntertainmentInput[] = [
  { mood: "energetic", availableTime: "30" },
  { mood: "relaxed", availableTime: "90" },
  { mood: "focused", availableTime: "15" }, // Short break
  { mood: "adventurous", availableTime: "120" },
  { mood: "stressed", availableTime: "45" }
];

const EntertainmentWidget = ({ className }: EntertainmentWidgetProps) => {
  const [entertainmentData, setEntertainmentData] = useState<CurateEntertainmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState<CurateEntertainmentInput | null>(null);

  useEffect(() => {
    const fetchEntertainment = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const randomIndex = Math.floor(Math.random() * sampleInputs.length);
        const input = sampleInputs[randomIndex];
        setCurrentInput(input);
        const result = await curateEntertainment(input);
        setEntertainmentData(result);
      } catch (err) {
        console.error("Error fetching entertainment suggestions:", err);
        setError("Failed to load entertainment suggestions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntertainment();
  }, []);
  
  const platformIcons: {[key: string]: React.ReactNode } = {
    "Spotify": <Music2 size={16} className="text-green-400/80"/>,
    "Netflix": <Film size={16} className="text-red-500/80"/>,
    "YouTube": <Youtube size={16} className="text-red-400/80"/>,
    "Series": <Tv size={16} className="text-primary/80"/>,
    "Movie": <Film size={16} className="text-primary/80"/>,
    "Music": <Music2 size={16} className="text-primary/80"/>,
    "Video": <Youtube size={16} className="text-primary/80"/>,
  };

  const getIconForSuggestion = (suggestion: CurateEntertainmentOutput['suggestions'][0]) => {
    if (platformIcons[suggestion.platform]) return platformIcons[suggestion.platform];
    if (suggestion.type.toLowerCase().includes("series")) return platformIcons["Series"];
    if (suggestion.type.toLowerCase().includes("movie")) return platformIcons["Movie"];
    if (suggestion.type.toLowerCase().includes("music")) return platformIcons["Music"];
    return <Clapperboard size={14} className="text-primary/70"/>;
  }

  return (
    <WidgetCard title="Recreation Matrix // Content Feed" icon={<Clapperboard />} className={className}>
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Curating entertainment...</p>
          {currentInput && <p className="text-xs text-muted-foreground/50 mt-1">For mood: {currentInput.mood}, time: {currentInput.availableTime} min</p>}
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
      {!isLoading && !error && entertainmentData && entertainmentData.suggestions && entertainmentData.suggestions.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Downtime protocol for mood: <span className="text-primary">{currentInput?.mood}</span>, time: <span className="text-primary">{currentInput?.availableTime} min</span>.
          </p>
          <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent pr-1">
            {entertainmentData.suggestions.map((item, index) => (
              <a 
                key={index} 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-2.5 rounded-lg glassmorphic hover:border-primary/50 transition-all cursor-pointer group"
              >
                <Image 
                  src={`https://placehold.co/80x60.png`} 
                  alt={item.title} 
                  width={80} 
                  height={60} 
                  className="rounded-md object-cover border border-primary/10 group-hover:border-primary/30 transition-all"
                  data-ai-hint={`${item.type} ${item.platform}`}
                />
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate" title={item.title}>{item.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    {getIconForSuggestion(item)}
                    <span className="ml-1.5 truncate" title={`${item.platform} - ${item.type}`}>{item.platform} - {item.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1 truncate" title={item.description}>{item.description}</p>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
      {!isLoading && !error && (!entertainmentData || !entertainmentData.suggestions || entertainmentData.suggestions.length === 0) && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
            <Clapperboard className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No specific entertainment suggestions for mood: <span className="text-primary/80">{currentInput?.mood}</span> and time: <span className="text-primary/80">{currentInput?.availableTime} min</span>.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export default EntertainmentWidget;
