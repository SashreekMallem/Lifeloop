
'use client';

import React, { useState, useEffect, useRef } from 'react';
import WidgetCard from "./WidgetCard";
import { CalendarDays, Link, Loader2, AlertTriangle, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarEvents, type GetCalendarEventsInput, type GetCalendarEventsOutput, type CalendarEvent } from '@/ai/flows/calendar-events-flow';
import { app } from '@/lib/firebase/client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from "firebase/auth";

interface CalendarWidgetProps {
  className?: string;
}

const auth = getAuth(app);

// Helper function to safely format date strings
const formatEventDateTime = (dateTimeString?: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateTimeString || typeof dateTimeString !== 'string' || dateTimeString.trim() === '') {
    return 'Time N/A';
  }
  try {
    const date = new Date(dateTimeString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("formatEventDateTime encountered an invalid date string:", dateTimeString);
      return 'Invalid Date';
    }
    return date.toLocaleString([], options);
  } catch (e) {
    console.error("Error formatting date:", dateTimeString, e);
    return 'Date Error';
  }
};


const CalendarWidget = ({ className }: CalendarWidgetProps) => {
  const [eventsData, setEventsData] = useState<GetCalendarEventsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const authStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCalendarEventsWithToken = async (userId?: string, token?: string) => {
    console.log("[CalendarWidget] Attempting to fetch events for userId:", userId, "with token:", token ? "present" : "absent");

    if (!userId) {
      setEventsData({ status: "requires_authentication", message: "User not signed in." });
      setIsLoading(false);
      return;
    }

    if (!token) {
      setEventsData({ status: "requires_authentication", message: "OAuth token not available. Please re-authenticate to fetch events." });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setAuthError(null); 
    try {
      const input: GetCalendarEventsInput = { userId: userId, oauthToken: token, calendarId: 'primary', maxResults: 10 };
      const result = await getCalendarEvents(input);
      
      // Check if the result indicates scope insufficient error - automatically clear token to force re-auth
      if (result.status === "requires_authentication" && 
          (result.message?.includes("insufficient") || result.message?.includes("permissions are insufficient"))) {
        console.log("[CalendarWidget] Detected scope insufficient error, clearing tokens to force re-authentication");
        sessionStorage.removeItem(`firebase_oauth_token_${userId}`);
        sessionStorage.removeItem('firebase_oauth_token_current_user_id');
      }
      
      setEventsData(result); 

    } catch (err: any) {
      console.error("Error fetching calendar events in widget:", err);
      setEventsData({ status: "error", errorMessage: err.message || "Client-side error during event fetch."});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authStateTimeoutRef.current) {
      clearTimeout(authStateTimeoutRef.current);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      
      if (user) {
        const storedTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
        const storedToken = storedTokenUserId === user.uid ? sessionStorage.getItem(`firebase_oauth_token_${user.uid}`) : null;
        
        if (storedToken) {
          fetchCalendarEventsWithToken(user.uid, storedToken);
        } else {
          // Delay setting "token not found" to avoid race conditions during fast sign-out/refresh
          if (authStateTimeoutRef.current) clearTimeout(authStateTimeoutRef.current);
          authStateTimeoutRef.current = setTimeout(() => {
            // Re-check current user status before declaring token absent
            if (auth.currentUser && auth.currentUser.uid === user.uid) {
                const recheckedToken = sessionStorage.getItem(`firebase_oauth_token_${user.uid}`);
                if (!recheckedToken) {
                    console.log("[CalendarWidget] Token still absent for user:", user.uid, "after delay. Setting requires_authentication.");
                    setEventsData({ status: "requires_authentication", message: "OAuth token not found in session. Please connect or re-authenticate." });
                } else {
                    console.log("[CalendarWidget] Token found for user:", user.uid, "after delay. Fetching events.");
                    fetchCalendarEventsWithToken(user.uid, recheckedToken);
                }
            } else {
                 console.log("[CalendarWidget] User changed during token check delay or became null. Current auth.currentUser:", auth.currentUser?.uid);
            }
          }, 100); // 100ms delay
        }
      } else { // User is signed out
        setEventsData({ status: "requires_authentication", message: "User not signed in."});
        const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
        if (currentTokenUserId) {
            sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}`);
        }
        sessionStorage.removeItem('firebase_oauth_token_current_user_id'); 
      }
    });
    
    return () => {
      unsubscribe();
      if (authStateTimeoutRef.current) {
        clearTimeout(authStateTimeoutRef.current);
      }
    };
  }, []);


  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setEventsData(null); 
    const provider = new GoogleAuthProvider();
    // Use full calendar scope (not just calendar.events) to ensure read/write access to calendar events
    provider.addScope('https://www.googleapis.com/auth/calendar'); 
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        const token = credential.accessToken;
        sessionStorage.setItem(`firebase_oauth_token_${result.user.uid}`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id', result.user.uid);
        // onAuthStateChanged will handle fetching events
      } else {
        throw new Error("No access token received from Google Sign-In.");
      }
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google.");
      const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
      if (currentTokenUserId) {
          sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}`);
      }
      sessionStorage.removeItem('firebase_oauth_token_current_user_id');
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setEventsData(null); 
    const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id');
    if (currentTokenUserId) {
        sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}`);
    }
    sessionStorage.removeItem('firebase_oauth_token_current_user_id');
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null and update eventsData.
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      setAuthError(error.message || "Failed to sign out.");
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
          <p className="text-muted-foreground mb-4">Connect your Google Calendar to view and manage events via AI.</p>
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
              Connected: {currentUser.displayName || currentUser.email}
            </p>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive flex-shrink-0">
              <LogOut size={14} className="mr-1" /> Disconnect
            </Button>
          </div>
          {authError && <p className="text-destructive text-sm mb-2">{authError}</p>}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading calendar events...</p>
            </div>
          )}
          {!isLoading && eventsData && (eventsData.status === "error" || eventsData.status === "requires_authentication") && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive text-sm p-2 bg-destructive/10 rounded-md">
                {eventsData.status === "error" ? eventsData.errorMessage : eventsData.message}
              </p>
              {(eventsData.status === "requires_authentication" || 
                eventsData.message?.includes("insufficient authentication scopes") ||
                eventsData.message?.includes("authentication failed")) &&
                <Button onClick={handleSignIn} variant="link" className="mt-2 text-sm text-blue-600">
                  Re-authenticate with Calendar Access
                </Button>
              }
            </div>
          )}
          {!isLoading && eventsData?.status === "success" && eventsData.events && eventsData.events.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent pr-1">
              {eventsData.events.map((event: CalendarEvent, index: number) => (
                <div key={event.id || index} className="p-2.5 rounded-md bg-card/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <p className="font-medium text-sm text-foreground/90">{event.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventDateTime(event.start?.dateTime, {dateStyle: 'short', timeStyle: 'short' })} - 
                    {formatEventDateTime(event.end?.dateTime, {timeStyle: 'short' })}
                  </p>
                   {event.location && <p className="text-xs text-muted-foreground/70">Location: {event.location}</p>}
                </div>
              ))}
            </div>
          )}
          {!isLoading && eventsData?.status === "success" && (!eventsData.events || eventsData.events.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">No upcoming events found in your Google Calendar.</p>
            </div>
          )}
           {!isLoading && !eventsData && currentUser && (
             <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
               <CalendarDays className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
               <p className="text-muted-foreground text-center text-sm">Initializing calendar data...</p>
             </div>
           )}
        </>
      )}
    </WidgetCard>
  );
};

export default CalendarWidget;
