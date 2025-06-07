import WidgetCard from "./WidgetCard";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MeetingsWidget = () => {
  const meetings = [
    { id: "m1", time: "10:00 AM", title: "Team Sync", duration: "30min" },
    { id: "m2", time: "02:00 PM", title: "Client Call - Project Phoenix", duration: "1hr" },
  ];

  return (
    <WidgetCard title="Upcoming Meetings" icon={<CalendarDays />}>
      <div className="space-y-3">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="flex items-start justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">{meeting.title}</p>
              <p className="text-xs text-muted-foreground">{meeting.time}</p>
            </div>
            <Badge variant="outline">{meeting.duration}</Badge>
          </div>
        ))}
         {meetings.length === 0 && <p className="text-sm text-muted-foreground">No upcoming meetings.</p>}
      </div>
    </WidgetCard>
  );
};

export default MeetingsWidget;
