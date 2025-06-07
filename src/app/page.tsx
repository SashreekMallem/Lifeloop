
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
import WeatherWidget from "@/components/life-os/widgets/WeatherWidget";
// Removed Droplets, Zap, Brain as example widgets are being removed.

export default function LifeOSDashboard() {
  return (
    <>
      <AppHeader />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-transparent">
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary neon-text-primary tracking-tight">
            Life OS Command Center
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Welcome back, Operator. System status: Optimal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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

          <div className="md:col-span-6 lg:col-span-4">
            <TasksWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <MeetingsWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <WeatherWidget className="min-h-[280px]"/>
          </div>
          
          <div className="md:col-span-6 lg:col-span-4">
            <MoodWidget className="min-h-[200px]"/>
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <HealthDataWidget />
          </div>
          <div className="md:col-span-6 lg:col-span-4">
            <EntertainmentWidget />
          </div>

          {/* Example static widgets removed to achieve "zero mock data" state */}
          {/* Placeholder for future widgets that will fetch real data */}

        </div>
      </div>
    </>
  );
}

// Local WidgetCard definition removed as it's no longer used on this page.
// The global WidgetCard from 'src/components/life-os/widgets/WidgetCard.tsx' is used by the integrated widgets.
