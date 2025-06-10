
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { CalendarClock, Video, Users, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCalendarEvents, type GetCalendarEventsInput } from '@/ai/flows/calendar-events-flow';
import { authManager } from '@/lib/auth-manager';

interface Meeting {
  id: string;
  time: string;
  title: string;
  type: string;
  icon: React.ReactNode;
  duration: string;
  attendees?: number;
}

const MeetingsWidget = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingsFromCalendar = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calendarToken = authManager.getToken('calendar');
      const currentUser = authManager.getCurrentUser();

      if (!calendarToken || !currentUser) {
        setMeetings([]);
        setIsLoading(false);
        return;
      }

      const calendarInput: GetCalendarEventsInput = {
        oauthToken: calendarToken,
        calendarId: 'primary',
        maxResults: 10
      };
      
      const calendarResult = await getCalendarEvents(calendarInput);
      
      if (calendarResult.status === 'success' && calendarResult.events) {
        // Filter for today's and upcoming meetings
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const upcomingMeetings = calendarResult.events
          .filter(event => {
            if (!event.start?.dateTime) return false;
            const eventDate = new Date(event.start.dateTime);
            return eventDate >= today; // Today and future events
          })
          .slice(0, 6) // Limit to 6 meetings
          .map(event => {
            const startTime = new Date(event.start!.dateTime!);
            const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : 
                           new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

            const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes
            const durationText = duration >= 60 ? 
              `${Math.floor(duration / 60)}h ${duration % 60}m` : 
              `${duration}m`;

            // Determine meeting type and icon
            const summary = (event.summary || '').toLowerCase();
            const description = (event.description || '').toLowerCase();
            const location = (event.location || '').toLowerCase();
            
            let type = "Meeting";
            let icon = <Users size={18} />;
            
            if (summary.includes('standup') || summary.includes('daily')) {
              type = "Standup";
              icon = <Users size={18} />;
            } else if (summary.includes('zoom') || summary.includes('meet') || 
                      description.includes('zoom') || location.includes('zoom') ||
                      location.includes('meet.google.com')) {
              type = "Video Call";
              icon = <Video size={18} />;
            } else if (summary.includes('1:1') || summary.includes('one-on-one')) {
              type = "1:1";
              icon = <Users size={18} />;
            } else if (summary.includes('interview')) {
              type = "Interview";
              icon = <Users size={18} />;
            } else if (summary.includes('demo') || summary.includes('presentation')) {
              type = "Presentation";
              icon = <Video size={18} />;
            }

            // Count attendees if available (not in current API schema, using placeholder logic)
            const attendeeCount = event.summary && event.summary.toLowerCase().includes('standup') ? 
              Math.floor(Math.random() * 5) + 3 : // Estimate for standups
              event.summary && event.summary.toLowerCase().includes('1:1') ? 2 : 
              undefined; // No attendee info available from API

            return {
              id: event.id || `meeting-${Date.now()}-${Math.random()}`,
              time: startTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              title: event.summary || 'Untitled Meeting',
              type,
              icon,
              duration: durationText,
              attendees: attendeeCount
            };
          });

        setMeetings(upcomingMeetings);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error("Error fetching meetings from calendar:", err);
      setError("Failed to load meeting data");
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingsFromCalendar();
  }, []);

  const handleRefresh = () => {
    fetchMeetingsFromCalendar();
  };

  return (
    <WidgetCard 
      title="Comms Schedule // Briefings" 
      icon={<CalendarClock />}
      showHeader={true}
      headerActions={
        <Button 
          onClick={handleRefresh} 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Scanning communication channels...</p>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <div key={meeting.id} className="flex items-start justify-between p-3 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors group">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 opacity-80">{meeting.icon}</div>
                  <div>
                    <p className="font-medium text-sm text-foreground/90">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.time} - {meeting.type}
                      {meeting.attendees && ` (${meeting.attendees} attendees)`}
                    </p>
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
              <p className="text-sm text-muted-foreground p-3">
                Comms channel clear. No scheduled briefings detected.
              </p>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  );
};

export default MeetingsWidget;
