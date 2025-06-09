"use client";

import React, { useState, useEffect } from "react";
import WidgetCard from "./WidgetCard";
import {
  Brain,
  Zap,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// Assuming a flow for insights might exist or be created later.
// For now, we'll show a loading/empty state.
// import { getPersonalizedInsights, type PersonalizedInsight } from '@/ai/flows/personalized-insights-flow'; // Example import

interface PersonalizedInsightsWidgetProps {
  className?: string;
}

// Define a type for individual insights if we were fetching them
// type Insight = {
//   id: string;
//   icon: React.ReactNode;
//   text: string;
//   type: string;
// };

const PersonalizedInsightsWidget = ({ className }: PersonalizedInsightsWidgetProps) => {
  // const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Set to true if fetching data
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchInsights = async () => {
  //     setIsLoading(true);
  //     setError(null);
  //     try {
  //       // const result = await getPersonalizedInsights(); // Call to hypothetical flow
  //       // setInsights(transformApiResultToInsights(result)); // Transform data if needed
  //       // For now, simulate no insights
  //       setInsights([]);
  //     } catch (err) {
  //       console.error("Error fetching personalized insights:", err);
  //       setError("Failed to load insights.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   // fetchInsights(); // Uncomment when ready to fetch
  // }, []);

  const handleRefresh = () => {
    // Placeholder for future insights refresh functionality
    console.log("Personalized insights refreshed");
  };

  return (
    <WidgetCard
      title="Oracle Engine // Personalized Intel"
      icon={<Brain />}
      className={className}
      showHeader={true}
      headerActions={
        <Button 
          onClick={handleRefresh} 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary"
        >
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Analyzing data streams...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
      {!isLoading && !error && ( // Removed check for insights.length > 0
        <div className="space-y-4 h-full">
          {/* This section would be populated if insights were available */}
          {/* {insights.map(insight => (
            <div key={insight.id} className="flex items-start space-x-3 p-3 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
              <div className="flex-shrink-0 mt-1 opacity-80">{insight.icon}</div>
              <div>
                <p className="text-xs text-primary font-medium uppercase tracking-wider">{insight.type} Protocol</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          ))} */}
          {/* Display message if no insights and not loading/error */}
          <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
            <Lightbulb className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              No new personalized intel at this time. System is monitoring.
            </p>
          </div>
        </div>
      )}
    </WidgetCard>
  );
};

export default PersonalizedInsightsWidget;
