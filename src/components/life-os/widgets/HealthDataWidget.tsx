import WidgetCard from "./WidgetCard";
import { Heart, Activity, BedDouble } from "lucide-react";

const HealthDataWidget = () => {
  return (
    <WidgetCard title="Health Overview" icon={<Heart />}>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <Activity className="mx-auto h-8 w-8 text-primary mb-1" />
          <p className="font-semibold text-lg">8,203</p>
          <p className="text-xs text-muted-foreground">Steps</p>
        </div>
        <div>
          <BedDouble className="mx-auto h-8 w-8 text-primary mb-1" />
          <p className="font-semibold text-lg">7h 15m</p>
          <p className="text-xs text-muted-foreground">Sleep</p>
        </div>
        <div>
          <Heart className="mx-auto h-8 w-8 text-primary mb-1 fill-primary" />
          <p className="font-semibold text-lg">68 bpm</p>
          <p className="text-xs text-muted-foreground">Resting HR</p>
        </div>
      </div>
    </WidgetCard>
  );
};

export default HealthDataWidget;
