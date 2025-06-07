
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import {
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind as WindIcon, Thermometer,
  Droplets as HumidityIcon, Loader2, AlertTriangle
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
  Wind: WindIcon, // Renamed to avoid conflict with weatherData.wind
  Thermometer,
};

const WeatherWidget = ({ className, defaultLocation = "San Francisco, CA" }: WeatherWidgetProps) => {
  const [weatherData, setWeatherData] = useState<WeatherForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const input: WeatherForecastInput = { location: defaultLocation };
        const result = await getWeatherForecast(input);
        setWeatherData(result);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError("Failed to retrieve weather data. Atmospheric interference detected.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [defaultLocation]);

  const CurrentWeatherIcon = weatherData?.icon ? iconComponents[weatherData.icon] || Thermometer : Thermometer;

  return (
    <WidgetCard title="Atmospheric Analysis" icon={<CloudSun />} className={className}>
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
          <p className="mt-3 text-sm text-muted-foreground">Scanning weather patterns...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center p-4">
          <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Please stand by for recalibration.</p>
        </div>
      )}
      {!isLoading && !error && weatherData && (
        <div className="flex flex-col items-center text-center group h-full justify-around">
          <div className="mb-2">
            <CurrentWeatherIcon className="h-16 w-16 text-primary group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary-rgb))] transition-all duration-300" />
          </div>
          <p className="text-4xl font-bold text-primary neon-text-primary -mt-1">{weatherData.temperature}</p>
          <p className="text-md text-foreground/80 mt-1 capitalize">{weatherData.condition}</p>
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">{weatherData.locationName}</p>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs w-full max-w-[200px] mx-auto">
            <div className="flex items-center justify-start gap-1.5 text-muted-foreground/80 p-1 rounded-md bg-card/10">
              <HumidityIcon size={13} className="text-primary/60" />
              <span>{weatherData.humidity}</span>
            </div>
            <div className="flex items-center justify-start gap-1.5 text-muted-foreground/80 p-1 rounded-md bg-card/10">
              <WindIcon size={13} className="text-primary/60" />
              <span>{weatherData.wind}</span>
            </div>
          </div>
          <p className="text-xs text-secondary/90 mt-3 italic px-3 leading-tight">{weatherData.recommendation}</p>
        </div>
      )}
      {!isLoading && !error && !weatherData && (
         <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
          <CloudSun className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Weather data feed currently offline.</p>
        </div>
      )}
    </WidgetCard>
  );
};

export default WeatherWidget;
