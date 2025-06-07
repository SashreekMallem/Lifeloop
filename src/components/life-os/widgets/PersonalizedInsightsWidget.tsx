import WidgetCard from "./WidgetCard";
import { Lightbulb } from "lucide-react";

const PersonalizedInsightsWidget = () => {
  return (
    <WidgetCard title="Personalized Insights" icon={<Lightbulb />}>
      <div className="space-y-2">
        <p className="text-sm">Based on your recent activity, consider scheduling a break around 2 PM to maintain peak productivity.</p>
        <p className="text-sm text-muted-foreground">You've hit your step goal 5 days in a row! Keep it up!</p>
      </div>
    </WidgetCard>
  );
};

export default PersonalizedInsightsWidget;
