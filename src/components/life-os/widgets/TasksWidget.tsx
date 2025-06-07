import WidgetCard from "./WidgetCard";
import { CheckSquare, ListChecks } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const TasksWidget = () => {
  const tasks = [
    { id: "task1", label: "Morning summary review", completed: true },
    { id: "task2", label: "Project Alpha presentation prep", completed: false },
    { id: "task3", label: "Call with design team", completed: false },
  ];

  return (
    <WidgetCard title="Today's Tasks" icon={<ListChecks />}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">You have {tasks.filter(t => !t.completed).length} pending tasks.</p>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center space-x-2">
              <Checkbox id={task.id} checked={task.completed} />
              <Label htmlFor={task.id} className={task.completed ? "line-through text-muted-foreground" : ""}>
                {task.label}
              </Label>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
};

export default TasksWidget;
