import WidgetCard from "./WidgetCard";
import { Award, Star, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const LifeXPWidget = () => {
  return (
    <WidgetCard title="Life XP" icon={<TrendingUp />}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-semibold text-primary">12,450 XP</p>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-5 w-5 fill-current" />
            <Star className="h-5 w-5 fill-current" />
            <Award className="h-5 w-5 fill-current" />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Next Level: 15,000 XP</p>
          <Progress value={(12450 / 15000) * 100} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground">You earned +250 XP today for completing tasks and hitting your health goals!</p>
      </div>
    </WidgetCard>
  );
};

export default LifeXPWidget;
