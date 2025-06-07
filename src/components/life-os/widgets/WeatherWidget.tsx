
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import {
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind as WindIcon, Thermometer,
  Droplets as HumidityIcon, Loader2, AlertTriangle // Added AlertTriangle
} from "lucide-react";
import { getWeatherForecast, type WeatherForecastOutput, type WeatherForecastInput } from '@/ai/flows/weather-forecast-flow';

interface WeatherWidgetProps {
  className?: string;
  defaultLocation?: string;
}

// Map icon names from AI to actual Lucide components
const iconComponents: { [key: string]: React.ElementType } = {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind: WindIcon,
  Thermometer,
  AlertTriangle, // Make sure to handle this if AI/flow can return it
};

const WeatherWidget = ({ className, defaultLocation = "San Francisco, CA" }: WeatherWidgetProps) => {
  const [weatherData, setWeatherData] = useState<WeatherForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocationForDisplay, setCurrentLocationForDisplay] = useState(defaultLocation);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const input: WeatherForecastInput = { location: defaultLocation };
        const result = await getWeatherForecast(input);
        setWeatherData(result);
        // Update location for display if the flow returns a more specific one
        if (result && result.locationName) {
            setCurrentLocationForDisplay(result.locationName);
        } else {
            setCurrentLocationForDisplay(defaultLocation);
        }
      } catch (err: any) {
        console.error("Error fetching weather data in widget:", err);
        setError(err.message || "Failed to retrieve weather data. Atmospheric interference detected.");
        setWeatherData(null); // Clear previous data on error
        setCurrentLocationForDisplay(defaultLocation); // Reset location display
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [defaultLocation]);

  const CurrentWeatherIcon = weatherData?.icon ? (iconComponents[weatherData.icon] || Thermometer) : Thermometer;

  return (
    <WidgetCard 
      title="Atmospheric Analysis" 
      icon={isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary opacity-70" /> : <CurrentWeatherIcon className="h-5 w-5 text-primary opacity-90" />} 
      className={className}
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
          <p className="mt-3 text-sm text-muted-foreground">Scanning weather patterns for {defaultLocation}...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center p-4">
          <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-sm text-destructive-foreground bg-destructive/80 p-2 rounded-md">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">Location: {defaultLocation}. Please stand by for recalibration or try a different location if this persists.</p>
        </div>
      )}
      {!isLoading && !error && weatherData && (
        <div className="flex flex-col items-center text-center group h-full justify-around">
          <div className="mb-1">
            <CurrentWeatherIcon className="h-14 w-14 text-primary group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary-rgb))] transition-all duration-300" />
          </div>
          <p className="text-3xl font-bold text-primary neon-text-primary -mt-1">{weatherData.temperature}</p>
          <p className="text-base text-foreground/80 capitalize">{weatherData.condition}</p>
          <p className="text-xs text-muted-foreground/80 uppercase tracking-wider px-2 truncate" title={currentLocationForDisplay}>{currentLocationForDisplay}</p>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs w-full max-w-[180px] mx-auto">
            <div className="flex items-center justify-start gap-1 text-muted-foreground/80 p-1 rounded-md glassmorphic_ text-card/10_">
              <HumidityIcon size={12} className="text-primary/70" />
              <span className="font-medium">{weatherData.humidity}</span>
            </div>
            <div className="flex items-center justify-start gap-1 text-muted-foreground/80 p-1 rounded-md glassmorphic_ text_card/10_">
              <WindIcon size={12} className="text-primary/70" />
              <span className="font-medium truncate" title={weatherData.wind}>{weatherData.wind}</span>
            </div>
          </div>
          <p className="text-xs text-secondary/90 mt-2 italic px-2 leading-tight max-h-[40px] overflow-y-auto scrollbar-thin">
            {weatherData.recommendation}
          </p>
        </div>
      )}
      {/* Fallback for when there's no loading, no error, but also no weatherData (e.g. initial state or unexpected issue) */}
      {!isLoading && !error && !weatherData && (
         <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
          <CloudSun className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Weather data feed currently unavailable for {defaultLocation}.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export default WeatherWidget;


    