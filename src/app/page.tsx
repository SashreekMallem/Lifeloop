import AppHeader from "@/components/life-os/AppHeader";
import TasksWidget from "@/components/life-os/widgets/TasksWidget";
import MeetingsWidget from "@/components/life-os/widgets/MeetingsWidget";
import HealthDataWidget from "@/components/life-os/widgets/HealthDataWidget";
import PersonalizedInsightsWidget from "@/components/life-os/widgets/PersonalizedInsightsWidget";
import LifeXPWidget from "@/components/life-os/widgets/LifeXPWidget";
import IntelligentSuggestionsWidget from "@/components/life-os/widgets/IntelligentSuggestionsWidget";
import EntertainmentWidget from "@/components/life-os/widgets/EntertainmentWidget";
import MorningSummaryWidget from "@/components/life-os/widgets/MorningSummaryWidget";
import MoodWidget from "@/components/life-os/widgets/MoodWidget";
import { Droplets, Zap, Brain, CalendarDays, CheckSquare, Film, TrendingUp, Lightbulb, Coffee } from "lucide-react";

export default function LifeOSDashboard() {
  return (
    <>
      <AppHeader />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-transparent"> {/* Transparent to see body gradient */}
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary neon-text-primary tracking-tight">
            Life OS Command Center
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Welcome back, Operator. System status: Optimal.</p>
        </div>

        {/* Main Dashboard Grid - More dynamic layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Prominent Widgets */}
          <div className="md:col-span-8 lg:col-span-9">
            <MorningSummaryWidget className="min-h-[250px]" />
          </div>
          <div className="md:col-span-4 lg:col-span-3 row-span-1 md:row-span-2">
             <LifeXPWidget className="h-full min-h-[250px] md:min-h-full" />
          </div>
          <div className="md:col-span-12 lg:col-span-5">
            <PersonalizedInsightsWidget className="min-h-[200px]" />
          </div>
           <div className="md:col-span-12 lg:col-span-4">
            <IntelligentSuggestionsWidget className="min-h-[200px]" />
          </div>

          {/* Standard Widgets Row 1 */}
          <div className="md:col-span-6 lg:col-span-4">
            <TasksWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <MeetingsWidget />
          </div>
          <div className="md:col-span-12 lg:col-span-4"> {/* Mood widget takes full width on small, 1/3 on large */}
            <MoodWidget />
          </div>
          
          {/* Standard Widgets Row 2 */}
          <div className="md:col-span-6 lg:col-span-6">
            <HealthDataWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-6">
            <EntertainmentWidget />
          </div>

          {/* Example of other potential widgets */}
          <div className="md:col-span-4">
             <WidgetCard title="Hydration Tracker" icon={<Droplets />} className="min-h-[180px]">
                <p className="text-muted-foreground text-sm">Tracking water intake...</p>
                <div className="w-full h-4 bg-primary/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-primary glowing-accent" style={{width: '65%'}}></div>
                </div>
                <p className="text-center mt-2 text-primary font-semibold">65% Reached</p>
             </WidgetCard>
          </div>
          <div className="md:col-span-4">
             <WidgetCard title="Focus Meter" icon={<Brain />} className="min-h-[180px]">
                <p className="text-muted-foreground text-sm">Current mental load: Moderate</p>
                <div className="relative w-24 h-24 mx-auto mt-3">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-primary/20" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-primary glowing-accent" strokeWidth="3" strokeDasharray="70, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">70%</div>
                </div>
             </WidgetCard>
          </div>
           <div className="md:col-span-4">
             <WidgetCard title="Quick Actions" icon={<Zap />} className="min-h-[180px]">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="glassmorphic hover:border-primary hover:text-primary">Start Focus</Button>
                    <Button variant="outline" className="glassmorphic hover:border-primary hover:text-primary">Log Meal</Button>
                    <Button variant="outline" className="glassmorphic hover:border-primary hover:text-primary">Suggest Music</Button>
                    <Button variant="outline" className="glassmorphic hover:border-primary hover:text-primary">Replan Day</Button>
                </div>
             </WidgetCard>
          </div>

        </div>
      </div>
    </>
  );
}

// Re-import WidgetCard as it's used here directly now for examples
import type React from 'react'; // Keep type import for React type usage
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string; // Added for more control over content area
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, icon, children, className, contentClassName }) => {
  return (
    <Card className={`flex flex-col glassmorphic rounded-xl overflow-hidden shadow-2xl shadow-primary/5 hover:shadow-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-300 ease-out ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 border-b border-primary/10 bg-card/30">
        <div className="flex items-center gap-2">
          {icon && React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 text-primary opacity-80" })}
          <CardTitle className="text-lg font-medium font-headline text-primary/90">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent className={`flex-grow p-4 ${contentClassName}`}>
        {children}
      </CardContent>
    </Card>
  );
};
