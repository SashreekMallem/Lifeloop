import { z } from 'zod';
import { flow } from '@genkit-ai/flow';

// Input schema for smart home data
const SmartHomeInputSchema = z.object({
  oauthToken: z.string().optional(),
  deviceTypes: z.array(z.string()).optional().default(['light', 'thermostat', 'camera', 'switch', 'sensor']),
  includeStatus: z.boolean().optional().default(true),
  includeControls: z.boolean().optional().default(true)
});

// Device schema
const SmartDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['light', 'thermostat', 'camera', 'switch', 'sensor', 'speaker', 'display', 'doorbell', 'lock', 'vacuum']),
  room: z.string().optional(),
  status: z.enum(['online', 'offline', 'error']),
  state: z.object({
    on: z.boolean().optional(),
    brightness: z.number().min(0).max(100).optional(),
    color: z.string().optional(),
    temperature: z.number().optional(),
    targetTemperature: z.number().optional(),
    humidity: z.number().optional(),
    volume: z.number().min(0).max(100).optional(),
    locked: z.boolean().optional(),
    battery: z.number().min(0).max(100).optional(),
    motion: z.boolean().optional(),
    doorOpen: z.boolean().optional()
  }).optional(),
  lastUpdated: z.string(),
  capabilities: z.array(z.string()).optional()
});

// Output schema
const SmartHomeOutputSchema = z.object({
  status: z.enum(['success', 'requires_authentication', 'error']),
  devices: z.array(SmartDeviceSchema).optional(),
  totalDevices: z.number().optional(),
  onlineDevices: z.number().optional(),
  offlineDevices: z.number().optional(),
  rooms: z.array(z.string()).optional(),
  quickActions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string()
  })).optional(),
  energyUsage: z.object({
    current: z.number(),
    today: z.number(),
    thisMonth: z.number(),
    unit: z.string()
  }).optional(),
  recommendations: z.array(z.string()).optional(),
  error: z.string().optional()
});

export type SmartHomeInput = z.infer<typeof SmartHomeInputSchema>;
export type SmartHomeOutput = z.infer<typeof SmartHomeOutputSchema>;
export type SmartDevice = z.infer<typeof SmartDeviceSchema>;

// Mock smart home data for development
const generateMockSmartHomeData = (): SmartHomeOutput => {
  const mockDevices: SmartDevice[] = [
    {
      id: 'living-room-lights',
      name: 'Living Room Lights',
      type: 'light',
      room: 'Living Room',
      status: 'online',
      state: {
        on: true,
        brightness: 75,
        color: '#FFB366'
      },
      lastUpdated: new Date().toISOString(),
      capabilities: ['on_off', 'brightness', 'color_setting']
    },
    {
      id: 'main-thermostat',
      name: 'Main Thermostat',
      type: 'thermostat',
      room: 'Hallway',
      status: 'online',
      state: {
        temperature: 72,
        targetTemperature: 70,
        humidity: 45
      },
      lastUpdated: new Date().toISOString(),
      capabilities: ['temperature_control', 'humidity_sensing']
    },
    {
      id: 'front-door-camera',
      name: 'Front Door Camera',
      type: 'camera',
      room: 'Entrance',
      status: 'online',
      state: {
        motion: false,
        battery: 85
      },
      lastUpdated: new Date().toISOString(),
      capabilities: ['motion_detection', 'video_streaming']
    },
    {
      id: 'kitchen-speaker',
      name: 'Kitchen Speaker',
      type: 'speaker',
      room: 'Kitchen',
      status: 'online',
      state: {
        on: true,
        volume: 30
      },
      lastUpdated: new Date().toISOString(),
      capabilities: ['volume_control', 'media_playback']
    },
    {
      id: 'bedroom-switch',
      name: 'Bedroom Fan',
      type: 'switch',
      room: 'Bedroom',
      status: 'online',
      state: {
        on: false
      },
      lastUpdated: new Date().toISOString(),
      capabilities: ['on_off']
    },
    {
      id: 'garage-door',
      name: 'Garage Door',
      type: 'sensor',
      room: 'Garage',
      status: 'online',
      state: {
        doorOpen: false
      },
      lastUpdated: new Date().toISOString(),
      capabilities: ['door_sensing']
    }
  ];

  const onlineDevices = mockDevices.filter(d => d.status === 'online').length;
  const rooms = [...new Set(mockDevices.map(d => d.room).filter((room): room is string => Boolean(room)))];

  return {
    status: 'success' as const,
    devices: mockDevices,
    totalDevices: mockDevices.length,
    onlineDevices,
    offlineDevices: mockDevices.length - onlineDevices,
    rooms,
    quickActions: [
      {
        id: 'goodnight',
        name: 'Good Night',
        description: 'Turn off all lights, lock doors, set thermostat to sleep mode',
        icon: 'Moon'
      },
      {
        id: 'away',
        name: 'Away Mode',
        description: 'Activate security, adjust temperature, turn off non-essential devices',
        icon: 'Shield'
      },
      {
        id: 'movie',
        name: 'Movie Mode',
        description: 'Dim lights, adjust temperature, prepare entertainment system',
        icon: 'Play'
      },
      {
        id: 'morning',
        name: 'Good Morning',
        description: 'Turn on lights, adjust thermostat, start morning routine',
        icon: 'Sun'
      }
    ],
    energyUsage: {
      current: 2.4,
      today: 18.6,
      thisMonth: 542,
      unit: 'kWh'
    },
    recommendations: [
      'Consider dimming living room lights to save energy',
      'Thermostat is set 2°F higher than usual for this time of day',
      'Front door camera battery is at 85% - no action needed'
    ]
  };
};

