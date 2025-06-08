
'use client';

import React, { useState, useEffect } from 'react';
import WidgetCard from "./WidgetCard";
import {
  Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind as WindIcon, Thermometer,
  Droplets as HumidityIcon, Loader2, AlertTriangle, MapPin
} from "lucide-react";
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


  const CurrentWeatherIcon = weatherData?.icon ? (iconComponents[weatherData.icon] || Thermometer) : Thermometer;
  const LocationStatusIcon = usingGeoLocation ? <MapPin size={12} className="text-green-400 inline-block mr-1" /> : <AlertTriangle size={12} className="text-yellow-400 inline-block mr-1" />;

  return (
    <WidgetCard
      title="Atmospheric Analysis"
      icon={isLoading && !error ? <Loader2 className="h-5 w-5 animate-spin text-primary opacity-70" /> : <CurrentWeatherIcon className="h-5 w-5 text-primary opacity-90" />}
      className={className}
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
        <div className="flex flex-col items-center text-center group h-full justify-around">
          <div className="mb-1">
            <CurrentWeatherIcon className="h-14 w-14 text-primary group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary-rgb))] transition-all duration-300" />
          </div>
          <p className="text-3xl font-bold text-primary neon-text-primary -mt-1">{weatherData.temperature || "N/A"}</p>
          <p className="text-base text-foreground/80 capitalize">{weatherData.condition || "N/A"}</p>
          <p className="text-xs text-muted-foreground/80 uppercase tracking-wider px-2 truncate flex items-center justify-center" title={currentLocationForDisplay}>
             {LocationStatusIcon} {weatherData.locationName || currentLocationForDisplay || "N/A"}
          </p>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs w-full max-w-[180px] mx-auto">
            <div className="flex items-center justify-start gap-1 text-muted-foreground/80 p-1 rounded-md">
              <HumidityIcon size={12} className="text-primary/70" />
              <span className="font-medium">{weatherData.humidity || "N/A"}</span>
            </div>
            <div className="flex items-center justify-start gap-1 text-muted-foreground/80 p-1 rounded-md">
              <WindIcon size={12} className="text-primary/70" />
              <span className="font-medium truncate" title={weatherData.wind}>{weatherData.wind || "N/A"}</span>
            </div>
          </div>
          <p className="text-xs text-secondary/90 mt-2 italic px-2 leading-tight max-h-[40px] overflow-y-auto scrollbar-thin">
            {weatherData.recommendation || "No recommendation available."}
          </p>
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
