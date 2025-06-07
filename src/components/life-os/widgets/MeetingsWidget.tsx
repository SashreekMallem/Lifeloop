import WidgetCard from "./WidgetCard";
import { CalendarClock, Video, Users } from "lucide-react"; // CalendarClock for more dynamic feel
import { Badge } from "@/components/ui/badge";

const MeetingsWidget = () => {
  const meetings = [
    { id: "m1", time: "10:00 AM", title: "Project Nebula Sync", type: "Team Update", icon: <Users size={16} className="text-primary/80"/>, duration: "30min" },
    { id: "m2", time: "02:00 PM", title: "Client Demo - Axiom Corp", type: "Client Call", icon: <Video size={16} className="text-secondary/80"/>, duration: "1hr" },
    { id: "m3", time: "04:30 PM", title: "R&D Strategy Session", type: "Internal", icon: <Users size={16} className="text-primary/80"/>, duration: "45min" },
  ];

  return (
    <WidgetCard title="Comms Schedule // Briefings" icon={<CalendarClock />}>
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="flex items-start justify-between p-3 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
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
        ))}
         {meetings.length === 0 && <p className="text-sm text-muted-foreground p-3">Comms channel clear. No scheduled briefings.</p>}
      </div>
    </WidgetCard>
  );
};

export default MeetingsWidget;