// Real Google Smart Home API integration
const fetchGoogleSmartHomeData = async (token: string, input: SmartHomeInput): Promise<SmartHomeOutput> => {
  try {
    // Google Smart Home API endpoint
    const response = await fetch('https://homegraph.googleapis.com/v1/devices:query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: `smarthome-${Date.now()}`,
        inputs: [{
          intent: 'action.devices.QUERY',
          payload: {
            devices: [
              // Query all devices - in real implementation, you'd specify device IDs
            ]
          }
        }]
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          status: 'requires_authentication' as const,
          error: 'Google Smart Home authentication required'
        };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Google Smart Home API response to our format
    const devices: SmartDevice[] = [];
    
    if (data.payload && data.payload.devices) {
      Object.entries(data.payload.devices).forEach(([deviceId, deviceData]: [string, any]) => {
        const device: SmartDevice = {
          id: deviceId,
          name: deviceData.nickname || deviceData.name || deviceId,
          type: mapGoogleDeviceType(deviceData.type),
          room: deviceData.roomHint,
          status: deviceData.online ? 'online' : 'offline',
          state: extractDeviceState(deviceData),
          lastUpdated: new Date().toISOString(),
          capabilities: deviceData.traits || []
        };
        devices.push(device);
      });
    }

    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const rooms = [...new Set(devices.map(d => d.room).filter((room): room is string => Boolean(room)))];

    return {
      status: 'success' as const,
      devices,
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices: devices.length - onlineDevices,
      rooms,
      quickActions: [
        {
          id: 'goodnight',
          name: 'Good Night',
          description: 'Turn off all lights, lock doors, set thermostat to sleep mode',
          icon: 'Moon'
        },
        {
          id: 'away',
          name: 'Away Mode',
          description: 'Activate security, adjust temperature, turn off non-essential devices',
          icon: 'Shield'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching Google Smart Home data:', error);
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Failed to fetch smart home data'
    };
  }
};

// Helper function to map Google device types to our types
const mapGoogleDeviceType = (googleType: string): SmartDevice['type'] => {
  const typeMap: Record<string, SmartDevice['type']> = {
    'action.devices.types.LIGHT': 'light',
    'action.devices.types.THERMOSTAT': 'thermostat',
    'action.devices.types.CAMERA': 'camera',
    'action.devices.types.SWITCH': 'switch',
    'action.devices.types.SPEAKER': 'speaker',
    'action.devices.types.DISPLAY': 'display',
    'action.devices.types.DOORBELL': 'doorbell',
    'action.devices.types.LOCK': 'lock',
    'action.devices.types.VACUUM': 'vacuum'
  };
  
  return typeMap[googleType] || 'sensor';
};

// Helper function to extract device state from Google response
const extractDeviceState = (deviceData: any) => {
  const state: SmartDevice['state'] = {};
  
  if (deviceData.on !== undefined) state.on = deviceData.on;
  if (deviceData.brightness !== undefined) state.brightness = deviceData.brightness;
  if (deviceData.color !== undefined) state.color = deviceData.color.spectrumRgb?.toString(16);
  if (deviceData.thermostatTemperatureAmbient !== undefined) state.temperature = deviceData.thermostatTemperatureAmbient;
  if (deviceData.thermostatTemperatureSetpoint !== undefined) state.targetTemperature = deviceData.thermostatTemperatureSetpoint;
  if (deviceData.currentVolume !== undefined) state.volume = deviceData.currentVolume;
  if (deviceData.isLocked !== undefined) state.locked = deviceData.isLocked;
  
  return state;
};

// Main flow
export async function getSmartHomeData(input: SmartHomeInput): Promise<SmartHomeOutput> {
  console.log('[Smart Home Flow] Starting with input:', input);

  // If no OAuth token provided, return mock data for development
  if (!input.oauthToken) {
    console.log('[Smart Home Flow] No OAuth token provided, returning mock data');
    return generateMockSmartHomeData();
  }

  try {
    // Attempt to fetch real data from Google Smart Home API
    const result = await fetchGoogleSmartHomeData(input.oauthToken, input);
    console.log('[Smart Home Flow] Successfully fetched smart home data');
    return result;
  } catch (error) {
    console.error('[Smart Home Flow] Error:', error);
    
    // Fall back to mock data if API fails
    console.log('[Smart Home Flow] Falling back to mock data due to error');
    return generateMockSmartHomeData();
  }
}
