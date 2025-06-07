import WidgetCard from "./WidgetCard";
import { Lightbulb, Zap, Users } from "lucide-react"; // Zap for energy, Users for connections
import { Button } from "@/components/ui/button";

interface IntelligentSuggestionsWidgetProps {
  className?: string;
}

const IntelligentSuggestionsWidget = ({ className }: IntelligentSuggestionsWidgetProps) => {
  return (
    <WidgetCard title="Cognitive Feed // Suggestions" icon={<Lightbulb />} className={className}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-card/5 border border-primary/10 hover:border-primary/30 transition-all">
          <div className="flex items-center mb-1">
            <Zap size={18} className="text-yellow-400 mr-2" />
            <h4 className="font-medium text-base text-foreground/90">Energy Optimization</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Analysis indicates peak cognitive performance window in 25 minutes. Initiate Focus Protocol?</p>
          <Button variant="outline" size="sm" className="glassmorphic hover:border-primary hover:text-primary text-xs">Activate Focus Protocol</Button>
        </div>
        <div className="p-3 rounded-lg bg-card/5 border border-primary/10 hover:border-primary/30 transition-all">
          <div className="flex items-center mb-1">
            <Users size={18} className="text-blue-400 mr-2" />
            <h4 className="font-medium text-base text-foreground/90">Network Synergy</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Dr. Aris Thorne (Project Chimera collaborator) is active. Opportune moment for brief sync?</p>
          <Button variant="outline" size="sm" className="glassmorphic hover:border-primary hover:text-primary text-xs">Initiate Comms</Button>
        </div>
      </div>
    </WidgetCard>
  );
};

export default IntelligentSuggestionsWidget;
