import WidgetCard from "./WidgetCard";
import { Sunrise, CalendarCheck, ListTodo, CloudSun, Bed } from "lucide-react";

interface MorningSummaryWidgetProps {
  className?: string;
}

const MorningSummaryWidget = ({ className }: MorningSummaryWidgetProps) => {
  const summaryItems = [
    { icon: <CalendarCheck className="text-secondary" />, text: "3 meetings scheduled, team sync at 10 AM." },
    { icon: <ListTodo className="text-secondary" />, text: "7 tasks pending, 2 critical for Project Nebula." },
    { icon: <CloudSun className="text-secondary" />, text: "Weather: Clear skies, 24°C. Optimal for outdoor activity." },
    { icon: <Bed className="text-secondary" />, text: "Sleep: 7h 45m (Deep sleep: 82%). Energy levels nominal." },
  ];

  return (
    <WidgetCard title="Morning Transmission // Daily Brief" icon={<Sunrise />} className={className}>
      <div className="space-y-3">
        <p className="text-base text-muted-foreground">Initializing daily parameters, Operator.</p>
        {summaryItems.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 p-2 rounded-md bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
            <div className="flex-shrink-0 mt-1 opacity-70">{item.icon}</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};

export default MorningSummaryWidget;
