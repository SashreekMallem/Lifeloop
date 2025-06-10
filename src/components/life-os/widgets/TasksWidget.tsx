'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { ListChecks, CheckCircle2, XCircle, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { authManager } from '@/lib/auth-manager';

interface Task {
  id: string;
  label: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
  source: "calendar" | "extracted";
}

const TasksWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractTasksFromCalendar = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calendarToken = authManager.getToken('calendar');
      const currentUser = authManager.getCurrentUser();

      if (!calendarToken || !currentUser) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      const calendarInput: GetCalendarEventsInput = {
        oauthToken: calendarToken,
        calendarId: 'primary',
        maxResults: 20
      };
      
      const calendarResult = await getCalendarEvents(calendarInput);
      
      if (calendarResult.status === 'success' && calendarResult.events) {
        // Extract task-like events from calendar
        const extractedTasks: Task[] = [];
        
        calendarResult.events.forEach(event => {
          const summary = event.summary?.toLowerCase() || '';
          const description = event.description?.toLowerCase() || '';
          
          // Look for task-like patterns in calendar events
          const isTaskLike = 
            summary.includes('todo') ||
            summary.includes('task') ||
            summary.includes('complete') ||
            summary.includes('deadline') ||
            summary.includes('due') ||
            summary.includes('finish') ||
            summary.includes('submit') ||
            summary.includes('review') ||
            summary.includes('follow up') ||
            description.includes('todo') ||
            description.includes('task') ||
            description.includes('complete');

          if (isTaskLike) {
            // Determine priority based on event properties
            let priority: "High" | "Medium" | "Low" = "Medium";
            
            if (summary.includes('urgent') || summary.includes('asap') || 
                summary.includes('critical') || summary.includes('important')) {
              priority = "High";
            } else if (summary.includes('low priority') || summary.includes('when possible')) {
              priority = "Low";
            }

            // Check if task appears to be completed
            const isCompleted = 
              summary.includes('completed') ||
              summary.includes('done') ||
              summary.includes('finished') ||
              description.includes('completed');

            extractedTasks.push({
              id: event.id || `task-${Date.now()}-${Math.random()}`,
              label: event.summary || 'Untitled Task',
              completed: isCompleted,
              priority,
              source: 'calendar'
            });
          }
        });

        // Add some extracted tasks from event patterns if we have events but no obvious task events
        if (extractedTasks.length === 0 && calendarResult.events.length > 0) {
          const upcomingEvents = calendarResult.events
            .filter(event => event.start?.dateTime)
            .slice(0, 3);

          upcomingEvents.forEach(event => {
            extractedTasks.push({
              id: `prep-${event.id}`,
              label: `Prepare for: ${event.summary}`,
              completed: false,
              priority: "Medium",
              source: 'extracted'
            });
          });
        }

        setTasks(extractedTasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error extracting tasks from calendar:", err);
      setError("Failed to load task data");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    extractTasksFromCalendar();
  }, []);

  const handleRefresh = () => {
    extractTasksFromCalendar();
  };

  const pendingTasks = tasks.filter(t => !t.completed).length;

  return (
    <WidgetCard 
      title="Mission Log // Objectives" 
      icon={<ListChecks />}
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
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Analyzing mission parameters...</p>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tasks.length === 0 ? "No objectives detected. System standing by." : 
             pendingTasks > 0 ? `${pendingTasks} active objective(s) identified from calendar analysis.` : "All objectives cleared. System optimal."}
          </p>
          
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
              <ListChecks className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Task detection protocols active. Connect calendar for enhanced analysis.
              </p>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between p-2 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
                  <div className="flex items-start space-x-2">
                    {task.completed ? (
                      <CheckCircle2 size={16} className="text-green-400 mt-1" />
                    ) : (
                      <XCircle size={16} className="text-muted-foreground mt-1" />
                    )}
                    <div>
                      <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>
                        {task.label}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {task.source === 'calendar' ? 'Calendar' : 'Auto-detected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  );
};

export default TasksWidget;
