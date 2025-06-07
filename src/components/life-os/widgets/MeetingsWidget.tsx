
'use client'; // Required for useState, useEffect if we were to fetch meetings

import React from 'react'; // Keep React import for JSX
import WidgetCard from "./WidgetCard";
import { CalendarClock, Video, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Meeting {
  id: string;
  time: string;
  title: string;
  type: string;
  icon: React.ReactNode;
  duration: string;
}

const MeetingsWidget = () => {
  // Meetings will be fetched from a calendar service or AI flow in a real app
  // For "zero mock data", we start with an empty list.
  const meetings: Meeting[] = [];

  return (
    <WidgetCard title="Comms Schedule // Briefings" icon={<CalendarClock />}>
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <div key={meeting.id} className="flex items-start justify-between p-3 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors group">
              <div className="flex items-start space-x-3">
                <div className="mt-1 opacity-80">{meeting.icon}</div>
                <div>
                  <p className="font-medium text-sm text-foreground/90">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">{meeting.time} - {meeting.type}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary/80 bg-primary/10 group-hover:border-primary/50 group-hover:text-primary">
                {meeting.duration}
              </Badge>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-5 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground p-3">Comms channel clear. No scheduled briefings.</p>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export default MeetingsWidget;
