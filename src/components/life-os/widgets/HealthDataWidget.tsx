import WidgetCard from "./WidgetCard";
import { HeartPulse, Footprints, BedDouble, Activity } from "lucide-react"; // Footprints for steps

const HealthDataWidget = () => {
  const healthMetrics = [
    { id: "steps", icon: <Footprints className="text-primary" />, value: "9,752", label: "Neural Steps", unit: "steps" },
    { id: "sleep", icon: <BedDouble className="text-secondary" />, value: "7h 42m", label: "REM Cycle", unit: "optimal" },
    { id: "hr", icon: <HeartPulse className="text-red-400" />, value: "65 bpm", label: "Pulse Rate", unit: "resting" },
     { id: "activity", icon: <Activity className="text-green-400" />, value: "Active", label: "Energy Output", unit: "high" },
  ];

  return (
    <WidgetCard title="Biometric Feed // Vital Signs" icon={<HeartPulse />}>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {healthMetrics.map((metric) => (
          <div key={metric.id} className="glassmorphic p-3 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
            <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1 opacity-80">{metric.icon}</div>
            <p className="font-semibold text-lg text-foreground/90">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="text-xs text-primary/70">{metric.unit}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};

export default HealthDataWidget;
