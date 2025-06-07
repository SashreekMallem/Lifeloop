
import WidgetCard from "./WidgetCard";
import { Award, Star, TrendingUp, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LifeXPWidgetProps {
  className?: string;
}

const LifeXPWidget = ({ className }: LifeXPWidgetProps) => {
  const currentXP = 0; // Start with 0 XP
  const nextLevelXP = 15000; // Goal remains the same for now
  const progressPercent = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

  return (
    <WidgetCard title="Life OS // Progression Matrix" icon={<Zap />} className={className}>
      <div className="space-y-4 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-3xl font-bold text-primary neon-text-primary">{currentXP.toLocaleString()} XP</p>
            <div className="flex items-center gap-1">
              {/* Icons can remain as visual flair, or be conditional on XP tiers later */}
              <Star className="h-5 w-5 text-muted-foreground/50" />
              <Star className="h-5 w-5 text-muted-foreground/50" />
              <Award className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Next Tier: {nextLevelXP.toLocaleString()} XP</p>
        </div>

        <div className="my-auto">
          <Progress value={progressPercent} className="h-3 bg-primary/10 rounded-full overflow-hidden" indicatorClassName="bg-primary glowing-accent rounded-full" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {Math.round(progressPercent)}% to Tier Advancement
          </p>
        </div>

        <div className="text-center mt-auto">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            {/* <TrendingUp size={16} /> No XP gained yet today. */}
            System monitoring for progression events.
          </p>
          <p className="text-xs text-muted-foreground">Engage systems for optimal progression.</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export default LifeXPWidget;
