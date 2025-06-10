'use client';

import React, { useState, useEffect, useRef } from 'react';
import WidgetCard from "./WidgetCard";
import { Mail, MailOpen, AlertCircle, UserCircle, LogOut, RefreshCw, Loader2, Link, Clock, UserIcon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmailSummary, type EmailSummaryInput, type EmailSummaryOutput } from '@/ai/flows/email-data-flow';
import { app } from '@/lib/firebase/client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { authManager } from '@/lib/auth-manager';

interface EmailWidgetProps {
  className?: string;
}

const auth = getAuth(app);

const EmailWidget = ({ className }: EmailWidgetProps) => {
  const [emailData, setEmailData] = useState<EmailSummaryOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const authStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEmailDataWithToken = async (userId?: string, token?: string) => {
    console.log("[EmailWidget] Attempting to fetch email data for userId:", userId, "with token:", token ? "present" : "absent");

    if (!userId || !token) {
      setDataError("User not signed in or OAuth token unavailable for Gmail.");
      setEmailData(null);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    setDataError(null);
    try {
      const input: EmailSummaryInput = { oauthToken: token };
      const result = await getEmailSummary(input);
      
      if (result.status === "success") {
        setEmailData(result);
      } else if (result.status === "requires_authentication") {
        setDataError(result.message || "Gmail authentication required. Please re-authenticate.");
        setEmailData(null);
      } else { // error status
        setDataError(result.errorMessage || "Failed to fetch email data from Gmail.");
        setEmailData(null);
      }
    } catch (err: any) {
      console.error("Error fetching email data in widget:", err);
      
      // Check if it's a scope-related error
      if (err.message && (err.message.includes('Insufficient Permission') || err.message.includes('gmail.readonly'))) {
        setDataError("Gmail access permissions are insufficient. Please re-authenticate with updated permissions.");
        // Clear the invalid token
        authManager.removeToken('email');
      } else {
        setDataError(err.message || "Client-side error during email data fetch.");
      }
      setEmailData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = async () => {
    if (currentUser) {
      const token = authManager.getToken('email');
      if (token) {
        await fetchEmailDataWithToken(currentUser.uid, token);
      }
    }
  };

  useEffect(() => {
    // Set up auth state monitoring through centralized manager
    const unsubscribeAuthManager = authManager.onAuthStateChange((user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      
      if (user) {
        const token = authManager.getToken('email');
        
        if (token) {
          fetchEmailDataWithToken(user.uid, token);
        } else {
          console.log("[EmailWidget] No email token found for user:", user.uid);
          setDataError("Gmail OAuth token not found. Please connect or re-authenticate.");
          setEmailData(null);
        }
      } else {
        setDataError("User not signed in to view email data.");
        setEmailData(null);
        authManager.clearAllTokens();
      }
    });
    
    return () => {
      unsubscribeAuthManager();
      if (authStateTimeoutRef.current) clearTimeout(authStateTimeoutRef.current);
    };
  }, []);

  const handleSignInGmail = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setDataError(null);
    setEmailData(null); 
    const provider = new GoogleAuthProvider();
    // Use gmail.readonly scope which includes metadata access and allows search queries
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        const token = credential.accessToken;
        // Store token using centralized auth manager
        authManager.storeToken('email', token, result.user.uid);
        // The auth state change listener will handle fetching data
      } else {
        throw new Error("No access token received from Google Sign-In for Gmail.");
      }
    } catch (error: any) {
      console.error("Error during Gmail sign-in:", error);
      setAuthError(error.message || "Failed to sign in with Google for Gmail access.");
      // Clear any partial tokens on error
      authManager.removeToken('email');
      setIsLoadingAuth(false);
    }
  };

  const handleSignOutGmail = async () => {
    setAuthError(null);
    setDataError(null);
    setEmailData(null);
    
    // Clear tokens through auth manager
    authManager.removeToken('email');
    
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null and update emailData.
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      setAuthError(error.message || "Failed to sign out.");
    }
  };

  // Format time helper
  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays}d ago`;
      } else if (diffHours > 0) {
        return `${diffHours}h ago`;
      } else {
        return 'Just now';
      }
    } catch {
      return 'Recently';
    }
  };

  return (
    <WidgetCard title="Comm Hub // Email Intel (Gmail)" icon={<Mail />} className={className}>
      {isLoadingAuth && ( 
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Authenticating for Gmail...</p>
        </div>
      )}

      {!isLoadingAuth && !currentUser && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <Link className="h-10 w-10 text-primary mb-3" />
          <p className="text-muted-foreground mb-4">Connect Gmail to view your email summary, unread count, and actionable items.</p>
          <Button onClick={handleSignInGmail} className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <UserCircle className="mr-2" /> Connect Gmail
          </Button>
          {authError && <p className="text-destructive mt-3 text-sm">{authError}</p>}
        </div>
      )}

      {!isLoadingAuth && currentUser && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-green-600 truncate max-w-[calc(100%-170px)]" title={`Gmail Connected: ${currentUser.displayName || currentUser.email || "User"}`}>
              Gmail Connected: {currentUser.displayName || currentUser.email}
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
              <Button onClick={handleSignOutGmail} variant="ghost" size="sm" className="text-gray-600 hover:text-red-600 flex-shrink-0">
                <LogOut size={14} className="mr-1" /> Disconnect
              </Button>
            </div>
          </div>
          {authError && <p className="text-red-600 text-sm mb-2">{authError}</p>}
          
          {isLoadingData && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading email data...</p>
            </div>
          )}

          {!isLoadingData && dataError && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-red-600 text-sm p-2 bg-red-50 rounded-md">
                {dataError}
              </p>
              {(dataError.includes("OAuth token") || dataError.includes("authentication") || dataError.includes("expired")) &&
                <Button onClick={handleSignInGmail} variant="link" className="mt-2 text-sm text-blue-600">Re-authenticate Gmail</Button>
              }
            </div>
          )}
          
          {!isLoadingData && !dataError && emailData?.status === 'success' && (
            <div className="space-y-4">
              {/* Unread Count & Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glassmorphic p-3 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1">
                    <MailOpen className="text-blue-600" size={20} />
                  </div>
                  <div className="text-lg font-semibold text-foreground">{emailData.unreadCount || 0}</div>
                  <div className="text-xs text-muted-foreground">Unread</div>
                </div>
                
                <div className="glassmorphic p-3 rounded-lg text-center border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="mx-auto h-8 w-8 flex items-center justify-center mb-1">
                    <Zap className="text-orange-500" size={20} />
                  </div>
                  <div className="text-lg font-semibold text-foreground">{emailData.actionableEmails?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Actionable</div>
                </div>
              </div>

              {/* Actionable Emails */}
              {emailData.actionableEmails && emailData.actionableEmails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground/90 flex items-center gap-2">
                    <AlertCircle size={14} className="text-orange-500" />
                    Action Required
                  </h4>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {emailData.actionableEmails.slice(0, 4).map((email, index) => (
                      <div key={email.id || index} className="p-2 rounded-md bg-orange-50/50 border border-orange-200/30 hover:border-orange-300/50 transition-colors">
                        <p className="font-medium text-xs text-foreground/90 truncate">{email.subject}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground truncate flex-1">{email.sender}</p>
                          <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full ml-2 flex-shrink-0">
                            {email.actionType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Emails */}
              {emailData.recentEmails && emailData.recentEmails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground/90 flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    Recent
                  </h4>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {emailData.recentEmails.slice(0, 4).map((email, index) => (
                      <div key={email.id || index} className="p-2 rounded-md bg-card/5 border border-primary/10 hover:border-primary/20 transition-colors">
                        <p className="font-medium text-xs text-foreground/90 truncate">{email.subject}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground truncate flex-1">{email.sender}</p>
                          <span className="text-xs text-muted-foreground/70 flex-shrink-0 ml-2">
                            {formatTimeAgo(email.receivedAt)}
                          </span>
                        </div>
                        {email.snippet && (
                          <p className="text-xs text-muted-foreground/70 mt-1 truncate">{email.snippet.substring(0, 80)}...</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Senders */}
              {emailData.prioritySenders && emailData.prioritySenders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground/90 flex items-center gap-2">
                    <UserIcon size={14} className="text-green-500" />
                    Top Senders
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {emailData.prioritySenders.slice(0, 3).map((sender, index) => (
                      <div key={index} className="px-2 py-1 bg-green-50/50 border border-green-200/30 rounded-full text-xs">
                        <span className="text-foreground/80 truncate max-w-[80px] inline-block">{sender.name}</span>
                        <span className="text-green-600 ml-1">({sender.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoadingData && !dataError && emailData?.status !== 'success' && !emailData && currentUser && (
             <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
               <Mail className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
               <p className="text-muted-foreground text-center text-sm">Initializing email data feed...</p>
             </div>
           )}
        </>
      )}
    </WidgetCard>
  );
};

export default EmailWidget;
