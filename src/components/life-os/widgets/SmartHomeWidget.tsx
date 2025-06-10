'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import { 
  Home, 
  Lightbulb, 
  Thermometer, 
  Camera, 
  Power, 
  Volume2, 
  Lock, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  UserCircle,
  LogOut,
  Shield,
  Moon,
  Sun,
  Play,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSmartHomeData, type SmartHomeInput, type SmartHomeOutput, type SmartDevice } from '@/ai/flows/smart-home-flow';
import { app } from '@/lib/firebase/client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { authManager } from '@/lib/auth-manager';

interface SmartHomeWidgetProps {
  className?: string;
}

const auth = getAuth(app);

const SmartHomeWidget = ({ className }: SmartHomeWidgetProps) => {
  const [smartHomeData, setSmartHomeData] = useState<SmartHomeOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (user) {
        fetchSmartHomeData();
      }
    });
    
    return () => unsubscribe();
  }, []);

  const fetchSmartHomeData = async () => {
    setIsLoadingData(true);
    setDataError(null);
    
    try {
      const smartHomeToken = authManager.getToken('smarthome');
      const currentUser = authManager.getCurrentUser();

      const smartHomeInput: SmartHomeInput = {
        oauthToken: smartHomeToken || undefined,
        deviceTypes: ['light', 'thermostat', 'camera', 'switch', 'sensor', 'speaker'],
        includeStatus: true,
        includeControls: true
      };

      const result = await getSmartHomeData(smartHomeInput);
      setSmartHomeData(result);

      if (result.status === 'requires_authentication') {
        setDataError('Smart Home authentication required. Please connect your Google account.');
      } else if (result.status === 'error') {
        setDataError(result.error || 'Failed to fetch smart home data');
      }
    } catch (err) {
      console.error("Error fetching smart home data:", err);
      setDataError("Failed to load smart home data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSignInSmartHome = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/homegraph');
      provider.addScope('https://www.googleapis.com/auth/assistant-sdk-prototype');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        authManager.storeToken('smarthome', credential.accessToken, result.user.uid);
        setCurrentUser(result.user);
        fetchSmartHomeData();
      }
    } catch (error: any) {
      console.error("Smart Home sign-in error:", error);
      setAuthError(`Authentication failed: ${error.message}`);
    }
  };

  const handleSignOutSmartHome = async () => {
    try {
      await signOut(auth);
      authManager.removeToken('smarthome');
      setCurrentUser(null);
      setSmartHomeData(null);
    } catch (error: any) {
      console.error("Smart Home sign-out error:", error);
      setAuthError(`Sign out failed: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    fetchSmartHomeData();
  };

  const getDeviceIcon = (device: SmartDevice) => {
    switch (device.type) {
      case 'light': return <Lightbulb size={16} className={device.state?.on ? 'text-yellow-500' : 'text-gray-400'} />;
      case 'thermostat': return <Thermometer size={16} className="text-blue-500" />;
      case 'camera': return <Camera size={16} className="text-purple-500" />;
      case 'switch': return <Power size={16} className={device.state?.on ? 'text-green-500' : 'text-gray-400'} />;
      case 'speaker': return <Volume2 size={16} className="text-orange-500" />;
      case 'lock': return <Lock size={16} className={device.state?.locked ? 'text-red-500' : 'text-green-500'} />;
      default: return <Home size={16} className="text-gray-500" />;
    }
  };

  const getStatusIcon = (status: SmartDevice['status']) => {
    switch (status) {
      case 'online': return <Wifi size={14} className="text-green-500" />;
      case 'offline': return <WifiOff size={14} className="text-red-500" />;
      case 'error': return <AlertTriangle size={14} className="text-yellow-500" />;
      default: return <WifiOff size={14} className="text-gray-400" />;
    }
  };

  const getQuickActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'goodnight': return <Moon size={16} className="text-indigo-500" />;
      case 'away': return <Shield size={16} className="text-red-500" />;
      case 'movie': return <Play size={16} className="text-purple-500" />;
      case 'morning': return <Sun size={16} className="text-yellow-500" />;
      default: return <Home size={16} className="text-gray-500" />;
    }
  };

  return (
    <WidgetCard 
      title="Smart Home Control // Device Status" 
      icon={<Home />} 
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
          <p className="mt-2 text-muted-foreground">Initializing smart home connection...</p>
        </div>
      )}

      {!isLoadingAuth && !currentUser && (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
          <Home className="h-10 w-10 text-primary mb-3" />
          <p className="text-muted-foreground mb-4">Connect Google Smart Home to control your devices and view status.</p>
          <Button onClick={handleSignInSmartHome} className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <UserCircle className="mr-2" /> Connect Smart Home
          </Button>
          {authError && <p className="text-destructive mt-3 text-sm">{authError}</p>}
        </div>
      )}

      {!isLoadingAuth && currentUser && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-green-600 truncate max-w-[calc(100%-170px)]" title={`Smart Home Connected: ${currentUser.displayName || currentUser.email || "User"}`}>
              Connected: {currentUser.displayName || currentUser.email}
            </p>
            <div className="flex items-center gap-1">
              <Button onClick={handleSignOutSmartHome} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive flex-shrink-0">
                <LogOut size={14} className="mr-1" /> Disconnect
              </Button>
            </div>
          </div>
          {authError && <p className="text-destructive text-sm mb-2">{authError}</p>}

          {isLoadingData && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading smart home devices...</p>
            </div>
          )}

          {!isLoadingData && dataError && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive text-sm p-2 bg-destructive/10 rounded-md">
                {dataError}
              </p>
              {(dataError.includes("authentication") || dataError.includes("required")) &&
                <Button onClick={handleSignInSmartHome} variant="link" className="mt-2 text-sm text-primary">
                  Re-authenticate Smart Home
                </Button>
              }
            </div>
          )}

          {!isLoadingData && !dataError && smartHomeData?.status === 'success' && smartHomeData.devices && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-card/5 border border-primary/10">
                  <p className="text-lg font-bold text-primary">{smartHomeData.totalDevices}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-card/5 border border-green-200">
                  <p className="text-lg font-bold text-green-600">{smartHomeData.onlineDevices}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-card/5 border border-red-200">
                  <p className="text-lg font-bold text-red-600">{smartHomeData.offlineDevices}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>

              {/* Devices List */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                {smartHomeData.devices.slice(0, 6).map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-2 rounded-lg bg-card/5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getDeviceIcon(device)}
                        {getStatusIcon(device.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground/90">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.room} • {device.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {device.state?.temperature && (
                        <p className="text-xs font-medium text-blue-600">
                          {device.state.temperature}°F
                        </p>
                      )}
                      {device.state?.brightness && (
                        <p className="text-xs font-medium text-yellow-600">
                          {device.state.brightness}%
                        </p>
                      )}
                      {device.state?.volume && (
                        <p className="text-xs font-medium text-orange-600">
                          Vol: {device.state.volume}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              {smartHomeData.quickActions && smartHomeData.quickActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {smartHomeData.quickActions.slice(0, 4).map((action) => (
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

              {/* Energy Usage */}
              {smartHomeData.energyUsage && (
                <div className="pt-2 border-t border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap size={14} className="text-yellow-500" />
                      <span className="text-xs font-medium text-muted-foreground">Energy Today</span>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {smartHomeData.energyUsage.today} {smartHomeData.energyUsage.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoadingData && !dataError && smartHomeData?.status === 'success' && (!smartHomeData.devices || smartHomeData.devices.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Home className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">No smart home devices found. Check your Google Smart Home setup.</p>
            </div>
          )}

          {!isLoadingData && !dataError && !smartHomeData && currentUser && (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
              <Home className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <p className="text-muted-foreground text-center text-sm">Initializing smart home data feed...</p>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
};

export default SmartHomeWidget;
