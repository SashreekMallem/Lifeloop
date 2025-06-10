import { z } from 'zod';

// Input schema for Apple Music data
const AppleMusicInputSchema = z.object({
  oauthToken: z.string().optional(),
  includeCurrentlyPlaying: z.boolean().optional().default(true),
  includeRecentlyPlayed: z.boolean().optional().default(true),
  includeRecommendations: z.boolean().optional().default(true),
  includeLibrary: z.boolean().optional().default(false),
  limit: z.number().min(1).max(50).optional().default(20)
});

// Track schema
const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
  album: z.string(),
  albumArt: z.string().optional(),
  duration: z.number().optional(), // in milliseconds
  playbackPosition: z.number().optional(), // current position in milliseconds
  isPlaying: z.boolean().optional(),
  isLiked: z.boolean().optional(),
  genre: z.string().optional(),
  releaseDate: z.string().optional(),
  playCount: z.number().optional()
});

// Playlist schema
const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  trackCount: z.number(),
  artwork: z.string().optional(),
  isPublic: z.boolean().optional(),
  lastModified: z.string().optional()
});

// Output schema
const AppleMusicOutputSchema = z.object({
  status: z.enum(['success', 'requires_authentication', 'error']),
  currentlyPlaying: TrackSchema.optional(),
  recentlyPlayed: z.array(TrackSchema).optional(),
  recommendations: z.array(TrackSchema).optional(),
  topPlaylists: z.array(PlaylistSchema).optional(),
  listeningStats: z.object({
    totalPlayTime: z.number(), // in minutes
    songsPlayed: z.number(),
    topGenre: z.string(),
    topArtist: z.string()
  }).optional(),
  quickActions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string()
  })).optional(),
  error: z.string().optional()
});

export type AppleMusicInput = z.infer<typeof AppleMusicInputSchema>;
export type AppleMusicOutput = z.infer<typeof AppleMusicOutputSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;

// Apple Music API integration
const fetchAppleMusicData = async (token: string, input: AppleMusicInput): Promise<AppleMusicOutput> => {
  try {
    // Apple Music API requires MusicKit JS or server-side integration
    // For web apps, we need to use MusicKit JS which requires Apple Developer account
    
    // Note: Apple Music API is more complex than other APIs as it requires:
    // 1. Apple Developer account
    // 2. MusicKit identifier
    // 3. Private key for JWT tokens
    // 4. User must have Apple Music subscription
    
    return {
      status: 'error' as const,
      error: 'Apple Music integration requires MusicKit JS setup. This needs:\n\n1. Apple Developer account\n2. MusicKit identifier\n3. Music subscription\n4. JWT token generation\n\nFor immediate music integration, consider Spotify Web API instead.',
      quickActions: [
        {
          id: 'learn-musickit',
          name: 'MusicKit Guide',
          description: 'Learn about Apple MusicKit setup',
          icon: 'ExternalLink'
        },
        {
          id: 'try-spotify',
          name: 'Try Spotify',
          description: 'Use Spotify Web API instead',
          icon: 'Music'
        }
      ]
    };

  } catch (error) {
    console.error('Error with Apple Music integration:', error);
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Apple Music integration error'
    };
  }
};

// Main flow
export async function getAppleMusicData(input: AppleMusicInput): Promise<AppleMusicOutput> {
  console.log('[Apple Music Flow] Starting with input:', input);

  // Check for OAuth token
  if (!input.oauthToken) {
    console.log('[Apple Music Flow] No OAuth token provided, authentication required');
    return {
      status: 'requires_authentication' as const,
      error: 'Apple Music authentication required. Please connect your Apple ID and ensure you have an active Apple Music subscription.'
    };
  }

  try {
    // Fetch data from Apple Music API
    const result = await fetchAppleMusicData(input.oauthToken, input);
    console.log('[Apple Music Flow] Apple Music integration called');
    return result;
  } catch (error) {
    console.error('[Apple Music Flow] Error:', error);
    
    return {
      status: 'error' as const,
      error: `Failed to fetch Apple Music data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
