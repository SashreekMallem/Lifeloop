
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { Lightbulb, Zap, Users, Loader2, AlertTriangle, Utensils, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggest, type SuggestInput, type SuggestOutput } from '@/ai/flows/intelligent-suggestions';

interface IntelligentSuggestionsWidgetProps {
  className?: string;
}

const sampleInputs: SuggestInput[] = [
  {
    expiringIngredients: ["Chicken breast", "Broccoli", "Lemon"],
    historicalContacts: ["Dr. Aris Thorne (last contacted 2 months ago - research collaboration)", "Maya Lin (last contacted 3 weeks ago - project update)"],
    userPreferences: "Prefers healthy, quick meals. Interested in reconnecting with professional contacts for potential collaborations."
  },
  {
    expiringIngredients: ["Tofu", "Spinach", "Mushrooms"],
    historicalContacts: ["Alex Chen (last contacted 1 week ago - casual check-in)", "Sarah Miller (last contacted 4 months ago - old colleague)"],
    userPreferences: "Vegetarian, enjoys trying new recipes. Needs to follow up with recent contacts and consider reaching out to long-lost connections."
  },
  {
    expiringIngredients: [],
    historicalContacts: ["John Doe (last contacted 5 days ago - pending task)"],
    userPreferences: "User is focused on task completion and might not be looking for new recipes or extensive social outreach today."
  }
];


const IntelligentSuggestionsWidget = ({ className }: IntelligentSuggestionsWidgetProps) => {
  const [suggestions, setSuggestions] = useState<SuggestOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const randomIndex = Math.floor(Math.random() * sampleInputs.length);
        const input = sampleInputs[randomIndex];
        const result = await suggest(input);
        setSuggestions(result);
      } catch (err) {
        console.error("Error fetching intelligent suggestions:", err);
        setError("Failed to load suggestions. AI core may be recalibrating.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  return (
    <WidgetCard title="Cognitive Feed // Suggestions" icon={<Lightbulb />} className={className}>
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
