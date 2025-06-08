
import WidgetCard from "./WidgetCard";
import { HeartPulse, Footprints, BedDouble, Activity, Smartphone } from "lucide-react"; // Smartphone to hint at device sync

const HealthDataWidget = ({ className }: { className?: string }) => {
  const healthMetrics = [
    { id: "steps", icon: <Footprints className="text-primary" />, value: "9,752", label: "Steps", unit: "from Fit" },
    { id: "sleep", icon: <BedDouble className="text-secondary" />, value: "7h 42m", label: "Sleep", unit: "from Fit" },
    { id: "hr", icon: <HeartPulse className="text-red-400" />, value: "65 bpm", label: "Heart Rate", unit: "from Fit" },
    { id: "activity", icon: <Activity className="text-green-400" />, value: "Active", label: "Energy", unit: "from Fit" },
  ];

  return (
    <WidgetCard title="Biometric Feed // Vital Signs (via Google Fit)" icon={<HeartPulse />} className={className}>
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
      <div className="mt-4 pt-3 border-t border-primary/10 text-center">
        <p className="text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5">
          <Smartphone size={14} />
          <span>Connect Apple Health to Google Fit on your iPhone to see your data here.</span>
        </p>
         <p className="text-xs text-muted-foreground/60 mt-1">Data shown is illustrative.</p>
      </div>
    </WidgetCard>
  );
};

export default HealthDataWidget;
