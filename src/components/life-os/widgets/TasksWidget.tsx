'use client'; // Required for useState, useEffect if we were to fetch tasks

import React from 'react'; // Keep React import for JSX
import WidgetCard from "./WidgetCard";
import { ListChecks, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  label: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

const TasksWidget = () => {
  // Tasks will be fetched or managed by a state management solution in a real app
  // For "zero mock data", we start with an empty list.
  const tasks: Task[] = []; 

  const handleRefresh = () => {
    // Placeholder for future task refresh functionality
    console.log("Tasks widget refreshed");
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
        >
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {tasks.length === 0 ? "No objectives on record. System standing by." : 
           pendingTasks > 0 ? `${pendingTasks} active objective(s). Prioritizing critical tasks.` : "All objectives cleared. System idle."}
        </p>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
            <ListChecks className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground text-center">Task management system ready for deployment.</p>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export default TasksWidget;
