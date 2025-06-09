'use client';

import React, { useState, useEffect, useRef } from 'react';
import WidgetCard from "./WidgetCard";
import { HeartPulse, Footprints, BedDouble, Activity, Smartphone, Loader2, AlertTriangle, UserCircle, LogOut, LinkIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHealthSummary, type HealthSummaryInput, type HealthSummaryOutput } from '@/ai/flows/health-data-flow';
import { app } from '@/lib/firebase/client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { authManager } from '@/lib/auth-manager';

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
      setHealthData(null); // Clear old data
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

  const handleRefresh = async () => {
    if (currentUser) {
      const token = authManager.getToken('health');
      if (token) {
        await fetchHealthDataWithToken(currentUser.uid, token);
      }
    }
  };

  useEffect(() => {
    // Set up auth state monitoring through centralized manager
    const unsubscribeAuthManager = authManager.onAuthStateChange((user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      
      if (user) {
        const token = authManager.getToken('health');
        
        if (token) {
          fetchHealthDataWithToken(user.uid, token);
        } else {
          console.log("[HealthDataWidget] No health token found for user:", user.uid);
          setDataError("Google Fit OAuth token not found. Please connect or re-authenticate.");
          setHealthData(null);
        }
      } else {
        setDataError("User not signed in to view health data.");
        setHealthData(null);
        authManager.clearAllTokens();
      }
    });
    
    return () => {
      unsubscribeAuthManager();
      if (authStateTimeoutRef.current) clearTimeout(authStateTimeoutRef.current);
    };
  }, []);

  const handleSignInFit = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setDataError(null);
    setHealthData(null); 
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        const token = credential.accessToken;
        // Store token using centralized auth manager
        authManager.storeToken('health', token, result.user.uid);
        // The auth state change listener will handle fetching data
      } else {
        throw new Error("No access token received from Google Sign-In for Fit.");
      }
    } catch (error: any) {
      console.error("Error during Google Fit sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google for Fit access.");
      // Clear any partial tokens on error
      authManager.removeToken('health');
      setIsLoadingAuth(false);
    }
  };

  const handleSignOutFit = async () => {
    setAuthError(null);
    setDataError(null);
    setHealthData(null);
    
    // Clear tokens through auth manager
    authManager.removeToken('health');
    
    // Set immediate UI feedback
    setCurrentUser(null); 
    setIsLoadingAuth(false);
    setDataError("Disconnected from Google Fit. Please connect to see data.");
  };

  const steps = healthData?.status === "success" ? (healthData.steps ?? 'N/A') : 'N/A';
  const sleepMinutes = healthData?.status === "success" ? healthData.sleepDurationMinutes : null;
  const activeMinutes = healthData?.status === "success" ? (healthData.activeMinutes ?? 'N/A') : 'N/A';
  const heartRateBpm = healthData?.status === "success" ? (healthData.heartRateBpm ?? 'N/A') : 'N/A';
  
  let sleepFormatted = 'N/A';
  if (typeof sleepMinutes === 'number') {
    if (sleepMinutes === 0) {
      sleepFormatted = "0m";
    } else {
      const hours = Math.floor(sleepMinutes / 60);
      const minutes = sleepMinutes % 60;
      sleepFormatted = `${hours}h ${minutes}m`;
    }
  }


  return (
    <WidgetCard title="Biometric Feed // Vital Signs (Google Fit)" icon={<HeartPulse />} className={className}>
      {isLoadingAuth && ( 
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Authenticating for Google Fit...</p>
        </div>
      )}

      {!isLoadingAuth && !currentUser && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <LinkIcon className="h-10 w-10 text-primary mb-3" />
          <p className="text-muted-foreground mb-4">Connect Google Fit to view your activity, sleep, and heart rate data.</p>
          <Button onClick={handleSignInFit} className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <UserCircle className="mr-2" /> Connect Google Fit
          </Button>
          {authError && <p className="text-destructive mt-3 text-sm">{authError}</p>}
        </div>
      )}

      {!isLoadingAuth && currentUser && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-green-600 truncate max-w-[calc(100%-170px)]" title={`Connected for Fit: ${currentUser.displayName || currentUser.email || "User"}`}>
              Fit Connected: {currentUser.displayName || currentUser.email}
            </p>
            <div className="flex items-center gap-1">
              <Button 
                onClick={handleRefresh} 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-blue-600 flex-shrink-0"
                disabled={isLoadingData}
              >
                <RefreshCw size={14} className={`mr-1 ${isLoadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleSignOutFit} variant="ghost" size="sm" className="text-gray-600 hover:text-red-600 flex-shrink-0">
                <LogOut size={14} className="mr-1" /> Disconnect Fit
              </Button>
            </div>
          </div>
          {authError && <p className="text-red-600 text-sm mb-2">{authError}</p>}
          
          {isLoadingData && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading health data...</p>
            </div>
          )}

          {!isLoadingData && dataError && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-red-600 text-sm p-2 bg-red-50 rounded-md">
                {dataError}
              </p>
              {(dataError.includes("OAuth token") || dataError.includes("authentication") || dataError.includes("expired")) &&
                <Button onClick={handleSignInFit} variant="link" className="mt-2 text-sm text-blue-600">Re-authenticate Google Fit</Button>
              }
            </div>
          )}
          
          {!isLoadingData && !dataError && healthData?.status === 'success' && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="glassmorphic p-2.5 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                <div className="mx-auto h-7 w-7 flex items-center justify-center mb-0.5 opacity-80"><Footprints className="text-blue-600" /></div>
                <p className="font-semibold text-md text-gray-800">{steps}</p>
                <p className="text-xs text-gray-600">Steps</p>
              </div>
              <div className="glassmorphic p-2.5 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                <div className="mx-auto h-7 w-7 flex items-center justify-center mb-0.5 opacity-80"><BedDouble className="text-purple-600" /></div>
                <p className="font-semibold text-md text-gray-800">{sleepFormatted}</p>
                <p className="text-xs text-gray-600">Sleep</p>
              </div>
              <div className="glassmorphic p-2.5 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                <div className="mx-auto h-7 w-7 flex items-center justify-center mb-0.5 opacity-80"><HeartPulse className="text-red-500" /></div>
                <p className="font-semibold text-md text-gray-800">{heartRateBpm}{typeof heartRateBpm === 'number' ? <span className="text-xs text-gray-600"> bpm</span> : ''}</p>
                <p className="text-xs text-gray-600">Heart Rate</p>
              </div>
              <div className="glassmorphic p-2.5 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                <div className="mx-auto h-7 w-7 flex items-center justify-center mb-0.5 opacity-80"><Activity className="text-green-500" /></div>
                <p className="font-semibold text-md text-gray-800">{activeMinutes}{typeof activeMinutes === 'number' ? <span className="text-xs text-gray-600"> min</span> : ''}</p>
                <p className="text-xs text-gray-600">Active Time</p>
              </div>
            </div>
          )}
          
          {!isLoadingData && !dataError && healthData?.status !== 'success' && !healthData && currentUser && (
             <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
               <HeartPulse className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
               <p className="text-muted-foreground text-center text-sm">Initializing health data feed...</p>
             </div>
           )}

          <div className="mt-3 pt-2.5 border-t border-primary/10 text-center">
            <p className="text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5">
              <Smartphone size={13} />
              <span>Apple Health data via Google Fit sync on iPhone.</span>
            </p>
          </div>
        </>
      )}
    </WidgetCard>
  );
};

export default HealthDataWidget;

