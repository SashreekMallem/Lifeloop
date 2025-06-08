
'use client';

import React, { useState, useEffect, useRef } from 'react';
import WidgetCard from "./WidgetCard";
import { HeartPulse, Footprints, BedDouble, Activity, Smartphone, Loader2, AlertTriangle, UserCircle, LogOut, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHealthSummary, type HealthSummaryInput, type HealthSummaryOutput } from '@/ai/flows/health-data-flow';
import { app } from '@/lib/firebase/client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from "firebase/auth";

interface HealthDataWidgetProps {
  className?: string;
}

const auth = getAuth(app);

const HealthDataWidget = ({ className }: HealthDataWidgetProps) => {
  const [healthData, setHealthData] = useState<HealthSummaryOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const authStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHealthDataWithToken = async (userId?: string, token?: string) => {
    console.log("[HealthDataWidget] Attempting to fetch health data for userId:", userId, "with token:", token ? "present" : "absent");

    if (!userId || !token) {
      setDataError("User not signed in or OAuth token unavailable for Google Fit.");
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    setDataError(null);
    try {
      const input: HealthSummaryInput = { oauthToken: token };
      const result = await getHealthSummary(input);
      
      if (result.status === "success") {
        setHealthData(result);
      } else if (result.status === "requires_authentication") {
        setDataError(result.message || "Google Fit authentication required. Please re-authenticate.");
        setHealthData(null);
      } else { // error status
        setDataError(result.errorMessage || "Failed to fetch health data from Google Fit.");
        setHealthData(null);
      }
    } catch (err: any) {
      console.error("Error fetching health data in widget:", err);
      setDataError(err.message || "Client-side error during health data fetch.");
      setHealthData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (authStateTimeoutRef.current) clearTimeout(authStateTimeoutRef.current);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      
      if (user) {
        const storedTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_fit');
        const storedToken = storedTokenUserId === user.uid ? sessionStorage.getItem(`firebase_oauth_token_${user.uid}_fit`) : null;
        
        if (storedToken) {
          fetchHealthDataWithToken(user.uid, storedToken);
        } else {
          if (authStateTimeoutRef.current) clearTimeout(authStateTimeoutRef.current);
          authStateTimeoutRef.current = setTimeout(() => {
            if (auth.currentUser && auth.currentUser.uid === user.uid) {
              const recheckedToken = sessionStorage.getItem(`firebase_oauth_token_${user.uid}_fit`);
              if (!recheckedToken) {
                console.log("[HealthDataWidget] Fit Token still absent for user:", user.uid, "after delay.");
                setDataError("Google Fit OAuth token not found. Please connect or re-authenticate.");
                setHealthData(null); 
              } else {
                fetchHealthDataWithToken(user.uid, recheckedToken);
              }
            }
          }, 100);
        }
      } else { // User is signed out
        setDataError("User not signed in.");
        setHealthData(null);
        const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_fit');
        if (currentTokenUserId) {
            sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}_fit`);
        }
        sessionStorage.removeItem('firebase_oauth_token_current_user_id_fit'); 
      }
    });
    
    return () => {
      unsubscribe();
      if (authStateTimeoutRef.current) clearTimeout(authStateTimeoutRef.current);
    };
  }, []);

  const handleSignInFit = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setDataError(null);
    setHealthData(null); 
    const provider = new GoogleAuthProvider();
    // Add Google Fit scopes
    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read'); // For steps, active time
    provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');   // For sleep
    // provider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read'); // For heart rate (future)
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        const token = credential.accessToken;
        sessionStorage.setItem(`firebase_oauth_token_${result.user.uid}_fit`, token);
        sessionStorage.setItem('firebase_oauth_token_current_user_id_fit', result.user.uid);
        // onAuthStateChanged will handle fetching data
      } else {
        throw new Error("No access token received from Google Sign-In for Fit.");
      }
    } catch (error: any) {
      console.error("Error during Google Fit sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google for Fit access.");
      const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_fit');
      if (currentTokenUserId) {
          sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}_fit`);
      }
      sessionStorage.removeItem('firebase_oauth_token_current_user_id_fit');
    }
  };

  const handleSignOutFit = async () => {
    setAuthError(null);
    setDataError(null);
    setHealthData(null);
    const currentTokenUserId = sessionStorage.getItem('firebase_oauth_token_current_user_id_fit');
    if (currentTokenUserId) {
        sessionStorage.removeItem(`firebase_oauth_token_${currentTokenUserId}_fit`);
    }
    sessionStorage.removeItem('firebase_oauth_token_current_user_id_fit');
    // We don't sign out from Firebase itself here, just clear the Fit token
    // If you want full sign out: await signOut(auth);
    // For now, just "disconnect" Fit by clearing its token and data
    setCurrentUser(null); // Force re-render to show sign-in prompt
    setIsLoadingAuth(false); // Ensure auth loading stops
    setDataError("Disconnected from Google Fit. Please connect to see data.");

    // To truly re-trigger onAuthStateChanged for a full Firebase sign-out (if that was intended):
    // await signOut(auth); 
    // However, the current Calendar widget model is to disconnect specific services, not full app logout.
    // So, we simulate a disconnect for Fit.
  };

  const steps = healthData?.status === "success" ? (healthData.steps ?? 'N/A') : 'N/A';
  const sleepMinutes = healthData?.status === "success" ? healthData.sleepDurationMinutes : null;
  let sleepFormatted = 'N/A';
  if (typeof sleepMinutes === 'number') {
    const hours = Math.floor(sleepMinutes / 60);
    const minutes = sleepMinutes % 60;
    sleepFormatted = `${hours}h ${minutes}m`;
  } else if (sleepMinutes === 0) {
      sleepFormatted = "0m";
  }


  return (
    <WidgetCard title="Biometric Feed // Vital Signs (via Google Fit)" icon={<HeartPulse />} className={className}>
      {isLoadingAuth && ( 
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Authenticating for Google Fit...</p>
        </div>
      )}

      {!isLoadingAuth && !currentUser && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <LinkIcon className="h-10 w-10 text-primary mb-3" />
          <p className="text-muted-foreground mb-4">Connect Google Fit to view your activity and sleep data.</p>
          <Button onClick={handleSignInFit} className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <UserCircle className="mr-2" /> Connect Google Fit
          </Button>
          {authError && <p className="text-destructive mt-3 text-sm">{authError}</p>}
        </div>
      )}

      {!isLoadingAuth && currentUser && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-green-400 truncate max-w-[calc(100%-80px)]" title={`Connected for Fit: ${currentUser.displayName || currentUser.email || "User"}`}>
              Fit Connected: {currentUser.displayName || currentUser.email}
            </p>
            <Button onClick={handleSignOutFit} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive flex-shrink-0">
              <LogOut size={14} className="mr-1" /> Disconnect Fit
            </Button>
          </div>
          {authError && <p className="text-destructive text-sm mb-2">{authError}</p>}
          
          {isLoadingData && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading health data...</p>
            </div>
          )}

          {!isLoadingData && dataError && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive text-sm p-2 bg-destructive/10 rounded-md">
                {dataError}
              </p>
              {(dataError.includes("OAuth token") || dataError.includes("authentication")) &&
                <Button onClick={handleSignInFit} variant="link" className="mt-2 text-sm">Re-authenticate Google Fit</Button>
              }
            </div>
          )}
          
          {!isLoadingData && !dataError && healthData?.status === 'success' && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="glassmorphic p-3 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1 opacity-80"><Footprints className="text-primary" /></div>
                <p className="font-semibold text-lg text-foreground/90">{steps}</p>
                <p className="text-xs text-muted-foreground">Steps Today</p>
              </div>
              <div className="glassmorphic p-3 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1 opacity-80"><BedDouble className="text-secondary" /></div>
                <p className="font-semibold text-lg text-foreground/90">{sleepFormatted}</p>
                <p className="text-xs text-muted-foreground">Last Sleep</p>
              </div>
              {/* Placeholder for Heart Rate & Activity - implement fetching for these next */}
              <div className="glassmorphic p-3 rounded-lg text-center border border-primary/10 opacity-50">
                <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1"><HeartPulse className="text-red-400" /></div>
                <p className="font-semibold text-lg">N/A</p>
                <p className="text-xs">Heart Rate</p>
              </div>
              <div className="glassmorphic p-3 rounded-lg text-center border border-primary/10 opacity-50">
                <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1"><Activity className="text-green-400" /></div>
                <p className="font-semibold text-lg">N/A</p>
                <p className="text-xs">Active Time</p>
              </div>
            </div>
          )}
          
          {!isLoadingData && !dataError && healthData?.status !== 'success' && !healthData && currentUser && (
             <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
               <HeartPulse className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
               <p className="text-muted-foreground text-center text-sm">Initializing health data feed...</p>
             </div>
           )}

          <div className="mt-4 pt-3 border-t border-primary/10 text-center">
            <p className="text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5">
              <Smartphone size={14} />
              <span>Apple Health data can be synced via Google Fit on your iPhone.</span>
            </p>
          </div>
        </>
      )}
    </WidgetCard>
  );
};

export default HealthDataWidget;
