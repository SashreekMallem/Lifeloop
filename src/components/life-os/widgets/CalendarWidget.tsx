
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { CalendarDays, Link, Loader2, AlertTriangle, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarEvents, type GetCalendarEventsInput, type GetCalendarEventsOutput } from '@/ai/flows/calendar-events-flow';
import { app } from '@/lib/firebase/client'; // Import Firebase app
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User, OAuthProvider } from "firebase/auth";

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

  const fetchCalendarEvents = async (userId?: string, token?: string) => {
    console.log("[CalendarWidget] Attempting to fetch events for userId:", userId, "with token:", token ? "present" : "absent");

    if (!userId) {
      setEventsData({ status: "requires_authentication", message: "User not signed in." });
      setIsLoading(false);
      return;
    }

    if (!token) {
      setEventsData({ status: "requires_authentication", message: "OAuth token not available. Please re-authenticate." });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const input: GetCalendarEventsInput = { userId: userId, oauthToken: token };
      console.log("[CalendarWidget] Input to getCalendarEvents flow:", JSON.stringify(input));
      const result = await getCalendarEvents(input);
      console.log("[CalendarWidget] Result from getCalendarEvents flow:", JSON.stringify(result));
      
      if (result.status === "success") {
        setEventsData(result);
      } else if (result.status === "requires_authentication") {
        setError(result.message || "Authentication required by the calendar service. Please try reconnecting your Google Calendar.");
        setEventsData(result); // Keep the status for UI
      } else if (result.status === "error") {
        setError(result.errorMessage || "Failed to load calendar events.");
        setEventsData(result); // Keep the status for UI
      }
    } catch (err: any) {
      console.error("Error fetching calendar events in widget:", err);
      setError(err.message || "An unexpected error occurred while fetching calendar events.");
      setEventsData({ status: "error", errorMessage: err.message || "Client-side error during event fetch."});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[CalendarWidget] onAuthStateChanged - user:", user ? {uid: user.uid, displayName: user.displayName} : null);
      setCurrentUser(user);
      setIsLoadingAuth(false);
      
      if (user) {
        // Attempt to get a fresh OAuth token for Google Calendar API.
        // This is a simplified approach; robust token management is complex.
        try {
          // Firebase ID token is not the same as an OAuth access token for Google APIs.
          // For direct API calls, you'd typically use the access token from the OAuthCredential.
          // However, getting it *again* here without re-triggering popup can be tricky.
          // The token obtained during signInWithPopup is the one to use initially.
          // This part of the example assumes the token management is handled or token is already available.
          // For a *real* app, this token would likely come from a secure store or be refreshed.
          // The `accessToken` from `signInWithPopup` is what we need to pass.
          // We'll rely on the token passed during signIn as there's no simple way to re-fetch it here without UX impact.
          // The token is now retrieved during handleSignIn and passed to fetchCalendarEvents.
          // If the component re-mounts and user is still there, we might not have the token.
          // This is a limitation of client-side token handling.

          // For this iteration, if user exists, we assume token might be stale or missing
          // and rely on re-authentication if `fetchCalendarEvents` is called without a token.
          // The current logic in `handleSignIn` now correctly passes the token.
          // If the page reloads, `handleSignIn` isn't called, so no token.
          // This means after a reload, it will likely show "Connect" or error.
          
          if (sessionStorage.getItem(`firebase_oauth_token_${user.uid}`)) {
            fetchCalendarEvents(user.uid, sessionStorage.getItem(`firebase_oauth_token_${user.uid}`)!);
          } else {
            // No token, user might need to re-authenticate or we just show requires_authentication
             setEventsData({ status: "requires_authentication", message: "Session loaded. Reconnect calendar if events don't appear." });
          }

        } catch (tokenError) {
          console.error("Error getting ID token in onAuthStateChanged:", tokenError);
          setAuthError("Could not retrieve authentication token for calendar.");
          fetchCalendarEvents(user.uid, undefined); // Signal no token
        }
      } else {
        fetchCalendarEvents(undefined, undefined); // User is signed out
        sessionStorage.removeItem(`firebase_oauth_token_current_user`); // Clear any stored token
      }
    });
    return () => unsubscribe();
  }, []);


  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setError(null); 
    const provider = new GoogleAuthProvider();
    // Request scopes for Google Calendar
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        const token = credential.accessToken;
        // Store token (e.g., in state, or for simplicity, session storage for this example)
        // NB: Session storage is not secure for refresh tokens or long-lived tokens in a real app.
        // This is a short-lived access token.
        sessionStorage.setItem(`firebase_oauth_token_${result.user.uid}`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user', result.user.uid); // track who it belongs to

        // onAuthStateChanged will trigger and use this token
        // For immediate fetch after sign-in:
        if (result.user) {
            setCurrentUser(result.user); // Update current user immediately
            fetchCalendarEvents(result.user.uid, token);
        }
      } else {
        throw new Error("No access token received from Google Sign-In.");
      }
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google.");
      setCurrentUser(null); 
      setIsLoadingAuth(false);
      sessionStorage.removeItem('firebase_oauth_token_current_user');
    }
  };

  const handleSignOut = async () => {
    setIsLoadingAuth(true); 
    setAuthError(null);
    setError(null);
    const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user');
    if (currentTokenUserId) {
        sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}`);
    }
    sessionStorage.removeItem('firebase_oauth_token_current_user');
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null and fetchCalendarEvents(undefined) will clear events.
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      setAuthError(error.message || "Failed to sign out.");
    } finally {
      setIsLoadingAuth(false); 
    }
  };


  return (
    <WidgetCard title="Chrono-Stream // Calendar" icon={<CalendarDays />} className={className}>
      {isLoadingAuth && !currentUser && ( // Show authenticating only if no user yet
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
              <p className="mt-2 text-muted-foreground">Loading real calendar events...</p>
            </div>
          )}
          {/* Display operational error or requires_authentication message from eventsData */}
          {!isLoading && (eventsData?.status === "error" || eventsData?.status === "requires_authentication") && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive">
                {eventsData.status === "error" ? eventsData.errorMessage : eventsData.message}
              </p>
              {eventsData.status === "requires_authentication" && !sessionStorage.getItem(`firebase_oauth_token_${currentUser.uid}`) &&
                <Button onClick={handleSignIn} variant="link" className="mt-2">Re-authenticate Google Calendar</Button>
              }
            </div>
          )}
          {!isLoading && eventsData?.status === "success" && eventsData.events && eventsData.events.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent pr-1">
              {eventsData.events.map((event, index) => (
                <div key={index} className="p-2.5 rounded-md bg-card/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <p className="font-medium text-sm text-foreground/90">{event.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.start).toLocaleString([], {dateStyle: 'short', timeStyle: 'short' })} - 
                    {new Date(event.end).toLocaleString([], {timeStyle: 'short' })}
                  </p>
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
        </>
      )}
    </WidgetCard>
  );
};

export default CalendarWidget;
    