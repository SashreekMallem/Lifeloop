'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { 
  Music, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Shuffle, 
  Repeat,
  Volume2,
  Loader2,
  RefreshCw,
  UserCircle,
  LogOut,
  Clock,
  User,
  Disc,
  List,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppleMusicData, type AppleMusicInput, type AppleMusicOutput, type Track } from '@/ai/flows/apple-music-flow';
import { app } from '@/lib/firebase/client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { authManager } from '@/lib/auth-manager';

interface AppleMusicWidgetProps {
  className?: string;
}

const auth = getAuth(app);

const AppleMusicWidget = ({ className }: AppleMusicWidgetProps) => {
  const [musicData, setMusicData] = useState<AppleMusicOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (user) {
        fetchMusicData();
      }
    });
    
    return () => unsubscribe();
  }, []);

  const fetchMusicData = async () => {
    setIsLoadingData(true);
    setDataError(null);
    
    try {
      const musicToken = authManager.getToken('applemusic');

      const musicInput: AppleMusicInput = {
        oauthToken: musicToken || undefined,
        includeCurrentlyPlaying: true,
        includeRecentlyPlayed: true,
        includeRecommendations: true,
        includeLibrary: false,
        limit: 10
      };

      const result = await getAppleMusicData(musicInput);
      setMusicData(result);

      if (result.status === 'requires_authentication') {
        setDataError('Apple Music authentication required. Please connect your Apple ID.');
      } else if (result.status === 'error') {
        setDataError(result.error || 'Failed to fetch Apple Music data');
      }
    } catch (err) {
      console.error("Error fetching Apple Music data:", err);
      setDataError("Failed to load Apple Music data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSignInAppleMusic = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Note: Apple Music requires Apple ID sign-in, not Google
      // This is a placeholder - real implementation would use Apple's Sign in with Apple
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        authManager.storeToken('applemusic', credential.accessToken, result.user.uid);
        setCurrentUser(result.user);
        fetchMusicData();
      }
    } catch (error: any) {
      console.error("Apple Music sign-in error:", error);
      setAuthError(`Authentication failed: ${error.message}`);
    }
  };

  const handleSignOutAppleMusic = async () => {
    try {
      await signOut(auth);
      authManager.removeToken('applemusic');
      setCurrentUser(null);
      setMusicData(null);
    } catch (error: any) {
      console.error("Apple Music sign-out error:", error);
      setAuthError(`Sign out failed: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    fetchMusicData();
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPlayTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getQuickActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'learn-musickit': return <Music size={16} className="text-blue-500" />;
      case 'try-spotify': return <Music size={16} className="text-green-500" />;
      default: return <Music size={16} className="text-gray-500" />;
    }
  };

  return (
    <WidgetCard 
      title="Apple Music // Now Playing" 
      icon={<Music />} 
      className={className}
      showHeader={true}
      headerActions={
        currentUser && (
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary"
            disabled={isLoadingData}
          >
            <RefreshCw size={14} className={`mr-1 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )
      }
    >
      {isLoadingAuth && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Initializing Apple Music connection...</p>
        </div>
      )}

      {!isLoadingAuth && !currentUser && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <Music className="h-10 w-10 text-primary mb-3" />
          <p className="text-muted-foreground mb-4">Connect Apple Music to see your currently playing music and recent tracks.</p>
          <Button onClick={handleSignInAppleMusic} className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <UserCircle className="mr-2" /> Connect Apple Music
          </Button>
          {authError && <p className="text-destructive mt-3 text-sm">{authError}</p>}
        </div>
      )}

      {!isLoadingAuth && currentUser && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-green-600 truncate max-w-[calc(100%-170px)]" title={`Apple Music Connected: ${currentUser.displayName || currentUser.email || "User"}`}>
              Connected: {currentUser.displayName || currentUser.email}
            </p>
            <div className="flex items-center gap-1">
              <Button onClick={handleSignOutAppleMusic} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive flex-shrink-0">
                <LogOut size={14} className="mr-1" /> Disconnect
              </Button>
            </div>
          </div>
          {authError && <p className="text-destructive text-sm mb-2">{authError}</p>}

          {isLoadingData && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading Apple Music data...</p>
            </div>
          )}

          {!isLoadingData && dataError && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive text-sm p-2 bg-destructive/10 rounded-md whitespace-pre-line">
                {dataError}
              </p>
              {(dataError.includes("authentication") || dataError.includes("required")) &&
                <Button onClick={handleSignInAppleMusic} variant="link" className="mt-2 text-sm text-primary">
                  Re-authenticate Apple Music
                </Button>
              }
            </div>
          )}

          {!isLoadingData && !dataError && musicData?.status === 'success' && (
            <div className="space-y-4">
              {/* Currently Playing */}
              {musicData.currentlyPlaying && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      {musicData.currentlyPlaying.albumArt ? (
                        <img 
                          src={musicData.currentlyPlaying.albumArt} 
                          alt={musicData.currentlyPlaying.album}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Disc size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {musicData.currentlyPlaying.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {musicData.currentlyPlaying.artist}
                      </p>
                      <p className="text-xs text-muted-foreground/80 truncate">
                        {musicData.currentlyPlaying.album}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {musicData.currentlyPlaying.isPlaying ? (
                        <Pause size={16} className="text-primary" />
                      ) : (
                        <Play size={16} className="text-muted-foreground" />
                      )}
                      {musicData.currentlyPlaying.isLiked && (
                        <Heart size={14} className="text-red-500 fill-current" />
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {musicData.currentlyPlaying.duration && musicData.currentlyPlaying.playbackPosition && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{formatDuration(musicData.currentlyPlaying.playbackPosition)}</span>
                        <span>{formatDuration(musicData.currentlyPlaying.duration)}</span>
                      </div>
                      <div className="w-full bg-primary/10 rounded-full h-1">
                        <div 
                          className="bg-primary h-1 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(musicData.currentlyPlaying.playbackPosition / musicData.currentlyPlaying.duration) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Listening Stats */}
              {musicData.listeningStats && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 rounded-lg bg-card/5 border border-primary/10">
                    <p className="text-lg font-bold text-primary">{musicData.listeningStats.songsPlayed}</p>
                    <p className="text-xs text-muted-foreground">Songs</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-card/5 border border-green-200">
                    <p className="text-lg font-bold text-green-600">{formatPlayTime(musicData.listeningStats.totalPlayTime)}</p>
                    <p className="text-xs text-muted-foreground">Listen Time</p>
                  </div>
                </div>
              )}

              {/* Recently Played */}
              {musicData.recentlyPlayed && musicData.recentlyPlayed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Played</p>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                    {musicData.recentlyPlayed.slice(0, 4).map((track, index) => (
                      <div key={`${track.id}-${index}`} className="flex items-center space-x-3 p-2 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          {track.albumArt ? (
                            <img 
                              src={track.albumArt} 
                              alt={track.album}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Music size={12} className="text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground/90 truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        {track.duration && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDuration(track.duration)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {musicData.quickActions && musicData.quickActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</p>
                  <div className="grid grid-cols-1 gap-2">
                    {musicData.quickActions.slice(0, 2).map((action) => (
                      <button
                        key={action.id}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors text-left"
                        title={action.description}
                      >
                        {getQuickActionIcon(action.id)}
                        <span className="text-xs font-medium text-foreground/90">{action.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Stats */}
              {musicData.listeningStats && (
                <div className="pt-2 border-t border-primary/10">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <User size={12} className="text-blue-500" />
                      <span className="text-muted-foreground truncate">Top Artist:</span>
                    </div>
                    <span className="text-foreground/90 font-medium truncate">{musicData.listeningStats.topArtist}</span>
                    <div className="flex items-center space-x-2">
                      <Music size={12} className="text-purple-500" />
                      <span className="text-muted-foreground truncate">Top Genre:</span>
                    </div>
                    <span className="text-foreground/90 font-medium truncate">{musicData.listeningStats.topGenre}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoadingData && !dataError && musicData?.status === 'success' && !musicData.currentlyPlaying && (!musicData.recentlyPlayed || musicData.recentlyPlayed.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Music className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">No music activity found. Start playing music in Apple Music!</p>
            </div>
          )}

          {!isLoadingData && !dataError && !musicData && currentUser && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Music className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <p className="text-muted-foreground text-center text-sm">Initializing Apple Music feed...</p>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
};

export default AppleMusicWidget;
