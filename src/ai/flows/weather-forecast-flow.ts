
'use server';
/**
 * @fileOverview Provides weather forecast information.
 * - getWeatherForecast - A function that returns weather forecast data.
 * - WeatherForecastInput - The input type for the getWeatherForecast function.
 * - WeatherForecastOutput - The return type for the getWeatherForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherForecastInputSchema = z.object({
  location: z.string().describe('The city and country for which to get the weather forecast (e.g., "London, UK", "Tokyo, Japan").'),
});
export type WeatherForecastInput = z.infer<typeof WeatherForecastInputSchema>;

const WeatherForecastOutputSchema = z.object({
  locationName: z.string().describe("The name of the location for the forecast."),
  temperature: z.string().describe('The current temperature in Celsius (e.g., "22°C").'),
  condition: z.string().describe('A brief description of the weather condition (e.g., "Sunny with scattered clouds", "Light rain showers").'),
  icon: z.enum(["Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudLightning", "Wind", "Thermometer"]).describe('A string representing the most appropriate Lucide icon name for the weather condition (Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer).'),
  humidity: z.string().describe('The current humidity percentage (e.g., "65%").'),
  wind: z.string().describe('The current wind speed and direction (e.g., "15 km/h NW").'),
  recommendation: z.string().describe('A brief recommendation based on the weather (e.g., "Perfect day for a walk!", "Grab an umbrella!").'),
});
export type WeatherForecastOutput = z.infer<typeof WeatherForecastOutputSchema>;

export async function getWeatherForecast(input: WeatherForecastInput): Promise<WeatherForecastOutput> {
  return weatherForecastFlow(input);
}

const weatherPrompt = ai.definePrompt({
  name: 'weatherForecastPrompt',
  input: {schema: WeatherForecastInputSchema},
  output: {schema: WeatherForecastOutputSchema},
  prompt: `You are a futuristic weather forecasting AI integrated into a life OS. Provide a realistic and detailed weather forecast for the location: {{{location}}}.

  Your response MUST be a JSON object adhering to the output schema.
  Include the following information:
  - locationName: The full name of the location provided in the input.
  - temperature: The current temperature in Celsius (e.g., "22°C").
  - condition: A concise description of the weather condition (e.g., "Clear skies with a light breeze", "Intermittent showers").
  - icon: Select ONLY ONE of the following Lucide icon names that best represents the overall weather condition: "Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudLightning", "Wind", "Thermometer".
  - humidity: The current humidity percentage (e.g., "60%").
  - wind: The current wind speed and direction (e.g., "12 km/h SW").
  - recommendation: A short, practical, and slightly futuristic recommendation related to the weather.

  Example for input "Neo-Tokyo, Sector 7":
  {
    "locationName": "Neo-Tokyo, Sector 7",
    "temperature": "28°C",
    "condition": "Bright and sunny, high UV index",
    "icon": "Sun",
    "humidity": "55%",
    "wind": "5 km/h E",
    "recommendation": "Optimal conditions for solar charging. Engage UV shields if venturing outdoors."
  }
  
  Ensure the icon name is strictly one of the allowed enum values.
  If the location is very generic or nonsensical, provide a forecast for a major world city like "London, UK" or "New York, USA" and set locationName accordingly.
  `,
});

const weatherForecastFlow = ai.defineFlow(
  {
    name: 'weatherForecastFlow',
    inputSchema: WeatherForecastInputSchema,
    outputSchema: WeatherForecastOutputSchema,
  },
  async (input) => {
    const {output} = await weatherPrompt(input);
    
    // Fallback mechanism for invalid or missing output
    const validIcons = WeatherForecastOutputSchema.shape.icon.options;
    if (!output || typeof output !== 'object' || !validIcons.includes(output.icon as any)) {
      const defaultErrorMessage = `Weather data for "${input.location}" is currently experiencing atmospheric distortion.`;
      return {
        locationName: output?.locationName || input.location,
        temperature: output?.temperature || "N/A",
        condition: output?.condition || "Forecast unavailable",
        icon: "Thermometer", // Default safe icon
        humidity: output?.humidity || "N/A",
        wind: output?.wind || "N/A",
        recommendation: output?.recommendation || defaultErrorMessage,
        // Ensure all fields from schema are present, even if with default/error values
        ...(output && typeof output === 'object' ? output : {}), // Spread valid parts of output if any
        icon: "Thermometer" // Explicitly set to default if original was invalid
      };
    }
    return output;
  }
);

