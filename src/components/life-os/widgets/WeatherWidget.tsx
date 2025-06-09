'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import {
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind as WindIcon, Thermometer,
  Droplets as HumidityIcon, Loader2, AlertTriangle, MapPin, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeatherForecast, type WeatherForecastOutput, type WeatherForecastInput } from '@/ai/flows/weather-forecast-flow';

interface WeatherWidgetProps {
  className?: string;
  defaultLocation?: string;
}

const iconComponents: { [key: string]: React.ElementType } = {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind: WindIcon,
  Thermometer,
  AlertTriangle,
};

const WeatherWidget = ({ className, defaultLocation = "New York, NY" }: WeatherWidgetProps) => {
  const [weatherData, setWeatherData] = useState<WeatherForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationToFetch, setLocationToFetch] = useState(defaultLocation);
  const [currentLocationForDisplay, setCurrentLocationForDisplay] = useState(defaultLocation);
  const [usingGeoLocation, setUsingGeoLocation] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationToFetch(`${latitude},${longitude}`);
          setCurrentLocationForDisplay("Your Current Location"); 
          setUsingGeoLocation(true);
        },
        (geoError) => {
          console.warn("Geolocation error:", geoError.message, ". Using default location:", defaultLocation);
          setLocationToFetch(defaultLocation);
          setCurrentLocationForDisplay(defaultLocation);
          setUsingGeoLocation(false);
          setError(`Geolocation failed: ${geoError.message}. Showing weather for ${defaultLocation}.`);
        }
      );
    } else {
      console.warn("Geolocation not supported. Using default location:", defaultLocation);
      setLocationToFetch(defaultLocation);
      setCurrentLocationForDisplay(defaultLocation);
      setUsingGeoLocation(false);
    }
  }, [defaultLocation]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!locationToFetch) return;
      setIsLoading(true);
      // Clear previous weather-specific error, but keep geolocation error if it exists
      if (!error?.startsWith("Geolocation failed")) {
        setError(null);
      }

      try {
        const input: WeatherForecastInput = { location: locationToFetch };
        const result = await getWeatherForecast(input);
        setWeatherData(result);
        if (result && result.locationName) {
          setCurrentLocationForDisplay(result.locationName);
        } else if (locationToFetch.includes(',')) {
           setCurrentLocationForDisplay(prev => prev === "Your Current Location" ? prev : "Near your location");
        } else {
          setCurrentLocationForDisplay(locationToFetch);
        }
      } catch (err: any) {
        console.error("Error fetching weather data in widget:", err);
        const weatherError = err.message || "Failed to retrieve weather data. Atmospheric interference detected.";
        setError(prevError => prevError?.startsWith("Geolocation failed") ? `${prevError} ${weatherError}`: weatherError);
        setWeatherData(null); 
        setCurrentLocationForDisplay(locationToFetch.includes(',') ? "Current Location (Error)" : locationToFetch);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationToFetch]); 

  const handleRefresh = async () => {
    if (!locationToFetch) return;
    setIsLoading(true);
    // Clear previous weather-specific error, but keep geolocation error if it exists
    if (!error?.startsWith("Geolocation failed")) {
      setError(null);
    }

    try {
      const input: WeatherForecastInput = { location: locationToFetch };
      const result = await getWeatherForecast(input);
      setWeatherData(result);
      if (result && result.locationName) {
        setCurrentLocationForDisplay(result.locationName);
      } else if (locationToFetch.includes(',')) {
         setCurrentLocationForDisplay(prev => prev === "Your Current Location" ? prev : "Near your location");
      } else {
        setCurrentLocationForDisplay(locationToFetch);
      }
    } catch (err: any) {
      console.error("Error fetching weather data in widget:", err);
      const weatherError = err.message || "Failed to retrieve weather data. Atmospheric interference detected.";
      setError(prevError => prevError?.startsWith("Geolocation failed") ? `${prevError} ${weatherError}`: weatherError);
      setWeatherData(null); 
      setCurrentLocationForDisplay(locationToFetch.includes(',') ? "Current Location (Error)" : locationToFetch);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentWeatherIcon = weatherData?.icon ? (iconComponents[weatherData.icon] || Thermometer) : Thermometer;
  const LocationStatusIcon = usingGeoLocation ? <MapPin size={12} className="text-green-400 inline-block mr-1" /> : <AlertTriangle size={12} className="text-yellow-400 inline-block mr-1" />;

  return (
    <WidgetCard
      title="Atmospheric Analysis"
      icon={isLoading && !error ? <Loader2 className="h-5 w-5 animate-spin text-primary opacity-70" /> : <CurrentWeatherIcon className="h-5 w-5 text-primary opacity-90" />}
      className={className}
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
        <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
          <p className="mt-3 text-sm text-muted-foreground">Scanning weather patterns for {currentLocationForDisplay}...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center p-4">
          <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-sm text-destructive-foreground bg-destructive/80 p-2 rounded-md">{error}</p>
        </div>
      )}
      {!isLoading && !error && weatherData && (
        <div className="flex flex-col items-center text-center group h-full justify-center space-y-1.5 py-2">
          <div className="flex-shrink-0">
            <CurrentWeatherIcon className="h-10 w-10 text-primary group-hover:scale-105 transition-all duration-300" />
          </div>
          <p className="text-xl font-bold text-primary flex-shrink-0">{weatherData.temperature || "N/A"}</p>
          <p className="text-sm text-foreground/80 capitalize flex-shrink-0">{weatherData.condition || "N/A"}</p>
          <p className="text-xs text-muted-foreground/80 uppercase tracking-wider px-2 truncate flex items-center justify-center flex-shrink-0" title={currentLocationForDisplay}>
             {LocationStatusIcon} {weatherData.locationName || currentLocationForDisplay || "N/A"}
          </p>

          <div className="grid grid-cols-2 gap-1.5 text-xs w-full max-w-[140px] mx-auto flex-shrink-0">
            <div className="flex items-center justify-center gap-1 text-muted-foreground/80 p-1 rounded-md">
              <HumidityIcon size={11} className="text-primary/70" />
              <span className="font-medium text-xs">{weatherData.humidity || "N/A"}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground/80 p-1 rounded-md">
              <WindIcon size={11} className="text-primary/70" />
              <span className="font-medium truncate text-xs" title={weatherData.wind}>{weatherData.wind || "N/A"}</span>
            </div>
          </div>
          
          {weatherData.recommendation && (
            <p className="text-xs text-secondary/90 italic px-2 leading-tight max-h-[40px] overflow-y-auto scrollbar-thin flex-grow">
              {weatherData.recommendation}
            </p>
          )}
        </div>
      )}
      {!isLoading && !error && !weatherData && (
         <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
          <CloudSun className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Weather data feed currently unavailable for {currentLocationForDisplay}.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export default WeatherWidget;
