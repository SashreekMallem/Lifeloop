'use server';
/**
 * @fileOverview Provides weather forecast information by fetching real-time data
 * from Open-Meteo API and using an LLM for interpretation and recommendations.
 * - getWeatherForecast - A function that returns weather forecast data.
 * - WeatherForecastInput - The input type for the getWeatherForecast function.
 * - WeatherForecastOutput - The return type for the getWeatherForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherForecastInputSchema = z.object({
  location: z.string().describe('The city and country (e.g., "London, UK", "Tokyo, Japan") OR "latitude,longitude" (e.g., "34.05,-118.24") for which to get the weather forecast.'),
});
export type WeatherForecastInput = z.infer<typeof WeatherForecastInputSchema>;

const WeatherForecastOutputSchema = z.object({
  locationName: z.string().describe("The name of the location for the forecast."),
  temperature: z.string().describe('The current temperature in Celsius (e.g., "22°C").'),
  condition: z.string().describe('A brief description of the weather condition (e.g., "Sunny with scattered clouds", "Light rain showers").'),
  icon: z.enum(["Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudLightning", "Wind", "Thermometer", "AlertTriangle"]).describe('A string representing the most appropriate Lucide icon name for the weather condition (Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer, AlertTriangle).'),
  humidity: z.string().describe('The current humidity percentage (e.g., "65%").'),
  wind: z.string().describe('The current wind speed and direction (e.g., "15 km/h NW", or just "15 km/h" if direction is unavailable).'),
  recommendation: z.string().describe('A brief recommendation based on the weather (e.g., "Perfect day for a walk!", "Grab an umbrella!").'),
});
export type WeatherForecastOutput = z.infer<typeof WeatherForecastOutputSchema>;


const WeatherApiToolOutputSchema = z.object({
  actualLocationName: z.string().describe("The actual name of the location found by the geocoding service or identified via coordinates."),
  latitude: z.number(),
  longitude: z.number(),
  temperature: z.number().describe("Temperature in Celsius."),
  weatherCode: z.number().describe("WMO Weather code."),
  humidity: z.number().describe("Humidity in percent."),
  windSpeed: z.number().describe("Wind speed in km/h."),
});

const getWeatherFromApiTool = ai.defineTool(
  {
    name: 'getWeatherFromApiTool',
    description: 'Fetches real-time weather data for a given location (name or lat,lon string) using Open-Meteo API.',
    inputSchema: z.object({
      location: z.string().describe('The city and optionally state/country (e.g., "Berlin, Germany") OR a "latitude,longitude" string (e.g., "34.0522,-118.2437").'),
    }),
    outputSchema: WeatherApiToolOutputSchema,
  },
  async (input) => {
    let latitude: number;
    let longitude: number;
    let displayLocationName: string = input.location; // Default to input location string

    const latLonMatch = input.location.match(/^(\-?\d+(\.\d+)?),(\-?\d+(\.\d+)?)$/);

    try {
      if (latLonMatch) {
        latitude = parseFloat(latLonMatch[1]);
        longitude = parseFloat(latLonMatch[3]);
        
        // Attempt reverse geocoding to get a name for coordinates
        const reverseGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`;
        const reverseGeoResponse = await fetch(reverseGeoUrl);
        if (reverseGeoResponse.ok) {
          const reverseGeoData = await reverseGeoResponse.json();
          if (reverseGeoData.results && reverseGeoData.results.length > 0) {
            const { name, admin1, country_code } = reverseGeoData.results[0];
            displayLocationName = `${name}${admin1 ? ', ' + admin1 : ''}${country_code ? ', ' + country_code : ''}`;
          } else {
            console.warn(`Reverse geocoding for ${latitude},${longitude} returned no results.`);
            displayLocationName = "Current Location"; // Fallback name
          }
        } else {
          console.warn(`Reverse geocoding API error for ${latitude},${longitude}: ${reverseGeoResponse.status}`);
          displayLocationName = "Current Location (API Error)";
        }
      } else {
        // Geocode location name to get latitude and longitude
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.location)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geocodeUrl);
        if (!geoResponse.ok) {
          console.error(`Geocoding API error for ${input.location}: ${geoResponse.status}`);
          throw new Error(`Failed to geocode location ${input.location}. Status: ${geoResponse.status}`);
        }
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`Location "${input.location}" not found.`);
        }
        
        const geoResult = geoData.results[0];
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
        displayLocationName = `${geoResult.name}${geoResult.admin1 ? ', ' + geoResult.admin1 : ''}${geoResult.country_code ? ', ' + geoResult.country_code : ''}`;
      }

      // Fetch weather data using latitude and longitude
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&format=json`;
      const weatherResponse = await fetch(forecastUrl);
      if (!weatherResponse.ok) {
        console.error(`Weather API error for ${displayLocationName} (coords: ${latitude},${longitude}): ${weatherResponse.status}`);
        throw new Error(`Failed to fetch weather for ${displayLocationName}. Status: ${weatherResponse.status}`);
      }
      const weatherData = await weatherResponse.json();

      if (!weatherData.current) {
        throw new Error(`No current weather data available for ${displayLocationName}.`);
      }

      return {
        actualLocationName: displayLocationName,
        latitude,
        longitude,
        temperature: weatherData.current.temperature_2m,
        weatherCode: weatherData.current.weather_code,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
      };
    } catch (error: any) {
      console.error(`Error in getWeatherFromApiTool for location "${input.location}":`, error);
      throw new Error(`API tool failed for "${input.location}": ${error.message}`);
    }
  }
);

export const getWeatherForecastTool = getWeatherFromApiTool;
export { getWeatherFromApiTool };

const weatherPrompt = ai.definePrompt({
  name: 'weatherForecastPrompt',
  input: {schema: WeatherForecastInputSchema},
  output: {schema: WeatherForecastOutputSchema},
  tools: [getWeatherFromApiTool],
  prompt: `You are a futuristic weather forecasting AI integrated into a Life OS.
Your primary task is to provide a weather forecast based on REAL-TIME data obtained using the 'getWeatherFromApiTool'.

User input location: {{{location}}} (This might be a name or lat,lon coordinates. The tool will resolve it.)

Instructions:
1. ALWAYS use the 'getWeatherFromApiTool' with the user's input 'location' to fetch current weather data.
2. From the tool's output (which includes actualLocationName, temperature, weatherCode, humidity, windSpeed):
    a. Set 'locationName' to the 'actualLocationName' returned by the tool. This is the resolved name of the location.
    b. Format 'temperature' into a string, like "{{temperature}}°C".
    c. Interpret the 'weatherCode' (WMO code) using the table below to determine a concise 'condition' string.
    d. Based on the 'weatherCode' and derived 'condition', select the MOST appropriate 'icon' string from this EXACT list: "Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudLightning", "Wind", "Thermometer", "AlertTriangle".
    e. Format 'humidity' into a string, like "{{humidity}}%".
    f. Format 'windSpeed' into a string like "{{windSpeed}} km/h". If the tool also provided wind direction, you can include it, otherwise, just speed is fine.
    g. Create a 'recommendation': a short, practical, and slightly futuristic recommendation based on ALL the real weather data returned by the tool.

WMO Weather Interpretation Codes (weather_code from tool):
Code | Description
------------ | -------------
0 | Clear sky
1, 2, 3 | Mainly clear, partly cloudy, or overcast
45, 48 | Fog or depositing rime fog
51, 53, 55 | Drizzle: Light, moderate, or dense intensity
56, 57 | Freezing Drizzle: Light or dense intensity
61, 63, 65 | Rain: Slight, moderate, or heavy intensity
66, 67 | Freezing Rain: Light or heavy intensity
71, 73, 75 | Snow fall: Slight, moderate, or heavy intensity
77 | Snow grains
80, 81, 82 | Rain showers: Slight, moderate, or violent
85, 86 | Snow showers: Slight or heavy
95 | Thunderstorm: Slight or moderate
96, 99 | Thunderstorm with slight or heavy hail

For any thunderstorm (codes 95, 96, 99), the icon should be "CloudLightning".
For fog (codes 45, 48), the icon can be "Cloud".
For drizzle/rain (codes 51-57, 61-67, 80-82), use "CloudRain".
For snow (codes 71-77, 85-86), use "CloudSnow".
For clear (code 0), use "Sun".
For partly cloudy/overcast (codes 1-3), use "CloudSun" or "Cloud" as appropriate.
If wind speed is very high and other conditions are mild, "Wind" icon can be considered.
"Thermometer" is a last resort if no other icon fits or data is ambiguous.
If the tool failed or the data seems incomplete, use "AlertTriangle" for the icon and provide a sensible condition like "Forecast data incomplete".

Your response MUST be a JSON object strictly adhering to the WeatherForecastOutputSchema. Ensure all fields are populated.
If the tool fails or cannot find the location, the flow will handle a fallback. Your role is to process successful tool output.
`,
});

const weatherForecastFlow = ai.defineFlow(
  {
    name: 'weatherForecastFlow',
    inputSchema: WeatherForecastInputSchema,
    outputSchema: WeatherForecastOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await weatherPrompt(input);

      if (!output || typeof output !== 'object') {
        console.error("Invalid or missing output from LLM for weather prompt.", {input});
        throw new Error("Invalid or missing output from LLM.");
      }
      const validIcons = WeatherForecastOutputSchema.shape.icon.options;
      if (!output.icon || !validIcons.includes(output.icon as any)) {
        console.warn(`LLM returned invalid icon: ${output.icon}. Defaulting to Thermometer.`, {output});
        return {
          locationName: output.locationName || input.location,
          temperature: output.temperature || "N/A",
          condition: output.condition || "Data processing error",
          icon: "Thermometer",
          humidity: output.humidity || "N/A",
          wind: output.wind || "N/A",
          recommendation: output.recommendation || "Unable to provide recommendation due to data error.",
          ...output, 
          icon: "Thermometer" 
        };
      }
      return output;

    } catch (error: any) {
      console.error(`Error in weatherForecastFlow for location "${input.location}":`, error);
      return {
        locationName: input.location.includes(',') ? "Current Location (Error)" : input.location,
        temperature: "N/A",
        condition: "Forecast unavailable.",
        icon: "AlertTriangle", 
        humidity: "N/A",
        wind: "N/A",
        recommendation: "Atmospheric sensors are currently offline. Please try again later.",
      };
    }
  }
);

export async function getWeatherForecast(input: WeatherForecastInput): Promise<WeatherForecastOutput> {
  return weatherForecastFlow(input);
}
