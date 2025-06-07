import WidgetCard from "./WidgetCard";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const IntelligentSuggestionsWidget = () => {
  return (
    <WidgetCard title="Intelligent Suggestions" icon={<Sparkles />}>
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm mb-1">Expiring Soon: Spinach & Eggs</h4>
          <p className="text-xs text-muted-foreground mb-1">Try making a Spinach Omelette for breakfast!</p>
          <Button variant="outline" size="sm">Get Recipe</Button>
        </div>
        <div>
          <h4 className="font-medium text-sm mb-1">Reconnect Opportunity</h4>
          <p className="text-xs text-muted-foreground mb-1">You haven't spoken to Alex Doe in a while. They recently shared an article you might find interesting.</p>
          <Button variant="outline" size="sm">View & Connect</Button>
        </div>
      </div>
    </WidgetCard>
  );
};

export default IntelligentSuggestionsWidget;
