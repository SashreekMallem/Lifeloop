
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { CalendarDays, Link, Loader2, AlertTriangle, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarEvents, type GetCalendarEventsInput, type GetCalendarEventsOutput } from '@/ai/flows/calendar-events-flow';
import { app } from '@/lib/firebase/client'; // Import Firebase app
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from "firebase/auth";

interface CalendarWidgetProps {
  className?: string;
}

const auth = getAuth(app);

const CalendarWidget = ({ className }: CalendarWidgetProps) => {
  const [eventsData, setEventsData] = useState<GetCalendarEventsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (user) {
        fetchCalendarEvents(user.uid); // Fetch events if user is logged in
      } else {
        setEventsData(null); // Clear events if user logs out
      }
    });
    return () => unsubscribe();
  }, []);


  const fetchCalendarEvents = async (userId: string) => {
    if (!currentUser) {
        setError("Please connect your Google Calendar to view events.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // For now, the flow doesn't use the userId or token directly,
      // but we pass it to simulate future authenticated calls
      const input: GetCalendarEventsInput = { userId: userId, oauthToken: "mock_token_for_now" };
      const result = await getCalendarEvents(input);
      
      if (result.status === "requires_authentication") {
        setError("Authentication required. Please connect your Google Calendar.");
        setEventsData(null);
      } else if (result.status === "error") {
        setError(result.errorMessage || "Failed to load calendar events.");
        setEventsData(null);
      } else {
        setEventsData(result);
      }
    } catch (err: any) {
      console.error("Error fetching calendar events:", err);
      setError(err.message || "An unexpected error occurred while fetching calendar events.");
      setEventsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    // Add scope for Google Calendar API
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting currentUser and fetching events
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google.");
      setCurrentUser(null); // Ensure user is null on error
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoadingAuth(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will handle clearing currentUser and eventsData
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      setAuthError(error.message || "Failed to sign out.");
      setIsLoadingAuth(false); // Ensure loading state is cleared
    }
  };


  return (
    <WidgetCard title="Chrono-Stream // Calendar" icon={<CalendarDays />} className={className}>
      {isLoadingAuth && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Authenticating...</p>
        </div>
      )}

      {!isLoadingAuth && !currentUser && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <Link className="h-10 w-10 text-primary mb-3" />
          <p className="text-muted-foreground mb-4">Connect your Google Calendar to view upcoming events.</p>
          <Button onClick={handleSignIn} className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <UserCircle className="mr-2" /> Connect Google Calendar
          </Button>
          {authError && <p className="text-destructive mt-3 text-sm">{authError}</p>}
        </div>
      )}

      {!isLoadingAuth && currentUser && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-green-400">Calendar Connected: {currentUser.displayName || currentUser.email}</p>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <LogOut size={14} className="mr-1" /> Disconnect
            </Button>
          </div>
          {authError && <p className="text-destructive text-sm mb-2">{authError}</p>}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading events...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive">{error}</p>
            </div>
          )}
          {!isLoading && !error && eventsData?.status === "success" && eventsData.events && eventsData.events.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent pr-1">
              {eventsData.events.map((event, index) => (
                <div key={index} className="p-2.5 rounded-md bg-card/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <p className="font-medium text-sm text-foreground/90">{event.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
          {!isLoading && !error && eventsData?.status === "success" && (!eventsData.events || eventsData.events.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">No upcoming events found in your calendar.</p>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
};

export default CalendarWidget;
