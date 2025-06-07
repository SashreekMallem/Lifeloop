import WidgetCard from "./WidgetCard";
import { Smile, BrainCircuit } from "lucide-react"; // BrainCircuit for a more techy feel

const MoodWidget = () => {
  const moodStatus = "Optimized"; // Could be: Stressed, Focused, Calm, Energized
  const moodColor = "text-green-400"; // Dynamic based on mood: "text-yellow-400", "text-blue-400", "text-red-400"
  const moodIcon = <Smile className={`h-12 w-12 ${moodColor} mb-2 group-hover:scale-110 transition-transform`} />; // Dynamic icon too

  return (
    <WidgetCard title="Affective State // Sentiment Analysis" icon={<BrainCircuit />}>
      <div className="flex flex-col items-center text-center py-2 group">
        {moodIcon}
        <p className={`text-2xl font-bold ${moodColor}`}>{moodStatus}</p>
        <p className="text-sm text-muted-foreground mt-1 px-2">
          Vitals stable. Cognitive functions operating at peak efficiency based on current parameters.
        </p>
      </div>
    </WidgetCard>
  );
};

export default MoodWidget;
