
'use client'; // Required for useState, useEffect if we were to fetch tasks

import React from 'react'; // Keep React import for JSX
import WidgetCard from "./WidgetCard";
import { ListChecks, CheckCircle2, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

  const pendingTasks = tasks.filter(t => !t.completed).length;

  return (
    <WidgetCard title="Mission Log // Objectives" icon={<ListChecks />}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {tasks.length === 0 ? "No objectives on record. System standing by." : 
           pendingTasks > 0 ? `${pendingTasks} active objective(s). Prioritizing critical tasks.` : "All objectives cleared. System idle."}
        </p>
        {tasks.length > 0 ? (
          <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center space-x-3 p-2.5 rounded-md bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors group">
                <Checkbox 
                  id={task.id} 
                  checked={task.completed} 
                  // onCheckedChange={() => { /* Handle task completion toggle */ }}
                  className="
                    border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground 
                    data-[state=checked]:border-primary transition-all duration-300
                    h-5 w-5 rounded 
                    focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:ring-offset-background
                  "
                />
                <Label 
                  htmlFor={task.id} 
                  className={`flex-grow text-sm ${task.completed ? "line-through text-muted-foreground/70" : "text-foreground/90"} group-hover:text-primary/90 transition-colors cursor-pointer`}
                >
                  {task.label}
                </Label>
                <span className={`text-xs px-2 py-0.5 rounded-full
                  ${task.priority === "High" ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                    task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                    "bg-green-500/20 text-green-400 border border-green-500/30"}
                `}>
                  {task.priority}
                </span>
                {task.completed ? <CheckCircle2 size={18} className="text-green-500" /> : <XCircle size={18} className="text-muted-foreground/50 group-hover:text-red-500/70 transition-colors" />}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-5 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Objective log clear.</p>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export default TasksWidget;
