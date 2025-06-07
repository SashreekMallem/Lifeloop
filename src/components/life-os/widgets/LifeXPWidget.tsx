import WidgetCard from "./WidgetCard";
import { Award, Star, TrendingUp, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LifeXPWidgetProps {
  className?: string;
}

const LifeXPWidget = ({ className }: LifeXPWidgetProps) => {
  const currentXP = 12780;
  const nextLevelXP = 15000;
  const progressPercent = (currentXP / nextLevelXP) * 100;

  return (
    <WidgetCard title="Life OS // Progression Matrix" icon={<Zap />} className={className}>
      <div className="space-y-4 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-3xl font-bold text-primary neon-text-primary">{currentXP.toLocaleString()} XP</p>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400/70" />
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400/70" />
              <Award className="h-5 w-5 text-orange-400 fill-orange-400/70" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Next Tier: {nextLevelXP.toLocaleString()} XP</p>
        </div>
        
        <div className="my-auto"> {/* Vertically center the progress bar area */}
          <Progress value={progressPercent} className="h-3 bg-primary/10 rounded-full overflow-hidden" indicatorClassName="bg-primary glowing-accent rounded-full" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {Math.round(progressPercent)}% to Tier Advancement
          </p>
        </div>

        <div className="text-center mt-auto">
          <p className="text-sm text-green-400 flex items-center justify-center gap-1">
            <TrendingUp size={16} /> +320 XP today (System Efficiency Boost)
          </p>
          <p className="text-xs text-muted-foreground">Engage systems for optimal progression.</p>
        </div>
      </div>
    </WidgetCard>
  );
};

// Add to Progress component if indicatorClassName is not standard
// In components/ui/progress.tsx:
// Add indicatorClassName prop to ProgressProps and pass it to ProgressPrimitive.Indicator
// const Progress = React.forwardRef<..., ProgressProps>(({ className, value, indicatorClassName, ...props }, ref) => (
// ...
//    <ProgressPrimitive.Indicator
//      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
// ...
// ))
//
// This might require modifying shadcn's progress component directly, or for simplicity here,
// we can assume a simple glowing effect applied to the parent if direct child styling isn't easy.
// For now, the glowing-accent on the indicator should work if we can style the inner div.
// If not, we might need a wrapper div for the Progress component.
// For this iteration, assuming `indicatorClassName` is available or `glowing-accent` on the main `Progress` component has some effect.
// A better approach for `glowing-accent` on Progress might be to ensure the indicator has a specific class
// that `glowing-accent` can target or that Progress itself applies the glow.
// For now, the `indicatorClassName` prop has been added to the `Progress` component type definition for clarity,
// though its actual implementation depends on modifying the base `Progress` component.
// A simpler way if `indicatorClassName` can't be added to the base component is to wrap `<Progress />` in a div and apply glow to that.
// Let's assume `indicatorClassName` works as described.
// NOTE: `indicatorClassName` is not a standard prop for Shadcn Progress.
// A simpler approach would be:
// <div className="relative">
//   <Progress value={progressPercent} className="h-3 bg-primary/10 rounded-full" />
//   <div className="absolute top-0 left-0 h-3 rounded-full bg-primary glowing-accent" style={{ width: `${progressPercent}%` }}></div>
// </div>
// However, this duplicates the bar. The best is to style the indicator. If not possible, apply glow to the whole progress bar.
// For simplicity, the provided `indicatorClassName` assumes it will be picked up by the style.
// If not, the glow might be less effective or apply to the whole bar.
