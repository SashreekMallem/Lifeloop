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
  Heart,
  Calendar,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { getHealthSummary, type HealthSummaryInput } from '@/ai/flows/health-data-flow';
import { authManager } from '@/lib/auth-manager';

interface PersonalizedInsightsWidgetProps {
  className?: string;
}

interface Insight {
  id: string;
  icon: React.ReactNode;
  text: string;
  type: string;
}

const PersonalizedInsightsWidget = ({ className }: PersonalizedInsightsWidgetProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generatePersonalizedInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calendarToken = authManager.getToken('calendar');
      const healthToken = authManager.getToken('health');
      const currentUser = authManager.getCurrentUser();

      const generatedInsights: Insight[] = [];

      // Health-based insights
      if (healthToken) {
        try {
          const healthInput: HealthSummaryInput = { oauthToken: healthToken };
          const healthResult = await getHealthSummary(healthInput);
          
          if (healthResult.status === 'success') {
            // Sleep insights
            if (healthResult.sleepDurationMinutes) {
              const sleepHours = healthResult.sleepDurationMinutes / 60;
              if (sleepHours < 7) {
                generatedInsights.push({
                  id: 'sleep-deficit',
                  icon: <Heart size={18} className="text-red-400" />,
                  text: `Sleep optimization needed: ${sleepHours.toFixed(1)}h recorded. Target 7-9h for enhanced cognitive performance.`,
                  type: 'Health'
                });
              } else if (sleepHours >= 8) {
                generatedInsights.push({
                  id: 'sleep-optimal',
                  icon: <Heart size={18} className="text-green-400" />,
                  text: `Sleep pattern optimal: ${sleepHours.toFixed(1)}h recorded. Maintaining excellent recovery protocols.`,
                  type: 'Health'
                });
              }
            }

            // Activity insights
            if (healthResult.steps) {
              if (healthResult.steps < 5000) {
                generatedInsights.push({
                  id: 'activity-low',
                  icon: <Activity size={18} className="text-yellow-400" />,
                  text: `Activity levels suboptimal: ${healthResult.steps} steps. Recommend increasing daily movement for enhanced wellness.`,
                  type: 'Fitness'
                });
              } else if (healthResult.steps >= 10000) {
                generatedInsights.push({
                  id: 'activity-excellent',
                  icon: <Activity size={18} className="text-green-400" />,
                  text: `Activity levels excellent: ${healthResult.steps} steps achieved. Superior movement patterns detected.`,
                  type: 'Fitness'
                });
              }
            }

            // Heart rate insights
            if (healthResult.heartRateBpm) {
              if (healthResult.heartRateBpm > 80) {
                generatedInsights.push({
                  id: 'stress-indicator',
                  icon: <Heart size={18} className="text-orange-400" />,
                  text: `Elevated heart rate detected: ${healthResult.heartRateBpm} BPM. Consider stress management protocols.`,
                  type: 'Wellness'
                });
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch health data for insights:", err);
        }
      }

      // Calendar-based insights
      if (calendarToken && currentUser) {
        try {
          const calendarInput: GetCalendarEventsInput = {
            oauthToken: calendarToken,
            calendarId: 'primary',
            maxResults: 20
          };
          const calendarResult = await getCalendarEvents(calendarInput);
          
          if (calendarResult.status === 'success' && calendarResult.events) {
            const today = new Date();
            const todayEvents = calendarResult.events.filter(event => {
              if (!event.start?.dateTime) return false;
              const eventDate = new Date(event.start.dateTime);
              return eventDate.toDateString() === today.toDateString();
            });

            // Schedule density insights
            if (todayEvents.length >= 6) {
              generatedInsights.push({
                id: 'schedule-dense',
                icon: <Calendar size={18} className="text-red-400" />,
                text: `High-density schedule detected: ${todayEvents.length} events today. Recommend optimizing time blocks for cognitive load management.`,
                type: 'Productivity'
              });
            } else if (todayEvents.length === 0) {
              generatedInsights.push({
                id: 'schedule-open',
                icon: <Calendar size={18} className="text-blue-400" />,
                text: `Open schedule window detected. Optimal opportunity for deep work sessions or strategic planning.`,
                type: 'Productivity'
              });
            }

            // Meeting pattern insights (attendees not available in current API schema)
            const meetingCount = todayEvents.filter(event => 
              (event.summary || '').toLowerCase().includes('meeting') ||
              (event.summary || '').toLowerCase().includes('call') ||
              (event.summary || '').toLowerCase().includes('standup') ||
              (event.summary || '').toLowerCase().includes('sync')
            ).length;

            if (meetingCount >= 4) {
              generatedInsights.push({
                id: 'meeting-overload',
                icon: <TrendingDown size={18} className="text-orange-400" />,
                text: `Meeting saturation detected: ${meetingCount} collaborative sessions. Consider consolidating for efficiency optimization.`,
                type: 'Efficiency'
              });
            }
          }
        } catch (err) {
          console.warn("Failed to fetch calendar data for insights:", err);
        }
      }

      // Default insights if no data available
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          id: 'system-ready',
          icon: <Brain size={18} className="text-primary" />,
          text: "Oracle engine initialized. Connect data sources for enhanced personalized analysis.",
          type: 'System'
        });
      }

      setInsights(generatedInsights);
    } catch (err) {
      console.error("Error generating personalized insights:", err);
      setError("Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generatePersonalizedInsights();
  }, []);

  const handleRefresh = () => {
    generatePersonalizedInsights();
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
      {!isLoading && !error && insights.length > 0 && (
        <div className="space-y-4 h-full">
          {insights.map(insight => (
            <div key={insight.id} className="flex items-start space-x-3 p-3 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
              <div className="flex-shrink-0 mt-1 opacity-80">{insight.icon}</div>
              <div>
                <p className="text-xs text-primary font-medium uppercase tracking-wider">{insight.type} Protocol</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !error && insights.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Brain className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-center">
            Intelligence analysis protocols ready. Awaiting data integration.
          </p>
        </div>
      )}
    </WidgetCard>
  );
};

export default PersonalizedInsightsWidget;
