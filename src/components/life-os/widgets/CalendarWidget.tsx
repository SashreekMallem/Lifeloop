
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

  const fetchCalendarEvents = async (userId?: string) => {
    console.log("[CalendarWidget] Attempting to fetch events for userId:", userId);

    if (!userId) {
      // Handles cases where user is logged out or uid is not available.
      // UI should primarily reflect logged-out state based on currentUser.
      // Clearing eventsData ensures no stale data is shown.
      setEventsData(null);
      setIsLoading(false); // Ensure loading is stopped if it was on
      // No specific error set here as it's an expected state (logged out).
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous operational errors before a new fetch
    try {
      const input: GetCalendarEventsInput = { userId: userId, oauthToken: "mock_token_for_now" };
      console.log("[CalendarWidget] Input to getCalendarEvents flow:", JSON.stringify(input));
      const result = await getCalendarEvents(input);
      console.log("[CalendarWidget] Result from getCalendarEvents flow:", JSON.stringify(result));
      
      if (result.status === "success") {
        setEventsData(result);
      } else if (result.status === "requires_authentication") {
        setError(result.message || "Authentication required by the calendar service. Please try reconnecting your Google Calendar if issues persist.");
        setEventsData(null);
      } else if (result.status === "error") {
        setError(result.errorMessage || "Failed to load calendar events.");
        setEventsData(null);
      }
    } catch (err: any) {
      console.error("Error fetching calendar events in widget:", err);
      setError(err.message || "An unexpected error occurred while fetching calendar events.");
      setEventsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[CalendarWidget] onAuthStateChanged - user:", user ? {uid: user.uid, displayName: user.displayName} : null);
      setCurrentUser(user); // Update currentUser for UI (display name, disconnect button)
      setIsLoadingAuth(false);
      
      // Call fetchCalendarEvents with user?.uid.
      // If user is null, user.uid will be undefined, and fetchCalendarEvents will handle it by not fetching.
      fetchCalendarEvents(user?.uid); 
    });
    return () => unsubscribe();
  }, []);


  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setError(null); // Clear operational errors as well
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting currentUser and triggering event fetch
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google.");
      setCurrentUser(null); 
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoadingAuth(true); // Visually indicate action is happening
    setAuthError(null);
    setError(null);
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null and fetchCalendarEvents(undefined) will clear events.
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      setAuthError(error.message || "Failed to sign out.");
      setIsLoadingAuth(false); 
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
            <p className="text-xs text-green-400 truncate max-w-[calc(100%-80px)]" title={currentUser.displayName || currentUser.email || "User"}>
              Calendar Connected: {currentUser.displayName || currentUser.email}
            </p>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive flex-shrink-0">
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
          {error && !isLoading && ( // Display operational error if present
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
           {/* Case for when flow status is not success, and not loading, and no specific error message from flow (e.g. requires_auth was handled but no events) */}
           {!isLoading && !error && eventsData && eventsData.status !== "success" && (
             <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-muted-foreground text-center">Could not retrieve events. Status: {eventsData.status}.</p>
             </div>
           )}
        </>
      )}
    </WidgetCard>
  );
};

export default CalendarWidget;
