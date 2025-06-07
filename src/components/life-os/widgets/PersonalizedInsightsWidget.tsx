import WidgetCard from "./WidgetCard";
import { Brain, Zap, TrendingDown } from "lucide-react"; // Brain for AI insights

interface PersonalizedInsightsWidgetProps {
  className?: string;
}

const PersonalizedInsightsWidget = ({ className }: PersonalizedInsightsWidgetProps) => {
  const insights = [
    { id: "insight1", icon: <Zap size={20} className="text-yellow-400"/>, text: "Productivity analysis: Peak performance window between 10:00-11:30 AM. Consider scheduling deep work.", type: "Performance"},
    { id: "insight2", icon: <TrendingDown size={20} className="text-orange-400"/>, text: "Sleep deficit detected (-45m). Recommend +30m REM cycle tonight for optimal recovery.", type: "Recovery"},
  ];

  return (
    <WidgetCard title="Oracle Engine // Personalized Intel" icon={<Brain />} className={className}>
      <div className="space-y-4">
        {insights.map(insight => (
          <div key={insight.id} className="flex items-start space-x-3 p-3 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
            <div className="flex-shrink-0 mt-1 opacity-80">{insight.icon}</div>
            <div>
              <p className="text-xs text-primary font-medium uppercase tracking-wider">{insight.type} Protocol</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{insight.text}</p>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};

export default PersonalizedInsightsWidget;
