import WidgetCard from "./WidgetCard";
import { Sunrise } from "lucide-react";

const MorningSummaryWidget = () => {
  return (
    <WidgetCard title="Morning Summary" icon={<Sunrise />}>
      <div className="space-y-2">
        <p className="text-sm font-medium">Good morning! Here's your day at a glance:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>3 meetings scheduled, starting 10 AM.</li>
          <li>7 tasks pending, 2 are high priority.</li>
          <li>Weather: Sunny, 22°C.</li>
          <li>Sleep: 7h 30m (Good quality).</li>
        </ul>
      </div>
    </WidgetCard>
  );
};

export default MorningSummaryWidget;
