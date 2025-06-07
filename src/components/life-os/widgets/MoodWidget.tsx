import WidgetCard from "./WidgetCard";
import { Smile, BrainCog } from "lucide-react";

const MoodWidget = () => {
  return (
    <WidgetCard title="Current Mood" icon={<BrainCog />}>
      <div className="flex flex-col items-center text-center">
        <Smile className="h-16 w-16 text-green-500 mb-2" />
        <p className="text-xl font-semibold">Feeling Productive</p>
        <p className="text-sm text-muted-foreground mt-1">
          Based on your good sleep, completed tasks, and upcoming focused work blocks.
        </p>
      </div>
    </WidgetCard>
  );
};

export default MoodWidget;
